import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, userEvent, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import EditListScreen from '../../src/screens/EditListScreen';
import { buildAppMock, resetAppStub, setLists, setCollections } from '../helpers/appStub';
import { resetStub } from '../helpers/configStub';
import type { CollectionWithCounts, ListWithCounts } from '../../src/database/types';
import { MAX_LIST_NAME_LENGTH } from '../../src/constants/types';
import { QUICK_COLOR_LABELS } from '../../src/constants/listColors';
import { en } from '../../src/i18n/en';

const colorLabel = (color: string): string => {
  const value = en[QUICK_COLOR_LABELS[color]];
  return typeof value === 'string' ? value : color;
};

interface PickerProps {
  value?: string;
  onChangeJS?: (colors: { hex: string }) => void;
  children?: ReactNode;
}

const pickerStub = vi.hoisted(() => {
  let onChangeJS: ((colors: { hex: string }) => void) | undefined;
  function ColorPickerStub(props: PickerProps): ReactNode {
    onChangeJS = props.onChangeJS;
    return props.children ?? null;
  }
  return { ColorPickerStub, getOnChangeJS: () => onChangeJS };
});

vi.mock('reanimated-color-picker', () => ({
  default: pickerStub.ColorPickerStub,
  Panel1: () => null,
  HueSlider: () => null,
  OpacitySlider: () => null,
  Preview: () => null,
}));

const { listRepositoryMock } = vi.hoisted(() => ({
  listRepositoryMock: {
    existsByName: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    moveToCollection: vi.fn(),
    removeFromCollection: vi.fn(),
  },
}));

vi.mock('../../src/database', () => ({
  listRepo: listRepositoryMock,
}));

vi.mock('../../src/context/AppContext', () => ({
  useApp: () => buildAppMock(),
  AppProvider: ({ children }: { children: ReactNode }) => children as ReactNode,
}));

const nav = { goBack: vi.fn(), popToTop: vi.fn(), navigate: vi.fn() };

vi.mock('@react-navigation/native', () => ({
  useRoute: () => ({ params: { listId: 1 } }),
  useNavigation: () => nav,
}));

const LIST: ListWithCounts = {
  id: 1,
  name: 'Groceries',
  color: '#22D3EE',
  icon: 'cart-outline',
  collection_id: null,
  created_at: 'x',
  position: 0,
  pinned: 0,
  kind: 'standard',
  total: 5,
  completed: 2,
};

const OTHER: ListWithCounts = {
  id: 2,
  name: 'Work Tasks',
  color: '#34D399',
  icon: 'briefcase-outline',
  collection_id: null,
  created_at: 'x',
  position: 1,
  pinned: 0,
  kind: 'standard',
  total: 2,
  completed: 0,
};

const IN_COLLECTION: ListWithCounts = {
  ...LIST,
  name: 'Recipes',
  collection_id: 7,
};

const KITCHEN: CollectionWithCounts = {
  id: 7,
  name: 'Kitchen',
  color: '#F59E0B',
  icon: 'restaurant-outline',
  created_at: 'x',
  position: 0,
  pinned: 0,
  total: 3,
  completed: 1,
};

const GARDEN: CollectionWithCounts = {
  id: 8,
  name: 'Garden',
  color: '#10B981',
  icon: 'leaf-outline',
  created_at: 'x',
  position: 1,
  pinned: 0,
  total: 0,
  completed: 0,
};

const DEBOUNCE_WAIT = 350;

