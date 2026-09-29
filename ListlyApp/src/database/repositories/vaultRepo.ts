import { asc, eq } from 'drizzle-orm';
import { getDrizzle, withTransaction } from '../drizzle/engine';
import { items, vaults } from '../drizzle/schema';
import type { Vault } from '../types';
import { itemSchema, vaultSchema } from '../schemas';
import { parseRowOrNull, parseRows } from '../validate';
import { dbTimestamp } from '../../utils/formatters';
import { vaultCrypto, KDF_ITERATIONS, KDF_DIGEST, KDF_VERSION, VaultCryptoError, VAULT_ERROR, type SealedVault } from '../../utils/vaultCrypto';

const VAULT_NOT_FOUND = 'vault not found';
const VAULT_PAYLOAD_INVALID = 'vault payload is not a list';

export interface VaultItemRecord {
  id: number;
  list_id: number;
  name: string;
  checked: 0 | 1;
  note: string | null;
  position: number;
  created_at: string;
  updated_at: string;
  pictures: string | null;
  amount_minor: number | null;
  quantity: number;
}

export type UnlockedItems = VaultItemRecord[];

function serializeItems(unlocked: UnlockedItems): string {
  return JSON.stringify(unlocked);
}

function deserializeItems(json: string): UnlockedItems {
  const parsed: unknown = JSON.parse(json);
  if (!Array.isArray(parsed)) throw new Error(VAULT_PAYLOAD_INVALID);
  return parsed as UnlockedItems;
}

function sealedOf(row: Vault): SealedVault {
  return {
    salt: row.salt,
    iterations: row.kdf_iterations,
    digest: row.kdf_digest,
    verifier: row.verifier,
    payload: row.payload,
  };
}

async function readVault(listId: number): Promise<Vault | null> {
  const db = await getDrizzle();
  return parseRowOrNull(vaultSchema, 'vaults', await db.select().from(vaults).where(eq(vaults.list_id, listId)).get());
}

export const vaultRepo = {
  async listIds(): Promise<number[]> {
    const db = await getDrizzle();
    const rows = await db.select({ list_id: vaults.list_id }).from(vaults).all();
    return rows.map(row => row.list_id);
  },

  async exists(listId: number): Promise<boolean> {
    return (await readVault(listId)) !== null;
  },

  async meta(listId: number): Promise<Vault | null> {
    return await readVault(listId);
  },

  async readPlainItems(listId: number): Promise<UnlockedItems> {
    const db = await getDrizzle();
    const rows = await db.select().from(items).where(eq(items.list_id, listId)).orderBy(asc(items.position)).all();
    return parseRows(itemSchema, 'items', rows);
  },

  async lock(listId: number, passphrase: string, unlocked: UnlockedItems): Promise<void> {
    const sealed = await vaultCrypto.seal(passphrase, serializeItems(unlocked), KDF_ITERATIONS, KDF_DIGEST);
    const updatedAt = dbTimestamp();
    await withTransaction(async tx => {
      await tx.delete(vaults).where(eq(vaults.list_id, listId)).run();
      await tx
        .insert(vaults)
        .values({
          list_id: listId,
          salt: sealed.salt,
          kdf_iterations: sealed.iterations,
          kdf_digest: sealed.digest,
          kdf_version: KDF_VERSION,
          verifier: sealed.verifier,
          payload: sealed.payload,
          updated_at: updatedAt,
        })
        .run();
      await tx.delete(items).where(eq(items.list_id, listId)).run();
    });
  },

  async unlock(listId: number, passphrase: string): Promise<UnlockedItems> {
    const row = await readVault(listId);
    if (!row) throw new Error(VAULT_NOT_FOUND);
    return deserializeItems(await vaultCrypto.unseal(sealedOf(row), passphrase));
  },

  async saveUnlocked(listId: number, passphrase: string, unlocked: UnlockedItems): Promise<void> {
    const db = await getDrizzle();
    const row = await readVault(listId);
    if (!row) throw new Error(VAULT_NOT_FOUND);
    const sealed = await vaultCrypto.seal(
      passphrase,
      serializeItems(unlocked),
      row.kdf_iterations,
      row.kdf_digest
    );
    await db
      .update(vaults)
      .set({ salt: sealed.salt, verifier: sealed.verifier, payload: sealed.payload, updated_at: dbTimestamp() })
      .where(eq(vaults.list_id, listId))
      .run();
  },

  async changePassphrase(listId: number, currentPassphrase: string, newPassphrase: string): Promise<void> {
    const db = await getDrizzle();
    const row = await readVault(listId);
    if (!row) throw new Error(VAULT_NOT_FOUND);
    const sealed = sealedOf(row);
    if (!(await vaultCrypto.verify(sealed, currentPassphrase))) {
      throw new VaultCryptoError(VAULT_ERROR.wrongPassphrase);
    }
    const json = await vaultCrypto.unseal(sealed, currentPassphrase);
    const resealed = await vaultCrypto.seal(newPassphrase, json, row.kdf_iterations, row.kdf_digest);
    await db
      .update(vaults)
      .set({
        salt: resealed.salt,
        verifier: resealed.verifier,
        payload: resealed.payload,
        updated_at: dbTimestamp(),
      })
      .where(eq(vaults.list_id, listId))
      .run();
  },

  async removeLock(listId: number, passphrase: string): Promise<void> {    const row = await readVault(listId);
    if (!row) throw new Error(VAULT_NOT_FOUND);
    const unlocked = deserializeItems(await vaultCrypto.unseal(sealedOf(row), passphrase));
    await withTransaction(async tx => {
      for (const item of unlocked) {
        await tx
          .insert(items)
          .values({
            id: item.id,
            list_id: listId,
            name: item.name,
            checked: item.checked,
            note: item.note,
            position: item.position,
            created_at: item.created_at,
            updated_at: item.updated_at,
            pictures: item.pictures,
            amount_minor: item.amount_minor,
            quantity: item.quantity,
          })
          .run();
      }
      await tx.delete(vaults).where(eq(vaults.list_id, listId)).run();
    });
  },
};
