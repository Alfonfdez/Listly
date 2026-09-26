import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, userEvent, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import CreateListScreen from '../../src/screens/CreateListScreen';
import { buildAppMock, resetAppStub, setLists } from '../helpers/appStub';
import { resetStub } from '../helpers/configStub';
import { LIST_ICONS } from '../../src/constants/listIcons';
import { QUICK_COLORS } from '../../src/constants/listColors';
import { MAX_LIST_NAME_LENGTH } from '../../src/constants/types';
import type { ListWithCounts } from '../../src/database/types';

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
    create: vi.fn(),
    duplicate: vi.fn(),
  },
}));

vi.mock('../../src/database', () => ({
  listRepository: listRepositoryMock,
}));

vi.mock('../../src/context/AppContext', () => ({
  useApp: () => buildAppMock(),
  AppProvider: ({ children }: { children: ReactNode }) => children as ReactNode,
}));

const nav = { goBack: vi.fn(), replace: vi.fn() };
const routeParams = {} as Record<string, unknown>;

vi.mock('@react-navigation/native', () => ({
  useNavigation: () => nav,
  useRoute: () => ({ params: routeParams }),
}));

const DEBOUNCE_WAIT = 350;

const SOURCE: ListWithCounts = {
  id: 1,
  name: 'Groceries',
  color: '#22D3EE',
  icon: 'cart-outline',
  collection_id: null,
  created_at: 'x',
  position: 0,
  pinned: 0,
  total: 3,
  completed: 1,
};

