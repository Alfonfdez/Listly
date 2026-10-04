# 015 — Settings sections: Plan

## Architecture

```
SettingsScreen (hub: Appearance / Regional / Personalization / Data)
├── SettingsAppearance   (Theme, Text size)
├── SettingsRegional     (Language dropdown)
├── SettingsPersonalization (Home layout, Lists layout, Item display, Edit item)
└── SettingsData         (export / import / delete-all / factory reset)
```

Settings becomes a hub with four stack sub-screens. Config is split so Home and Lists layout preferences are independent, and visibility options are scoped to the list-detail rows vs the edit-item modal.

## Data model

- `listLayout` replaced by `homeLayout` (default `grid`, key `home_layout`) + `listsLayout` (default `list`, key `lists_layout`).
- New booleans `editShowNotes` / `editShowPhotos` (default `true`, keys `edit_show_notes` / `edit_show_photos`).
- `showNotes` / `showPhotos` remain and scope to the list-detail item rows only; legacy `list_layout` is ignored on read.

## Components

| Component | Location | Change |
|-----------|----------|--------|
| `SettingsScreen` | `src/screens/SettingsScreen.tsx` | Hub with four `SettingsRow`s |
| `AppearanceScreen` / `RegionalScreen` / `PersonalizationScreen` / `DataScreen` | `src/screens/settings/` | **New** sub-screens |
| `SettingsPickerRow` | `src/components/settings/SettingsPickerRow.tsx` | **New** — label + bordered value box + chevron |
| `OptionPickerModal` | `src/components/settings/OptionPickerModal.tsx` | **New** — radio list, temp selection, Select/Cancel |
| `CheckboxRow` | `src/components/settings/CheckboxRow.tsx` | **New** — checkbox + label |
| `FlagIcon` / `FlagIcon.web` | `src/components/settings/` | **New** — emoji vs SVG flag |
| `ConfirmWithTextModal` | `src/components/settings/ConfirmWithTextModal.tsx` | **New** — typed confirmation |
| `ConfirmModal` | `src/components/ConfirmModal.tsx` | Gains `children` + `confirmDisabled` |

## Navigation

- `RootStackParamList` gains `SettingsAppearance`, `SettingsRegional`, `SettingsPersonalization`, `SettingsData` (all `undefined`); registered in `AppNavigator` with titles + icons.

## i18n

New keys en/es: `settings_language_picker_title`, `settings_home_screen`, `settings_lists_screen`, `settings_edit_item`, `settings_optional_fields`, `settings_notes`, `settings_photos`, `settings_factory_reset_confirm_hint(word)`; removed `settings_lists`, `settings_show_notes/photos`, `settings_edit_notes/photos`. All labels read via `useLabels()` (reactive to the configured language).

## Data flow

- Each sub-screen reads `config` and persists via `updateConfig`.
- `HomeScreen` → `ListsScreenBase` with `homeLayout`; `ListsScreen` → `listsLayout`.
- `ItemRow` gates note/photo UI behind `showNotes` / `showPhotos`; `ItemFormModal` behind `editShowNotes` / `editShowPhotos`.
- Factory reset requires typing `DELETE` (`FACTORY_RESET_CONFIRMATION`).

## Risks / notes

- Reactive language: `useLabels()` subscribes to the config so switching language re-renders every mounted label without a reload.
- Flags use SVG on web (Windows can't render flag emoji); unit tests must not load `react-native-svg`.
