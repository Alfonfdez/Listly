# 035 - Form name feedback (create/edit list and collection) - Plan

## Approach

Port Finly's form-field behaviour into the shared components Listly already uses:

- `LabeledTextField` in Finly tracks `touched` and only paints the border red when
  `error && touched`; the message lives in a reserved band above Save. Listly's
  equivalent is `EntityForm` + `FormField` + a new `FormHint`.
- Finly's `CharCounter` is muted/500 normally and red/700 at the limit; the
  counter sits in the section header's right slot.

## Changes

| File | Change |
|------|--------|
| `src/components/CharCounter.tsx` | Weight 500 normally, 700 + `c.red` at `current >= max`; optional `fontSize` |
| `src/components/FormField.tsx` | Optional `right` slot rendered in the label row (`space-between`); label loses its own `marginBottom` (the row owns it) |
| `src/components/FormHint.tsx` | New reserved two-line band (red, centred, `role="alert"`, polite live region) |
| `src/components/EntityForm.tsx` | `touched` on change/blur; `showError`; red input border; `CharCounter` in the label row; `FormHint` above the submit button; inline field error removed |
| `tests/components/CharCounter.test.tsx` | New: muted/500, red/700 at and over the limit |
| `tests/screens/CreateListScreen.test.tsx` | Clean on mount, counter updates, blur shows hint + red border, bold at max |
| `tests/screens/EditListScreen.test.tsx` | Initial counter, clearing shows hint + red border + disabled Save |
| `tests/screens/EditCollectionScreen.test.tsx` | Initial counter in the edit form |

## Decisions

- The hint and border wait for `touched` (change **or** blur). Finly shows its
  empty-name hint immediately but withholds the border; the stricter rule is
  intentional here and matches the request.
- Counter position: right side of the "Name" label row (Finly exact), not under
  the input.
- The band is always reserved (two lines), so Delete/Save keep their position.
- `ItemFormModal` keeps its inline "Name is required" (it only appears after
  interaction), so `FormField.error` stays supported.

## Risks

- The reserved band adds a small amount of vertical space to the four entity
  forms; both are scrollable, so no layout regression.
- Duplicate-name errors now also paint the border red, which is the intended
  "why you can't save" signal.

## Verification

- `npm run test:all`.
- Re-capture `03-create-list` and `05-edit-list` (and the full set once): counter
  visible, no hint on a valid untouched form.
