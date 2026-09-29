import { ShareResult, type ShareResultValue } from '../constants/shareResult';
import { backupFileName } from './formatters';

export async function saveBackupToDownloads(json: string): Promise<boolean> {
  await saveBackupFile(json);
  return true;
}

export async function saveBackupFile(json: string): Promise<ShareResultValue> {
  if (typeof document === 'undefined') return ShareResult.SAVED;
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = backupFileName();
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  return ShareResult.SAVED;
}

export async function pickBackupFile(): Promise<string | null> {
  if (typeof document === 'undefined') return null;
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.style.display = 'none';

    let settled = false;
    const onFocus = () => {
      window.setTimeout(() => finish(null), 400);
    };
    const finish = (value: string | null) => {
      if (settled) return;
      settled = true;
      input.remove();
      window.removeEventListener('focus', onFocus);
      resolve(value);
    };

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        finish(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => finish(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => finish(null);
      reader.readAsText(file);
    };

    window.addEventListener('focus', onFocus, { once: true });
    document.body.appendChild(input);
    input.click();
  });
}
