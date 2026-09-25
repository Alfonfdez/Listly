import { describe, expect, it, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react-native';
import SelectionActionBar from '../../src/components/SelectionActionBar';

function renderBar(overrides: Partial<React.ComponentProps<typeof SelectionActionBar>> = {}) {
  return render(
    <SelectionActionBar
      selectedCount={1}
      countLabel="1 selected"
      deleteLabel="Delete"
      cancelLabel="Cancel"
      onDelete={vi.fn()}
      onCancel={vi.fn()}
      {...overrides}
    />
  );
}

describe('SelectionActionBar', () => {
  it('hides the pin button when onPin is not provided', async () => {
    const view = await renderBar();
    expect(view.queryByText('Pin')).toBeNull();
    expect(view.queryByText('star')).toBeNull();
  });

  it('shows the pin button when onPin is provided and calls it on press', async () => {
    const onPin = vi.fn();
    const view = await renderBar({
      onPin,
      pinLabel: 'Pin',
      pinIcon: 'star',
      pinAccessibilityLabel: 'Pin selection',
    });

    const button = view.getByLabelText('Pin selection');
    expect(button).toBeTruthy();
    expect(view.getByText('star')).toBeTruthy();

    fireEvent.press(button);
    expect(onPin).toHaveBeenCalledTimes(1);
  });

  it('disables the pin and delete buttons when nothing is selected', async () => {
    const onPin = vi.fn();
    const onDelete = vi.fn();
    const view = await renderBar({
      selectedCount: 0,
      onPin,
      onDelete,
      pinLabel: 'Pin',
      pinAccessibilityLabel: 'Pin selection',
    });

    const pin = view.getByLabelText('Pin selection');
    const del = view.getByLabelText('Delete');
    expect(pin.props.accessibilityState?.disabled).toBe(true);
    expect(del.props.accessibilityState?.disabled).toBe(true);

    fireEvent.press(pin);
    fireEvent.press(del);
    expect(onPin).not.toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();
  });
});