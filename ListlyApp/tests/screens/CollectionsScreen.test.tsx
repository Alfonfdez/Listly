import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { useEffect, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import CollectionsScreen from '../../src/screens/CollectionsScreen';
import { buildAppMock, setCollections, resetAppStub, setLists, setListsByCollectionId } from '../helpers/appStub';
import { resetStub } from '../helpers/configStub';
import type { CollectionWithCounts, ListWithCounts } from '../../src/database/types';

vi.mock('expo-sqlite', () => ({ openDatabaseSync: vi.fn() }));

vi.mock('../../src/context/AppContext', () => ({
  useApp: () => buildAppMock(),
  AppProvider: ({ children }: { children: ReactNode }) => children as ReactNode,
}));

const dbMocks = vi.hoisted(() => ({
  deleteManyCollections: vi.fn(async () => {}),
  deleteManyLists: vi.fn(async () => {}),
}));

vi.mock('../../src/database', () => ({
  collectionRepository: {
    deleteMany: dbMocks.deleteManyCollections,
    reorder: vi.fn(),
  },
  listRepository: {
    deleteMany: dbMocks.deleteManyLists,
    reorder: vi.fn(),
  },
  itemRepository: {},
}));

const COLLECTIONS: CollectionWithCounts[] = [
  { id: 10, name: 'Shopping', color: '#A855F7', icon: 'folder-outline', created_at: 'x', position: 0, pinned: 0, total: 3, completed: 1 },
  { id: 11, name: 'Weekend', color: '#F87171', icon: 'calendar-outline', created_at: 'x', position: 1, pinned: 0, total: 0, completed: 0 },
];

const LISTS: ListWithCounts[] = [];

const MEMBER_LIST: ListWithCounts = {
  id: 3,
  name: 'In Collection',
  color: '#FBBF24',
  icon: 'list-outline',
  collection_id: 10,
  created_at: 'x',
  position: 0,
  pinned: 0,
  total: 0,
  completed: 0,
};

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

function ScreenWithHeader({ screen }: { screen: ReactNode }) {
  const [header, setHeader] = useState<(() => ReactNode) | null>(null);
  useEffect(() => {
    const opts = lastHeaderRight() as { headerRight?: () => ReactNode } | undefined;
    setHeader(() => opts?.headerRight ?? null);
  }, []);
  return (
    <View>
      {screen}
      {header ? header() : null}
    </View>
  );
}

async function renderScreen() {
  const view = await render(<ScreenWithHeader screen={<CollectionsScreen />} />);
  await view.findByText('Shopping');
  return view;
}

describe('CollectionsScreen', () => {
  beforeEach(() => {
    resetStub();
    resetAppStub();
    nav.navigate.mockClear();
    nav.setOptions.mockClear();
    dbMocks.deleteManyCollections.mockClear();
    dbMocks.deleteManyLists.mockClear();
    setCollections(COLLECTIONS);
    setLists(LISTS);
    setListsByCollectionId(new Map([[10, [MEMBER_LIST]]]));
  });

  afterEach(() => {
    resetAppStub();
  });

  it('renders collection tiles with progress', async () => {
    const view = await render(<CollectionsScreen />);
    expect(await view.findByText('Shopping')).toBeTruthy();
    expect(view.getByText('Weekend')).toBeTruthy();
    expect(view.getByText('1/3')).toBeTruthy();
    expect(view.getByText('0/0')).toBeTruthy();
  });

  it('shows the empty state and an add-collection FAB when there are no collections', async () => {
    setCollections([]);
    const view = await render(<CollectionsScreen />);
    expect(await view.findByText('No collections yet')).toBeTruthy();
    expect(view.getByText('Tap + to create your first collection')).toBeTruthy();
    expect(view.getByLabelText('Add collection')).toBeTruthy();
    expect(view.queryByLabelText('Add list')).toBeNull();
  });

  it('navigates to CreateCollection from the FAB', async () => {
    const view = await render(<CollectionsScreen />);
    await view.findByText('Shopping');
    fireEvent.press(view.getByLabelText('Add collection'));
    expect(nav.navigate).toHaveBeenCalledWith('CreateCollection');
  });

  it('registers search and select toggles in the header', async () => {
    const view = await renderScreen();
    expect(view.getByLabelText('Search')).toBeTruthy();
    expect(view.getByLabelText('Enter select mode')).toBeTruthy();
  });

  it('hides both search and select when there are no collections', async () => {
    setCollections([]);
    await render(<CollectionsScreen />);
    const calls = nav.setOptions.mock.calls;
    const lastSetOptions = calls[calls.length - 1]?.[0];
    expect(lastSetOptions?.headerRight).toBeUndefined();
  });

  it('opens the collection delete modal and moves the lists on confirm', async () => {
    const view = await renderScreen();
    fireEvent.press(view.getByLabelText('Enter select mode'));
    fireEvent.press(await view.findByRole('checkbox', { name: 'Shopping' }));
    await waitFor(() => expect(view.getByText('1 selected')).toBeTruthy());

    fireEvent.press(view.getByText('Delete'));
    expect(await view.findByText('Delete 1 collection?')).toBeTruthy();

    fireEvent.press(view.getByLabelText('Move lists to Lists'));
    await waitFor(() => expect(dbMocks.deleteManyCollections).toHaveBeenCalledWith([10], 'move'));
    expect(dbMocks.deleteManyLists).not.toHaveBeenCalled();
  });

  it('supports cascading list deletion from the collection delete modal', async () => {
    const view = await renderScreen();
    fireEvent.press(view.getByLabelText('Enter select mode'));
    fireEvent.press(await view.findByRole('checkbox', { name: 'Shopping' }));
    await waitFor(() => expect(view.getByText('1 selected')).toBeTruthy());

    fireEvent.press(view.getByText('Delete'));
    await view.findByText('Delete 1 collection?');
    fireEvent.press(view.getByLabelText('Delete lists too'));

    await waitFor(() => expect(dbMocks.deleteManyCollections).toHaveBeenCalledWith([10], 'cascade'));
  });

  it('counts multiple selected collections in the modal title and lists their names', async () => {
    const view = await renderScreen();
    fireEvent.press(view.getByLabelText('Enter select mode'));
    fireEvent.press(await view.findByRole('checkbox', { name: 'Shopping' }));
    await waitFor(() => expect(view.getByText('1 selected')).toBeTruthy());
    fireEvent.press(await view.findByRole('checkbox', { name: 'Weekend' }));
    await waitFor(() => expect(view.getByText('2 selected')).toBeTruthy());

    fireEvent.press(view.getByText('Delete'));
    expect(await view.findByText('Delete 2 collections?')).toBeTruthy();
    expect(view.getAllByText('Shopping').length).toBeGreaterThan(0);
    expect(view.getAllByText('Weekend').length).toBeGreaterThan(0);

    fireEvent.press(view.getByLabelText('Move lists to Lists'));
    await waitFor(() => expect(dbMocks.deleteManyCollections).toHaveBeenCalledWith([10, 11], 'move'));
  });

  it('cancels the collection delete modal without deleting', async () => {
    const view = await renderScreen();
    fireEvent.press(view.getByLabelText('Enter select mode'));
    fireEvent.press(await view.findByRole('checkbox', { name: 'Shopping' }));
    await waitFor(() => expect(view.getByText('1 selected')).toBeTruthy());

    fireEvent.press(view.getByText('Delete'));
    await view.findByText('Delete 1 collection?');
    fireEvent.press(view.getByLabelText('Cancel'));

    await waitFor(() => expect(dbMocks.deleteManyCollections).not.toHaveBeenCalled());
    await waitFor(() => expect(dbMocks.deleteManyLists).not.toHaveBeenCalled());
    expect(view.getByText('1 selected')).toBeTruthy();
  });

  it('confirms an empty collection without the move/delete chooser', async () => {
    const view = await renderScreen();
    fireEvent.press(view.getByLabelText('Enter select mode'));
    fireEvent.press(await view.findByRole('checkbox', { name: 'Weekend' }));
    await waitFor(() => expect(view.getByText('1 selected')).toBeTruthy());

    fireEvent.press(view.getByText('Delete'));
    expect(await view.findByText('Delete 1 collection?')).toBeTruthy();
    expect(view.queryByText('Move lists to Lists')).toBeNull();
    expect(view.getByText('These empty collections will be removed. It cannot be undone.')).toBeTruthy();

    fireEvent.press(view.getAllByLabelText('Delete')[1]);
    await waitFor(() => expect(dbMocks.deleteManyCollections).toHaveBeenCalledWith([11], 'cascade'));
    expect(dbMocks.deleteManyLists).not.toHaveBeenCalled();
  });
});
