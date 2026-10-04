# 005 — Settings screen: Plan

## Architecture

```
AppDrawer
└── Main (HomeStack)
    ├── Home / Lists / ListDetail / CreateList ...
    └── Settings (route) → SettingsScreen (single scroll, ScreenShell)
```

Settings is a single scrollable screen with four `SettingsSection` cards — Appearance, Regional, Personalization, Data — each reading from `ConfigContext` and persisting immediately via `updateConfig` → `configRepo.save`. No sub-screens yet (the hub/sub-screen split arrives in 015).

## Data model

- `Config` gains `listLayout` (`grid` | `list`, DB key `list_layout`), `showNotes` / `showPhotos` (booleans, DB keys `show_notes` / `show_photos`).
- Booleans are stored as strings and decoded with `decodeConfigValue` before Zod validation, so `configSchema` stays strict (`z.boolean()`).
- `ConfigContext` persists each change (optimistic + rollback) and exposes `reload()`.
- Defaults: `listLayout: 'grid'`, `showNotes: true`, `showPhotos: true`.

## Components

| Component | Location | Change |
|-----------|----------|--------|
| `SettingsScreen` | `src/screens/SettingsScreen.tsx` | **Rewritten** — four sections, single scroll |
| `settingsStyles` | `src/components/settings/settingsStyles.ts` | **New** — shared section/card styles |
| `SettingsSection` | `src/components/settings/SettingsSection.tsx` | **New** — title + optional card |
| `SettingsSelectRow` | `src/components/settings/SettingsSelectRow.tsx` | **New** — label + inline selector |
| `SelectorInline` | `src/components/settings/SelectorInline.tsx` | **New** — segmented control (`Option<T>`) |
| `ToggleRow` | `src/components/settings/ToggleRow.tsx` | **New** — label + toggle icon |
| `SettingsRow` | `src/components/settings/SettingsRow.tsx` | **New** — icon + label/description + chevron |
| `backup.ts` / `backupService.ts` | `src/database/` | **New** — snapshot format + import/export |
| `backupIO.ts` / `backupIO.web.ts` | `src/utils/` | **New** — native share/pick vs web Blob/file input |

## Navigation

- `Settings` already exists in `RootStackParamList` (from 001); the screen content is replaced. No new routes.

## i18n

Full `settings_*` block in en/es (`settings_title`, `settings_appearance`, `settings_theme`, `theme_dark/light/system`, `settings_text_size`, `size_small/medium/large`, `settings_regional`, `settings_language`, `settings_personalization`, `settings_data`, `settings_export_data`, `settings_import_data`, `settings_delete_all`, `settings_factory_reset`, plus success/error and confirm strings, `settings_import_action`).

## Data flow

- Appearance/Regional/Personalization rows call `updateConfig(partial)` → `configRepo.save` + optimistic state.
- Data rows: `exportBackup()` (serialize snapshot) / `importBackup(json)` (validate + replace), `clearDataKeepSettings()` / `resetDatabase()`; after import/reset, `useApp().refresh()` + `ConfigContext.reload()`.
- Feedback is an inline status message (`accessibilityRole="alert"`), not a native alert, so it is web-verifiable.

## Risks / notes

- Seed removal: deleting `migrations/002_seed.ts` + `seedData.ts` and the `currentVersion < 2` step keeps `SCHEMA_VERSION` 4; existing DBs (`user_version >= 2`) are unaffected.
- Backup must be transactional and reject `schema > SCHEMA_VERSION` with a distinct `newer_version` message.
- Keep `ItemRow` note/photo visibility gated behind `showNotes` / `showPhotos` while preserving hidden values on save.
