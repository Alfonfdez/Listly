# 012 — Reorder items: Tasks

- [x] Create `spec/features/012-reorder-items/` (1-spec, 2-plan, 3-tasks).
- [x] Add `itemRepo.reorder(listId, orderedIds)` (transaction, `position` in order, scoped to list) with contract test.
- [x] `ListDetailScreen` renders items in a `Sortable.Grid` (1 column) with `useDragOrder`; long-press drag persists via `reorder`.
- [x] Guards: `sortEnabled = !selectMode && query === '' && items.length > 1`; long-press is drag-only (select mode stays behind the header toggle).
- [x] Fix `itemRepo.listAll()` read path to `ORDER BY position, id`; extend contract test asserting reordered order.
- [x] Tests: `ItemRow`/`ListDetailScreen` reorder + disabled cases (single item, search, select mode); increased sortables mock. `npm run test:all` green.
- [x] Verification loop at 375px (long-press-drag reorder, persistence across reload, disabled cases) + flip acceptance criteria `[x]`.
- [x] Update roadmap (012 → done), harnesses baseline, changelog (append at end).
