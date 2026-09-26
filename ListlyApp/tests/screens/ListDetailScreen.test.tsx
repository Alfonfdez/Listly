import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, fireEvent, userEvent, waitFor, act } from '@testing-library/react-native';
import type { ReactElement, ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import ListDetailScreen from '../../src/screens/ListDetailScreen';
import {
  buildAppMock,
  resetAppStub,
  setItemsByListId,
  setLists,
} from '../helpers/appStub';
import { resetStub } from '../helpers/configStub';
import { fireGridDragEnd, lastGrid } from '../mocks/react-native-sortables';
import type { Item, ListWithCounts } from '../../src/database/types';
import { darkColors } from '../../src/constants/themes';

const { itemRepositoryMock, listRepositoryMock, selectMocks, nav, photoMocks, clipboardMock } = vi.hoisted(() => ({
  itemRepositoryMock: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    toggle: vi.fn(),
    reorder: vi.fn(),
    setAllChecked: vi.fn(),
    deleteCompleted: vi.fn(),
    duplicateItems: vi.fn(),
  },
  listRepositoryMock: {
    delete: vi.fn(),
    deleteMany: vi.fn(),
    reorder: vi.fn(),
  },
  selectMocks: {
    toggleSelectMode: vi.fn(),
  },
  photoMocks: {
    photos: [] as string[],
    setPhotos: vi.fn(),
    handleTakePhoto: vi.fn(),
    handlePickFromGallery: vi.fn(),
    handleRemovePhoto: vi.fn(),
  },
  nav: {
    setOptions: vi.fn(),
    navigate: vi.fn(),
    goBack: vi.fn(),
  },
  clipboardMock: {
    setStringAsync: vi.fn(async () => true),
  },
}));

vi.mock('../../src/database', () => ({
  itemRepository: itemRepositoryMock,
  listRepository: listRepositoryMock,
}));

vi.mock('expo-clipboard', () => ({
  setStringAsync: clipboardMock.setStringAsync,
}));

vi.mock('../../src/hooks/useItemPhotos', () => ({
  useItemPhotos: () => ({
    photos: photoMocks.photos,
    setPhotos: photoMocks.setPhotos,
    handleTakePhoto: photoMocks.handleTakePhoto,
    handlePickFromGallery: photoMocks.handlePickFromGallery,
    handleRemovePhoto: photoMocks.handleRemovePhoto,
  }),
}));

