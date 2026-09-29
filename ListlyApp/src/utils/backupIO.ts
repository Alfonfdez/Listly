import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from './fileIo';
import { shareFileAsync, saveToDownloadsAsync } from '../../modules/listly-share/src/index';
import { ShareResult, type ShareResultValue } from '../constants/shareResult';
import { isAndroid } from './platform';
import { backupFileName } from './formatters';
import { t } from '../i18n';

export async function saveBackupFile(json: string): Promise<ShareResultValue> {
  const file = new File(Paths.document, backupFileName());
  await file.write(json);
  if (!(await Sharing.isAvailableAsync())) {
    return ShareResult.SAVED;
  }
  return shareFileAsync(file.uri, 'application/json', t().backup_dialog_title);
}

export async function saveBackupToDownloads(json: string): Promise<boolean> {
  if (!isAndroid) {
    return false;
  }
  return saveToDownloadsAsync(backupFileName(), json);
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
