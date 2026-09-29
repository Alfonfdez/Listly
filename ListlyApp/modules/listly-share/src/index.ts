import { requireNativeModule } from 'expo-modules-core';

import type { ShareResultValue } from '../../../src/constants/shareResult';

type ListlyShareNativeModule = {
  shareFileAsync(url: string, mimeType: string, dialogTitle: string): Promise<ShareResultValue>;
  saveToDownloadsAsync(fileName: string, content: string): Promise<boolean>;
};

let nativeModule: ListlyShareNativeModule | null = null;

function getNativeModule(): ListlyShareNativeModule | null {
  if (nativeModule != null) {
    return nativeModule;
  }
  try {
    nativeModule = requireNativeModule<ListlyShareNativeModule>('ListlyShare');
  } catch {
    nativeModule = null;
  }
  return nativeModule;
}

export async function shareFileAsync(
  url: string,
  mimeType: string,
  dialogTitle: string
): Promise<ShareResultValue> {
  const module = getNativeModule();
  if (module == null) {
    throw new Error('ListlyShare native module is not available.');
  }
  return await module.shareFileAsync(url, mimeType, dialogTitle);
}

export async function saveToDownloadsAsync(fileName: string, content: string): Promise<boolean> {
  const module = getNativeModule();
  if (module == null) {
    return false;
  }
  return await module.saveToDownloadsAsync(fileName, content);
}
