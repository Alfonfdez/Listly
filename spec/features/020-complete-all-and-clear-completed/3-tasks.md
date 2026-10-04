# 020 — Complete all / Clear completed: Tasks

- [x] Create `spec/features/020-complete-all-and-clear-completed/` (1-spec, 2-plan, 3-tasks).
- [x] `itemRepo.setAllChecked(listId, checked)` (single scoped `UPDATE`) and `itemRepo.deleteCompleted(listId)` (transactional delete of checked rows + photo cleanup via `deletePhotosOfItems`) with `ERROR_SCOPE.completeAllItems` / `ERROR_SCOPE.clearCompletedItems`.
- [x] `ListDetailScreen` batch toolbar under the header (visible when `items.length > 0 && !selectMode && !searchActive`): Complete all (disabled when `done === total`) + Clear completed (disabled when `done === 0`, opens a destructive `ConfirmModal` with the count).
- [x] i18n `item_complete_all`, `item_clear_completed`, `item_clear_completed_confirm(count)`, `item_clear_completed_message` en/es.
- [x] `itemRepo` tests (checks/unchecks only the target list; delete removes only checked items of the target list; no-op when nothing is checked) + `ListDetailScreen` tests (toolbar visible with items, hidden on empty/search, complete-all action + inert when all done, clear-completed confirm flow + inert when nothing is checked).
- [x] Docs: roadmap `## 020-complete-all-and-clear-completed` (done), 6-screens.md List detail bullet, changelog entry. `npm run test:all` green (45 files, 344 tests).
- [x] Verification loop at 375px (add items, check a subset, Complete all → 100%; Clear completed → count dialog → only completed disappear; disabled states; toolbar hidden while searching/select/empty; Spanish labels + Spanish confirm dialog) + acceptance criteria flipped `[x]`.