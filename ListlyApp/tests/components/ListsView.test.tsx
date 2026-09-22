import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import ListsView, { type ListsViewVariant, type ListViewMode } from '../../src/components/ListsView';
import { buildAppMock, setItemsByListId, setLists, setBaseLists, resetAppStub } from '../helpers/appStub';
import { resetStub } from '../helpers/configStub';
import type { Item, ListWithCounts } from '../../src/database/types';

vi.mock('expo-sqlite', () => ({ openDatabaseSync: vi.fn() }));

vi.mock('../../src/context/AppContext', () => ({
  useApp: () => buildAppMock(),
  AppProvider: ({ children }: { children: ReactNode }) => children as ReactNode,
}));

vi.mock('../../src/database', () => ({
  listRepository: { deleteMany: vi.fn(async () => {}) },
  itemRepository: {},
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
  { id: 1, name: 'Groceries', color: '#22D3EE', icon: 'cart-outline', collection_id: null, created_at: 'x', position: 0, total: 5, completed: 2 },
  { id: 2, name: 'Work Tasks', color: '#34D399', icon: 'briefcase-outline', collection_id: null, created_at: 'x', position: 1, total: 2, completed: 0 },
];

function items(names: string[]): Item[] {
  return names.map((name, i) => ({ id: i + 1, list_id: 1, name, checked: 0, note: null, position: i, created_at: 'x', pictures: null }));
}

interface Overrides {
  variant?: ListsViewVariant;
  mode?: ListViewMode;
  searchActive?: boolean;
  query?: string;
  selectMode?: boolean;
  selectedIds?: ReadonlySet<number>;
  deleteConfirmVisible?: boolean;
}

function renderView(overrides: Overrides = {}) {
  const props = {
    variant: overrides.variant ?? 'grid',
    mode: overrides.mode ?? 'home',
    searchActive: overrides.searchActive ?? false,
    query: overrides.query ?? '',
    onQueryChange: vi.fn(),
    onSearchClose: vi.fn(),
    selectMode: overrides.selectMode ?? false,
    selectedIds: overrides.selectedIds ?? new Set<number>(),
    onToggleItem: vi.fn(),
    onOpenDeleteConfirm: vi.fn(),
    onExitSelectMode: vi.fn(),
    deleteConfirmVisible: overrides.deleteConfirmVisible ?? false,
    onCancelDeleteConfirm: vi.fn(),
    onConfirmDelete: vi.fn(),
    selectedCount: overrides.selectedIds?.size ?? 0,
  };
  return render(<ListsView {...props} />);
}

describe('ListsView', () => {
  beforeEach(() => {
    resetStub();
    resetAppStub();
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
        searchActive={false}
        query=""
        onQueryChange={vi.fn()}
        onSearchClose={vi.fn()}
        selectMode
        selectedIds={new Set([1])}
        onToggleItem={onToggleItem}
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
        mode="home"
        searchActive={false}
        query=""
        onQueryChange={vi.fn()}
        onSearchClose={vi.fn()}
        selectMode
        selectedIds={new Set([1])}
        onToggleItem={vi.fn()}
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
        mode="home"
        searchActive={false}
        query=""
        onQueryChange={vi.fn()}
        onSearchClose={vi.fn()}
        selectMode
        selectedIds={new Set([1])}
        onToggleItem={vi.fn()}
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
});