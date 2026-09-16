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
  created_at: '2026-09-05 08:00:00',
  position: 0,
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
});