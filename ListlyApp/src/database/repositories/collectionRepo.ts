import { and, desc, eq, inArray, ne, sql, type SQL } from 'drizzle-orm';
import { getDrizzle, withTransaction } from '../drizzle/engine';
import { collections, items, lists } from '../drizzle/schema';
import { runResultOf } from '../drizzle/proxy';
import type { Collection, CollectionWithCounts } from '../types';
import { collectionSchema } from '../schemas';
import { parseRowOrNull, parseRows } from '../validate';
import { dbTimestamp } from '../../utils/formatters';
import { COLLECTION_DELETE_MODES, type CollectionDeleteMode } from '../../constants/types';
import { countsSelection, deletePhotosOfLists, nextPositionSql, reorderPositions } from './shared';

export type NewCollection = Omit<Collection, 'id' | 'created_at' | 'position' | 'pinned'>;

export const collectionRepo = {
  async list(): Promise<Collection[]> {
    const db = await getDrizzle();
    const rows = await db.select().from(collections).orderBy(desc(collections.pinned), collections.position, collections.id).all();
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
      .select({ m: nextPositionSql(collections.position) })
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
    return { ...data, id: runResultOf(result).lastInsertRowId, created_at: dbTimestamp(), position, pinned: 0 };
  },

  async reorder(orderedIds: number[]): Promise<void> {
    await reorderPositions(orderedIds, (db, id, i) =>
      db.update(collections).set({ position: i }).where(eq(collections.id, id)).run()
    );
  },

  async setPinned(id: number, pinned: boolean): Promise<void> {
    const db = await getDrizzle();
    await db.update(collections).set({ pinned: pinned ? 1 : 0 }).where(eq(collections.id, id)).run();
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

  async delete(id: number, mode: CollectionDeleteMode): Promise<void> {
    if (mode === COLLECTION_DELETE_MODES.move) {
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
    await deletePhotosOfLists(listIds);
  },

  async deleteMany(ids: number[], mode: CollectionDeleteMode = COLLECTION_DELETE_MODES.cascade): Promise<void> {
    if (ids.length === 0) return;
    if (mode === COLLECTION_DELETE_MODES.move) {
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
    await deletePhotosOfLists(listIds);
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
        pinned: collections.pinned,
        ...countsSelection,
      })
      .from(collections)
      .leftJoin(lists, eq(lists.collection_id, collections.id))
      .leftJoin(items, eq(items.list_id, lists.id))
      .groupBy(collections.id)
      .orderBy(desc(collections.pinned), collections.position, collections.id)
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