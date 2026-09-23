# 015 - Settings sections

- **Objective**
  Restructure Settings into a Finly-style hub with dedicated sub-screens (Appearance, Regional, Personalization, Data), separate Home/Lists layout preferences, visibility options scoped to the list-detail rows vs the edit-item modal, and a typed "DELETE" confirmation for the factory reset.
- **Finly parity** (refinement): Appearance options carry icons, Regional is a flag dropdown with Cancel/Select, Personalization groups its optional fields as checkboxes.

---

## Functional requirements

### 1. Settings hub and navigation
- `SettingsScreen` becomes a hub listing four rows — Appearance, Regional, Personalization, Data — each with an icon and chevron.
- New stack routes `SettingsAppearance`, `SettingsRegional`, `SettingsPersonalization`, `SettingsData` (all `undefined`) are added to `RootStackParamList` and registered in `AppNavigator` (titles + icons; default back arrow).
- Each hub row navigates to its sub-screen.

### 2. Config layer
- `listLayout` is replaced by two keys: `homeLayout` (default `grid`) and `listsLayout` (default `list`), DB keys `home_layout` / `lists_layout`.
- New booleans `editShowNotes` and `editShowPhotos` (default `true`), DB keys `edit_show_notes` / `edit_show_photos`, gating the edit-item modal.
- `showNotes` / `showPhotos` remain and now scope to the list-detail item rows only.
- The legacy `list_layout` row is no longer mapped and is ignored on read.

### 3. Appearance screen
- Sections Theme and Text size, each an inline selector (`SelectorInline`), persisted through `updateConfig`.
- Theme options carry an icon and are ordered Dark, Light, System; Text size options carry an "A" glyph sized to each step (Small/Medium/Large).
- Every inline selector button is height-normalized, so the Theme and Text size rows are the same height (a fixed icon slot + a fixed glyph line-height keep the "A" from inflating its button).

### 4. Regional screen
- A `LANGUAGE` section header sits above the language row (uppercase via `settingsStyles.sectionTitle`), and the picker row itself renders the label `Language` (first letter only, not uppercased).
- Language is a dropdown: `SettingsPickerRow` renders the label above a bordered select box showing the current language + chevron, and opens `OptionPickerModal`.
- The picker lists every language with its flag icon and its name in that language; tapping an option only highlights it (temporary selection) and the modal applies it on **Select** or discards it on **Cancel**.
- Flags are emoji on native and the `react-native-svg` fallback on web (Windows browsers cannot render flag emoji).

### 5. Personalization screen
- *Home screen* card: Layout selectors for Collections (`homeCollectionsLayout`) and Lists (`homeListsLayout`).
- *Collections screen* section: a Layout selector bound to `collectionsLayout`.
- *Collection detail* section (directly under *Collections screen*): a Layout selector bound to `collectionDetailLayout` (grid/list) for the lists inside a collection.
- *Lists screen* header (no outer card) followed by three separate surface cards with no divider lines — *Layout* (bound to `listsLayout`), *Item display* and *Edit item* — each of the latter two with the subtitle *Optional fields* and Notes / Photos checkboxes. The *Item display* / *Edit item* titles share the *Layout* label's font size and style (`fs(15)`, weight 600).
- The Item display checkboxes are bound to `showNotes` / `showPhotos`; the Edit item checkboxes to `editShowNotes` / `editShowPhotos`.

### 6. Data screen
- Export data / Import data / Delete all lists / Factory reset rows, inline status message, and the existing confirmation flows move from the old Settings screen.
- Delete all lists keeps a single confirmation.
- Factory reset uses a second modal that requires typing `DELETE` (`FACTORY_RESET_CONFIRMATION`); the confirm button stays disabled until the input matches exactly.

### 7. Personalization effects
- `HomeScreen` renders `ListsScreenBase` with `homeLayout`; `ListsScreen` uses `listsLayout`.
- `CollectionDetailScreen` passes `collectionDetailLayout` to its `ListsView` variant (grid cards or full-width rows).
- `ItemRow` hides the note/photo UI when `showNotes` / `showPhotos` are off; `ItemFormModal` hides its note/photo fields when `editShowNotes` / `editShowPhotos` are off.

### 8. Components
- `SettingsPickerRow.tsx` (label + bordered value box + chevron) and `OptionPickerModal.tsx` (title, radio list with optional leading icons, temporary selection, Cancel + Select footer).
- `CheckboxRow.tsx` (checkbox icon + label) for optional-field options; `FlagIcon.tsx` (native emoji) / `FlagIcon.web.tsx` (react-native-svg) with colors in `constants/flagColors.ts`.
- New `ConfirmWithTextModal.tsx` requires typing a confirmation word; `ConfirmModal` gains optional `children` and `confirmDisabled` props.

---

## Non-functional requirements

- **TypeScript strict**, no `any`; theme tokens + `fs()` everywhere.
- **Multilingual**: all new strings exist in both `en` and `es`. Labels are read through `useLabels()`, which subscribes to the config, so changing the language re-renders every mounted label (screens, headers, drawer) without a reload.
- **Tests**: hub navigation, each sub-screen (including the separate layout keys and both option groups), the checkbox rows, the language picker temporary selection + Select/Cancel, item-form gating, and the typed factory-reset modal; DB drift/schema/backup tests updated for the new config keys.
- **Verification**: web loop at 375px — navigate the four sub-screens, check the Appearance icons and that all inline selector buttons share one height, confirm the Regional `LANGUAGE` header + `Language` label and the flag dropdown, check the three background-separated Personalization cards (no dividers), switch layouts independently, select/cancel languages in the flag dropdown, toggle both option groups, and confirm the typed factory reset, with 0 console errors.

---

## Acceptance criteria

- [x] Settings opens as a hub of Appearance, Regional, Personalization and Data, and each row opens its screen.
- [x] Appearance shows icons next to the Theme options (Dark, Light, System) and an "A" glyph next to each Text size, and both selectors persist.
- [x] Every inline selector button shares the same height across the Theme and Text size rows.
- [x] Regional shows an uppercase `LANGUAGE` header above the `Language` label, and the language trigger is a bordered dropdown; the picker shows flags + native names and applies on Select / discards on Cancel.
- [x] Home and Lists layouts are stored and applied separately (defaults Grid for Home, List for Lists).
- [x] Personalization nests Item display / Edit item under Lists screen with "Optional fields" checkboxes; the Lists-screen Layout, Item display and Edit item groups are three separate background cards with no divider lines, and the group titles match the Layout label size/style; Item display affects only the list-detail rows and Edit item only the edit-item modal.
- [x] Changing the language updates every visible label (Settings hub, headers, drawer, sub-screens) without reloading or reopening the app.
- [x] Data keeps export/import/delete-all, and factory reset requires typing DELETE in a second modal.
- [x] `npm run test:all` passes.
