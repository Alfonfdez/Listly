import { useCallback, useState } from 'react';
import { itemRepo } from '../database';
import { logError, ERROR_SCOPE } from '../utils/errors';
import type { ListWithCounts } from '../database/types';

interface Options {
  list: ListWithCounts | undefined;
  refresh: () => Promise<void>;
  // Invoked after a successful merge (the source list no longer exists), so the
  // caller can navigate to the target list with its own stack semantics.
  onMerged: (target: ListWithCounts) => void;
}

export function useMergeFlow({ list, refresh, onMerged }: Options) {
  const [mergePickerVisible, setMergePickerVisible] = useState(false);
  const [mergeTarget, setMergeTarget] = useState<ListWithCounts | null>(null);
  const [mergeBusy, setMergeBusy] = useState(false);

  const doMerge = useCallback(
    async (target: ListWithCounts) => {
      if (!list) return;
      setMergeBusy(true);
      try {
        await itemRepo.mergeInto(list.id, target.id);
        await refresh();
        setMergeBusy(false);
        setMergeTarget(null);
        onMerged(target);
      } catch (error) {
        setMergeBusy(false);
        logError(ERROR_SCOPE.mergeLists, error);
      }
    },
    [list, refresh, onMerged]
  );

  return {
    mergePickerVisible,
    openMergePicker: () => setMergePickerVisible(true),
    closeMergePicker: () => setMergePickerVisible(false),
    mergeTarget,
    setMergeTarget,
    mergeBusy,
    doMerge,
  };
}
