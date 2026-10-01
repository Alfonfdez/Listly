import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SortableGridDragEndParams } from 'react-native-sortables';

export function useDragOrder<T extends { id: number }>(
  items: T[],
  onReorder: (ids: number[]) => void
) {
  const [order, setOrder] = useState<number[] | null>(null);

  // The optimistic order is only valid for the item set it was produced from.
  // When that set changes (an item was added, removed, or moved out of the
  // section, e.g. dragged into a collection), drop it so `display` falls back
  // to the canonical order and the sortable grid re-lays-out (otherwise a stale
  // order leaves an empty gap where the removed item used to be).
  const idsKey = items.map(item => item.id).join(',');
  useEffect(() => {
    setOrder(current => {
      if (!current) return current;
      const sameSet =
        current.length === items.length &&
        [...current].sort((a, b) => a - b).join(',') ===
          items.map(item => item.id).sort((a, b) => a - b).join(',');
      return sameSet ? current : null;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  const display = useMemo(() => {
    if (!order) return items;
    const byId = new Map(items.map(item => [item.id, item]));
    const next = order
      .map(id => byId.get(id))
      .filter((item): item is T => Boolean(item));
    return next.length === items.length ? next : items;
  }, [items, order]);

  const onDragEnd = useCallback(
    ({ data }: SortableGridDragEndParams<T>) => {
      const ids = data.map(item => item.id);
      if (ids.length !== items.length || ids.every((id, i) => id === items[i].id)) {
        return;
      }
      setOrder(ids);
      onReorder(ids);
    },
    [items, onReorder]
  );

  return { display, onDragEnd };
}
