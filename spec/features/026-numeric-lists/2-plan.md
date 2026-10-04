# 026 — Numeric lists: Plan

## Architecture

```
CreateList / EditList ──"Type" selector──▶ listRepo.create/update({ kind: 'standard' | 'numeric' })

ListDetailScreen (list.kind === 'numeric')
  ├─ DetailHeader ........ two read-only totals: Total (all) / Done (checked)
  ├─ AddItemBar .......... Amount input + Quantity stepper + Line total (read-only)
  ├─ ItemRow ............. "amount × qty" + line total next to the name
  └─ ItemFormModal ....... Amount + Quantity fields (edit)

utils/numeric.ts  ── parse/format/clamp (minor units), lineTotal, sumTotals(items, {onlyDone})
```

- **Integer minor units** everywhere: the amount is stored as `amount_minor` (cents). Multiplication/summation happen on integers; only display divides by 100.
- Numeric UI is gated by `list.kind === 'numeric'`; standard lists render exactly as today.
- Reuses existing primitives: `DetailHeader` (extended with optional totals), `SelectorInline`/`OptionPickerModal` for the kind selector, `AddItemBar`/`ItemFormModal` field patterns.

## Data model (SCHEMA_VERSION 7 → 8)

| Table | New column | Type | Default |
|-------|-----------|------|---------|
| `lists` | `kind` | TEXT | `'standard'` |
| `items` | `amount_minor` | INTEGER (nullable) | `NULL` |
| `items` | `quantity` | INTEGER NOT NULL | `0` |

- Pre-1.0 `migrate()` rebuilds from `createSchema` after bumping `SCHEMA_VERSION`, so no incremental migration code is required for an existing dev DB.
- Zod: `lists.kind` → `z.enum(['standard','numeric'])`; `items.amount_minor` → `z.number().int().nullable()`; `items.quantity` → `z.number().int()`.
- Drizzle: `kind: text('kind').notNull().default('standard').$type<'standard' | 'numeric'>()`; `amount_minor: integer('amount_minor')`; `quantity: integer('quantity').notNull().default(0)`.
- Types (`database/types.ts`): `ListWithCounts.kind`; `Item.amount_minor: number | null`; `Item.quantity: number`.

## Repositories

- `listRepo.create(data)` — accept optional `kind` (default `'standard'`); return it.
- `listRepo.update(id, data)` — allow `kind` in the partial.
- `listRepo.withCounts()` — add `kind` to the projection.
- `listRepo.duplicate(...)` — copy the source `kind`.
- `itemRepo.create/update` — accept `amount_minor` / `quantity`.
- `shared.copyItemsInto` — carry `amount_minor` / `quantity` to copied rows (any-to-any).

## Backup

- `backupListSchema` gains `kind: z.enum(['standard','numeric']).default('standard')`.
- `backupItemSchema` gains `amount_minor: z.number().int().nullable().default(null)`, `quantity: z.number().int().default(0)`.
- `applyBackup` INSERT column lists include the new columns (with defaults for legacy snapshots).

## Components / screens

| File | Change |
|------|--------|
| `utils/numeric.ts` | **New** — minor-unit helpers: `parseAmountInput`, `formatMinor`, `clampAmount`, `clampQuantity`, `lineTotalMinor`, `sumTotals` |
| `constants/types.ts` | `LIST_KINDS`, `MAX_AMOUNT_MINOR` (99_999_999), `MAX_QUANTITY` (99_999), `DEFAULT_QUANTITY` (1) |
| `components/ListForm.tsx` + `EntityForm.tsx` | kind selector via `fieldSlot` (CreateList) / a new slot (EditList) |
| `screens/CreateListScreen.tsx`, `screens/EditListScreen.tsx` | pass/choose `kind` |
| `components/AddItemBar.tsx` | Amount + Quantity (+/− steppers) + line total when `numeric` |
| `components/ItemRow.tsx` | show amount × qty + line total when `numeric` |
| `components/ItemFormModal.tsx` | Amount + Quantity fields when `numeric` |
| `components/DetailHeader.tsx` | optional `totals?: { all: number; done: number }` → two read-only rows |
| `screens/ListDetailScreen.tsx` | derive `numeric`, `totalAll`, `totalDone`; pass `numeric` to item components |
| `i18n/en.ts`, `es.ts` | new keys (see spec §7) |
| `database/*` | schema/DDL/zod/types/backup as above |

## Data flow

- Add/edit item → `itemRepo.create/update({ amount_minor, quantity, ... })` → `refresh()` → rows + totals recompute.
- Totals are derived in `ListDetailScreen` via `sumTotals(items, { onlyDone })` and passed to `DetailHeader`; never persisted.
- Toggle done → existing `itemRepo.toggle` → `refresh()` → **Done** total changes.

## Risks / notes

- **Float safety**: never store/derive with floats; parse input straight to integer minor units (e.g. strip the decimal point), clamp, and only `/100` on the way out.
- **Input masking**: the amount field must reject a second decimal point, letters, and >2 decimals; cap at `MAX_AMOUNT_MINOR`. Quantity must be integer-only.
- **Layout**: caps plus right-aligned totals keep the header stable at 375px and Large text.
- **Any-to-any copy** avoids guard rules; standard↔numeric already handled by carrying nullable/zero values.
- **Non-goals (this feature)**: currency symbol, per-list currency, per-item "pending" total. Kept for a possible follow-up.
