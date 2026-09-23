import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DatabaseHandle } from '../../src/database/types';
import { initSqlJsOnce, openDatabaseSync, resetMockDatabase } from './sqliteMock';
import type { collectionRepo } from '../../src/database/repositories/collectionRepo';
import type { listRepo } from '../../src/database/repositories/listRepo';

vi.mock('expo-sqlite', async () => {
  const mod = await import('./sqliteMock');
  return { openDatabaseSync: mod.openDatabaseSync };
});

await import('expo-sqlite');

type Backend = {
  collections: typeof collectionRepo;
  lists: typeof listRepo;
};

async function createBackend(): Promise<Backend> {
  vi.resetModules();
  resetMockDatabase();
  const db = openDatabaseSync('Listly.db') as unknown as DatabaseHandle;
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const { createSchema } = await import('../../src/database/migrations/001_initial');
  const { addListPositions } = await import('../../src/database/migrations/003_list_position');
  await createSchema(db);
  await addListPositions(db);

  const { collectionRepo: collections } = await import('../../src/database/repositories/collectionRepo');
  const { listRepo: lists } = await import('../../src/database/repositories/listRepo');
  return { collections, lists };
}

async function seedTwoCollections(b: Backend) {
  const a = await b.collections.create({ name: 'A', color: '#A855F7', icon: 'folder-outline' });
  const a1 = await b.lists.create({ name: 'A1', color: '#22D3EE', icon: 'cart-outline', collection_id: a.id });
  const a2 = await b.lists.create({ name: 'A2', color: '#34D399', icon: 'gift-outline', collection_id: a.id });
  const bcol = await b.collections.create({ name: 'B', color: '#F87171', icon: 'star-outline' });
  const free = await b.lists.create({ name: 'Free', color: '#FBBF24', icon: 'rocket-outline', collection_id: null });
  return { a, a1, a2, bcol, free };
}

describe('listRepo.moveToCollection', () => {
  let b: Backend;

  beforeAll(async () => {
    await initSqlJsOnce();
  });

  beforeEach(async () => {
    b = await createBackend();
  });

  it('moves a standalone list into a collection appending it at the end', async () => {
    const { a, a1, a2, free } = await seedTwoCollections(b);
    expect((await b.lists.get(free.id))?.collection_id).toBeNull();

    await b.lists.moveToCollection(free.id, a.id);

    const moved = await b.lists.get(free.id);
    expect(moved?.collection_id).toBe(a.id);
    expect(moved?.position).toBe(2);
    expect((await b.lists.get(a1.id))?.position).toBe(0);
    expect((await b.lists.get(a2.id))?.position).toBe(1);
  });

  it('keeps the free list as the first member when the collection is empty', async () => {
    const { bcol, free } = await seedTwoCollections(b);

    await b.lists.moveToCollection(free.id, bcol.id);

    const moved = await b.lists.get(free.id);
    expect(moved?.collection_id).toBe(bcol.id);
    expect(moved?.position).toBe(0);
  });

  it('moves a list between collections appending it after existing members', async () => {
    const { a, a1, a2, bcol, free } = await seedTwoCollections(b);
    await b.lists.moveToCollection(free.id, bcol.id);

    await b.lists.moveToCollection(a1.id, bcol.id);

    const moved = await b.lists.get(a1.id);
    expect(moved?.collection_id).toBe(bcol.id);
    expect(moved?.position).toBe(1);
    expect((await b.lists.get(free.id))?.position).toBe(0);
    expect((await b.lists.get(a2.id))?.collection_id).toBe(a.id);
    expect((await b.lists.get(a2.id))?.position).toBe(1);
  });

  it('serializes concurrent transactions instead of nesting BEGIN', async () => {
    const { a, a1, a2, free } = await seedTwoCollections(b);

    await Promise.all([
      b.lists.moveToCollection(free.id, a.id),
      b.lists.reorder([a1.id, a2.id, free.id]),
    ]);

    const moved = await b.lists.get(free.id);
    expect(moved?.collection_id).toBe(a.id);
    expect((await b.lists.get(a2.id))?.position).toBe(1);
  });
});

describe('listRepo.removeFromCollection', () => {
  let b: Backend;

  beforeAll(async () => {
    await initSqlJsOnce();
  });

  beforeEach(async () => {
    b = await createBackend();
  });

  it('removes a member from its collection making it a standalone list at the end', async () => {
    const { a, a1, a2, free } = await seedTwoCollections(b);
    await b.lists.moveToCollection(free.id, a.id);
    expect((await b.lists.get(free.id))?.collection_id).toBe(a.id);

    await b.lists.removeFromCollection(a1.id);

    expect((await b.lists.get(a1.id))?.collection_id).toBeNull();
    expect((await b.lists.get(free.id))?.collection_id).toBe(a.id);
    expect((await b.lists.get(free.id))?.position).toBe(2);
    expect((await b.lists.get(a1.id))?.position).toBe(0);
  });

  it('removes the only member of a collection', async () => {
    const { bcol, free } = await seedTwoCollections(b);
    await b.lists.moveToCollection(free.id, bcol.id);

    await b.lists.removeFromCollection(free.id);

    expect((await b.lists.get(free.id))?.collection_id).toBeNull();
    expect((await b.lists.get(free.id))?.position).toBe(0);
  });

it('appends the removed list after existing standalone lists', async () => {
    const { a, a1, a2 } = await seedTwoCollections(b);

    await b.lists.removeFromCollection(a1.id);

    expect((await b.lists.get(a1.id))?.collection_id).toBeNull();
    expect((await b.lists.get(a1.id))?.position).toBe(1);
    expect((await b.lists.get(a2.id))?.collection_id).toBe(a.id);
    expect((await b.lists.get(a2.id))?.position).toBe(1);
  });
});