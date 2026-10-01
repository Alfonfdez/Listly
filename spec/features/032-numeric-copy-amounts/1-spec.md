# 032 - Numeric copy text (amounts, quantities, sums)

- **Objective**
  When copying a **numeric** list to the clipboard, include each item's **amount, quantity and line total** (not just the name), and append a footer with the list's **Total** and **Done** sums. Standard lists keep the current output (names, optional notes, check marker).

---

## Functional requirements

### 1. Numeric item lines
- Each item line is `[✅ ]<name> — <amount> × <quantity> = <lineTotal>`, e.g. `Milk — 1.20 × 2 = 2.40`.
- The `amount × quantity = lineTotal` segment is **always** shown, including when quantity is `1` (e.g. `Eggs — 2.10 × 1 = 2.10`).
- Amount and line total use `formatMinor` (two decimals); quantity is the raw integer.
- A null `amount_minor` renders as `0.00` (so the segment is `0.00 × 1 = 0.00`).
- The checked marker (`✅`) stays **before the name** when the item is checked.

### 2. Notes
- With `withNotes`, a non-empty note is appended after the numeric segment using the existing ` — ` separator:
  `Coffee beans — 8.49 × 2 = 16.98 — Decaf, for the moka pot`.
- Without notes, the note is omitted (unchanged behavior).

### 3. Footer (numeric only)
- After the items, a **blank line**, then `Total: <all>` and `Done: <done>` on their own lines.
- `Total` sums every item; `Done` sums only the **checked** items (same semantics as the list header).
- Labels are the existing localized `list_total_label` / `list_done_total_label`.
- The footer is **omitted** when the numeric list has no items.

### 4. Standard lists unchanged
- Non-numeric lists keep today's output exactly: list name, then `[✅ ]<name>[ — <note>]` per item, position order, no footer.

### 5. Pure builder
- `buildListCopyText` stays free of i18n/label dependencies: localized labels are **passed in** by the caller.

---

## Non-functional requirements

- **TypeScript strict**, no `any`; reuse `formatMinor`, `lineTotalMinor`, `sumTotals` from `src/utils/numeric.ts`.
- The utility is pure/deterministic (labels injected), so it is unit-testable without the language registry.
- **Tests**: `copyList` numeric + standard regression cases; hook wiring updated.
- **Verification**: `npm run test:all`; web 375px — copy a numeric list (with/without notes) and a standard list, paste and compare.

---

## Acceptance criteria

- [x] A numeric list copied without notes lists each item as `name — amount × quantity = lineTotal` in position order.
- [x] Quantity `1` still shows the full `amount × 1 = total` segment.
- [x] A checked numeric item keeps the `✅` marker before its name.
- [x] With notes, a non-empty note is appended after the numeric segment with ` — `.
- [x] A numeric list ends with a blank line then `Total:` (all items) and `Done:` (checked only), using localized labels.
- [x] A null amount renders as `0.00`.
- [x] An empty numeric list has no footer.
- [x] A standard list's copied text is unchanged.
- [x] `buildListCopyText` takes labels as parameters (no i18n import) and stays pure.
- [x] `npm run test:all` passes.
