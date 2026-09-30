import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react-native';
import { useCollectionDropZones } from '../../src/hooks/useCollectionDropZones';

const { reorder, moveToCollection, removeFromCollection } = vi.hoisted(() => ({
  reorder: vi.fn(async () => {}),
  moveToCollection: vi.fn(async () => {}),
  removeFromCollection: vi.fn(async () => {}),
}));

vi.mock('../../src/database', () => ({
  listRepo: {
    reorder,
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
});
