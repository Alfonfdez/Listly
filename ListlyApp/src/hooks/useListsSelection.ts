import { useMemo } from 'react';
import { listRepo, collectionRepo } from '../database';
import { logError, ERROR_SCOPE } from '../utils/errors';
import { isOn } from '../utils/flags';
import type { CollectionWithCounts, ListWithCounts } from '../database/types';

interface Options {
  lists: ListWithCounts[];
  collections: CollectionWithCounts[];
  selectedIds: ReadonlySet<number>;
  selectedCollectionIds: ReadonlySet<number>;
  refresh: () => Promise<void>;
}

export function useListsSelection({
  lists,
  collections,
  selectedIds,
  selectedCollectionIds,
  refresh,
}: Options) {
  const selectedListItems = useMemo(
    () => lists.filter(l => selectedIds.has(l.id)),
    [lists, selectedIds]
  );

  const selectedCollectionItems = useMemo(
    () => collections.filter(col => selectedCollectionIds.has(col.id)),
    [collections, selectedCollectionIds]
  );

  const hasPinSelection = selectedListItems.length + selectedCollectionItems.length > 0;
  const allSelectedPinned = useMemo(
    () =>
      hasPinSelection &&
      selectedListItems.every(l => isOn(l.pinned)) &&
      selectedCollectionItems.every(col => isOn(col.pinned)),
    [hasPinSelection, selectedListItems, selectedCollectionItems]
  );

  const handlePinPress = useMemo(
    () => () => {
      if (!hasPinSelection) return;
      const nextPinned = !allSelectedPinned;
      const scope = allSelectedPinned ? ERROR_SCOPE.unpinLists : ERROR_SCOPE.pinLists;
      void (async () => {
        try {
          for (const l of selectedListItems) {
            await listRepo.setPinned(l.id, nextPinned);
          }
          for (const col of selectedCollectionItems) {
            await collectionRepo.setPinned(col.id, nextPinned);
          }
          await refresh();
        } catch (error) {
          logError(scope, error);
        }
      })();
    },
    [hasPinSelection, allSelectedPinned, selectedListItems, selectedCollectionItems, refresh]
  );

  return { selectedListItems, selectedCollectionItems, allSelectedPinned, handlePinPress };
}
