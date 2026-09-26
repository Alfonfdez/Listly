import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, userEvent } from '@testing-library/react-native';
import ListPickerModal from '../../src/components/ListPickerModal';
import { resetStub } from '../helpers/configStub';
import type { ListWithCounts } from '../../src/database/types';

const OTHER: ListWithCounts = {
  id: 2,
  name: 'Work Tasks',
  color: '#34D399',
  icon: 'briefcase-outline',
  collection_id: null,
  created_at: 'x',
  position: 1,
  pinned: 0,
  total: 0,
  completed: 0,
};

const YET_ANOTHER: ListWithCounts = {
  id: 3,
  name: 'Weekend',
  color: '#FBBF24',
  icon: 'rocket-outline',
  collection_id: null,
  created_at: 'x',
  position: 2,
  pinned: 0,
  total: 0,
  completed: 0,
};

describe('ListPickerModal', () => {
  beforeEach(() => {
    resetStub();
  });

  it('lists every available list and excludes the source', async () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    const view = await render(
      <ListPickerModal
        visible
        title="Choose a list"
        options={[OTHER, YET_ANOTHER]}
        excludeListId={1}
        cancelLabel="Cancel"
        onSelect={onSelect}
        onClose={onClose}
      />
    );
    expect(view.getByText('Work Tasks')).toBeTruthy();
    expect(view.getByText('Weekend')).toBeTruthy();
    expect(view.getByLabelText('Work Tasks')).toBeTruthy();
    expect(view.getByLabelText('Weekend')).toBeTruthy();
    expect(view.queryByLabelText('Groceries')).toBeNull();
  });

  it('selects a list on row press and closes', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onClose = vi.fn();
    const view = await render(
      <ListPickerModal
        visible
        title="Choose a list"
        options={[OTHER, YET_ANOTHER]}
        excludeListId={1}
        cancelLabel="Cancel"
        onSelect={onSelect}
        onClose={onClose}
      />
    );
    await user.press(view.getByLabelText('Work Tasks'));
    expect(onSelect).toHaveBeenCalledWith(OTHER);
    expect(onClose).toHaveBeenCalled();
  });

  it('closes without selecting when cancelled', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onClose = vi.fn();
    const view = await render(
      <ListPickerModal
        visible
        title="Choose a list"
        options={[OTHER]}
        excludeListId={1}
        cancelLabel="Cancel"
        onSelect={onSelect}
        onClose={onClose}
      />
    );
    await user.press(view.getByLabelText('Cancel'));
    expect(onSelect).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('shows an empty hint when no other lists remain', async () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    const view = await render(
      <ListPickerModal
        visible
        title="Choose a list"
        options={[OTHER]}
        excludeListId={2}
        cancelLabel="Cancel"
        onSelect={onSelect}
        onClose={onClose}
      />
    );
    expect(view.getByText('No other lists to copy into')).toBeTruthy();
  });
});