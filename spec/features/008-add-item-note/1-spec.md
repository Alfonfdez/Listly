# 008 — Add-item note area

- **Objective**
  Allow users to attach a note when adding a new item directly in the add bar — a small chevron toggle reveals an expandable note field without leaving the list detail screen.

---

## Functional requirements

### 1. Expandable note toggle
- A small chevron button sits between the name input and the "Add" button in the add bar.
- Tapping the chevron toggles a note `TextInput` below the name input.
- The chevron rotates 180° when the note area is open.

### 2. Note input
- The note field appears directly below the name input (multiline, top-aligned).
- Placeholder: `item_note_label`.
- Max length: `MAX_ITEM_NAME_LENGTH` (2000).
- Theme and text-size aware.

### 3. Item creation with note
- When submitted, the item is created with `note` = trimmed value (or `null` if empty).
- After submission both the name and note fields clear, and the note area collapses.
- The existing duplicate/empty validation for the name still applies; the note is always optional.

### 4. Tests
- Existing ListDetailScreen suite still green.
- New test cases: expand toggle, add item with note, add item without note keeps note null, note field respects theme.

### 5. Note preview on item rows
- Item rows in the list detail screen show a 2-line clipped note preview (`numberOfLines` = 2 with ellipsis) under the item name when a note exists.
- Tapping the preview opens a full-note viewer modal mirroring the photo viewer pattern, with a Close button for long notes.
- The preview (and viewer) are hidden in select mode.

### 6. Character counters
- The name and note inputs show a live `current/max` counter below the input.
- Applies to the add bar (name + note in the details area) and the edit modal (name + note).
- The counter turns red (theme `red`) when the max is reached (`MAX_ITEM_NAME_LENGTH` 200 / `MAX_ITEM_NOTE_LENGTH` 2000).

---

## Non-functional requirements

- **Multilingual**: uses existing `item_note_label`; add `item_add_note_toggle` (en/es) for the chevron's accessibility label and `item_note_preview` (en/es) for the row note-preview accessibility label.
- **Theme/text size**: note input uses `c.text`, `c.border`, `c.surface` and `fs(15)`.
- **Tests**: `ListDetailScreen.test.tsx` expanded with note-area flows.

---

## Acceptance criteria

- [x] Tapping the chevron toggles a note field below the name input.
- [x] The chevron rotates when the note area opens/closes.
- [x] Adding an item with a note creates the item with that note; adding without a note creates the item with note = null.
- [x] After submission both fields clear and the note area collapses.
- [x] Note input respects theme and text size; empty validation and duplicate check still work for the name.
- [x] All texts are multilingual and theme/text-size aware.
- [x] Item rows show a 2-line note preview under the item name; tapping it opens a full-note viewer with a Close button.
- [x] The note preview and viewer are hidden in select mode.
- [x] Name and note inputs (add bar and edit modal) show a live character counter that turns red when the max is reached.