describe('EditListScreen', () => {
  beforeEach(() => {
    resetStub();
    resetAppStub();
    nav.goBack.mockClear();
    nav.popToTop.mockClear();
    nav.navigate.mockClear();
    listRepositoryMock.existsByName.mockReset();
    listRepositoryMock.update.mockReset();
    listRepositoryMock.delete.mockReset();
    listRepositoryMock.moveToCollection.mockReset();
    listRepositoryMock.removeFromCollection.mockReset();
    listRepositoryMock.existsByName.mockResolvedValue(false);
    listRepositoryMock.update.mockResolvedValue(undefined);
    listRepositoryMock.delete.mockResolvedValue(undefined);
    listRepositoryMock.moveToCollection.mockResolvedValue(undefined);
    listRepositoryMock.removeFromCollection.mockResolvedValue(undefined);
    setLists([LIST, OTHER]);
    setCollections([KITCHEN, GARDEN]);
  });

  it('pre-fills the form with the list name, icon, and color', async () => {
    const view = await render(<EditListScreen />);
    expect(view.getByLabelText('Name').props.value).toBe('Groceries');
    expect(view.getByLabelText('cart-outline').props.accessibilityState.selected).toBe(true);
    expect(view.getByLabelText(colorLabel('#22D3EE')).props.accessibilityState.selected).toBe(true);
    expect(view.getByLabelText('Save')).toBeTruthy();
  });

  it('caps the name input at the max length', async () => {
    const user = userEvent.setup();
    const view = await render(<EditListScreen />);
    await user.type(view.getByLabelText('Name'), 'a'.repeat(MAX_LIST_NAME_LENGTH + 20));
    expect(view.getByLabelText('Name').props.value.length).toBe(MAX_LIST_NAME_LENGTH);
    expect(view.queryByText('List name is too long')).toBeNull();
  });

  it('saves an unchanged name without a duplicate error (excludes self)', async () => {
    const user = userEvent.setup();
    const view = await render(<EditListScreen />);
    await waitFor(() =>
      expect(listRepositoryMock.existsByName).toHaveBeenCalledWith('Groceries', 1)
    );
    expect(view.queryByText('A list with this name already exists')).toBeNull();

    await user.press(view.getByLabelText('Save'));
    await waitFor(() =>
      expect(listRepositoryMock.update).toHaveBeenCalledWith(1, {
        name: 'Groceries',
        color: '#22D3EE',
        icon: 'cart-outline',
        kind: 'standard',
      })
    );
    expect(nav.goBack).toHaveBeenCalled();
  });

  it('rejects a name that belongs to another list', async () => {
    listRepositoryMock.existsByName.mockResolvedValue(true);
    const user = userEvent.setup();
    const view = await render(<EditListScreen />);
    await user.type(view.getByLabelText('Name'), 'Work Tasks');
    await new Promise(resolve => setTimeout(resolve, DEBOUNCE_WAIT));
    expect(await view.findByText('A list with this name already exists')).toBeTruthy();
    expect(view.getByLabelText('Save').props.accessibilityState.disabled).toBe(true);
    expect(listRepositoryMock.update).not.toHaveBeenCalled();
  });

  it('saves a new name, icon, and color, then navigates back', async () => {
    const user = userEvent.setup();
    const view = await render(<EditListScreen />);
    await user.clear(view.getByLabelText('Name'));
    await user.type(view.getByLabelText('Name'), 'Groceries Express');
    await user.press(view.getByLabelText('briefcase-outline'));
    await user.press(view.getByLabelText(colorLabel('#34D399')));
    await new Promise(resolve => setTimeout(resolve, DEBOUNCE_WAIT));
    await user.press(view.getByLabelText('Save'));

    await waitFor(() =>
      expect(listRepositoryMock.update).toHaveBeenCalledWith(1, {
        name: 'Groceries Express',
        color: '#34D399',
        icon: 'briefcase-outline',
        kind: 'standard',
      })
    );
    expect(nav.goBack).toHaveBeenCalled();
  });

  it('shows the not-found empty state when the list does not exist', async () => {
    setLists([OTHER]);
    const view = await render(<EditListScreen />);
    expect(await view.findByText('No lists yet')).toBeTruthy();
    expect(view.queryByLabelText('Save')).toBeNull();
  });

  it('deletes the list after confirming and returns to the overview', async () => {
    const user = userEvent.setup();
    const view = await render(<EditListScreen />);
    await user.press(view.getByLabelText('Delete list'));
    expect(await view.findByText('Delete list?')).toBeTruthy();
    expect(listRepositoryMock.delete).not.toHaveBeenCalled();

    const buttons = view.getAllByLabelText('Delete list');
    await user.press(buttons[buttons.length - 1]);
    await waitFor(() => expect(listRepositoryMock.delete).toHaveBeenCalledWith(1));
    expect(nav.popToTop).toHaveBeenCalled();
  });

  it('opens a duplicate draft of the current list', async () => {
    const user = userEvent.setup();
    const view = await render(<EditListScreen />);
    await user.press(view.getByLabelText('Duplicate list'));
    expect(nav.navigate).toHaveBeenCalledWith('CreateList', { duplicateFromListId: 1 });
  });

  it('shows the current collection in the Collection row when set', async () => {
    setLists([IN_COLLECTION]);
    const view = await render(<EditListScreen />);
    expect(view.getByLabelText('Collection: Kitchen')).toBeTruthy();
  });

  it('shows the standalone label in the Collection row when no collection is set', async () => {
    const view = await render(<EditListScreen />);
    expect(view.getByLabelText('Collection: Standalone / No collection')).toBeTruthy();
  });

  it('moves the list into a chosen collection on Save', async () => {
    const user = userEvent.setup();
    const view = await render(<EditListScreen />);
    await user.press(view.getByLabelText('Collection: Standalone / No collection'));
    await user.press(view.getByLabelText('Kitchen'));
    await user.press(view.getByLabelText('Save'));

    await waitFor(() =>
      expect(listRepositoryMock.update).toHaveBeenCalledWith(1, {
        name: 'Groceries',
        color: '#22D3EE',
        icon: 'cart-outline',
        kind: 'standard',
      })
    );
    expect(listRepositoryMock.moveToCollection).toHaveBeenCalledWith(1, 7);
    expect(listRepositoryMock.removeFromCollection).not.toHaveBeenCalled();
    expect(nav.goBack).toHaveBeenCalled();
  });

  it('moves the list back to Standalone on Save', async () => {
    setLists([IN_COLLECTION]);
    const user = userEvent.setup();
    const view = await render(<EditListScreen />);
    await user.press(view.getByLabelText('Collection: Kitchen'));
    await user.press(view.getByLabelText('Standalone / No collection'));
    await user.press(view.getByLabelText('Save'));

    await waitFor(() =>
      expect(listRepositoryMock.removeFromCollection).toHaveBeenCalledWith(1)
    );
    expect(listRepositoryMock.moveToCollection).not.toHaveBeenCalled();
    expect(nav.goBack).toHaveBeenCalled();
  });

  it('leaves an unchanged collection untouched on Save', async () => {
    setLists([IN_COLLECTION]);
    const user = userEvent.setup();
    const view = await render(<EditListScreen />);
    await user.press(view.getByLabelText('Collection: Kitchen'));
    await user.press(view.getByLabelText('Cancel'));
    await user.press(view.getByLabelText('Save'));

    await waitFor(() =>
      expect(listRepositoryMock.update).toHaveBeenCalledWith(1, {
        name: 'Recipes',
        color: '#22D3EE',
        icon: 'cart-outline',
        kind: 'standard',
      })
    );
    expect(listRepositoryMock.moveToCollection).not.toHaveBeenCalled();
    expect(listRepositoryMock.removeFromCollection).not.toHaveBeenCalled();
    expect(nav.goBack).toHaveBeenCalled();
  });

  it('keeps the screen when the collection move fails', async () => {
    listRepositoryMock.moveToCollection.mockRejectedValueOnce(new Error('db error'));
    const user = userEvent.setup();
    const view = await render(<EditListScreen />);
    await user.press(view.getByLabelText('Collection: Standalone / No collection'));
    await user.press(view.getByLabelText('Kitchen'));
    await user.press(view.getByLabelText('Save'));

    await waitFor(() => expect(listRepositoryMock.moveToCollection).toHaveBeenCalledWith(1, 7));
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(nav.goBack).not.toHaveBeenCalled();
    expect(view.getByLabelText('Save')).toBeTruthy();
  });
});