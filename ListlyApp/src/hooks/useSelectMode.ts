import { useState, useCallback } from 'react';
import { toggleInSet } from '../utils/set';
import { logError, ERROR_SCOPE } from '../utils/errors';

interface Options {
  deleteMany: (ids: number[]) => Promise<void>;
  afterDelete?: () => void | Promise<void>;
}

export function useSelectMode({ deleteMany, afterDelete }: Options) {
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<number>>(new Set());
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

  const toggleSelectMode = useCallback(() => {
    setSelectMode(prev => {
      if (prev) setSelectedIds(new Set());
      return !prev;
    });
  }, []);

  const toggleItem = useCallback((id: number) => {
    setSelectedIds(prev => toggleInSet(prev, id));
  }, []);

  const exitSelectMode = useCallback(() => {
    setSelectedIds(new Set());
    setSelectMode(false);
  }, []);

  const closeDeleteConfirm = useCallback(() => setDeleteConfirmVisible(false), []);

  const confirmDelete = useCallback(async () => {
    setDeleteConfirmVisible(false);
    try {
      await deleteMany([...selectedIds]);
      exitSelectMode();
      await afterDelete?.();
    } catch (error) {
      logError(ERROR_SCOPE.deleteSelectedItems, error);
      exitSelectMode();
    }
  }, [selectedIds, deleteMany, afterDelete, exitSelectMode]);

  return {
    selectMode,
    selectedIds,
    deleteConfirmVisible,
    toggleSelectMode,
    toggleItem,
    exitSelectMode,
    openDeleteConfirm: useCallback(() => setDeleteConfirmVisible(true), []),
    closeDeleteConfirm,
    confirmDelete,
  };
}