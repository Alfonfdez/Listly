# 037 — Currency and number format

- **Objective**
  Let numeric lists show amounts with a currency and a chosen decimal/grouping style, configured globally in Settings → Regional and overridable per list. The default is currency **None** and **Plain** formatting, so existing users see exactly the current output until they opt in.

---

## Functional requirements

### 1. Global money settings
- Settings → Regional gains a **Money format** section under Language with:
  - **Currency**: None (default) + the 30 currencies from Finly (euro, US dollar, pound, yen, franc, …), with a searchable picker.
  - **Decimal separator**: **Plain (1234.56)** (default), **Comma (1.234,56)**, **Dot (1,234.56)**.
- The two values live in the config table as `currency` and `amount_format`; missing keys from an older backup fall back to `none` / `plain`.
- Changing them applies immediately to every numeric list.

### 2. Formatting
- Amounts are stored as integer minor units and formatted with 2 decimals for every currency:
  - Plain: `1234.56` (no grouping, dot decimal).
  - Dot: `1,234.56` (comma thousands, dot decimal).
  - Comma: `1.234,56` (dot thousands, comma decimal).
- A currency symbol is appended after a space: `12.34 €`, `1.234,56 CHF`.
- Applies to the add-bar line total, item rows (`amount × quantity` and total), the header value bar, the edit-item Total, clipboard copies and the value-bar percentage. Clipboard copies use the ISO currency code (`USD`, `EUR`) instead of the symbol, so pasted text cannot be parsed as a `$...$` formula.
- The max amount stays `999999.99`; grouping never changes the value.

### 3. Amount input
- The input accepts both `.` and `,`; the configured separator is displayed (state stays canonical with a dot internally).
- A pasted value with both separators treats the last one as the decimal (`1.234,56` / `1,234.56`).
- The input never shows grouping; only the formatter does.

### 4. Per-list overrides
- `lists.currency` and `lists.amount_format`, both nullable: `NULL` = inherit the global setting; `none` = explicit no symbol.
- Create/Edit list (numeric only) shows **Use global (…)** first, then None/currencies and Plain/Comma/Dot. The inherited options show the current global value; picking a concrete value stores an override.
- New lists and duplicates keep the inherited values unless the user changes them; switching a list to Standard hides the selectors and retains any override for a later switch back.
- Duplicating a list carries its overrides; copy/merge (items only) keep the target list's format.
- `SCHEMA_VERSION` 10 adds the two columns with an idempotent migration; backups round-trip them and schema-9 backups import with `null` (inherit).

### 5. Layout
- Line totals keep a fixed right-aligned slot sized for the grouped maximum (`999.999,99` / `999,999.99`) plus the current currency suffix; the slot also scales with the OS font scale, so a long value or a currency never shifts Amount/Quantity and Android font scaling cannot ellipsize it.
- The add bar and item rows show the symbol inline (including 3-letter codes).
- In the edit modal the row is tight at 375px: 1–2 character symbols stay inline; 3-letter codes (CHF/AED/SAR) move to the Total label (`Total (CHF)`) and the value stays plain, keeping the Amount input usable.

---

## Non-functional requirements

- TypeScript strict, no `any`; theme tokens + `fs()`.
- All 9 languages: currency names reused from Finly; new keys for None, the three formats, Money format, Currency and Decimal separator.
- Tests: formatting/grouping/symbol/percentage, comma parsing, input display, line-total slot widths, Regional screen (search + apply), add bar/modal/row rendering, clipboard, config schema and DB key map, per-list resolution, list create/edit/duplicate overrides, migration 9→10, backup round-trip and legacy import.
- Verification at 375px with EUR (inline), CHF (label fallback), a per-list override and a return to the global settings, no overflow, 0 console errors.
- `npm run test:all` and `npx expo-doctor` stay green.

---

## Acceptance criteria

- [x] Settings → Regional shows a Money format section with a searchable currency picker (None + 30) and Plain/Comma/Dot.
- [x] Defaults are None + Plain; existing numeric lists look unchanged.
- [x] Amounts, line totals, value bar, edit Total, clipboard and percentages use the configured symbol/separator.
- [x] The amount input accepts and displays the configured decimal separator.
- [x] The edit modal keeps three fields on one row at 375px; 3-letter codes use the Total label instead of squeezing Amount, and the grouped maximum (`999.999,99`) is never ellipsized, including with Android font scaling.
- [x] Per-list currency/format overrides, with **Use global (…)** as the default.
- [x] `SCHEMA_VERSION` 10 migration and backup round-trip; schema-9 backups import as inherit.
- [x] Duplicating a list carries its overrides; Standard lists hide the selectors and retain them.
- [x] `npm run test:all` passes.
