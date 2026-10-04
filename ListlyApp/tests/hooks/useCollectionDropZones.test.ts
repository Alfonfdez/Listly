import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react-native';
import { useCollectionDropZones } from '../../src/hooks/useCollectionDropZones';

const { reorder, reorderFromDrag, moveToCollection, removeFromCollection } = vi.hoisted(() => ({
  reorder: vi.fn(async () => {}),
  reorderFromDrag: vi.fn(async () => {}),
  moveToCollection: vi.fn(async () => {}),
  removeFromCollection: vi.fn(async () => {}),
}));

vi.mock('../../src/database', () => ({
  listRepo: {
    reorder,
    reorderFromDrag,
    moveToCollection,
    removeFromCollection,
  },
}));

type Params = { key: string; fromIndex: number; indexToKey: string[]; keyToIndex: Record<string, number> };

function dragStart(key: string): Params {
  return { key, fromIndex: 0, indexToKey: [key], keyToIndex: {} };
}

describe('useCollectionDropZones', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it('reorders on drag end when there is no zone interaction', async () => {
    const refresh = vi.fn(async () => {});
    const { result } = await renderHook(() => useCollectionDropZones({ refresh, inCollectionDetail: false }));

    await act(async () => {
      result.current.handleListsDragEnd([3, 1, 2]);
    });

    expect(reorder).toHaveBeenCalledWith([3, 1, 2]);
    expect(refresh).toHaveBeenCalled();
  });

  it('sets removeTargetActive from inCollectionDetail on list drag start', async () => {
    const refresh = vi.fn(async () => {});
    const { result } = await renderHook(() => useCollectionDropZones({ refresh, inCollectionDetail: true }));

    await act(() => result.current.handleListsDragStart(dragStart('1')));
    expect(result.current.removeTargetActive).toBe(true);

    await act(() => result.current.handleCollectionsDragStart());
    expect(result.current.removeTargetActive).toBe(false);
  });

  it('reports isDragging while a drag is active and clears it on drag end', async () => {
    const refresh = vi.fn(async () => {});
    const { result } = await renderHook(() => useCollectionDropZones({ refresh, inCollectionDetail: false }));

    expect(result.current.isDragging).toBe(false);

    await act(() => result.current.handleListsDragStart(dragStart('1')));
    expect(result.current.isDragging).toBe(true);

    await act(async () => {
      result.current.handleListsDragEnd([1, 2]);
    });
    expect(result.current.isDragging).toBe(false);
  });

  it('clears isDragging when a list drag starts and a collections drag is not active', async () => {
    const refresh = vi.fn(async () => {});
    const { result } = await renderHook(() => useCollectionDropZones({ refresh, inCollectionDetail: false }));

    await act(() => result.current.handleCollectionsDragStart());
    expect(result.current.isDragging).toBe(true);

    await act(() => result.current.handleActiveItemDropped());
    expect(result.current.isDragging).toBe(false);
  });

  it('clears the drag UI when the active item is dropped (drag end without a reorder)', async () => {
    const refresh = vi.fn(async () => {});
    const { result } = await renderHook(() => useCollectionDropZones({ refresh, inCollectionDetail: true }));

    await act(() => result.current.handleListsDragStart(dragStart('1')));
    await act(() => result.current.handleZoneEnter(10));
    expect(result.current.removeTargetActive).toBe(true);
    expect(result.current.hoverCollectionId).toBe(10);

    await act(() => result.current.handleActiveItemDropped());

    expect(result.current.removeTargetActive).toBe(false);
    expect(result.current.hoverCollectionId).toBeNull();
    expect(result.current.removeHover).toBe(false);
    expect(reorder).not.toHaveBeenCalled();
  });

  it('tracks the hovered collection only while dragging a list', async () => {
    const refresh = vi.fn(async () => {});
    const { result } = await renderHook(() => useCollectionDropZones({ refresh, inCollectionDetail: false }));

    await act(() => result.current.handleZoneEnter(10));
    expect(result.current.hoverCollectionId).toBeNull();

    await act(() => result.current.handleListsDragStart(dragStart('5')));
    await act(() => result.current.handleZoneEnter(10));
    expect(result.current.hoverCollectionId).toBe(10);

    await act(() => result.current.handleZoneLeave());
    expect(result.current.hoverCollectionId).toBeNull();
  });

  it('moves the dragged list into a collection on zone drop', async () => {
    const refresh = vi.fn(async () => {});
    const { result } = await renderHook(() => useCollectionDropZones({ refresh, inCollectionDetail: false }));

    await act(() => result.current.handleListsDragStart(dragStart('5')));
    await act(() => result.current.handleZoneEnter(10));
    await act(async () => {
      result.current.handleZoneDrop(10);
    });

    expect(moveToCollection).toHaveBeenCalledWith(5, 10);
    expect(refresh).toHaveBeenCalled();
    expect(result.current.hoverCollectionId).toBeNull();
  });

  it('removes the dragged list from its collection on remove-zone drop', async () => {
    const refresh = vi.fn(async () => {});
    const { result } = await renderHook(() => useCollectionDropZones({ refresh, inCollectionDetail: true }));

    await act(() => result.current.handleListsDragStart(dragStart('7')));
    await act(() => result.current.handleRemoveZoneEnter());
    expect(result.current.removeHover).toBe(true);

    await act(async () => {
      result.current.handleRemoveZoneDrop();
    });

    expect(removeFromCollection).toHaveBeenCalledWith(7);
    expect(refresh).toHaveBeenCalled();
    expect(result.current.removeHover).toBe(false);
    expect(result.current.removeTargetActive).toBe(false);
  });

  it('does not reorder after a zone drop handled the drag', async () => {
    const refresh = vi.fn(async () => {});
    const { result } = await renderHook(() => useCollectionDropZones({ refresh, inCollectionDetail: false }));

    await act(() => result.current.handleListsDragStart(dragStart('5')));
    await act(() => result.current.handleZoneEnter(10));
    await act(async () => {
      result.current.handleZoneDrop(10);
    });
    reorder.mockClear();
    refresh.mockClear();

    await act(() => result.current.handleListsDragEnd([5]));

    expect(reorder).not.toHaveBeenCalled();
    expect(refresh).toHaveBeenCalled();
  });

  it('refreshes (without reordering) when the drag ended over a hovered collection', async () => {
    const refresh = vi.fn(async () => {});
    const { result } = await renderHook(() => useCollectionDropZones({ refresh, inCollectionDetail: false }));

    await act(() => result.current.handleListsDragStart(dragStart('5')));
    await act(() => result.current.handleZoneEnter(10));
    reorder.mockClear();
    refresh.mockClear();

    await act(() => result.current.handleListsDragEnd([5]));

    expect(reorder).not.toHaveBeenCalled();
    expect(refresh).toHaveBeenCalled();
  });

  it('logs move failures and still clears the pending move', async () => {
    moveToCollection.mockRejectedValueOnce(new Error('boom'));
    const refresh = vi.fn(async () => {});
    const { result } = await renderHook(() => useCollectionDropZones({ refresh, inCollectionDetail: false }));

    await act(() => result.current.handleListsDragStart(dragStart('5')));
    await act(() => result.current.handleZoneEnter(10));
    await act(async () => {
      result.current.handleZoneDrop(10);
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(errorSpy).toHaveBeenCalled();
  });

  it('reorderFromDrag with a pin when an unpinned list is dropped above the block', async () => {
    const items = [{ id: 1, pinned: 1 as const }, { id: 2, pinned: 0 as const }, { id: 3, pinned: 0 as const }];
    const refresh = vi.fn(async () => {});
    const { result } = await renderHook(() =>
      useCollectionDropZones({ refresh, inCollectionDetail: false, items })
    );

    // item 2 (unpinned, index 1) dropped first (index 0) → pin
    await act(async () => {
      result.current.handleListsDragEnd([2, 1, 3], {
        key: '2',
        fromIndex: 1,
        toIndex: 0,
        indexToKey: ['2', '1', '3'],
        keyToIndex: { 2: 0, 1: 1, 3: 2 },
        data: [items[1], items[0], items[2]],
      });
    });

    expect(reorderFromDrag).toHaveBeenCalledWith([2, 1, 3], 2, true);
    expect(reorder).not.toHaveBeenCalled();
  });

  it('reorderFromDrag with an unpin when a pinned list is dropped below the block', async () => {
    const items = [{ id: 1, pinned: 1 as const }, { id: 2, pinned: 0 as const }, { id: 3, pinned: 0 as const }];
    const refresh = vi.fn(async () => {});
    const { result } = await renderHook(() =>
      useCollectionDropZones({ refresh, inCollectionDetail: false, items })
    );

    // item 1 (pinned, index 0) dropped last (index 2) → unpin
    await act(async () => {
      result.current.handleListsDragEnd([2, 3, 1], {
        key: '1',
        fromIndex: 0,
        toIndex: 2,
        indexToKey: ['2', '3', '1'],
        keyToIndex: { 2: 0, 3: 1, 1: 2 },
        data: [items[1], items[2], items[0]],
      });
    });

    expect(reorderFromDrag).toHaveBeenCalledWith([2, 3, 1], 1, false);
  });

  it('falls back to a plain reorder when drag metadata is missing', async () => {
    const refresh = vi.fn(async () => {});
    const { result } = await renderHook(() =>
      useCollectionDropZones({ refresh, inCollectionDetail: false, items: [{ id: 1, pinned: 0 }] })
    );

    await act(async () => {
      result.current.handleListsDragEnd([2, 1]);
    });

    expect(reorder).toHaveBeenCalledWith([2, 1]);
    expect(reorderFromDrag).not.toHaveBeenCalled();
  });

  it('exposes draggingId during a drag and clears it after', async () => {
    const refresh = vi.fn(async () => {});
    const { result } = await renderHook(() =>
      useCollectionDropZones({ refresh, inCollectionDetail: false, items: [{ id: 1, pinned: 0 }] })
    );

    await act(() => result.current.handleListsDragStart(dragStart('7')));
    expect(result.current.draggingId).toBe(7);

    await act(async () => {
      result.current.handleListsDragEnd([7]);
    });
    expect(result.current.draggingId).toBeNull();
  });
});
