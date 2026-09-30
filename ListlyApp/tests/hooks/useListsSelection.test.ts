import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react-native';
import { useListsSelection } from '../../src/hooks/useListsSelection';
import type { CollectionWithCounts, ListWithCounts } from '../../src/database/types';

const { setPinnedList, setPinnedCollection } = vi.hoisted(() => ({
  setPinnedList: vi.fn(async () => {}),
  setPinnedCollection: vi.fn(async () => {}),
}));

vi.mock('../../src/database', () => ({
  listRepo: { setPinned: setPinnedList },
  collectionRepo: { setPinned: setPinnedCollection },
}));

function list(id: number, pinned: 0 | 1 = 0): ListWithCounts {
  return {
    id,
    name: `L${id}`,
    color: '#22D3EE',
    icon: 'cart-outline',
    collection_id: null,
    created_at: 'x',
    position: id,
    pinned,
    kind: 'standard',
    total: 0,
    completed: 0,
  };
}

function collection(id: number, pinned: 0 | 1 = 0): CollectionWithCounts {
  return { id, name: `C${id}`, color: '#A855F7', icon: 'albums-outline', created_at: 'x', position: id, pinned, total: 0, completed: 0 };
}

describe('useListsSelection', () => {
  beforeEach(() => vi.clearAllMocks());

  it('derives the selected items', async () => {
    const { result } = await renderHook(() =>
      useListsSelection({
        lists: [list(1), list(2)],
        collections: [collection(5)],
        selectedIds: new Set([2]),
        selectedCollectionIds: new Set([5]),
        refresh: vi.fn(async () => {}),
      })
    );

    expect(result.current.selectedListItems.map(l => l.id)).toEqual([2]);
    expect(result.current.selectedCollectionItems.map(c => c.id)).toEqual([5]);
  });

  it('reports allSelectedPinned only when every selection is pinned', async () => {
    const refresh = vi.fn(async () => {});
    const { result } = await renderHook(() =>
      useListsSelection({
        lists: [list(1, 1), list(2, 0)],
        collections: [],
        selectedIds: new Set([1, 2]),
        selectedCollectionIds: new Set(),
        refresh,
      })
    );
    expect(result.current.allSelectedPinned).toBe(false);

    const all = await renderHook(() =>
      useListsSelection({
        lists: [list(1, 1), list(2, 1)],
        collections: [],
        selectedIds: new Set([1, 2]),
        selectedCollectionIds: new Set(),
        refresh,
      })
    );
    expect(all.result.current.allSelectedPinned).toBe(true);
  });

  it('pins the selection when not all pinned', async () => {
    const refresh = vi.fn(async () => {});
    const { result } = await renderHook(() =>
      useListsSelection({
        lists: [list(1, 0)],
        collections: [collection(5, 0)],
        selectedIds: new Set([1]),
        selectedCollectionIds: new Set([5]),
        refresh,
      })
    );

    await act(async () => {
      result.current.handlePinPress();
    });

    expect(setPinnedList).toHaveBeenCalledWith(1, true);
    expect(setPinnedCollection).toHaveBeenCalledWith(5, true);
    expect(refresh).toHaveBeenCalled();
  });

  it('unpins the selection when all pinned', async () => {
    const refresh = vi.fn(async () => {});
    const { result } = await renderHook(() =>
      useListsSelection({
        lists: [list(1, 1)],
        collections: [],
        selectedIds: new Set([1]),
        selectedCollectionIds: new Set(),
        refresh,
      })
    );

    await act(async () => {
      result.current.handlePinPress();
    });

    expect(setPinnedList).toHaveBeenCalledWith(1, false);
  });

  it('is a no-op when nothing is selected', async () => {
    const refresh = vi.fn(async () => {});
    const { result } = await renderHook(() =>
      useListsSelection({
        lists: [list(1)],
        collections: [],
        selectedIds: new Set(),
        selectedCollectionIds: new Set(),
        refresh,
      })
    );

    await act(async () => {
      result.current.handlePinPress();
    });

    expect(setPinnedList).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });
});
