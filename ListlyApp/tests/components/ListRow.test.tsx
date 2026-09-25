import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react-native';
import { resetStub } from '../helpers/configStub';
import ListRow from '../../src/components/ListRow';
import type { ListWithCounts } from '../../src/database/types';

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

describe('ListRow', () => {
  beforeEach(() => {
    resetStub();
  });

  it('renders the list name, icon and progress', async () => {
    const view = await render(<ListRow list={LIST} selectMode={false} selected={false} onPress={() => {}} />);

    expect(view.getByText('Groceries')).toBeTruthy();
    expect(view.getByText('cart-outline')).toBeTruthy();
    expect(view.getByText('2/5')).toBeTruthy();
  });

  it('calls onPress when pressed', async () => {
    const onPress = vi.fn();
    const view = await render(<ListRow list={LIST} selectMode={false} selected={false} onPress={onPress} />);

    fireEvent.press(view.getByText('Groceries'));
    expect(onPress).toHaveBeenCalled();
  });

  it('shows a star indicator when pinned and hides it otherwise or in select mode', async () => {
    const unpinned = await render(<ListRow list={LIST} selectMode={false} selected={false} onPress={() => {}} />);
    expect(unpinned.queryByLabelText('Pinned')).toBeNull();

    const pinned = await render(<ListRow list={{ ...LIST, pinned: 1 }} selectMode={false} selected={false} onPress={() => {}} />);
    expect(pinned.getByLabelText('Pinned')).toBeTruthy();

    const selecting = await render(<ListRow list={{ ...LIST, pinned: 1 }} selectMode selected={false} onPress={() => {}} />);
    expect(selecting.queryByLabelText('Pinned')).toBeNull();
  });
});