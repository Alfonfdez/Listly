import { describe, expect, it, vi } from 'vitest';
import { render, userEvent } from '@testing-library/react-native';
import CheckboxRow from '../../src/components/settings/CheckboxRow';

describe('CheckboxRow', () => {
  it('renders a checked checkbox and toggles on press', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    const view = await render(<CheckboxRow label="Notes" checked onToggle={onToggle} />);

    expect(view.getByText('checkbox')).toBeTruthy();
    expect(view.getByRole('checkbox')).toBeTruthy();

    await user.press(view.getByLabelText('Notes'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('renders an unchecked checkbox', async () => {
    const view = await render(<CheckboxRow label="Photos" checked={false} onToggle={() => {}} />);
    expect(view.getByText('square-outline')).toBeTruthy();
  });
});
