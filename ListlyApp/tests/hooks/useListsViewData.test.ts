import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react-native';
import { useListsViewData } from '../../src/hooks/useListsViewData';
import { LIST_VIEW_MODES } from '../../src/constants/types';
import type { CollectionWithCounts, Item, ListWithCounts } from '../../src/database/types';

const { reorder } = vi.hoisted(() => ({ reorder: vi.fn(async () => {}) }));

vi.mock('../../src/database', () => ({
  collectionRepo: { reorder },
}));

function list(id: number, name: string, collectionId: number | null = null): ListWithCounts {
  return {
    id,
    name,
    color: '#22D3EE',
    icon: 'cart-outline',
    collection_id: collectionId,
    created_at: 'x',
    position: id,
    pinned: 0,
    kind: 'standard',
    total: 0,
    completed: 0,
  };
}

function collection(id: number, name: string): CollectionWithCounts {
  return { id, name, color: '#A855F7', icon: 'albums-outline', created_at: 'x', position: id, pinned: 0, total: 0, completed: 0 };
}

const noItems = new Map<number, Item[]>();

describe('useListsViewData', () => {
  beforeEach(() => vi.clearAllMocks());

  const base = {
    lists: [list(1, 'Groceries'), list(2, 'Work', 5)],
    collections: [collection(5, 'Home'), collection(6, 'Study')],
    listsByCollectionId: new Map([[5, [list(2, 'Work', 5)]]]),
    baseLists: [list(1, 'Groceries')],
    itemsByListId: noItems,
    query: '',
    refresh: vi.fn(async () => {}),
  };

  it('scopes base lists on Home', async () => {
    const { result } = await renderHook(() => useListsViewData({ ...base, mode: LIST_VIEW_MODES.home }));
    expect(result.current.filteredLists.map(l => l.id)).toEqual([1]);
  });

  it('scopes member lists on a collection detail', async () => {
    const { result } = await renderHook(() =>
      useListsViewData({ ...base, mode: LIST_VIEW_MODES.collection, collectionId: 5 })
    );
    expect(result.current.filteredLists.map(l => l.id)).toEqual([2]);
  });

  it('returns no lists in collections mode', async () => {
    const { result } = await renderHook(() => useListsViewData({ ...base, mode: LIST_VIEW_MODES.collections }));
    expect(result.current.filteredLists).toEqual([]);
  });

  it('scopes all lists in lists mode', async () => {
    const { result } = await renderHook(() => useListsViewData({ ...base, mode: LIST_VIEW_MODES.lists }));
    expect(result.current.filteredLists.map(l => l.id)).toEqual([1, 2]);
  });

  it('filters collections by name', async () => {
    const { result } = await renderHook(() =>
      useListsViewData({ ...base, mode: LIST_VIEW_MODES.home, query: 'stu' })
    );
    expect(result.current.displayCollections.map(c => c.id)).toEqual([6]);
  });

  it('reorders collections and refreshes', async () => {
    const refresh = vi.fn(async () => {});
    const { result } = await renderHook(() =>
      useListsViewData({ ...base, mode: LIST_VIEW_MODES.home, refresh })
    );

    await act(async () => {
      result.current.handleCollectionsDragEnd({ data: [collection(6, 'Study'), collection(5, 'Home')] } as never);
    });

    expect(reorder).toHaveBeenCalledWith([6, 5]);
    expect(refresh).toHaveBeenCalled();
  });
});
