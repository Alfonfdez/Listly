# 008 — Add-item note area: Plan

## Components

| Component | Change |
|-----------|--------|
| `ListDetailScreen` add bar | Add `newNote` + `noteExpanded` state; chevron toggle rotates; note `TextInput` rendered conditionally below name input; `submitAdd` includes `note`; clears both fields + collapses on submit. |

## i18n

New key: `item_add_note_toggle` ('Toggle note' / 'Alternar nota') — accessibility label for the chevron button.

## Data flow

- `submitAdd` now passes `note: newNote.trim() || null` to `itemRepo.create`.
- After success: `setNewName('')`, `setNewNote('')`, `setNoteExpanded(false)`, `setAddError(null)`.
- Duplicate/empty validation is name-only (unchanged).

## Tests

Add to `ListDetailScreen.test.tsx`:
- expand note area toggle (chevron visibility / rotation not tested on web — focus on text presence).
- add item with note → `itemRepositoryMock.create` called with note string.
- add item without note → note stays null.
- existing name validation still triggers (unaffected by note field).

## Risks / notes

- Note field is always optional; no validation beyond max length.
- Collapsing on submit keeps the add bar compact; user can re-expand if adding another noted item.
- Existing tests rely on `itemRepositoryMock.create.mockResolvedValue({})` — unchanged.