import { useCollectionDropZones } from './useCollectionDropZones';
import { useDragOrder } from './useDragOrder';
import type { ListWithCounts } from '../database/types';

interface Options {
  refresh: () => Promise<void>;
  inCollectionDetail: boolean;
  filteredLists: ListWithCounts[];
}

export function useListsDrag({ refresh, inCollectionDetail, filteredLists }: Options) {
  const dropZones = useCollectionDropZones({ refresh, inCollectionDetail, items: filteredLists });
  const { display: displayLists, onDragEnd: handleDragEnd } = useDragOrder(
    filteredLists,
    dropZones.handleListsDragEnd
  );

  return { displayLists, handleDragEnd, ...dropZones };
}
