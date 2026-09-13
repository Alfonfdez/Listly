import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react-native';
import ItemRow from '../../src/components/ItemRow';
import { resetStub } from './helpers/configStub';
import type { Item } from '../../src/database/types';

function makeItem(overrides: Partial<Item> = {}): Item {
  return {
    id: 1,
    list_id: 1,
    name: 'Milk',
    checked: 0,
    note: null,
    position: 0,
    created_at: 'x',
    ...overrides,
  };
}

describe('ItemRow', () => {
  beforeEach(() => {
    resetStub();
  });

  it('renders the item name and an unchecked checkbox', async () => {
    const view = await render(<ItemRow item={makeItem()} onToggle={() => {}} onEdit={() => {}} />);
    expect(view.getByText('Milk')).toBeTruthy();
    expect(view.getByText('ellipse-outline')).toBeTruthy();
    expect(view.queryByText('checkmark-circle')).toBeNull();
  });

  it('uses a filled checkmark and strike-through for checked items', async () => {
    const item = makeItem({ checked: 1 });
    const view = await render(<ItemRow item={item} onToggle={() => {}} onEdit={() => {}} />);
    expect(view.getByText('checkmark-circle')).toBeTruthy();

    const name = view.getByText('Milk');
    const styles = flattenStyle(name.props.style);
    expect(styles.textDecorationLine).toBe('line-through');
  });

  it('shows a note indicator only when a note is set', async () => {
    const noNote = await render(<ItemRow item={makeItem()} onToggle={() => {}} onEdit={() => {}} />);
    expect(noNote.queryByText('document-text-outline')).toBeNull();

    const withNote = await render(
      <ItemRow item={makeItem({ note: 'medium roast' })} onToggle={() => {}} onEdit={() => {}} />
    );
    expect(withNote.getByText('document-text-outline')).toBeTruthy();
  });

  it('toggles on row press and opens the editor on the edit button', async () => {
    const onToggle = vi.fn();
    const onEdit = vi.fn();
    const view = await render(<ItemRow item={makeItem()} onToggle={onToggle} onEdit={onEdit} />);

    fireEvent.press(view.getByText('Milk'));
    expect(onToggle).toHaveBeenCalledTimes(1);

    fireEvent.press(view.getByLabelText('Edit item'));
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledTimes(1);
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