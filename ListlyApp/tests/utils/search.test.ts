import { describe, expect, it } from 'vitest';
import { filterItemsByQuery, filterListsByQuery, matchesAllTerms, searchTerms } from '../../src/utils/search';
import type { Item, ListWithCounts } from '../../src/database/types';

const LISTS: ListWithCounts[] = [
  { id: 1, name: 'Groceries', color: '#22D3EE', icon: 'cart-outline', created_at: 'x', position: 0, total: 3, completed: 1 },
  { id: 2, name: 'Work Tasks', color: '#34D399', icon: 'briefcase-outline', created_at: 'x', position: 1, total: 2, completed: 0 },
  { id: 3, name: 'Reading List', color: '#A78BFA', icon: 'book-outline', created_at: 'x', position: 2, total: 1, completed: 1 },
];

function item(name: string): Item {
  return { id: 0, list_id: 0, name, checked: 0, note: null, position: 0, created_at: 'x', pictures: null };
}

const ITEMS: Map<number, Item[]> = new Map([
  [1, [item('Milk'), item('Coffee beans')]],
  [2, [item('Report'), item('Email')]],
  [3, [item('Milk and honey')]],
]);

describe('searchTerms', () => {
  it('splits a query into trimmed lowercase terms', () => {
    expect(searchTerms('  Milk   COFFEE ')).toEqual(['milk', 'coffee']);
  });

  it('returns no terms for an empty or whitespace query', () => {
    expect(searchTerms('')).toEqual([]);
    expect(searchTerms('   ')).toEqual([]);
  });
});

describe('matchesAllTerms', () => {
  it('matches all terms across the haystacks (AND)', () => {
    expect(matchesAllTerms('milk beans', 'Groceries', 'Milk', 'Coffee beans')).toBe(true);
    expect(matchesAllTerms('milk beans', 'Groceries', 'Milk')).toBe(false);
  });

  it('matches nothing for a non-substring term', () => {
    expect(matchesAllTerms('xyz', 'Groceries')).toBe(false);
  });

  it('matches everything for an empty query', () => {
    expect(matchesAllTerms('', 'anything')).toBe(true);
  });
});

describe('filterListsByQuery', () => {
  it('returns all lists for an empty query', () => {
    expect(filterListsByQuery(LISTS, ITEMS, '')).toHaveLength(3);
    expect(filterListsByQuery(LISTS, ITEMS, '   ')).toHaveLength(3);
  });

  it('filters by list name, case-insensitive substring', () => {
    expect(filterListsByQuery(LISTS, ITEMS, 'grocer').map(l => l.id)).toEqual([1]);
    expect(filterListsByQuery(LISTS, ITEMS, 'WORK').map(l => l.id)).toEqual([2]);
    expect(filterListsByQuery(LISTS, ITEMS, 'reading').map(l => l.id)).toEqual([3]);
    expect(filterListsByQuery(LISTS, ITEMS, 'nope')).toEqual([]);
  });

  it('matches a list when any of its item names match', () => {
    expect(filterListsByQuery(LISTS, ITEMS, 'coffee').map(l => l.id)).toEqual([1]);
    expect(filterListsByQuery(LISTS, ITEMS, 'email').map(l => l.id)).toEqual([2]);
  });

  it('keeps a list when its own name or item names match (union of names)', () => {
    const result = filterListsByQuery(LISTS, ITEMS, 'milk');
    expect(result.map(l => l.id)).toEqual([1, 3]);
  });

  it('returns no lists when nothing matches', () => {
    expect(filterListsByQuery(LISTS, ITEMS, 'wallet')).toEqual([]);
  });

  it('supports multi-term AND across name and items', () => {
    expect(filterListsByQuery(LISTS, ITEMS, 'milk honey').map(l => l.id)).toEqual([3]);
    expect(filterListsByQuery(LISTS, ITEMS, 'milk coffee').map(l => l.id)).toEqual([1]);
    expect(filterListsByQuery(LISTS, ITEMS, 'milk briefcase')).toEqual([]);
  });
});

describe('filterItemsByQuery', () => {
  it('returns all items for an empty query', () => {
    const items: Item[] = [item('Milk'), item('Coffee beans')];
    expect(filterItemsByQuery(items, '')).toHaveLength(2);
    expect(filterItemsByQuery(items, '   ')).toHaveLength(2);
  });

  it('filters by item name, case-insensitive substring', () => {
    const items: Item[] = [item('Milk'), item('Coffee beans')];
    expect(filterItemsByQuery(items, 'milk').map(i => i.name)).toEqual(['Milk']);
    expect(filterItemsByQuery(items, 'COFFEE').map(i => i.name)).toEqual(['Coffee beans']);
    expect(filterItemsByQuery(items, 'nope')).toEqual([]);
  });

  it('matches the note text too', () => {
    const items: Item[] = [
      { ...item('Eggs'), note: 'free-range' },
      { ...item('Milk') },
    ];
    expect(filterItemsByQuery(items, 'free').map(i => i.name)).toEqual(['Eggs']);
    expect(filterItemsByQuery(items, 'range').map(i => i.name)).toEqual(['Eggs']);
  });

  it('supports multi-term AND across name and note', () => {
    const items: Item[] = [
      { ...item('Eggs'), note: 'free-range brown' },
      item('Milk'),
    ];
    expect(filterItemsByQuery(items, 'eggs free').map(i => i.name)).toEqual(['Eggs']);
    expect(filterItemsByQuery(items, 'eggs creamy')).toEqual([]);
  });
});