vi.mock('../../src/context/AppContext', () => ({
  useApp: () => buildAppMock(),
  AppProvider: ({ children }: { children: ReactNode }) => children as ReactNode,
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
    useRoute: () => ({ params: { listId: 1 } }),
    useNavigation: () => nav,
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
  collection_id: null,
  created_at: 'x',
  position: 0,
  pinned: 0,
  total: 5,
  completed: 2,
};

const ITEMS: Item[] = [
  { id: 1, list_id: 1, name: 'Milk', checked: 1, note: null, position: 0, created_at: 'x', updated_at: 'x', pictures: null },
  { id: 2, list_id: 1, name: 'Eggs', checked: 0, note: 'free-range', position: 1, created_at: 'x', updated_at: 'x', pictures: null },
];

describe('ListDetailScreen', () => {
  beforeEach(() => {
    resetStub();
    resetAppStub();
    itemRepositoryMock.create.mockReset();
    itemRepositoryMock.update.mockReset();
    itemRepositoryMock.delete.mockReset();
    itemRepositoryMock.deleteMany.mockReset();
    itemRepositoryMock.toggle.mockReset();
    itemRepositoryMock.setAllChecked.mockReset();
    itemRepositoryMock.deleteCompleted.mockReset();
    itemRepositoryMock.duplicateItems.mockReset();
    itemRepositoryMock.create.mockResolvedValue({});
    itemRepositoryMock.update.mockResolvedValue(undefined);
    itemRepositoryMock.delete.mockResolvedValue(undefined);
    itemRepositoryMock.deleteMany.mockResolvedValue(undefined);
    itemRepositoryMock.toggle.mockResolvedValue(undefined);
    itemRepositoryMock.setAllChecked.mockResolvedValue(undefined);
    itemRepositoryMock.deleteCompleted.mockResolvedValue(undefined);
    itemRepositoryMock.duplicateItems.mockResolvedValue(undefined);
    listRepositoryMock.delete.mockReset();
    listRepositoryMock.delete.mockResolvedValue(undefined);
    selectMocks.toggleSelectMode.mockReset();
    nav.setOptions.mockReset();
    nav.goBack.mockReset();
    clipboardMock.setStringAsync.mockReset();
    clipboardMock.setStringAsync.mockResolvedValue(true);
    photoMocks.photos = [];
    photoMocks.setPhotos.mockClear();
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
    expect(view.getByText('free-range')).toBeTruthy();
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
        pictures: null,
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

  it('expands and collapses the details area with the toggle', async () => {
    const user = userEvent.setup();
    const view = await render(<ListDetailScreen />);
    await view.findByText('Milk');
    expect(view.queryByLabelText('Note')).toBeNull();

    await user.press(view.getByLabelText('Toggle details'));
    expect(await view.findByLabelText('Note')).toBeTruthy();

    await user.press(view.getByLabelText('Toggle details'));
    expect(view.queryByLabelText('Note')).toBeNull();
  });

  it('shows a char counter under the add name input and updates as it is typed', async () => {
    const user = userEvent.setup();
    const view = await render(<ListDetailScreen />);
    await view.findByText('Milk');
    expect(view.getByText('0/200')).toBeTruthy();

    await user.type(view.getByLabelText('Add an item...'), 'Tea');
    expect(view.getByText('3/200')).toBeTruthy();
  });

  it('turns the name counter red when the max length is reached', async () => {
    const user = userEvent.setup();
    const view = await render(<ListDetailScreen />);
    await view.findByText('Milk');

    await user.type(view.getByLabelText('Add an item...'), 'a'.repeat(200));
    const counter = view.getByText('200/200');
    const styles = flattenStyle(counter.props.style);
    expect(styles.color).toBe(darkColors.red);
  });

  it('shows a char counter under the note input inside the details area', async () => {
    const view = await render(<ListDetailScreen />);
    await view.findByText('Milk');
    expect(view.queryByText('0/2000')).toBeNull();

    fireEvent.press(view.getByLabelText('Toggle details'));
    expect(await view.findByText('0/2000')).toBeTruthy();
  });

  it('shows char counters in the edit modal', async () => {
    const user = userEvent.setup();
    const view = await render(<ListDetailScreen />);
    await view.findByText('Milk');
    await user.press(view.getAllByLabelText('Edit item')[1]);

    expect(await view.findByText('4/200')).toBeTruthy();
    expect(view.getByText('10/2000')).toBeTruthy();
  });

  it('shows the note preview and opens the full note viewer', async () => {
    const user = userEvent.setup();
    const view = await render(<ListDetailScreen />);
    await view.findByText('Milk');
    expect(view.getByText('free-range')).toBeTruthy();

    await user.press(view.getByLabelText('View note'));
    expect(await view.findByLabelText('Close')).toBeTruthy();
  });

  it('shows the photo section inside the expanded details area', async () => {
    const view = await render(<ListDetailScreen />);
    await view.findByText('Milk');
    expect(view.queryByLabelText('Add photo')).toBeNull();

    fireEvent.press(view.getByLabelText('Toggle details'));
    expect(await view.findByLabelText('Add photo')).toBeTruthy();
  });

  it('adds a new item with photos, serializing them for storage', async () => {
    photoMocks.photos = ['data:image/png;base64,AA'];
    const user = userEvent.setup();
    const view = await render(<ListDetailScreen />);
    await view.findByText('Milk');

    await user.press(view.getByLabelText('Toggle details'));
    await user.type(view.getByLabelText('Add an item...'), 'Tea');
    await user.press(view.getByLabelText('Add'));

    await waitFor(() =>
      expect(itemRepositoryMock.create).toHaveBeenCalledWith({
        list_id: 1,
        name: 'Tea',
        note: null,
        pictures: '["data:image/png;base64,AA"]',
        checked: 0,
        position: 2,
      })
    );
    expect(photoMocks.setPhotos).toHaveBeenCalledWith([]);
  });

  it('adds a new item with a note', async () => {
    const user = userEvent.setup();
    const view = await render(<ListDetailScreen />);
    await view.findByText('Milk');

    await user.press(view.getByLabelText('Toggle details'));
    await user.type(view.getByLabelText('Add an item...'), 'Tea');
    await user.type(await view.findByLabelText('Note'), 'green tea');
    await user.press(view.getByLabelText('Add'));

    await waitFor(() =>
      expect(itemRepositoryMock.create).toHaveBeenCalledWith({
        list_id: 1,
        name: 'Tea',
        note: 'green tea',
        pictures: null,
        checked: 0,
        position: 2,
      })
    );
  });

  it('clears and collapses the details area after adding', async () => {
    const user = userEvent.setup();
    const view = await render(<ListDetailScreen />);
    await view.findByText('Milk');

    await user.press(view.getByLabelText('Toggle details'));
    await user.type(view.getByLabelText('Add an item...'), 'Tea');
    await user.type(await view.findByLabelText('Note'), 'green tea');
    await user.press(view.getByLabelText('Add'));

    await waitFor(() => expect(itemRepositoryMock.create).toHaveBeenCalled());
    expect(view.queryByLabelText('Note')).toBeNull();
    expect(view.getByLabelText('Add an item...').props.value).toBe('');
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
      expect(itemRepositoryMock.update).toHaveBeenCalledWith(2, { name: 'Eggs (brown)', note: 'from the market', pictures: null })
    );
  });

  it('updates an item with photos in the edit modal', async () => {
    photoMocks.photos = ['data:image/png;base64,BB'];
    const user = userEvent.setup();
    const view = await render(<ListDetailScreen />);
    await view.findByText('Milk');
    await user.press(view.getAllByLabelText('Edit item')[1]);
    await view.findByLabelText('Name');

    await user.press(view.getByLabelText('Save'));
    await waitFor(() =>
      expect(itemRepositoryMock.update).toHaveBeenCalledWith(2, { name: 'Eggs', note: 'free-range', pictures: '["data:image/png;base64,BB"]' })
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

  it('shows complete all, uncomplete all and clear completed buttons when the list has items', async () => {
    const view = await render(<ListDetailScreen />);
    await view.findByText('Milk');
    expect(view.getByLabelText('Complete all')).toBeTruthy();
    expect(view.getByLabelText('Uncomplete all')).toBeTruthy();
    expect(view.getByLabelText('Clear completed')).toBeTruthy();
  });

  it('hides the batch toolbar when the list has no items', async () => {
    setItemsByListId(new Map([[1, []]]));
    const view = await render(<ListDetailScreen />);
    await view.findByText('No items yet');
    expect(view.queryByLabelText('Complete all')).toBeNull();
    expect(view.queryByLabelText('Uncomplete all')).toBeNull();
    expect(view.queryByLabelText('Clear completed')).toBeNull();
  });

  it('hides the batch toolbar while searching', async () => {
    const view = await render(<ListDetailScreen />);
    await view.findByText('Milk');
    expect(view.getByLabelText('Complete all')).toBeTruthy();

    const opts = lastHeaderRight() as { headerRight?: () => ReactElement } | undefined;
    const headerTree = await render(opts!.headerRight!());
    fireEvent.press(headerTree.getByLabelText('Search'));
    await view.findByPlaceholderText('Search items...', {}, { timeout: 2000 });
    expect(view.queryByLabelText('Complete all')).toBeNull();
    expect(view.queryByLabelText('Uncomplete all')).toBeNull();
  });

  it('ignores complete all when every item is already completed', async () => {
    setItemsByListId(new Map([[1, [ITEMS[0], { ...ITEMS[1], checked: 1 }]]]));
    const user = userEvent.setup();
    const view = await render(<ListDetailScreen />);
    await view.findByText('Milk');
    await user.press(view.getByLabelText('Complete all'));
    expect(itemRepositoryMock.setAllChecked).not.toHaveBeenCalled();
  });

  it('checks every item when complete all is pressed', async () => {
    const user = userEvent.setup();
    const view = await render(<ListDetailScreen />);
    await view.findByText('Milk');
    await user.press(view.getByLabelText('Complete all'));
    await waitFor(() => expect(itemRepositoryMock.setAllChecked).toHaveBeenCalledWith(1, true));
  });

  it('unchecks every item when uncomplete all is pressed', async () => {
    const user = userEvent.setup();
    const view = await render(<ListDetailScreen />);
    await view.findByText('Milk');
    await user.press(view.getByLabelText('Uncomplete all'));
    await waitFor(() => expect(itemRepositoryMock.setAllChecked).toHaveBeenCalledWith(1, false));
  });

  it('ignores uncomplete all when nothing is checked', async () => {
    setItemsByListId(new Map([[1, [{ ...ITEMS[0], checked: 0 }, ITEMS[1]]]]));
    const user = userEvent.setup();
    const view = await render(<ListDetailScreen />);
    await view.findByText('Milk');
    await user.press(view.getByLabelText('Uncomplete all'));
    expect(itemRepositoryMock.setAllChecked).not.toHaveBeenCalled();
  });

  it('ignores clear completed when nothing is completed', async () => {
    setItemsByListId(new Map([[1, [{ ...ITEMS[0], checked: 0 }, ITEMS[1]]]]));
    const user = userEvent.setup();
    const view = await render(<ListDetailScreen />);
    await view.findByText('Milk');
    await user.press(view.getByLabelText('Clear completed'));
    expect(view.queryByText(/completed item/)).toBeNull();
    expect(itemRepositoryMock.deleteCompleted).not.toHaveBeenCalled();
  });

  it('clears completed items only after confirmation', async () => {
    const user = userEvent.setup();
    const view = await render(<ListDetailScreen />);
    await view.findByText('Milk');
    await user.press(view.getByLabelText('Clear completed'));

    expect(await view.findByText('Delete 1 completed item?')).toBeTruthy();
    expect(itemRepositoryMock.deleteCompleted).not.toHaveBeenCalled();

    await user.press(view.getByLabelText('Delete'));
    await waitFor(() => expect(itemRepositoryMock.deleteCompleted).toHaveBeenCalledWith(1));
  });

  it('registers a select toggle in the header and exits select mode on press', async () => {
    const header = await renderHeader();
    expect(header.getByLabelText('Enter select mode')).toBeTruthy();
    fireEventPress(header, 'Enter select mode');
    expect(selectMocks.toggleSelectMode).toHaveBeenCalled();
  });

  it('registers search and select toggles side by side in the header', async () => {
    const header = await renderHeader();
    expect(header.getByLabelText('Search')).toBeTruthy();
    expect(header.getByLabelText('Enter select mode')).toBeTruthy();
  });

  it('has no header actions when the list has no items', async () => {
    setItemsByListId(new Map([[1, []]]));
    await render(<ListDetailScreen />);
    const calls = nav.setOptions.mock.calls;
    const lastSetOptions = calls[calls.length - 1]?.[0];
    expect(lastSetOptions?.headerRight).toBeUndefined();
  });

  it('navigates to Edit List when the header pencil is pressed', async () => {
    const view = await render(<ListDetailScreen />);
    await view.findByText('Milk');
    await userEvent.setup().press(view.getByLabelText('Edit list'));
    expect(nav.navigate).toHaveBeenCalledWith('EditList', { listId: 1 });
  });

  it('shows copy icons only when the list has items', async () => {
    setItemsByListId(new Map([[1, []]]));
    const view = await render(<ListDetailScreen />);
    await view.findByText('No items yet');
    expect(view.queryByLabelText('Copy list')).toBeNull();
    expect(view.queryByLabelText('Copy list with notes')).toBeNull();
    expect(view.queryByLabelText('Copy items to another list')).toBeNull();
  });

  it('copies item names without notes via the simple copy action', async () => {
    const user = userEvent.setup();
    const view = await render(<ListDetailScreen />);
    await view.findByText('Milk');
    await user.press(view.getByLabelText('Copy list'));
    await waitFor(() =>
      expect(clipboardMock.setStringAsync).toHaveBeenCalledWith('Groceries\n✅ Milk\nEggs')
    );
  });

  it('copies item names and notes via the full copy action', async () => {
    const user = userEvent.setup();
    const view = await render(<ListDetailScreen />);
    await view.findByText('Milk');
    await user.press(view.getByLabelText('Copy list with notes'));
    await waitFor(() =>
      expect(clipboardMock.setStringAsync).toHaveBeenCalledWith('Groceries\n✅ Milk\nEggs — free-range')
    );
  });

  it('shows a specific confirmation after the simple copy', async () => {
    const user = userEvent.setup();
    const view = await render(<ListDetailScreen />);
    await view.findByText('Milk');
    await user.press(view.getByLabelText('Copy list'));
    expect(await view.findByText('List copied')).toBeTruthy();
  });

  it('shows a specific confirmation after the full copy', async () => {
    const user = userEvent.setup();
    const view = await render(<ListDetailScreen />);
    await view.findByText('Milk');
    await user.press(view.getByLabelText('Copy list with notes'));
    expect(await view.findByText('List + notes copied')).toBeTruthy();
  });

  it('opens the list picker excluding the current list when copy-to-list is pressed', async () => {
    const user = userEvent.setup();
    const other: ListWithCounts = {
      id: 2,
      name: 'Work Tasks',
      color: '#34D399',
      icon: 'briefcase-outline',
      collection_id: null,
      created_at: 'x',
      position: 1,
      pinned: 0,
      total: 2,
      completed: 0,
    };
    setLists([LIST, other]);
    const view = await render(<ListDetailScreen />);
    await view.findByText('Milk');
    await user.press(view.getByLabelText('Copy items to another list'));

    expect(await view.findByLabelText('Work Tasks')).toBeTruthy();
    expect(view.queryByLabelText('Groceries')).toBeNull();
  });

  it('copies all items into a chosen list and confirms with a feedback label', async () => {
    const user = userEvent.setup();
    const other: ListWithCounts = {
      id: 2,
      name: 'Work Tasks',
      color: '#34D399',
      icon: 'briefcase-outline',
      collection_id: null,
      created_at: 'x',
      position: 1,
      pinned: 0,
      total: 2,
      completed: 0,
    };
    setLists([LIST, other]);
    const view = await render(<ListDetailScreen />);
    await view.findByText('Milk');
    await user.press(view.getByLabelText('Copy items to another list'));

    await user.press(await view.findByLabelText('Work Tasks'));
    await waitFor(() => expect(itemRepositoryMock.duplicateItems).toHaveBeenCalledWith(1, 2));
    expect(await view.findByText('Copied to Work Tasks')).toBeTruthy();
  });

  it('reorders items through the repository when the grid drag ends', async () => {
    itemRepositoryMock.reorder = vi.fn().mockResolvedValue(undefined);
    const view = await render(<ListDetailScreen />);
    await view.findByText('Milk');
    const grid = lastGrid();
    expect(grid?.sortEnabled).toBe(true);

    fireGridDragEnd({ data: [ITEMS[1], ITEMS[0]] });
    await waitFor(() => expect(itemRepositoryMock.reorder).toHaveBeenCalledWith(1, [2, 1]));
  });

  it('disables reordering when the list has a single item', async () => {
    setItemsByListId(new Map([[1, [ITEMS[0]]]]));
    const view = await render(<ListDetailScreen />);
    await view.findByText('Milk');
    expect(lastGrid()?.sortEnabled).toBe(false);
  });

it('disables reordering while searching', async () => {
    const view = await render(<ListDetailScreen />);
    await view.findByText('Milk');
    expect(lastGrid()?.sortEnabled).toBe(true);

    const opts = lastHeaderRight() as { headerRight?: () => ReactElement } | undefined;
    const headerTree = await render(opts!.headerRight!());
    fireEvent.press(headerTree.getByLabelText('Search'));
    const searchInput = await view.findByPlaceholderText('Search items...', {}, { timeout: 2000 });
    await act(async () => {
      searchInput.props.onChangeText('Milk');
    });
    await waitFor(() => expect(view.getByPlaceholderText('Search items...').props.value).toBe('Milk'));
    expect(lastGrid()?.sortEnabled).toBe(false);
  });

  it('shows the sort control when the list has items and hides it when empty', async () => {
    const view = await render(<ListDetailScreen />);
    await view.findByText('Milk');
    expect(view.getByLabelText('Sort items: Manual')).toBeTruthy();

    setItemsByListId(new Map([[1, []]]));
    const empty = await render(<ListDetailScreen />);
    await empty.findByText('No items yet');
    expect(empty.queryByLabelText(/Sort items/)).toBeNull();
  });

  it('hides the sort control while searching', async () => {
    const view = await render(<ListDetailScreen />);
    await view.findByText('Milk');
    expect(view.getByLabelText('Sort items: Manual')).toBeTruthy();

    const opts = lastHeaderRight() as { headerRight?: () => ReactElement } | undefined;
    const headerTree = await render(opts!.headerRight!());
    fireEvent.press(headerTree.getByLabelText('Search'));
    await view.findByPlaceholderText('Search items...', {}, { timeout: 2000 });
    expect(view.queryByLabelText(/Sort items/)).toBeNull();
  });

  it('sorts items by name ascending from the picker and disables drag', async () => {
    const user = userEvent.setup();
    const view = await render(<ListDetailScreen />);
    await view.findByText('Milk');
    expect(lastGrid()?.data?.map(i => (i as Item).name)).toEqual(['Milk', 'Eggs']);

    await user.press(view.getByLabelText('Sort items: Manual'));
    await user.press(await view.findByLabelText('Name Ascending'));
    await user.press(await view.findByLabelText('Select'));

    await waitFor(() =>
      expect(view.getAllByText(/^(Milk|Eggs)$/).map(n => n.props.children as string)).toEqual(['Eggs', 'Milk'])
    );
    expect(view.getByLabelText('Sort items: Name Ascending')).toBeTruthy();
  });

  it('sorts items by created descending from the picker', async () => {
    const orderedItems: Item[] = [
      { ...ITEMS[0], name: 'Old', created_at: '2020-01-01 00:00:00' },
      { ...ITEMS[1], name: 'New', created_at: '2026-01-01 00:00:00' },
    ];
    setItemsByListId(new Map([[1, orderedItems]]));
    const user = userEvent.setup();
    const view = await render(<ListDetailScreen />);
    await view.findByText('Old');

    await user.press(view.getByLabelText('Sort items: Manual'));
    await user.press(await view.findByLabelText('Created Descending'));
    await user.press(await view.findByLabelText('Select'));

    await waitFor(() => expect(view.getByLabelText('Sort items: Created Descending')).toBeTruthy());
    await waitFor(() =>
      expect(view.getAllByText(/^(Old|New)$/).map(n => n.props.children as string)).toEqual(['New', 'Old'])
    );
  });

  it('restores manual order and drag after picking Manual', async () => {
    const user = userEvent.setup();
    const view = await render(<ListDetailScreen />);
    await view.findByText('Milk');

    await user.press(view.getByLabelText('Sort items: Manual'));
    await user.press(await view.findByLabelText('Name Ascending'));
    await user.press(await view.findByLabelText('Select'));
    await waitFor(() =>
      expect(view.getAllByText(/^(Milk|Eggs)$/).map(n => n.props.children as string)).toEqual(['Eggs', 'Milk'])
    );

    await user.press(view.getByLabelText('Sort items: Name Ascending'));
    await user.press(await view.findByLabelText('Manual'));
    await user.press(await view.findByLabelText('Select'));

    await waitFor(() =>
      expect(view.getAllByText(/^(Milk|Eggs)$/).map(n => n.props.children as string)).toEqual(['Milk', 'Eggs'])
    );
    expect(view.getByLabelText('Sort items: Manual')).toBeTruthy();
  });

  it('keeps an active sort applied to search results', async () => {
    const orderedItems: Item[] = [
      { ...ITEMS[0], name: 'Old', created_at: '2020-01-01 00:00:00' },
      { ...ITEMS[1], name: 'New', created_at: '2026-01-01 00:00:00' },
    ];
    setItemsByListId(new Map([[1, orderedItems]]));
    const user = userEvent.setup();
    const view = await render(<ListDetailScreen />);
    await view.findByText('Old');

    await user.press(view.getByLabelText('Sort items: Manual'));
    await user.press(await view.findByLabelText('Created Descending'));
    await user.press(await view.findByLabelText('Select'));
    await waitFor(() => expect(view.getByLabelText('Sort items: Created Descending')).toBeTruthy());

    const opts = lastHeaderRight() as { headerRight?: () => ReactElement } | undefined;
    const headerTree = await render(opts!.headerRight!());
    fireEvent.press(headerTree.getByLabelText('Search'));
    const searchInput = await view.findByPlaceholderText('Search items...', {}, { timeout: 2000 });
    await act(async () => {
      searchInput.props.onChangeText('New');
    });
    await waitFor(() => expect(view.getAllByText(/^(Old|New)$/).map(n => n.props.children as string)).toEqual(['New']));
    expect(view.queryByLabelText(/Sort items/)).toBeNull();
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

async function renderHeader() {
  await render(<ListDetailScreen />);
  const opts = lastHeaderRight() as { headerRight?: () => ReactElement } | undefined;
  if (!opts?.headerRight) throw new Error('headerRight not registered');
  return render(opts.headerRight());
}

function ScreenWithHeader({ screen }: { screen: ReactNode }) {
  const [header, setHeader] = useState<(() => ReactNode) | null>(null);
  useEffect(() => {
    const opts = lastHeaderRight();
    setHeader(() => (opts && 'headerRight' in opts ? opts.headerRight : null));
  }, []);
  return (
    <View>
      {screen}
      {header ? header() : null}
    </View>
  );
}

async function renderWithHeader() {
  const view = await render(<ScreenWithHeader screen={<ListDetailScreen />} />);
  await view.findByText('Milk');
  return view;
}

function fireEventPress(view: Awaited<ReturnType<typeof render>>, label: string) {
  fireEvent.press(view.getByLabelText(label));
}

function flattenStyle(style: unknown): Record<string, unknown> {
  if (Array.isArray(style)) {
    return style.reduce((acc: Record<string, unknown>, s) => ({ ...acc, ...flattenStyle(s) }), {});
  }
  if (style && typeof style === 'object') {
    return { ...(style as Record<string, unknown>) };
  }
  return {};
}