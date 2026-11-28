import type { DatabaseHandle } from '../types';

/**
 * Per-list numeric display overrides (feature 037, PR 2).
 *
 * Both columns are nullable: `NULL` means "inherit the global setting". The
 * explicit `currency = 'none'` value disables the symbol for one list.
 */
export async function addListAmountFormat(db: DatabaseHandle): Promise<void> {
  const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(lists);');
  const names = new Set(columns.map(column => column.name));

  if (!names.has('currency')) {
    await db.execAsync('ALTER TABLE lists ADD COLUMN currency TEXT;');
  }
  if (!names.has('amount_format')) {
    await db.execAsync('ALTER TABLE lists ADD COLUMN amount_format TEXT;');
  }
}
