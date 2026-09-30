import { useMemo } from 'react';
import { filterListsByQuery } from '../utils/search';
import { LIST_VIEW_MODES, type ListViewMode } from '../constants/types';
import { collectionRepo } from '../database';
import { runSafelyAsync, ERROR_SCOPE } from '../utils/errors';
import { useDragOrder } from './useDragOrder';
import type { CollectionWithCounts, Item, ListWithCounts } from '../database/types';

interface Options {
  mode: ListViewMode;
  collectionId?: number;
  query: string;
  lists: ListWithCounts[];
  collections: CollectionWithCounts[];
  listsByCollectionId: Map<number, ListWithCounts[]>;
  baseLists: ListWithCounts[];
  itemsByListId: Map<number, Item[]>;
  refresh: () => Promise<void>;
}

export function useListsViewData({
  mode,
  collectionId,
  query,
  lists,
  collections,
  listsByCollectionId,
  baseLists,
  itemsByListId,
  refresh,
}: Options) {
  const scopeLists = useMemo(() => {
    if (mode === LIST_VIEW_MODES.collection && collectionId !== undefined) {
      return listsByCollectionId.get(collectionId) ?? [];
    }
    if (mode === LIST_VIEW_MODES.home) return baseLists;
    if (mode === LIST_VIEW_MODES.collections) return [];
    return lists;
  }, [mode, collectionId, listsByCollectionId, baseLists, lists]);

  const filteredLists = useMemo(
    () => filterListsByQuery(scopeLists, itemsByListId, query),
    [scopeLists, itemsByListId, query]
  );

  const filteredCollections = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return collections;
    return collections.filter(col => col.name.toLowerCase().includes(needle));
  }, [collections, query]);

  const { display: displayCollections, onDragEnd: handleCollectionsDragEnd } = useDragOrder(
    filteredCollections,
    useMemo(
      () => (ids: number[]) => {
        void (async () => {
          await runSafelyAsync(collectionRepo.reorder(ids), ERROR_SCOPE.reorderCollections);
          await refresh();
        })();
      },
      [refresh]
    )
  );

  return { scopeLists, filteredLists, filteredCollections, displayCollections, handleCollectionsDragEnd };
}
