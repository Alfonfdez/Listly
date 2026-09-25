import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react-native';
import { resetStub } from '../helpers/configStub';
import CollectionCard from '../../src/components/CollectionCard';
import type { CollectionWithCounts } from '../../src/database/types';

const COLLECTION: CollectionWithCounts = {
  id: 10,
  name: 'Shopping',
  color: '#A855F7',
  icon: 'folder-outline',
  created_at: 'x',
  position: 0,
  pinned: 0,
  total: 3,
  completed: 1,
};

describe('CollectionCard', () => {
  beforeEach(() => {
    resetStub();
  });

  it('renders the collection name, icon and progress', async () => {
    const view = await render(<CollectionCard collection={COLLECTION} selectMode={false} selected={false} onPress={() => {}} />);

    expect(view.getByText('Shopping')).toBeTruthy();
    expect(view.getByText('folder-outline')).toBeTruthy();
    expect(view.getByText('1/3')).toBeTruthy();
  });

  it('calls onPress when pressed', async () => {
    const onPress = vi.fn();
    const view = await render(<CollectionCard collection={COLLECTION} selectMode={false} selected={false} onPress={onPress} />);

    fireEvent.press(view.getByText('Shopping'));
    expect(onPress).toHaveBeenCalled();
  });

  it('shows a star indicator when the collection is pinned', async () => {
    const view = await render(
      <CollectionCard collection={{ ...COLLECTION, pinned: 1 }} selectMode={false} selected={false} onPress={() => {}} />
    );

    expect(view.getByLabelText('Pinned')).toBeTruthy();
  });

  it('hides the star indicator when the collection is not pinned or in select mode', async () => {
    const unpinned = await render(<CollectionCard collection={COLLECTION} selectMode={false} selected={false} onPress={() => {}} />);
    expect(unpinned.queryByLabelText('Pinned')).toBeNull();

    const selecting = await render(
      <CollectionCard collection={{ ...COLLECTION, pinned: 1 }} selectMode selected={false} onPress={() => {}} />
    );
    expect(selecting.queryByLabelText('Pinned')).toBeNull();
  });
});