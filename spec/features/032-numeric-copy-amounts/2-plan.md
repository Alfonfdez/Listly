# 032 - Numeric copy text (amounts, quantities, sums) — Plan

## Approach

Extend `buildListCopyText` with an options object that carries `withNotes`, the list **kind**, and the two localized footer labels. Numeric lists get per-item `amount × quantity = lineTotal` and a `Total`/`Done` footer; standard lists keep the current output. The util stays pure (labels injected), so tests are deterministic.

## New signature

```ts
interface CopyLabels { total: string; done: string }

buildListCopyText(
  listName: string,
  items: Item[],
  opts: { withNotes: boolean; numeric?: boolean; labels?: CopyLabels }
): string
```

- `numeric` defaults to `false`; `labels` is required when `numeric` is true.
- `useClipboardCopy` supplies `numeric: list.kind === 'numeric'` and `labels` from `useLabels()`.

## Output rules

| Case | Line |
|------|------|
| Standard, unchecked | `Milk` |
| Standard, checked | `✅ Milk` |
| Standard + note | `Milk — skim` |
| Numeric, qty>1 | `Milk — 1.20 × 2 = 2.40` |
| Numeric, qty=1 | `Eggs — 2.10 × 1 = 2.10` |
| Numeric, null amount | `0.00 × 1 = 0.00` |
| Numeric, checked | `✅ Milk — 1.20 × 2 = 2.40` |
| Numeric + note | `Coffee beans — 8.49 × 2 = 16.98 — Decaf, for the moka pot` |

Footer (numeric, non-empty only):
```
<blank line>
Total: 22.93
Done: 3.20
```
- `Total` = `sumTotals(items, { onlyDone: false })`; `Done` = `sumTotals(items, { onlyDone: true })`.
- Numbers via `formatMinor`; labels via the passed `labels.total` / `labels.done`.

## Files

| File | Change |
|------|--------|
| `src/utils/copyList.ts` | numeric-aware builder (uses `formatMinor`, `lineTotalMinor`, `sumTotals`, `clampQuantity`) |
| `src/hooks/useClipboardCopy.ts` | pass `numeric` + `labels` via `useLabels()` |
| `tests/utils/copyList.test.ts` | new numeric cases + standard regression; update to the new call signature |
| `tests/hooks/useClipboardCopy.test.ts` *(if present)* | update for the new behavior |
| `src/screens/ListDetailScreen.tsx` | call sites of `copyList(false/true)` unchanged (hook handles labels) |

## Constants

- `CHECKED_MARK = '✅'`, `NOTE_SEPARATOR = ' — '` (existing).
- Numeric separator uses the same ` — ` between name, amount segment, and note.

## Tests

- Standard: existing 4 cases unchanged (regression).
- Numeric: qty>1, qty=1, null amount, checked marker, with-notes, footer sums, empty list (no footer), position order.

## Verification

`npm run test:all` (typecheck + lint + tests); web 375px — copy numeric (names / with notes) and a standard list, paste to confirm exact text.

## Notes

- No new i18n keys (reuse `list_total_label` / `list_done_total_label`).
- No currency symbol (numeric lists are currency-agnostic).
