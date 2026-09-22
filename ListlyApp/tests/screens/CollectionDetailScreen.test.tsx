import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react-native';
import { useEffect, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import CollectionDetailScreen from '../../src/screens/CollectionDetailScreen';
import {
  buildAppMock,
  resetAppStub,
  setCollections,
  setListsByCollectionId,
} from '../helpers/appStub';
import { resetStub } from '../helpers/configStub';
import type { CollectionWithCounts, ListWithCounts } from '../../src/database/types';

vi.mock('expo-sqlite', () => ({ openDatabaseSync: vi.fn() }));

vi.mock('../../src/context/AppContext', () => ({
  useApp: () => buildAppMock(),
  AppProvider: ({ children }: { children: ReactNode }) => children as ReactNode,
}));

const { collectionRepositoryMock, selectMocks, nav } = vi.hoisted(() => ({
  collectionRepositoryMock: {
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
  selectMocks: {
    toggleSelectMode: vi.fn(),
  },
  nav: {
    setOptions: vi.fn(),
    navigate: vi.fn(),
    goBack: vi.fn(),
  },
}));

vi.mock('../../src/database', () => ({
  collectionRepository: collectionRepositoryMock,
  listRepository: {
    deleteMany: vi.fn(),
  },
  itemRepository: {},
}));

vi.mock('../../src/hooks/useSelectMode', () => ({
  useSelectMode: () => ({
    selectMode: false,
    selectedIds: new Set(),
    toggleItem: vi.fn(),
    toggleSelectMode: selectMocks.toggleSelectMode,
    exitSelectMode: vi.fn(),
    deleteConfirmVisible: false,
    openDeleteConfirm: vi.fn(),
    closeDeleteConfirm: vi.fn(),
    confirmDelete: vi.fn(),
  }),
}));

vi.mock('@react-navigation/native', async () => {
  const React = await import('react');
  return {
    useRoute: () => ({ params: { collectionId: 10 } }),
    useNavigation: () => nav,
    useFocusEffect: (cb: () => void | (() => void)) => {
      React.useEffect(cb, [cb]);
    },
  };
});

const COLLECTION: CollectionWithCounts = {
  id: 10,
  name: 'Shopping',
  color: '#A855F7',
  icon: 'folder-outline',
  created_at: 'x',
  position: 0,
  total: 5,
  completed: 2,
};

const LISTS: ListWithCounts[] = [
  { id: 1, name: 'Groceries', color: '#22D3EE', icon: 'cart-outline', collection_id: 10, created_at: 'x', position: 0, total: 3, completed: 1 },
  { id: 2, name: 'Errands', color: '#F87171', icon: 'walk-outline', collection_id: 10, created_at: 'x', position: 1, total: 2, completed: 1 },
];

describe('CollectionDetailScreen', () => {
  beforeEach(() => {
    resetStub();
    resetAppStub();
    collectionRepositoryMock.delete.mockReset();
    collectionRepositoryMock.delete.mockResolvedValue(undefined);
    nav.setOptions.mockReset();
    nav.goBack.mockReset();
    nav.navigate.mockReset();
    selectMocks.toggleSelectMode.mockReset();
    setCollections([COLLECTION]);
    setListsByCollectionId(new Map([[10, LISTS]]));
  });

  it('renders the collection header and its member lists', async () => {
    const view = await render(<CollectionDetailScreen />);
    expect(await view.findByText('Shopping')).toBeTruthy();
    expect(view.getByText('Groceries')).toBeTruthy();
    expect(view.getByText('Errands')).toBeTruthy();
    expect(view.getByText('2/5')).toBeTruthy();
  });

  it('shows the empty state when the collection has no member lists', async () => {
    setListsByCollectionId(new Map([[10, []]]));
    const view = await render(<CollectionDetailScreen />);
    expect(await view.findByText('No lists yet')).toBeTruthy();
  });

  it('registers search and select in the header when the collection has lists', async () => {
    const view = await renderWithHeader();
    expect(view.getByLabelText('Search')).toBeTruthy();
    expect(view.getByLabelText('Enter select mode')).toBeTruthy();
  });

  it('has no header actions when the collection has no lists', async () => {
    setListsByCollectionId(new Map([[10, []]]));
    await render(<CollectionDetailScreen />);
    const calls = nav.setOptions.mock.calls;
    const lastSetOptions = calls[calls.length - 1]?.[0];
    expect(lastSetOptions?.headerRight).toBeUndefined();
  });
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

async function renderWithHeader() {
  const view = await render(<ScreenWithHeader screen={<CollectionDetailScreen />} />);
  await view.findByText('Shopping');
  return view;
}