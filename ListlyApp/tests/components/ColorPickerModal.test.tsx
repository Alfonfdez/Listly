import { describe, expect, it, vi } from 'vitest';
import { render, userEvent } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import ColorPickerModal from '../../src/components/ColorPickerModal';

interface PickerProps {
  value?: string;
  onChangeJS?: (colors: { hex: string }) => void;
  children?: ReactNode;
}

const pickerStub = vi.hoisted(() => {
  let onChangeJS: ((colors: { hex: string }) => void) | undefined;
  function ColorPickerStub(props: PickerProps): ReactNode {
    onChangeJS = props.onChangeJS;
    return props.children ?? null;
  }
  return { ColorPickerStub, getOnChangeJS: () => onChangeJS };
});

vi.mock('reanimated-color-picker', () => ({
  default: pickerStub.ColorPickerStub,
  Panel1: () => null,
  HueSlider: () => null,
  OpacitySlider: () => null,
  Preview: () => null,
}));

describe('ColorPickerModal', () => {
  it('applies the temp color on OK', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onClose = vi.fn();
    const view = await render(
      <ColorPickerModal visible selectedColor="#22D3EE" onSelect={onSelect} onClose={onClose} />
    );

    expect(view.getByText('Pick a color')).toBeTruthy();
    pickerStub.getOnChangeJS()?.({ hex: '#123456' });
    await user.press(view.getByLabelText('OK'));

    expect(onSelect).toHaveBeenCalledWith('#123456');
    expect(onClose).toHaveBeenCalled();
  });

  it('discards changes on Cancel', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onClose = vi.fn();
    const view = await render(
      <ColorPickerModal visible selectedColor="#22D3EE" onSelect={onSelect} onClose={onClose} />
    );

    pickerStub.getOnChangeJS()?.({ hex: '#123456' });
    await user.press(view.getByLabelText('Cancel'));

    expect(onSelect).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('seeds the picker with the current selection on open', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onClose = vi.fn();
    const view = await render(
      <ColorPickerModal visible={false} selectedColor="#22D3EE" onSelect={onSelect} onClose={onClose} />
    );

    await view.rerender(
      <ColorPickerModal visible selectedColor="#FBBF24" onSelect={onSelect} onClose={onClose} />
    );

    await user.press(view.getByLabelText('OK'));
    expect(onSelect).toHaveBeenCalledWith('#FBBF24');
  });
});