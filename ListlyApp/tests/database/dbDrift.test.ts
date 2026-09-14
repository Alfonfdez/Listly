import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { DatabaseHandle } from '../../src/database/types';
import { initSqlJsOnce, openDatabaseSync, resetMockDatabase } from './sqliteMock';

vi.mock('expo-sqlite', async () => {
  const mod = await import('./sqliteMock');
  return { openDatabaseSync: mod.openDatabaseSync };
});

await import('expo-sqlite');

const EXPECTED_COLUMNS: Record<string, string[]> = {
  lists: ['id', 'name', 'color', 'icon', 'created_at', 'position'],
  items: ['id', 'list_id', 'name', 'checked', 'note', 'position', 'created_at'],
  config: ['key', 'value'],
};

describe('db drift', () => {
  beforeAll(async () => {
    await initSqlJsOnce();
  });

  async function getHandle(): Promise<DatabaseHandle> {
    vi.resetModules();
    resetMockDatabase();
    return openDatabaseSync('Listly.db') as DatabaseHandle;
  }

  async function columnNames(db: DatabaseHandle, table: string): Promise<string[]> {
    const rows = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table});`);
    return rows.map(r => r.name);
  }

  it('real columns match the drift expectations', async () => {
    const db = await getHandle();
    await db.execAsync('PRAGMA foreign_keys = ON;');
    const { createSchema } = await import('../../src/database/migrations/001_initial');
    const { addListPositions } = await import('../../src/database/migrations/003_list_position');
    await createSchema(db);
    await addListPositions(db);
    for (const [table, expected] of Object.entries(EXPECTED_COLUMNS)) {
      expect(await columnNames(db, table)).toEqual(expected);
    }
  });

  it('zod schema keys match the migration columns', async () => {
    const db = await getHandle();
    const { createSchema } = await import('../../src/database/migrations/001_initial');
    const { addListPositions } = await import('../../src/database/migrations/003_list_position');
    await createSchema(db);
    await addListPositions(db);
    const { listSchema, itemSchema } = await import('../../src/database/schemas');

    expect(Object.keys(listSchema.shape)).toEqual(await columnNames(db, 'lists'));
    expect(Object.keys(itemSchema.shape)).toEqual(await columnNames(db, 'items'));
  });

  it('config goes through the db key map to snake_case keys', async () => {
    const { DB_KEY_MAP, toConfigRows } = await import('../../src/database/configDefaults');
    const { THEMES } = await import('../../src/constants/types');

    expect(Object.keys(DB_KEY_MAP).sort()).toEqual(['language', 'text_size', 'theme']);
    const rows = toConfigRows({ theme: THEMES.dark, textSize: 'large' });
    expect(rows).toContainEqual({ key: 'theme', value: THEMES.dark });
    expect(rows).toContainEqual({ key: 'text_size', value: 'large' });
  });

  it('initDatabase applies seed data exactly once and stays idempotent', async () => {
    vi.resetModules();
    resetMockDatabase();
    const { initDatabase } = await import('../../src/database/database');
    await initDatabase();

    const handle = openDatabaseSync('Listly.db') as DatabaseHandle;
    const version = await handle.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
    expect(version?.user_version).toBe(3);
    const lists = await handle.getAllAsync('SELECT * FROM lists;');
    const items = await handle.getAllAsync('SELECT * FROM items;');
    expect(lists).toHaveLength(6);
    expect(items).toHaveLength(19);
    expect((lists as Array<{ position: number }>).map(l => l.position)).toEqual([0, 1, 2, 3, 4, 5]);

    await initDatabase();
    const listsAgain = await handle.getAllAsync('SELECT * FROM lists;');
    const itemsAgain = await handle.getAllAsync('SELECT * FROM items;');
    expect(listsAgain).toHaveLength(6);
    expect(itemsAgain).toHaveLength(19);
  });
});