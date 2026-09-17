# 005 - Settings screen

- **Objective**
  Turn the placeholder Settings screen into a real preferences and data-management hub: appearance (theme, text size), regional (language), personalization (list layout, item visibility), and data (export/import backup, delete all lists, factory reset). Mock/seed data is removed so a fresh install starts empty.

---

## Functional requirements

### 1. Config layer
- `Config` gains three keys persisted through the existing `config` table and `DB_KEY_MAP`: `listLayout` (`grid` | `list`, DB key `list_layout`), `showNotes` (boolean, DB key `show_notes`), `showPhotos` (boolean, DB key `show_photos`).
- Boolean values are stored as strings and decoded back with `decodeConfigValue` before Zod validation, so `configSchema` stays strict (`z.boolean()`).
- `ConfigContext` writes through `configRepo.save(partial)` on every change (optimistic update + rollback on error) and exposes `reload()`.
- Defaults: `listLayout: 'grid'`, `showNotes: true`, `showPhotos: true`.

### 2. Single Settings screen with four sections
- **Appearance**: Theme (Light / Dark / System) and Text size (Small / Medium / Large), each an inline selector.
- **Regional**: Language (English / Español).
- **Personalization**: a *Lists* card with the layout selector (Grid / List) and an *Item display* card with the `Show notes` and `Show photos` toggles.
- **Data**: `Export data`, `Import data`, `Delete all lists`, `Factory reset` rows; destructive rows use the red token.
- Values are read from `config` and every change is persisted immediately through `updateConfig`.
- The screen is a single scroll inside `ScreenShell`; no sub-screens.

### 3. Shared settings components
- New `src/components/settings/`: `settingsStyles.ts`, `SettingsSection.tsx` (title + optional card), `SettingsSelectRow.tsx` (label + inline selector), `SelectorInline.tsx` (single-select segmented control with `Option<T>` = `{ label, value, icon? }`), `ToggleRow.tsx` (label + toggle icon), `SettingsRow.tsx` (icon + label/description + chevron/`onPress`).
- All components use theme tokens, `fs()` scaling, and accessibility roles/labels.

### 4. Personalization effects
- The chosen list layout drives both `HomeScreen` and `ListsScreen` (both wrap `ListsScreenBase`, which reads `config.listLayout` and passes it as the `ListsView` variant).
- `showNotes` hides the note indicator, note preview, and note field (item form) everywhere.
- `showPhotos` hides the thumbnail strip and the photo section (item form) everywhere.
- Hidden note/photo values are preserved (not wiped) when saving an item.

### 5. Backup format and IO
- `src/database/backup.ts`: `BACKUP_FORMAT_VERSION = 1`; snapshot `{ app: 'Listly', kind: 'backup', formatVersion, exportedAt, schema, data: { lists, items, config } }`; `buildBackup` reads all rows ordered by position; `applyBackup` replaces all three tables inside one transaction; `parseBackup`/`serializeBackup`; `BackupValidationError` codes `invalid_json` | `invalid_format` | `newer_version`.
- `src/database/backupService.ts`: `exportBackup()` serializes a snapshot at the current `SCHEMA_VERSION`; `importBackup(json)` rejects `schema > SCHEMA_VERSION` with `newer_version` and otherwise applies the snapshot.
- `src/utils/backupIO.ts` (native): writes `listly-backup-YYYY-MM-DD.json` in the document directory and shares it (`expo-sharing`); imports via `expo-document-picker`.
- `src/utils/backupIO.web.ts`: downloads a Blob via an anchor; imports via a hidden `<input type="file">` with a focus fallback when the picker is cancelled.
- `backupFileName()` lives in `src/utils/formatters.ts`.

### 6. Data actions
- `clearDataKeepSettings()` deletes all items and lists (and their photo files) but keeps settings.
- `resetDatabase()` additionally deletes all config rows, restoring defaults.
- After import/reset the screen refreshes app data (`useApp().refresh`) and reloads config (`ConfigContext.reload`).
- Feedback uses an inline status message (success/error), not a native alert, so it is verifiable on web. Confirmation modals gate import, delete-all, and factory reset.

### 7. Drawer separator and seed removal
- The drawer shows a separator between `Lists` and `Settings`.
- Seed data is removed: `migrations/002_seed.ts` and `seedData.ts` are deleted and the `currentVersion < 2` migration step dropped; fresh databases start empty. `SCHEMA_VERSION` stays 4 and existing databases (user_version >= 2) are unaffected.

---

## Non-functional requirements

- **TypeScript strict**, no `any`; theme tokens + `fs()` everywhere.
- **Multilingual**: all new strings exist in both `en` and `es`.
- **Dependencies**: adds `expo-sharing` and `expo-document-picker`.
- **Tests**: `SettingsScreen` (sections, preference writes, toggles, export/import/cancel/validation/invalid/newer, delete-all, factory reset, cancel); `backup` format + service + reset helpers; contract/dbDrift/schema tests updated for an empty seed and the new config keys; `ItemRow` visibility tests; list layout test.
- **Verification**: web loop at 375px - switch theme/text size/language/layout, toggle notes/photos, export and re-import a backup, delete all lists, factory reset, with 0 console errors.
- **Known limitation**: native item-photo file URIs are not portable across devices (web base64 data URLs are); documented, not blocking.

---

## Acceptance criteria

- [x] Settings renders the Appearance, Regional, Personalization, and Data sections with themed controls.
- [x] Theme, text size, language, and list layout selections persist and take effect across the app.
- [x] `Show notes` / `Show photos` hide notes and photos everywhere and survive a reload.
- [x] The list layout setting changes how lists render on both Home and Lists.
- [x] Export downloads/shares a valid `listly-backup-YYYY-MM-DD.json` and reports success.
- [x] Import restores lists, items, and config after confirmation and reports success.
- [x] An invalid or newer-version backup is rejected with a specific message and no data change.
- [x] Delete all lists removes lists/items but keeps settings; factory reset also restores defaults.
- [x] A fresh install (and the app after reset) starts with no lists or items.
- [x] The drawer shows a separator between Lists and Settings.
- [x] `npm run test:all` passes.
