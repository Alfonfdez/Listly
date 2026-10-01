# 033 - Blank the amount field on focus when it is zero — Plan

## Approach

Add focus/blur handling to the numeric amount field in `useItemDraft` (the state owner shared by `ItemFormModal` and `AddItemBar`). On focus, if the current amount text is empty or parses to `0`, clear it and remember the previous text. On blur, if the field is still empty and the user typed nothing, restore the remembered text; otherwise keep what the user typed. `ItemAmountField` merely forwards `onFocus`/`onBlur`.

## Behaviour (Option A)

| Stored/seeded | Field on open | On focus | Blur (untouched) | Save |
|---------------|---------------|----------|------------------|------|
| `null` | blank | blank | blank → `null` preserved | null |
| `0` / `0.00` | `0.00` | **blank** | restore `0.00` | 0 |
| `1.20` | `1.20` | `1.20` (unchanged) | `1.20` | 1.20 |
| `1.20` → type `2.5` | `1.20` | `1.20` | keeps `2.5` | 2.5 |
| `0.00` → type `2.5` | `0.00` | blank | keeps `2.5` | 2.5 |

- "Zero" test uses the existing `parseAmountInput(value) === 0` (so `''`, `'0'`, `'0.00'` all qualify).
- A flag `touchedAmount` distinguishes "cleared by focus" from "user typed" so blur only restores when the user did not type.

## Hook additions (`useItemDraft`)

- `amountRef` / state to hold the pristine text at focus time.
- `onAmountFocus()` — if `parseAmountInput(amount) === 0`, save `amount` into a ref and `setAmount('')`; reset the `touched` flag.
- `onAmountBlur()` — if not touched and the current text is empty, `setAmount(remembered)`.
- `onAmountChange(text)` — sets `touched = true` and `setAmount(sanitizeAmountText(text))` (existing behaviour + flag).
- `applySeed` resets the touched flag.
- Keep `buildPayload`/`amountMinor` derivation unchanged (`parseAmountInput('')` = 0; but since we restore on untouched blur, an untouched focus-then-save restores the prior text, so no accidental 0).

## Files

| File | Change |
|------|--------|
| `src/hooks/useItemDraft.ts` | `onAmountFocus` / `onAmountBlur` + touched/pristine handling |
| `src/components/ItemFields.tsx` | `ItemAmountField` accepts `onFocus` / `onBlur` and forwards them |
| `src/components/ItemFormModal.tsx` | wire `draft.onAmountFocus` / `draft.onAmountBlur` |
| `src/components/AddItemBar.tsx` | same wiring (starts blank; no behaviour change) |
| `tests/hooks/useItemDraft.test.ts` | focus-blanks-zero, keeps-non-zero, restore-on-untouched-blur, typed-persists, null-stays-null |
| `tests/components/ItemFormModal.test.tsx` | integration: edit 0.00 → focus (blank) → type → save persists |

## Tests

- Unit (`useItemDraft`): the five behaviour rows above.
- Component: modal amount focus/typing/save; add bar unaffected.

## Verification

`npm run test:all`; web 375px — edit a `0.00` item (blank → type → save), edit a `1.20` item (unchanged on focus), edit a `0.00` item (focus then blur untouched → still `0.00`).

## Notes

- No new i18n keys, no dependencies.
- Quantity (stepper) intentionally unchanged.
