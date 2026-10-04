import { drizzle } from 'drizzle-orm/sqlite-proxy';
import { getDatabase } from '../database';
import { runExclusive } from '../transaction';
import { createSqliteProxyCallback } from './proxy';
import * as schema from './schema';

export type DrizzleDb = ReturnType<typeof drizzle>;

let drizzleDb: DrizzleDb | null = null;

export async function getDrizzle(): Promise<DrizzleDb> {
  if (!drizzleDb) {
    drizzleDb = drizzle(createSqliteProxyCallback(getDatabase), { schema });
  }
  return drizzleDb;
}

export async function withTransaction<T>(task: (db: DrizzleDb) => Promise<T>): Promise<T> {
  const handle = await getDatabase();
  const db = await getDrizzle();
  return runExclusive(handle, async () => task(db));
}
