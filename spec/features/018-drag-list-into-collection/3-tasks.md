# 018 — Drag a list into a collection: Tasks

- [x] Create `spec/features/018-drag-list-into-collection/` (1-spec, 2-plan, 3-tasks).
- [x] Add `listRepo.moveToCollection(listId, collectionId)` (transactional, append-at-end) with repo tests (standalone → collection, empty collection, between collections).
- [x] Wrap the collections grid in `Sortable.BaseZone` under a `Sortable.MultiZoneProvider` in `ListsView`; add drag tracking (`draggingListRef`, `hoverCollectionId`, `zoneDropHandledRef`) and the enter/leave/drop handlers.
- [x] Guard zones: lists-grid `onDragStart` sets the dragging list; collections-grid `onDragStart` clears it.
- [x] `CollectionCard` / `CollectionRow` `dropTarget` prop (accent border + tint) + `accessibilityHint`.
- [x] i18n `home_drop_hint` en/es.
- [x] `ListsView` drop-wiring tests (grid + list layouts: highlight on enter, clear on leave/drop, no highlight without a list drag, `moveToCollection` + `refresh` on drop, reorder skipped). `npm run test:all` green.
- [ ] Verification loop at 375px (drag a base list onto a collection card and row, highlight, last-position; collection reorder doesn't drop lists) + flip acceptance criteria `[x]`.
- [ ] Update roadmap (`## 018-drag-list-into-collection`), `6-screens.md` (Home), changelog (append at end).