import { useCallback, useMemo, useState } from 'react';
import { uniqueNormalizedNames } from '../utils/validation';
import { serializeItemPhotos } from '../utils/itemPhotos';
import type { Item } from '../database/types';
import type { ItemUpdate } from './useItemStore';

interface Options {
  items: Item[];
  update: (id: number, data: ItemUpdate) => Promise<void>;
  remove: (id: number) => Promise<void>;
}

export function useItemEditing({ items, update, remove }: Options) {
  const [editing, setEditing] = useState<Item | null>(null);

  const editingExclusiveNames = useMemo(
    () => (editing ? uniqueNormalizedNames(items.filter(i => i.id !== editing.id).map(i => i.name)) : new Set<string>()),
    [items, editing]
  );

  const saveEdit = useCallback(
    async (
      name: string,
      note: string | null,
      photos: string[],
      amountMinor: number | null,
      quantity: number
    ) => {
      if (!editing) return;
      await update(editing.id, {
        name,
        note,
        pictures: serializeItemPhotos(photos),
        amount_minor: amountMinor,
        quantity,
      });
      setEditing(null);
    },
    [editing, update]
  );

  const deleteItem = useCallback(async () => {
    if (!editing) return;
    await remove(editing.id);
    setEditing(null);
  }, [editing, remove]);

  return { editing, setEditing, editingExclusiveNames, saveEdit, deleteItem };
}
