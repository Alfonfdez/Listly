# Tech Stack

## Languages and tools
- **React Native** (Expo managed workflow, SDK 57) — main framework for iOS and Android, also targeting web via `react-native-web`.
- **TypeScript** — strict mode, no `any`.
- **React Navigation** (native-stack + drawer) — screen navigation.
- **Drizzle ORM** — typed SQL query builder over a shared `DatabaseHandle` (no `drizzle-kit`, migrations stay on `PRAGMA user_version`).
- **Zod 4** — `src/database/schemas.ts` is the single source of truth for row shapes; types derive via `z.infer`; every stored row is validated at the storage boundary.
- **SQLite** (expo-sqlite) — local persistence on native. **sql.js (WASM) + IndexedDB** — the same SQLite schema and repositories on web.
- **@expo/vector-icons** (Ionicons) — icon library used throughout the app.
- **React Context** — global app state (AppContext, ConfigContext, ToastContext).
- **react-native-reanimated** (+ **react-native-worklets**) — animations and gesture-driven transitions.
- **react-native-gesture-handler** — gesture support (required by navigation, drawer, and drag-reorder).
- **react-native-sortables** — long-press drag-to-reorder for lists, items, and collections.
- **react-native-screens** / **react-native-safe-area-context** — native screen optimization and safe-area handling.
- **react-native-svg** — SVG rendering (custom color picker, web flag icons).
- **reanimated-color-picker** — the quick/custom color picker modal.
- **expo-image-picker** + **expo-file-system** — item photos (pick, copy to storage, clean up).
- **expo-sharing** + **expo-document-picker** + local **listly-share** module — backup export/import on native (true share-sheet outcome on iOS, public Downloads on Android).
- **expo-clipboard** — copying a list's contents to the clipboard.
- **expo-splash-screen** / **expo-status-bar** — startup splash and status-bar theming.
- **react-native-quick-crypto** (+ **react-native-nitro-modules**) — locked-list encryption (PBKDF2 key derivation + AES-256-GCM). Web uses `crypto.subtle`. **Requires a development/release build; not available in Expo Go.**

> Locked lists and the `listly-share` backup module both need a **native build** (`npx expo prebuild` + `npx expo run:android`/`run:ios`, or EAS). They are unavailable in Expo Go, where the app degrades gracefully (see `docs/locked-lists.md`).

## File structure (React Native with Expo project)

Listly code lives in the `ListlyApp/` subfolder. The repo root holds the SDD layer: `AGENTS.md`, `PROMPT.md`, `.agents/skills/`, `docs/`, and `spec/`.

