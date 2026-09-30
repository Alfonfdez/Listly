import { useCallback, useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import { useApp } from '../../context/AppContext';
import { useConfig } from '../../context/ConfigContext';
import { useLabels } from '../../hooks/useLabels';
import { FACTORY_RESET_CONFIRMATION } from '../../constants/types';
import { ShareResult } from '../../constants/shareResult';
import { isAndroidPlatform } from '../../utils/platform';
import { logError, ERROR_SCOPE } from '../../utils/errors';
import { clearDataKeepSettings, resetDatabase } from '../../database/database';
import { BackupValidationError, exportBackup, importBackup } from '../../database/backupService';
import { pickBackupFile, saveBackupFile, saveBackupToDownloads } from '../../utils/backupIO';
import ScreenShell from '../../components/ScreenShell';
import ConfirmModal from '../../components/ConfirmModal';
import ConfirmWithTextModal from '../../components/settings/ConfirmWithTextModal';
import SettingsSection from '../../components/settings/SettingsSection';
import SettingsRow from '../../components/settings/SettingsRow';
import { settingsStyles } from '../../components/settings/settingsStyles';

type ConfirmAction = 'import' | 'deleteAll' | 'reset';

export default function DataScreen() {
  const { activeColors: c, reload } = useConfig();
  const { refresh } = useApp();
  const labels = useLabels();

  const [pendingImport, setPendingImport] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [typedResetVisible, setTypedResetVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  const runShareFlow = useCallback(
    async (json: string) => {
      const result = await saveBackupFile(json);
      if (result === ShareResult.SAVED) {
        Alert.alert(labels.settings_export_success_title, labels.settings_export_success_message);
      }
    },
    [labels]
  );

  const handleExport = useCallback(async () => {
    try {
      const json = await exportBackup();
      if (isAndroidPlatform()) {
        const savedToDownloads = await saveBackupToDownloads(json);
        if (!savedToDownloads) {
          await runShareFlow(json);
          return;
        }
        Alert.alert(labels.settings_export_downloaded_title, labels.settings_export_downloaded_message, [
          {
            text: labels.settings_export_share_action,
            onPress: () => {
              runShareFlow(json).catch((error) => {
                logError(ERROR_SCOPE.exportBackup, error);
                Alert.alert(labels.settings_export_error_title, labels.settings_export_error_message);
              });
            },
          },
          { text: labels.settings_export_done_action },
        ]);
        return;
      }
      await runShareFlow(json);
    } catch (error) {
      logError(ERROR_SCOPE.exportBackup, error);
      Alert.alert(labels.settings_export_error_title, labels.settings_export_error_message);
    }
  }, [labels, runShareFlow]);

  const handleImport = useCallback(async () => {
    try {
      const json = await pickBackupFile();
      if (!json) return;
      setPendingImport(json);
      setConfirmAction('import');
    } catch (error) {
      logError(ERROR_SCOPE.importBackup, error);
      Alert.alert(labels.settings_import_error_title, labels.settings_import_error_message);
    }
  }, [labels]);

  const runImport = useCallback(async () => {
    if (!pendingImport || busy) return;
    setBusy(true);
    try {
      await importBackup(pendingImport);
      await refresh();
      await reload();
      Alert.alert(labels.settings_import_success_title, labels.settings_import_success_message);
    } catch (error) {
      if (error instanceof BackupValidationError) {
        const [title, message] =
          error.code === 'newer_version'
            ? [labels.settings_import_newer_title, labels.settings_import_newer_message]
            : [labels.settings_import_invalid_title, labels.settings_import_invalid_message];
        Alert.alert(title, message);
      } else {
        logError(ERROR_SCOPE.importBackup, error);
        Alert.alert(labels.settings_import_error_title, labels.settings_import_error_message);
      }
    } finally {
      setPendingImport(null);
      setConfirmAction(null);
      setBusy(false);
    }
  }, [pendingImport, busy, refresh, reload, labels]);

  const runDeleteAll = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      await clearDataKeepSettings();
      await refresh();
      Alert.alert(labels.settings_delete_all_success);
    } catch (error) {
      logError(ERROR_SCOPE.deleteAllData, error);
      Alert.alert(labels.settings_delete_all_error);
    } finally {
      setConfirmAction(null);
      setBusy(false);
    }
  }, [busy, refresh, labels]);

  const runFactoryReset = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      await resetDatabase();
      await refresh();
      await reload();
      Alert.alert(labels.settings_factory_reset_success);
    } catch (error) {
      logError(ERROR_SCOPE.factoryReset, error);
      Alert.alert(labels.settings_factory_reset_error);
    } finally {
      setTypedResetVisible(false);
      setBusy(false);
    }
  }, [busy, refresh, reload, labels]);

  const confirmContent =
    confirmAction === 'import'
      ? {
          title: labels.settings_import_confirm_title,
          message: labels.settings_import_confirm_message,
          confirmLabel: labels.settings_import_action,
          destructive: false,
          onConfirm: () => void runImport(),
        }
      : confirmAction === 'deleteAll'
        ? {
            title: labels.settings_delete_all_confirm_title,
            message: labels.settings_delete_all_confirm_message,
            confirmLabel: labels.settings_delete_confirm,
            destructive: true,
            onConfirm: () => void runDeleteAll(),
          }
        : confirmAction === 'reset'
          ? {
              title: labels.settings_factory_reset_confirm_title,
              message: labels.settings_factory_reset_confirm_message,
              confirmLabel: labels.settings_delete_confirm,
              destructive: true,
              onConfirm: () => {
                setConfirmAction(null);
                setTypedResetVisible(true);
              },
            }
          : null;

  return (
    <ScreenShell>
      <ScrollView style={settingsStyles.container} contentContainerStyle={settingsStyles.content}>
        <SettingsSection title={labels.settings_data} card={false}>
          <SettingsRow
            label={labels.settings_export_data}
            icon="share-outline"
            onPress={() => void handleExport()}
          />
          <SettingsRow
            label={labels.settings_import_data}
            icon="download-outline"
            onPress={() => void handleImport()}
          />
          <SettingsRow
            label={labels.settings_delete_all}
            description={labels.settings_delete_all_description}
            icon="trash-outline"
            iconColor={c.red}
            labelColor={c.red}
            showChevron={false}
            onPress={() => setConfirmAction('deleteAll')}
          />
          <SettingsRow
            label={labels.settings_factory_reset}
            description={labels.settings_factory_reset_description}
            icon="refresh-outline"
            iconColor={c.red}
            labelColor={c.red}
            showChevron={false}
            onPress={() => setConfirmAction('reset')}
          />
        </SettingsSection>
      </ScrollView>

      {confirmAction !== null ? (
        <ConfirmModal
          visible
          title={confirmContent?.title ?? ''}
          message={confirmContent?.message}
          cancelLabel={labels.common_cancel}
          confirmLabel={confirmContent?.confirmLabel ?? ''}
          destructive={confirmContent?.destructive}
          onCancel={() => {
            setConfirmAction(null);
            setPendingImport(null);
          }}
          onConfirm={() => confirmContent?.onConfirm()}
        />
      ) : null}

      {typedResetVisible ? (
        <ConfirmWithTextModal
          visible
          title={labels.settings_factory_reset_confirm_title}
          message={labels.settings_factory_reset_confirm_message}
          hint={labels.settings_factory_reset_confirm_hint(FACTORY_RESET_CONFIRMATION)}
          confirmationText={FACTORY_RESET_CONFIRMATION}
          cancelLabel={labels.common_cancel}
          confirmLabel={labels.settings_delete_confirm}
          onCancel={() => setTypedResetVisible(false)}
          onConfirm={() => void runFactoryReset()}
        />
      ) : null}
    </ScreenShell>
  );
}
