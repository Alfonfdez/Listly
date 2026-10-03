# 034 - Value progress bar (numeric lists) — Plan

## Approach

Add a second progress bar to the list-detail header for numeric lists, driven by the existing value totals (`sumTotals`). Keep the count bar untouched. Reserve a fixed-height slot for the value bar so its visibility changes never reflow the header. Pure helpers compute the percentage; no DB/repo/i18n changes.

## Formula

```
totalValue = sumTotals(items, { onlyDone: false })
doneValue  = sumTotals(items, { onlyDone: true })
percent    = totalValue > 0 ? (doneValue / totalValue) * 100 : 0
showValueBar = numeric && totalValue > 0 && doneValue > 0
```

## Helpers (`src/utils/numeric.ts`)

- `valueProgressPercent(totalMinor, doneMinor): number` — 0..100, guards `total <= 0`.
- `formatPercent2(pct): string` — `13.96` (two decimals, dot separator).

## UI (`DetailHeader`)

- New optional prop `valueProgress?: { percent: number; doneText: string; totalText: string }`.
- When `totals` is present (numeric list), always render a **value-bar slot** with a fixed `minHeight` (= caption row + `PROGRESS_BAR_HEIGHT` + gap). Inside it, render the bar row only when `valueProgress` is provided; otherwise leave it empty.
- Row layout: `doneText / totalText` on the left, bar fill, `formatPercent2(percent) %` right-aligned. Colors reuse `color` + `ALPHA_TRACK`.
- a11y: `Value progress: 13.96 %`.

## Screen (`ListDetailScreen`)

- `totals` already computed for numeric lists. Derive `showValueBar` + `valuePct` and pass `valueProgress` when shown.

## Files

| File | Change |
|------|--------|
| `src/utils/numeric.ts` | `valueProgressPercent`, `formatPercent2` |
| `src/components/DetailHeader.tsx` | `valueProgress` prop + reserved slot + bar/percent rendering |
| `src/screens/ListDetailScreen.tsx` | compute + pass `valueProgress` |
| `tests/utils/numeric.test.ts` | helper cases |
| `tests/components/DetailHeader.test.tsx` | bar 2 shown / reserved / absent |
| `tests/screens/ListDetailScreen.test.tsx` | numeric toggle behavior |

## Tests

- Helpers: 0/0 → 0; done 0 → 0; 100% → `100.00`; rounding (`1/3` → `33.33`); `formatPercent2` two decimals.
- `DetailHeader`: with `valueProgress` → shows `done / total` + `%`; without (but numeric totals present) → no bar, slot reserved; no `totals` (standard) → no slot.
- `ListDetailScreen`: numeric list with valued items → bar appears; uncheck all valued → hidden but height stable; standard list unaffected.

## Verification

`npm run test:all`; web 375px (numeric list toggle updates bar 2; header height constant when it appears/disappears; standard list only bar 1; 0 console errors).

## Notes

- No currency symbol, no i18n keys, no DB/backup changes.
