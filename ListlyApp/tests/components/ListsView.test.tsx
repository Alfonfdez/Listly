import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { render, fireEvent, waitFor, act, within } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import ListsView, { type ListsViewVariant, type ListViewMode } from '../../src/components/ListsView';
import { buildAppMock, setItemsByListId, setLists, setBaseLists, setCollections, setListsByCollectionId, resetAppStub } from '../helpers/appStub';
import { resetStub } from '../helpers/configStub';
import { getZoneHandlers, resetZoneHandlers, fireGridDragEnd, fireGridDragStart, lastGrid } from '../mocks/react-native-sortables';
import { listRepository, collectionRepository } from '../../src/database';
import type { CollectionWithCounts, Item, ListWithCounts } from '../../src/database/types';

vi.mock('expo-sqlite', () => ({ openDatabaseSync: vi.fn() }));

vi.mock('../../src/context/AppContext', () => ({
  useApp: () => buildAppMock(),
  AppProvider: ({ children }: { children: ReactNode }) => children as ReactNode,
}));

vi.mock('../../src/database', () => ({
  listRepository: { deleteMany: vi.fn(async () => {}), reorder: vi.fn(async () => {}), moveToCollection: vi.fn(async () => {}), removeFromCollection: vi.fn(async () => {}), setPinned: vi.fn(async () => {}) },
  itemRepository: {},
  collectionRepository: { deleteMany: vi.fn(async () => {}), reorder: vi.fn(async () => {}), setPinned: vi.fn(async () => {}) },
}));

const nav = { navigate: vi.fn() };

vi.mock('@react-navigation/native', async () => {
  const React = await import('react');
  return {
    useNavigation: () => nav,
    useFocusEffect: (cb: () => void | (() => void)) => {
      React.useEffect(cb, [cb]);
    },
  };
});

const LISTS: ListWithCounts[] = [
  { id: 1, name: 'Groceries', color: '#22D3EE', icon: 'cart-outline', collection_id: null, created_at: 'x', position: 0, pinned: 0, total: 5, completed: 2 },
  { id: 2, name: 'Work Tasks', color: '#34D399', icon: 'briefcase-outline', collection_id: null, created_at: 'x', position: 1, pinned: 0, total: 2, completed: 0 },
];

function items(names: string[]): Item[] {
  return names.map((name, i) => ({ id: i + 1, list_id: 1, name, checked: 0, note: null, position: i, created_at: 'x', pictures: null }));
}

interface Overrides {
  variant?: ListsViewVariant;
  collectionsVariant?: ListsViewVariant;
  mode?: ListViewMode;
  collectionId?: number;
  searchActive?: boolean;
  query?: string;
  selectMode?: boolean;
  selectedIds?: ReadonlySet<number>;
  selectedCollectionIds?: ReadonlySet<number>;
  deleteConfirmVisible?: boolean;
}

function renderView(overrides: Overrides = {}) {
  const props = {
    variant: overrides.variant ?? 'grid',
    collectionsVariant: overrides.collectionsVariant ?? 'grid',
    mode: overrides.mode ?? 'home',
    collectionId: overrides.collectionId,
    searchActive: overrides.searchActive ?? false,
    query: overrides.query ?? '',
    onQueryChange: vi.fn(),
    onSearchClose: vi.fn(),
    selectMode: overrides.selectMode ?? false,
    selectedIds: overrides.selectedIds ?? new Set<number>(),
    selectedCollectionIds: overrides.selectedCollectionIds ?? new Set<number>(),
    onToggleItem: vi.fn(),
    onToggleCollection: vi.fn(),
    onOpenDeleteConfirm: vi.fn(),
    onExitSelectMode: vi.fn(),
    deleteConfirmVisible: overrides.deleteConfirmVisible ?? false,
    onCancelDeleteConfirm: vi.fn(),
    onConfirmDelete: vi.fn(),
    selectedCount: (overrides.selectedIds?.size ?? 0) + (overrides.selectedCollectionIds?.size ?? 0),
  };
  return render(<ListsView {...props} />);
}

const COLLECTIONS: CollectionWithCounts[] = [
  { id: 10, name: 'Shopping', color: '#A78BFA', icon: 'cart-outline', created_at: 'x', position: 0, pinned: 0, total: 5, completed: 2 },
];

