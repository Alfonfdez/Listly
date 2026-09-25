import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DatabaseHandle } from '../../src/database/types';
import { initSqlJsOnce, openDatabaseSync, resetMockDatabase } from './sqliteMock';
import type { collectionRepo } from '../../src/database/repositories/collectionRepo';
import type { listRepo } from '../../src/database/repositories/listRepo';
import type { itemRepo } from '../../src/database/repositories/itemRepo';

vi.mock('expo-sqlite', async () => {
  const mod = await import('./sqliteMock');
  return { openDatabaseSync: mod.openDatabaseSync };
});

await import('expo-sqlite');

type Backend = {
  collections: typeof collectionRepo;
  lists: typeof listRepo;
  items: typeof itemRepo;
};

async function createBackend(): Promise<Backend> {
  vi.resetModules();
  resetMockDatabase();
  const db = openDatabaseSync('Listly.db') as unknown as DatabaseHandle;
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const { createSchema } = await import('../../src/database/migrations/001_initial');
  const { addListPositions } = await import('../../src/database/migrations/003_list_position');
  const { addItemPictures } = await import('../../src/database/migrations/004_item_pictures');
  await createSchema(db);
  await addListPositions(db);
  await addItemPictures(db);

  const { collectionRepo: collections } = await import('../../src/database/repositories/collectionRepo');
  const { listRepo: lists } = await import('../../src/database/repositories/listRepo');
  const { itemRepo: items } = await import('../../src/database/repositories/itemRepo');
  return { collections, lists, items };
}

async function seedCollection(b: Backend): Promise<{ collectionId: number; insideIds: number[]; freeId: number }> {
  const collection = await b.collections.create({ name: 'Shopping', color: '#A855F7', icon: 'folder-outline' });
  const insideA = await b.lists.create({ name: 'Inside A', color: '#22D3EE', icon: 'cart-outline', collection_id: collection.id });
  const insideB = await b.lists.create({ name: 'Inside B', color: '#34D399', icon: 'gift-outline', collection_id: collection.id });
  const free = await b.lists.create({ name: 'Free', color: '#F87171', icon: 'star-outline', collection_id: null });
  return { collectionId: collection.id, insideIds: [insideA.id, insideB.id], freeId: free.id };
}

describe('collectionRepo', () => {
  let b: Backend;

  beforeAll(async () => {
    await initSqlJsOnce();
  });

  beforeEach(async () => {
    b = await createBackend();
  });

  it('deleteMany with move mode unlinks member lists and removes the collections', async () => {
    const { collectionId, insideIds, freeId } = await seedCollection(b);

    await b.collections.deleteMany([collectionId], 'move');

    expect(await b.collections.get(collectionId)).toBeNull();
    for (const id of insideIds) {
      expect((await b.lists.get(id))?.collection_id).toBeNull();
    }
    expect((await b.lists.get(freeId))?.collection_id).toBeNull();
    expect(await b.lists.list()).toHaveLength(3);
  });

  it('deleteMany in cascade mode removes the member lists and their items', async () => {
    const { collectionId, insideIds } = await seedCollection(b);
    const item = await b.items.create({ list_id: insideIds[0], name: 'Milk', checked: 0, note: null, pictures: null, position: 0 });

    await b.collections.deleteMany([collectionId]);

    expect(await b.collections.get(collectionId)).toBeNull();
    for (const id of insideIds) {
      expect(await b.lists.get(id)).toBeNull();
    }
    expect(await b.items.get(item.id)).toBeNull();
    expect(await b.lists.list()).toHaveLength(1);
  });

  it('deleteMany defaults to cascade and leaves other collections untouched', async () => {
    const first = await b.collections.create({ name: 'One', color: '#A855F7', icon: 'folder-outline' });
    await b.lists.create({ name: 'Victim', color: '#22D3EE', icon: 'cart-outline', collection_id: first.id });
    const other = await b.collections.create({ name: 'Two', color: '#34D399', icon: 'gift-outline' });

    await b.collections.deleteMany([first.id]);

    expect(await b.collections.get(first.id)).toBeNull();
    expect(await b.collections.get(other.id)).not.toBeNull();
  });

  it('deleteMany with an empty id list is a no-op even with cascade', async () => {
    const { collectionId } = await seedCollection(b);
    await b.collections.deleteMany([]);

    expect(await b.collections.list()).toHaveLength(1);
    expect(await b.collections.get(collectionId)).not.toBeNull();
  });

  it('deleteMany in move mode does not touch the items of unlinked lists', async () => {
    const { insideIds } = await seedCollection(b);
    const item = await b.items.create({ list_id: insideIds[0], name: 'Milk', checked: 0, note: null, pictures: null, position: 0 });

    const free = await b.collections.create({ name: 'Free', color: '#F87171', icon: 'star-outline' });
    await b.lists.create({ name: 'Free List', color: '#34D399', icon: 'gift-outline', collection_id: free.id });

    await b.collections.deleteMany([free.id], 'move');

    expect(await b.collections.get(free.id)).toBeNull();
    expect(await b.items.get(item.id)).not.toBeNull();
  });

  it('create returns pinned 0', async () => {
    const collection = await b.collections.create({ name: 'New', color: '#A855F7', icon: 'folder-outline' });
    expect(collection.pinned).toBe(0);
  });

  it('setPinned marks a collection and list()/withCounts() order pinned first preserving positions', async () => {
    const one = await b.collections.create({ name: 'One', color: '#A855F7', icon: 'folder-outline' });
    const pinned = await b.collections.create({ name: 'Two', color: '#34D399', icon: 'gift-outline' });
    const three = await b.collections.create({ name: 'Three', color: '#F87171', icon: 'star-outline' });

    await b.collections.setPinned(pinned.id, true);

    expect((await b.collections.get(pinned.id))?.pinned).toBe(1);
    expect((await b.collections.list()).map(c => c.name)).toEqual(['Two', 'One', 'Three']);
    expect((await b.collections.withCounts()).map(c => c.name)).toEqual(['Two', 'One', 'Three']);
  });

  it('setPinned(false) restores position order', async () => {
    const one = await b.collections.create({ name: 'One', color: '#A855F7', icon: 'folder-outline' });
    const pinned = await b.collections.create({ name: 'Two', color: '#34D399', icon: 'gift-outline' });
    const three = await b.collections.create({ name: 'Three', color: '#F87171', icon: 'star-outline' });

    await b.collections.setPinned(pinned.id, true);
    await b.collections.setPinned(pinned.id, false);

    expect((await b.collections.get(pinned.id))?.pinned).toBe(0);
    expect((await b.collections.list()).map(c => c.name)).toEqual(['One', 'Two', 'Three']);
  });
});