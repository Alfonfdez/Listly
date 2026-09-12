import type { DatabaseHandle } from './types';
import { openEngine } from './engine';
import { createSchema } from './migrations/001_initial';
import { seedDataInner } from './migrations/002_seed';

const DATABASE_NAME = 'Listly.db';
export const SCHEMA_VERSION = 2;

let dbPromise: Promise<DatabaseHandle> | null = null;

export function getDatabase(): Promise<DatabaseHandle> {
  if (!dbPromise) {
    dbPromise = openEngine(DATABASE_NAME);
  }
  return dbPromise;
}

async function migrate(database: DatabaseHandle): Promise<void> {
  const row = await database.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = row?.user_version ?? 0;

  if (currentVersion >= SCHEMA_VERSION) return;

  await database.withTransactionAsync(async () => {
    if (currentVersion < 1) {
      await createSchema(database);
      await database.execAsync('PRAGMA user_version = 1');
    }
    if (currentVersion < 2) {
      await seedDataInner(database);
      await database.execAsync('PRAGMA user_version = 2');
    }
  });
}

let initPromise: Promise<DatabaseHandle> | null = null;

export function initDatabase(): Promise<DatabaseHandle> {
  if (!initPromise) {
    initPromise = (async () => {
      const database = await getDatabase();
      await database.execAsync('PRAGMA foreign_keys = ON;');
      await migrate(database);
      return database;
    })();
  }
  return initPromise;
}