describe('ListsView', () => {
  beforeEach(() => {
    resetStub();
    resetAppStub();
    resetZoneHandlers();
    vi.mocked(listRepository.moveToCollection).mockClear();
    vi.mocked(listRepository.removeFromCollection).mockClear();
    vi.mocked(listRepository.reorder).mockClear();
    vi.mocked(listRepository.deleteMany).mockClear();
    vi.mocked(collectionRepository.reorder).mockClear();
    vi.mocked(collectionRepository.deleteMany).mockClear();
    vi.mocked(listRepository.setPinned).mockClear();
    vi.mocked(collectionRepository.setPinned).mockClear();
    nav.navigate.mockClear();
    setLists(LISTS);
    setBaseLists(LISTS);
    setItemsByListId(new Map([[1, items(['Milk', 'Coffee beans'])]]));
  });

  afterEach(() => {
    resetAppStub();
  });

  it('renders grid tiles with name and progress', async () => {
    const view = await renderView();
    expect(await view.findByText('Groceries')).toBeTruthy();
    expect(view.getByText('Work Tasks')).toBeTruthy();
    expect(view.getByText('2/5')).toBeTruthy();
    expect(view.getByText('0/2')).toBeTruthy();
  });

  it('renders rows for the list variant', async () => {
    const view = await renderView({ variant: 'list' });
    expect(await view.findByText('Groceries')).toBeTruthy();
    expect(view.getByText('Work Tasks')).toBeTruthy();
  });

  it('shows the search bar when search is active and filters by query', async () => {
    const view = await renderView({ searchActive: true, query: 'Coffee' });
    expect(await view.findByPlaceholderText('Search lists and items...')).toBeTruthy();
    expect(await waitFor(() => view.getByText('Groceries'))).toBeTruthy();
    expect(view.queryByText('Work Tasks')).toBeNull();
  });

  it('shows the no-results message when the query matches nothing', async () => {
    const view = await renderView({ searchActive: true, query: 'wallet' });
    expect(await view.findByText('No results found')).toBeTruthy();
  });

  it('hides the FAB and shows the select action bar in select mode', async () => {
    const view = await renderView({ selectMode: true, selectedIds: new Set([1]) });
    expect(view.queryByLabelText('Add list')).toBeNull();
    expect(await view.findByText('1 selected')).toBeTruthy();
    expect(view.getByText('Cancel')).toBeTruthy();
    expect(view.getByText('Delete')).toBeTruthy();
  });

  it('calls onToggleItem when a tile is tapped in select mode', async () => {
const onToggleItem = vi.fn();
    const onExitSelectMode = vi.fn();
    const view = await render(
      <ListsView
        mode="home"
        variant="grid"
        collectionsVariant="grid"
        searchActive={false}
        query=""
        onQueryChange={vi.fn()}
        onSearchClose={vi.fn()}
        selectMode
        selectedIds={new Set([1])}
        selectedCollectionIds={new Set()}
        onToggleItem={onToggleItem}
        onToggleCollection={vi.fn()}
        onOpenDeleteConfirm={vi.fn()}
        onExitSelectMode={onExitSelectMode}
        deleteConfirmVisible={false}
        onCancelDeleteConfirm={vi.fn()}
        onConfirmDelete={vi.fn()}
        selectedCount={1}
      />
    );
    await view.findByText('Groceries');
    fireEvent.press(view.getByRole('checkbox', { name: /Groceries/ }));
    expect(onToggleItem).toHaveBeenCalledWith(1);
  });

  it('opens the delete confirmation modal from the action bar', async () => {
    const onOpenDeleteConfirm = vi.fn();
    const view = await render(
      <ListsView
        variant="grid"
        collectionsVariant="grid"
        mode="home"
        searchActive={false}
        query=""
        onQueryChange={vi.fn()}
        onSearchClose={vi.fn()}
        selectMode
        selectedIds={new Set([1])}
        selectedCollectionIds={new Set()}
        onToggleItem={vi.fn()}
        onToggleCollection={vi.fn()}
        onOpenDeleteConfirm={onOpenDeleteConfirm}
        onExitSelectMode={vi.fn()}
        deleteConfirmVisible={false}
        onCancelDeleteConfirm={vi.fn()}
        onConfirmDelete={vi.fn()}
        selectedCount={2}
      />
    );
    await view.findByText('Groceries');
    fireEvent.press(view.getByText('Delete'));
    expect(onOpenDeleteConfirm).toHaveBeenCalled();
  });

  it('calls onExitSelectMode when Cancel is pressed in select mode', async () => {
    const onExitSelectMode = vi.fn();
    const view = await render(
      <ListsView
        variant="grid"
        collectionsVariant="grid"
        mode="home"
        searchActive={false}
        query=""
        onQueryChange={vi.fn()}
        onSearchClose={vi.fn()}
        selectMode
        selectedIds={new Set([1])}
        selectedCollectionIds={new Set()}
        onToggleItem={vi.fn()}
        onToggleCollection={vi.fn()}
        onOpenDeleteConfirm={vi.fn()}
        onExitSelectMode={onExitSelectMode}
        deleteConfirmVisible={false}
        onCancelDeleteConfirm={vi.fn()}
        onConfirmDelete={vi.fn()}
        selectedCount={1}
      />
    );
    await view.findByText('Groceries');
    fireEvent.press(view.getByText('Cancel'));
    expect(onExitSelectMode).toHaveBeenCalled();
  });

  it('renders the delete confirmation dialog when visible', async () => {
    const view = await renderView({ selectMode: true, selectedIds: new Set([1]), deleteConfirmVisible: true });
    expect(await view.findByText('Delete 1 list?')).toBeTruthy();
    expect(view.getByText('The selected lists and their items will be permanently deleted.')).toBeTruthy();
  });

  it('navigates to list detail when a tile is pressed outside select mode', async () => {
    const view = await renderView();
    await view.findByText('Groceries');
    fireEvent.press(view.getByText('Groceries'));
    expect(nav.navigate).toHaveBeenCalledWith('ListDetail', { listId: 1 });
  });

  it('renders the Collections section above Lists on Home', async () => {
    setCollections(COLLECTIONS);
    const view = await renderView();
    expect(await view.findByText('Collections')).toBeTruthy();
    expect(view.getByText('Shopping')).toBeTruthy();
  });

  it('navigates to collection detail when a collection tile is pressed', async () => {
    setCollections(COLLECTIONS);
    const view = await renderView();
    await view.findByText('Shopping');
    fireEvent.press(view.getByText('Shopping'));
    expect(nav.navigate).toHaveBeenCalledWith('CollectionDetail', { collectionId: 10 });
  });

  it('toggles a collection instead of navigating in select mode', async () => {
    setCollections(COLLECTIONS);
    const view = await renderView({ selectMode: true });
    await view.findByText('Shopping');
    fireEvent.press(view.getByRole('checkbox', { name: /Shopping/ }));
    expect(nav.navigate).not.toHaveBeenCalledWith('CollectionDetail', { collectionId: 10 });
  });

  it('supports the collections-only mode with empty state and add-collection FAB', async () => {
    const view = await renderView({ mode: 'collections' });
    expect(await view.findByText('No collections yet')).toBeTruthy();
    expect(view.getByText('Tap + to create your first collection')).toBeTruthy();
    expect(view.getByLabelText('Add collection')).toBeTruthy();
    expect(view.queryByLabelText('Add list')).toBeNull();
  });

  it('renders collection rows for the list variant on Home', async () => {
    setCollections(COLLECTIONS);
    const view = await renderView({ collectionsVariant: 'list' });
    expect(await view.findByText('Shopping')).toBeTruthy();
  });

  it('shows collections alongside lists in the select-mode count', async () => {
    setCollections(COLLECTIONS);
    const view = await renderView({ selectMode: true, selectedIds: new Set([1]), selectedCollectionIds: new Set([10]) });
    expect(await view.findByText('2 selected')).toBeTruthy();
  });

  it('shows the containing collection name under a collection list (lists mode)', async () => {
    setLists([
      { id: 1, name: 'Groceries', color: '#22D3EE', icon: 'cart-outline', collection_id: 10, created_at: 'x', position: 0, pinned: 0, total: 5, completed: 2 },
      { id: 2, name: 'Work Tasks', color: '#34D399', icon: 'briefcase-outline', collection_id: null, created_at: 'x', position: 1, pinned: 0, total: 2, completed: 0 },
    ]);
    setCollections([{ id: 10, name: 'Shopping', color: '#A855F7', icon: 'folder-outline', created_at: 'x', position: 0, pinned: 0, total: 3, completed: 1 }]);
    const view = await renderView({ mode: 'lists' });
    expect(await view.findByText('Groceries')).toBeTruthy();
    expect(view.getByText('Work Tasks')).toBeTruthy();
    expect(view.getAllByText('Shopping').length).toBe(1);
  });

  it('shows the containing collection name under a list row (lists mode, list layout)', async () => {
    setLists([{ id: 1, name: 'Groceries', color: '#22D3EE', icon: 'cart-outline', collection_id: 10, created_at: 'x', position: 0, pinned: 0, total: 5, completed: 2 }]);
    setCollections([{ id: 10, name: 'Shopping', color: '#A855F7', icon: 'folder-outline', created_at: 'x', position: 0, pinned: 0, total: 3, completed: 1 }]);
    const view = await renderView({ mode: 'lists', variant: 'list' });
    expect(await view.findByText('Groceries')).toBeTruthy();
    expect(view.getByText('Shopping')).toBeTruthy();
  });

  it('highlights a collection card when a list is dragged over it', async () => {
    resetZoneHandlers();
    setCollections(COLLECTIONS);
    const view = await renderView();
    await view.findByText('Shopping');
    expect(view.queryByHintText('Drop to move the list into this collection')).toBeNull();
    await act(async () => {
      fireGridDragStart({ key: '1', fromIndex: 0, indexToKey: ['1', '2'], keyToIndex: {} });
      getZoneHandlers()[0].onItemEnter?.();
    });
    expect(view.getByHintText('Drop to move the list into this collection')).toBeTruthy();
    await act(async () => {
      getZoneHandlers()[0].onItemLeave?.();
    });
    expect(view.queryByHintText('Drop to move the list into this collection')).toBeNull();
  });

  it('highlights a collection row (list layout) while dragging a list', async () => {
    resetZoneHandlers();
    setCollections(COLLECTIONS);
    const view = await renderView({ collectionsVariant: 'list' });
    await view.findByText('Shopping');
    await act(async () => {
      fireGridDragStart({ key: '1', fromIndex: 0, indexToKey: ['1', '2'], keyToIndex: {} });
      getZoneHandlers()[0].onItemEnter?.();
    });
    expect(view.getByHintText('Drop to move the list into this collection')).toBeTruthy();
    await act(async () => {
      getZoneHandlers()[0].onItemDrop?.();
    });
    expect(view.queryByHintText('Drop to move the list into this collection')).toBeNull();
  });

  it('does not highlight zones when no list drag is active', async () => {
    resetZoneHandlers();
    setCollections(COLLECTIONS);
    const view = await renderView();
    await view.findByText('Shopping');
    await act(async () => {
      getZoneHandlers()[0].onItemEnter?.();
    });
    expect(view.queryByHintText('Drop to move the list into this collection')).toBeNull();
  });

  it('moves the dragged list into the collection on drop and skips reorder', async () => {
    resetZoneHandlers();
    setCollections(COLLECTIONS);
    const view = await renderView();
    await view.findByText('Shopping');
    await act(async () => {
      fireGridDragStart({ key: '1', fromIndex: 0, indexToKey: ['1', '2'], keyToIndex: {} });
      getZoneHandlers()[0].onItemEnter?.();
      getZoneHandlers()[0].onItemDrop?.();
    });
    expect(listRepository.moveToCollection).toHaveBeenCalledWith(1, 10);
    expect(listRepository.reorder).not.toHaveBeenCalled();
    expect(collectionRepository.reorder).not.toHaveBeenCalled();
    fireGridDragEnd({ key: '1', data: [{ ...LISTS[0] }, { ...LISTS[1] }] });
    expect(listRepository.reorder).not.toHaveBeenCalled();
  });

  it('enables dragging a single list on Home so it can be dropped into a collection', async () => {
    resetZoneHandlers();
    setCollections(COLLECTIONS);
    setBaseLists([LISTS[0]]);
    const view = await renderView();
    await view.findByText('Groceries');
    expect(lastGrid()?.sortEnabled).toBe(true);
    await act(async () => {
      fireGridDragStart({ key: '1', fromIndex: 0, indexToKey: ['1'], keyToIndex: {} });
      getZoneHandlers()[0].onItemEnter?.();
      getZoneHandlers()[0].onItemDrop?.();
    });
    expect(listRepository.moveToCollection).toHaveBeenCalledWith(1, 10);
    expect(listRepository.reorder).not.toHaveBeenCalled();
  });

  it('keeps the >1 guard for a single list outside Home', async () => {
    setLists([LISTS[0]]);
    setBaseLists([LISTS[0]]);
    const view = await renderView({ mode: 'lists' });
    await view.findByText('Groceries');
    expect(lastGrid()?.sortEnabled).toBe(false);
  });

  it('enables dragging a single member list in collection detail so it can be removed', async () => {
    setListsByCollectionId(new Map([[10, [LISTS[0]]]]));
    const view = await renderView({ mode: 'collection', collectionId: 10 });
    await view.findByText('Groceries');
    expect(lastGrid()?.sortEnabled).toBe(true);
  });

  it('shows the remove target in collection detail only while a member drag is active', async () => {
    resetZoneHandlers();
    setListsByCollectionId(new Map([[10, LISTS]]));
    const view = await renderView({ mode: 'collection', collectionId: 10 });
    await view.findByText('Groceries');
    expect(view.queryByHintText('Drop to remove this list from the collection')).toBeNull();
    await act(async () => {
      fireGridDragStart({ key: '1', fromIndex: 0, indexToKey: ['1', '2'], keyToIndex: {} });
    });
    expect(getZoneHandlers()[0].onItemDrop).toBeDefined();
    await act(async () => {
      getZoneHandlers()[0].onItemEnter?.();
    });
    expect(view.getByHintText('Drop to remove this list from the collection')).toBeTruthy();
  });

  it('does not render the remove target outside collection detail', async () => {
    resetZoneHandlers();
    const view = await renderView();
    await view.findByText('Groceries');
    expect(view.queryByHintText('Drop to remove this list from the collection')).toBeNull();
  });

  it('removes the dropped list from the collection on the footer target and skips reorder', async () => {
    resetZoneHandlers();
    setListsByCollectionId(new Map([[10, LISTS]]));
    const view = await renderView({ mode: 'collection', collectionId: 10 });
    await view.findByText('Groceries');
    await act(async () => {
      fireGridDragStart({ key: '1', fromIndex: 0, indexToKey: ['1', '2'], keyToIndex: {} });
      getZoneHandlers()[0].onItemEnter?.();
      getZoneHandlers()[0].onItemDrop?.();
    });
    expect(listRepository.removeFromCollection).toHaveBeenCalledWith(1);
    expect(listRepository.reorder).not.toHaveBeenCalled();
    expect(view.queryByHintText('Drop to remove this list from the collection')).toBeNull();
    fireGridDragEnd({ key: '1', data: [{ ...LISTS[0] }, { ...LISTS[1] }] });
    expect(listRepository.reorder).not.toHaveBeenCalled();
  });

  it('still reorders members in collection detail when released outside the target', async () => {
    setListsByCollectionId(new Map([[10, LISTS]]));
    const view = await renderView({ mode: 'collection', collectionId: 10 });
    await view.findByText('Groceries');
    fireGridDragEnd({ key: '2', data: [{ ...LISTS[1] }, { ...LISTS[0] }] });
    expect(listRepository.removeFromCollection).not.toHaveBeenCalled();
    expect(listRepository.reorder).toHaveBeenCalledWith([2, 1]);
  });

  it('pins the selected lists when Pin is pressed in select mode', async () => {
    const view = await renderView({ selectMode: true, selectedIds: new Set([1]) });
    await view.findByText('Groceries');
    const pin = view.getByLabelText('Pin');
    expect(within(pin).getByText('star')).toBeTruthy();
    expect(within(pin).queryByText('star-outline')).toBeNull();
    fireEvent.press(pin);
    expect(listRepository.setPinned).toHaveBeenCalledWith(1, true);
  });

  it('shows Unpin and unpins when every selected item is already pinned', async () => {
    setLists([{ ...LISTS[0], pinned: 1 }, { ...LISTS[1], pinned: 1 }]);
    const view = await renderView({ selectMode: true, selectedIds: new Set([1]) });
    await view.findByText('Groceries');
    const unpin = view.getByLabelText('Unpin');
    expect(within(unpin).getByText('star-outline')).toBeTruthy();
    expect(within(unpin).queryByText('star')).toBeNull();
    fireEvent.press(unpin);
    expect(listRepository.setPinned).toHaveBeenCalledWith(1, false);
  });

  it('pins a selected collection when Pin is pressed', async () => {
    setCollections(COLLECTIONS);
    const view = await renderView({ selectMode: true, selectedCollectionIds: new Set([10]) });
    await view.findByText('Shopping');
    const pin = view.getByLabelText('Pin');
    expect(within(pin).getByText('star')).toBeTruthy();
    fireEvent.press(pin);
    expect(collectionRepository.setPinned).toHaveBeenCalledWith(10, true);
  });
});
