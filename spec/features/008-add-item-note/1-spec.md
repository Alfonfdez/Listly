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

---

## Non-functional requirements

- **Multilingual**: uses existing `item_note_label`; add `item_add_note_toggle` (en/es) for the chevron's accessibility label.
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