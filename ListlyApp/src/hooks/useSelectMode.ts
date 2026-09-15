import { useState, useCallback } from 'react';

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

  const enterSelectMode = useCallback((id: number) => {
    setSelectedIds(new Set([id]));
    setSelectMode(true);
  }, []);

  const toggleItem = useCallback((id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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
      console.error('Failed to delete selected items:', error);
      exitSelectMode();
    }
  }, [selectedIds, deleteMany, afterDelete, exitSelectMode]);

  return {
    selectMode,
    selectedIds,
    deleteConfirmVisible,
    toggleSelectMode,
    enterSelectMode,
    toggleItem,
    exitSelectMode,
    openDeleteConfirm: useCallback(() => setDeleteConfirmVisible(true), []),
    closeDeleteConfirm,
    confirmDelete,
  };
}