import type { z } from 'zod';

function parseRow<T>(schema: z.ZodType<T>, table: string, row: unknown): T {
  const result = schema.safeParse(row);
  if (!result.success) {
    throw new Error(`Data validation failed for ${table}: ${result.error.message}`);
  }
  return result.data;
}

export function parseRows<T>(schema: z.ZodType<T>, table: string, rows: unknown[]): T[] {
  return rows.map(row => parseRow(schema, table, row));
}

export function parseRowOrNull<T>(schema: z.ZodType<T>, table: string, row: unknown): T | null {
  if (row === null || row === undefined) return null;
  return parseRow(schema, table, row);
}