# 020 — Complete all / Clear completed: Plan

## Architecture

```
ListDetailScreen
├── header (DetailHeader)
├── BatchToolbar (items.length > 0 && !selectMode && !searchActive)
│   ├── Complete all   -> itemRepo.setAllChecked(listId, true);   disabled when done === total
│   └── Clear completed-> ConfirmModal(item_clear_completed_confirm(done));
│                         confirm -> itemRepo.deleteCompleted(listId); disabled when done === 0
└── items grid (Sortable.Grid) unchanged
state: clearCompletedVisible
```

## Data model

- No schema change. Reuses `items.checked` and the existing `pictures` column for photo cleanup.
- Two new repo operations on `itemRepository`:
  - `setAllChecked(listId, checked)` — `UPDATE items SET checked` scoped by `list_id`.
  - `deleteCompleted(listId)` — `withTransaction`: select checked rows' `pictures` → delete rows `WHERE list_id` and `checked = 1` → `deletePhotosOfItems(rows)`.

## Components

| Component | Location | Change |
|-----------|----------|--------|
| `itemRepo.ts` | `src/database/repositories/itemRepo.ts` | **New** `setAllChecked(listId, checked)` and `deleteCompleted(listId)` (transactional + photo cleanup) |
| `ListDetailScreen` | `src/screens/ListDetailScreen.tsx` | **New** batch toolbar row under the header (bounded chips `checkmark-done-outline` / `close-circle-outline`), `completeAll` / `clearCompleted` handlers, clear-completed `ConfirmModal` |
| `errors.ts` | `src/utils/errors.ts` | **New** scopes `completeAllItems`, `clearCompletedItems` |
| i18n | `src/i18n/en.ts`, `es.ts` | **New** `item_complete_all`, `item_clear_completed`, `item_clear_completed_confirm(count)`, `item_clear_completed_message` |

## Data flow

- List has items and no select/search → toolbar visible; `done` computed from `items`.
- Press **Complete all** → `setAllChecked(listId, true)` → `refresh()`; button inert (disabled) when `done === total`.
- Press **Clear completed** → modal opens with count `done`; confirm → `deleteCompleted(listId)` → `refresh()`; button inert when `done === 0`.
- Search/select mode hide the toolbar (same guard as the batch actions for select mode); empty list keeps the toolbar out of the empty state.

## Risks / notes

- `deleteCompleted` must run inside `withTransaction` so the row deletion and photo cleanup stay consistent; `deletePhotosOfItems` already tolerates `data:` URIs and swallow `fileIo` failures with a warning (same as item delete).
- The orphaned-photo window matches single-item delete: photos of deleted rows are cleaned after deletion inside the transaction; a crash between the two leaves a non-fatal warning path only when a list is later removed (no leaks in normal flow).
- Toolbar buttons use `accessibilityLabel` so screen-reader tests and web verification target them reliably.