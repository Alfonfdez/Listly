// Minimal shape of the sortable drag-end metadata we need. `react-native-
// sortables` reports the dragged item's `key` and its `fromIndex`/`toIndex`;
// both the lists and collections grids pass these through. Kept structural so
// this helper does not depend on the full `SortableGridDragEndParams<T>`.
interface DragEndLike {
  key?: string;
  fromIndex?: number;
  toIndex?: number;
}

export interface DragMeta {
  draggedId: number;
  fromIndex: number;
  toIndex: number;
}

// Reads the dragged id + indices when the sortable reports valid drag metadata,
// or `null` otherwise (missing key / non-integer indices / undefined params).
// Callers fall back to a plain reorder when this returns `null`, which keeps
// tests and any library release that omits the indices safe.
export function readDragMeta(params?: DragEndLike): DragMeta | null {
  if (params == null || params.key == null) return null;
  if (!Number.isInteger(params.fromIndex) || !Number.isInteger(params.toIndex)) return null;
  return {
    draggedId: Number(params.key),
    fromIndex: params.fromIndex as number,
    toIndex: params.toIndex as number,
  };
}
