import { useMemo, useState } from 'react';
import { itemRepository as itemRepo } from '../database';
import { logError, ERROR_SCOPE } from '../utils/errors';
import { uniqueNormalizedNames } from '../utils/validation';
import { serializeItemPhotos } from '../utils/itemPhotos';
import type { Item } from '../database/types';

interface Options {
  items: Item[];
  refresh: () => Promise<void>;
}

export function useItemEditing({ items, refresh }: Options) {
  const [editing, setEditing] = useState<Item | null>(null);

  const editingExclusiveNames = useMemo(
    () => (editing ? uniqueNormalizedNames(items.filter(i => i.id !== editing.id).map(i => i.name)) : new Set<string>()),
    [items, editing]
  );

  const saveEdit = async (
    name: string,
    note: string | null,
    photos: string[],
    amountMinor: number | null,
    quantity: number
  ) => {
    if (!editing) return;
    try {
      await itemRepo.update(editing.id, {
        name,
        note,
        pictures: serializeItemPhotos(photos),
        amount_minor: amountMinor,
        quantity,
      });
      setEditing(null);
    } catch (error) {
      logError(ERROR_SCOPE.updateItem, error);
    }
    void refresh();
  };

  const deleteItem = async () => {
    if (!editing) return;
    try {
      await itemRepo.delete(editing.id);
      setEditing(null);
    } catch (error) {
      logError(ERROR_SCOPE.deleteItem, error);
    }
    void refresh();
  };

  return { editing, setEditing, editingExclusiveNames, saveEdit, deleteItem };
}
