# 002 — Database design

- **Objective**
  Define the local database schema for Listly — tables, indexes, migrations, Drizzle mapping, and Zod validation — running identically on native (expo-sqlite) and web (sql.js + IndexedDB).

---

## Functional requirements

### 1. Tables

**`lists`**
- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `name` TEXT NOT NULL
- `color` TEXT NOT NULL
- `icon` TEXT NOT NULL
- `created_at` TEXT NOT NULL (format `YYYY-MM-DD HH:MM:SS`, local time)

**`items`**
- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `list_id` INTEGER NOT NULL → FK `lists(id)` ON DELETE CASCADE
- `name` TEXT NOT NULL
- `checked` INTEGER NOT NULL DEFAULT 0 (0/1)
- `note` TEXT DEFAULT NULL
- `position` INTEGER NOT NULL DEFAULT 0 (manual ordering within the list)
- `created_at` TEXT NOT NULL

**`config`**
- `key` TEXT PRIMARY KEY
- `value` TEXT NOT NULL
- Rows: `theme` (dark/light/system), `language` (en/es), `text_size` (small/medium/large).

### 2. Indexes
- `items_list_id` on `items(list_id)`.
- `items_list_position` on `items(list_id, position)`.
- `items_name_idx` on `items(name COLLATE NOCASE)` for search.
- `lists_name_idx` on `lists(name COLLATE NOCASE)` for the unique check.

### 3. Uniqueness
- List names unique globally, case-insensitive (`COLLATE NOCASE`).
- Item names unique within their list, case-insensitive.

### 4. Migrations
- Migrations run from `PRAGMA user_version` in `src/database/database.ts`, each step applied once inside a transaction.
- `001_initial`: creates the three tables + indexes.
- `002_seed`: seed lists + items (development seed, idempotent with `INSERT OR IGNORE`).

### 5. Drizzle + Zod
- Drizzle schema in `src/database/drizzle/schema.ts` mirrors the tables (query builder only; no `drizzle-kit`).
- Zod schemas in `src/database/schemas.ts` are the single source of truth for row shapes; `types.ts` re-exports `z.infer` types (`List`, `Item`, `Config`).
- Read-path validation on both backends; config falls back to `DEFAULT_CONFIG`.

### 6. Repositories
- `listRepo`: `list()`, `get(id)`, `create()`, `update()`, `delete()` (cascades items), `existsByName(name, excludeId?)`, `withCounts()`.
- `itemRepo`: `listByList(listId)`, `create()`, `update()`, `delete()`, `toggle(id)`, `existsByName(listId, name, excludeId?)`.
- `configRepo`: `get()`, `update(key, value)` (or `updateAll`).

---

## Non-functional requirements

- **One engine on both platforms**: `DatabaseHandle` in `src/database/types.ts`; `engine.ts` (native) / `engine.web.ts` (sql.js + IndexedDB) select the engine.
- **Drift guard**: a `dbDrift` test asserts the Zod schema keys exactly match the migration columns and `user_version` matches the expected version.
- **Slug/naming**: migrations and repos follow the conventions in `AGENTS.md`.

---

## Acceptance criteria

- [x] Schema creates `lists`, `items`, and `config` with the columns and FKs above.
- [x] Deleting a list cascade-deletes its items.
- [x] Migrations run once via `PRAGMA user_version` and are idempotent on re-init.
- [x] The same schema and repositories pass on the sql.js engine (web parity).
- [x] Zod schemas validate rows at read time; `types.ts` exports `z.infer` types.
- [x] Drizzle queries pass the contract suite (CRUD, toggle, counts, existsByName).
- [x] Config defaults load when a config row is missing or invalid.