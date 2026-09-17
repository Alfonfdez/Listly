import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from './fileIo';
import { backupFileName } from './formatters';
import { t } from '../i18n';

export async function saveBackupFile(json: string): Promise<void> {
  const file = new File(Paths.document, backupFileName());
  await file.write(json);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: t().settings_export_data,
    });
  }
}

export async function pickBackupFile(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  });
  if (result.canceled || result.assets.length === 0) return null;
  const file = new File(result.assets[0].uri);
  return file.text();
}
