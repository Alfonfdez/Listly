import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { DatabaseHandle } from '../../src/database/types';
import { initSqlJsOnce, openDatabaseSync, resetMockDatabase } from './sqliteMock';

vi.mock('expo-sqlite', async () => {
  const mod = await import('./sqliteMock');
  return { openDatabaseSync: mod.openDatabaseSync };
});

await import('expo-sqlite');

const EXPECTED_COLUMNS: Record<string, string[]> = {
  lists: ['id', 'name', 'color', 'icon', 'created_at', 'position', 'pinned', 'collection_id'],
  collections: ['id', 'name', 'color', 'icon', 'created_at', 'position', 'pinned'],
  items: ['id', 'list_id', 'name', 'checked', 'note', 'position', 'created_at', 'pictures'],
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
    const { addItemPictures } = await import('../../src/database/migrations/004_item_pictures');
    await createSchema(db);
    await addListPositions(db);
    await addItemPictures(db);
    for (const [table, expected] of Object.entries(EXPECTED_COLUMNS)) {
      expect(await columnNames(db, table)).toEqual(expected);
    }
  });

  it('zod schema keys match the migration columns', async () => {
    const db = await getHandle();
    const { createSchema } = await import('../../src/database/migrations/001_initial');
    const { addListPositions } = await import('../../src/database/migrations/003_list_position');
    const { addItemPictures } = await import('../../src/database/migrations/004_item_pictures');
    await createSchema(db);
    await addListPositions(db);
    await addItemPictures(db);
    const { listSchema, itemSchema } = await import('../../src/database/schemas');

    expect(Object.keys(listSchema.shape)).toEqual(await columnNames(db, 'lists'));
    expect(Object.keys(itemSchema.shape)).toEqual(await columnNames(db, 'items'));
  });

  it('config goes through the db key map to snake_case keys', async () => {
    const { DB_KEY_MAP, toConfigRows } = await import('../../src/database/configDefaults');
    const { THEMES } = await import('../../src/constants/types');

    expect(Object.keys(DB_KEY_MAP).sort()).toEqual([
      'collection_detail_layout',
      'collections_layout',
      'edit_show_notes',
      'edit_show_photos',
      'home_collections_layout',
      'home_lists_layout',
      'language',
      'lists_layout',
      'show_notes',
      'show_photos',
      'text_size',
      'theme',
    ]);
    const rows = toConfigRows({ theme: THEMES.dark, textSize: 'large' });
    expect(rows).toContainEqual({ key: 'theme', value: THEMES.dark });
    expect(rows).toContainEqual({ key: 'text_size', value: 'large' });
  });

  it('initDatabase creates an empty database at the current version and stays idempotent', async () => {
    vi.resetModules();
    resetMockDatabase();
    const { initDatabase, SCHEMA_VERSION } = await import('../../src/database/database');
    await initDatabase();

    const handle = openDatabaseSync('Listly.db') as DatabaseHandle;
    const version = await handle.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
    expect(version?.user_version).toBe(SCHEMA_VERSION);
    const lists = await handle.getAllAsync('SELECT * FROM lists;');
    const items = await handle.getAllAsync('SELECT * FROM items;');
    expect(lists).toHaveLength(0);
    expect(items).toHaveLength(0);

    await initDatabase();
    expect(await handle.getAllAsync('SELECT * FROM lists;')).toHaveLength(0);
    expect(await handle.getAllAsync('SELECT * FROM items;')).toHaveLength(0);
  });
});