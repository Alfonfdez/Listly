import type { DatabaseHandle } from './types';
import { openEngine } from './engine';
import { migrateDatabase, SCHEMA_VERSION } from './migrations';
import { runExclusive } from './transaction';
import { deleteItemPhotos, parseItemPhotos } from '../utils/itemPhotos';
import { DATABASE_NAME } from './constants';

export { SCHEMA_VERSION };

let dbPromise: Promise<DatabaseHandle> | null = null;

export function getDatabase(): Promise<DatabaseHandle> {
  if (!dbPromise) {
    dbPromise = openEngine(DATABASE_NAME).catch(error => {
      // A failed open must not poison every later retry.
      dbPromise = null;
      throw error;
    });
  }
  return dbPromise;
}

let initPromise: Promise<DatabaseHandle> | null = null;

export function initDatabase(): Promise<DatabaseHandle> {
  if (!initPromise) {
    initPromise = (async () => {
      const database = await getDatabase();
      await database.execAsync('PRAGMA foreign_keys = ON;');
      await migrateDatabase(database);
      return database;
    })().catch(error => {
      // The App retry path must be able to try the whole initialization again.
      initPromise = null;
      throw error;
    });
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
  await runExclusive(database, async () => {
    await database.runAsync('DELETE FROM items');
    await database.runAsync('DELETE FROM lists');
    await database.runAsync('DELETE FROM collections');
    await database.runAsync('DELETE FROM vaults');
  });
}

export async function resetDatabase(): Promise<void> {
  const database = await getDatabase();
  await deleteAllPhotos(database);
  await runExclusive(database, async () => {
    await database.runAsync('DELETE FROM items');
    await database.runAsync('DELETE FROM lists');
    await database.runAsync('DELETE FROM collections');
    await database.runAsync('DELETE FROM config');
    await database.runAsync('DELETE FROM vaults');
  });
}
