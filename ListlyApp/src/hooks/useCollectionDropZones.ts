import { useCallback, useRef, useState } from 'react';
import type { DragStartParams, SortableGridDragEndParams } from 'react-native-sortables';
import { listRepo } from '../database';
import { logError, runSafelyAsync, ERROR_SCOPE } from '../utils/errors';
import { resolvePinOnDrop } from '../utils/pinDrop';

interface PinnableItem {
  id: number;
  pinned: 0 | 1;
}

interface Options {
  refresh: () => Promise<void>;
  inCollectionDetail: boolean;
  // Pre-drop display order (pinned-first) of the section's items — used to
  // resolve a cross-boundary pin toggle on drop (spec 021 "A2"). Optional so
  // callers/tests that don't exercise pinning can omit it.
  items?: PinnableItem[];
}

export function useCollectionDropZones({ refresh, inCollectionDetail, items = [] }: Options) {
  const [hoverCollectionId, setHoverCollectionId] = useState<number | null>(null);
  const [removeTargetActive, setRemoveTargetActive] = useState(false);
  const [removeHover, setRemoveHover] = useState(false);
  // Reactive drag flag (unlike `draggingListRef`): a grid/list is being
  // long-press-dragged. The view uses it to freeze the sortable grid `key`
  // during a gesture so an in-flight reorder never forces a mid-drag remount.
  const [isDragging, setIsDragging] = useState(false);
  // Reactively exposes which item is being dragged (lists only) so the view can
  // show the pinned-zone highlight while a non-pinned card is dragged.
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const hoverCollectionIdRef = useRef<number | null>(null);
  const draggingListRef = useRef<number | null>(null);
  const zoneDropHandledRef = useRef(false);
  const pendingMoveRef = useRef<Promise<void> | null>(null);

  // Clears all drag-UI state without touching persistence. Used when a drag
  // ends (drop or release) so the remove target / hovered zone can never stick.
  const resetDragState = useCallback(() => {
    setRemoveTargetActive(false);
    setRemoveHover(false);
    setHoverCollectionId(null);
    hoverCollectionIdRef.current = null;
    setIsDragging(false);
    setDraggingId(null);
  }, []);

  const handleListsDragEnd = useCallback(
    (ids: number[], params?: SortableGridDragEndParams<PinnableItem>) => {
      setRemoveTargetActive(false);
      if (zoneDropHandledRef.current) {
        zoneDropHandledRef.current = false;
        setIsDragging(false);
        setDraggingId(null);
        if (pendingMoveRef.current === null) void refresh();
        return;
      }
      if (hoverCollectionIdRef.current !== null) {
        setHoverCollectionId(null);
        hoverCollectionIdRef.current = null;
        setIsDragging(false);
        setDraggingId(null);
        void refresh();
        return;
      }
      // A cross-boundary drop toggles the dragged item's pin (spec 021 "A2").
      // Requires valid drag metadata; otherwise fall back to a plain reorder.
      const hasDragMeta =
        params != null &&
        params.key != null &&
        Number.isInteger(params.fromIndex) &&
        Number.isInteger(params.toIndex);
      const draggedId = hasDragMeta ? Number(params.key) : draggingListRef.current;
      const pin = hasDragMeta ? resolvePinOnDrop(items, params.fromIndex, params.toIndex) : null;
      void (async () => {
        try {
          if (draggedId !== null) {
            await runSafelyAsync(
              listRepo.reorderFromDrag(ids, draggedId, pin),
              ERROR_SCOPE.reorderLists
            );
          } else {
            await runSafelyAsync(listRepo.reorder(ids), ERROR_SCOPE.reorderLists);
          }
          await refresh();
        } finally {
          // Clear only after the reorder + refresh resolve, so the grid's frozen
          // key adopts the new order once the data is consistent (no race).
          setIsDragging(false);
          setDraggingId(null);
        }
      })();
    },
    [refresh, items]
  );

  // The library does not always fire `onDragEnd` (e.g. a long-press released
  // without a completed reorder). This drop signal clears the drag UI outright.
  const handleActiveItemDropped = useCallback(() => {
    resetDragState();
  }, [resetDragState]);

  const handleListsDragStart = useCallback(
    (params: DragStartParams) => {
      draggingListRef.current = Number(params.key);
      setDraggingId(Number(params.key));
      setHoverCollectionId(null);
      hoverCollectionIdRef.current = null;
      setRemoveHover(false);
      setRemoveTargetActive(inCollectionDetail);
      setIsDragging(true);
    },
    [inCollectionDetail]
  );

  const handleCollectionsDragStart = useCallback(() => {
    draggingListRef.current = null;
    setDraggingId(null);
    setHoverCollectionId(null);
    hoverCollectionIdRef.current = null;
    setRemoveHover(false);
    setRemoveTargetActive(false);
    setIsDragging(true);
  }, []);

  const handleRemoveZoneEnter = useCallback(() => {
    if (draggingListRef.current === null) return;
    setRemoveHover(true);
  }, []);

  const handleRemoveZoneLeave = useCallback(() => {
    setRemoveHover(false);
  }, []);

  const performZoneDrop = useCallback(
    (action: (listId: number) => Promise<void>) => {
      const listId = draggingListRef.current;
      if (listId === null) return;
      draggingListRef.current = null;
      zoneDropHandledRef.current = true;
      const move = action(listId);
      pendingMoveRef.current = move;
      void move
        .then(() => {
          void refresh();
        })
        .catch(error => logError(ERROR_SCOPE.moveList, error))
        .finally(() => {
          pendingMoveRef.current = null;
        });
    },
    [refresh]
  );

  const handleRemoveZoneDrop = useCallback(() => {
    setRemoveHover(false);
    setRemoveTargetActive(false);
    performZoneDrop(id => listRepo.removeFromCollection(id));
  }, [performZoneDrop]);

  const handleZoneEnter = useCallback((collectionId: number) => {
    if (draggingListRef.current === null) return;
    setHoverCollectionId(collectionId);
    hoverCollectionIdRef.current = collectionId;
  }, []);

  const handleZoneLeave = useCallback(() => {
    setHoverCollectionId(null);
    hoverCollectionIdRef.current = null;
  }, []);

  const handleZoneDrop = useCallback(
    (collectionId: number) => {
      setHoverCollectionId(null);
      hoverCollectionIdRef.current = null;
      performZoneDrop(id => listRepo.moveToCollection(id, collectionId));
    },
    [performZoneDrop]
  );

  return {
    hoverCollectionId,
    removeTargetActive,
    removeHover,
    isDragging,
    draggingId,
    handleListsDragStart,
    handleCollectionsDragStart,
    handleListsDragEnd,
    handleActiveItemDropped,
    resetDragState,
    handleZoneEnter,
    handleZoneLeave,
    handleZoneDrop,
    handleRemoveZoneEnter,
    handleRemoveZoneLeave,
    handleRemoveZoneDrop,
  };
}
