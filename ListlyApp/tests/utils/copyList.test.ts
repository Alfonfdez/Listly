import { describe, expect, it } from 'vitest';
import { buildListCopyText, makeListCopyName } from '../../src/utils/copyList';
import { MAX_LIST_NAME_LENGTH } from '../../src/constants/types';
import type { Item } from '../../src/database/types';

function item({ id, ...rest }: Partial<Item> & { id: number }): Item {
  return {
    id,
    list_id: 1,
    name: 'item',
    checked: 0,
    note: null,
    position: 0,
    created_at: 'x',
    updated_at: 'x',
    pictures: null,
    ...rest,
  };
}

describe('buildListCopyText', () => {
  it('lists the name then item names in position order (names only)', () => {
    const items = [
      item({ id: 2, name: 'Eggs', position: 1 }),
      item({ id: 1, name: 'Milk', position: 0 }),
    ];
    expect(buildListCopyText('Groceries', items, false)).toBe('Groceries\nMilk\nEggs');
  });

  it('prefixes checked items with the green check mark', () => {
    const items = [
      item({ id: 1, name: 'Milk', checked: 1, position: 0 }),
      item({ id: 2, name: 'Bread', checked: 0, position: 1 }),
    ];
    expect(buildListCopyText('Groceries', items, false)).toBe('Groceries\n✅ Milk\nBread');
  });

  it('appends notes only when withNotes and the note is non-empty', () => {
    const items = [
      item({ id: 1, name: 'Milk', note: 'skim', position: 0 }),
      item({ id: 2, name: 'Bread', note: null, position: 1 }),
      item({ id: 3, name: 'Eggs', note: '  ', position: 2 }),
    ];
    expect(buildListCopyText('Groceries', items, true)).toBe(
      'Groceries\nMilk — skim\nBread\nEggs'
    );
    expect(buildListCopyText('Groceries', items, false)).toBe('Groceries\nMilk\nBread\nEggs');
  });

  it('returns just the list name when there are no items', () => {
    expect(buildListCopyText('Groceries', [], true)).toBe('Groceries');
  });
});

describe('makeListCopyName', () => {
  it('appends " copy" to the trimmed name', () => {
    expect(makeListCopyName('Groceries')).toBe('Groceries copy');
    expect(makeListCopyName('  Groceries  ')).toBe('Groceries copy');
  });

  it('clamps long names so the " copy" suffix survives', () => {
    const long = 'z'.repeat(MAX_LIST_NAME_LENGTH);
    expect(makeListCopyName(long)).toBe(`${'z'.repeat(MAX_LIST_NAME_LENGTH - 5)} copy`);
    expect(makeListCopyName(long).length).toBe(MAX_LIST_NAME_LENGTH);
  });
});
