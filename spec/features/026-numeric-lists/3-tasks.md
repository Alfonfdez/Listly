# 026 — Numeric lists: Tasks

- [ ] Create `spec/features/026-numeric-lists/` (1-spec, 2-plan, 3-tasks).
- [ ] Schema: `lists.kind` + `items.amount_minor` + `items.quantity` in `001_initial.ts`, `drizzle/schema.ts`, `schemas.ts` (Zod), `types.ts` (`ListWithCounts`, `Item`); bump `SCHEMA_VERSION` to 8.
- [ ] `constants/types.ts`: `LIST_KINDS`, `MAX_AMOUNT_MINOR`, `MAX_QUANTITY`, `DEFAULT_QUANTITY`.
- [ ] `utils/numeric.ts`: `parseAmountInput`, `formatMinor`, `clampAmount`, `clampQuantity`, `lineTotalMinor`, `sumTotals` + `tests/utils/numeric.test.ts`.
- [ ] Repos: `listRepo` create/update/duplicate/withCounts carry `kind`; `itemRepo` create/update carry `amount_minor`/`quantity`; `shared.copyItemsInto` carries numeric fields.
- [ ] Backup: `kind` + numeric fields in `backup.ts` schemas and INSERTs with lenient defaults; backup tests round-trip + legacy.
- [ ] Create/Edit list: *Type* selector (Standard / Numeric) wired through `ListForm`/`EntityForm`/screens.
- [ ] Item UI (numeric lists): `AddItemBar` (Amount + Quantity stepper + line total), `ItemRow` (amount × qty + line total), `ItemFormModal` (Amount + Quantity).
- [ ] `DetailHeader`: optional two-row totals; `ListDetailScreen` derives `numeric`, `totalAll`, `totalDone` and passes `numeric` down.
- [ ] i18n en/es: `list_kind_label`, `list_kind_standard`, `list_kind_numeric`, `item_amount_label`, `item_quantity_label`, `item_line_total_label`, `list_total_label`, `list_done_total_label`, validation copy.
- [ ] Tests: numeric util, repo numeric fields, backup round-trip/legacy, screen (numeric vs standard, both totals, done-only). `npm run test:all` green.
- [ ] Docs: roadmap 026 (entry + status), `docs/harnesses.md` baseline if suite size changes, changelog entry.
- [ ] Verification loop at 375px (create numeric list, add items, line totals, mark done → totals update; standard list unaffected; en/es) + acceptance criteria flipped `[x]`.
