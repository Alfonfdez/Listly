import { getDrizzle, withTransaction, type DrizzleDb } from './drizzle/engine';

export async function read<T>(task: (db: DrizzleDb) => Promise<T>): Promise<T> {
  const db = await getDrizzle();
  return task(db);
}

export function write<T>(task: (db: DrizzleDb) => Promise<T>): Promise<T> {
  return withTransaction(task);
}

export type { DrizzleDb };
