import { describe, expect, it } from 'vitest';
import { renderHook, act } from '@testing-library/react-native';
import { useFrozenKey } from '../../src/hooks/useFrozenKey';

describe('useFrozenKey', () => {
  it('returns the key unchanged when not frozen', async () => {
    const { result } = await renderHook(({ key }: { key: string }) => useFrozenKey(key, false), {
      initialProps: { key: 'a' },
    });
    expect(result.current).toBe('a');
  });

  it('holds the previous key while frozen and adopts the new one when unfrozen', async () => {
    const { result, rerender } = await renderHook(
      ({ key, frozen }: { key: string; frozen: boolean }) => useFrozenKey(key, frozen),
      { initialProps: { key: 'a', frozen: false } }
    );

    // a new key arrives during a drag → the grid is not remounted (frozen)
    await act(async () => {
      rerender({ key: 'b', frozen: true });
    });
    expect(result.current).toBe('a');

    // drag ends → the latest key is adopted (remount/re-measure)
    await act(async () => {
      rerender({ key: 'b', frozen: false });
    });
    expect(result.current).toBe('b');
  });
});
