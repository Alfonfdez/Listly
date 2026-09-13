import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, userEvent, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import ListDetailScreen from '../../src/screens/ListDetailScreen';
import {
  buildAppMock,
  resetAppStub,
  setItemsByListId,
  setLists,
} from '../component/helpers/appStub';
import { resetStub } from '../component/helpers/configStub';
import type { Item, ListWithCounts } from '../../src/database/types';

const { itemRepositoryMock } = vi.hoisted(() => ({
  itemRepositoryMock: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    toggle: vi.fn(),
  },
}));

vi.mock('../../src/database', () => ({
  itemRepository: itemRepositoryMock,
}));

vi.mock('../../src/context/AppContext', () => ({
  useApp: () => buildAppMock(),
  AppProvider: ({ children }: { children: ReactNode }) => children as ReactNode,
}));

vi.mock('@react-navigation/native', async () => {
  const React = await import('react');
  return {
    useRoute: () => ({ params: { listId: 1 } }),
    useFocusEffect: (cb: () => void | (() => void)) => {
      React.useEffect(cb, [cb]);
    },
  };
});

const LIST: ListWithCounts = {
  id: 1,
  name: 'Groceries',
  color: '#22D3EE',
  icon: 'cart-outline',
  created_at: 'x',
  total: 2,
  completed: 1,
};

const ITEMS: Item[] = [
  { id: 1, list_id: 1, name: 'Milk', checked: 1, note: null, position: 0, created_at: 'x' },
  { id: 2, list_id: 1, name: 'Eggs', checked: 0, note: 'free-range', position: 1, created_at: 'x' },
];

describe('ListDetailScreen', () => {
  beforeEach(() => {
    resetStub();
    resetAppStub();
    itemRepositoryMock.create.mockReset();
    itemRepositoryMock.update.mockReset();
    itemRepositoryMock.delete.mockReset();
    itemRepositoryMock.toggle.mockReset();
    itemRepositoryMock.create.mockResolvedValue({});
    itemRepositoryMock.update.mockResolvedValue(undefined);
    itemRepositoryMock.delete.mockResolvedValue(undefined);
    itemRepositoryMock.toggle.mockResolvedValue(undefined);
    setLists([LIST]);
    setItemsByListId(new Map([[1, ITEMS]]));
  });

  it('renders the list header with name and progress', async () => {
    const view = await render(<ListDetailScreen />);
    expect(await view.findByText('Groceries')).toBeTruthy();
    expect(await view.findByText('1/2')).toBeTruthy();
    expect(view.getByText('cart-outline')).toBeTruthy();
  });

  it('renders each item in position order', async () => {
    const view = await render(<ListDetailScreen />);
    expect(await view.findByText('Milk')).toBeTruthy();
    expect(view.getByText('Eggs')).toBeTruthy();
    expect(view.getByText('document-text-outline')).toBeTruthy();
  });

  it('toggles an item via the repository on row press', async () => {
    const user = userEvent.setup();
    const view = await render(<ListDetailScreen />);
    await user.press(await view.findByText('Eggs'));
    await waitFor(() => expect(itemRepositoryMock.toggle).toHaveBeenCalledWith(2));
  });

  it('adds a new item at the end of the list', async () => {
    const user = userEvent.setup();
    const view = await render(<ListDetailScreen />);
    await view.findByText('Milk');
    await user.type(view.getByLabelText('Add an item...'), '  Tea  ');
    await user.press(view.getByLabelText('Add'));

    await waitFor(() =>
      expect(itemRepositoryMock.create).toHaveBeenCalledWith({
        list_id: 1,
        name: 'Tea',
        note: null,
        checked: 0,
        position: 2,
      })
    );
  });

  it('rejects adding a duplicate item name', async () => {
    const user = userEvent.setup();
    const view = await render(<ListDetailScreen />);
    await view.findByText('Milk');
    await user.type(view.getByLabelText('Add an item...'), 'milk');
    await user.press(view.getByLabelText('Add'));

    expect(await view.findByText('An item with this name already exists')).toBeTruthy();
    expect(itemRepositoryMock.create).not.toHaveBeenCalled();
  });

  it('rejects an empty item name', async () => {
    const view = await render(<ListDetailScreen />);
    await view.findByText('Milk');
    const user = userEvent.setup();
    await user.press(view.getByLabelText('Add'));

    expect(await view.findByText('Name is required')).toBeTruthy();
    expect(itemRepositoryMock.create).not.toHaveBeenCalled();
  });

  it('updates an item in the edit modal', async () => {
    const user = userEvent.setup();
    const view = await render(<ListDetailScreen />);
    await view.findByText('Milk');
    await user.press(view.getAllByLabelText('Edit item')[1]);

    const nameInput = await view.findByLabelText('Name');
    await user.clear(nameInput);
    await user.type(nameInput, 'Eggs (brown)');
    const noteInput = view.getByLabelText('Note');
    await user.clear(noteInput);
    await user.type(noteInput, 'from the market');
    await user.press(view.getByLabelText('Save'));

    await waitFor(() =>
      expect(itemRepositoryMock.update).toHaveBeenCalledWith(2, { name: 'Eggs (brown)', note: 'from the market' })
    );
  });

  it('deletes an item only after confirmation', async () => {
    const user = userEvent.setup();
    const view = await render(<ListDetailScreen />);
    await view.findByText('Milk');
    await user.press(view.getAllByLabelText('Edit item')[0]);
    await view.findByLabelText('Name');

    await user.press(view.getByLabelText('Delete'));
    expect(await view.findByText('Delete this item?')).toBeTruthy();
    expect(itemRepositoryMock.delete).not.toHaveBeenCalled();

    await user.press(view.getByLabelText('Delete'));
    await waitFor(() => expect(itemRepositoryMock.delete).toHaveBeenCalledWith(1));
  });

  it('shows the empty state when the list has no items', async () => {
    setItemsByListId(new Map([[1, []]]));
    const view = await render(<ListDetailScreen />);
    expect(await view.findByText('No items yet')).toBeTruthy();
    expect(view.getByText('Type below to add your first item')).toBeTruthy();
    expect(view.getByText('0/0')).toBeTruthy();
  });
});