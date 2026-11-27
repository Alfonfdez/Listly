import { openDatabaseSync } from 'expo-sqlite';
import type { DatabaseHandle } from './types';

export async function openEngine(name: string): Promise<DatabaseHandle> {
  return openDatabaseSync(name) as unknown as DatabaseHandle;
}
