# Tech Stack

## Languages and tools
- **React Native** (Expo managed workflow, SDK 57) — main framework for iOS and Android, also targeting web via `react-native-web`.
- **TypeScript** — strict mode, no `any`.
- **React Navigation** (native-stack + drawer) — screen navigation.
- **Drizzle ORM** — typed SQL query builder over a shared `DatabaseHandle` (no `drizzle-kit`, migrations stay on `PRAGMA user_version`).
- **Zod 4** — `src/database/schemas.ts` is the single source of truth for row shapes; types derive via `z.infer`; every stored row is validated at the storage boundary.
- **SQLite** (expo-sqlite) — local persistence on native. **sql.js (WASM) + IndexedDB** — the same SQLite schema and repositories on web.
- **@expo/vector-icons** (Ionicons) — icon library used throughout the app.
- **React Context** — global app state (AppContext + ConfigContext).
- **react-native-reanimated** (+ **react-native-worklets**) — animations and gesture-driven transitions.
- **react-native-gesture-handler** — gesture support (required by navigation, drawer, and drag-reorder).
- **react-native-sortables** — long-press drag-to-reorder for lists, items, and collections.
- **react-native-screens** / **react-native-safe-area-context** — native screen optimization and safe-area handling.
- **react-native-svg** — SVG rendering (custom color picker, web flag icons).
- **reanimated-color-picker** — the quick/custom color picker modal.
- **expo-image-picker** + **expo-file-system** — item photos (pick, copy to storage, clean up).
- **expo-sharing** + **expo-document-picker** — backup export/import on native.
- **expo-splash-screen** / **expo-status-bar** — startup splash and status-bar theming.

## File structure (React Native with Expo project)

Listly code lives in the `ListlyApp/` subfolder. The repo root holds the SDD layer: `AGENTS.md`, `PROMPT.md`, `.agents/skills/`, `docs/`, and `spec/`.

```
ListlyApp/
+-- app.json                          <- Expo config (name, version, package, plugins)
+-- App.tsx                           <- main entry: DB init + splash + providers
+-- index.ts                          <- registerRootComponent + gesture-handler import
+-- tsconfig.json
+-- package.json
|
+-- src/
|   +-- navigation/
|   |   +-- AppNavigator.tsx          <- Drawer + native-stack, drawer content, header titles/icons
|   |
|   +-- screens/
|   |   +-- HomeScreen.tsx            <- lists + collections overview (001/016)
|   |   +-- ListsScreen.tsx           <- standalone lists (list layout)
|   |   +-- CollectionsScreen.tsx     <- collections-only screen (016)
|   |   +-- ListsScreenBase.tsx       <- shared Home/Lists/Collections orchestration
|   |   +-- ListDetailScreen.tsx      <- items, add/edit, photos, reorder (003/011/012)
|   |   +-- CollectionDetailScreen.tsx <- collection detail (016)
|   |   +-- CreateListScreen.tsx / EditListScreen.tsx
|   |   +-- CreateCollectionScreen.tsx / EditCollectionScreen.tsx
|   |   +-- SettingsScreen.tsx        <- settings hub (015)
|   |   +-- settings/                 <- Appearance / Regional / Personalization / Data
|   |
|   +-- components/
|   |   +-- ListsView.tsx             <- shared grid/list body + select + sections
|   |   +-- ListCard.tsx / ListRow.tsx / CollectionCard.tsx / CollectionRow.tsx / TypeBadge.tsx
|   |   +-- ItemRow.tsx / ItemFormModal.tsx / PhotoSection.tsx / PhotoViewer.tsx / NoteViewer.tsx / CharCounter.tsx
|   |   +-- ListForm.tsx / CollectionForm.tsx / ColorGrid.tsx / ColorPickerModal.tsx
|   |   +-- SelectionActionBar.tsx / SelectSearchHeader.tsx / SelectToggleButton.tsx / SelectionCheck.tsx
|   |   +-- ConfirmModal.tsx / CollectionDeleteModal.tsx / AddChooserModal.tsx
|   |   +-- ModalShell.tsx / ModalFooter.tsx / FullscreenViewer.tsx / FormField.tsx
|   |   +-- SearchBar.tsx / Fab.tsx / EmptyState.tsx / ScreenShell.tsx / SortablePressable.tsx / DrawerMenuButton.tsx
|   |   +-- componentStyles.ts / textStyles.ts
|   |   +-- settings/                 <- SettingsSection, SettingsSelectRow, SettingsRow, SettingsPickerRow,
|   |   |                              SelectorInline, OptionPickerModal, CheckboxRow, ConfirmWithTextModal,
|   |   |                              FlagIcon(.web), settingsStyles
|   |
|   +-- context/
|   |   +-- AppContext.tsx            <- lists/items/collections state + refresh
|   |   +-- ConfigContext.tsx         <- user preferences (theme, language, layout), persisted
|   |
|   +-- database/
|   |   +-- database.ts               <- shared init + migrations (PRAGMA user_version)
|   |   +-- engine.ts                 <- native engine (expo-sqlite)
|   |   +-- engine.web.ts             <- web engine (sql.js WASM) + IndexedDB
|   |   +-- sqliteWeb.ts / storage/indexedDb.ts / wasm.d.ts
|   |   +-- types.ts                  <- DatabaseHandle + z.infer re-exports
|   |   +-- schemas.ts                <- Zod 4 schemas — single source of truth for row shapes
|   |   +-- validate.ts               <- parseRows / parseRowOrNull read-path validation
|   |   +-- configDefaults.ts         <- DEFAULT_CONFIG + DB_KEY_MAP + decodeConfigValue
|   |   +-- backup.ts / backupService.ts <- backup format + export/import
|   |   +-- drizzle/                  <- schema.ts, proxy.ts, engine.ts
|   |   +-- migrations/               <- 001_initial, 003_list_position, 004_item_pictures
|   |   +-- repositories/             <- listRepo, itemRepo, configRepo, collectionRepo
|   |
|   +-- i18n/
|   |   +-- index.ts                  <- t() / setLanguage / getLabels
|   |   +-- en.ts                     <- English translations
|   |   +-- es.ts                     <- Spanish translations
|   |
|   +-- hooks/                        <- useFontSize, useSelectMode, useDragOrder, useLabels,
|   |                                   useItemPhotos, useColorSelection, useResetOnOpen
|   |
|   +-- constants/
|   |   +-- themes.ts                 <- dark + light palettes (ColorPalette)
|   |   +-- types.ts                  <- shared types (RootStackParamList, ListLayout, IconName)
|   |   +-- languages.ts / listIcons.ts / listColors.ts / flagColors.ts
|   |
|   +-- utils/
|       +-- formatters.ts / search.ts / validation.ts / color.ts / platform.ts
|       +-- itemPhotos.ts / fileIo.ts <- photo serialization + file-system seam
|       +-- backupIO.ts / backupIO.web.ts <- native share/pick vs web Blob/file-input
|
+-- assets/
    +-- (icons, fonts, etc.)
```

## Design
See **`4-design-system.md`** for colors, typography, icons, and layout conventions.

## Code conventions
- English content, English code.
- Naming: camelCase for variables and functions, PascalCase for components and types.
- Mobile-first: all components designed for touch screens.
- Clean code with single-responsibility components.
- i18n: all user-facing strings go through the translation system (i18n/).
- Persistence: one SQLite engine on all platforms — expo-sqlite on native, sql.js (WASM) + IndexedDB on web — selected per platform by `engine.ts` / `engine.web.ts`. Repositories are written with Drizzle over the shared `DatabaseHandle`.