import { and, eq, inArray, ne, sql, type SQL } from 'drizzle-orm';
import { getDrizzle, withTransaction } from '../drizzle/engine';
import { items, lists } from '../drizzle/schema';
import { runResultOf } from '../drizzle/proxy';
import type { Item } from '../types';
import { itemSchema } from '../schemas';
import { parseRowOrNull, parseRows } from '../validate';
import { dbTimestamp } from '../../utils/formatters';
import { deletePhotosOfItems, countRows, reorderPositions, copyItemsInto } from './shared';

export const itemRepo = {
  async listAll(): Promise<Item[]> {
    const db = await getDrizzle();
    const rows = await db.select().from(items).orderBy(items.position, items.id).all();
    return parseRows(itemSchema, 'items', rows);
  },

  async listByList(listId: number): Promise<Item[]> {
    const db = await getDrizzle();
    const rows = await db
      .select()
      .from(items)
      .where(eq(items.list_id, listId))
      .orderBy(items.position)
      .all();
    return parseRows(itemSchema, 'items', rows);
  },

  async get(id: number): Promise<Item | null> {
    const db = await getDrizzle();
    const row = await db.select().from(items).where(eq(items.id, id)).get();
    return parseRowOrNull(itemSchema, 'items', row);
  },

  async create(data: Omit<Item, 'id' | 'created_at' | 'updated_at' | 'amount_minor' | 'quantity'> & {
    amount_minor?: number | null;
    quantity?: number;
  }): Promise<Item> {
    const db = await getDrizzle();
    const amountMinor = data.amount_minor ?? null;
    const quantity = data.quantity ?? 0;
    const result = await db
      .insert(items)
      .values({
        list_id: data.list_id,
        name: data.name,
        checked: data.checked ?? 0,
        note: data.note ?? null,
        pictures: data.pictures ?? null,
        position: data.position ?? 0,
        amount_minor: amountMinor,
        quantity,
      })
      .run();
    return {
      ...data,
      amount_minor: amountMinor,
      quantity,
      id: runResultOf(result).lastInsertRowId,
      created_at: dbTimestamp(),
      updated_at: dbTimestamp(),
    };
  },

  async reorder(listId: number, orderedIds: number[]): Promise<void> {
    await reorderPositions(orderedIds, (db, id, i) =>
      db
        .update(items)
        .set({ position: i, updated_at: dbTimestamp() })
        .where(and(eq(items.id, id), eq(items.list_id, listId)))
        .run()
    );
  },

  async update(id: number, data: Partial<Omit<Item, 'id' | 'created_at'>>): Promise<void> {
    const db = await getDrizzle();
    const set: Partial<typeof items.$inferInsert> = {};
    if (data.name !== undefined) set.name = data.name;
    if (data.checked !== undefined) set.checked = data.checked;
    if (data.note !== undefined) set.note = data.note;
    if (data.pictures !== undefined) set.pictures = data.pictures;
    if (data.amount_minor !== undefined) set.amount_minor = data.amount_minor;
    if (data.quantity !== undefined) set.quantity = data.quantity;
    if (data.position !== undefined) set.position = data.position;
    if (Object.keys(set).length === 0) return;
    await db.update(items).set({ ...set, updated_at: dbTimestamp() }).where(eq(items.id, id)).run();
  },

  async delete(id: number): Promise<void> {
    const db = await getDrizzle();
    const row = await db.select({ pictures: items.pictures }).from(items).where(eq(items.id, id)).get();
    await db.delete(items).where(eq(items.id, id)).run();
    await deletePhotosOfItems(row ? [row] : []);
  },

  async deleteMany(ids: number[]): Promise<void> {
    if (ids.length === 0) return;
    await withTransaction(async db => {
      const rows = await db.select({ pictures: items.pictures }).from(items).where(inArray(items.id, ids)).all();
      await db.delete(items).where(inArray(items.id, ids)).run();
      await deletePhotosOfItems(rows);
    });
  },

  async toggle(id: number): Promise<void> {
    const db = await getDrizzle();
    const row = await db.select({ checked: items.checked }).from(items).where(eq(items.id, id)).get();
    if (!row) return;
    await db
      .update(items)
      .set({ checked: row.checked === 1 ? 0 : 1, updated_at: dbTimestamp() })
      .where(eq(items.id, id))
      .run();
  },

  async setAllChecked(listId: number, checked: boolean): Promise<void> {
    const db = await getDrizzle();
    await db
      .update(items)
      .set({ checked: checked ? 1 : 0, updated_at: dbTimestamp() })
      .where(eq(items.list_id, listId))
      .run();
  },

  async deleteCompleted(listId: number): Promise<void> {
    await withTransaction(async db => {
      const rows = await db
        .select({ pictures: items.pictures })
        .from(items)
        .where(and(eq(items.list_id, listId), eq(items.checked, 1)))
        .all();
      await db
        .delete(items)
        .where(and(eq(items.list_id, listId), eq(items.checked, 1)))
        .run();
      await deletePhotosOfItems(rows);
    });
  },

  async duplicateItems(sourceListId: number, targetListId: number): Promise<void> {
    await withTransaction(async db => {
      await copyItemsInto(db, sourceListId, targetListId);
    });
  },

  async mergeInto(sourceListId: number, targetListId: number): Promise<void> {
    if (sourceListId === targetListId) {
      throw new Error('Cannot merge a list into itself');
    }
    await withTransaction(async db => {
      await copyItemsInto(db, sourceListId, targetListId);
      const sourceRows = await db
        .select({ pictures: items.pictures })
        .from(items)
        .where(eq(items.list_id, sourceListId))
        .all();
      await deletePhotosOfItems(sourceRows);
      await db.delete(lists).where(eq(lists.id, sourceListId)).run();
    });
  },

  async existsByName(listId: number, name: string, excludeId?: number): Promise<boolean> {
    const db = await getDrizzle();
    const conditions: SQL[] = [eq(items.list_id, listId), sql`LOWER(${items.name}) = LOWER(${name})`];
    if (excludeId !== undefined) conditions.push(ne(items.id, excludeId));
    return (await countRows(db, items, conditions)) > 0;
  },
};