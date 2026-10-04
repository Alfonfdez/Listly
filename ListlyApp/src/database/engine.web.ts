import sqlWasmUrl from 'sql.js/dist/sql-wasm-browser.wasm';
import { createSqlJsDatabase, onPersistenceError } from './sqliteWeb';
import { createIndexedDbStorage } from './storage/indexedDb';
import type { DatabaseHandle } from './types';
import { logError, ERROR_SCOPE } from '../utils/errors';

onPersistenceError((error) => logError(ERROR_SCOPE.saveDatabase, error));

export async function openEngine(_name: string): Promise<DatabaseHandle> {
  const storage = createIndexedDbStorage();
  const bytes = await storage.get();
  return createSqlJsDatabase(bytes, storage, () => sqlWasmUrl);
}