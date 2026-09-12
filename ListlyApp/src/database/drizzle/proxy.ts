import type { DatabaseBindValue, DatabaseHandle } from '../types';

type ProxyMethod = 'run' | 'all' | 'values' | 'get';

interface DrizzleRunResult {
  lastInsertRowId: number;
  changes: number;
}

export type SqliteProxyCallback = (
  sql: string,
  params: unknown[],
  method: ProxyMethod
) => Promise<{ rows: unknown[] }>;

function toPositionalArray(row: Record<string, unknown>): unknown[] {
  return Object.values(row);
}

export function createSqliteProxyCallback(
  getHandle: () => Promise<DatabaseHandle>
): SqliteProxyCallback {
  return async (sql, params, method) => {
    const db = await getHandle();
    const values = params as DatabaseBindValue[];

    switch (method) {
      case 'run': {
        const result = await db.runAsync(sql, ...values);
        return { rows: [{ lastInsertRowId: result.lastInsertRowId, changes: result.changes }] };
      }
      case 'get': {
        const row = await db.getFirstAsync<Record<string, unknown>>(sql, ...values);
        return { rows: row ? toPositionalArray(row) : (null as unknown as unknown[]) };
      }
      case 'values': {
        const rows = await db.getAllAsync<Record<string, unknown>>(sql, ...values);
        return { rows: rows.map(toPositionalArray) };
      }
      default: {
        const rows = await db.getAllAsync<Record<string, unknown>>(sql, ...values);
        return { rows: rows.map(toPositionalArray) };
      }
    }
  };
}

export function runResultOf(result: { rows?: unknown[] }): DrizzleRunResult {
  const row = result.rows?.[0] as Partial<DrizzleRunResult> | undefined;
  return { lastInsertRowId: row?.lastInsertRowId ?? 0, changes: row?.changes ?? 0 };
}