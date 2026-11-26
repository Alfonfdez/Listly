import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import type { DatabaseHandle } from '../../src/database/types';
import { migrateDatabase, readSchemaVersion, SCHEMA_VERSION } from '../../src/database/migrations';
import { initSqlJsOnce, createMockDatabaseSync } from './sqliteMock';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.resolve(here, '..', 'fixtures', 'upgrade', 'v1.0.0.sql');
const fixtureSql = readFileSync(fixturePath, 'utf8');

type Row = Record<string, unknown>;

async function dump(db: DatabaseHandle): Promise<Record<string, Row[]>> {
  return {
    collections: await db.getAllAsync<Row>('SELECT * FROM collections ORDER BY id'),
    lists: await db.getAllAsync<Row>('SELECT * FROM lists ORDER BY id'),
    items: await db.getAllAsync<Row>('SELECT * FROM items ORDER BY id'),
    config: await db.getAllAsync<Row>('SELECT * FROM config ORDER BY key'),
    vaults: await db.getAllAsync<Row>('SELECT * FROM vaults ORDER BY list_id'),
  };
}

async function openFixture(): Promise<DatabaseHandle> {
  const db = createMockDatabaseSync();
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await db.execAsync(fixtureSql);
  return db;
}

describe('1.0.0 upgrade fixture', () => {
  beforeAll(async () => {
    await initSqlJsOnce();
  });

  it('is a schema-9 database with rows in every table', async () => {
    const db = await openFixture();
    expect(await readSchemaVersion(db)).toBe(9);

    const data = await dump(db);
    expect(data.collections).toHaveLength(2);
    expect(data.lists).toHaveLength(4);
    expect(data.items).toHaveLength(8);
    expect(data.config).toHaveLength(16);
    expect(data.vaults).toHaveLength(1);

    expect(data.lists.map(l => l.kind)).toEqual(['standard', 'numeric', 'standard', 'standard']);
    expect(data.lists.filter(l => l.pinned === 1)).toHaveLength(2);
    expect(data.lists.filter(l => l.collection_id === null)).toHaveLength(1);
    expect(data.items.some(item => item.pictures !== null)).toBe(true);
    expect(data.items.some(item => item.amount_minor !== null)).toBe(true);
    expect(data.items.some(item => item.note !== null)).toBe(true);
  });

  it('survives the upgrade without dropping or rewriting anything', async () => {
    const db = await openFixture();
    const before = await dump(db);

    await migrateDatabase(db);

    expect(await readSchemaVersion(db)).toBe(SCHEMA_VERSION);
    expect(await dump(db)).toEqual(before);
  });

  it('is idempotent when initialization runs twice', async () => {
    const db = await openFixture();

    await migrateDatabase(db);
    const afterFirst = await dump(db);
    await migrateDatabase(db);

    expect(await readSchemaVersion(db)).toBe(SCHEMA_VERSION);
    expect(await dump(db)).toEqual(afterFirst);
  });
});
