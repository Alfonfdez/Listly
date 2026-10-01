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
    amount_minor: null,
    quantity: 0,
    ...rest,
  };
}

const labels = { total: 'Total', done: 'Done' };

describe('buildListCopyText (standard)', () => {
  it('lists the name then item names in position order (names only)', () => {
    const items = [
      item({ id: 2, name: 'Eggs', position: 1 }),
      item({ id: 1, name: 'Milk', position: 0 }),
    ];
    expect(buildListCopyText('Groceries', items, { withNotes: false })).toBe('Groceries\nMilk\nEggs');
  });

  it('prefixes checked items with the green check mark', () => {
    const items = [
      item({ id: 1, name: 'Milk', checked: 1, position: 0 }),
      item({ id: 2, name: 'Bread', checked: 0, position: 1 }),
    ];
    expect(buildListCopyText('Groceries', items, { withNotes: false })).toBe('Groceries\n✅ Milk\nBread');
  });

  it('appends notes only when withNotes and the note is non-empty', () => {
    const items = [
      item({ id: 1, name: 'Milk', note: 'skim', position: 0 }),
      item({ id: 2, name: 'Bread', note: null, position: 1 }),
      item({ id: 3, name: 'Eggs', note: '  ', position: 2 }),
    ];
    expect(buildListCopyText('Groceries', items, { withNotes: true })).toBe(
      'Groceries\nMilk — skim\nBread\nEggs'
    );
    expect(buildListCopyText('Groceries', items, { withNotes: false })).toBe(
      'Groceries\nMilk\nBread\nEggs'
    );
  });

  it('returns just the list name when there are no items', () => {
    expect(buildListCopyText('Groceries', [], { withNotes: true })).toBe('Groceries');
  });

  it('ignores numeric formatting and labels for standard lists', () => {
    const items = [item({ id: 1, name: 'Milk', amount_minor: 120, quantity: 2, position: 0 })];
    expect(
      buildListCopyText('Groceries', items, { withNotes: false, numeric: false, labels })
    ).toBe('Groceries\nMilk');
  });
});

describe('buildListCopyText (numeric)', () => {
  it('renders amount × quantity = lineTotal and the Total/Done footer', () => {
    const items = [
      item({ id: 1, name: 'Milk', amount_minor: 120, quantity: 2, checked: 1, position: 0 }),
      item({ id: 2, name: 'Eggs', amount_minor: 210, quantity: 1, position: 1 }),
    ];
    expect(buildListCopyText('Groceries', items, { withNotes: false, numeric: true, labels })).toBe(
      'Groceries\n✅ Milk — 1.20 × 2 = 2.40\nEggs — 2.10 × 1 = 2.10\n\nTotal: 4.50\nDone: 2.40'
    );
  });

  it('always shows the amount × quantity = total segment, including quantity 1', () => {
    const items = [item({ id: 1, name: 'Bread', amount_minor: 10000, quantity: 1, position: 0 })];
    expect(buildListCopyText('Groceries', items, { withNotes: false, numeric: true, labels })).toBe(
      'Groceries\nBread — 100.00 × 1 = 100.00\n\nTotal: 100.00\nDone: 0.00'
    );
  });

  it('renders a null amount as 0.00', () => {
    const items = [item({ id: 1, name: 'Salt', amount_minor: null, quantity: 1, position: 0 })];
    expect(buildListCopyText('Groceries', items, { withNotes: false, numeric: true, labels })).toBe(
      'Groceries\nSalt — 0.00 × 1 = 0.00\n\nTotal: 0.00\nDone: 0.00'
    );
  });

  it('appends the note after the numeric segment when withNotes', () => {
    const items = [
      item({ id: 1, name: 'Coffee beans', amount_minor: 849, quantity: 2, note: 'Decaf, for the moka pot', position: 0 }),
    ];
    expect(buildListCopyText('Groceries', items, { withNotes: true, numeric: true, labels })).toBe(
      'Groceries\nCoffee beans — 8.49 × 2 = 16.98 — Decaf, for the moka pot\n\nTotal: 16.98\nDone: 0.00'
    );
  });

  it('sums only checked items into Done', () => {
    const items = [
      item({ id: 1, name: 'Milk', amount_minor: 120, quantity: 2, checked: 1, position: 0 }),
      item({ id: 2, name: 'Eggs', amount_minor: 210, quantity: 3, checked: 0, position: 1 }),
    ];
    expect(buildListCopyText('Groceries', items, { withNotes: false, numeric: true, labels })).toBe(
      'Groceries\n✅ Milk — 1.20 × 2 = 2.40\nEggs — 2.10 × 3 = 6.30\n\nTotal: 8.70\nDone: 2.40'
    );
  });

  it('omits the footer for an empty numeric list', () => {
    expect(buildListCopyText('Groceries', [], { withNotes: true, numeric: true, labels })).toBe('Groceries');
  });

  it('keeps position order', () => {
    const items = [
      item({ id: 2, name: 'Eggs', amount_minor: 210, quantity: 1, position: 1 }),
      item({ id: 1, name: 'Milk', amount_minor: 120, quantity: 1, position: 0 }),
    ];
    const text = buildListCopyText('Groceries', items, { withNotes: false, numeric: true, labels });
    expect(text.split('\n').slice(0, 3)).toEqual([
      'Groceries',
      'Milk — 1.20 × 1 = 1.20',
      'Eggs — 2.10 × 1 = 2.10',
    ]);
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
