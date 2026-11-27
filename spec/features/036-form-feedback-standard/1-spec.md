# 036 - Form feedback standard (counters and validation)

- **Objective**
  Unify how forms show character counters and validation feedback, following Finly: counters on the label row, red borders on invalid fields, and messages placed where the keyboard cannot hide them. Apply the standard to the item edit modal, the inline add bar and the lock-list modal, and use the space saved to show more name/note lines.

---

## Functional requirements

### 1. Character counters
- Every field with a maximum length shows `current/max`.
- **With a label**: the counter sits at the right of the label row (`FormField right`). The item edit modal's Name and Note now match the list/collection names.
- **Without a label** (list-detail add bar): the counter stays under the input.
- `CharCounter` stays muted/500 normally and **red + bold** at or over the limit.

### 2. Validation feedback
- The invalid field always gets a **red border**.
- The message is **inline under the invalid field** in every form:
  - full-screen forms (Create/Edit list and collection): red border when touched + inline message under the Name field;
  - modals: inline message under the field (the keyboard covers the footer); red border immediately;
  - label-less inline inputs (add bar): red message above the input row + red border.
- No form uses a hint band above the submit button: with the keyboard open that band was hidden, so inline is the single rule everywhere.
- **Lock-list modal**: only the field that needs fixing is red — passphrase for "too short", confirm for "do not match", current for "incorrect".
- No new i18n keys; existing messages are reused.

### 3. Edit-item modal space
- Name shows **3 lines** (was 2) and note **7 lines** (was 5).
- Photo tiles are **64×64** (was 80×80) and use the same `images-outline` add icon as the compact add bar.
- The photo section's bottom margin and the button row's top margin are both zero, leaving a single **8px** gap (the modal content gap) between the tile and the buttons.
- The photo tile change applies only to the modal; the add bar keeps 56×56.

---

## Non-functional requirements

- `PHOTO_METRICS` carries tile/icon sizes; `EDIT_ITEM_NAME_LINES` / `EDIT_ITEM_NOTE_LINES` drive the input heights. No magic numbers in the components.
- Tests: `ItemFields` (`showCounter={false}`), `ItemFormModal` (line counts, counters in the label row, red border on empty/duplicate), `LockListModal` (red border per error), `ListDetailScreen` (add-bar red border), `PhotoSection` (metrics).
- Verification: `npm run test:all`. The `06-b-item-edit` screenshot refresh is deferred to the next UI batch (single rename + all 9 READMEs).

---

## Acceptance criteria

- [x] Item edit modal counters render in the Name/Note label rows; the add bar keeps its under-input counters.
- [x] Every invalid field gets a red border (list/collection forms, item modal, add bar, lock-list modal).
- [x] The message is inline under the invalid field everywhere; the submit-adjacent hint band was removed because the keyboard could hide it.
- [x] Edit modal: Name 3 lines, Note 7 lines, 64×64 photo tiles with the `images-outline` icon, 8px gap to the buttons.
- [x] No new i18n keys.
- [x] `npm run test:all` passes.
