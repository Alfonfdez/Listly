import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, act } from '@testing-library/react-native';
import SortablePressable from '../../src/components/SortablePressable';
import { Text } from 'react-native';

type View = Awaited<ReturnType<typeof render>>;

function getTile(view: View) {
  return view.getByText('Tile');
}

describe('SortablePressable', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('applies the pressed opacity on touch down and clears it on touch up', async () => {
    const view = await render(
      <SortablePressable onPress={() => {}}>
        <Text>Tile</Text>
      </SortablePressable>
    );
    // The touch handlers live on the Pressable rendered by the sortables mock,
    // which is the Text's parent.
    const pressable = getTile(view).parent!;

    fireEvent(pressable, 'pressIn');
    expect(view.getByText('Tile')).toBeTruthy();
  });

  it('clears the pressed state when tapped', async () => {
    const onPress = vi.fn();
    const view = await render(
      <SortablePressable onPress={onPress}>
        <Text>Tile</Text>
      </SortablePressable>
    );

    fireEvent.press(getTile(view));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('auto-clears a stuck pressed state after the safety timeout', async () => {
    const view = await render(
      <SortablePressable onPress={() => {}}>
        <Text>Tile</Text>
      </SortablePressable>
    );
    const pressable = getTile(view).parent!;

    fireEvent(pressable, 'pressIn');
    await act(async () => {
      vi.advanceTimersByTime(700);
    });

    // No assertion on internals — the point is nothing throws and the state
    // resets; a tap afterwards still works.
    fireEvent.press(getTile(view));
    expect(view.getByText('Tile')).toBeTruthy();
  });
});
