import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react-native';
import { useListsDrag } from '../../src/hooks/useListsDrag';
import type { ListWithCounts } from '../../src/database/types';

const { reorder, moveToCollection, removeFromCollection } = vi.hoisted(() => ({
  reorder: vi.fn(async () => {}),
  moveToCollection: vi.fn(async () => {}),
  removeFromCollection: vi.fn(async () => {}),
}));

vi.mock('../../src/database', () => ({
  listRepo: { reorder, moveToCollection, removeFromCollection },
}));

function list(id: number): ListWithCounts {
  return {
    id,
    name: `L${id}`,
    color: '#22D3EE',
    icon: 'cart-outline',
    collection_id: null,
    created_at: 'x',
    position: id,
    pinned: 0,
    kind: 'standard',
    total: 0,
    completed: 0,
  };
}

type Params = { key: string; fromIndex: number; indexToKey: string[]; keyToIndex: Record<string, number> };

function dragStart(key: string): Params {
  return { key, fromIndex: 0, indexToKey: [key], keyToIndex: {} };
}

describe('useListsDrag', () => {
  beforeEach(() => vi.clearAllMocks());

  it('reorders lists on drag end when there is no zone interaction', async () => {
    const refresh = vi.fn(async () => {});
    const { result } = await renderHook(() =>
      useListsDrag({ refresh, inCollectionDetail: false, filteredLists: [list(1), list(2)] })
    );

    await act(async () => {
      result.current.handleDragEnd({ data: [list(2), list(1)] } as never);
    });

    expect(reorder).toHaveBeenCalledWith([2, 1]);
    expect(refresh).toHaveBeenCalled();
  });

  it('exposes the drop-zone state and handlers', async () => {
    const refresh = vi.fn(async () => {});
    const { result } = await renderHook(() =>
      useListsDrag({ refresh, inCollectionDetail: true, filteredLists: [list(1)] })
    );

    await act(() => result.current.handleListsDragStart(dragStart('1')));
    expect(result.current.removeTargetActive).toBe(true);

    await act(() => result.current.handleZoneEnter(7));
    expect(result.current.hoverCollectionId).toBe(7);

    await act(async () => {
      result.current.handleZoneDrop(7);
    });
    expect(moveToCollection).toHaveBeenCalledWith(1, 7);
  });

  it('removes a list from its collection via the remove zone', async () => {
    const refresh = vi.fn(async () => {});
    const { result } = await renderHook(() =>
      useListsDrag({ refresh, inCollectionDetail: true, filteredLists: [list(3)] })
    );

    await act(() => result.current.handleListsDragStart(dragStart('3')));
    await act(async () => {
      result.current.handleRemoveZoneDrop();
    });

    expect(removeFromCollection).toHaveBeenCalledWith(3);
  });

  it('keeps the optimistic display order after a drag', async () => {
    const refresh = vi.fn(async () => {});
    const { result } = await renderHook(() =>
      useListsDrag({ refresh, inCollectionDetail: false, filteredLists: [list(1), list(2)] })
    );

    await act(async () => {
      result.current.handleDragEnd({ data: [list(2), list(1)] } as never);
    });

    expect(result.current.displayLists.map(l => l.id)).toEqual([2, 1]);
  });
});
