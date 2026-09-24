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
  await createSchema(db);

  const { collectionRepo: collections } = await import('../../src/database/repositories/collectionRepo');
  const { listRepo: lists } = await import('../../src/database/repositories/listRepo');
  const { itemRepo: items } = await import('../../src/database/repositories/itemRepo');
  return { collections, lists, items };
}

async function seedTwoLists(b: Backend) {
  const a = await b.lists.create({ name: 'A', color: '#22D3EE', icon: 'cart-outline', collection_id: null });
  const b2 = await b.lists.create({ name: 'B', color: '#34D399', icon: 'gift-outline', collection_id: null });
  const a1 = await b.items.create({ list_id: a.id, name: 'a1', checked: 0, note: null, position: 0, pictures: null });
  const a2 = await b.items.create({ list_id: a.id, name: 'a2', checked: 0, note: null, position: 1, pictures: null });
  const a3 = await b.items.create({ list_id: a.id, name: 'a3', checked: 0, note: null, position: 2, pictures: null });
  const ba1 = await b.items.create({ list_id: b2.id, name: 'ba1', checked: 0, note: null, position: 0, pictures: null });
  return { a, b2, a1, a2, a3, ba1 };
}

describe('itemRepo.setAllChecked', () => {
  let b: Backend;

  beforeAll(async () => {
    await initSqlJsOnce();
  });

  beforeEach(async () => {
    b = await createBackend();
  });

  it('checks all items of the target list leaving other lists untouched', async () => {
    const { a, b2, a1, a2, a3, ba1 } = await seedTwoLists(b);
    await b.items.toggle(a1.id);

    await b.items.setAllChecked(a.id, true);

    const itemsA = await b.items.listByList(a.id);
    expect(itemsA.map(i => i.checked)).toEqual([1, 1, 1]);
    const itemsB = await b.items.listByList(b2.id);
    expect(itemsB.map(i => i.checked)).toEqual([ba1.checked]);
  });

  it('unchecks all items of the target list', async () => {
    const { a, a1, a2, a3 } = await seedTwoLists(b);
    await b.items.setAllChecked(a.id, true);
    await b.items.toggle(a1.id);

    await b.items.setAllChecked(a.id, false);

    const itemsA = await b.items.listByList(a.id);
    expect(itemsA.map(i => i.checked)).toEqual([0, 0, 0]);
    expect(itemsA.map(i => i.id)).toEqual([a1.id, a2.id, a3.id]);
  });
});

describe('itemRepo.deleteCompleted', () => {
  let b: Backend;

  beforeAll(async () => {
    await initSqlJsOnce();
  });

  beforeEach(async () => {
    b = await createBackend();
  });

  it('deletes only completed items of the target list', async () => {
    const { a, b2, a1, a2, a3, ba1 } = await seedTwoLists(b);
    await b.items.toggle(a1.id);
    await b.items.toggle(a3.id);
    await b.items.toggle(ba1.id);

    await b.items.deleteCompleted(a.id);

    const itemsA = await b.items.listByList(a.id);
    expect(itemsA.map(i => i.id)).toEqual([a2.id]);
    const itemsB = await b.items.listByList(b2.id);
    expect(itemsB.map(i => i.id)).toEqual([ba1.id]);
  });

  it('keeps the list and no-op when nothing is completed', async () => {
    const { a, a1, a2, a3 } = await seedTwoLists(b);

    await b.items.deleteCompleted(a.id);

    const itemsA = await b.items.listByList(a.id);
    expect(itemsA.map(i => i.id)).toEqual([a1.id, a2.id, a3.id]);
  });
});