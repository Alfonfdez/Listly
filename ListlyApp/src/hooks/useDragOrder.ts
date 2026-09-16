import { useCallback, useMemo, useState } from 'react';
import type { SortableGridDragEndParams } from 'react-native-sortables';

export function useDragOrder<T extends { id: number }>(
  items: T[],
  onReorder: (ids: number[]) => void
) {
  const [order, setOrder] = useState<number[] | null>(null);

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
