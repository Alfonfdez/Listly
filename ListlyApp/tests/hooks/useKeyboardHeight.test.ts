import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react-native';

const { android, listeners } = vi.hoisted(() => ({
  android: { value: true },
  listeners: new Map<string, (event: unknown) => void>(),
}));

vi.mock('../../src/utils/platform', () => ({
  isAndroidPlatform: () => android.value,
  isWeb: false,
  isNative: true,
  isAndroid: android.value,
}));

vi.mock('react-native', async () => {
  const actual = await vi.importActual<typeof import('react-native')>('react-native');
  return {
    ...actual,
    Keyboard: {
      addListener: (name: string, handler: (event: unknown) => void) => {
        listeners.set(name, handler);
        return { remove: () => listeners.delete(name) };
      },
    },
  };
});

import { useKeyboardHeight } from '../../src/hooks/useKeyboardHeight';

describe('useKeyboardHeight', () => {
  beforeEach(() => {
    listeners.clear();
    android.value = true;
  });

  it('tracks the keyboard height on show and resets on hide', async () => {
    const { result } = await renderHook(() => useKeyboardHeight());
    expect(result.current).toBe(0);

    await act(async () => {
      listeners.get('keyboardDidShow')?.({ endCoordinates: { height: 312 } });
    });
    expect(result.current).toBe(312);

    await act(async () => {
      listeners.get('keyboardDidHide')?.({});
    });
    expect(result.current).toBe(0);
  });

  it('stays 0 and registers no listeners off Android', async () => {
    android.value = false;
    const { result } = await renderHook(() => useKeyboardHeight());

    await act(async () => {
      listeners.get('keyboardDidShow')?.({ endCoordinates: { height: 300 } });
    });
    expect(result.current).toBe(0);
    expect(listeners.size).toBe(0);
  });

  it('removes its listeners on unmount', async () => {
    const { unmount } = await renderHook(() => useKeyboardHeight());
    expect(listeners.size).toBe(2);
    await act(async () => {
      unmount();
    });
    expect(listeners.size).toBe(0);
  });
});
