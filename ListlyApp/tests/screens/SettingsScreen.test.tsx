import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, userEvent, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import SettingsScreen from '../../src/screens/SettingsScreen';
import { buildAppMock, getAppStub, resetAppStub } from '../helpers/appStub';
import { getConfigStub, resetStub } from '../helpers/configStub';

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

vi.mock('../../src/database/backupService', () => ({
  BackupValidationError: backupMocks.BackupValidationError,
  exportBackup: backupMocks.exportBackup,
  importBackup: backupMocks.importBackup,
}));

const dbMocks = vi.hoisted(() => ({
  clearDataKeepSettings: vi.fn(),
  resetDatabase: vi.fn(),
}));

vi.mock('../../src/database/database', () => ({
  clearDataKeepSettings: dbMocks.clearDataKeepSettings,
  resetDatabase: dbMocks.resetDatabase,
}));

const ioMocks = vi.hoisted(() => ({
  saveBackupFile: vi.fn(),
  pickBackupFile: vi.fn(),
}));

vi.mock('../../src/utils/backupIO', () => ({
  saveBackupFile: ioMocks.saveBackupFile,
  pickBackupFile: ioMocks.pickBackupFile,
}));

vi.mock('../../src/context/AppContext', () => ({
  useApp: () => buildAppMock(),
  AppProvider: ({ children }: { children: ReactNode }) => children as ReactNode,
}));

