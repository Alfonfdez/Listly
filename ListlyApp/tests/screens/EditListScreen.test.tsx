import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, userEvent, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import EditListScreen from '../../src/screens/EditListScreen';
import { buildAppMock, resetAppStub, setLists } from '../helpers/appStub';
import { resetStub } from '../helpers/configStub';
import type { ListWithCounts } from '../../src/database/types';
import { MAX_LIST_NAME_LENGTH } from '../../src/constants/types';

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
  },
}));

vi.mock('../../src/database', () => ({
  listRepository: listRepositoryMock,
}));

vi.mock('../../src/context/AppContext', () => ({
  useApp: () => buildAppMock(),
  AppProvider: ({ children }: { children: ReactNode }) => children as ReactNode,
}));

const nav = { goBack: vi.fn() };

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
  total: 2,
  completed: 0,
};

const DEBOUNCE_WAIT = 350;

describe('EditListScreen', () => {
  beforeEach(() => {
    resetStub();
    resetAppStub();
    nav.goBack.mockClear();
    listRepositoryMock.existsByName.mockReset();
    listRepositoryMock.update.mockReset();
    listRepositoryMock.existsByName.mockResolvedValue(false);
    listRepositoryMock.update.mockResolvedValue(undefined);
    setLists([LIST, OTHER]);
  });

  it('pre-fills the form with the list name, icon, and color', async () => {
    const view = await render(<EditListScreen />);
    expect(view.getByLabelText('Name').props.value).toBe('Groceries');
    expect(view.getByLabelText('cart-outline').props.accessibilityState.selected).toBe(true);
    expect(view.getByLabelText('#22D3EE').props.accessibilityState.selected).toBe(true);
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
    await user.press(view.getByLabelText('#34D399'));
    await new Promise(resolve => setTimeout(resolve, DEBOUNCE_WAIT));
    await user.press(view.getByLabelText('Save'));

    await waitFor(() =>
      expect(listRepositoryMock.update).toHaveBeenCalledWith(1, {
        name: 'Groceries Express',
        color: '#34D399',
        icon: 'briefcase-outline',
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
});