# 002 — Database design: Plan

## Layer layout (all in `src/database/`)

```
database/
├── types.ts          DatabaseHandle interface + z.infer re-exports (List, Item, Config)
├── schemas.ts        Zod 4 schemas — single source of truth for row shapes
├── database.ts       init: openEngine → PRAGMA user_version migrations (transactional)
├── engine.ts         native: openDatabaseSync(name)
├── engine.web.ts     web: sql.js WASM + IndexedDB persistence
├── seedData.ts       002 seed (development lists + items)
├── configDefaults.ts DEFAULT_CONFIG (theme, language, text_size)
├── drizzle/
│   ├── schema.ts     Drizzle table definitions (lists, items, config)
│   └── proxy.ts      sqlite-proxy adapter over DatabaseHandle
├── migrations/
│   ├── 001_initial.ts  CREATE TABLE lists/items/config + indexes
│   └── 002_seed.ts     INSERT OR IGNORE seed rows
└── repositories/
    ├── listRepo.ts     list CRUD + withCounts + existsByName
    ├── itemRepo.ts     item CRUD + listByList + toggle + existsByName
    └── configRepo.ts   get / updateAll
```

## Drizzle details

- Query builder only via `drizzle-orm/sqlite-proxy` over the shared `DatabaseHandle`.
- Writes use `.run()` (never `.returning()`), keeping web's persist-on-commit batching intact.
- Collations stay as parameterized `sql` fragments (`COLLATE NOCASE`, `GROUP BY`).

## Zod details

- `listSchema`, `itemSchema`, `configSchema`; enums built from constant sets (themes, languages, text sizes).
- Parse full-row reads (`parseRows`/`parseRowOrNull`) throwing descriptive errors on invalid rows; aggregate queries unvalidated.
- Both config backends run stored config through `configSchema` via `sanitizeConfig`, falling back to `DEFAULT_CONFIG`.

## Test strategy

- `tests/database/contractSuite.ts` + `.test.ts` — CRUD, toggle, `existsByName` + excludeId, counts, cascade delete, config defaults — against the shared sql.js engine (native parity via an expo-sqlite mock).
- `tests/database/dbDrift.test.ts` — `PRAGMA table_info` matches Zod schema keys; seed counts; `user_version`; init idempotence.
- `tests/database/schemas.test.ts` — accept/reject matrix + config fallback.