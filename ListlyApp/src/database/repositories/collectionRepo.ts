import { desc, eq, inArray, ne, sql, type SQL } from 'drizzle-orm';
import { read, write } from '../access';
import { collections, items, lists } from '../drizzle/schema';
import { runResultOf } from '../drizzle/proxy';
import type { Collection, CollectionWithCounts } from '../types';
import { collectionSchema } from '../schemas';
import { parseRowOrNull, parseRows } from '../validate';
import { dbTimestamp } from '../../utils/formatters';
import { COLLECTION_DELETE_MODES, type CollectionDeleteMode } from '../../constants/types';
import { countRows, countsSelection, deletePhotosOfItems, picturesOfLists, nextPosition, reorderPositions } from './shared';

type NewCollection = Omit<Collection, 'id' | 'created_at' | 'position' | 'pinned'>;

export const collectionRepo = {
  async list(): Promise<Collection[]> {
    return read(async db => {
      const rows = await db.select().from(collections).orderBy(desc(collections.pinned), collections.position, collections.id).all();
      return parseRows(collectionSchema, 'collections', rows);
    });
  },

  async get(id: number): Promise<Collection | null> {
    return read(async db => {
      const row = await db.select().from(collections).where(eq(collections.id, id)).get();
      return parseRowOrNull(collectionSchema, 'collections', row);
    });
  },

  async create(data: NewCollection): Promise<Collection> {
    return read(async db => {
      const position = await nextPosition(db, collections, collections.position);
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
    });
  },

  async reorder(orderedIds: number[]): Promise<void> {
    await reorderPositions(orderedIds, (db, id, i) =>
      db.update(collections).set({ position: i }).where(eq(collections.id, id)).run()
    );
  },

  // See listRepo.reorderFromDrag — the collections twin (spec 021 "A2").
  async reorderFromDrag(orderedIds: number[], draggedId: number, pin: boolean | null): Promise<void> {
    await write(async db => {
      if (pin !== null) {
        await db.update(collections).set({ pinned: pin ? 1 : 0 }).where(eq(collections.id, draggedId)).run();
      }
      for (let i = 0; i < orderedIds.length; i++) {
        await db.update(collections).set({ position: i }).where(eq(collections.id, orderedIds[i])).run();
      }
    });
  },

  async setPinned(id: number, pinned: boolean): Promise<void> {
    await read(async db => {
      await db.update(collections).set({ pinned: pinned ? 1 : 0 }).where(eq(collections.id, id)).run();
    });
  },

  async update(id: number, data: Partial<Omit<NewCollection, 'id' | 'created_at'>>): Promise<void> {
    await read(async db => {
      const set: Partial<typeof collections.$inferInsert> = {};
      if (data.name !== undefined) set.name = data.name;
      if (data.color !== undefined) set.color = data.color;
      if (data.icon !== undefined) set.icon = data.icon;
      if (Object.keys(set).length === 0) return;
      await db.update(collections).set(set).where(eq(collections.id, id)).run();
    });
  },

  async delete(id: number, mode: CollectionDeleteMode): Promise<void> {
    if (mode === COLLECTION_DELETE_MODES.move) {
      await write(async db => {
        await db.update(lists).set({ collection_id: null }).where(eq(lists.collection_id, id)).run();
        await db.delete(collections).where(eq(collections.id, id)).run();
      });
      return;
    }

    const listIds = await read(async db =>
      (await db.select({ id: lists.id }).from(lists).where(eq(lists.collection_id, id)).all()).map(r => r.id)
    );
    let photos: { pictures: string | null }[] = [];
    await write(async db => {
      photos = await picturesOfLists(db, listIds);
      if (listIds.length > 0) {
        await db.delete(lists).where(inArray(lists.id, listIds)).run();
      }
      await db.delete(collections).where(eq(collections.id, id)).run();
    });
    await deletePhotosOfItems(photos);
  },

  async deleteMany(ids: number[], mode: CollectionDeleteMode = COLLECTION_DELETE_MODES.cascade): Promise<void> {
    if (ids.length === 0) return;
    if (mode === COLLECTION_DELETE_MODES.move) {
      await write(async tx => {
        await tx.update(lists).set({ collection_id: null }).where(inArray(lists.collection_id, ids)).run();
        await tx.delete(collections).where(inArray(collections.id, ids)).run();
      });
      return;
    }

    const listIds = await read(async db =>
      (await db.select({ id: lists.id }).from(lists).where(inArray(lists.collection_id, ids)).all()).map(r => r.id)
    );
    let photos: { pictures: string | null }[] = [];
    await write(async tx => {
      photos = await picturesOfLists(tx, listIds);
      if (listIds.length > 0) {
        await tx.delete(lists).where(inArray(lists.id, listIds)).run();
      }
      await tx.delete(collections).where(inArray(collections.id, ids)).run();
    });
    await deletePhotosOfItems(photos);
  },

  async withCounts(): Promise<CollectionWithCounts[]> {
    return read(async db =>
      await db
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
        .all()
    );
  },

  async existsByName(name: string, excludeId?: number): Promise<boolean> {
    return read(async db => {
      const conditions: SQL[] = [sql`LOWER(${collections.name}) = LOWER(${name})`];
      if (excludeId !== undefined) conditions.push(ne(collections.id, excludeId));
      return (await countRows(db, collections, conditions)) > 0;
    });
  },
};