import { useCallback, useRef, useState } from 'react';
import type { DragStartParams } from 'react-native-sortables';
import { listRepository as listRepo } from '../database';

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

  const handleListsDragEnd = useCallback(
    (ids: number[]) => {
      setRemoveTargetActive(false);
      if (zoneDropHandledRef.current) {
        zoneDropHandledRef.current = false;
        if (pendingMoveRef.current === null) void refresh();
        return;
      }
      if (hoverCollectionIdRef.current !== null) {
        void refresh();
        return;
      }
      void listRepo.reorder(ids);
      void refresh();
    },
    [refresh]
  );

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
      void move.then(() => {
        pendingMoveRef.current = null;
        void refresh();
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
    handleZoneEnter,
    handleZoneLeave,
    handleZoneDrop,
    handleRemoveZoneEnter,
    handleRemoveZoneLeave,
    handleRemoveZoneDrop,
  };
}
