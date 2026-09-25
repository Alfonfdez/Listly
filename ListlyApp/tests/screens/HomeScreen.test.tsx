import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react-native';
import type { ReactElement, ReactNode } from 'react';
import HomeScreen from '../../src/screens/HomeScreen';
import { buildAppMock, setItemsByListId, setLists, setLoading, setBaseLists, resetAppStub } from '../helpers/appStub';
import { resetStub, setConfig } from '../helpers/configStub';
import type { Item, ListWithCounts } from '../../src/database/types';
import { TEXT_SIZES } from '../../src/constants/types';

vi.mock('expo-sqlite', () => ({ openDatabaseSync: vi.fn() }));

vi.mock('../../src/context/AppContext', () => ({
  useApp: () => buildAppMock(),
  AppProvider: ({ children }: { children: ReactNode }) => children as ReactNode,
}));

vi.mock('../../src/database', () => ({
  listRepository: {
    deleteMany: vi.fn(async () => {}),
    setPinned: vi.fn(async () => {}),
  },
  itemRepository: {},
  collectionRepository: {
    deleteMany: vi.fn(async () => {}),
    setPinned: vi.fn(async () => {}),
  },
}));

const selectMocks = vi.hoisted(() => ({
  toggleSelectMode: vi.fn(),
}));

vi.mock('../../src/hooks/useSelectMode', () => ({
  useSelectMode: () => ({
    selectMode: false,
    selectedIds: new Set<number>(),
    toggleItem: vi.fn(),
    toggleSelectMode: selectMocks.toggleSelectMode,
    exitSelectMode: vi.fn(),
    deleteConfirmVisible: false,
    openDeleteConfirm: vi.fn(),
    closeDeleteConfirm: vi.fn(),
    confirmDelete: vi.fn(),
  }),
}));

const LISTS: ListWithCounts[] = [
  { id: 1, name: 'Groceries', color: '#22D3EE', icon: 'cart-outline', collection_id: null, created_at: 'x', position: 0, pinned: 0, total: 5, completed: 2 },
  { id: 2, name: 'Work Tasks', color: '#34D399', icon: 'briefcase-outline', collection_id: null, created_at: 'x', position: 1, pinned: 0, total: 2, completed: 0 },
];

function items(names: string[]): Item[] {
  return names.map((name, i) => ({ id: i + 1, list_id: 1, name, checked: 0, note: null, position: i, created_at: 'x', updated_at: 'x', pictures: null }));
}

const nav = { navigate: vi.fn(), setOptions: vi.fn() };

vi.mock('@react-navigation/native', async () => {
  const React = await import('react');
  return {
    useNavigation: () => nav,
    useFocusEffect: (cb: () => void | (() => void)) => {
      React.useEffect(cb, [cb]);
    },
  };
});

function lastHeaderRight() {
  const calls = nav.setOptions.mock.calls;
  for (let i = calls.length - 1; i >= 0; i--) {
    const opts = calls[i]?.[0];
    if (opts && 'headerRight' in opts) return opts;
  }
  return undefined;
}

async function renderHeader() {
  await render(<HomeScreen />);
  const opts = lastHeaderRight() as { headerRight?: () => ReactElement } | undefined;
  if (!opts?.headerRight) throw new Error('headerRight not registered');
  return render(opts.headerRight());
}

describe('HomeScreen', () => {
  beforeEach(() => {
    resetStub();
    resetAppStub();
    nav.navigate.mockClear();
    nav.setOptions.mockClear();
    selectMocks.toggleSelectMode.mockClear();
    setLists(LISTS);
    setBaseLists(LISTS);
    setItemsByListId(new Map([[1, items(['Milk', 'Coffee beans'])]]));
  });

  afterEach(() => {
    resetAppStub();
  });

  it('shows a loading indicator while data loads', async () => {
    setLoading(true);
    const view = await render(<HomeScreen />);
    expect(view.queryByText('Groceries')).toBeNull();
  });

  it('renders list tiles with name and progress', async () => {
    const view = await render(<HomeScreen />);
    expect(await view.findByText('Groceries')).toBeTruthy();
    expect(view.getByText('Work Tasks')).toBeTruthy();
    expect(view.getByText('2/5')).toBeTruthy();
    expect(view.getByText('0/2')).toBeTruthy();
  });

  it('shows the empty state and keeps the FAB when there are no lists', async () => {
    setLists([]);
    setBaseLists([]);
    const view = await render(<HomeScreen />);
    expect(await view.findByText('No collections or lists yet')).toBeTruthy();
    expect(view.getByText('Tap + to create your first collection or list')).toBeTruthy();
    expect(view.getByLabelText('Add list')).toBeTruthy();
  });

  it('registers search and select toggles in the header', async () => {
    const header = await renderHeader();
    expect(header.getByLabelText('Search')).toBeTruthy();
    expect(header.getByLabelText('Enter select mode')).toBeTruthy();
  });

  it('hides both search and select in the header when there are no lists', async () => {
    setLists([]);
    await render(<HomeScreen />);
    const calls = nav.setOptions.mock.calls;
    const lastSetOptions = calls[calls.length - 1]?.[0];
    expect(lastSetOptions?.headerRight).toBeUndefined();
  });

  it('enters select mode when the header select toggle is pressed', async () => {
    await render(<HomeScreen />);
    const header = await renderHeader();
    fireEvent.press(header.getByLabelText('Enter select mode'));
    expect(selectMocks.toggleSelectMode).toHaveBeenCalled();
  });

  it('opens the Add chooser from the FAB and navigates to Create List', async () => {
    const view = await render(<HomeScreen />);
    await view.findByText('Groceries');
    fireEvent.press(view.getByLabelText('Add list'));
    fireEvent.press(await view.findByText('Add list'));
    expect(nav.navigate).toHaveBeenCalledWith('CreateList');
  });

  it('navigates to Create Collection from the Add chooser', async () => {
    const view = await render(<HomeScreen />);
    await view.findByText('Groceries');
    fireEvent.press(view.getByLabelText('Add list'));
    fireEvent.press(await view.findByText('Add collection'));
    expect(nav.navigate).toHaveBeenCalledWith('CreateCollection');
  });

  it('navigates to ListDetail when a tile is pressed', async () => {
    const view = await render(<HomeScreen />);
    await view.findByText('Groceries');
    fireEvent.press(view.getByText('Groceries'));
    expect(nav.navigate).toHaveBeenCalledWith('ListDetail', { listId: 1 });
  });

  it('respects the active text size for labels', async () => {
    setConfig({ textSize: TEXT_SIZES.large });
    const view = await render(<HomeScreen />);
    const text = await view.findByText('Groceries');
    const fontSize = flattenStyle(text.props.style).fontSize;
    expect(fontSize).toBe(16);
  });
});

function flattenStyle(style: unknown): Record<string, unknown> {
  if (Array.isArray(style)) {
    return style.reduce((acc: Record<string, unknown>, s) => ({ ...acc, ...flattenStyle(s) }), {});
  }
  if (style && typeof style === 'object') {
    return { ...(style as Record<string, unknown>) };
  }
  return {};
}