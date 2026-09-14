import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import HomeScreen from '../../src/screens/HomeScreen';
import { buildAppMock, setItemsByListId, setLists, setLoading, resetAppStub } from '../component/helpers/appStub';
import { resetStub, setConfig } from '../component/helpers/configStub';
import type { Item, ListWithCounts } from '../../src/database/types';
import { TEXT_SIZES } from '../../src/constants/types';

vi.mock('expo-sqlite', () => ({ openDatabaseSync: vi.fn() }));

vi.mock('../../src/context/AppContext', () => ({
  useApp: () => buildAppMock(),
  AppProvider: ({ children }: { children: ReactNode }) => children as ReactNode,
}));

const LISTS: ListWithCounts[] = [
  { id: 1, name: 'Groceries', color: '#22D3EE', icon: 'cart-outline', created_at: 'x', position: 0, total: 5, completed: 2 },
  { id: 2, name: 'Work Tasks', color: '#34D399', icon: 'briefcase-outline', created_at: 'x', position: 1, total: 2, completed: 0 },
];

function items(names: string[]): Item[] {
  return names.map((name, i) => ({ id: i + 1, list_id: 1, name, checked: 0, note: null, position: i, created_at: 'x' }));
}

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

describe('HomeScreen', () => {
  beforeEach(() => {
    resetStub();
    resetAppStub();
    nav.navigate.mockClear();
    setLists(LISTS);
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
    const view = await render(<HomeScreen />);
    expect(await view.findByText('No lists yet')).toBeTruthy();
    expect(view.getByLabelText('Add list')).toBeTruthy();
  });

  it('shows a no-results message when the search matches nothing', async () => {
    const view = await render(<HomeScreen />);
    await view.findByText('Groceries');
    fireEvent.press(view.getByLabelText('Search lists'));
    const input = await waitFor(() => view.getByPlaceholderText('Search lists and items...'));
    fireEvent.changeText(input, 'wallet');
    expect(await view.findByText('No results found')).toBeTruthy();
  });

  it('filters grid tiles by list name and item names', async () => {
    const view = await render(<HomeScreen />);
    await view.findByText('Groceries');
    fireEvent.press(view.getByLabelText('Search lists'));
    const input = await waitFor(() => view.getByPlaceholderText('Search lists and items...'));
    fireEvent.changeText(input, 'Coffee');

    expect(await waitFor(() => view.getByText('Groceries'))).toBeTruthy();
    expect(view.queryByText('Work Tasks')).toBeNull();
  });

  it('navigates to Create List from the FAB', async () => {
    const view = await render(<HomeScreen />);
    await view.findByText('Groceries');
    fireEvent.press(view.getByLabelText('Add list'));
    expect(nav.navigate).toHaveBeenCalledWith('CreateList');
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