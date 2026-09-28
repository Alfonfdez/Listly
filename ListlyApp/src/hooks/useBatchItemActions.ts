import { useCallback, useState } from 'react';
import { itemRepository as itemRepo } from '../database';
import { logError, ERROR_SCOPE } from '../utils/errors';

interface Options {
  listId: number;
  refresh: () => Promise<void>;
}

export function useBatchItemActions({ listId, refresh }: Options) {
  const [clearCompletedVisible, setClearCompletedVisible] = useState(false);

  const completeAll = useCallback(async () => {
    try {
      await itemRepo.setAllChecked(listId, true);
    } catch (error) {
      logError(ERROR_SCOPE.completeAllItems, error);
    }
    void refresh();
  }, [listId, refresh]);

  const uncompleteAll = useCallback(async () => {
    try {
      await itemRepo.setAllChecked(listId, false);
    } catch (error) {
      logError(ERROR_SCOPE.uncompleteAllItems, error);
    }
    void refresh();
  }, [listId, refresh]);

  const clearCompleted = useCallback(async () => {
    setClearCompletedVisible(false);
    try {
      await itemRepo.deleteCompleted(listId);
    } catch (error) {
      logError(ERROR_SCOPE.clearCompletedItems, error);
    }
    void refresh();
  }, [listId, refresh]);

  return {
    clearCompletedVisible,
    openClearCompleted: () => setClearCompletedVisible(true),
    closeClearCompleted: () => setClearCompletedVisible(false),
    completeAll,
    uncompleteAll,
    clearCompleted,
  };
}