describe('CreateListScreen', () => {
  beforeEach(() => {
    resetStub();
    resetAppStub();
    Object.keys(routeParams).forEach(key => delete routeParams[key]);
    nav.goBack.mockClear();
    nav.replace.mockClear();
    listRepositoryMock.existsByName.mockReset();
    listRepositoryMock.create.mockReset();
    listRepositoryMock.duplicate.mockReset();
    listRepositoryMock.existsByName.mockResolvedValue(false);
    listRepositoryMock.create.mockResolvedValue({
      id: 7,
      name: 'Weekend',
      color: QUICK_COLORS[0],
      icon: LIST_ICONS[0],
      created_at: 'x',
      position: 6,
    });
    listRepositoryMock.duplicate.mockResolvedValue({
      id: 9,
      name: 'Groceries copy',
      color: '#22D3EE',
      icon: 'cart-outline',
      collection_id: null,
      created_at: 'x',
      position: 1,
    });
  });

  it('renders the form with preselected defaults', async () => {
    const view = await render(<CreateListScreen />);
    expect(view.getByLabelText('Name')).toBeTruthy();
    expect(view.getByLabelText(LIST_ICONS[0]).props.accessibilityState.selected).toBe(true);
    expect(view.getByLabelText(QUICK_COLORS[0]).props.accessibilityState.selected).toBe(true);
  });

  it('disables Create until the name is valid', async () => {
    const user = userEvent.setup();
    const view = await render(<CreateListScreen />);
    const createButton = () => view.getByLabelText('Create');
    expect(createButton().props.accessibilityState.disabled).toBe(true);
    await user.type(view.getByLabelText('Name'), 'Weekend');
    expect(createButton().props.accessibilityState.disabled).toBe(false);
  });

  it('rejects an empty name and keeps Create disabled', async () => {
    const user = userEvent.setup();
    const view = await render(<CreateListScreen />);
    await user.type(view.getByLabelText('Name'), '   ');
    expect(await view.findByText('Name is required')).toBeTruthy();
    expect(view.getByLabelText('Create').props.accessibilityState.disabled).toBe(true);
  });

  it('caps the name input at the max length', async () => {
    const user = userEvent.setup();
    const view = await render(<CreateListScreen />);
    await user.type(view.getByLabelText('Name'), 'a'.repeat(MAX_LIST_NAME_LENGTH + 20));
    expect(view.getByLabelText('Name').props.value.length).toBe(MAX_LIST_NAME_LENGTH);
    expect(view.queryByText('List name is too long')).toBeNull();
  });

  it('rejects a duplicate name after the debounce', async () => {
    listRepositoryMock.existsByName.mockResolvedValue(true);
    const user = userEvent.setup();
    const view = await render(<CreateListScreen />);
    await user.type(view.getByLabelText('Name'), 'Groceries');
    await new Promise(resolve => setTimeout(resolve, DEBOUNCE_WAIT));
    expect(await view.findByText('A list with this name already exists')).toBeTruthy();
    expect(listRepositoryMock.existsByName).toHaveBeenLastCalledWith('Groceries', undefined);
  });

  it('creates the list with the selected icon and color, then navigates back', async () => {
    const user = userEvent.setup();
    const view = await render(<CreateListScreen />);
    await user.press(view.getByLabelText('cart-outline'));
    await user.press(view.getByLabelText('#FBBF24'));
    await user.type(view.getByLabelText('Name'), 'Weekend');
    await new Promise(resolve => setTimeout(resolve, DEBOUNCE_WAIT));
    await user.press(view.getByLabelText('Create'));

    await waitFor(() =>
      expect(listRepositoryMock.create).toHaveBeenCalledWith({
        name: 'Weekend',
        color: '#FBBF24',
        icon: 'cart-outline',
      })
    );
    expect(nav.goBack).toHaveBeenCalled();
  });

  it('opens the color picker modal from "+"', async () => {
    const user = userEvent.setup();
    const view = await render(<CreateListScreen />);
    await user.press(view.getByLabelText('More colors'));
    expect(view.getByText('Pick a color')).toBeTruthy();
    expect(view.getByLabelText('OK')).toBeTruthy();
    expect(view.getByLabelText('Cancel')).toBeTruthy();
  });

  it('applies a custom color from the picker and creates the list with it', async () => {
    const user = userEvent.setup();
    const view = await render(<CreateListScreen />);
    await user.press(view.getByLabelText('More colors'));
    pickerStub.getOnChangeJS()?.({ hex: '#123456' });
    await user.press(view.getByLabelText('OK'));
    expect(view.getByLabelText('#123456').props.accessibilityState.selected).toBe(true);
    await user.type(view.getByLabelText('Name'), 'Weekend');
    await new Promise(resolve => setTimeout(resolve, DEBOUNCE_WAIT));
    await user.press(view.getByLabelText('Create'));
    await waitFor(() =>
      expect(listRepositoryMock.create).toHaveBeenCalledWith({
        name: 'Weekend',
        color: '#123456',
        icon: LIST_ICONS[0],
      })
    );
  });

  it('cancels the picker discarding any pending color change', async () => {
    const user = userEvent.setup();
    const view = await render(<CreateListScreen />);
    await user.press(view.getByLabelText('More colors'));
    pickerStub.getOnChangeJS()?.({ hex: '#123456' });
    await user.press(view.getByLabelText('Cancel'));
    expect(view.queryByLabelText('#123456')).toBeNull();
    expect(view.getByLabelText(QUICK_COLORS[0]).props.accessibilityState.selected).toBe(true);
  });

  it('prefills the form from the source list in duplicate mode', async () => {
    routeParams.duplicateFromListId = 1;
    setLists([SOURCE]);
    const view = await render(<CreateListScreen />);
    expect(view.getByLabelText('Name').props.value).toBe('Groceries copy');
    expect(view.getByLabelText('cart-outline').props.accessibilityState.selected).toBe(true);
    expect(view.getByLabelText('#22D3EE').props.accessibilityState.selected).toBe(true);
  });

  it('duplicates the source list with the pre-filled details on Save, then opens it', async () => {
    const user = userEvent.setup();
    routeParams.duplicateFromListId = 1;
    setLists([SOURCE]);
    const view = await render(<CreateListScreen />);
    await new Promise(resolve => setTimeout(resolve, DEBOUNCE_WAIT));
    await user.press(view.getByLabelText('Create'));

    await waitFor(() =>
      expect(listRepositoryMock.duplicate).toHaveBeenCalledWith(1, {
        name: 'Groceries copy',
        color: '#22D3EE',
        icon: 'cart-outline',
        collection_id: null,
      })
    );
    expect(nav.replace).toHaveBeenCalledWith('ListDetail', { listId: 9 });
  });

  it('duplicates a collection list keeping its collection', async () => {
    const user = userEvent.setup();
    routeParams.duplicateFromListId = 1;
    setLists([{ ...SOURCE, collection_id: 5 }]);
    const view = await render(<CreateListScreen />);
    await new Promise(resolve => setTimeout(resolve, DEBOUNCE_WAIT));
    await user.press(view.getByLabelText('Create'));

    await waitFor(() =>
      expect(listRepositoryMock.duplicate).toHaveBeenCalledWith(1, {
        name: 'Groceries copy',
        color: '#22D3EE',
        icon: 'cart-outline',
        collection_id: 5,
      })
    );
  });

  it('without duplicateFromListId it uses the normal create flow', async () => {
    const user = userEvent.setup();
    setLists([{ ...SOURCE, collection_id: 5 }]);
    const view = await render(<CreateListScreen />);
    await user.type(view.getByLabelText('Name'), 'Weekend');
    await new Promise(resolve => setTimeout(resolve, DEBOUNCE_WAIT));
    await user.press(view.getByLabelText('Create'));

    await waitFor(() =>
      expect(listRepositoryMock.create).toHaveBeenCalledWith({
        name: 'Weekend',
        color: QUICK_COLORS[0],
        icon: LIST_ICONS[0],
      })
    );
    expect(listRepositoryMock.duplicate).not.toHaveBeenCalled();
    expect(nav.goBack).toHaveBeenCalled();
  });
});