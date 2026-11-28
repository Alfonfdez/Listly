import { beforeAll, describe, vi } from 'vitest';
import type { DatabaseHandle } from '../../src/database/types';
import { initSqlJsOnce, openDatabaseSync, resetMockDatabase } from './sqliteMock';
import type { ContractBackend } from './contractTypes';
import { runContractSuite } from './contractSuite';

vi.mock('expo-sqlite', async () => {
  const mod = await import('./sqliteMock');
  return { openDatabaseSync: mod.openDatabaseSync };
});

await import('expo-sqlite');

describe('sqlite contract', () => {
  beforeAll(async () => {
    await initSqlJsOnce();
  });

  runContractSuite('sqlite', async (): Promise<ContractBackend> => {
    vi.resetModules();
    resetMockDatabase();

    const db = openDatabaseSync('Listly.db') as DatabaseHandle;
    await db.execAsync('PRAGMA foreign_keys = ON;');

    const { createSchema } = await import('../../src/database/migrations/001_initial');
    await createSchema(db);
    const { addListAmountFormat } = await import('../../src/database/migrations/010_list_amount_format');
    await addListAmountFormat(db);

    const { listRepo } = await import('../../src/database/repositories/listRepo');
    const { itemRepo } = await import('../../src/database/repositories/itemRepo');
    const { configRepo } = await import('../../src/database/repositories/configRepo');

    return {
      list: listRepo,
      item: itemRepo,
      config: configRepo,
    };
  });
});
