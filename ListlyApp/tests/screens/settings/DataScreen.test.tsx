import { describe, expect, it, beforeEach, vi } from 'vitest';
import { Alert, type AlertButton } from 'react-native';
import { render, userEvent, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import DataScreen from '../../../src/screens/settings/DataScreen';
import { ShareResult } from '../../../src/constants/shareResult';
import { buildAppMock, getAppStub, resetAppStub } from '../../helpers/appStub';
import { getConfigStub, resetStub } from '../../helpers/configStub';

const backupMocks = vi.hoisted(() => {
  class BackupValidationError extends Error {
    readonly code: string;
    constructor(code: string, message: string) {
      super(message);
      this.name = 'BackupValidationError';
      this.code = code;
    }
  }
  return {
    BackupValidationError,
    exportBackup: vi.fn(),
    importBackup: vi.fn(),
  };
});

vi.mock('../../../src/database/backupService', () => ({
  BackupValidationError: backupMocks.BackupValidationError,
  exportBackup: backupMocks.exportBackup,
  importBackup: backupMocks.importBackup,
}));

const dbMocks = vi.hoisted(() => ({
  clearDataKeepSettings: vi.fn(),
  resetDatabase: vi.fn(),
}));

vi.mock('../../../src/database/database', () => ({
  clearDataKeepSettings: dbMocks.clearDataKeepSettings,
  resetDatabase: dbMocks.resetDatabase,
}));

const ioMocks = vi.hoisted(() => ({
  saveBackupFile: vi.fn(),
  saveBackupToDownloads: vi.fn(),
  pickBackupFile: vi.fn(),
}));

vi.mock('../../../src/utils/backupIO', () => ({
  saveBackupFile: ioMocks.saveBackupFile,
  saveBackupToDownloads: ioMocks.saveBackupToDownloads,
  pickBackupFile: ioMocks.pickBackupFile,
}));

const platformMock = vi.hoisted(() => ({ android: false }));

vi.mock('../../../src/utils/platform', async () => {
  const actual = await vi.importActual<typeof import('../../../src/utils/platform')>(
    '../../../src/utils/platform'
  );
  return { ...actual, isAndroidPlatform: () => platformMock.android };
});

vi.mock('../../../src/context/AppContext', () => ({
  useApp: () => buildAppMock(),
  AppProvider: ({ children }: { children: ReactNode }) => children as ReactNode,
}));

const alertSpy = vi.spyOn(Alert, 'alert').mockImplementation(() => {});

function lastAlertButtons(): AlertButton[] {
  const calls = alertSpy.mock.calls;
  const buttons = calls[calls.length - 1]?.[2];
  return (buttons as AlertButton[] | undefined) ?? [];
}

describe('DataScreen', () => {
  beforeEach(() => {
    resetStub();
    resetAppStub();
    alertSpy.mockClear();
    backupMocks.exportBackup.mockReset();
    backupMocks.importBackup.mockReset();
    dbMocks.clearDataKeepSettings.mockReset();
    dbMocks.resetDatabase.mockReset();
    ioMocks.saveBackupFile.mockReset();
    ioMocks.saveBackupToDownloads.mockReset();
    ioMocks.pickBackupFile.mockReset();
    platformMock.android = false;
    backupMocks.exportBackup.mockResolvedValue('{"app":"Listly"}');
    ioMocks.saveBackupFile.mockResolvedValue(ShareResult.SAVED);
    ioMocks.saveBackupToDownloads.mockResolvedValue(true);
    dbMocks.clearDataKeepSettings.mockResolvedValue(undefined);
    dbMocks.resetDatabase.mockResolvedValue(undefined);
  });

  it('renders every data action', async () => {
    const view = await render(<DataScreen />);
    expect(view.getByText('Export data')).toBeTruthy();
    expect(view.getByText('Import data')).toBeTruthy();
    expect(view.getByText('Delete all lists')).toBeTruthy();
    expect(view.getByText('Factory reset')).toBeTruthy();
  });

  it('exports a backup and reports success when the share completes', async () => {
    const user = userEvent.setup();
    const view = await render(<DataScreen />);

    await user.press(view.getByLabelText('Export data'));

    await waitFor(() => expect(ioMocks.saveBackupFile).toHaveBeenCalledWith('{"app":"Listly"}'));
    expect(alertSpy).toHaveBeenCalledWith('Backup exported.');
  });

  it('shows no success feedback when the share sheet is dismissed', async () => {
    ioMocks.saveBackupFile.mockResolvedValue(ShareResult.DISMISSED);
    const user = userEvent.setup();
    const view = await render(<DataScreen />);

    await user.press(view.getByLabelText('Export data'));

    await waitFor(() => expect(ioMocks.saveBackupFile).toHaveBeenCalled());
    expect(alertSpy).not.toHaveBeenCalledWith('Backup exported.');
  });

  it('reports an export failure', async () => {
    backupMocks.exportBackup.mockRejectedValue(new Error('boom'));
    const user = userEvent.setup();
    const view = await render(<DataScreen />);

    await user.press(view.getByLabelText('Export data'));

    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith('Could not export the backup.'));
  });

  it('saves to Downloads on Android and offers Share/Done', async () => {
    platformMock.android = true;
    const user = userEvent.setup();
    const view = await render(<DataScreen />);

    await user.press(view.getByLabelText('Export data'));

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(
        'Backup saved',
        'Your backup has been saved to the Downloads folder.',
        expect.any(Array)
      )
    );
    expect(ioMocks.saveBackupFile).not.toHaveBeenCalled();
    expect(lastAlertButtons().map(b => b.text)).toEqual(['Share', 'Done']);
  });

  it('shares from the Downloads alert when Share is pressed', async () => {
    platformMock.android = true;
    const user = userEvent.setup();
    const view = await render(<DataScreen />);

    await user.press(view.getByLabelText('Export data'));
    await waitFor(() => expect(ioMocks.saveBackupToDownloads).toHaveBeenCalled());

    const share = lastAlertButtons().find(b => b.text === 'Share');
    share?.onPress?.();

    await waitFor(() => expect(ioMocks.saveBackupFile).toHaveBeenCalledWith('{"app":"Listly"}'));
  });

  it('falls back to the share sheet on Android when Downloads is unsupported', async () => {
    platformMock.android = true;
    ioMocks.saveBackupToDownloads.mockResolvedValue(false);
    const user = userEvent.setup();
    const view = await render(<DataScreen />);

    await user.press(view.getByLabelText('Export data'));

    await waitFor(() => expect(ioMocks.saveBackupFile).toHaveBeenCalledWith('{"app":"Listly"}'));
    expect(alertSpy).toHaveBeenCalledWith('Backup exported.');
  });

  it('imports a picked backup after confirmation', async () => {
    ioMocks.pickBackupFile.mockResolvedValue('{"app":"Listly"}');
    backupMocks.importBackup.mockResolvedValue(undefined);
    const user = userEvent.setup();
    const view = await render(<DataScreen />);

    await user.press(view.getByLabelText('Import data'));
    expect(await view.findByText('Replace all data?')).toBeTruthy();
    await user.press(view.getByLabelText('Import'));

    await waitFor(() => expect(backupMocks.importBackup).toHaveBeenCalledWith('{"app":"Listly"}'));
    expect(getAppStub().refresh).toHaveBeenCalled();
    expect(getConfigStub().reload).toHaveBeenCalled();
    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith('Backup imported.'));
  });

  it('reports an invalid backup file', async () => {
    ioMocks.pickBackupFile.mockResolvedValue('{"app":"Other"}');
    backupMocks.importBackup.mockRejectedValue(
      new backupMocks.BackupValidationError('invalid_format', 'bad')
    );
    const user = userEvent.setup();
    const view = await render(<DataScreen />);

    await user.press(view.getByLabelText('Import data'));
    await user.press(view.getByLabelText('Import'));

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith('The selected file is not a valid Listly backup.')
    );
  });

  it('reports a backup from a newer version', async () => {
    ioMocks.pickBackupFile.mockResolvedValue('{"schema":999}');
    backupMocks.importBackup.mockRejectedValue(
      new backupMocks.BackupValidationError('newer_version', 'newer')
    );
    const user = userEvent.setup();
    const view = await render(<DataScreen />);

    await user.press(view.getByLabelText('Import data'));
    await user.press(view.getByLabelText('Import'));

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith('This backup was created with a newer version of Listly.')
    );
  });

  it('does nothing when the file picker is cancelled', async () => {
    ioMocks.pickBackupFile.mockResolvedValue(null);
    const user = userEvent.setup();
    const view = await render(<DataScreen />);

    await user.press(view.getByLabelText('Import data'));

    expect(view.queryByText('Replace all data?')).toBeNull();
    expect(backupMocks.importBackup).not.toHaveBeenCalled();
  });

  it('deletes all lists after a single confirmation', async () => {
    const user = userEvent.setup();
    const view = await render(<DataScreen />);

    await user.press(view.getByLabelText('Delete all lists'));
    expect(await view.findByText('Delete all lists?')).toBeTruthy();
    await user.press(view.getByLabelText('Delete'));

    await waitFor(() => expect(dbMocks.clearDataKeepSettings).toHaveBeenCalled());
    expect(getAppStub().refresh).toHaveBeenCalled();
    expect(getConfigStub().reload).not.toHaveBeenCalled();
    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith('All lists deleted.'));
  });

  it('requires typing DELETE in a second modal before the factory reset runs', async () => {
    const user = userEvent.setup();
    const view = await render(<DataScreen />);

    await user.press(view.getByLabelText('Factory reset'));
    expect(await view.findByText('Reset to factory settings?')).toBeTruthy();
    await user.press(view.getByLabelText('Delete'));

    expect(await view.findByText('Type DELETE to confirm')).toBeTruthy();
    expect(dbMocks.resetDatabase).not.toHaveBeenCalled();

    const input = view.getByLabelText('Type DELETE to confirm');
    await user.type(input, 'DELETE');
    await user.press(view.getByLabelText('Delete'));

    await waitFor(() => expect(dbMocks.resetDatabase).toHaveBeenCalled());
    expect(getAppStub().refresh).toHaveBeenCalled();
    expect(getConfigStub().reload).toHaveBeenCalled();
    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith('App reset to default settings.'));
  });

  it('cancels the typed factory-reset modal without resetting', async () => {
    const user = userEvent.setup();
    const view = await render(<DataScreen />);

    await user.press(view.getByLabelText('Factory reset'));
    await user.press(view.getByLabelText('Delete'));
    await view.findByText('Type DELETE to confirm');
    await user.press(view.getByLabelText('Cancel'));

    expect(view.queryByText('Type DELETE to confirm')).toBeNull();
    expect(dbMocks.resetDatabase).not.toHaveBeenCalled();
  });

  it('cancels a destructive confirmation without running it', async () => {
    const user = userEvent.setup();
    const view = await render(<DataScreen />);

    await user.press(view.getByLabelText('Delete all lists'));
    await user.press(view.getByLabelText('Cancel'));

    expect(dbMocks.clearDataKeepSettings).not.toHaveBeenCalled();
    expect(view.queryByText('Delete all lists?')).toBeNull();
  });
});
