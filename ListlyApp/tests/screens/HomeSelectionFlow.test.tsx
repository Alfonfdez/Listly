import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { useEffect, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import HomeScreen from '../../src/screens/HomeScreen';
import { buildAppMock, resetAppStub, setCollections, setLists, setBaseLists } from '../helpers/appStub';
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

const LISTS: ListWithCounts[] = [
  { id: 1, name: 'Groceries', color: '#22D3EE', icon: 'cart-outline', collection_id: null, created_at: 'x', position: 0, total: 5, completed: 2 },
  { id: 2, name: 'Work Tasks', color: '#34D399', icon: 'briefcase-outline', collection_id: null, created_at: 'x', position: 1, total: 2, completed: 0 },
];

const COLLECTIONS: CollectionWithCounts[] = [
  { id: 10, name: 'Shopping', color: '#A855F7', icon: 'folder-outline', created_at: 'x', position: 0, total: 3, completed: 1 },
];

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

function lastHeaderRight(): { headerRight?: () => ReactNode } | undefined {
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
    const opts = lastHeaderRight();
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
  const view = await render(<ScreenWithHeader screen={<HomeScreen />} />);
  await view.findByText('Groceries');
  return view;
}

describe('Home combined selection', () => {
  beforeEach(() => {
    resetStub();
    resetAppStub();
    nav.navigate.mockClear();
    nav.setOptions.mockClear();
    dbMocks.deleteManyCollections.mockClear();
    dbMocks.deleteManyLists.mockClear();
    setLists(LISTS);
    setBaseLists(LISTS);
    setCollections(COLLECTIONS);
  });

  afterEach(() => {
    resetAppStub();
  });

  it('deletes selected collections first, then falls through to the lists confirm', async () => {
    const view = await renderScreen();
    fireEvent.press(view.getByLabelText('Enter select mode'));

    fireEvent.press(await view.findByRole('checkbox', { name: 'Shopping' }));
    await waitFor(() => expect(view.getByText('1 selected')).toBeTruthy());
    fireEvent.press(await view.findByRole('checkbox', { name: 'Groceries' }));
    await waitFor(() => expect(view.getByText('2 selected')).toBeTruthy());

    fireEvent.press(view.getByText('Delete'));
    expect(await view.findByText('Delete 1 collection?')).toBeTruthy();

    fireEvent.press(view.getByLabelText('Move lists to Lists'));
    await waitFor(() => expect(dbMocks.deleteManyCollections).toHaveBeenCalledWith([10], 'move'));
    expect(dbMocks.deleteManyLists).not.toHaveBeenCalled();

    expect(await view.findByText('Delete 1 list?')).toBeTruthy();
    fireEvent.press(view.getAllByLabelText('Delete')[1]);
    await waitFor(() => expect(dbMocks.deleteManyLists).toHaveBeenCalledWith([1]));
  });
});