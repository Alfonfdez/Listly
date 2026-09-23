import { and, eq, inArray, ne, sql, type SQL } from 'drizzle-orm';
import { getDrizzle, withTransaction } from '../drizzle/engine';
import { items } from '../drizzle/schema';
import { runResultOf } from '../drizzle/proxy';
import type { Item } from '../types';
import { itemSchema } from '../schemas';
import { parseRowOrNull, parseRows } from '../validate';
import { dbTimestamp } from '../../utils/formatters';
import { deletePhotosOfItems, reorderPositions } from './shared';

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

  async create(data: Omit<Item, 'id' | 'created_at'>): Promise<Item> {
    const db = await getDrizzle();
    const result = await db
      .insert(items)
      .values({
        list_id: data.list_id,
        name: data.name,
        checked: data.checked ?? 0,
        note: data.note ?? null,
        pictures: data.pictures ?? null,
        position: data.position ?? 0,
      })
      .run();
    return { ...data, id: runResultOf(result).lastInsertRowId, created_at: dbTimestamp() };
  },

  async reorder(listId: number, orderedIds: number[]): Promise<void> {
    await reorderPositions(orderedIds, (db, id, i) =>
      db.update(items).set({ position: i }).where(and(eq(items.id, id), eq(items.list_id, listId))).run()
    );
  },

  async update(id: number, data: Partial<Omit<Item, 'id' | 'created_at'>>): Promise<void> {
    const db = await getDrizzle();
    const set: Partial<typeof items.$inferInsert> = {};
    if (data.name !== undefined) set.name = data.name;
    if (data.checked !== undefined) set.checked = data.checked;
    if (data.note !== undefined) set.note = data.note;
    if (data.pictures !== undefined) set.pictures = data.pictures;
    if (data.position !== undefined) set.position = data.position;
    if (Object.keys(set).length === 0) return;
    await db.update(items).set(set).where(eq(items.id, id)).run();
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
      .set({ checked: row.checked === 1 ? 0 : 1 })
      .where(eq(items.id, id))
      .run();
  },

  async existsByName(listId: number, name: string, excludeId?: number): Promise<boolean> {
    const db = await getDrizzle();
    const conditions: SQL[] = [eq(items.list_id, listId), sql`LOWER(${items.name}) = LOWER(${name})`];
    if (excludeId !== undefined) conditions.push(ne(items.id, excludeId));
    const rows = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(items)
      .where(and(...conditions))
      .all();
    return (rows[0]?.count ?? 0) > 0;
  },
};