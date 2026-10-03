import { isOn } from './flags';

// Decides the new `pinned` value for a single item dragged within a
// pinned-first list/collection grid.
//
// Rules (product spec 021 §5, "A2"):
//   - Pinned items always render first (`desc(pinned), position`).
//   - Dropping an UNPINNED item at or above the pinned block pins it.
//   - Dropping a PINNED item below the pinned block unpins it.
//   - Any other move keeps the item's current pin flag.
//
// `items` is the PRE-DROP display order (already pinned-first) with each item's
// current `pinned` flag. `fromIndex` is where the dragged item started and
// `toIndex` where it landed (both indices into the same pre-drop array, as the
// sortable grid reports them).
//
// Returns the new pin flag when it changes, or `null` when it stays the same
// (including group drags / out-of-range indices, which callers treat as a plain
// reorder with no pin change).
export function resolvePinOnDrop<T extends { pinned: 0 | 1 }>(
  items: T[],
  fromIndex: number,
  toIndex: number
): boolean | null {
  if (items.length === 0) return null;
  if (fromIndex < 0 || fromIndex >= items.length) return null;
  if (toIndex < 0 || toIndex >= items.length) return null;

  const dragged = items[fromIndex];
  const wasPinned = isOn(dragged.pinned);
  const pinnedCount = items.reduce((n, item) => n + (isOn(item.pinned) ? 1 : 0), 0);

  if (!wasPinned) {
    // Unpinned item: pin it when it lands at or above the pinned block. The
    // block occupies the first `pinnedCount` slots, so any strictly-inside or
    // boundary index (toIndex < pinnedCount) pins it.
    return toIndex < pinnedCount ? true : null;
  }

  // Pinned item: unpin it only when there is an unpinned area to drop into and
  // it lands below the pinned block. After removing the dragged item, the
  // remaining pinned items occupy the first `pinnedCount - 1` slots; landing at
  // index >= pinnedCount - 1 places it after all of them (below the block). If
  // everything is pinned there is no unpinned area, so the flag is unchanged.
  if (pinnedCount >= items.length) return null;
  return toIndex >= pinnedCount - 1 ? false : null;
}
