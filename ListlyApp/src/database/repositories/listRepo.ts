import { and, eq, inArray, ne, sql, type SQL } from 'drizzle-orm';
import { getDrizzle, withTransaction } from '../drizzle/engine';
import { items, lists } from '../drizzle/schema';
import { runResultOf } from '../drizzle/proxy';
import type { List, ListWithCounts } from '../types';
import { listSchema } from '../schemas';
import { parseRowOrNull, parseRows } from '../validate';
import { dbTimestamp } from '../../utils/formatters';
import { deleteItemPhotos, parseItemPhotos } from '../../utils/itemPhotos';

async function deletePhotosOfItems(listIds: number[]): Promise<void> {
  const db = await getDrizzle();
  const rows = await db
    .select({ pictures: items.pictures })
    .from(items)
    .where(inArray(items.list_id, listIds))
    .all();
  const uris = rows.flatMap(row => parseItemPhotos(row.pictures));
  await deleteItemPhotos(uris);
}

export const listRepo = {
  async list(): Promise<List[]> {
    const db = await getDrizzle();
    const rows = await db.select().from(lists).orderBy(lists.position, lists.id).all();
    return parseRows(listSchema, 'lists', rows);
  },

  async get(id: number): Promise<List | null> {
    const db = await getDrizzle();
    const row = await db.select().from(lists).where(eq(lists.id, id)).get();
    return parseRowOrNull(listSchema, 'lists', row);
  },

  async create(data: Omit<List, 'id' | 'created_at' | 'position'>): Promise<List> {
    const db = await getDrizzle();
    const maxRow = await db
      .select({ m: sql<number>`COALESCE(MAX(${lists.position}), -1) + 1` })
      .from(lists)
      .get();
    const position = maxRow?.m ?? 0;
    const result = await db
      .insert(lists)
      .values({
        name: data.name,
        color: data.color,
        icon: data.icon,
        position,
      })
      .run();
    return { ...data, id: runResultOf(result).lastInsertRowId, created_at: dbTimestamp(), position };
  },

  async reorder(orderedIds: number[]): Promise<void> {
    await withTransaction(async db => {
      for (let i = 0; i < orderedIds.length; i++) {
        await db.update(lists).set({ position: i }).where(eq(lists.id, orderedIds[i])).run();
      }
    });
  },

  async update(id: number, data: Partial<Omit<List, 'id' | 'created_at'>>): Promise<void> {
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
    await deletePhotosOfItems([id]);
  },

  async deleteMany(ids: number[]): Promise<void> {
    if (ids.length === 0) return;
    await withTransaction(async db => {
      for (const id of ids) {
        await db.delete(lists).where(eq(lists.id, id)).run();
      }
    });
    await deletePhotosOfItems(ids);
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
        total: sql<number>`COUNT(${items.id})`,
        completed: sql<number>`COALESCE(SUM(CASE WHEN ${items.checked} = 1 THEN 1 ELSE 0 END), 0)`,
      })
      .from(lists)
      .leftJoin(items, eq(items.list_id, lists.id))
      .groupBy(lists.id)
      .orderBy(lists.position, lists.id)
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