import { drizzle } from 'drizzle-orm/sqlite-proxy';
import { getDatabase } from '../database';
import { createSqliteProxyCallback } from './proxy';
import * as schema from './schema';

export type DrizzleDb = ReturnType<typeof drizzle>;

let drizzleDb: DrizzleDb | null = null;
let transactionChain: Promise<unknown> = Promise.resolve();

export async function getDrizzle(): Promise<DrizzleDb> {
  if (!drizzleDb) {
    drizzleDb = drizzle(createSqliteProxyCallback(getDatabase), { schema });
  }
  return drizzleDb;
}

export async function withTransaction<T>(task: (db: DrizzleDb) => Promise<T>): Promise<T> {
  let result!: T;
  const run = transactionChain.then(async () => {
    const handle = await getDatabase();
    const db = await getDrizzle();
    await handle.withTransactionAsync(async () => {
      result = await task(db);
    });
  });
  transactionChain = run.then(
    () => undefined,
    () => undefined
  );
  await run;
  return result;
}