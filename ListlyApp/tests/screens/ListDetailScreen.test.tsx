import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, fireEvent, userEvent, waitFor } from '@testing-library/react-native';
import type { ReactElement, ReactNode } from 'react';
import ListDetailScreen from '../../src/screens/ListDetailScreen';
import {
  buildAppMock,
  resetAppStub,
  setItemsByListId,
  setLists,
} from '../component/helpers/appStub';
import { resetStub } from '../component/helpers/configStub';
import type { Item, ListWithCounts } from '../../src/database/types';

const { itemRepositoryMock, selectMocks, nav, photoMocks } = vi.hoisted(() => ({
  itemRepositoryMock: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    toggle: vi.fn(),
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
  },
}));

vi.mock('../../src/database', () => ({
  itemRepository: itemRepositoryMock,
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
    enterSelectMode: vi.fn(),
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
  created_at: 'x',
  position: 0,
  total: 2,
  completed: 1,
};

const ITEMS: Item[] = [
  { id: 1, list_id: 1, name: 'Milk', checked: 1, note: null, position: 0, created_at: 'x', pictures: null },
  { id: 2, list_id: 1, name: 'Eggs', checked: 0, note: 'free-range', position: 1, created_at: 'x', pictures: null },
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
    itemRepositoryMock.create.mockResolvedValue({});
    itemRepositoryMock.update.mockResolvedValue(undefined);
    itemRepositoryMock.delete.mockResolvedValue(undefined);
    itemRepositoryMock.deleteMany.mockResolvedValue(undefined);
    itemRepositoryMock.toggle.mockResolvedValue(undefined);
    selectMocks.toggleSelectMode.mockReset();
    nav.setOptions.mockReset();
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

  it('does not register a select toggle when the list has no items', async () => {
    setItemsByListId(new Map([[1, []]]));
    await render(<ListDetailScreen />);
    const calls = nav.setOptions.mock.calls;
    const headerCmds = calls.filter((c) => c[0] && 'headerRight' in c[0]);
    expect(headerCmds.length).toBeGreaterThan(0);
    const last = headerCmds[headerCmds.length - 1][0] as { headerRight?: () => ReactElement };
    expect(last.headerRight).toBeUndefined();
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

function fireEventPress(view: Awaited<ReturnType<typeof render>>, label: string) {
  fireEvent.press(view.getByLabelText(label));
}