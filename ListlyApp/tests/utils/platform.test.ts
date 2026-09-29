import { describe, expect, it } from 'vitest';
import { Platform } from 'react-native';
import { isAndroid, isAndroidPlatform, isNative, isWeb } from '../../src/utils/platform';

describe('platform', () => {
  it('isWeb / isNative reflect the current platform', () => {
    expect(isWeb).toBe(Platform.OS === 'web');
    expect(isNative).toBe(Platform.OS !== 'web');
  });

  it('isAndroid and isAndroidPlatform reflect the current platform', () => {
    const expected = Platform.OS === 'android';
    expect(isAndroid).toBe(expected);
    expect(isAndroidPlatform()).toBe(expected);
  });
});
