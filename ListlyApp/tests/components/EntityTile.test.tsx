import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, fireEvent, userEvent } from '@testing-library/react-native';
import { type ComponentProps } from 'react';
import { resetStub } from '../helpers/configStub';
import EntityTile, { type TileEntity } from '../../src/components/EntityTile';

const LIST: TileEntity = {
  id: 1,
  kind: 'list',
  name: 'Groceries',
  color: '#22D3EE',
  icon: 'cart-outline',
  pinned: 0,
  completed: 2,
  total: 5,
};

const COLLECTION: TileEntity = {
  id: 10,
  kind: 'collection',
  name: 'Shopping',
  color: '#A855F7',
  icon: 'folder-outline',
  pinned: 0,
  completed: 1,
  total: 3,
};

type Overrides = Partial<ComponentProps<typeof EntityTile>>;

function renderTile(entity: TileEntity, overrides: Overrides = {}) {
  return render(
    <EntityTile entity={entity} layout="card" selectMode={false} selected={false} onPress={() => {}} {...overrides} />
  );
}

describe('EntityTile', () => {
  beforeEach(() => {
    resetStub();
  });

  it('renders a list card with name, icon, progress and type badge', async () => {
    const view = await renderTile(LIST);

    expect(view.getByText('Groceries')).toBeTruthy();
    expect(view.getByText('cart-outline')).toBeTruthy();
    expect(view.getByText('2/5')).toBeTruthy();
    expect(view.getByText('list-outline')).toBeTruthy();
  });

  it('shows a numeric badge on a numeric list card', async () => {
    const view = await renderTile({ ...LIST, listKind: 'numeric' });

    expect(view.getByText('calculator-outline')).toBeTruthy();
    expect(view.getByLabelText('Numeric')).toBeTruthy();
    expect(view.getByText('list-outline')).toBeTruthy();
  });

  it('shows a numeric badge on a numeric list row', async () => {
    const view = await renderTile({ ...LIST, listKind: 'numeric' }, { layout: 'row' });

    expect(view.getByText('calculator-outline')).toBeTruthy();
    expect(view.getByLabelText('Numeric')).toBeTruthy();
  });

  it('does not show a numeric badge on a standard list or a collection', async () => {
    const standard = await renderTile(LIST);
    expect(standard.queryByText('calculator-outline')).toBeNull();

    const collection = await renderTile(COLLECTION);
    expect(collection.queryByText('calculator-outline')).toBeNull();
  });

  it('renders a list row with name, icon and progress', async () => {
    const view = await renderTile(LIST, { layout: 'row' });

    expect(view.getByText('Groceries')).toBeTruthy();
    expect(view.getByText('cart-outline')).toBeTruthy();
    expect(view.getByText('2/5')).toBeTruthy();
  });

  it('renders a collection card with the collection type badge', async () => {
    const view = await renderTile(COLLECTION);

    expect(view.getByText('Shopping')).toBeTruthy();
    expect(view.getByText('folder-outline')).toBeTruthy();
    expect(view.getByText('1/3')).toBeTruthy();
    expect(view.getByText('albums-outline')).toBeTruthy();
  });

  it('renders a collection row', async () => {
    const view = await renderTile(COLLECTION, { layout: 'row' });

    expect(view.getByText('Shopping')).toBeTruthy();
    expect(view.getByText('folder-outline')).toBeTruthy();
    expect(view.getByText('1/3')).toBeTruthy();
  });

  it('calls onPress when pressed', async () => {
    const onPress = vi.fn();
    const view = await renderTile(LIST, { onPress });

    fireEvent.press(view.getByText('Groceries'));
    expect(onPress).toHaveBeenCalled();
  });

  it('uses the entity color for the icon', async () => {
    const view = await renderTile(LIST);

    expect(view.getByText('cart-outline').props.color).toBe('#22D3EE');
  });

  it('shows the collection name on a list tile when provided and hides it in select mode', async () => {
    const view = await renderTile(LIST, { entity: { ...LIST, collection: { name: 'Shopping', color: '#A855F7' } } });
    expect(view.getByText('Shopping')).toBeTruthy();

    const selecting = await renderTile(LIST, {
      entity: { ...LIST, collection: { name: 'Shopping', color: '#A855F7' } },
      selectMode: true,
    });
    expect(selecting.queryByText('Shopping')).toBeNull();
  });

  it('shows a star when pinned and hides it otherwise (kept visible in select mode)', async () => {
    const unpinned = await renderTile(LIST);
    expect(unpinned.queryByLabelText('Pinned')).toBeNull();

    const pinned = await renderTile({ ...LIST, pinned: 1 });
    expect(pinned.getByLabelText('Pinned')).toBeTruthy();

    const selecting = await renderTile({ ...LIST, pinned: 1 }, { selectMode: true });
    expect(selecting.getByLabelText('Pinned')).toBeTruthy();
  });

  it('shows the locked label instead of progress for a locked list', async () => {
    const view = await renderTile({ ...LIST, locked: true });

    expect(view.getByText('Locked')).toBeTruthy();
    expect(view.queryByText('2/5')).toBeNull();
  });

  it('exposes the drop hint when it is a drop target', async () => {
    const view = await renderTile(COLLECTION, { dropTarget: true });

    expect(view.getByLabelText('Shopping').props.accessibilityHint).toBe(
      'Drop to move the list into this collection'
    );
  });

  it('marks the tile as a selectable checkbox in select mode', async () => {
    const view = await renderTile(LIST, { selectMode: true, selected: true });

    const tile = view.getByLabelText('Groceries, 1 selected');
    expect(tile.props.accessibilityRole).toBe('checkbox');
    expect(tile.props.accessibilityState).toEqual({ checked: true });
  });

  it('clears the pressed opacity when the gesture ends', async () => {
    const user = userEvent.setup();
    const view = await renderTile(LIST);

    const tile = view.getByLabelText('Groceries');
    await user.press(tile);

    expect(flattenStyle(tile.props.style).opacity).toBeUndefined();
  });

  it('clears the pressed opacity when the tile is tapped', async () => {
    const onPress = vi.fn();
    const view = await renderTile(LIST, { onPress });

    await userEvent.setup().press(view.getByLabelText('Groceries'));
    expect(onPress).toHaveBeenCalled();
    expect(flattenStyle(view.getByLabelText('Groceries').props.style).opacity).toBeUndefined();
  });

  it('shows an accent border when pinZoneHint is set', async () => {
    const plain = await renderTile(LIST);
    const hinted = await renderTile(LIST, { pinZoneHint: true });

    const plainBorder = flattenStyle(plain.getByLabelText('Groceries').props.style).borderColor;
    const hintedBorder = flattenStyle(hinted.getByLabelText('Groceries').props.style).borderColor;

    expect(hintedBorder).toBeTruthy();
    expect(hintedBorder).not.toBe(plainBorder);
  });
});

function flattenStyle(style: unknown): Record<string, unknown> {
  if (Array.isArray(style)) {
    return style.reduce((acc: Record<string, unknown>, s) => ({ ...acc, ...flattenStyle(s) }), {});
  }
  if (style && typeof style === 'object') {
    return { ...(style as Record<string, unknown>) };
  }
  return {};
}
