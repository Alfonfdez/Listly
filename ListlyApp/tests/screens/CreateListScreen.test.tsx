import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, userEvent, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import CreateListScreen from '../../src/screens/CreateListScreen';
import { buildAppMock, resetAppStub } from '../component/helpers/appStub';
import { resetStub } from '../component/helpers/configStub';
import { LIST_ICONS } from '../../src/constants/listIcons';
import { LIST_COLORS } from '../../src/constants/listColors';
import { MAX_LIST_NAME_LENGTH } from '../../src/constants/types';

const { listRepositoryMock } = vi.hoisted(() => ({
  listRepositoryMock: {
    existsByName: vi.fn(),
    create: vi.fn(),
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
  useNavigation: () => nav,
}));

const DEBOUNCE_WAIT = 350;

describe('CreateListScreen', () => {
  beforeEach(() => {
    resetStub();
    resetAppStub();
    nav.goBack.mockClear();
    listRepositoryMock.existsByName.mockReset();
    listRepositoryMock.create.mockReset();
    listRepositoryMock.existsByName.mockResolvedValue(false);
    listRepositoryMock.create.mockResolvedValue({
      id: 7,
      name: 'Weekend',
      color: LIST_COLORS[0],
      icon: LIST_ICONS[0],
      created_at: 'x',
    });
  });

  it('renders the form with preselected defaults', async () => {
    const view = await render(<CreateListScreen />);
    expect(view.getByText('Create list')).toBeTruthy();
    expect(view.getByLabelText('Name')).toBeTruthy();
    expect(view.getByLabelText(LIST_ICONS[0]).props.accessibilityState.selected).toBe(true);
    expect(view.getByLabelText(LIST_COLORS[0]).props.accessibilityState.selected).toBe(true);
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
    expect(listRepositoryMock.existsByName).toHaveBeenCalledWith('Groceries');
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
});