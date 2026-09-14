# 009 — Reorder lists: Tasks

- [ ] Create `spec/features/009-reorder-lists/` (1-spec, 2-plan, 3-tasks).
- [ ] Migration 003 (`lists.position` + backfill + index), `SCHEMA_VERSION = 3`.
- [ ] Drizzle, Zod, `ListWithCounts`, seed positions.
- [ ] `listRepo`: order by position, create appends, `reorder(orderedIds)` transaction.
- [ ] Install `react-native-sortables`; web spike (render + drag on grid and rows).
- [ ] `ListsView` uses `Sortable.Grid` for grid + rows with `onDragEnd` persistence; `sortEnabled` off while searching.
- [ ] Update `dbDrift` + `listContract` tests; adjust Home/Lists screen tests for position fixtures + sortable container.
- [ ] `npm run test:all` green.
- [ ] Verification loop at 375px (drag Home grid + Lists rows, persistence across reload, append-at-end) + flip acceptance criteria `[x]`.
- [ ] Update roadmap (009 → done), harnesses baseline, changelog (append at end).