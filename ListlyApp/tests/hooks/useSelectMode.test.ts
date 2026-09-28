import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react-native';
import { useSelectMode } from '../../src/hooks/useSelectMode';

describe('useSelectMode', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it('starts idle with no selection', async () => {
    const { result } = await renderHook(() => useSelectMode({ deleteMany: vi.fn() }));
    expect(result.current.selectMode).toBe(false);
    expect(result.current.selectedIds.size).toBe(0);
    expect(result.current.deleteConfirmVisible).toBe(false);
  });

  it('toggles select mode on and off, clearing the selection', async () => {
    const { result } = await renderHook(() => useSelectMode({ deleteMany: vi.fn() }));

    await act(() => result.current.toggleSelectMode());
    await act(() => result.current.toggleItem(1));
    await act(() => result.current.toggleItem(2));
    expect(result.current.selectMode).toBe(true);
    expect([...result.current.selectedIds].sort()).toEqual([1, 2]);

    await act(() => result.current.toggleSelectMode());
    expect(result.current.selectMode).toBe(false);
    expect(result.current.selectedIds.size).toBe(0);
  });

  it('toggles an individual item in and out of the selection', async () => {
    const { result } = await renderHook(() => useSelectMode({ deleteMany: vi.fn() }));

    await act(() => result.current.toggleItem(7));
    expect(result.current.selectedIds.has(7)).toBe(true);

    await act(() => result.current.toggleItem(7));
    expect(result.current.selectedIds.has(7)).toBe(false);
  });

  it('opens and closes the delete confirmation', async () => {
    const { result } = await renderHook(() => useSelectMode({ deleteMany: vi.fn() }));

    await act(() => result.current.openDeleteConfirm());
    expect(result.current.deleteConfirmVisible).toBe(true);

    await act(() => result.current.closeDeleteConfirm());
    expect(result.current.deleteConfirmVisible).toBe(false);
  });

  it('deletes the selected ids, exits select mode and runs afterDelete', async () => {
    const deleteMany = vi.fn(async () => {});
    const afterDelete = vi.fn(async () => {});
    const { result } = await renderHook(() => useSelectMode({ deleteMany, afterDelete }));

    await act(() => result.current.toggleSelectMode());
    await act(() => result.current.toggleItem(3));
    await act(() => result.current.toggleItem(5));
    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(deleteMany).toHaveBeenCalledWith([3, 5]);
    expect(afterDelete).toHaveBeenCalledTimes(1);
    expect(result.current.selectMode).toBe(false);
    expect(result.current.selectedIds.size).toBe(0);
    expect(result.current.deleteConfirmVisible).toBe(false);
  });

  it('exits select mode and logs when the delete fails', async () => {
    const deleteMany = vi.fn(async () => {
      throw new Error('boom');
    });
    const afterDelete = vi.fn(async () => {});
    const { result } = await renderHook(() => useSelectMode({ deleteMany, afterDelete }));

    await act(() => result.current.toggleSelectMode());
    await act(() => result.current.toggleItem(1));
    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(errorSpy).toHaveBeenCalled();
    expect(afterDelete).not.toHaveBeenCalled();
    expect(result.current.selectMode).toBe(false);
    expect(result.current.selectedIds.size).toBe(0);
  });

  it('exitSelectMode clears the selection and mode', async () => {
    const { result } = await renderHook(() => useSelectMode({ deleteMany: vi.fn() }));

    await act(() => result.current.toggleSelectMode());
    await act(() => result.current.toggleItem(9));
    await act(() => result.current.exitSelectMode());

    expect(result.current.selectMode).toBe(false);
    expect(result.current.selectedIds.size).toBe(0);
  });
});
