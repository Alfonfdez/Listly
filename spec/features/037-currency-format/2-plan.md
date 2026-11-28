# 037 — Plan

## PR 1 — Global settings + formatting engine

1. Constants/types
   - `src/constants/currencies.ts`: `CurrencyId`, 30 currencies + `none`, `getCurrencySymbol`, `currencySuffixWidth`, `usesCurrencyCode`.
   - `AMOUNT_FORMATS` (`plain` / `dot` / `comma`) in `constants/types.ts`.
2. Config
   - `configSchema` gains `currency` and `amountFormat`; defaults `none` / `plain`; DB keys `currency` / `amount_format`.
   - Settings → Regional Money section (searchable currency picker; format picker).
3. Formatting
   - `formatAmount`, `toDisplayAmount`, `formatAmountInput`, separator-aware `sanitizeAmountText` / `parseAmountInput`, `formatPercent2` in `utils/numeric.ts`.
   - `useAmountFormat()` hook; `useItemDraft` exposes `amountDisplay`.
4. Apply the format to the add bar, item rows, header value bar, edit modal, clipboard, percentages.
5. Fixed total slot: `LINE_TOTAL_SLOT_WIDTH + currencySuffixWidth()`; 3-letter codes move to the modal Total label.
6. i18n: 30 currency names + None, Plain/Comma/Dot, Money format, Currency, Decimal separator in all 9 languages.
7. Tests and 375px verification (EUR + CHF).

## PR 2 — Per-list overrides

1. Migration 10: `lists.currency TEXT`, `lists.amount_format TEXT` (both nullable).
2. Zod/Drizzle/listRepo (create, update, duplicate, withCounts), backup schema/import, legacy defaults.
3. Create/Edit list numeric section: Use global (…) / None / currencies; Use global (…) / Plain / Comma / Dot.
4. Resolve the effective format per list (override or global) and pass it to every numeric surface.
5. Copy/duplicate behavior and backup round-trip tests.
6. 9→10 upgrade test; `test:all` + `expo-doctor`.
