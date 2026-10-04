import { useCallback, useState } from 'react';

interface Options {
  setAllChecked: (checked: boolean) => Promise<void>;
  deleteCompleted: () => Promise<void>;
}

export function useBatchItemActions({ setAllChecked, deleteCompleted }: Options) {
  const [clearCompletedVisible, setClearCompletedVisible] = useState(false);

  const completeAll = useCallback(() => setAllChecked(true), [setAllChecked]);
  const uncompleteAll = useCallback(() => setAllChecked(false), [setAllChecked]);
  const clearCompleted = useCallback(async () => {
    setClearCompletedVisible(false);
    await deleteCompleted();
  }, [deleteCompleted]);

  return {
    clearCompletedVisible,
    openClearCompleted: () => setClearCompletedVisible(true),
    closeClearCompleted: () => setClearCompletedVisible(false),
    completeAll,
    uncompleteAll,
    clearCompleted,
  };
}
