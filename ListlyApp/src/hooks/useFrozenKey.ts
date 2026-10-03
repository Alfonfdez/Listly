import { useRef } from 'react';

// Returns `key` normally, but holds the last value while `frozen` is true so a
// sortable grid is not remounted mid-gesture. Once the gesture ends, the latest
// key is adopted (remount/re-measure) on the next render.
//
// Used by the lists/collections sortable grids: their `key` is derived from the
// ordered item ids so an external order change (pin/unpin, reorder) remounts and
// re-measures them, while an in-flight drag freezes the key to avoid a mid-drag
// remount/flicker.
export function useFrozenKey(key: string, frozen: boolean): string {
  const ref = useRef(key);
  if (!frozen) ref.current = key;
  return ref.current;
}
