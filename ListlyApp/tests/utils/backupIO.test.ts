import { describe, expect, it, beforeEach, vi } from 'vitest';
import { ShareResult } from '../../src/constants/shareResult';

const shareMocks = vi.hoisted(() => ({
  isAvailableAsync: vi.fn(async () => true),
}));

vi.mock('expo-sharing', () => ({
  isAvailableAsync: shareMocks.isAvailableAsync,
}));

vi.mock('expo-document-picker', () => ({
  getDocumentAsync: vi.fn(),
}));

const moduleMocks = vi.hoisted(() => ({
  shareFileAsync: vi.fn(async () => ShareResult.SAVED as string),
  saveToDownloadsAsync: vi.fn(async () => true),
}));

vi.mock('../../modules/listly-share/src/index', () => ({
  shareFileAsync: moduleMocks.shareFileAsync,
  saveToDownloadsAsync: moduleMocks.saveToDownloadsAsync,
}));

vi.mock('../../src/utils/fileIo', () => ({
  File: class {
    uri = 'file:///document/listly-backup.json';
    async write(): Promise<void> {}
  },
  Paths: { document: { uri: 'file:///document/' } },
}));

vi.mock('../../src/utils/platform', () => ({
  isWeb: false,
  isNative: true,
  isAndroid: false,
  isAndroidPlatform: () => false,
}));

describe('backupIO (native)', () => {
  beforeEach(() => {
    shareMocks.isAvailableAsync.mockReset();
    shareMocks.isAvailableAsync.mockResolvedValue(true);
    moduleMocks.shareFileAsync.mockReset();
    moduleMocks.shareFileAsync.mockResolvedValue(ShareResult.SAVED);
    moduleMocks.saveToDownloadsAsync.mockReset();
    moduleMocks.saveToDownloadsAsync.mockResolvedValue(true);
  });

  it('reports saved without sharing when sharing is unavailable', async () => {
    shareMocks.isAvailableAsync.mockResolvedValue(false);
    const { saveBackupFile } = await import('../../src/utils/backupIO');

    expect(await saveBackupFile('{}')).toBe(ShareResult.SAVED);
    expect(moduleMocks.shareFileAsync).not.toHaveBeenCalled();
  });

  it('shares the written file and returns the share outcome', async () => {
    moduleMocks.shareFileAsync.mockResolvedValue(ShareResult.DISMISSED);
    const { saveBackupFile } = await import('../../src/utils/backupIO');

    expect(await saveBackupFile('{}')).toBe(ShareResult.DISMISSED);
    expect(moduleMocks.shareFileAsync).toHaveBeenCalledWith(
      'file:///document/listly-backup.json',
      'application/json',
      expect.any(String)
    );
  });

  it('does not save to Downloads when not on Android', async () => {
    const { saveBackupToDownloads } = await import('../../src/utils/backupIO');

    expect(await saveBackupToDownloads('{}')).toBe(false);
    expect(moduleMocks.saveToDownloadsAsync).not.toHaveBeenCalled();
  });

  it('saves to Downloads on Android', async () => {
    vi.resetModules();
    vi.doMock('../../src/utils/platform', () => ({
      isWeb: false,
      isNative: true,
      isAndroid: true,
      isAndroidPlatform: () => true,
    }));
    const { saveBackupToDownloads } = await import('../../src/utils/backupIO');

    expect(await saveBackupToDownloads('{}')).toBe(true);
    expect(moduleMocks.saveToDownloadsAsync).toHaveBeenCalledWith(expect.any(String), '{}');
    vi.doUnmock('../../src/utils/platform');
  });
});
