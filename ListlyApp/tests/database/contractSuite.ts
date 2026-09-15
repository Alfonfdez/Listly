import { describe, it, expect, beforeEach } from 'vitest';
import { DEFAULT_CONFIG } from '../../src/database/configDefaults';
import { LANGUAGES } from '../../src/constants/languages';
import { TEXT_SIZES, THEMES } from '../../src/constants/types';
import type { ContractBackend, NewItem, NewList } from './contractTypes';

function list(name: string, overrides: Partial<NewList> = {}): NewList {
  return {
    name,
    color: '#22D3EE',
    icon: 'cart-outline',
    ...overrides,
  };
}

function item(listId: number, name: string, overrides: Partial<NewItem> = {}): NewItem {
  return {
    list_id: listId,
    name,
    checked: 0,
    note: null,
    pictures: null,
    position: 0,
    ...overrides,
  };
}

export function runContractSuite(
  name: string,
  createBackend: () => Promise<ContractBackend>
): void {
  describe(`contract: ${name}`, () => {
    let backend: ContractBackend;

    beforeEach(async () => {
      backend = await createBackend();
    });

    describe('seed data', () => {
      it('seeds 6 lists ordered by position', async () => {
        const lists = await backend.list.list();
        expect(lists).toHaveLength(6);
        const names = lists.map(l => l.name);
        expect(names).toEqual(['Groceries', 'Work Tasks', 'Reading List', 'Travel Plan', 'Home Chores', 'Fitness']);
        expect(lists.map(l => l.position)).toEqual([0, 1, 2, 3, 4, 5]);
      });

      it('withCounts reports totals and completed items per list', async () => {
        const counts = await backend.list.withCounts();
        const groceries = counts.find(c => c.name === 'Groceries')!;
        expect(groceries.total).toBe(5);
        expect(groceries.completed).toBe(2);
        const reading = counts.find(c => c.name === 'Reading List')!;
        expect(reading.total).toBe(2);
        expect(reading.completed).toBe(1);
      });

      it('items are ordered by position within a list', async () => {
        const items = await backend.item.listByList(1);
        expect(items.map(i => i.name)).toEqual(['Milk', 'Eggs', 'Bread', 'Coffee beans', 'Bananas']);
        expect(items.map(i => i.position)).toEqual([0, 1, 2, 3, 4]);
      });

      it('listAll returns every item across lists', async () => {
        const items = await backend.item.listAll();
        expect(items).toHaveLength(19);
        expect(items.map(i => i.list_id)).toEqual(expect.arrayContaining([1, 2, 3, 4, 5, 6]));
      });

      it('config.get() returns the defaults with no stored rows', async () => {
        expect(await backend.config.get()).toEqual(DEFAULT_CONFIG);
      });
    });

    describe('lists', () => {
      it('creates, reads back and updates a list', async () => {
        const created = await backend.list.create(list('New List', { color: '#F87171', icon: 'star-outline' }));
        expect(await backend.list.get(created.id)).toMatchObject({
          name: 'New List',
          color: '#F87171',
          icon: 'star-outline',
        });
        expect((await backend.list.list()).some(l => l.id === created.id)).toBe(true);

        await backend.list.update(created.id, { name: 'Renamed List' });
        expect((await backend.list.get(created.id))?.name).toBe('Renamed List');
      });

      it('get returns null for a missing list', async () => {
        expect(await backend.list.get(999999)).toBeNull();
      });

      it('create appends an new list at the end of the order', async () => {
        const created = await backend.list.create(list('Appended'));
        expect(created.position).toBe(6);
        const ordered = await backend.list.list();
        expect(ordered[ordered.length - 1].name).toBe('Appended');
        expect(ordered.map(l => l.position)).toEqual([0, 1, 2, 3, 4, 5, 6]);
      });

      it('reorder persists a new order across list() and withCounts()', async () => {
        const ordered = await backend.list.list();
        const ids = ordered.map(l => l.id);
        await backend.list.reorder([...ids].reverse());

        const after = await backend.list.list();
        expect(after.map(l => l.id)).toEqual(ids.reverse());
        expect(after.map(l => l.position)).toEqual([0, 1, 2, 3, 4, 5]);

        const counts = await backend.list.withCounts();
        expect(counts.map(c => c.id)).toEqual(after.map(l => l.id));
      });

      it('existsByName is case-insensitive and respects excludeId', async () => {
        const created = await backend.list.create(list('Hobbies'));
        expect(await backend.list.existsByName('hobbies')).toBe(true);
        expect(await backend.list.existsByName('HOBBIES')).toBe(true);
        expect(await backend.list.existsByName('hobbies', created.id)).toBe(false);
        expect(await backend.list.existsByName('groceries')).toBe(true);
        expect(await backend.list.existsByName('unknown')).toBe(false);
      });

      it('withCounts includes new lists and empty lists with zero totals', async () => {
        const created = await backend.list.create(list('Empty'));
        await backend.item.create(item(created.id, 'Task', { checked: 1 }));
        const row = (await backend.list.withCounts()).find(c => c.id === created.id)!;
        expect(row.total).toBe(1);
        expect(row.completed).toBe(1);

        const empty = await backend.list.create(list('Nothing here'));
        const emptyRow = (await backend.list.withCounts()).find(c => c.id === empty.id)!;
        expect(emptyRow.total).toBe(0);
        expect(emptyRow.completed).toBe(0);
      });

      it('delete removes the list and cascades to its items', async () => {
        const created = await backend.list.create(list('Temp'));
        const item1 = await backend.item.create(item(created.id, 'A'));
        await backend.item.create(item(created.id, 'B'));

        await backend.list.delete(created.id);
        expect(await backend.list.get(created.id)).toBeNull();
        expect(await backend.item.get(item1.id)).toBeNull();
        expect(await backend.item.listByList(created.id)).toEqual([]);
      });

      it('deleteMany removes several lists and their items in one go', async () => {
        const a = await backend.list.create(list('Del A'));
        const b = await backend.list.create(list('Del B'));
        const aItem = await backend.item.create(item(a.id, 'A1'));
        await backend.item.create(item(b.id, 'B1'));

        await backend.list.deleteMany([a.id, b.id]);
        expect(await backend.list.get(a.id)).toBeNull();
        expect(await backend.list.get(b.id)).toBeNull();
        expect(await backend.item.get(aItem.id)).toBeNull();
        expect(await backend.item.listByList(b.id)).toEqual([]);
        expect((await backend.list.list()).some(l => l.id === a.id || l.id === b.id)).toBe(false);
      });

      it('deleteMany with an empty id list is a no-op', async () => {
        const before = await backend.list.list();
        await backend.list.deleteMany([]);
        expect(await backend.list.list()).toHaveLength(before.length);
      });
    });

    describe('items', () => {
      it('creates with defaults and reads back', async () => {
        const created = await backend.item.create(item(1, 'Milk Alt'));
        expect(await backend.item.get(created.id)).toMatchObject({
          list_id: 1,
          name: 'Milk Alt',
          checked: 0,
          note: null,
          position: 0,
        });
      });

      it('updates name, note and checked state', async () => {
        const created = await backend.item.create(item(1, 'Update Me'));
        await backend.item.update(created.id, { name: 'Updated', note: 'note text' });
        expect(await backend.item.get(created.id)).toMatchObject({ name: 'Updated', note: 'note text' });
      });

      it('creates and reads back an item with pictures', async () => {
        const created = await backend.item.create(
          item(1, 'Photo Item', { pictures: JSON.stringify(['data:image/a', 'data:image/b']) })
        );
        const row = await backend.item.get(created.id);
        expect(row?.pictures).toBe(JSON.stringify(['data:image/a', 'data:image/b']));
        expect(JSON.parse(row?.pictures ?? 'null')).toEqual(['data:image/a', 'data:image/b']);
      });

      it('updates pictures and can clear them back to null', async () => {
        const created = await backend.item.create(item(1, 'Photo Edit'));
        await backend.item.update(created.id, { pictures: JSON.stringify(['data:image/one']) });
        expect((await backend.item.get(created.id))?.pictures).toBe(JSON.stringify(['data:image/one']));
        await backend.item.update(created.id, { pictures: null });
        expect((await backend.item.get(created.id))?.pictures).toBeNull();
      });

      it('toggle flips the checked state', async () => {
        const created = await backend.item.create(item(1, 'Toggle Me'));
        expect((await backend.item.get(created.id))?.checked).toBe(0);
        await backend.item.toggle(created.id);
        expect((await backend.item.get(created.id))?.checked).toBe(1);
        await backend.item.toggle(created.id);
        expect((await backend.item.get(created.id))?.checked).toBe(0);
      });

      it('existsByName is scoped to the list and respects excludeId', async () => {
        const created = await backend.item.create(item(1, 'Scoped'));
        expect(await backend.item.existsByName(1, 'scoped')).toBe(true);
        expect(await backend.item.existsByName(1, 'SCOPED')).toBe(true);
        expect(await backend.item.existsByName(2, 'scoped')).toBe(false);
        expect(await backend.item.existsByName(1, 'scoped', created.id)).toBe(false);
        expect(await backend.item.existsByName(1, 'unknown')).toBe(false);
      });

      it('delete removes a single item', async () => {
        const created = await backend.item.create(item(1, 'Delete Me'));
        await backend.item.delete(created.id);
        expect(await backend.item.get(created.id)).toBeNull();
        expect(await backend.item.listByList(1)).toHaveLength(5);
      });

      it('deleteMany removes several items at once', async () => {
        const a = await backend.item.create(item(1, 'Bulk A'));
        const b = await backend.item.create(item(1, 'Bulk B'));
        await backend.item.deleteMany([a.id, b.id]);
        expect(await backend.item.get(a.id)).toBeNull();
        expect(await backend.item.get(b.id)).toBeNull();
        expect(await backend.item.listByList(1)).toHaveLength(5);
      });

      it('deleteMany with an empty id list is a no-op', async () => {
        const before = await backend.item.listAll();
        await backend.item.deleteMany([]);
        expect(await backend.item.listAll()).toHaveLength(before.length);
      });

      it('orderBy position keeps manual ordering after position updates', async () => {
        const a = await backend.item.create(item(1, 'First', { position: 0 }));
        await backend.item.update(a.id, { position: 10 });
        expect((await backend.item.listByList(1)).find(i => i.id === a.id)?.position).toBe(10);
      });
    });

    describe('config', () => {
      it('save persists merged values over defaults', async () => {
        const before = await backend.config.get();
        expect(before.theme).toBe(DEFAULT_CONFIG.theme);

        await backend.config.save({ theme: THEMES.light, textSize: TEXT_SIZES.large });
        const after = await backend.config.get();
        expect(after.theme).toBe(THEMES.light);
        expect(after.textSize).toBe(TEXT_SIZES.large);
        expect(after.language).toBe(LANGUAGES.en);
      });

      it('save with an empty partial is a no-op', async () => {
        await backend.config.save({});
        expect(await backend.config.get()).toEqual(DEFAULT_CONFIG);
      });
    });
  });
}