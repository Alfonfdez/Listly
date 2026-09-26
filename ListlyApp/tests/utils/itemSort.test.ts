import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ITEM_SORT,
  ITEM_SORT_VALUES,
  itemSortValue,
  parseItemSortValue,
  sortItems,
  type ItemSort,
} from '../../src/utils/itemSort';
import type { Item } from '../../src/database/types';

function makeItem(overrides: Partial<Item> = {}): Item {
  return {
    id: 1,
    list_id: 1,
    name: 'Milk',
    checked: 0,
    note: null,
    pictures: null,
    position: 0,
    created_at: '2026-01-01 00:00:00',
    updated_at: '2026-01-01 00:00:00',
    ...overrides,
  };
}

const ITEMS = [
  makeItem({ id: 1, name: 'Banana', created_at: '2026-03-03 00:00:00', position: 0 }),
  makeItem({ id: 2, name: 'apple', created_at: '2026-01-01 00:00:00', position: 1 }),
  makeItem({ id: 3, name: 'Cherry', created_at: '2026-02-02 00:00:00', position: 2 }),
];

describe('itemSortValue and parseItemSortValue', () => {
  it('round-trips every supported value', () => {
    for (const value of ITEM_SORT_VALUES) {
      expect(itemSortValue(parseItemSortValue(value))).toBe(value);
    }
  });

  it('maps manual without a direction', () => {
    expect(itemSortValue(DEFAULT_ITEM_SORT)).toBe('manual');
  });

  it('parses manual with a settled direction', () => {
    expect(parseItemSortValue('manual')).toEqual({ key: 'manual', direction: 'asc' });
  });

  it('rejects values outside the supported set', () => {
    expect(parseItemSortValue('foo' as never).key).toBeDefined();
  });
});

describe('sortItems', () => {
  it('keeps the input order for manual sort', () => {
    expect(sortItems(ITEMS, DEFAULT_ITEM_SORT).map(i => i.id)).toEqual([1, 2, 3]);
  });

  it('sorts by name ascending ignoring case', () => {
    const sort: ItemSort = { key: 'name', direction: 'asc' };
    expect(sortItems(ITEMS, sort).map(i => i.name)).toEqual(['apple', 'Banana', 'Cherry']);
  });

  it('sorts by name descending', () => {
    const sort: ItemSort = { key: 'name', direction: 'desc' };
    expect(sortItems(ITEMS, sort).map(i => i.name)).toEqual(['Cherry', 'Banana', 'apple']);
  });

  it('sorts by created ascending from oldest to newest', () => {
    const sort: ItemSort = { key: 'created', direction: 'asc' };
    expect(sortItems(ITEMS, sort).map(i => i.name)).toEqual(['apple', 'Cherry', 'Banana']);
  });

  it('sorts by created descending from newest to oldest', () => {
    const sort: ItemSort = { key: 'created', direction: 'desc' };
    expect(sortItems(ITEMS, sort).map(i => i.name)).toEqual(['Banana', 'Cherry', 'apple']);
  });

  it('preserves position order when created timestamps tie', () => {
    const tied = [makeItem({ id: 1, position: 0 }), makeItem({ id: 2, position: 1 })];
    const sort: ItemSort = { key: 'created', direction: 'asc' };
    expect(sortItems(tied, sort).map(i => i.id)).toEqual([1, 2]);
  });

  it('does not mutate the source array', () => {
    const before = ITEMS.map(i => i.id);
    sortItems(ITEMS, { key: 'name', direction: 'asc' });
    expect(ITEMS.map(i => i.id)).toEqual(before);
  });
});