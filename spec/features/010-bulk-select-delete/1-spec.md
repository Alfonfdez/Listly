# 010 — Bulk select/delete + header search

- **Objective**
  Add multi-select-and-delete for both lists and items (single delete for a list is the same flow with one item selected), and move the search toggle to the navigation header's right side on Home and Lists screens.

---

## Functional requirements

### 1. Header search toggle (Home + Lists)
- The search icon moves from the inline `ListsView` toolbar to `headerRight` in the navigator for the `Home` and `Lists` routes.
- Tapping the header search icon toggles the search bar open/closed inside `ListsView`.
- The search bar remains inline (below the header); only the toggle button lives in the header.
- An active search query shows a visual indicator (e.g. tinted icon) on the header search button.
- The `ListsView` internal search-toggle button is removed (replaced by the header button).

### 2. Select mode (lists)
- Select mode is entered by tapping the select toggle (`checkbox-outline`) in the header right, shown next to the search toggle and only when there is at least one list.
- Long-press on a list tile is reserved for drag-reorder (sortable activation) and does NOT enter select mode.
- In select mode:
  - The header select toggle flips to a close icon (`close-outline`) that exits select mode.
  - A `SelectionActionBar` appears at the bottom showing: selected count, delete button, cancel/close button.
  - Tapping an unselected list toggles it selected (highlighted border or overlay checkmark).
  - Tapping an already-selected list deselects it.
  - The list icon stays visible on each tile/row (selection on rows shown via a corner check badge, not by replacing the icon).
  - The FAB is hidden while in select mode.
  - The search bar remains functional (filtering works in select mode).
- Exiting select mode: tap the cancel/close button on the action bar, or the header close icon.

### 3. Bulk delete (lists)
- The delete button on the `SelectionActionBar` shows a confirmation dialog listing the count of lists to delete.
- Confirming deletes all selected lists (and their items via FK cascade) in a single transaction.
- After deletion the dialog closes, select mode exits, and `refresh()` is called.

### 4. Single delete (lists)
- Selecting exactly one list (via the header select toggle) and confirming the delete removes only that one list.
- No separate swipe or dedicated single-delete button is needed — the select-mode flow covers deleting one or many lists.

### 5. Select mode (items — ListDetailScreen)
- Select mode is entered by either:
  - Tapping the select toggle (`checkbox-outline`) in the list-detail header right, shown next to the search toggle and only when the list has at least one item; or
  - Long-pressing any `ItemRow` (item rows are not sortable, so long-press is free for select entry).
- The list-detail header also shows a search toggle beside the select toggle; tapping it opens an inline search bar that filters items by name or note (case-insensitive, all terms must match), with a "no results" state when nothing matches.
- In select mode:
  - The header select toggle flips to a close icon (`close-outline`) that exits select mode.
  - A `SelectionActionBar` appears at the bottom showing: selected count, delete button, cancel/close button.
  - Tapping an item row toggles it selected (highlighted background or checkmark).
  - The add-item bar is hidden while in select mode.
- Exiting select mode: tap cancel/close on the action bar or the header close icon.

### 6. Bulk delete (items)
- The delete button shows a confirmation dialog listing the count of items to delete.
- Confirming deletes all selected items in a single transaction.
- After deletion the dialog closes, select mode exits, and `refresh()` is called.

### 7. Database: `deleteMany`
- `listRepo.deleteMany(ids: number[])` — deletes all listed IDs in a transaction.
- `itemRepo.deleteMany(ids: number[])` — deletes all listed IDs in a transaction.
- Both return `Promise<void>`.

---

## Non-functional requirements

- **Multilingual**: new i18n keys (en/es) for select-mode labels, confirmation prompts, action-bar text.
- **Theme/text size**: selection highlights use `c.primary` (tint) or `c.border` (overlay); action bar uses `c.surface`/`c.text`/`c.red` tokens; destructive actions (delete buttons and delete-confirm buttons) use a solid `c.red` background with white text; all text through `fs()`.
- **Tests**: `listRepo` and `itemRepo` contract tests for `deleteMany`; `ListsView`, `SelectSearchHeader`/`SelectToggleButton`, screen tests for the header toggles, select-mode toggle, bulk delete flow, `filterItemsByQuery` unit tests, and header search toggle.
- **Verification**: web loop at 375px — select mode entry/exit, bulk delete lists, bulk delete items, header search toggle persistence across navigation.

---

## Acceptance criteria

- [x] A header select-toggle icon (`checkbox-outline`) sits next to the search icon on Home, Lists and ListDetail when there is data; it enters select mode and flips to a close icon to exit.
- [x] Long-press on a list tile only drags to reorder; it does not enter list select mode (select mode is entered via the header select toggle).
- [x] List icons on tiles/rows stay visible during list select mode (selection on rows is shown by a corner check badge, not by hiding the icon).
- [x] The ListDetail header shows a search toggle beside the select toggle; it filters items by name/note inline with a no-results state.
- [x] Search toggle lives in the header right of Home and Lists screens; tapping it opens/closes the inline search bar.
- [x] An active search query tints the header search icon.
- [x] In select mode, tapping lists toggles selection; FAB is hidden.
- [x] Bulk-delete confirmation dialog appears; confirming deletes selected lists and exits select mode.
- [x] Long-press on an item row enters item select mode with a bottom action bar.
- [x] In item select mode, tapping items toggles selection; add bar is hidden.
- [x] Bulk-delete confirmation for items works the same way.
- [x] All new UI respects theme tokens and `fs()` scaling.
- [x] All new visible text is in en and es.
- [x] All tests pass (repo contract tests, component tests, typecheck, lint).
