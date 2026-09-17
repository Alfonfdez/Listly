import { buildBackup, applyBackup, parseBackup, serializeBackup, BackupValidationError } from './backup';
import { getDatabase, SCHEMA_VERSION } from './database';

export { BackupValidationError };

export async function exportBackup(): Promise<string> {
  const db = await getDatabase();
  const snapshot = await buildBackup(db, SCHEMA_VERSION);
  return serializeBackup(snapshot);
}

export async function importBackup(json: string): Promise<void> {
  const snapshot = parseBackup(json);
  if (snapshot.schema > SCHEMA_VERSION) {
    throw new BackupValidationError('newer_version', 'Backup comes from a newer app version');
  }
  const db = await getDatabase();
  await applyBackup(db, snapshot);
}
