import { describe, expect, it, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react-native';
import SelectToggleButton from '../../src/components/SelectToggleButton';

describe('SelectToggleButton', () => {
  it('renders the select-mode state with the enter label', async () => {
    const view = await render(<SelectToggleButton active={false} onToggle={vi.fn()} />);
    expect(view.getByLabelText('Enter select mode')).toBeTruthy();
    expect(view.getByLabelText('Enter select mode').props.accessibilityRole).toBe('button');
  });

  it('renders the exit-select-mode state with the exit label', async () => {
    const view = await render(<SelectToggleButton active onToggle={vi.fn()} />);
    expect(view.getByLabelText('Exit select mode')).toBeTruthy();
  });

  it('fires onToggle when pressed', async () => {
    const onToggle = vi.fn();
    const view = await render(<SelectToggleButton active={false} onToggle={onToggle} />);
    fireEvent.press(view.getByLabelText('Enter select mode'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});