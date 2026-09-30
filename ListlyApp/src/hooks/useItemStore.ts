import { useCallback, useMemo } from 'react';
import { itemRepo } from '../database';
import type { Item } from '../database/types';
import { runSafelyAsync, ERROR_SCOPE } from '../utils/errors';
import type { useVaultSession } from './useVaultSession';

export interface ItemDraft {
  name: string;
  note: string | null;
  pictures: string | null;
  amount_minor: number | null;
  quantity: number;
}

export type ItemUpdate = ItemDraft;

type VaultSession = ReturnType<typeof useVaultSession>;

interface Options {
  listId: number;
  repoItems: Item[];
  refresh: () => Promise<void>;
  vault: VaultSession;
}

export function useItemStore({ listId, repoItems, refresh, vault }: Options) {
  const unlocked = vault.unlocked;
  const items = useMemo<Item[]>(
    () => (unlocked ? (vault.items as unknown as Item[]) : repoItems),
    [unlocked, vault.items, repoItems]
  );

  const runRepo = useCallback(
    async (action: Promise<unknown>, scope: Parameters<typeof runSafelyAsync>[1]) => {
      await runSafelyAsync(action, scope);
      await refresh();
    },
    [refresh]
  );

  const add = useCallback(
    async (data: ItemDraft) => {
      if (unlocked) {
        await vault.addItem(data);
        return;
      }
      const position = repoItems.reduce((max, item) => Math.max(max, item.position), -1) + 1;
      await itemRepo.create({ list_id: listId, checked: 0, position, ...data });
      await refresh();
    },
    [unlocked, vault, repoItems, listId, refresh]
  );

  const update = useCallback(
    async (id: number, data: ItemUpdate) => {
      if (unlocked) {
        await vault.updateItem(id, data);
        return;
      }
      await runRepo(itemRepo.update(id, data), ERROR_SCOPE.updateItem);
    },
    [unlocked, vault, runRepo]
  );

  const remove = useCallback(
    async (id: number) => {
      if (unlocked) {
        await vault.deleteItem(id);
        return;
      }
      await runRepo(itemRepo.delete(id), ERROR_SCOPE.deleteItem);
    },
    [unlocked, vault, runRepo]
  );

  // `removeMany` is called by `useSelectMode`, which logs failures
  // (`deleteSelectedItems`) and refreshes afterwards.
  const removeMany = useCallback(
    async (ids: number[]) => {
      if (unlocked) {
        await vault.deleteMany(ids);
        return;
      }
      await itemRepo.deleteMany(ids);
    },
    [unlocked, vault]
  );

  const toggle = useCallback(
    async (id: number) => {
      if (unlocked) {
        await vault.toggleItem(id);
        return;
      }
      await runRepo(itemRepo.toggle(id), ERROR_SCOPE.toggleItem);
    },
    [unlocked, vault, runRepo]
  );

  const setAllChecked = useCallback(
    async (checked: boolean) => {
      if (unlocked) {
        await vault.setAllChecked(checked);
        return;
      }
      await runRepo(
        itemRepo.setAllChecked(listId, checked),
        checked ? ERROR_SCOPE.completeAllItems : ERROR_SCOPE.uncompleteAllItems
      );
    },
    [unlocked, vault, runRepo, listId]
  );

  const deleteCompleted = useCallback(
    async () => {
      if (unlocked) {
        await vault.deleteCompleted();
        return;
      }
      await runRepo(itemRepo.deleteCompleted(listId), ERROR_SCOPE.clearCompletedItems);
    },
    [unlocked, vault, runRepo, listId]
  );

  const reorder = useCallback(
    async (orderedIds: number[]) => {
      if (unlocked) {
        await vault.reorder(orderedIds);
        return;
      }
      await runRepo(itemRepo.reorder(listId, orderedIds), ERROR_SCOPE.reorderItems);
    },
    [unlocked, vault, runRepo, listId]
  );

  return { unlocked, items, add, update, remove, removeMany, toggle, setAllChecked, deleteCompleted, reorder };
}
