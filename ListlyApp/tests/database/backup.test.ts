import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BACKUP_FORMAT_VERSION,
  parseBackup,
  serializeBackup,
  type BackupSnapshot,
} from '../../src/database/backup';
import { initSqlJsOnce, resetMockDatabase } from './sqliteMock';

vi.mock('expo-sqlite', async () => {
  const mod = await import('./sqliteMock');
  return { openDatabaseSync: mod.openDatabaseSync };
});

await import('expo-sqlite');

const LIST_ROW = {
  id: 1,
  name: 'Groceries',
  color: '#22D3EE',
  icon: 'cart-outline',
  created_at: '2026-01-01 00:00:00',
  position: 0,
};

const ITEM_ROW = {
  id: 1,
  list_id: 1,
  name: 'Milk',
  checked: 0 as const,
  note: null,
  position: 0,
  created_at: '2026-01-01 00:00:00',
  pictures: null,
};

function makeSnapshot(overrides: Partial<BackupSnapshot> = {}): BackupSnapshot {
  return {
    app: 'Listly',
    kind: 'backup',
    formatVersion: BACKUP_FORMAT_VERSION,
    exportedAt: '2026-01-01T00:00:00.000Z',
    schema: 4,
    data: {
      lists: [LIST_ROW],
      items: [ITEM_ROW],
      config: [{ key: 'theme', value: 'dark' }],
    },
    ...overrides,
  };
}

describe('backup format', () => {
  it('round-trips through serialize and parse', () => {
    const snapshot = makeSnapshot();
    expect(parseBackup(serializeBackup(snapshot))).toEqual(snapshot);
  });

  it('rejects invalid JSON', () => {
    expect(() => parseBackup('not json')).toThrowError(
      expect.objectContaining({ code: 'invalid_json' })
    );
  });

  it('rejects a payload that is not a Listly backup', () => {
    expect(() => parseBackup('{}')).toThrowError(
      expect.objectContaining({ code: 'invalid_format' })
    );
    expect(() => parseBackup(JSON.stringify(makeSnapshot({ app: 'Other' } as never)))).toThrowError(
      expect.objectContaining({ code: 'invalid_format' })
    );
  });

  it('rejects a malformed data payload', () => {
    const snapshot = makeSnapshot();
    const malformed = { ...snapshot, data: { ...snapshot.data, items: [{ id: 'x' }] } };
    expect(() => parseBackup(JSON.stringify(malformed))).toThrowError(
      expect.objectContaining({ code: 'invalid_format' })
    );
  });
});

describe('backup service', () => {
  beforeAll(async () => {
    await initSqlJsOnce();
  });

  beforeEach(async () => {
    vi.resetModules();
    resetMockDatabase();
    const { initDatabase } = await import('../../src/database/database');
    await initDatabase();
  });

  it('exports every table and restores it back', async () => {
    const { listRepo } = await import('../../src/database/repositories/listRepo');
    const { itemRepo } = await import('../../src/database/repositories/itemRepo');
    const { configRepo } = await import('../../src/database/repositories/configRepo');
    const { exportBackup, importBackup } = await import('../../src/database/backupService');

    const list = await listRepo.create({ name: 'Groceries', color: '#22D3EE', icon: 'cart-outline' });
    await itemRepo.create({
      list_id: list.id,
      name: 'Milk',
      checked: 1,
      note: 'whole',
      pictures: null,
      position: 0,
    });
    await configRepo.save({ theme: 'dark', showNotes: false });

    const json = await exportBackup();
    const snapshot = JSON.parse(json) as BackupSnapshot;
    expect(snapshot.app).toBe('Listly');
    expect(snapshot.kind).toBe('backup');
    expect(snapshot.formatVersion).toBe(BACKUP_FORMAT_VERSION);
    expect(snapshot.schema).toBe(4);
    expect(snapshot.data.lists).toHaveLength(1);
    expect(snapshot.data.items).toHaveLength(1);

    await listRepo.delete(list.id);
    await configRepo.save({ theme: 'light', showNotes: true });

    await importBackup(json);

    const lists = await listRepo.list();
    expect(lists.map(l => l.name)).toEqual(['Groceries']);
    const items = await itemRepo.listByList(list.id);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ name: 'Milk', checked: 1, note: 'whole' });
    const config = await configRepo.get();
    expect(config.theme).toBe('dark');
    expect(config.showNotes).toBe(false);
  });

  it('rejects a backup from a newer schema version', async () => {
    const { exportBackup, importBackup } = await import('../../src/database/backupService');
    const snapshot = JSON.parse(await exportBackup()) as BackupSnapshot;
    snapshot.schema = 999;
    await expect(importBackup(JSON.stringify(snapshot))).rejects.toMatchObject({
      code: 'newer_version',
    });
  });

  it('rejects an invalid backup without touching the database', async () => {
    const { listRepo } = await import('../../src/database/repositories/listRepo');
    const { importBackup } = await import('../../src/database/backupService');
    await listRepo.create({ name: 'Keep Me', color: '#22D3EE', icon: 'cart-outline' });

    await expect(importBackup('{ broken')).rejects.toMatchObject({ code: 'invalid_json' });
    expect((await listRepo.list()).map(l => l.name)).toEqual(['Keep Me']);
  });
});

describe('database reset helpers', () => {
  beforeAll(async () => {
    await initSqlJsOnce();
  });

  beforeEach(async () => {
    vi.resetModules();
    resetMockDatabase();
    const { initDatabase } = await import('../../src/database/database');
    await initDatabase();
  });

  it('clearDataKeepSettings deletes lists and items but keeps settings', async () => {
    const { listRepo } = await import('../../src/database/repositories/listRepo');
    const { itemRepo } = await import('../../src/database/repositories/itemRepo');
    const { configRepo } = await import('../../src/database/repositories/configRepo');
    const { clearDataKeepSettings } = await import('../../src/database/database');

    const list = await listRepo.create({ name: 'Groceries', color: '#22D3EE', icon: 'cart-outline' });
    await itemRepo.create({
      list_id: list.id,
      name: 'Milk',
      checked: 0,
      note: null,
      pictures: null,
      position: 0,
    });
    await configRepo.save({ theme: 'dark' });

    await clearDataKeepSettings();

    expect(await listRepo.list()).toEqual([]);
    expect(await itemRepo.listAll()).toEqual([]);
    expect((await configRepo.get()).theme).toBe('dark');
  });

  it('resetDatabase clears data and restores the default config', async () => {
    const { listRepo } = await import('../../src/database/repositories/listRepo');
    const { configRepo } = await import('../../src/database/repositories/configRepo');
    const { DEFAULT_CONFIG } = await import('../../src/database/configDefaults');
    const { resetDatabase } = await import('../../src/database/database');

    await listRepo.create({ name: 'Groceries', color: '#22D3EE', icon: 'cart-outline' });
    await configRepo.save({ theme: 'dark', listsLayout: 'grid', showNotes: false });

    await resetDatabase();

    expect(await listRepo.list()).toEqual([]);
    expect(await configRepo.get()).toEqual(DEFAULT_CONFIG);
  });
});