describe('SettingsScreen', () => {
  beforeEach(() => {
    resetStub();
    resetAppStub();
    backupMocks.exportBackup.mockReset();
    backupMocks.importBackup.mockReset();
    dbMocks.clearDataKeepSettings.mockReset();
    dbMocks.resetDatabase.mockReset();
    ioMocks.saveBackupFile.mockReset();
    ioMocks.pickBackupFile.mockReset();
    backupMocks.exportBackup.mockResolvedValue('{"app":"Listly"}');
    ioMocks.saveBackupFile.mockResolvedValue(undefined);
    dbMocks.clearDataKeepSettings.mockResolvedValue(undefined);
    dbMocks.resetDatabase.mockResolvedValue(undefined);
  });

  it('renders every settings section and control', async () => {
    const view = await render(<SettingsScreen />);
    expect(view.getByText('Appearance')).toBeTruthy();
    expect(view.getByText('Regional')).toBeTruthy();
    expect(view.getByText('Personalization')).toBeTruthy();
    expect(view.getByText('Data')).toBeTruthy();
    expect(view.getByText('Theme')).toBeTruthy();
    expect(view.getByText('Text size')).toBeTruthy();
    expect(view.getByText('Language')).toBeTruthy();
    expect(view.getByText('Show notes')).toBeTruthy();
    expect(view.getByText('Show photos')).toBeTruthy();
    expect(view.getByText('Export data')).toBeTruthy();
    expect(view.getByText('Import data')).toBeTruthy();
    expect(view.getByText('Delete all lists')).toBeTruthy();
    expect(view.getByText('Factory reset')).toBeTruthy();
  });

  it('persists the theme, language and list layout selections', async () => {
    const user = userEvent.setup();
    const view = await render(<SettingsScreen />);
    const updateConfig = getConfigStub().updateConfig;

    await user.press(view.getByLabelText('Dark'));
    expect(updateConfig).toHaveBeenCalledWith({ theme: 'dark' });

    await user.press(view.getByLabelText('Español'));
    expect(updateConfig).toHaveBeenCalledWith({ language: 'es' });

    await user.press(view.getByLabelText('Grid'));
    expect(updateConfig).toHaveBeenCalledWith({ listLayout: 'grid' });
  });

  it('toggles the note and photo visibility flags', async () => {
    const user = userEvent.setup();
    const view = await render(<SettingsScreen />);
    const updateConfig = getConfigStub().updateConfig;

    await user.press(view.getByLabelText('Show notes'));
    expect(updateConfig).toHaveBeenCalledWith({ showNotes: false });

    await user.press(view.getByLabelText('Show photos'));
    expect(updateConfig).toHaveBeenCalledWith({ showPhotos: false });
  });

  it('exports a backup and reports success', async () => {
    const user = userEvent.setup();
    const view = await render(<SettingsScreen />);

    await user.press(view.getByLabelText('Export data'));

    await waitFor(() => expect(ioMocks.saveBackupFile).toHaveBeenCalledWith('{"app":"Listly"}'));
    expect(await view.findByText('Backup exported.')).toBeTruthy();
  });

  it('reports an export failure', async () => {
    backupMocks.exportBackup.mockRejectedValue(new Error('boom'));
    const user = userEvent.setup();
    const view = await render(<SettingsScreen />);

    await user.press(view.getByLabelText('Export data'));

    expect(await view.findByText('Could not export the backup.')).toBeTruthy();
  });

  it('imports a picked backup after confirmation', async () => {
    ioMocks.pickBackupFile.mockResolvedValue('{"app":"Listly"}');
    backupMocks.importBackup.mockResolvedValue(undefined);
    const user = userEvent.setup();
    const view = await render(<SettingsScreen />);

    await user.press(view.getByLabelText('Import data'));
    expect(await view.findByText('Replace all data?')).toBeTruthy();
    await user.press(view.getByLabelText('Import'));

    await waitFor(() => expect(backupMocks.importBackup).toHaveBeenCalledWith('{"app":"Listly"}'));
    expect(getAppStub().refresh).toHaveBeenCalled();
    expect(getConfigStub().reload).toHaveBeenCalled();
    expect(await view.findByText('Backup imported.')).toBeTruthy();
  });

  it('reports an invalid backup file', async () => {
    ioMocks.pickBackupFile.mockResolvedValue('{"app":"Other"}');
    backupMocks.importBackup.mockRejectedValue(
      new backupMocks.BackupValidationError('invalid_format', 'bad')
    );
    const user = userEvent.setup();
    const view = await render(<SettingsScreen />);

    await user.press(view.getByLabelText('Import data'));
    await user.press(view.getByLabelText('Import'));

    expect(await view.findByText('The selected file is not a valid Listly backup.')).toBeTruthy();
  });

  it('reports a backup from a newer version', async () => {
    ioMocks.pickBackupFile.mockResolvedValue('{"schema":999}');
    backupMocks.importBackup.mockRejectedValue(
      new backupMocks.BackupValidationError('newer_version', 'newer')
    );
    const user = userEvent.setup();
    const view = await render(<SettingsScreen />);

    await user.press(view.getByLabelText('Import data'));
    await user.press(view.getByLabelText('Import'));

    expect(
      await view.findByText('This backup was created with a newer version of Listly.')
    ).toBeTruthy();
  });

  it('does nothing when the file picker is cancelled', async () => {
    ioMocks.pickBackupFile.mockResolvedValue(null);
    const user = userEvent.setup();
    const view = await render(<SettingsScreen />);

    await user.press(view.getByLabelText('Import data'));

    expect(view.queryByText('Replace all data?')).toBeNull();
    expect(backupMocks.importBackup).not.toHaveBeenCalled();
  });

  it('deletes all lists after confirmation', async () => {
    const user = userEvent.setup();
    const view = await render(<SettingsScreen />);

    await user.press(view.getByLabelText('Delete all lists'));
    expect(await view.findByText('Delete all lists?')).toBeTruthy();
    await user.press(view.getByLabelText('Delete'));

    await waitFor(() => expect(dbMocks.clearDataKeepSettings).toHaveBeenCalled());
    expect(getAppStub().refresh).toHaveBeenCalled();
    expect(getConfigStub().reload).not.toHaveBeenCalled();
    expect(await view.findByText('All lists deleted.')).toBeTruthy();
  });

  it('resets to factory settings after confirmation', async () => {
    const user = userEvent.setup();
    const view = await render(<SettingsScreen />);

    await user.press(view.getByLabelText('Factory reset'));
    expect(await view.findByText('Reset to factory settings?')).toBeTruthy();
    await user.press(view.getByLabelText('Delete'));

    await waitFor(() => expect(dbMocks.resetDatabase).toHaveBeenCalled());
    expect(getAppStub().refresh).toHaveBeenCalled();
    expect(getConfigStub().reload).toHaveBeenCalled();
    expect(await view.findByText('App reset to default settings.')).toBeTruthy();
  });

  it('cancels a destructive confirmation without running it', async () => {
    const user = userEvent.setup();
    const view = await render(<SettingsScreen />);

    await user.press(view.getByLabelText('Delete all lists'));
    await user.press(view.getByLabelText('Cancel'));

    expect(dbMocks.clearDataKeepSettings).not.toHaveBeenCalled();
    expect(view.queryByText('Delete all lists?')).toBeNull();
  });
});
