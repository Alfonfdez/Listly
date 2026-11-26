-- Listly 1.0.0 database fixture (schema version 9).
--
-- This file is a frozen snapshot of the shape a v1.0.0 install leaves on disk:
-- the canonical 9 DDL plus representative rows in every table. It is replayed
-- by `tests/database/upgrade.test.ts` to prove that upgrading never drops data.
--
-- Do not regenerate or edit it. A new release with a schema change adds a new
-- fixture (e.g. v1.1.0.sql) and a new test case; this one keeps representing
-- what 1.0.0 users actually have.
PRAGMA user_version = 9;

CREATE TABLE IF NOT EXISTS collections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  icon TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  position INTEGER NOT NULL DEFAULT 0,
  pinned INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS lists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  icon TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  position INTEGER NOT NULL DEFAULT 0,
  pinned INTEGER NOT NULL DEFAULT 0,
  kind TEXT NOT NULL DEFAULT 'standard',
  collection_id INTEGER,
  FOREIGN KEY (collection_id) REFERENCES collections(id)
);

CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  list_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  checked INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  pictures TEXT,
  amount_minor INTEGER,
  quantity INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS vaults (
  list_id INTEGER PRIMARY KEY,
  salt TEXT NOT NULL,
  kdf_iterations INTEGER NOT NULL,
  kdf_digest TEXT NOT NULL,
  kdf_version INTEGER NOT NULL,
  verifier TEXT NOT NULL,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS items_list_id ON items(list_id);
CREATE INDEX IF NOT EXISTS items_list_position ON items(list_id, position);
CREATE INDEX IF NOT EXISTS items_name_idx ON items(name COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS lists_name_idx ON lists(name COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS lists_collection_id ON lists(collection_id);
CREATE INDEX IF NOT EXISTS lists_position ON lists(position);
CREATE INDEX IF NOT EXISTS collections_position ON collections(position);

INSERT INTO collections (id, name, color, icon, created_at, position, pinned) VALUES
  (1, 'Home', '#22D3EE', 'home-outline', '2026-10-01 09:00:00', 0, 1),
  (2, 'Trips', '#A855F7', 'airplane-outline', '2026-10-02 10:00:00', 1, 0);

INSERT INTO lists (id, name, color, icon, created_at, position, pinned, kind, collection_id) VALUES
  (1, 'Groceries', '#34D399', 'cart-outline', '2026-10-01 09:05:00', 0, 1, 'standard', 1),
  (2, 'Budget', '#F87171', 'wallet-outline', '2026-10-02 10:05:00', 1, 0, 'numeric', 2),
  (3, 'Packing', '#FBBF24', 'briefcase-outline', '2026-10-03 11:00:00', 2, 0, 'standard', 2),
  (4, 'Someday', '#38BDF8', 'star-outline', '2026-10-04 12:00:00', 3, 1, 'standard', NULL);

INSERT INTO items (id, list_id, name, checked, note, position, created_at, updated_at, pictures, amount_minor, quantity) VALUES
  (1, 1, 'Milk', 1, 'Semi-skimmed', 0, '2026-10-01 09:06:00', '2026-10-05 18:20:00', NULL, NULL, 0),
  (2, 1, 'Eggs', 0, NULL, 1, '2026-10-01 09:07:00', '2026-10-01 09:07:00', '["file:///data/user/0/com.listly.app/files/item-photos/eggs.jpg"]', NULL, 0),
  (3, 1, 'Bread', 0, 'Whole grain', 2, '2026-10-01 09:08:00', '2026-10-01 09:08:00', NULL, NULL, 0),
  (4, 2, 'Rent', 1, NULL, 0, '2026-10-02 10:06:00', '2026-10-06 08:00:00', NULL, 120000, 1),
  (5, 2, 'Coffee beans', 0, 'Dark roast', 1, '2026-10-02 10:07:00', '2026-10-02 10:07:00', NULL, 1299, 3),
  (6, 3, 'Passport', 1, NULL, 0, '2026-10-03 11:05:00', '2026-10-03 11:05:00', NULL, NULL, 0),
  (7, 3, 'USB-C charger', 0, '65W', 1, '2026-10-03 11:06:00', '2026-10-03 11:06:00', NULL, NULL, 0),
  (8, 4, 'Learn Portuguese', 0, NULL, 0, '2026-10-04 12:01:00', '2026-10-04 12:01:00', NULL, NULL, 0);

INSERT INTO config (key, value) VALUES
  ('theme', 'dark'),
  ('language', 'es'),
  ('text_size', 'large'),
  ('home_collections_layout', 'grid'),
  ('home_lists_layout', 'list'),
  ('collections_layout', 'grid'),
  ('collection_detail_layout', 'list'),
  ('lists_layout', 'grid'),
  ('show_notes', 'true'),
  ('show_photos', 'true'),
  ('edit_show_notes', 'false'),
  ('edit_show_photos', 'true'),
  ('show_notes_numeric', 'true'),
  ('show_photos_numeric', 'false'),
  ('edit_show_notes_numeric', 'true'),
  ('edit_show_photos_numeric', 'false');

INSERT INTO vaults (list_id, salt, kdf_iterations, kdf_digest, kdf_version, verifier, payload, updated_at) VALUES
  (4, 'c2FsdC0xLjAuMA==', 210000, 'sha256', 1, 'v1:verifier:0.1.0', 'eyJ2IjoxLCJjaXBoZXJ0ZXh0IjoiMDEwMjAzMDQifQ==', '2026-10-04 12:30:00');
