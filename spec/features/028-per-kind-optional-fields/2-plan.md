# 028 - Per-kind optional fields — Plan

## Approach

Split the four optional-field visibility flags by list kind, keeping the existing standard keys and adding four numeric keys that mirror them. A single hook resolves the effective pair from the list's `numeric` value.

## Config

| Key | Default | DB key |
|-----|---------|--------|
| `showNotes` / `showPhotos` | `true` | `show_notes` / `show_photos` |
| `editShowNotes` / `editShowPhotos` | `true` | `edit_show_notes` / `edit_show_photos` |
| `showNotesNumeric` / `showPhotosNumeric` | `true` | `show_notes_numeric` / `show_photos_numeric` |
| `editShowNotesNumeric` / `editShowPhotosNumeric` | `true` | `edit_show_notes_numeric` / `edit_show_photos_numeric` |

- `schemas.ts` `configSchema` + `configDefaults.ts` `DEFAULT_CONFIG` / `DB_KEY_MAP` gain the four keys.
- No `SCHEMA_VERSION` bump (row-per-key config, lenient read).
- Backup needs no code change (raw config rows; legacy defaults fill the new keys).

## Files

| File | Change |
|------|--------|
| `src/database/schemas.ts` | 4 numeric booleans |
| `src/database/configDefaults.ts` | defaults + DB keys |
| `src/hooks/useItemDisplayFlags.ts` | **New** — `useItemDisplayFlags(numeric)` |
| `src/components/ItemRow.tsx` | read flags via the hook |
| `src/components/AddItemBar.tsx` | read flags via the hook |
| `src/components/ItemFormModal.tsx` | read flags via the hook |
| `src/screens/settings/PersonalizationScreen.tsx` | Standard / Numeric groups (four cards) |
| `src/i18n/en.ts`, `src/i18n/es.ts` | `settings_standard_lists`, `settings_numeric_lists` |

## UI

Personalization → *Lists screen*: the *Layout* card stays; then a **Standard lists** group (Item display + Edit item cards) and a **Numeric lists** group (same two cards), four cards total, reusing `OptionalFieldsCard`/`CheckboxRow`/`SettingsSection`.

## Tests

- `tests/helpers/configStub.ts` + template keys.
- `tests/database/schemas.test.ts` — accept/reject the new keys.
- `tests/database/dbDrift.test.ts` — `DB_KEY_MAP` includes the snake_case numeric keys.
- `tests/database/backup.test.ts` — numeric keys round-trip; legacy backup defaults them `true`.
- `tests/screens/settings/PersonalizationScreen.test.tsx` — 8 checkboxes; standard and numeric toggles write their keys.
- `tests/hooks/useItemDisplayFlags.test.ts` — kind selection + defaults.
- `tests/components/ItemRow.perKind.test.tsx` — numeric vs standard rows.
- `tests/components/AddItemBar.test.tsx`, `ItemFormModal.test.tsx` — kind-aware cases.

## Verification

`npm run test:all`; web 375px en/es (standard vs numeric lists, rows/add bar/edit modal per kind); rebuild the release APK.
