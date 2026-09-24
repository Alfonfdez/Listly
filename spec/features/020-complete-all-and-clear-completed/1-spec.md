# 020 - Complete all items / Clear completed items

- **Objective**
  In List detail, let the user check every item at once and delete the completed ones in one tap, via a small batch toolbar under the list header (shown only when the list has items and no search/select mode is active).

---

## Functional requirements

### 1. Batch toolbar (List detail only)
- When the list has at least one item and neither select mode nor search is active, a row with three bounded chip buttons appears between the header and the items grid: **Complete all**, **Uncomplete all**, and **Clear completed**. The row wraps (`flexWrap`) so three chips fit narrow screens.
- **Complete all** is disabled when every item is already checked; on press runs `itemRepo.setAllChecked(listId, true)` (checks every item of the list) and refreshes.
- **Uncomplete all** is disabled when no item is checked; on press runs `itemRepo.setAllChecked(listId, false)` (unchecks every item of the list) and refreshes — an undo for an accidental Complete all.
- **Clear completed** is disabled when no item is checked; on press opens a `ConfirmModal` titled `item_clear_completed_confirm(done)` ("Delete N completed item(s)?") with the `item_clear_completed_message` body and a destructive confirm button.
- Confirming runs `itemRepo.deleteCompleted(listId)` (deletes the checked items of the list only) and refreshes.
- The toolbar is absent from the empty state, while searching, and while in select mode.

### 2. Repository operations
- `itemRepo.setAllChecked(listId, checked)` — single `UPDATE items SET checked` for the target list; other lists untouched.
- `itemRepo.deleteCompleted(listId)` — transactional: selects the checked items' `pictures`, deletes the checked rows of the target list only, then cleans up their photos via `deletePhotosOfItems` (same cleanup path as item delete, so `data:` URIs are skipped and `fileIo` failures are warnings, not errors).

### 3. i18n
- New keys en/es: `item_complete_all`, `item_clear_completed`, `item_clear_completed_confirm(count)` (singular/plural aware), `item_clear_completed_message`.

---

## Non-functional requirements

- **TypeScript strict**, no `any`; theme tokens (`c.primary`, `c.red`, `c.border`, `c.textSecondary`) via `useConfig`; `ERROR_SCOPE.completeAllItems` / `ERROR_SCOPE.clearCompletedItems`; no new dependencies.
- **Tests**: `itemRepo` tests (`setAllChecked` checks/unchecks only the target list; `deleteCompleted` removes only the checked items of the target list and no-ops when nothing is checked); `ListDetailScreen` tests (toolbar visible with items, hidden on empty/search, complete-all action + ignored when everything is done, clear-completed confirm flow + ignored when nothing is checked).
- **Verification**: `npm run test:all`; web loop at 375px (add items, check a subset, press Complete all → all checked, progress reaches n/n; press Clear completed → confirm dialog shows the count, confirm → only completed items disappear; disabled states; toolbar hidden during search).

---

## Acceptance criteria

- [x] In List detail with items, a toolbar with **Complete all**, **Uncomplete all** and **Clear completed** appears under the header.
- [x] **Complete all** checks every item of the list at once and the progress bar reaches 100%.
- [x] **Complete all** is inert (disabled) when every item is already checked.
- [x] **Uncomplete all** unchecks every item of the list at once.
- [x] **Uncomplete all** is inert (disabled) when no item is checked.
- [x] **Clear completed** asks for confirmation showing the number of completed items, then deletes only those items.
- [x] **Clear completed** is inert (disabled) when no item is checked.
- [x] The toolbar is hidden when the list is empty, while searching, and in select mode.
- [x] `item_complete_all`, `item_uncomplete_all`, `item_clear_completed`, `item_clear_completed_confirm`, `item_clear_completed_message` exist in en and es.
- [x] `npm run test:all` passes.