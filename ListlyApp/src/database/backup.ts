import { z } from 'zod';

import { collectionSchema, itemSchema, listSchema, vaultSchema } from './schemas';
import type { Collection, DatabaseHandle, Item, List, Vault } from './types';
import { runExclusive } from './transaction';

interface ConfigRow {
  key: string;
  value: string;
}

export const BACKUP_FORMAT_VERSION = 1;

const configRowSchema = z.object({
  key: z.string(),
  value: z.string(),
});

const backupPinnedSchema = z.union([z.literal(0), z.literal(1)]).default(0);
const backupListKindSchema = z.enum(['standard', 'numeric']).default('standard');
const backupCollectionSchema = collectionSchema.extend({ pinned: backupPinnedSchema });
const backupListSchema = listSchema
  .extend({
    collection_id: z.number().int().nullable().optional(),
    pinned: backupPinnedSchema,
    kind: backupListKindSchema,
  })
  .transform(value => ({ ...value, collection_id: value.collection_id ?? null }));

const backupItemSchema = itemSchema
  .extend({
    updated_at: z.string().optional(),
    amount_minor: z.number().int().nullable().default(null),
    quantity: z.number().int().default(0),
  })
  .transform(value => ({
    ...value,
    updated_at: value.updated_at ?? value.created_at,
  }));

const snapshotSchema = z.object({
  app: z.literal('Listly'),
  kind: z.literal('backup'),
  formatVersion: z.literal(BACKUP_FORMAT_VERSION),
  exportedAt: z.string(),
  schema: z.number().int(),
  data: z.object({
    collections: z.array(backupCollectionSchema).optional().default([]),
    lists: z.array(backupListSchema),
    items: z.array(backupItemSchema),
    vaults: z.array(vaultSchema).optional().default([]),
    config: z.array(configRowSchema),
  }),
});

export type BackupSnapshot = z.infer<typeof snapshotSchema>;

type BackupValidationCode = 'invalid_json' | 'invalid_format' | 'newer_version';

export class BackupValidationError extends Error {
  readonly code: BackupValidationCode;

  constructor(code: BackupValidationCode, message: string) {
    super(message);
    this.name = 'BackupValidationError';
    this.code = code;
  }
}

export function parseBackup(json: string): BackupSnapshot {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new BackupValidationError('invalid_json', 'Not valid JSON');
  }
  const result = snapshotSchema.safeParse(raw);
  if (!result.success) {
    throw new BackupValidationError('invalid_format', 'Snapshot does not match the backup format');
  }
  return result.data;
}

export function serializeBackup(snapshot: BackupSnapshot): string {
  return JSON.stringify(snapshot, null, 2);
}

export async function buildBackup(db: DatabaseHandle, schemaVersion: number): Promise<BackupSnapshot> {
  const [collections, lists, items, vaults, config] = await Promise.all([
    db.getAllAsync<Collection>('SELECT * FROM collections ORDER BY position, id'),
    db.getAllAsync<List>('SELECT * FROM lists ORDER BY position, id'),
    db.getAllAsync<Item>('SELECT * FROM items ORDER BY position, id'),
    db.getAllAsync<Vault>('SELECT * FROM vaults ORDER BY list_id'),
    db.getAllAsync<ConfigRow>('SELECT key, value FROM config'),
  ]);

  return {
    app: 'Listly',
    kind: 'backup',
    formatVersion: BACKUP_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    schema: schemaVersion,
    data: { collections, lists, items, vaults, config },
  };
}

export async function applyBackup(db: DatabaseHandle, snapshot: BackupSnapshot): Promise<void> {
  await runExclusive(db, async () => {
    await db.runAsync('DELETE FROM items');
    await db.runAsync('DELETE FROM lists');
    await db.runAsync('DELETE FROM collections');
    await db.runAsync('DELETE FROM vaults');
    await db.runAsync('DELETE FROM config');

    for (const collection of snapshot.data.collections ?? []) {
      await db.runAsync(
        'INSERT INTO collections (id, name, color, icon, created_at, position, pinned) VALUES (?, ?, ?, ?, ?, ?, ?)',
        collection.id,
        collection.name,
        collection.color,
        collection.icon,
        collection.created_at,
        collection.position,
        collection.pinned
      );
    }

    for (const list of snapshot.data.lists) {
      await db.runAsync(
        'INSERT INTO lists (id, name, color, icon, created_at, position, pinned, kind, collection_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        list.id,
        list.name,
        list.color,
        list.icon,
        list.created_at,
        list.position,
        list.pinned,
        list.kind,
        list.collection_id
      );
    }

    for (const item of snapshot.data.items) {
      await db.runAsync(
        'INSERT INTO items (id, list_id, name, checked, note, position, created_at, updated_at, pictures, amount_minor, quantity) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        item.id,
        item.list_id,
        item.name,
        item.checked,
        item.note,
        item.position,
        item.created_at,
        item.updated_at,
        item.pictures,
        item.amount_minor,
        item.quantity
      );
    }

    for (const row of snapshot.data.vaults ?? []) {
      await db.runAsync(
        'INSERT INTO vaults (list_id, salt, kdf_iterations, kdf_digest, kdf_version, verifier, payload, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        row.list_id,
        row.salt,
        row.kdf_iterations,
        row.kdf_digest,
        row.kdf_version,
        row.verifier,
        row.payload,
        row.updated_at
      );
    }

    for (const row of snapshot.data.config) {
      await db.runAsync('INSERT INTO config (key, value) VALUES (?, ?)', row.key, row.value);
    }
  });
}
