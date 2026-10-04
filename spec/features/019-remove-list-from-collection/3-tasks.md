# 019 — Remove a list from a collection: Tasks

- [x] Create `spec/features/019-remove-list-from-collection/` (1-spec, 2-plan, 3-tasks).
- [x] Add `listRepo.removeFromCollection(listId)` (transactional: `collection_id = NULL` + append at the end of the standalone lists) with repo tests (append-at-end, lone member, existing standalone lists).
- [x] New `RemoveFromCollectionTarget` (Sortable.BaseZone pill above the FAB): always mounted, hidden until a member drag (`opacity: 0`, `pointerEvents: none`, no `accessibilityHint`), highlight on `onItemEnter`, same `MeasureMode`/bounds reaction as feature 018.
- [x] Add the remove-target state/handlers to `useCollectionDropZones` (`removeTargetActive`, `removeHover`, `handleRemoveZoneEnter/Leave/Drop`) and reuse `performZoneDrop`.
- [x] Wire `ListsView` (collection mode): render the target, `handleListsDragStart` reveals it and `handleListsDragEnd` hides it; enable dragging with ≥ 1 member (`sortEnabled` `> (inHome || inCollectionDetail ? 0 : 1)`); drop calls `removeFromCollection` + `refresh()` and skips the grid reorder.
- [x] i18n `collection_remove_label` / `collection_remove_hint` en/es; `ICONS.removeFromCollection`.
- [x] `ListsView` tests (lone member draggable in collection mode, target revealed only during a member drag, drop calls `removeFromCollection` + skips reorder, target absent outside collection mode, reorder intact when released elsewhere) + `listRepo` tests. `npm run test:all` green.
- [x] Docs: roadmap `## 019-remove-list-from-collection` (done), `6-screens.md` Collection detail bullet, changelog entry.
- [x] Verification loop at 375px (drag a member onto the bottom target → highlight, remove from collection, standalone appended last on Home; single-member collection can be emptied; reorder intact elsewhere; target only on Collection detail) + flip acceptance criteria `[x]`. Retrofitted 2-plan, 3-tasks and refreshed the suite baseline in `docs/harnesses.md`.