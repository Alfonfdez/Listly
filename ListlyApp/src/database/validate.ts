import type { z } from 'zod';

function parseRow<T>(schema: z.ZodType<T>, table: string, row: unknown): T | null {
  const result = schema.safeParse(row);
  if (!result.success) {
    console.warn(`Skipping invalid ${table} row: ${result.error.message}`);
    return null;
  }
  return result.data;
}

export function parseRows<T>(schema: z.ZodType<T>, table: string, rows: unknown[]): T[] {
  const parsed: T[] = [];
  for (const row of rows) {
    const value = parseRow(schema, table, row);
    if (value !== null) parsed.push(value);
  }
  return parsed;
}

export function parseRowOrNull<T>(schema: z.ZodType<T>, table: string, row: unknown): T | null {
  if (row === null || row === undefined) return null;
  return parseRow(schema, table, row);
}
