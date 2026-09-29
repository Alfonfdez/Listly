import { useCallback, useRef, useState } from 'react';
import { vaultRepository as vaultRepo } from '../database';
import type { UnlockedItems, VaultItemRecord } from '../database/repositories/vaultRepo';
import { isWrongPassphrase } from '../utils/vaultCrypto';
import { dbTimestamp } from '../utils/formatters';

export function useVaultSession(listId: number) {
  const [unlocked, setUnlocked] = useState(false);
  const [items, setItems] = useState<UnlockedItems>([]);
  const [wrongPassphrase, setWrongPassphrase] = useState(false);
  const passphraseRef = useRef<string | null>(null);

  const persist = useCallback(
    async (nextItems: UnlockedItems) => {
      if (!passphraseRef.current) return;
      await vaultRepo.saveUnlocked(listId, passphraseRef.current, nextItems);
      setItems(nextItems);
    },
    [listId]
  );

  const unlock = useCallback(
    async (passphrase: string) => {
      try {
        const decrypted = await vaultRepo.unlock(listId, passphrase);
        passphraseRef.current = passphrase;
        setItems(decrypted);
        setWrongPassphrase(false);
        setUnlocked(true);
      } catch (error) {
        if (isWrongPassphrase(error)) {
          setWrongPassphrase(true);
          return;
        }
        throw error;
      }
    },
    [listId]
  );

  const relock = useCallback(() => {
    passphraseRef.current = null;
    setUnlocked(false);
    setItems([]);
    setWrongPassphrase(false);
  }, []);

  const removeLock = useCallback(
    async (passphrase: string): Promise<boolean> => {
      try {
        await vaultRepo.removeLock(listId, passphrase);
        relock();
        return true;
      } catch (error) {
        if (isWrongPassphrase(error)) {
          setWrongPassphrase(true);
          return false;
        }
        throw error;
      }
    },
    [listId, relock]
  );

  const changePassphrase = useCallback(
    async (currentPassphrase: string, newPassphrase: string) => {
      await vaultRepo.changePassphrase(listId, currentPassphrase, newPassphrase);
      passphraseRef.current = newPassphrase;
    },
    [listId]
  );

  const mutate = useCallback(
    async (updater: (current: UnlockedItems) => UnlockedItems) => {
      const next = updater(items);
      await persist(next);
    },
    [items, persist]
  );

  const addItem = useCallback(
    async (data: {
      name: string;
      note: string | null;
      pictures: string | null;
      amount_minor: number | null;
      quantity: number;
    }) => {
      const stamp = dbTimestamp();
      // Temp ids stay negative so they never collide with SQLite (positive)
      // ids; derive each new id below the smallest existing one so a fresh
      // session cannot reuse an id already persisted in the vault.
      const id = items.reduce((min, item) => Math.min(min, item.id), 0) - 1;
      const next = [
        ...items,
        {
          id,
          list_id: listId,
          name: data.name,
          checked: 0 as const,
          note: data.note,
          pictures: data.pictures,
          position: items.reduce((max, i) => Math.max(max, i.position), -1) + 1,
          created_at: stamp,
          updated_at: stamp,
          amount_minor: data.amount_minor,
          quantity: data.quantity,
        },
      ];
      await persist(next);
    },
    [items, listId, persist]
  );

  const updateItem = useCallback(
    async (id: number, data: Partial<Omit<VaultItemRecord, 'id' | 'list_id' | 'created_at'>>) => {
      await mutate(current =>
        current.map(item => (item.id === id ? { ...item, ...data, updated_at: dbTimestamp() } : item))
      );
    },
    [mutate]
  );

  const deleteItem = useCallback(
    async (id: number) => {
      await mutate(current => current.filter(item => item.id !== id));
    },
    [mutate]
  );

  const deleteMany = useCallback(
    async (ids: number[]) => {
      await mutate(current => current.filter(item => !ids.includes(item.id)));
    },
    [mutate]
  );

  const toggleItem = useCallback(
    async (id: number) => {
      await mutate(current =>
        current.map(item =>
          item.id === id
            ? { ...item, checked: item.checked === 1 ? (0 as const) : (1 as const), updated_at: dbTimestamp() }
            : item
        )
      );
    },
    [mutate]
  );

  const setAllChecked = useCallback(
    async (checked: boolean) => {
      const flag = checked ? (1 as const) : (0 as const);
      await mutate(current => current.map(item => ({ ...item, checked: flag, updated_at: dbTimestamp() })));
    },
    [mutate]
  );

  const deleteCompleted = useCallback(
    async () => {
      await mutate(current => current.filter(item => item.checked !== 1));
    },
    [mutate]
  );

  const reorder = useCallback(
    async (orderedIds: number[]) => {
      const stamp = dbTimestamp();
      await mutate(current => {
        const byId = new Map(current.map(item => [item.id, item]));
        const ordered = orderedIds
          .map((id, index) => {
            const item = byId.get(id);
            return item ? { ...item, position: index, updated_at: stamp } : null;
          })
          .filter((item): item is VaultItemRecord => item !== null);
        return ordered;
      });
    },
    [mutate]
  );

  return {
    unlocked,
    items,
    wrongPassphrase,
    unlock,
    relock,
    removeLock,
    changePassphrase,
    addItem,
    updateItem,
    deleteItem,
    deleteMany,
    toggleItem,
    setAllChecked,
    deleteCompleted,
    reorder,
  };
}
