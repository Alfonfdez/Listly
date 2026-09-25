import { and, desc, eq, ne, sql, type SQL } from 'drizzle-orm';
import { getDrizzle, withTransaction } from '../drizzle/engine';
import { items, lists } from '../drizzle/schema';
import { runResultOf } from '../drizzle/proxy';
import type { List, ListWithCounts } from '../types';
import { listSchema } from '../schemas';
import { parseRowOrNull, parseRows } from '../validate';
import { dbTimestamp } from '../../utils/formatters';
import { countsSelection, deletePhotosOfLists, nextPositionSql, reorderPositions } from './shared';

export type NewList = Omit<List, 'id' | 'created_at' | 'position' | 'pinned' | 'collection_id'> & {
  collection_id?: number | null;
};

export const listRepo = {
  async list(): Promise<List[]> {
    const db = await getDrizzle();
    const rows = await db.select().from(lists).orderBy(desc(lists.pinned), lists.position, lists.id).all();
    return parseRows(listSchema, 'lists', rows);
  },

  async get(id: number): Promise<List | null> {
    const db = await getDrizzle();
    const row = await db.select().from(lists).where(eq(lists.id, id)).get();
    return parseRowOrNull(listSchema, 'lists', row);
  },

  async create(data: NewList): Promise<List> {
    const db = await getDrizzle();
    const collectionId = data.collection_id ?? null;
    const maxRow = await db
      .select({ m: nextPositionSql(lists.position) })
      .from(lists)
      .where(
        collectionId !== null
          ? eq(lists.collection_id, collectionId)
          : sql`${lists.collection_id} IS NULL`
      )
      .get();
    const position = maxRow?.m ?? 0;
    const result = await db
      .insert(lists)
      .values({
        name: data.name,
        color: data.color,
        icon: data.icon,
        collection_id: collectionId,
        position,
      })
      .run();
    return { ...data, collection_id: collectionId, id: runResultOf(result).lastInsertRowId, created_at: dbTimestamp(), position, pinned: 0 };
  },

  async reorder(orderedIds: number[]): Promise<void> {
    await reorderPositions(orderedIds, (db, id, i) =>
      db.update(lists).set({ position: i }).where(eq(lists.id, id)).run()
    );
  },

  async setPinned(id: number, pinned: boolean): Promise<void> {
    const db = await getDrizzle();
    await db.update(lists).set({ pinned: pinned ? 1 : 0 }).where(eq(lists.id, id)).run();
  },

  async moveToCollection(listId: number, collectionId: number): Promise<void> {
    await withTransaction(async db => {
      const maxRow = await db
        .select({ m: nextPositionSql(lists.position) })
        .from(lists)
        .where(eq(lists.collection_id, collectionId))
        .get();
      const position = maxRow?.m ?? 0;
      await db.update(lists).set({ collection_id: collectionId, position }).where(eq(lists.id, listId)).run();
    });
  },

  async removeFromCollection(listId: number): Promise<void> {
    await withTransaction(async db => {
      const maxRow = await db
        .select({ m: nextPositionSql(lists.position) })
        .from(lists)
        .where(sql`${lists.collection_id} IS NULL`)
        .get();
      const position = maxRow?.m ?? 0;
      await db.update(lists).set({ collection_id: null, position }).where(eq(lists.id, listId)).run();
    });
  },

  async update(id: number, data: Partial<Omit<NewList, 'collection_id'>>): Promise<void> {
    const db = await getDrizzle();
    const set: Partial<typeof lists.$inferInsert> = {};
    if (data.name !== undefined) set.name = data.name;
    if (data.color !== undefined) set.color = data.color;
    if (data.icon !== undefined) set.icon = data.icon;
    if (Object.keys(set).length === 0) return;
    await db.update(lists).set(set).where(eq(lists.id, id)).run();
  },

  async delete(id: number): Promise<void> {
    const db = await getDrizzle();
    await db.delete(lists).where(eq(lists.id, id)).run();
    await deletePhotosOfLists([id]);
  },

  async deleteMany(ids: number[]): Promise<void> {
    if (ids.length === 0) return;
    await withTransaction(async db => {
      for (const id of ids) {
        await db.delete(lists).where(eq(lists.id, id)).run();
      }
    });
    await deletePhotosOfLists(ids);
  },

  async withCounts(): Promise<ListWithCounts[]> {
    const db = await getDrizzle();
    return await db
      .select({
        id: lists.id,
        name: lists.name,
        color: lists.color,
        icon: lists.icon,
        created_at: lists.created_at,
        position: lists.position,
        pinned: lists.pinned,
        collection_id: lists.collection_id,
        ...countsSelection,
      })
      .from(lists)
      .leftJoin(items, eq(items.list_id, lists.id))
      .groupBy(lists.id)
      .orderBy(desc(lists.pinned), lists.position, lists.id)
      .all();
  },

  async existsByName(name: string, excludeId?: number): Promise<boolean> {
    const db = await getDrizzle();
    const conditions: SQL[] = [sql`LOWER(${lists.name}) = LOWER(${name})`];
    if (excludeId !== undefined) conditions.push(ne(lists.id, excludeId));
    const rows = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(lists)
      .where(and(...conditions))
      .all();
    return (rows[0]?.count ?? 0) > 0;
  },
};