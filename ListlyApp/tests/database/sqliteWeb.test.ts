import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSqlJsDatabase, onPersistenceError, type DatabaseStorage } from '../../src/database/sqliteWeb';

describe('SqlJsDatabase persistence', () => {
  afterEach(() => {
    onPersistenceError(() => {});
  });

  it('propagates a persist failure and notifies the listener', async () => {
    const storage: DatabaseStorage = {
      get: async () => null,
      set: vi.fn(async () => {
        throw new Error('disk full');
      }),
    };
    const listener = vi.fn();
    onPersistenceError(listener);

    const db = await createSqlJsDatabase(null, storage);
    await expect(db.execAsync('CREATE TABLE t (x INTEGER);')).rejects.toThrow('disk full');
    expect(listener).toHaveBeenCalledTimes(1);
    db.close();
  });

  it('does not persist while inside a transaction and rejects nested transactions', async () => {
    const db = await createSqlJsDatabase(null, null);

    await expect(
      db.withTransactionAsync(async () => {
        await db.withTransactionAsync(async () => {});
      })
    ).rejects.toThrow(/Nested transaction/);
    db.close();
  });
});
