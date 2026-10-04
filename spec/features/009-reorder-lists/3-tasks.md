# 009 — Reorder lists: Tasks

- [x] Create `spec/features/009-reorder-lists/` (1-spec, 2-plan, 3-tasks).
- [x] Migration 003 (`lists.position` + backfill + index), `SCHEMA_VERSION = 3`.
- [x] Drizzle, Zod, `ListWithCounts`, seed positions.
- [x] `listRepo`: order by position, create appends, `reorder(orderedIds)` transaction.
- [x] Install `react-native-sortables`; web spike (render + drag on grid and rows).
- [x] `ListsView` uses `Sortable.Grid` for grid + rows with `onDragEnd` persistence; `sortEnabled` off while searching.
- [x] Update `dbDrift` + `listContract` tests; adjust Home/Lists screen tests for position fixtures + sortable container.
- [x] `npm run test:all` green.
- [x] Verification loop at 375px (drag Home grid + Lists rows, persistence across reload, append-at-end) + flip acceptance criteria `[x]`.
- [x] Update roadmap (009 → done), harnesses baseline, changelog (append at end).