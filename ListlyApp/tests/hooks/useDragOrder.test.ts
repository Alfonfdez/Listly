import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react-native';
import { useDragOrder } from '../../src/hooks/useDragOrder';
import type { Item } from '../../src/database/types';

function item(id: number): Item {
  return { id, list_id: 1, name: `Item ${id}`, checked: 0, note: null, position: id, created_at: 'x', pictures: null };
}

function dragParams(data: Item[]) {
  return {
    data,
    key: String(data[0]?.id ?? ''),
    fromIndex: 0,
    toIndex: 0,
    indexToKey: data.map(i => String(i.id)),
    keyToIndex: {},
  };
}

describe('useDragOrder', () => {
  it('starts with the item order as given', async () => {
    const items = [item(1), item(2), item(3)];
    const { result } = await renderHook(() => useDragOrder(items, vi.fn()));
    expect(result.current.display).toEqual(items);
  });

  it('reorders on drag end and reports the new id order', async () => {
    const items = [item(1), item(2), item(3)];
    const onReorder = vi.fn();
    const { result } = await renderHook(() => useDragOrder(items, onReorder));

    await act(() => result.current.onDragEnd(dragParams([item(3), item(1), item(2)])));

    expect(onReorder).toHaveBeenCalledWith([3, 1, 2]);
    expect(result.current.display.map(i => i.id)).toEqual([3, 1, 2]);
  });

  it('ignores a drag end that keeps the original order', async () => {
    const items = [item(1), item(2)];
    const onReorder = vi.fn();
    const { result } = await renderHook(() => useDragOrder(items, onReorder));

    await act(() => result.current.onDragEnd(dragParams([item(1), item(2)])));

    expect(onReorder).not.toHaveBeenCalled();
  });

  it('ignores a drag end whose item count differs', async () => {
    const items = [item(1), item(2)];
    const onReorder = vi.fn();
    const { result } = await renderHook(() => useDragOrder(items, onReorder));

    await act(() => result.current.onDragEnd(dragParams([item(1)])));

    expect(onReorder).not.toHaveBeenCalled();
  });
});
