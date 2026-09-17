import type { DatabaseHandle } from './types';
import { openEngine } from './engine';
import { createSchema } from './migrations/001_initial';
import { addListPositions } from './migrations/003_list_position';
import { addItemPictures } from './migrations/004_item_pictures';
import { deleteItemPhotos, parseItemPhotos } from '../utils/itemPhotos';

const DATABASE_NAME = 'Listly.db';
export const SCHEMA_VERSION = 4;

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
    if (currentVersion < 3) {
      await addListPositions(database);
      await database.execAsync('PRAGMA user_version = 3');
    }
    if (currentVersion < 4) {
      await addItemPictures(database);
      await database.execAsync('PRAGMA user_version = 4');
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
  });
}

export async function resetDatabase(): Promise<void> {
  const database = await getDatabase();
  await deleteAllPhotos(database);
  await database.withTransactionAsync(async () => {
    await database.runAsync('DELETE FROM items');
    await database.runAsync('DELETE FROM lists');
    await database.runAsync('DELETE FROM config');
  });
}
