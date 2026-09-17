import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { useConfig } from '../context/ConfigContext';
import { useFontSize } from '../hooks/useFontSize';
import { t } from '../i18n';
import { LANGUAGES, type LanguageId } from '../constants/languages';
import { LIST_LAYOUTS, TEXT_SIZES, THEMES, type ListLayout, type TextSize, type Theme } from '../constants/types';
import { clearDataKeepSettings, resetDatabase } from '../database/database';
import { BackupValidationError, exportBackup, importBackup } from '../database/backupService';
import { pickBackupFile, saveBackupFile } from '../utils/backupIO';
import ScreenShell from '../components/ScreenShell';
import ConfirmModal from '../components/ConfirmModal';
import SettingsSection from '../components/settings/SettingsSection';
import SettingsSelectRow from '../components/settings/SettingsSelectRow';
import SettingsRow from '../components/settings/SettingsRow';
import ToggleRow from '../components/settings/ToggleRow';
import { settingsStyles } from '../components/settings/settingsStyles';
import type { Option } from '../components/settings/SelectorInline';

type StatusMessage = { kind: 'success' | 'error'; text: string };
type ConfirmAction = 'import' | 'deleteAll' | 'reset';

export default function SettingsScreen() {
  const { config, activeColors: c, updateConfig, reload } = useConfig();
  const { refresh } = useApp();
  const fs = useFontSize();
  const labels = t();

  const [status, setStatus] = useState<StatusMessage | null>(null);
  const [pendingImport, setPendingImport] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [busy, setBusy] = useState(false);

  const themeOptions: Option<Theme>[] = [
    { label: labels.theme_light, value: THEMES.light },
    { label: labels.theme_dark, value: THEMES.dark },
    { label: labels.theme_system, value: THEMES.system },
  ];
  const sizeOptions: Option<TextSize>[] = [
    { label: labels.size_small, value: TEXT_SIZES.small },
    { label: labels.size_medium, value: TEXT_SIZES.medium },
    { label: labels.size_large, value: TEXT_SIZES.large },
  ];
  const languageOptions: Option<LanguageId>[] = [
    { label: labels.lang_en, value: LANGUAGES.en },
    { label: labels.lang_es, value: LANGUAGES.es },
  ];
  const layoutOptions: Option<ListLayout>[] = [
    { label: labels.layout_grid, value: LIST_LAYOUTS.grid },
    { label: labels.layout_list, value: LIST_LAYOUTS.list },
  ];

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
        const text = error.code === 'newer_version' ? labels.settings_import_newer : labels.settings_import_invalid;
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
      setConfirmAction(null);
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
              onConfirm: () => void runFactoryReset(),
            }
          : null;

  return (
    <ScreenShell>
      <ScrollView style={settingsStyles.container} contentContainerStyle={settingsStyles.content}>
        <SettingsSection title={labels.settings_appearance}>
          <SettingsSelectRow
            label={labels.settings_theme}
            options={themeOptions}
            selected={config.theme}
            onSelect={theme => void updateConfig({ theme })}
          />
          <View style={styles.spacer} />
          <SettingsSelectRow
            label={labels.settings_text_size}
            options={sizeOptions}
            selected={config.textSize}
            onSelect={textSize => void updateConfig({ textSize })}
          />
        </SettingsSection>

        <SettingsSection title={labels.settings_regional}>
          <SettingsSelectRow
            label={labels.settings_language}
            options={languageOptions}
            selected={config.language}
            onSelect={language => void updateConfig({ language })}
          />
        </SettingsSection>

        <SettingsSection title={labels.settings_personalization} card={false}>
          <View style={[settingsStyles.card, { backgroundColor: c.surface }]}>
            <SettingsSelectRow
              label={labels.settings_lists}
              options={layoutOptions}
              selected={config.listLayout}
              onSelect={listLayout => void updateConfig({ listLayout })}
            />
          </View>
          <View style={[settingsStyles.card, { backgroundColor: c.surface }]}>
            <Text style={[settingsStyles.label, { color: c.text, fontSize: fs(15) }]}>
              {labels.settings_item_display}
            </Text>
            <ToggleRow
              label={labels.settings_show_notes}
              checked={config.showNotes}
              onToggle={() => void updateConfig({ showNotes: !config.showNotes })}
            />
            <ToggleRow
              label={labels.settings_show_photos}
              checked={config.showPhotos}
              onToggle={() => void updateConfig({ showPhotos: !config.showPhotos })}
            />
          </View>
        </SettingsSection>

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

      <ConfirmModal
        visible={confirmAction !== null}
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
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  spacer: { height: 16 },
  status: {
    marginTop: 4,
    fontWeight: '500',
  },
});
