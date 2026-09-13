# 004 — Create list screen

- **Objective**
  Create List — form to create a new list: name (with required/max/duplicate validation), an icon picker and a color picker, and a "Create" button that persists the list and returns to Home. Opened from the Home FAB (route `CreateList`).

---

## Functional requirements

### 1. Form
- In-screen heading `create_list_title`; the native stack header stays "Listly" (as on Home).
- Name field (`list_name_label`) with `maxLength = MAX_LIST_NAME_LENGTH = 100`.
- Icon picker grid from the shared `LIST_ICONS` constant; color picker grid from `LIST_COLORS`. Both are single-select with a visible highlight on the selected option.
- Sensible defaults preselected: the first icon and first color of each shared constant.

### 2. Validation
- Trimmed name non-empty after trim (`list_name_required`).
- Max `MAX_LIST_NAME_LENGTH` (`list_name_max`).
- Duplicate name rejected (case-insensitive, `list_name_duplicate`) — checked against the database via `listRepo.existsByName`, debounced ~`DEBOUNCE_MS` (300 ms) per constitution 5-validations. Stale async duplicate responses are ignored.
- The error message clears as soon as the offending condition is resolved.

### 3. Create action
- "Create" button (`list_create`) disabled until the name is valid (no error and non-empty after trim).
- On valid submit: `listRepo.create({ name, color, icon })`, then `AppContext.refresh()`, then back to Home (grid shows the new tile, progress `0/0`, refresh-on-focus covers the update).
- The button cannot be double-submitted.

### 4. Empty/edge behavior
- No create allowed with an empty or whitespace-only name.
- Name is trimmed before saving; icon/color always valid (preselected defaults).

---

## Non-functional requirements

- **Multilingual**: all new texts go through `t()` (en/es).
- **Reuse**: `ScreenShell`; button styling mirrors `ItemFormModal` button patterns.
- **Theme/text size**: all components use `useConfig().activeColors` and `useFontSize()`.
- **No schema changes**: reads/writes the existing `lists` table only.
- **Tests**: pure-logic tests for the list-name validator; screen test for render, validation, debounce, and create flow.

---

## Acceptance criteria

- [x] Opening the Create List screen from Home's FAB shows the name field, icon picker, and color picker, with preselected defaults.
- [x] Name validation rejects empty and too-long names with a message.
- [x] A duplicate name (case-insensitive, checked after the debounce) is rejected with a message.
- [x] The Create button is disabled until the name is valid.
- [x] Creating a list persists it, returns to Home, and the new list appears in the grid with the selected icon, color, and 0/0 progress.
- [x] All texts are multilingual and respect theme + text size.