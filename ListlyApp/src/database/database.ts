import type { DatabaseHandle } from './types';
import { openEngine } from './engine';
import { createSchema } from './migrations/001_initial';
import { deleteItemPhotos, parseItemPhotos } from '../utils/itemPhotos';
import { DATABASE_NAME } from './constants';

export const SCHEMA_VERSION = 6;

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
    // Pre-1.0 development: the schema is free to change, so an out-of-date
    // database is rebuilt from the single canonical schema instead of being
    // migrated incrementally. Once v1.0.0 is released this becomes a real
    // versioned migration chain.
    if (currentVersion > 0) {
      await database.execAsync(`
        DROP TABLE IF EXISTS items;
        DROP TABLE IF EXISTS lists;
        DROP TABLE IF EXISTS collections;
        DROP TABLE IF EXISTS config;
      `);
    }
    await createSchema(database);
    await database.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
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

async function deleteAllPhotos(database: DatabaseHandle): Promise<void> {
  const rows = await database.getAllAsync<{ pictures: string | null }>('SELECT pictures FROM items');
  const uris: string[] = [];
  for (const row of rows) {
    uris.push(...parseItemPhotos(row.pictures));
  }
  await deleteItemPhotos(uris);
}

export async function clearDataKeepSettings(): Promise<void> {
  const database = await getDatabase();
  await deleteAllPhotos(database);
  await database.withTransactionAsync(async () => {
    await database.runAsync('DELETE FROM items');
    await database.runAsync('DELETE FROM lists');
    await database.runAsync('DELETE FROM collections');
  });
}

export async function resetDatabase(): Promise<void> {
  const database = await getDatabase();
  await deleteAllPhotos(database);
  await database.withTransactionAsync(async () => {
    await database.runAsync('DELETE FROM items');
    await database.runAsync('DELETE FROM lists');
    await database.runAsync('DELETE FROM collections');
    await database.runAsync('DELETE FROM config');
  });
}
