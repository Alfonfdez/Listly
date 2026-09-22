import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, userEvent, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import EditCollectionScreen from '../../src/screens/EditCollectionScreen';
import { buildAppMock, resetAppStub, setCollections, setListsByCollectionId } from '../helpers/appStub';
import { resetStub } from '../helpers/configStub';
import type { CollectionWithCounts, ListWithCounts } from '../../src/database/types';

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

const { collectionRepositoryMock } = vi.hoisted(() => ({
  collectionRepositoryMock: {
    existsByName: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../src/database', () => ({
  collectionRepository: collectionRepositoryMock,
  listRepository: { deleteMany: vi.fn() },
  itemRepository: {},
}));

vi.mock('../../src/context/AppContext', () => ({
  useApp: () => buildAppMock(),
  AppProvider: ({ children }: { children: ReactNode }) => children as ReactNode,
}));

const nav = { goBack: vi.fn(), popToTop: vi.fn() };

vi.mock('@react-navigation/native', () => ({
  useRoute: () => ({ params: { collectionId: 10 } }),
  useNavigation: () => nav,
}));

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
];

describe('EditCollectionScreen', () => {
  beforeEach(() => {
    resetStub();
    resetAppStub();
    nav.goBack.mockClear();
    nav.popToTop.mockClear();
    collectionRepositoryMock.existsByName.mockReset();
    collectionRepositoryMock.update.mockReset();
    collectionRepositoryMock.delete.mockReset();
    collectionRepositoryMock.existsByName.mockResolvedValue(false);
    collectionRepositoryMock.update.mockResolvedValue(undefined);
    collectionRepositoryMock.delete.mockResolvedValue(undefined);
    setCollections([COLLECTION]);
    setListsByCollectionId(new Map([[10, LISTS]]));
  });

  it('pre-fills the form and shows a delete button', async () => {
    const view = await render(<EditCollectionScreen />);
    expect(view.getByLabelText('Name').props.value).toBe('Shopping');
    expect(view.getByLabelText('Save')).toBeTruthy();
    expect(view.getByLabelText('Delete collection')).toBeTruthy();
  });

  it('opens the chooser and moves the lists on delete for a non-empty collection', async () => {
    const user = userEvent.setup();
    const view = await render(<EditCollectionScreen />);
    await user.press(view.getByLabelText('Delete collection'));
    expect(await view.findByText('Delete 1 collection?')).toBeTruthy();

    await user.press(view.getByLabelText('Move lists to Lists'));
    await waitFor(() => expect(collectionRepositoryMock.delete).toHaveBeenCalledWith(10, 'move'));
    expect(nav.popToTop).toHaveBeenCalled();
  });

  it('cascades the member lists on delete for a non-empty collection', async () => {
    const user = userEvent.setup();
    const view = await render(<EditCollectionScreen />);
    await user.press(view.getByLabelText('Delete collection'));
    await view.findByText('Delete 1 collection?');
    await user.press(view.getByLabelText('Delete lists too'));

    await waitFor(() => expect(collectionRepositoryMock.delete).toHaveBeenCalledWith(10, 'cascade'));
    expect(nav.popToTop).toHaveBeenCalled();
  });

  it('confirms deletion of an empty collection with the single confirm modal', async () => {
    setListsByCollectionId(new Map([[10, []]]));
    const user = userEvent.setup();
    const view = await render(<EditCollectionScreen />);
    await user.press(view.getByLabelText('Delete collection'));
    expect(await view.findByText('This empty collection will be removed. It cannot be undone.')).toBeTruthy();

    const buttons = view.getAllByLabelText('Delete collection');
    await user.press(buttons[buttons.length - 1]);
    await waitFor(() => expect(collectionRepositoryMock.delete).toHaveBeenCalledWith(10, 'cascade'));
    expect(nav.popToTop).toHaveBeenCalled();
  });
});
