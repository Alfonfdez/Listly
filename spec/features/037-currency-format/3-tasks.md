# 037 — Tasks

## PR 1 (global settings + formatting)

- [x] Currency constants and `AmountFormat` types.
- [x] Config keys, defaults and schema.
- [x] Regional Money section with searchable currency picker.
- [x] Amount/symbol/grouping/percent formatters and comma-aware parsing.
- [x] Amount input display via `useItemDraft.amountDisplay`.
- [x] Add bar, item rows, header value bar, edit modal and clipboard use the format.
- [x] Fixed total slot sized for the currency suffix.
- [x] 9-language i18n keys.
- [x] Unit/component/screen tests; 375px verification with EUR and CHF.

## PR 2 (per-list overrides)

- [x] Schema 10 migration + Drizzle/Zod/listRepo/backup.
- [x] Create/Edit list currency + format selectors with “Use global”.
- [x] Resolve per-list format and pass it to every numeric surface.
- [x] Duplicate carries overrides; copy/merge unchanged.
- [x] Backup/upgrade tests (9→10) and verification.
