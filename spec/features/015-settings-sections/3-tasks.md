# 015 — Settings sections: Tasks

- [x] Create `spec/features/015-settings-sections/` (1-spec, 2-plan, 3-tasks).
- [x] Restructure `SettingsScreen` into a hub (Appearance / Regional / Personalization / Data) navigating to four new stack routes.
- [x] Config split: `listLayout` → `homeLayout` (grid) + `listsLayout` (list); add `editShowNotes` / `editShowPhotos`; ignore legacy `list_layout`.
- [x] Sub-screens: `AppearanceScreen` (icons + "A" glyphs, height-normalized), `RegionalScreen` (LANGUAGE header + flag dropdown), `PersonalizationScreen` (three cards + checkboxes), `DataScreen` (moved flows + typed factory reset).
- [x] Components: `SettingsPickerRow`, `OptionPickerModal`, `CheckboxRow`, `FlagIcon`/`FlagIcon.web`, `ConfirmWithTextModal`; `ConfirmModal` gains `children` + `confirmDisabled`.
- [x] Personalization effects: `HomeScreen`/`ListsScreen` use `homeLayout`/`listsLayout`; `ItemRow`/`ItemFormModal` gate note/photo fields.
- [x] i18n keys in en/es; `useLabels()` reactive language.
- [x] Tests: hub navigation, each sub-screen, checkbox rows, language picker temp-selection, item-form gating, typed factory reset; dbDrift/schema/backup updated. `npm run test:all` green.
- [x] Verification loop at 375px (four sub-screens, icons + heights, LANGUAGE header + flag dropdown, three cards, independent layouts, typed DELETE reset, reactive language, 0 console errors) + flip acceptance criteria `[x]`.
- [x] Update roadmap (015 → done), harnesses baseline, changelog (append at end).
