import { and, eq, inArray, ne, sql, type SQL } from 'drizzle-orm';
import { getDrizzle, withTransaction } from '../drizzle/engine';
import { collections, items, lists } from '../drizzle/schema';
import { runResultOf } from '../drizzle/proxy';
import type { Collection, CollectionWithCounts } from '../types';
import { collectionSchema } from '../schemas';
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

export type NewCollection = Omit<Collection, 'id' | 'created_at' | 'position'>;

export const collectionRepo = {
  async list(): Promise<Collection[]> {
    const db = await getDrizzle();
    const rows = await db.select().from(collections).orderBy(collections.position, collections.id).all();
    return parseRows(collectionSchema, 'collections', rows);
  },

  async get(id: number): Promise<Collection | null> {
    const db = await getDrizzle();
    const row = await db.select().from(collections).where(eq(collections.id, id)).get();
    return parseRowOrNull(collectionSchema, 'collections', row);
  },

  async create(data: NewCollection): Promise<Collection> {
    const db = await getDrizzle();
    const maxRow = await db
      .select({ m: sql<number>`COALESCE(MAX(${collections.position}), -1) + 1` })
      .from(collections)
      .get();
    const position = maxRow?.m ?? 0;
    const result = await db
      .insert(collections)
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
        await db.update(collections).set({ position: i }).where(eq(collections.id, orderedIds[i])).run();
      }
    });
  },

  async update(id: number, data: Partial<Omit<NewCollection, 'id' | 'created_at'>>): Promise<void> {
    const db = await getDrizzle();
    const set: Partial<typeof collections.$inferInsert> = {};
    if (data.name !== undefined) set.name = data.name;
    if (data.color !== undefined) set.color = data.color;
    if (data.icon !== undefined) set.icon = data.icon;
    if (Object.keys(set).length === 0) return;
    await db.update(collections).set(set).where(eq(collections.id, id)).run();
  },

  async delete(id: number, mode: 'move' | 'cascade'): Promise<void> {
    if (mode === 'move') {
      await withTransaction(async db => {
        await db.update(lists).set({ collection_id: null }).where(eq(lists.collection_id, id)).run();
        await db.delete(collections).where(eq(collections.id, id)).run();
      });
      return;
    }

    const db = await getDrizzle();
    const listIds = (await db.select({ id: lists.id }).from(lists).where(eq(lists.collection_id, id)).all()).map(r => r.id);
    await withTransaction(async db => {
      if (listIds.length > 0) {
        await db.delete(lists).where(inArray(lists.id, listIds)).run();
      }
      await db.delete(collections).where(eq(collections.id, id)).run();
    });
    await deletePhotosOfItems(listIds);
  },

  async deleteMany(ids: number[], mode: 'move' | 'cascade' = 'cascade'): Promise<void> {
    if (ids.length === 0) return;
    if (mode === 'move') {
      await withTransaction(async tx => {
        await tx.update(lists).set({ collection_id: null }).where(inArray(lists.collection_id, ids)).run();
        await tx.delete(collections).where(inArray(collections.id, ids)).run();
      });
      return;
    }

    const db = await getDrizzle();
    const listIds = (await db.select({ id: lists.id }).from(lists).where(inArray(lists.collection_id, ids)).all()).map(r => r.id);
    await withTransaction(async tx => {
      if (listIds.length > 0) {
        await tx.delete(lists).where(inArray(lists.id, listIds)).run();
      }
      await tx.delete(collections).where(inArray(collections.id, ids)).run();
    });
    await deletePhotosOfItems(listIds);
  },

  async withCounts(): Promise<CollectionWithCounts[]> {
    const db = await getDrizzle();
    return await db
      .select({
        id: collections.id,
        name: collections.name,
        color: collections.color,
        icon: collections.icon,
        created_at: collections.created_at,
        position: collections.position,
        total: sql<number>`COUNT(${items.id})`,
        completed: sql<number>`COALESCE(SUM(CASE WHEN ${items.checked} = 1 THEN 1 ELSE 0 END), 0)`,
      })
      .from(collections)
      .leftJoin(lists, eq(lists.collection_id, collections.id))
      .leftJoin(items, eq(items.list_id, lists.id))
      .groupBy(collections.id)
      .orderBy(collections.position, collections.id)
      .all();
  },

  async existsByName(name: string, excludeId?: number): Promise<boolean> {
    const db = await getDrizzle();
    const conditions: SQL[] = [sql`LOWER(${collections.name}) = LOWER(${name})`];
    if (excludeId !== undefined) conditions.push(ne(collections.id, excludeId));
    const rows = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(collections)
      .where(and(...conditions))
      .all();
    return (rows[0]?.count ?? 0) > 0;
  },
};