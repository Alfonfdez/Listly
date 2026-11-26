import { createSqlJsDatabase, getSqlJsStatic, SqlJsDatabase } from '../../src/database/sqliteWeb';

let current: SqlJsDatabase | null = null;

export async function initSqlJsOnce(): Promise<void> {
  await createSqlJsDatabase(null, null);
}

export function createMockDatabaseSync(): SqlJsDatabase {
  const SQL = getSqlJsStatic();
  if (!SQL) throw new Error('sql.js not initialized: call initSqlJsOnce() first');
  return new SqlJsDatabase(new SQL.Database());
}

export function openDatabaseSync(_name?: string): SqlJsDatabase {
  if (!current) {
    current = createMockDatabaseSync();
  }
  return current;
}

export function resetMockDatabase(): void {
  if (current) {
    current.close();
    current = null;
  }
}

export function getMockInstance(): SqlJsDatabase | null {
  return current;
}
