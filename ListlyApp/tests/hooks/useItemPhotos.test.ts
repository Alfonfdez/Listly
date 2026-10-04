import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react-native';

const { requestCameraPermissionsAsync, launchCameraAsync, requestMediaLibraryPermissionsAsync, launchImageLibraryAsync } =
  vi.hoisted(() => ({
    requestCameraPermissionsAsync: vi.fn(),
    launchCameraAsync: vi.fn(),
    requestMediaLibraryPermissionsAsync: vi.fn(),
    launchImageLibraryAsync: vi.fn(),
  }));

vi.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync,
  launchCameraAsync,
  requestMediaLibraryPermissionsAsync,
  launchImageLibraryAsync,
}));

vi.mock('../../src/utils/itemPhotos', async () => {
  const actual = await vi.importActual<typeof import('../../src/utils/itemPhotos')>('../../src/utils/itemPhotos');
  return { ...actual, deleteItemPhotos: vi.fn(async () => {}) };
});

import { useItemPhotos } from '../../src/hooks/useItemPhotos';

describe('useItemPhotos error handling', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it('logs and does not throw when requesting the camera permission rejects', async () => {
    requestCameraPermissionsAsync.mockRejectedValue(new Error('no camera'));
    const { result } = await renderHook(() => useItemPhotos());

    await act(async () => {
      await result.current.handleTakePhoto();
    });

    expect(errorSpy).toHaveBeenCalled();
  });

  it('logs and does not throw when the gallery launch rejects', async () => {
    requestMediaLibraryPermissionsAsync.mockResolvedValue({ status: 'granted' });
    launchImageLibraryAsync.mockRejectedValue(new Error('boom'));
    const { result } = await renderHook(() => useItemPhotos());

    await act(async () => {
      await result.current.handlePickFromGallery();
    });

    expect(errorSpy).toHaveBeenCalled();
  });

  it('does not launch the camera when permission is denied', async () => {
    requestCameraPermissionsAsync.mockResolvedValue({ status: 'denied' });
    const { result } = await renderHook(() => useItemPhotos());

    await act(async () => {
      await result.current.handleTakePhoto();
    });

    expect(launchCameraAsync).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
