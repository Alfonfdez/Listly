import { describe, expect, it } from 'vitest';
import { render, userEvent } from '@testing-library/react-native';
import ColorGrid from '../../src/components/ColorGrid';
import { QUICK_COLORS } from '../../src/constants/listColors';

describe('ColorGrid', () => {
  it('renders the quick colors as selectable circles', async () => {
    const onSelect = () => {};
    const view = await render(
      <ColorGrid selectedColor={null} customColor={null} onSelect={onSelect} onOpenPicker={() => {}} />
    );

    QUICK_COLORS.forEach(color => {
      expect(view.getByLabelText(color)).toBeTruthy();
    });
    expect(view.getByLabelText('More colors')).toBeTruthy();
  });

  it('marks the selected quick color and calls onSelect on tap', async () => {
    const user = userEvent.setup();
    const onSelect = (color: string) => {
      expect(color).toBe(QUICK_COLORS[1]);
    };
    const view = await render(
      <ColorGrid selectedColor={QUICK_COLORS[0]} customColor={null} onSelect={onSelect} onOpenPicker={() => {}} />
    );

    expect(view.getByLabelText(QUICK_COLORS[0]).props.accessibilityState.selected).toBe(true);
    expect(view.getByLabelText(QUICK_COLORS[1]).props.accessibilityState.selected).toBe(false);

    await user.press(view.getByLabelText(QUICK_COLORS[1]));
  });

  it('renders a custom color circle when provided and selects it', async () => {
    const onSelect = (color: string) => {
      expect(color).toBe('#123456');
    };
    const user = userEvent.setup();
    const view = await render(
      <ColorGrid selectedColor="#123456" customColor="#123456" onSelect={onSelect} onOpenPicker={() => {}} />
    );

    expect(view.getByLabelText('#123456').props.accessibilityState.selected).toBe(true);
    await user.press(view.getByLabelText('#123456'));
  });

  it('opens the picker via the "+" trigger', async () => {
    const user = userEvent.setup();
    let opened = false;
    const view = await render(
      <ColorGrid
        selectedColor={null}
        customColor={null}
        onSelect={() => {}}
        onOpenPicker={() => {
          opened = true;
        }}
      />
    );

    await user.press(view.getByLabelText('More colors'));
    expect(opened).toBe(true);
  });
});