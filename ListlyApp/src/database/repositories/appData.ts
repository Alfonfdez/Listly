import type { CollectionWithCounts, Item, ListWithCounts } from '../types';
import { listRepo } from './listRepo';
import { itemRepo } from './itemRepo';
import { collectionRepo } from './collectionRepo';
import { vaultRepo } from './vaultRepo';

export interface AppData {
  lists: ListWithCounts[];
  collections: CollectionWithCounts[];
  listsByCollectionId: Map<number, ListWithCounts[]>;
  baseLists: ListWithCounts[];
  itemsByListId: Map<number, Item[]>;
  lockedListIds: Set<number>;
}

export async function loadAppData(): Promise<AppData> {
  const [lists, items, collections, lockedListIds] = await Promise.all([
    listRepo.withCounts(),
    itemRepo.listAll(),
    collectionRepo.withCounts(),
    vaultRepo.listIds(),
  ]);

  const itemsByListId = new Map<number, Item[]>();
  for (const item of items) {
    const existing = itemsByListId.get(item.list_id);
    if (existing) {
      existing.push(item);
    } else {
      itemsByListId.set(item.list_id, [item]);
    }
  }

  const listsByCollectionId = new Map<number, ListWithCounts[]>();
  const baseLists: ListWithCounts[] = [];
  for (const list of lists) {
    if (list.collection_id === null) {
      baseLists.push(list);
    } else {
      const existing = listsByCollectionId.get(list.collection_id);
      if (existing) {
        existing.push(list);
      } else {
        listsByCollectionId.set(list.collection_id, [list]);
      }
    }
  }

  return {
    lists,
    itemsByListId,
    collections,
    listsByCollectionId,
    baseLists,
    lockedListIds: new Set(lockedListIds),
  };
}
