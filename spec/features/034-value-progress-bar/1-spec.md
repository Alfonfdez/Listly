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
- No currency symbol (numeric lists are currency-agnostic), consistent with the existing Total/Done rows.
- No caption text (self-descriptive via the numbers); no new i18n keys.

### 3. Visibility + reserved space
- Bar 2 is **shown** only when the list is numeric **and** `totalValue > 0` **and** `doneValue > 0`.
- Bar 2 is **hidden** otherwise (non-numeric lists, total 0, or done 0 — e.g. only 0-value items checked).
- When hidden on a numeric list, its **space is still reserved** (fixed-height slot) so toggling items never shifts the header content down/up. The slot is only present for numeric lists.

### 4. Accessibility
- Bar 2 exposes an accessibility label such as `Value progress: 13.96 %`.

---

## Non-functional requirements

- **TypeScript strict**, no `any`; pure helpers for the percentage (`valueProgressPercent`, `formatPercent2`) and theme tokens for colors.
- **Tests**: helper edge cases (0 total, 0 done, 100%, rounding to 2 decimals); `DetailHeader` (bar 2 shown with numbers + percent; hidden-but-space-reserved; non-numeric renders no slot); `ListDetailScreen` numeric case (appears/hides; header height stable).
- **Verification**: `npm run test:all`; web 375px (numeric list: bar 2 fill/label update on toggle; hidden state leaves the header height unchanged; standard list shows only bar 1; 0 console errors).

---

## Acceptance criteria

- [x] A numeric list shows a second progress bar under the count bar whose fill is `doneValue / totalValue`.
- [x] The value bar shows `doneValue / totalValue` and a right-aligned percentage with two decimals (dot separator).
- [x] The value bar is hidden when the list is not numeric, when the total value is 0, or when the done value is 0.
- [x] Hiding/showing the value bar does not move the header content (its space is reserved on numeric lists).
- [x] Standard lists are unaffected (only the count bar).
- [x] No currency symbol is shown; no new i18n keys are required.
- [x] The value bar has an accessibility label reporting its percentage.
- [x] `npm run test:all` passes.
