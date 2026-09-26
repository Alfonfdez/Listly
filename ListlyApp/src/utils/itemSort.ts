import type { Item } from '../database/types';

export type ItemSortKey = 'manual' | 'name' | 'created';
export type SortDirection = 'asc' | 'desc';
export type ItemSortValue = 'manual' | 'name-asc' | 'name-desc' | 'created-asc' | 'created-desc';

export interface ItemSort {
  key: ItemSortKey;
  direction: SortDirection;
}

export const DEFAULT_ITEM_SORT: ItemSort = { key: 'manual', direction: 'asc' };

export const ITEM_SORT_VALUES: readonly ItemSortValue[] = [
  'manual',
  'name-asc',
  'name-desc',
  'created-asc',
  'created-desc',
];

export function itemSortValue(sort: ItemSort): ItemSortValue {
  return sort.key === 'manual' ? 'manual' : `${sort.key}-${sort.direction}`;
}

export function parseItemSortValue(value: ItemSortValue): ItemSort {
  if (value === 'manual') return { key: 'manual', direction: 'asc' };
  const [key, direction] = value.split('-');
  return { key: key as ItemSortKey, direction: direction as SortDirection };
}

function compareName(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

export function sortItems(items: Item[], sort: ItemSort): Item[] {
  if (sort.key === 'manual') return items;
  const factor = sort.direction === 'asc' ? 1 : -1;
  return [...items].sort((a, b) => {
    const cmp = sort.key === 'name' ? compareName(a.name, b.name) : a.created_at.localeCompare(b.created_at);
    return cmp === 0 ? 0 : cmp * factor;
  });
}