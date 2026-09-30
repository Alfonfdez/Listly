import { useCallback, useEffect, useRef, useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import { itemRepo } from '../database';
import { logError, runSafelyAsync, ERROR_SCOPE } from '../utils/errors';
import { buildListCopyText } from '../utils/copyList';
import { COPY_FEEDBACK_MS } from '../constants/types';
import type { Item, ListWithCounts } from '../database/types';

interface Options {
  list: ListWithCounts | undefined;
  items: Item[];
  refresh: () => Promise<void>;
}

export function useClipboardCopy({ list, items, refresh }: Options) {
  const [copiedAction, setCopiedAction] = useState<'all' | 'names' | 'to-list' | null>(null);
  const [copiedToName, setCopiedToName] = useState<string | null>(null);
  const [copyPickerVisible, setCopyPickerVisible] = useState(false);
  const copyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startFeedback = useCallback((action: 'all' | 'names' | 'to-list', targetName: string | null = null) => {
    setCopiedAction(action);
    setCopiedToName(targetName);
    if (copyTimeout.current) clearTimeout(copyTimeout.current);
    copyTimeout.current = setTimeout(() => setCopiedAction(null), COPY_FEEDBACK_MS);
  }, []);

  const copyList = useCallback(
    (withNotes: boolean) => {
      if (!list) return;
      const text = buildListCopyText(list.name, items, withNotes);
      void Clipboard.setStringAsync(text).catch(error => logError(ERROR_SCOPE.copyToClipboard, error));
      startFeedback(withNotes ? 'all' : 'names');
    },
    [list, items, startFeedback]
  );

  const copyToList = useCallback(
    (target: ListWithCounts) => {
      if (!list) return;
      startFeedback('to-list', target.name);
      void (async () => {
        await runSafelyAsync(itemRepo.duplicateItems(list.id, target.id), ERROR_SCOPE.copyItemsToList);
        await refresh();
      })();
    },
    [list, refresh, startFeedback]
  );

  useEffect(() => {
    return () => {
      if (copyTimeout.current) clearTimeout(copyTimeout.current);
    };
  }, []);

  return {
    copiedAction,
    copiedToName,
    copyPickerVisible,
    openCopyPicker: () => setCopyPickerVisible(true),
    closeCopyPicker: () => setCopyPickerVisible(false),
    copyList,
    copyToList,
  };
}
