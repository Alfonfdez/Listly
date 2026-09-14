import type { DatabaseHandle } from '../types';

export async function createSchema(db: DatabaseHandle): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS lists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      icon TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      position INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      list_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      checked INTEGER NOT NULL DEFAULT 0,
      note TEXT,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS items_list_id ON items(list_id);
    CREATE INDEX IF NOT EXISTS items_list_position ON items(list_id, position);
    CREATE INDEX IF NOT EXISTS items_name_idx ON items(name COLLATE NOCASE);
    CREATE INDEX IF NOT EXISTS lists_name_idx ON lists(name COLLATE NOCASE);
  `);
}