```
ListlyApp/
+-- app.json                          <- Expo config (name, version, package, plugins)
+-- App.tsx                           <- main entry: DB init + splash + providers
+-- index.ts                          <- registerRootComponent + gesture-handler import
+-- tsconfig.json / package.json / metro.config.js
|
+-- modules/
|   +-- listly-share/                 <- local Expo module: share sheet + Android Downloads
|       +-- expo-module.config.json / package.json / src/index.ts
|       +-- android/ (build.gradle, AndroidManifest, res/xml, Kotlin module)
|       +-- ios/ (Swift module)
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
|   |   +-- ListDetailScreen.tsx      <- items, add/edit, photos, sort, batch, lock (003/011/012/020/022/027)
|   |   +-- CollectionDetailScreen.tsx <- collection detail (016)
|   |   +-- CreateListScreen.tsx / EditListScreen.tsx
|   |   +-- CreateCollectionScreen.tsx / EditCollectionScreen.tsx
|   |   +-- SettingsScreen.tsx        <- settings hub (005/015)
|   |   +-- settings/                 <- Appearance / Regional / Personalization / Data
|   |
|   +-- components/
|   |   +-- ListsView.tsx             <- shared grid/list body + select + sections + drop zones
|   |   +-- Tile.tsx / EntityTile.tsx / TypeBadge.tsx
|   |   +-- ItemRow.tsx / ItemFormModal.tsx / AddItemBar.tsx / QuantityStepper.tsx / CharCounter.tsx
|   |   +-- PhotoSection.tsx / PhotoViewer.tsx / NoteViewer.tsx
|   |   +-- EntityForm.tsx / ListForm.tsx / CollectionForm.tsx / IconGrid.tsx / KindSelectRow.tsx / CollectionSelectRow.tsx
|   |   +-- ColorGrid.tsx / ColorPickerModal.tsx
|   |   +-- LockListModal.tsx / VaultUnlockView.tsx / InfoModal.tsx   <- locked lists (027)
|   |   +-- SelectionActionBar.tsx / SelectSearchHeader.tsx / SelectToggleButton.tsx / SelectionCheck.tsx
|   |   +-- ConfirmModal.tsx / CollectionDeleteModal.tsx / AddChooserModal.tsx / PickerModal.tsx
|   |   +-- ListPickerModal.tsx / CollectionPickerModal.tsx
|   |   +-- ModalShell.tsx / ModalFooter.tsx / FullscreenViewer.tsx / FormField.tsx
|   |   +-- SearchBar.tsx / Fab.tsx / EmptyState.tsx / ScreenShell.tsx / NotFoundScreen.tsx
|   |   +-- SortablePressable.tsx / DrawerMenuButton.tsx / SectionTitle.tsx / RemoveFromCollectionTarget.tsx
|   |   +-- ErrorBoundary.tsx / Toast.tsx / DetailHeader.tsx
|   |   +-- componentStyles.ts / textStyles.ts
|   |   +-- settings/                 <- SettingsSection, SettingsRow, SettingsSelectRow, SettingsPickerRow,
|   |   |                              SelectorInline, OptionPickerModal, CheckboxRow, ConfirmWithTextModal,
|   |   |                              FlagIcon(.web), settingsStyles
|   |
|   +-- context/
|   |   +-- AppContext.tsx            <- lists/items/collections/vault state + refresh
|   |   +-- ConfigContext.tsx         <- user preferences (theme, language, layout), persisted
|   |   +-- ToastContext.tsx          <- transient error toast driven by the error bus
|   |
|   +-- database/
|   |   +-- database.ts               <- shared init + migrations (PRAGMA user_version, SCHEMA_VERSION 9)
|   |   +-- engine.ts / engine.web.ts <- native (expo-sqlite) / web (sql.js WASM) engine selection
|   |   +-- sqliteWeb.ts / storage/indexedDb.ts / wasm.d.ts
|   |   +-- types.ts                  <- DatabaseHandle + z.infer re-exports
|   |   +-- schemas.ts                <- Zod 4 schemas — single source of truth for row shapes (incl. vaults)
|   |   +-- validate.ts               <- parseRows / parseRowOrNull read-path validation
|   |   +-- configDefaults.ts         <- DEFAULT_CONFIG + DB_KEY_MAP + decodeConfigValue
|   |   +-- backup.ts / backupService.ts <- backup format + export/import (incl. encrypted vaults)
|   |   +-- constants.ts              <- DATABASE_NAME / DB_STORE_NAME
|   |   +-- drizzle/                  <- schema.ts, proxy.ts, engine.ts (serialized transactions)
|   |   +-- migrations/               <- 001_initial (canonical schema), 003_list_position, 004_item_pictures
|   |   +-- repositories/             <- listRepo, itemRepo, configRepo, collectionRepo, vaultRepo, shared
|   |
|   +-- i18n/
|   |   +-- index.ts                  <- t() / setLanguage / getLabels
|   |   +-- en.ts / es.ts             <- translations (9 languages planned)
|   |
|   +-- hooks/                        <- useFontSize, useLabels, useSelectMode, useSelectSearchHeader,
|   |                                   useDragOrder, useItemSort, useItemPhotos, useColorSelection,
|   |                                   useClipboardCopy, useMergeFlow, useItemEditing, useBatchItemActions,
|   |                                   useCollectionDropZones, useVaultSession, useRequiredContext, useResetOnOpen
|   |
|   +-- constants/
|   |   +-- themes.ts                 <- dark + light palettes (ColorPalette)
|   |   +-- types.ts                  <- shared types/limits (RootStackParamList, ListKind, IconName, MAX_*)
|   |   +-- languages.ts / listIcons.ts / listColors.ts / flagColors.ts / icons.ts / text.ts / shareResult.ts
|   |
|   +-- utils/
|       +-- formatters.ts / search.ts / validation.ts / color.ts / platform.ts / flags.ts / set.ts
|       +-- numeric.ts                <- integer-minor-unit money helpers (026)
|       +-- itemSort.ts / copyList.ts / errors.ts   <- sorting, clipboard text, error bus + ERROR_SCOPE
|       +-- itemPhotos.ts / fileIo.ts <- photo serialization + file-system seam
|       +-- backupIO.ts / backupIO.web.ts <- native share/downloads vs web Blob/file-input
|       +-- vaultCryptoCore.ts / vaultCrypto.ts / vaultCrypto.native.ts <- encryption core + platform branches (027)
|
+-- assets/
    +-- (icons, splash, adaptive-icon set, fonts, etc.)
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
- Crypto: locked-list keys are derived on demand and never persisted; native builds use `react-native-quick-crypto`, web uses `crypto.subtle`.
