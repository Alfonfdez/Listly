import { useCallback, useEffect, useState } from 'react';
import { itemRepo } from '../database';
import { logError, ERROR_SCOPE } from '../utils/errors';
import { COPY_FEEDBACK_MS, MERGE_NOTICE, type NavigationProp } from '../constants/types';
import type { ListWithCounts } from '../database/types';

interface Options {
  list: ListWithCounts | undefined;
  notice: string | undefined;
  refresh: () => Promise<void>;
  navigation: NavigationProp<'ListDetail'>;
}

export function useMergeFlow({ list, notice, refresh, navigation }: Options) {
  const [mergePickerVisible, setMergePickerVisible] = useState(false);
  const [mergeTarget, setMergeTarget] = useState<ListWithCounts | null>(null);
  const [mergeBusy, setMergeBusy] = useState(false);
  const [mergeNoticeVisible, setMergeNoticeVisible] = useState(false);

  useEffect(() => {
    if (notice !== MERGE_NOTICE) return;
    setMergeNoticeVisible(true);
    const timer = setTimeout(() => setMergeNoticeVisible(false), COPY_FEEDBACK_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  const doMerge = useCallback(
    async (target: ListWithCounts) => {
      if (!list) return;
      setMergeBusy(true);
      try {
        await itemRepo.mergeInto(list.id, target.id);
        await refresh();
        setMergeBusy(false);
        setMergeTarget(null);
        navigation.replace('ListDetail', { listId: target.id, notice: MERGE_NOTICE });
      } catch (error) {
        setMergeBusy(false);
        logError(ERROR_SCOPE.mergeLists, error);
      }
    },
    [list, refresh, navigation]
  );

  return {
    mergePickerVisible,
    openMergePicker: () => setMergePickerVisible(true),
    closeMergePicker: () => setMergePickerVisible(false),
    mergeTarget,
    setMergeTarget,
    mergeBusy,
    mergeNoticeVisible,
    doMerge,
  };
}
