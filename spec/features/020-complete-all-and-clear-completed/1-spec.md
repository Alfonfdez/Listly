# 020 - Complete all items / Clear completed items

- **Objective**
  In List detail, let the user check every item at once and delete the completed ones in one tap, via a small batch toolbar under the list header (shown only when the list has items and no search/select mode is active).

---

## Functional requirements

### 1. Batch toolbar (List detail only)
- When the list has at least one item and neither select mode nor search is active, a **single non-wrapping row** of bounded chip buttons appears between the header and the items grid: the icon-only sort pill (feature 022) followed by **All**, **None**, and **Clear** (short visible labels; the full names *Complete all* / *Uncomplete all* / *Clear completed* are kept as accessibility labels). The three label pills share the row width evenly (`flex: 1`) so the row fits one line at 375px in every language. (*Merge into…*, feature 025, moved to the Edit List screen.)
- **All** is disabled when every item is already checked; on press runs `itemRepo.setAllChecked(listId, true)` (checks every item of the list) and refreshes.
- **None** is disabled when no item is checked; on press runs `itemRepo.setAllChecked(listId, false)` (unchecks every item of the list) and refreshes — an undo for an accidental "All".
- **Clear** is disabled when no item is checked; on press opens a `ConfirmModal` titled `item_clear_completed_confirm(done)` ("Delete N completed item(s)?") with the `item_clear_completed_message` body and a destructive confirm button.
- Confirming runs `itemRepo.deleteCompleted(listId)` (deletes the checked items of the list only) and refreshes.
- The toolbar is absent from the empty state, while searching, and while in select mode.

### 2. Repository operations
- `itemRepo.setAllChecked(listId, checked)` — single `UPDATE items SET checked` for the target list; other lists untouched.
- `itemRepo.deleteCompleted(listId)` — transactional: selects the checked items' `pictures`, deletes the checked rows of the target list only, then cleans up their photos via `deletePhotosOfItems` (same cleanup path as item delete, so `data:` URIs are skipped and `fileIo` failures are warnings, not errors).

### 3. i18n
- New keys en/es: `item_complete_all` / `item_complete_all_a11y`, `item_uncomplete_all` / `item_uncomplete_all_a11y`, `item_clear_completed` / `item_clear_completed_a11y` (short visible label + full accessibility label), `item_clear_completed_confirm(count)` (singular/plural aware), `item_clear_completed_message`.

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
- [x] The three bulk actions use short visible labels (All / None / Clear) with the full names as accessibility labels, on a single row with the icon-only sort pill, fitting one line at 375px in all nine languages.
- [x] The toolbar is one non-wrapping row: sort pill (022) + All / None / Clear; *Merge into…* (025) lives on the Edit List screen.
- [x] `item_complete_all`, `item_uncomplete_all`, `item_clear_completed` (+ `_a11y` variants), `item_clear_completed_confirm`, `item_clear_completed_message` exist in en and es.
- [x] `npm run test:all` passes.