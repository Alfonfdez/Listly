# 034 - Value progress bar (numeric lists)

- **Objective**
  On a numeric list, add a **second progress bar** below the existing item-count bar that shows progress by **value**: the share of the total money already checked off (`done value / total value`), with the numbers and a percentage. It complements the count bar ("2 of 5 items") with a weighted view ("3.20 of 22.93").

---

## Functional requirements

### 1. Bar 1 (unchanged)
- The existing item-count progress bar stays as-is for both standard and numeric lists (`done/total` items, `2/5`).

### 2. Bar 2 (numeric lists only)
- Fill width = `doneValue / totalValue × 100`, where `doneValue = sumTotals(items, { onlyDone: true })` and `totalValue = sumTotals(items, { onlyDone: false })`.
- The row shows `doneValue / totalValue` (e.g. `3.20 / 22.93`) next to the bar, and a **right-aligned percentage** with **two decimals** (e.g. `13.96 %`), using a **dot** decimal separator (locale-agnostic, matching the numeric UI).
- No currency symbol (numeric lists are currency-agnostic). Bar 2 replaces the former standalone **Total**/**Done** text rows, which were removed from the header (values are still available via the item line totals and the clipboard copy, feature 032).
- No caption text (self-descriptive via the numbers); no new i18n keys.

### 3. Visibility
- Bar 2 is **always shown on a numeric list**, including the zero state (`0.00 / 0.00 · 0.00 %`, empty list) and when the done value is 0 — so the header height is stable by construction and toggling items never reflows it.
- Bar 2 is absent only on **standard lists** (which keep the item-count bar alone).

### 4. Accessibility
- Bar 2 exposes a combined accessibility label: `Value progress: <done> / <total>, <percent> %` (e.g. `Value progress: 3.20 / 22.93, 13.96 %`).

---

## Non-functional requirements

- **TypeScript strict**, no `any`; pure helpers for the percentage (`valueProgressPercent`, `formatPercent2`) and theme tokens for colors.
- **Tests**: helper edge cases (0 total, 0 done, 100%, rounding to 2 decimals); `DetailHeader` (bar 2 shown with numbers + percent + combined a11y label; zero state; non-numeric renders no bar); `ListDetailScreen` numeric case (bar always present; standard list shows only bar 1).
- **Verification**: `npm run test:all`; web 375px (numeric list: bar 2 fill/label update on toggle; zero state shows `0.00 / 0.00 · 0.00 %`; standard list shows only bar 1; 0 console errors).

---

## Acceptance criteria

- [x] A numeric list shows a second progress bar under the count bar whose fill is `doneValue / totalValue`.
- [x] The value bar shows `doneValue / totalValue` and a right-aligned percentage with two decimals (dot separator).
- [x] The value bar is always shown on a numeric list, including the zero state (`0.00 / 0.00 · 0.00 %`).
- [x] The value bar is absent on standard lists (only the count bar).
- [x] The former standalone Total/Done rows were removed from the header; their values live on the value bar.
- [x] No currency symbol is shown; no new i18n keys are required.
- [x] The value bar has a combined accessibility label (`Value progress: <done> / <total>, <percent> %`).
- [x] `npm run test:all` passes.
