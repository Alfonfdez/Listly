import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { DatabaseHandle } from '../../src/database/types';
import {
  MIGRATIONS,
  RELEASED_BASELINE,
  SCHEMA_VERSION,
  migrateDatabase,
  pendingSteps,
  readSchemaVersion,
  type MigrationStep,
} from '../../src/database/migrations';
import { createSchema } from '../../src/database/migrations/001_initial';
import { addListAmountFormat } from '../../src/database/migrations/010_list_amount_format';
import { createMockDatabaseSync, initSqlJsOnce } from './sqliteMock';

vi.mock('../../src/database/engine', () => ({ openEngine: vi.fn() }));

async function setVersion(db: DatabaseHandle, version: number): Promise<void> {
  await db.execAsync(`PRAGMA user_version = ${version}`);
}

async function seedList(db: DatabaseHandle): Promise<void> {
  await db.runAsync(
    'INSERT INTO lists (name, color, icon, position) VALUES (?, ?, ?, ?)',
    'Keep me',
    '#22D3EE',
    'cart-outline',
    0,
  );
}

async function listNames(db: DatabaseHandle): Promise<string[]> {
  const rows = await db.getAllAsync<{ name: string }>('SELECT name FROM lists ORDER BY id');
  return rows.map(row => row.name);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('migration chain', () => {
  beforeAll(async () => {
    await initSqlJsOnce();
  });

  it('ends at SCHEMA_VERSION', () => {
    expect(MIGRATIONS.length).toBeGreaterThan(0);
    expect(MIGRATIONS[MIGRATIONS.length - 1]!.version).toBe(SCHEMA_VERSION);
  });

  it('starts at the released baseline and has one step per version', () => {
    const versions = MIGRATIONS.map(step => step.version);
    expect(versions[0]).toBe(RELEASED_BASELINE);

    const expected = Array.from(
      { length: SCHEMA_VERSION - RELEASED_BASELINE + 1 },
      (_, index) => RELEASED_BASELINE + index,
    );
    expect(versions).toEqual(expected);
  });

  it('keeps the v1.0.0 baseline at 9', () => {
    expect(RELEASED_BASELINE).toBe(9);
    expect(SCHEMA_VERSION).toBeGreaterThanOrEqual(RELEASED_BASELINE);
  });

  it('lists only the steps above the stored version', () => {
    expect(pendingSteps(8).map(step => step.version)).toEqual(MIGRATIONS.map(step => step.version));
    expect(pendingSteps(9).map(step => step.version)).toEqual(
      MIGRATIONS.filter(step => step.version > 9).map(step => step.version),
    );
    expect(pendingSteps(SCHEMA_VERSION)).toEqual([]);
  });
});

describe('migrateDatabase', () => {
  beforeAll(async () => {
    await initSqlJsOnce();
  });

  it('creates the schema and stamps SCHEMA_VERSION on a fresh database', async () => {
    const db = createMockDatabaseSync();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const version = await migrateDatabase(db);

    expect(version).toBe(SCHEMA_VERSION);
    expect(await readSchemaVersion(db)).toBe(SCHEMA_VERSION);
    expect(await listNames(db)).toEqual([]);
    expect(warn).not.toHaveBeenCalled();
  });

  it('migrates a database at the released baseline, keeping the data', async () => {
    const db = createMockDatabaseSync();
    await createSchema(db);
    await seedList(db);
    await setVersion(db, RELEASED_BASELINE);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const version = await migrateDatabase(db);

    expect(version).toBe(SCHEMA_VERSION);
    expect(await readSchemaVersion(db)).toBe(SCHEMA_VERSION);
    expect(await listNames(db)).toEqual(['Keep me']);
    expect(warn).not.toHaveBeenCalled();
    const columns = (await db.getAllAsync<{ name: string }>('PRAGMA table_info(lists);')).map(c => c.name);
    expect(columns).toContain('currency');
    expect(columns).toContain('amount_format');
  });

  it('rebuilds a pre-release database and warns, because no step exists for it', async () => {
    const db = createMockDatabaseSync();
    await createSchema(db);
    await seedList(db);
    await setVersion(db, 5);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const version = await migrateDatabase(db);

    expect(version).toBe(SCHEMA_VERSION);
    expect(await readSchemaVersion(db)).toBe(SCHEMA_VERSION);
    expect(await listNames(db)).toEqual([]);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('runs only the missing steps on a future bump, keeping the data', async () => {
    const db = createMockDatabaseSync();
    await createSchema(db);
    await seedList(db);
    await setVersion(db, RELEASED_BASELINE);
    const baselineRun = vi.fn(createSchema);
    const addArchived: MigrationStep = {
      version: SCHEMA_VERSION + 1,
      run: async handle => {
        await handle.execAsync('ALTER TABLE lists ADD COLUMN archived INTEGER NOT NULL DEFAULT 0;');
      },
    };
    const steps: MigrationStep[] = [
      { version: RELEASED_BASELINE, run: baselineRun },
      addArchived,
    ];

    const version = await migrateDatabase(db, steps);

    expect(version).toBe(SCHEMA_VERSION + 1);
    expect(await readSchemaVersion(db)).toBe(SCHEMA_VERSION + 1);
    expect(await listNames(db)).toEqual(['Keep me']);
    expect(baselineRun).not.toHaveBeenCalled();
    const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(lists);');
    expect(columns.map(column => column.name)).toContain('archived');
  });

  it('adds the per-list format columns idempotently', async () => {
    const db = createMockDatabaseSync();
    await createSchema(db);

    await addListAmountFormat(db);
    await addListAmountFormat(db);

    const columns = (await db.getAllAsync<{ name: string }>('PRAGMA table_info(lists);')).map(c => c.name);
    expect(columns.filter(name => name === 'currency')).toHaveLength(1);
    expect(columns.filter(name => name === 'amount_format')).toHaveLength(1);
  });

  it('never touches a database newer than this build', async () => {
    const db = createMockDatabaseSync();
    await createSchema(db);
    await seedList(db);
    await setVersion(db, SCHEMA_VERSION + 3);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const version = await migrateDatabase(db);

    expect(version).toBe(SCHEMA_VERSION + 3);
    expect(await readSchemaVersion(db)).toBe(SCHEMA_VERSION + 3);
    expect(await listNames(db)).toEqual(['Keep me']);
    expect(warn).not.toHaveBeenCalled();
  });
});

describe('initialization retry', () => {
  it('clears a failed open so the next call can initialize', async () => {
    vi.resetModules();
    const { openEngine } = await import('../../src/database/engine');
    const { getDatabase, initDatabase } = await import('../../src/database/database');
    const db = createMockDatabaseSync();
    const open = vi.mocked(openEngine);
    open.mockRejectedValueOnce(new Error('open failed')).mockResolvedValue(db);

    await expect(getDatabase()).rejects.toThrow('open failed');

    const initialized = await initDatabase();
    expect(initialized).toBe(db);
    expect(await readSchemaVersion(db)).toBe(SCHEMA_VERSION);
  });
});
