import sqlWasmUrl from 'sql.js/dist/sql-wasm-browser.wasm';
import { createSqlJsDatabase } from './sqliteWeb';
import { createIndexedDbStorage } from './storage/indexedDb';
import type { DatabaseHandle } from './types';

export async function openEngine(_name: string): Promise<DatabaseHandle> {
  const storage = createIndexedDbStorage();
  const bytes = await storage.get();
  return createSqlJsDatabase(bytes, storage, () => sqlWasmUrl);
}