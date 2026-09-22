import { z } from 'zod';

import { collectionSchema, itemSchema, listSchema } from './schemas';
import type { Collection, DatabaseHandle, Item, List } from './types';

interface ConfigRow {
  key: string;
  value: string;
}

export const BACKUP_FORMAT_VERSION = 1;

const configRowSchema = z.object({
  key: z.string(),
  value: z.string(),
});

const backupCollectionSchema = collectionSchema;
const backupListSchema = listSchema
  .extend({ collection_id: z.number().int().nullable().optional() })
  .transform(value => ({ ...value, collection_id: value.collection_id ?? null }));

const snapshotSchema = z.object({
  app: z.literal('Listly'),
  kind: z.literal('backup'),
  formatVersion: z.literal(BACKUP_FORMAT_VERSION),
  exportedAt: z.string(),
  schema: z.number().int(),
  data: z.object({
    collections: z.array(backupCollectionSchema).optional().default([]),
    lists: z.array(backupListSchema),
    items: z.array(itemSchema),
    config: z.array(configRowSchema),
  }),
});

export type BackupSnapshot = z.infer<typeof snapshotSchema>;

export type BackupValidationCode = 'invalid_json' | 'invalid_format' | 'newer_version';

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
  const [collections, lists, items, config] = await Promise.all([
    db.getAllAsync<Collection>('SELECT * FROM collections ORDER BY position, id'),
    db.getAllAsync<List>('SELECT * FROM lists ORDER BY position, id'),
    db.getAllAsync<Item>('SELECT * FROM items ORDER BY position, id'),
    db.getAllAsync<ConfigRow>('SELECT key, value FROM config'),
  ]);

  return {
    app: 'Listly',
    kind: 'backup',
    formatVersion: BACKUP_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    schema: schemaVersion,
    data: { collections, lists, items, config },
  };
}

export async function applyBackup(db: DatabaseHandle, snapshot: BackupSnapshot): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM items');
    await db.runAsync('DELETE FROM lists');
    await db.runAsync('DELETE FROM collections');
    await db.runAsync('DELETE FROM config');

    for (const collection of snapshot.data.collections ?? []) {
      await db.runAsync(
        'INSERT INTO collections (id, name, color, icon, created_at, position) VALUES (?, ?, ?, ?, ?, ?)',
        collection.id,
        collection.name,
        collection.color,
        collection.icon,
        collection.created_at,
        collection.position
      );
    }

    for (const list of snapshot.data.lists) {
      await db.runAsync(
        'INSERT INTO lists (id, name, color, icon, created_at, position, collection_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        list.id,
        list.name,
        list.color,
        list.icon,
        list.created_at,
        list.position,
        list.collection_id
      );
    }

    for (const item of snapshot.data.items) {
      await db.runAsync(
        'INSERT INTO items (id, list_id, name, checked, note, position, created_at, pictures) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        item.id,
        item.list_id,
        item.name,
        item.checked,
        item.note,
        item.position,
        item.created_at,
        item.pictures
      );
    }

    for (const row of snapshot.data.config) {
      await db.runAsync('INSERT INTO config (key, value) VALUES (?, ?)', row.key, row.value);
    }
  });
}
