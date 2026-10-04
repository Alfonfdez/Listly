import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DatabaseHandle } from '../../src/database/types';
import { initSqlJsOnce, openDatabaseSync, resetMockDatabase } from './sqliteMock';

vi.mock('expo-sqlite', async () => {
  const mod = await import('./sqliteMock');
  return { openDatabaseSync: mod.openDatabaseSync };
});

await import('expo-sqlite');

async function createBackend() {
  vi.resetModules();
  resetMockDatabase();
  const db = openDatabaseSync('Listly.db') as unknown as DatabaseHandle;
  await db.execAsync('PRAGMA foreign_keys = ON;');
  const { createSchema } = await import('../../src/database/migrations/001_initial');
  await createSchema(db);
  const { listRepo } = await import('../../src/database/repositories/listRepo');
  const { itemRepo } = await import('../../src/database/repositories/itemRepo');
  const { vaultRepo } = await import('../../src/database/repositories/vaultRepo');
  return { listRepo, itemRepo, vaultRepo };
}

async function seedList() {
  const backend = await createBackend();
  const list = await backend.listRepo.create({ name: 'Groceries', color: '#22D3EE', icon: 'cart-outline' });
  await backend.itemRepo.create({ list_id: list.id, name: 'Milk', checked: 1, note: 'cold', pictures: null, position: 0 });
  await backend.itemRepo.create({ list_id: list.id, name: 'Eggs', checked: 0, note: null, pictures: null, position: 1 });
  return { ...backend, listId: list.id };
}

describe('vaultRepo', () => {
  beforeAll(async () => {
    await initSqlJsOnce();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('locks a list: reads plaintext items, stores the vault, deletes the plaintext rows', async () => {
    const { vaultRepo, itemRepo, listId } = await seedList();
    const before = await itemRepo.listByList(listId);
    expect(before).toHaveLength(2);

    await vaultRepo.lock(listId, 'secret123', await vaultRepo.readPlainItems(listId));

    expect(await vaultRepo.exists(listId)).toBe(true);
    expect(await itemRepo.listByList(listId)).toHaveLength(0);
    const meta = await vaultRepo.meta(listId);
    expect(meta?.payload.length ?? 0).toBeGreaterThan(0);
    expect(meta?.kdf_digest).toBe('sha512');
    expect(meta?.kdf_version).toBe(1);
  });

  it('unlocks and returns the items in order with full fidelity', async () => {
    const { vaultRepo, listId } = await seedList();
    await vaultRepo.lock(listId, 'secret123', await vaultRepo.readPlainItems(listId));

    const unlocked = await vaultRepo.unlock(listId, 'secret123');
    expect(unlocked.map(i => i.name)).toEqual(['Milk', 'Eggs']);
    expect(unlocked[0].checked).toBe(1);
    expect(unlocked[0].note).toBe('cold');
    expect(unlocked[1].note).toBeNull();
  });

  it('rejects the wrong passphrase', async () => {
    const { vaultRepo, listId } = await seedList();
    await vaultRepo.lock(listId, 'secret123', await vaultRepo.readPlainItems(listId));
    await expect(vaultRepo.unlock(listId, 'nope')).rejects.toBeDefined();
  });

  it('re-encrypts on saveUnlocked and reflects edits on the next unlock', async () => {
    const { vaultRepo, listId } = await seedList();
    await vaultRepo.lock(listId, 'secret123', await vaultRepo.readPlainItems(listId));

    const unlocked = await vaultRepo.unlock(listId, 'secret123');
    unlocked[1].checked = 1;
    unlocked[1].name = 'Eggs (dozen)';
    await vaultRepo.saveUnlocked(listId, 'secret123', unlocked);

    const again = await vaultRepo.unlock(listId, 'secret123');
    expect(again[1].name).toBe('Eggs (dozen)');
    expect(again[1].checked).toBe(1);
  });

  it('removes the lock: restores plaintext rows and deletes the vault', async () => {
    const { vaultRepo, itemRepo, listId } = await seedList();
    await vaultRepo.lock(listId, 'secret123', await vaultRepo.readPlainItems(listId));
    expect(await itemRepo.listByList(listId)).toHaveLength(0);

    await vaultRepo.removeLock(listId, 'secret123');
    expect(await vaultRepo.exists(listId)).toBe(false);
    const restored = await itemRepo.listByList(listId);
    expect(restored.map(i => i.name)).toEqual(['Milk', 'Eggs']);
    expect(restored[0].checked).toBe(1);
    expect(restored[0].note).toBe('cold');
  });

  it('changes the passphrase: old fails, new works, items intact', async () => {
    const { vaultRepo, listId } = await seedList();
    await vaultRepo.lock(listId, 'oldpass1', await vaultRepo.readPlainItems(listId));

    await vaultRepo.changePassphrase(listId, 'oldpass1', 'newpass2');

    await expect(vaultRepo.unlock(listId, 'oldpass1')).rejects.toBeDefined();
    const unlocked = await vaultRepo.unlock(listId, 'newpass2');
    expect(unlocked.map(i => i.name)).toEqual(['Milk', 'Eggs']);
    expect(unlocked[0].note).toBe('cold');
  });

  it('rejects changePassphrase with a wrong current passphrase and leaves the vault usable', async () => {
    const { vaultRepo, listId } = await seedList();
    await vaultRepo.lock(listId, 'oldpass1', await vaultRepo.readPlainItems(listId));

    await expect(vaultRepo.changePassphrase(listId, 'nope0000', 'newpass2')).rejects.toBeDefined();
    const unlocked = await vaultRepo.unlock(listId, 'oldpass1');
    expect(unlocked.map(i => i.name)).toEqual(['Milk', 'Eggs']);
  });

  it('uses a fresh salt but keeps iterations/digest on changePassphrase', async () => {
    const { vaultRepo, listId } = await seedList();
    await vaultRepo.lock(listId, 'oldpass1', await vaultRepo.readPlainItems(listId));
    const before = await vaultRepo.meta(listId);

    await vaultRepo.changePassphrase(listId, 'oldpass1', 'newpass2');
    const after = await vaultRepo.meta(listId);

    expect(after?.salt).not.toBe(before?.salt);
    expect(after?.kdf_iterations).toBe(before?.kdf_iterations);
    expect(after?.kdf_digest).toBe(before?.kdf_digest);
  });

  it('drives the locked-list id set from the vaults table', async () => {    const { vaultRepo, listId } = await seedList();
    expect(await vaultRepo.listIds()).toEqual([]);
    await vaultRepo.lock(listId, 'secret123', await vaultRepo.readPlainItems(listId));
    expect(await vaultRepo.listIds()).toEqual([listId]);
  });

  it('cascades the vault row when the list is deleted', async () => {
    const { vaultRepo, listRepo, listId } = await seedList();
    await vaultRepo.lock(listId, 'secret123', await vaultRepo.readPlainItems(listId));
    await listRepo.delete(listId);
    expect(await vaultRepo.exists(listId)).toBe(false);
  });

  it('lists a locked item store without photos (v1)', async () => {
    const { vaultRepo, listId } = await seedList();
    const items = await vaultRepo.readPlainItems(listId);
    expect(items.every(i => i.pictures === null)).toBe(true);
  });
});
