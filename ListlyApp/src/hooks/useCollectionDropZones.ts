import { useCallback, useRef, useState } from 'react';
import type { DragStartParams } from 'react-native-sortables';
import { listRepo } from '../database';
import { logError, runSafelyAsync, ERROR_SCOPE } from '../utils/errors';

interface Options {
  refresh: () => Promise<void>;
  inCollectionDetail: boolean;
}

export function useCollectionDropZones({ refresh, inCollectionDetail }: Options) {
  const [hoverCollectionId, setHoverCollectionId] = useState<number | null>(null);
  const [removeTargetActive, setRemoveTargetActive] = useState(false);
  const [removeHover, setRemoveHover] = useState(false);
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
  }, []);

  const handleListsDragEnd = useCallback(
    (ids: number[]) => {
      setRemoveTargetActive(false);
      if (zoneDropHandledRef.current) {
        zoneDropHandledRef.current = false;
        if (pendingMoveRef.current === null) void refresh();
        return;
      }
      if (hoverCollectionIdRef.current !== null) {
        setHoverCollectionId(null);
        hoverCollectionIdRef.current = null;
        void refresh();
        return;
      }
      void (async () => {
        await runSafelyAsync(listRepo.reorder(ids), ERROR_SCOPE.reorderLists);
        await refresh();
      })();
    },
    [refresh]
  );

  // The library does not always fire `onDragEnd` (e.g. a long-press released
  // without a completed reorder). This drop signal clears the drag UI outright.
  const handleActiveItemDropped = useCallback(() => {
    resetDragState();
  }, [resetDragState]);

  const handleListsDragStart = useCallback(
    (params: DragStartParams) => {
      draggingListRef.current = Number(params.key);
      setHoverCollectionId(null);
      hoverCollectionIdRef.current = null;
      setRemoveHover(false);
      setRemoveTargetActive(inCollectionDetail);
    },
    [inCollectionDetail]
  );

  const handleCollectionsDragStart = useCallback(() => {
    draggingListRef.current = null;
    setHoverCollectionId(null);
    hoverCollectionIdRef.current = null;
    setRemoveHover(false);
    setRemoveTargetActive(false);
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
