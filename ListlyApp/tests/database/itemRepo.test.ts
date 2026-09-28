import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DatabaseHandle } from '../../src/database/types';
import { initSqlJsOnce, openDatabaseSync, resetMockDatabase } from './sqliteMock';
import { dbTimestamp } from '../../src/utils/formatters';
import type { collectionRepo } from '../../src/database/repositories/collectionRepo';
import type { listRepo } from '../../src/database/repositories/listRepo';
import type { itemRepo } from '../../src/database/repositories/itemRepo';

vi.mock('expo-sqlite', async () => {
  const mod = await import('./sqliteMock');
  return { openDatabaseSync: mod.openDatabaseSync };
});

vi.mock('../../src/utils/itemPhotos', async () => {
  const actual = await vi.importActual<typeof import('../../src/utils/itemPhotos')>('../../src/utils/itemPhotos');
  return {
    ...actual,
    deleteItemPhotos: vi.fn(async () => {}),
    duplicateItemPhotos: vi.fn(async (photos: string[]) => photos.map(p => `copy-of-${p}`)),
  };
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

describe('itemRepo.updated_at', () => {
  let b: Backend;

  beforeAll(async () => {
    await initSqlJsOnce();
  });

  beforeEach(async () => {
    b = await createBackend();
  });

  it('stamps updated_at on create', async () => {
    const list = await b.lists.create({ name: 'A', color: '#22D3EE', icon: 'cart-outline', collection_id: null });
    const item = await b.items.create({ list_id: list.id, name: 'x', checked: 0, note: null, position: 0, pictures: null });
    expect(item.updated_at).toBe(dbTimestamp());
  });

  it('stamps updated_at on update, toggle, reorder and setAllChecked without touching created_at', async () => {
    const list = await b.lists.create({ name: 'A', color: '#22D3EE', icon: 'cart-outline', collection_id: null });
    const a1 = await b.items.create({ list_id: list.id, name: 'a1', checked: 0, note: null, position: 0, pictures: null });
    const a2 = await b.items.create({ list_id: list.id, name: 'a2', checked: 0, note: null, position: 1, pictures: null });

    const db = openDatabaseSync('Listly.db') as unknown as DatabaseHandle;
    await db.runAsync("UPDATE items SET created_at = '2020-01-01 00:00:00' WHERE id = ?", a1.id);

    await b.items.update(a1.id, { name: 'renamed' });
    await b.items.toggle(a1.id);
    await b.items.reorder(list.id, [a2.id, a1.id]);
    await b.items.setAllChecked(list.id, true);

    const items = await b.items.listByList(list.id);
    const first = items.find(i => i.id === a1.id);
    const second = items.find(i => i.id === a2.id);
    expect(first).toBeDefined();
    expect(second).toBeDefined();
    expect(first!.updated_at).toBe(dbTimestamp());
    expect(second!.updated_at).toBe(dbTimestamp());
    expect(first!.created_at).toBe('2020-01-01 00:00:00');
    expect(second!.created_at).toBe(dbTimestamp());
  });
});

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

describe('itemRepo.duplicateItems', () => {
  let b: Backend;

  beforeAll(async () => {
    await initSqlJsOnce();
  });

  beforeEach(async () => {
    b = await createBackend();
  });

  it('appends full-fidelity copies to the target in source position order', async () => {
    const a = await b.lists.create({ name: 'A', color: '#22D3EE', icon: 'cart-outline', collection_id: null });
    const target = await b.lists.create({ name: 'B', color: '#34D399', icon: 'gift-outline', collection_id: null });
    const existing = await b.items.create({
      list_id: target.id,
      name: 'existing',
      checked: 1,
      note: 'keep',
      position: 0,
      pictures: '["photo-existing.jpg"]',
    });
    await b.items.create({ list_id: a.id, name: 'a1', checked: 1, note: 'note-1', position: 0, pictures: '["p1.jpg"]' });
    await b.items.create({ list_id: a.id, name: 'a2', checked: 0, note: null, position: 1, pictures: null });
    await b.items.create({ list_id: a.id, name: 'a3', checked: 0, note: 'note-3', position: 2, pictures: null });

    await b.items.duplicateItems(a.id, target.id);

    const copies = await b.items.listByList(target.id);
    expect(copies.map(i => i.name)).toEqual(['existing', 'a1', 'a2', 'a3']);
    expect(copies.map(i => i.position)).toEqual([0, 1, 2, 3]);
    expect(copies.slice(1).map(i => i.checked)).toEqual([1, 0, 0]);
    expect(copies.slice(1).map(i => i.note)).toEqual(['note-1', null, 'note-3']);
    expect(copies[1].pictures).toBe('["copy-of-p1.jpg"]');
    expect(copies[1].created_at).toBe(dbTimestamp());
    expect(copies[1].updated_at).toBe(dbTimestamp());
    expect(copies.map(i => i.id)).not.toContain(0);
  });

  it('leaves the source list untouched', async () => {
    const { a, a1, a2, a3, b2 } = await seedTwoLists(b);

    await b.items.duplicateItems(a.id, b2.id);

    const source = await b.items.listByList(a.id);
    expect(source.map(i => i.id)).toEqual([a1.id, a2.id, a3.id]);
  });

  it('copies into an empty target starting at position 0', async () => {
    const a = await b.lists.create({ name: 'A', color: '#22D3EE', icon: 'cart-outline', collection_id: null });
    const empty = await b.lists.create({ name: 'Empty', color: '#34D399', icon: 'gift-outline', collection_id: null });
    await b.items.create({ list_id: a.id, name: 'a1', checked: 1, note: null, position: 0, pictures: null });
    await b.items.create({ list_id: a.id, name: 'a2', checked: 0, note: null, position: 1, pictures: null });

    await b.items.duplicateItems(a.id, empty.id);

    const copies = await b.items.listByList(empty.id);
    expect(copies.map(i => i.name)).toEqual(['a1', 'a2']);
    expect(copies.map(i => i.position)).toEqual([0, 1]);
  });

  it('skips source items whose name already exists in the target (case-insensitive)', async () => {
    const a = await b.lists.create({ name: 'A', color: '#22D3EE', icon: 'cart-outline', collection_id: null });
    const target = await b.lists.create({ name: 'B', color: '#34D399', icon: 'gift-outline', collection_id: null });
    const existing = await b.items.create({
      list_id: target.id,
      name: 'A1',
      checked: 1,
      note: 'own-note',
      position: 0,
      pictures: '["own.jpg"]',
    });
    await b.items.create({ list_id: a.id, name: 'a1', checked: 0, note: 'source-note', position: 0, pictures: '["p1.jpg"]' });
    await b.items.create({ list_id: a.id, name: 'a2', checked: 0, note: null, position: 1, pictures: null });
    await b.items.create({ list_id: a.id, name: 'a3', checked: 0, note: 'note-3', position: 2, pictures: null });

    await b.items.duplicateItems(a.id, target.id);

    const copies = await b.items.listByList(target.id);
    expect(copies.map(i => i.name)).toEqual(['A1', 'a2', 'a3']);
    expect(copies.map(i => i.position)).toEqual([0, 1, 2]);
    const original = copies.find(i => i.id === existing.id);
    expect(original).toMatchObject({ checked: 1, note: 'own-note', pictures: '["own.jpg"]' });
    expect(copies.slice(1).map(i => i.note)).toEqual([null, 'note-3']);
    const source = await b.items.listByList(a.id);
    expect(source.map(i => i.name)).toEqual(['a1', 'a2', 'a3']);
  });

  it('does not duplicate repeats inside the source batch', async () => {
    const a = await b.lists.create({ name: 'A', color: '#22D3EE', icon: 'cart-outline', collection_id: null });
    const target = await b.lists.create({ name: 'B', color: '#34D399', icon: 'gift-outline', collection_id: null });
    await b.items.create({ list_id: a.id, name: 'dup', checked: 0, note: null, position: 0, pictures: null });
    await b.items.create({ list_id: a.id, name: 'dup', checked: 0, note: null, position: 1, pictures: null });
    await b.items.create({ list_id: a.id, name: 'a2', checked: 0, note: null, position: 2, pictures: null });

    await b.items.duplicateItems(a.id, target.id);

    const copies = await b.items.listByList(target.id);
    expect(copies.map(i => i.name)).toEqual(['dup', 'a2']);
    expect(copies.map(i => i.position)).toEqual([0, 1]);
  });

  it('rolls back and rejects when the target list does not exist', async () => {
    const { a, a1, a2, a3 } = await seedTwoLists(b);

    await expect(b.items.duplicateItems(a.id, 99999)).rejects.toThrow();

    const source = await b.items.listByList(a.id);
    expect(source.map(i => i.id)).toEqual([a1.id, a2.id, a3.id]);
  });
});

describe('itemRepo.mergeInto', () => {
  let b: Backend;

  beforeAll(async () => {
    await initSqlJsOnce();
  });

  beforeEach(async () => {
    b = await createBackend();
  });

  it('appends full-fidelity copies to the target in source order and deletes the source list', async () => {
    const a = await b.lists.create({ name: 'A', color: '#22D3EE', icon: 'cart-outline', collection_id: null });
    const target = await b.lists.create({ name: 'B', color: '#34D399', icon: 'gift-outline', collection_id: null });
    const existing = await b.items.create({
      list_id: target.id,
      name: 'existing',
      checked: 1,
      note: 'keep',
      position: 0,
      pictures: '["photo-existing.jpg"]',
    });
    await b.items.create({ list_id: a.id, name: 'a1', checked: 1, note: 'note-1', position: 0, pictures: '["p1.jpg"]' });
    await b.items.create({ list_id: a.id, name: 'a2', checked: 0, note: null, position: 1, pictures: null });
    await b.items.create({ list_id: a.id, name: 'a3', checked: 0, note: 'note-3', position: 2, pictures: null });

    await b.items.mergeInto(a.id, target.id);

    const merged = await b.items.listByList(target.id);
    expect(merged.map(i => i.name)).toEqual(['existing', 'a1', 'a2', 'a3']);
    expect(merged.map(i => i.position)).toEqual([0, 1, 2, 3]);
    expect(merged.slice(1).map(i => i.checked)).toEqual([1, 0, 0]);
    expect(merged.slice(1).map(i => i.note)).toEqual(['note-1', null, 'note-3']);
    expect(merged[1].pictures).toBe('["copy-of-p1.jpg"]');
    expect(merged.map(i => i.id)).not.toContain(0);
    expect(merged[0].id).toBe(existing.id);
    expect(await b.lists.get(a.id)).toBeNull();
    expect(await b.items.listByList(a.id)).toEqual([]);
  });

  it('skips source items whose name already exists in the target and never touches the matching target item', async () => {
    const a = await b.lists.create({ name: 'A', color: '#22D3EE', icon: 'cart-outline', collection_id: null });
    const target = await b.lists.create({ name: 'B', color: '#34D399', icon: 'gift-outline', collection_id: null });
    const existing = await b.items.create({
      list_id: target.id,
      name: 'A1',
      checked: 1,
      note: 'own-note',
      position: 0,
      pictures: '["own.jpg"]',
    });
    await b.items.create({ list_id: a.id, name: 'a1', checked: 0, note: 'source-note', position: 0, pictures: null });
    await b.items.create({ list_id: a.id, name: 'a2', checked: 0, note: null, position: 1, pictures: null });
    await b.items.create({ list_id: a.id, name: 'a3', checked: 0, note: 'note-3', position: 2, pictures: null });

    await b.items.mergeInto(a.id, target.id);

    const merged = await b.items.listByList(target.id);
    expect(merged.map(i => i.name)).toEqual(['A1', 'a2', 'a3']);
    const original = merged.find(i => i.id === existing.id);
    expect(original).toMatchObject({ checked: 1, note: 'own-note', pictures: '["own.jpg"]' });
    expect(await b.lists.get(a.id)).toBeNull();
    expect(await b.items.listByList(a.id)).toEqual([]);
  });

  it('deep-copies merged items\' photos and deletes the source\'s originals without touching the target', async () => {
    const photosMod = await import('../../src/utils/itemPhotos');
    const deleteItemPhotos = photosMod.deleteItemPhotos as ReturnType<typeof vi.fn>;
    const duplicateItemPhotos = photosMod.duplicateItemPhotos as ReturnType<typeof vi.fn>;
    deleteItemPhotos.mockClear();
    duplicateItemPhotos.mockClear();
    const a = await b.lists.create({ name: 'A', color: '#22D3EE', icon: 'cart-outline', collection_id: null });
    const target = await b.lists.create({ name: 'B', color: '#34D399', icon: 'gift-outline', collection_id: null });
    const existing = await b.items.create({ list_id: target.id, name: 'dup', checked: 1, note: null, position: 0, pictures: '["own.jpg"]' });
    await b.items.create({ list_id: a.id, name: 'unique', checked: 0, note: null, position: 0, pictures: '["keep.jpg"]' });
    await b.items.create({ list_id: a.id, name: 'dup', checked: 0, note: null, position: 1, pictures: '["skip.jpg"]' });

    await b.items.mergeInto(a.id, target.id);

    const merged = await b.items.listByList(target.id);
    const unique = merged.find(i => i.name === 'unique');
    expect(unique?.pictures).toBe('["copy-of-keep.jpg"]');
    expect(merged.find(i => i.id === existing.id)?.pictures).toBe('["own.jpg"]');

    expect(deleteItemPhotos).toHaveBeenCalledTimes(1);
    const deleted = (deleteItemPhotos.mock.calls as string[][]).flat(2).sort();
    expect(deleted).toEqual(['keep.jpg', 'skip.jpg']);
    expect(deleted).not.toContain('own.jpg');
  });

  it('duplicates item photos when copying items into another list', async () => {
    const photosMod = await import('../../src/utils/itemPhotos');
    const duplicateItemPhotos = photosMod.duplicateItemPhotos as ReturnType<typeof vi.fn>;
    duplicateItemPhotos.mockClear();
    const a = await b.lists.create({ name: 'A', color: '#22D3EE', icon: 'cart-outline', collection_id: null });
    const target = await b.lists.create({ name: 'B', color: '#34D399', icon: 'gift-outline', collection_id: null });
    await b.items.create({ list_id: a.id, name: 'a1', checked: 0, note: null, position: 0, pictures: '["p1.jpg"]' });

    await b.items.duplicateItems(a.id, target.id);

    expect(duplicateItemPhotos).toHaveBeenCalledWith(['p1.jpg']);
    const copies = await b.items.listByList(target.id);
    expect(copies[0].pictures).toBe('["copy-of-p1.jpg"]');
    const source = await b.items.listByList(a.id);
    expect(source[0].pictures).toBe('["p1.jpg"]');
  });

  it('rejects a self-merge', async () => {
    const { a } = await seedTwoLists(b);
    await expect(b.items.mergeInto(a.id, a.id)).rejects.toThrow();
  });

  it('rolls back and rejects when the target list does not exist', async () => {
    const { a, a1, a2, a3 } = await seedTwoLists(b);

    await expect(b.items.mergeInto(a.id, 99999)).rejects.toThrow();

    expect(await b.lists.get(a.id)).not.toBeNull();
    const source = await b.items.listByList(a.id);
    expect(source.map(i => i.id)).toEqual([a1.id, a2.id, a3.id]);
  });

  it('deletes an empty source list without touching the target', async () => {
    const empty = await b.lists.create({ name: 'Empty', color: '#22D3EE', icon: 'cart-outline', collection_id: null });
    const target = await b.lists.create({ name: 'B', color: '#34D399', icon: 'gift-outline', collection_id: null });
    await b.items.create({ list_id: target.id, name: 'existing', checked: 0, note: null, position: 0, pictures: null });

    await b.items.mergeInto(empty.id, target.id);

    expect(await b.lists.get(empty.id)).toBeNull();
    const targetItems = await b.items.listByList(target.id);
    expect(targetItems.map(i => i.name)).toEqual(['existing']);
  });
});