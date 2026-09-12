import type { Item, ListWithCounts } from '../database/types';

export function searchTerms(query: string): string[] {
  return query.trim().toLowerCase().split(/\s+/).filter(Boolean);
}

export function matchesAllTerms(query: string, ...haystacks: string[]): boolean {
  const terms = searchTerms(query);
  if (terms.length === 0) return true;
  return terms.every(term => haystacks.some(haystack => haystack.toLowerCase().includes(term)));
}

export function filterListsByQuery(
  lists: ListWithCounts[],
  itemsByListId: ReadonlyMap<number, Item[]>,
  query: string
): ListWithCounts[] {
  if (searchTerms(query).length === 0) return lists;
  return lists.filter(list => {
    if (matchesAllTerms(query, list.name)) return true;
    const items = itemsByListId.get(list.id) ?? [];
    const itemNames = items.map(item => item.name);
    return matchesAllTerms(query, ...itemNames);
  });
}