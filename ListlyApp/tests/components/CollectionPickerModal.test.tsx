import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, userEvent } from '@testing-library/react-native';
import CollectionPickerModal from '../../src/components/CollectionPickerModal';
import { resetStub } from '../helpers/configStub';
import type { CollectionWithCounts } from '../../src/database/types';

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

const PROPS = {
  visible: true,
  title: 'Choose a collection',
  options: [KITCHEN, GARDEN] as CollectionWithCounts[],
  selectedId: null as number | null,
  standaloneLabel: 'Standalone / No collection',
  cancelLabel: 'Cancel',
  onSelect: vi.fn(),
  onClose: vi.fn(),
};

describe('CollectionPickerModal', () => {
  beforeEach(() => {
    resetStub();
    PROPS.onSelect.mockClear();
    PROPS.onClose.mockClear();
    PROPS.selectedId = null;
  });

  it('lists the standalone option and every collection', async () => {
    const view = await render(<CollectionPickerModal {...PROPS} />);
    expect(view.getByLabelText('Standalone / No collection')).toBeTruthy();
    expect(view.getByText('Standalone / No collection')).toBeTruthy();
    expect(view.getByLabelText('Kitchen')).toBeTruthy();
    expect(view.getByLabelText('Garden')).toBeTruthy();
  });

  it('marks the standalone option as selected by default', async () => {
    const view = await render(<CollectionPickerModal {...PROPS} />);
    expect(view.getByLabelText('Standalone / No collection').props.accessibilityState.selected).toBe(true);
    expect(view.getByLabelText('Kitchen').props.accessibilityState.selected).toBe(false);
    expect(view.getByText('checkmark')).toBeTruthy();
  });

  it('marks the current collection as selected', async () => {
    PROPS.selectedId = KITCHEN.id;
    const view = await render(<CollectionPickerModal {...PROPS} />);
    expect(view.getByLabelText('Standalone / No collection').props.accessibilityState.selected).toBe(false);
    expect(view.getByLabelText('Kitchen').props.accessibilityState.selected).toBe(true);
  });

  it('selects a collection on row press and closes', async () => {
    const user = userEvent.setup();
    const view = await render(<CollectionPickerModal {...PROPS} />);
    await user.press(view.getByLabelText('Kitchen'));
    expect(PROPS.onSelect).toHaveBeenCalledWith(7);
    expect(PROPS.onClose).toHaveBeenCalled();
  });

  it('selects the standalone option on row press and closes', async () => {
    const user = userEvent.setup();
    PROPS.selectedId = KITCHEN.id;
    const view = await render(<CollectionPickerModal {...PROPS} />);
    await user.press(view.getByLabelText('Standalone / No collection'));
    expect(PROPS.onSelect).toHaveBeenCalledWith(null);
    expect(PROPS.onClose).toHaveBeenCalled();
  });

  it('closes without selecting when cancelled', async () => {
    const user = userEvent.setup();
    const view = await render(<CollectionPickerModal {...PROPS} />);
    await user.press(view.getByLabelText('Cancel'));
    expect(PROPS.onSelect).not.toHaveBeenCalled();
    expect(PROPS.onClose).toHaveBeenCalled();
  });
});
