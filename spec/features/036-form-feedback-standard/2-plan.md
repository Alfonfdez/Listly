# 036 - Form feedback standard (counters and validation) - Plan

## Approach

Port Finly's counter placement and validation conventions into the shared form components, then use the freed space in the item edit modal.

## Counter placement

Finly puts the counter in `FormSectionHeader`'s `right` slot (`LabeledTextField counterInHeader`) and uses a small label row when there is no section header. Listly already has `FormField right`; the missing piece was `ItemFields`, which hardcoded the counter under the input.

- `ItemNameField` / `ItemNoteField`: new `showCounter` prop (default `true`).
- `ItemFormModal`: passes `showCounter={false}` and renders `<CharCounter>` in `FormField right` for Name and Note.
- `AddItemBar`: unchanged (label-less), so its counters stay under the inputs.

## Validation feedback

| Form type | Border | Message |
|-----------|--------|---------|
| Full-screen (`EntityForm`) | red when touched | inline under the Name field |
| Modal (`ItemFormModal`, `LockListModal`) | red immediately | inline under the field |
| Inline add bar | red immediately | above the input row |

The `FormHint` band above the submit was removed: with the keyboard open the button and the band were below the fold, so the message now always stays next to the field.

- `EntityForm`: restore `FormField error` (touch-gated); delete `FormHint`.
- `ItemFormModal`: name border from `draft.error`.
- `AddItemBar`: name border from `draft.error`.
- `LockListModal`: red border on the specific field (passphrase / confirm / current) based on the error message.

## Modal space

- `EDIT_ITEM_NAME_LINES` 2 → 3, `EDIT_ITEM_NOTE_LINES` 5 → 7.
- `PHOTO_METRICS.regular`: size 80 → 64, add icon `add` → `images-outline`, add icon 28 → 22, badge 22 → 20, bottom margin 16 → 0.
- `ItemFormModal`: button row margin 12 → 0, photo section margin 4 → 0; the modal's content gap leaves the only 8px between the tile and the buttons.

## Files

| File | Change |
|------|--------|
| `src/components/ItemFields.tsx` | `showCounter` prop |
| `src/components/EntityForm.tsx` | inline name error, `FormHint` removed |
| `src/components/FormHint.tsx` | deleted (no hint band anywhere) |
| `src/components/ItemFormModal.tsx` | counters in label rows, red name border, line counts, 8px button gap |
| `src/components/AddItemBar.tsx` | red name border on error |
| `src/components/LockListModal.tsx` | red border on the invalid field |
| `src/constants/types.ts` | photo metrics + edit line counts |
| tests | ItemFields, ItemFormModal, LockListModal, ListDetailScreen, PhotoSection |
| docs | design-system standard, roadmap 036, changelog |

## Deferred

`06-b-item-edit` screenshot re-capture + rename (`-v2`) and the 9 READMEs, batched with the next UI changes.
