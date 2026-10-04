# 026 — Numeric lists

- **Objective**
  Let a list be created as a *numeric list*: a normal list whose items additionally carry a generic **Amount** (a number, not necessarily money) and an integer **Quantity**, so it can be used for shopping (amount = unit price, quantity = units, line total = amount × quantity) or for counting materials. The list detail shows a value-weighted total (the sum of all line totals) and a done-value subtotal (checked items only), rendered on the numeric value progress bar (feature 034).

---

## Functional requirements

### 1. List kind
- `lists.kind` is `'standard'` (default) or `'numeric'`.
- Create List shows a *Type* selector (**Standard** / **Numeric**); Edit List can change an existing list's kind.
- A numeric list is **visually distinguishable** wherever lists render as tiles (Home, Lists, Collection detail): its tile shows a small kind badge (`calculator-outline`) next to the type badge, in the list color, with the accessible label `list_kind_numeric`. Standard lists and collections show no such badge.
- Changing the kind never deletes item data: numeric fields are simply ignored/hidden on a standard list.

### 2. Numeric item fields
- On a numeric list, every item has:
  - **Amount** — a number with at most 2 decimals, `0 .. 999,999.99` (stored as integer minor units, i.e. cents). Optional; empty means 0.
  - **Quantity** — an integer, `0 .. 99,999`; a new item starts at **1**.
  - **Line total** — computed, read-only: `amount × quantity`, shown with 2 decimals.
- On a standard list these fields are neither shown nor editable; existing numeric values are preserved but ignored.
- Amount input uses a numeric keypad and is masked live: only digits and a single decimal point are accepted, capped at 2 decimals and at the 999,999.99 maximum; invalid keystrokes are rejected (never silently merged into the value). Quantity has `+`/`−` steppers in the add bar and edit form.

### 3. Detail totals (numeric lists only)
- The list detail header shows the value-weighted progress bar (feature 034), whose numbers are the totals:
  - **Total** — sum of `amount × quantity` over **all** items (bar 2's denominator).
  - **Done** — sum of `amount × quantity` over **checked** items only (bar 2's numerator).
  - (The former two stacked read-only Total/Done text rows were removed; the values now live on the bar.)
- Both are computed on read (never stored), summed in integer minor units and formatted with 2 decimals at display.
- The existing `done/total` count and progress bar stay. (Feature 034 later adds a second, value-weighted progress bar between the count bar and these rows.)

### 4. Arithmetic correctness
- All amounts are integers in minor units; multiplication/summation is done in integers and the result is only divided by 100 for display. No floating-point drift in totals.

### 5. Cross-list operations
- Duplicate / copy-to-list / merge carry `kind` and the numeric fields as-is (any kind into any kind). A standard item copied into a numeric list simply has amount 0 / quantity 0; a numeric item copied into a standard list keeps its values (hidden). Name-dedupe and photo behavior are unchanged (features 023/025).

### 6. Persistence and backup
- Schema `SCHEMA_VERSION` 8 adds `lists.kind`, `items.amount_minor`, `items.quantity`.
- Backups round-trip the new fields; backups made before this feature import with `kind = 'standard'`, `amount_minor = null`, `quantity = 0` (lenient defaults).

### 7. i18n
- New keys in en/es: `list_kind_label`, `list_kind_standard`, `list_kind_numeric`, `item_amount_label`, `item_quantity_label`, `item_line_total_label`, `list_total_label`, `list_done_total_label`, and any validation/help copy.

---

## Non-functional requirements

- **TypeScript strict**, no `any`; theme tokens + `fs()`; accessibility labels on the new inputs/steppers and totals.
- **Caps/format**: amount ≤ 999,999.99 and quantity ≤ 99,999 enforced at input; values are clamped, never allowed to break the layout with huge numbers.
- **Tests**: `utils/numeric` (parse/format/clamp/multiply/sum) unit tests; repo tests (create/update carry numeric fields; backup round-trip incl. legacy defaults; copy/merge carry them); screen tests (numeric list shows amount/qty/line total + both header totals; standard list unchanged; totals only count checked items).
- **Verification**: `npm run test:all`; web loop at 375px (create a numeric list, add items with amount/quantity, check line totals, mark some done → the value bar's totals update; a standard list is unaffected; en/es labels).

---

## Acceptance criteria

- [x] A list can be created as **Numeric** and its kind is shown/changeable in Edit List.
- [x] On a numeric list, items accept an **Amount** (2 decimals, ≤ 999,999.99, invalid keystrokes rejected) and a **Quantity** (integer, ≤ 99,999, starts at 1) with a computed read-only **line total**.
- [x] The list detail shows the **Total** (all items) and **Done** (checked items only) values on the numeric value progress bar, both computed from `amount × quantity`.
- [x] Totals are computed in integer minor units (no floating-point drift) and formatted with 2 decimals.
- [x] A standard list renders exactly as before (no Amount/Quantity rows, no value bar).
- [x] A numeric list's tile shows a kind badge (Home / Lists / Collection detail, card and row layouts); standard lists and collections do not.
- [x] Duplicate / copy-to-list / merge carry `kind` and the numeric fields.
- [x] Backups round-trip the new fields; older backups import with the lenient defaults (`standard` / null / 0).
- [x] New labels exist in en and es.
- [x] `npm run test:all` passes.
