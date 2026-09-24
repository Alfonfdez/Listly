# 003 — List detail screen

- **Objective**
  List detail — shows the items of a single list with a checkbox per item (toggle done/undone), a progress indicator, inline add for new items, and edit/delete for existing ones. Opened from the Home grid (route param `{ listId }`).

---

## Functional requirements

### 1. Header
- In-screen header with the list's icon, name (colored with the list color), and a progress bar showing "N/total" (`home_progress`, computed from `items` with `checked = 1`).
- Native stack header stays "Listly" (default); the list identity lives in the screen body.

### 2. Item list
- Items ordered by `position`.
- Each row: checkbox (Ionicons circle → checkmark-circle when done), item name (secondary color + a faint green row tint when `checked = 1`; no strikethrough), a tappable note preview when the item has a `note`, and a circular edit button.
- Tapping a row toggles the item (check/uncheck) via `itemRepo.toggle`; progress updates on refresh.

### 3. Add item
- Inline input at the bottom of the screen (placeholder `item_add_placeholder`, submit via "Add" button or keyboard return).
- New items are appended at the end: `position = max(existing positions) + 1`, `checked = 0`, note `null`.
- Validation (`item_name_*` messages, per constitution 5-validations):
  - Trimmed name non-empty after trim.
  - Max `MAX_ITEM_NAME_LENGTH = 200`.
  - Duplicate name within the same list rejected (case-insensitive). The check runs against the list's items already loaded in memory — no extra round-trip required.

### 4. Edit / delete
- Tapping the row's circular edit button opens the item form modal (`item_edit_title`) with name + note fields.
- Save applies `itemRepo.update` with the same validations as add.
- The modal shows a Delete action (`item_delete`) that asks for confirmation (`item_confirm_delete`) before `itemRepo.delete`.

### 5. Empty state
- When the list has no items: icon + `item_empty` ("No items yet") + hint `item_empty_hint`. The add input remains visible.

### 6. Data loading
- Items refresh on focus (`AppContext.refresh()`); row state, progress, and header stay consistent with persisted data.

---

## Non-functional requirements

- **Multilingual**: all new texts go through `t()` (en/es).
- **Reuse**: `ScreenShell`, `EmptyState`.
- **Theme/text size**: all components use `useConfig().activeColors` and `useFontSize()`.
- **No schema changes**: reads and writes the existing `items` table only.
- **Tests**: pure-logic tests for the item validation helper; component test for the item row; screen test for add/edit/delete/toggle flows.

---

## Acceptance criteria

- [x] Opening a list from Home shows its icon, name, color, and "N/total" progress.
- [x] Item rows show a checkbox, the name (secondary color + faint green tint when done, no strikethrough), a tappable note preview, and a circular edit button.
- [x] Tapping a row toggles the item and updates the progress bar.
- [x] Typing in the add input creates the item at the end of the list; empty and duplicate names are rejected with a message.
- [x] Editing an item updates its name and note; deleting removes it after confirmation.
- [x] A list with no items shows the empty-state message and keeps the add input visible.
- [x] All texts are multilingual and respect theme + text size.