import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useApp } from '../../context/AppContext';
import { useConfig } from '../../context/ConfigContext';
import { useFontSize } from '../../hooks/useFontSize';
import { useLabels } from '../../hooks/useLabels';
import { FACTORY_RESET_CONFIRMATION } from '../../constants/types';
import { clearDataKeepSettings, resetDatabase } from '../../database/database';
import { BackupValidationError, exportBackup, importBackup } from '../../database/backupService';
import { pickBackupFile, saveBackupFile } from '../../utils/backupIO';
import ScreenShell from '../../components/ScreenShell';
import ConfirmModal from '../../components/ConfirmModal';
import ConfirmWithTextModal from '../../components/settings/ConfirmWithTextModal';
import SettingsSection from '../../components/settings/SettingsSection';
import SettingsRow from '../../components/settings/SettingsRow';
import { settingsStyles } from '../../components/settings/settingsStyles';

type StatusMessage = { kind: 'success' | 'error'; text: string };
type ConfirmAction = 'import' | 'deleteAll' | 'reset';

export default function DataScreen() {
  const { activeColors: c, reload } = useConfig();
  const { refresh } = useApp();
  const fs = useFontSize();
  const labels = useLabels();

  const [status, setStatus] = useState<StatusMessage | null>(null);
  const [pendingImport, setPendingImport] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [typedResetVisible, setTypedResetVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleExport = useCallback(async () => {
    setStatus(null);
    try {
      const json = await exportBackup();
      await saveBackupFile(json);
      setStatus({ kind: 'success', text: labels.settings_export_success });
    } catch (error) {
      console.error('Export failed:', error);
      setStatus({ kind: 'error', text: labels.settings_export_error });
    }
  }, [labels]);

  const handleImport = useCallback(async () => {
    try {
      const json = await pickBackupFile();
      if (!json) return;
      setPendingImport(json);
      setConfirmAction('import');
    } catch (error) {
      console.error('Import failed:', error);
      setStatus({ kind: 'error', text: labels.settings_import_error });
    }
  }, [labels]);

  const runImport = useCallback(async () => {
    if (!pendingImport || busy) return;
    setBusy(true);
    setStatus(null);
    try {
      await importBackup(pendingImport);
      await refresh();
      await reload();
      setStatus({ kind: 'success', text: labels.settings_import_success });
    } catch (error) {
      if (error instanceof BackupValidationError) {
        const text =
          error.code === 'newer_version' ? labels.settings_import_newer : labels.settings_import_invalid;
        setStatus({ kind: 'error', text });
      } else {
        console.error('Import failed:', error);
        setStatus({ kind: 'error', text: labels.settings_import_error });
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
    setStatus(null);
    try {
      await clearDataKeepSettings();
      await refresh();
      setStatus({ kind: 'success', text: labels.settings_delete_all_success });
    } catch (error) {
      console.error('Delete all failed:', error);
      setStatus({ kind: 'error', text: labels.settings_delete_all_error });
    } finally {
      setConfirmAction(null);
      setBusy(false);
    }
  }, [busy, refresh, labels]);

  const runFactoryReset = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setStatus(null);
    try {
      await resetDatabase();
      await refresh();
      await reload();
      setStatus({ kind: 'success', text: labels.settings_factory_reset_success });
    } catch (error) {
      console.error('Factory reset failed:', error);
      setStatus({ kind: 'error', text: labels.settings_factory_reset_error });
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
          {status ? (
            <Text
              accessibilityRole="alert"
              style={[styles.status, { color: status.kind === 'success' ? c.green : c.red, fontSize: fs(13) }]}
            >
              {status.text}
            </Text>
          ) : null}
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

const styles = StyleSheet.create({
  status: {
    marginTop: 4,
    fontWeight: '500',
  },
});
