# 005 — Settings screen: Tasks

- [x] Create `spec/features/005-settings-screen/` (1-spec, 2-plan, 3-tasks).
- [x] Config: add `listLayout` / `showNotes` / `showPhotos` keys + `decodeConfigValue`; `ConfigContext` persists each change (optimistic + rollback) and exposes `reload()`.
- [x] Shared settings primitives under `src/components/settings/`: `settingsStyles`, `SettingsSection`, `SettingsSelectRow`, `SelectorInline`, `ToggleRow`, `SettingsRow`.
- [x] Rewrite `SettingsScreen` as a single scroll with Appearance / Regional / Personalization / Data sections (destructive rows use `c.red`).
- [x] Personalization effects: `ListsScreenBase` reads `config.listLayout`; `ItemRow` / `ItemFormModal` gate note/photo UI behind `showNotes` / `showPhotos` (values preserved on save).
- [x] Backup: `backup.ts` (`BACKUP_FORMAT_VERSION = 1`, `buildBackup` / `applyBackup` / `parseBackup` / `serializeBackup` / `BackupValidationError`), `backupService.ts`, `backupIO.ts` (native) + `backupIO.web.ts`, `backupFileName()`.
- [x] Data actions: `clearDataKeepSettings()` + `resetDatabase()` in `database.ts`; inline status feedback; confirmation modals gate import/delete-all/factory-reset.
- [x] Drawer separator between Lists and Settings; remove `migrations/002_seed.ts` + `seedData.ts` and the `currentVersion < 2` step.
- [x] i18n `settings_*` keys in en/es; add `expo-sharing` + `expo-document-picker` (app.json plugins).
- [x] Tests: `SettingsScreen` (12), `backup`, `backupFileName`, `ItemRow` visibility, list-layout, dbDrift/schemas/contract reseeded to empty seed. `npm run test:all` green.
- [x] Verification loop at 375px (sections, theme/text size/language/layout persistence, notes/photos toggles, export + re-import, invalid/newer rejection, delete-all, factory reset, empty fresh install, drawer separator, 0 console errors) + flip acceptance criteria `[x]`.
- [x] Update roadmap (005 → done), harnesses baseline, changelog (append at end).
