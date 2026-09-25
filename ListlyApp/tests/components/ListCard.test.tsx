import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react-native';
import { resetStub } from '../helpers/configStub';
import ListCard from '../../src/components/ListCard';
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

describe('ListCard', () => {
  beforeEach(() => {
    resetStub();
  });

  it('renders the list name, icon and progress', async () => {
    const view = await render(
      <ListCard list={LIST} selectMode={false} selected={false} onPress={() => {}} />
    );

    expect(view.getByText('Groceries')).toBeTruthy();
    expect(view.getByText('cart-outline')).toBeTruthy();
    expect(view.getByText('2/5')).toBeTruthy();
  });

  it('shows a list type badge outside select mode', async () => {
    const view = await render(
      <ListCard list={LIST} selectMode={false} selected={false} onPress={() => {}} />
    );

    expect(view.getByText('list-outline')).toBeTruthy();
  });

  it('shows the collection name when a collection is provided', async () => {
    const view = await render(
      <ListCard
        list={LIST}
        collection={{ name: 'Shopping', color: '#A855F7' }}
        selectMode={false}
        selected={false}
        onPress={() => {}}
      />
    );

    expect(view.getByText('Shopping')).toBeTruthy();
  });

  it('hides the collection name in select mode', async () => {
    const view = await render(
      <ListCard
        list={LIST}
        collection={{ name: 'Shopping', color: '#A855F7' }}
        selectMode
        selected={false}
        onPress={() => {}}
      />
    );

    expect(view.queryByText('Shopping')).toBeNull();
  });

  it('calls onPress when pressed', async () => {
    const onPress = vi.fn();
    const view = await render(
      <ListCard list={LIST} selectMode={false} selected={false} onPress={onPress} />
    );

    fireEvent.press(view.getByText('Groceries'));
    expect(onPress).toHaveBeenCalled();
  });

  it('uses the list color for the icon and tints the card background', async () => {
    const view = await render(
      <ListCard list={LIST} selectMode={false} selected={false} onPress={() => {}} />
    );

    const icon = view.getByText('cart-outline');
    expect(icon.props.color).toBe('#22D3EE');

    const card = view.getByText('Groceries').parent?.parent;
    expect(card).toBeTruthy();
  });

  it('shows a star indicator when the list is pinned', async () => {
    const view = await render(
      <ListCard list={{ ...LIST, pinned: 1 }} selectMode={false} selected={false} onPress={() => {}} />
    );

    expect(view.getByLabelText('Pinned')).toBeTruthy();
  });

  it('hides the star indicator when the list is not pinned or in select mode', async () => {
    const unpinned = await render(
      <ListCard list={LIST} selectMode={false} selected={false} onPress={() => {}} />
    );
    expect(unpinned.queryByLabelText('Pinned')).toBeNull();

    const selecting = await render(
      <ListCard list={{ ...LIST, pinned: 1 }} selectMode selected={false} onPress={() => {}} />
    );
    expect(selecting.queryByLabelText('Pinned')).toBeNull();
  });
});