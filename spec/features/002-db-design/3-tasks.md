# 002 — Database design: Tasks

## Phase 1 — Engine + handle
- [ ] T1. `src/database/types.ts`: `DatabaseHandle` interface.
- [ ] T2. `engine.ts` / `engine.web.ts`: platform-resolved `openEngine`.
- [ ] T3. `database.ts`: init + `PRAGMA user_version` migration runner (transactional).

## Phase 2 — Migrations + seed
- [ ] T4. `001_initial.ts`: tables `lists`, `items`, `config` + indexes + FK cascade.
- [ ] T5. `002_seed.ts`: seed lists + items (`INSERT OR IGNORE`).

## Phase 3 — Drizzle + Zod
- [ ] T6. `drizzle/schema.ts` + `drizzle/proxy.ts` (sqlite-proxy adapter).
- [ ] T7. `schemas.ts`: Zod schemas (list, item, config) + `configDefaults.ts`.
- [ ] T8. `types.ts`: `z.infer` re-exports + `parseRows`/`parseRowOrNull` validation helpers.

## Phase 4 — Repositories
- [ ] T9. `listRepo.ts`: list CRUD + `withCounts()` + `existsByName(name, excludeId?)`.
- [ ] T10. `itemRepo.ts`: item CRUD + `listByList` + `toggle` + `existsByName(listId, name, excludeId?)`.
- [ ] T11. `configRepo.ts`: `get()` (sanitizeConfig fallback) + `updateAll`.

## Phase 5 — Harness
- [ ] T12. Vitest setup + sql.js engine mock + contract suite (`tests/database/`).
- [ ] T13. `dbDrift.test.ts` + `schemas.test.ts`.

## Phase 6 — Verification
- [ ] T14. `npm run test:all` green.
- [ ] T15. `verification-loop`: boot web, verify seeded data renders + persist across reload, flip criteria `[x]`.