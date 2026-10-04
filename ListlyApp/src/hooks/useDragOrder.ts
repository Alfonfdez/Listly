import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SortableGridDragEndParams } from 'react-native-sortables';

export function useDragOrder<T extends { id: number }>(
  items: T[],
  onReorder: (ids: number[], params: SortableGridDragEndParams<T>) => void
) {
  const [order, setOrder] = useState<number[] | null>(null);

  // Drop the optimistic order whenever the incoming items no longer match it.
  // This covers both:
  //   - set changes (add/remove/move-out), and
  //   - order-only changes from outside the drag (pin/unpin floats items, or an
  //     external reorder), which previously left the grid laid out from a stale
  //     sequence and could make pinned cards overlap the others.
  // After our own drag, `onDragEnd` sets `order` to the dragged ids and the
  // subsequent refresh returns items in that same order, so it is kept.
  const idsKey = items.map(item => item.id).join(',');
  useEffect(() => {
    setOrder(current => {
      if (!current) return current;
      return idsKey === current.join(',') ? current : null;
    });
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
    (params: SortableGridDragEndParams<T>) => {
      const ids = params.data.map(item => item.id);
      if (ids.length !== items.length || ids.every((id, i) => id === items[i].id)) {
        return;
      }
      setOrder(ids);
      onReorder(ids, params);
    },
    [items, onReorder]
  );

  return { display, onDragEnd };
}
