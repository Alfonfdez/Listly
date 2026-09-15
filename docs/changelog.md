# Changelog — Listly

[2026-09-11] + | Repo scaffold
- Created the SDD scaffold mirroring the Finly project structure: AGENTS.md, PROMPT.md, docs/, spec/, .agents/skills/, .github/workflows/ci.yml.
- Added `opencode.jsonc` (gitignored, contains Context7 API key) and the secret-free `opencode.example.jsonc` template.
- Added `spec/constitution/` (1-mission, 2-tech-stack, 3-roadmap, 4-design-system, 5-validations, 6-screens, 7-platform-differences) defining the Listly MVP: local-first list manager (lists with name/color/icon, items with check/uncheck, per-list progress, search, per-item notes), offline-first via Drizzle ORM + Zod over SQLite (native) and sql.js/IndexedDB (web).
- Added pending feature specs `001-home-screen` and `002-db-design` (1-spec / 2-plan / 3-tasks each).
- Added 5 skills under `.agents/skills/`: changelog, document-concepts, style-guide (RN token palette + fs() scaling), frontend-design, verification-loop (Playwright MCP, port 8081).
- Added `docs/changelog.md`, `docs/git-commands.md`, `docs/harnesses.md`, `docs/programming-concepts.md`, `docs/assets.md`.
- Added guarded CI workflow (`.github/workflows/ci.yml`) that no-ops until `ListlyApp/` exists, then runs `npm run test:all` on PR/push to develop/main.
- Extended `.gitignore` with `opencode.jsonc` and `.playwright-mcp/`.

[2026-09-11] ~ | .github/workflows/ci.yml, docs/harnesses.md
- Fixed the CI guard: the "Check app exists" step now runs from the repo root (`working-directory: .`) instead of the missing `ListlyApp/` default folder, so scaffold-only runs no longer fail the job before the guard executes.
- Gated `setup-node` behind the same app-exists check to keep pre-app runs fully green (no npm cache lookup without a lock file).
- Updated the CI workflow note in `docs/harnesses.md` to document the real guard mechanism ("Check app exists" step with an `exists` output) instead of the stale `hashFiles` description.

[2026-09-12] + | ListlyApp app scaffold
- Created `ListlyApp/` (Expo SDK 57 blank-typescript, RN 0.86.3, React 19.2.3, TS ~6.0.3, vitest 5) pinning the same dependency set as FinlyApp.
- Added `src/` skeleton mirroring Finly: `constants/` (themes, types, languages), `utils/` (platform, language, formatters `scaleFontSize`), `hooks/useFontSize.ts`, `i18n/` (en/es + `t()`/`setLanguage`), `context/ConfigContext.tsx` (in-memory config stub with `activeColors`/`updateConfig`), `navigation/AppNavigator.tsx` (native-stack placeholder Home with themed NavigationContainer).
- Added app entry (`App.tsx` = ConfigProvider + StatusBar + splash handling, `index.ts`), `app.json` (Listly, com.listly.app, splash plugin), `tsconfig.json` (strict + verbatimModuleSyntax), `eslint.config.js` (expo flat), `vitest.config.mts` (happy-dom).
- Added scripts `test`/`test:watch`/`typecheck`/`lint`/`test:all` and first test (`tests/utils/formatters.test.ts`, 3 cases). `npm run test:all` green.
- CI auto-flips to run the real `test:all` now that `ListlyApp/package-lock.json` exists.

[2026-09-12] + | ListlyApp database layer (feature 002)
- Added core database layer under `src/database/`: `schemas.ts` (Zod 4 SSOT row shapes for lists/items/config, `checked` restricted to 0/1), `types.ts` (re-exports `z.infer` types + `DatabaseHandle`/`DatabaseRunResult`/`DatabaseBindValue`), `validate.ts` (`parseRows`/`parseRowOrNull` read-path validation), `configDefaults.ts` (`DEFAULT_CONFIG`, `DB_KEY_MAP`, `sanitizeConfig`, `toConfigRows`).
- Added platform engines `engine.ts` (expo-sqlite `openDatabaseSync`) / `engine.web.ts` (sql.js WASM persisted to IndexedDB), `sqliteWeb.ts` (`SqlJsDatabase` class with persist-on-commit), `storage/indexedDb.ts`, `wasm.d.ts`.
- Added `database.ts` (`getDatabase`/`initDatabase`) running transactional `PRAGMA user_version` migrations; migrations `001_initial.ts` (lists/items/config tables + 4 indexes + FK cascades) and `002_seed.ts` (`INSERT OR IGNORE` seed via `seedData.ts`: 6 lists, 19 items, fixed ids/colors/icons).
- Added Drizzle layer `drizzle/schema.ts` + `drizzle/proxy.ts` (sqlite-proxy over the shared `DatabaseHandle`) + `drizzle/engine.ts` (`getDrizzle`/`withTransaction`).
- Added repositories `repositories/listRepo.ts` (`list`/`get`/`create`/`update`/`delete`/`withCounts`/`existsByName`), `itemRepo.ts` (CRUD + `listByList`/`toggle`/`existsByName`), `configRepo.ts` (`get`/`save` with upsert), and `index.ts` (`listRepository`/`itemRepository`/`configRepository`).
- Added `dbTimestamp()`/`formatDateForDB()` to `src/utils/formatters.ts`, `metro.config.js` (wasm assetExts), and wired `initDatabase()` into `App.tsx` before render.
- Added database tests (6 files): `tests/database/sqliteMock.ts`, `contractTypes.ts`, `contractSuite.ts`, `listContract.test.ts`, `dbDrift.test.ts`, `schemas.test.ts`, plus formatters test additions. Suite baseline: 4 files, 41 tests, `npm run test:all` green.
- Verified web boot: Expo web starts, `initDatabase` seeds and persists to IndexedDB (`Listly.db`), reload boots from the persisted blob with 0 console errors.

[2026-09-12] ~ | docs/harnesses.md
- Updated suite baseline to 4 files / 41 tests and marked the pure-logic, DB contract, typecheck, lint, schema/validation, and bootstrap harness rows as "In use".

[2026-09-12] + | ListlyApp home screen (feature 001)
- Added app state `src/context/AppContext.tsx` (`lists`, `itemsByListId`, `loading`, `refresh`) loading `listRepo.withCounts()` + `itemRepo.listAll()`; `itemRepo` gained `listAll()`; `App.tsx` wraps the app in `<AppProvider>`.
- Added navigation rewrite `src/navigation/AppNavigator.tsx`: Drawer (Home, Lists→Home, Settings) + HomeStack, themed `CustomDrawerContent`, and a `HomeNavCapture` helper exposing the Home nav ref for the FAB/tiles.
- Added Home screen `src/screens/HomeScreen.tsx`: responsive 2+ column grid of tiles, toggleable client-side search (`src/utils/search.ts` `searchTerms`/`matchesAllTerms`/`filterListsByQuery`, AND across terms, matches list name + item names), loading state, empty state, FAB, refresh-on-focus via `useFocusEffect`.
- Added components: `ScreenShell` (SafeArea + themed bg), `DrawerMenuButton`, `SearchBar`, `Fab`, `EmptyState`, `ListCard` (icon, name, progress "N/total", 13% color-tinted card, radius 12), `ComingSoon`; shared constants in `componentStyles.ts` and `src/utils/color.ts` `withAlpha` (8-digit hex).
- Added placeholder screens `ListDetailScreen` / `CreateListScreen` / `SettingsScreen` ("coming soon"), `index.ts` imports `react-native-gesture-handler`; installed `@react-navigation/drawer`, `react-native-gesture-handler`, `react-native-reanimated`, `react-native-worklets`, `@testing-library/react-native`, `vitest-native`.
- Added i18n keys to en/es (`coming_soon`, `nav_home`/`nav_lists`/`nav_settings`, `home_add`, `home_open_menu`, `home_search_toggle`, `home_search_placeholder`, `home_no_results`, `home_empty`, `home_empty_hint`, `home_progress`) — all new texts via `t()`.
- Fixed `withAlpha` returning an opaque CSS alpha (was writing a 0–255 byte into the 0–1 rgba slot, making the "subtle" tile tint fully solid); now returns `#RRGGBBAA`, verified visually.
- Added tests (search pure logic, color util, ListCard component, HomeScreen with config/app stubs, RN test harness via vitest-native + `@expo/vector-icons` mock). Suite baseline: 8 files, 67 tests, `npm run test:all` green.
- Verified in-browser at 375px with the verification-loop skill (seeded grid, tile tint/radius/progress, search filter by item name, no-results + restore, FAB→Create List, emptied-DB empty state with FAB visible, drawer navigation). All 8 acceptance criteria pass; 1-spec `[x]`, roadmap 001 → done.

[2026-09-12] + | ListlyApp list detail screen (feature 003)
- Fixed `withAlpha` header color usage (name now uses `list.color` instead of base text, matching the spec).
- Added `src/utils/validation.ts` (`validateItemName` → `item_name_required`/`item_name_duplicate`/`item_name_max`, `uniqueNormalizedNames`) with pure-logic tests.
- Added i18n keys to en/es (`item_add_placeholder`, `item_add`, `item_empty`, `item_empty_hint`, `item_edit_title`, `item_name_label`, `item_note_label`, `item_save`, `item_delete`, `item_confirm_delete`, `item_name_required`, `item_name_duplicate`, `item_name_max`) — all new texts via `t()`.
- Added components `ItemRow` (checkbox toggle with accessibility state, strikethrough + secondary name when done, note indicator, edit button) and `ItemFormModal` (name + note with live validation, Save disabled unless valid, Delete with in-modal confirm).
- Rewrote `src/screens/ListDetailScreen.tsx`: in-screen header (color-tinted icon badge, name in list color, "N/total" + progress bar), FlatList of items ordered by position, inline bottom add input (appends at `position = max + 1`, empty/duplicate rejected), edit/delete via modal, EmptyState, refresh-on-focus.
- Added tests (validation util, ItemRow component, ListDetailScreen screen flows with userEvent). Suite baseline: 11 files, 89 tests, `npm run test:all` green.
- Verified in-browser at 375px with the verification-loop skill (header name color/progress bar fill 40%, note indicator, row toggle → 3/5 + fill 60%, add Tea appended at end with input cleared, duplicate + empty rejection messages, edit rename + note, delete-with-confirm removed the row, emptied-list empty state with add input visible). All 7 acceptance criteria pass; 1-spec `[x]`, roadmap 003 → done.

[2026-09-13] + | ListlyApp create list screen (feature 004)
- Added `src/constants/listIcons.ts` (`LIST_ICONS`, 16 Ionicons names) and `src/constants/listColors.ts` (`LIST_COLORS`, 12 theme-agnostic hexes) — fills the shared picker constants the design system references.
- Added `validateListName(value, exists, maxLength)` to `src/utils/validation.ts` (`list_name_required`/`list_name_max`/`list_name_duplicate`) with pure-logic tests.
- Added i18n keys to en/es (`create_list_title`, `list_name_label`, `list_color_label`, `list_icon_label`, `list_create`, `list_name_required`, `list_name_duplicate`, `list_name_max`) — all new texts via `t()`.
- Rewrote `src/screens/CreateListScreen.tsx`: in-screen heading + name field (`maxLength` 100, live validation), inline icon + color grids with preselected defaults and highlight on selection, debounced (`DEBOUNCE_MS`) `existsByName` duplicate check with race-guard, Create button disabled until the name is valid, and on submit `listRepo.create` → `refresh()` → `goBack()` with a final duplicate re-check.
- Added tests (list-name validation, CreateListScreen flows with debounce). Suite baseline: 12 files, 101 tests, `npm run test:all` green.
- Verified in-browser at 375px with the verification-loop skill (FAB → form with defaults, Create disabled until a valid name, selection highlighting moves, empty error clears, case-insensitive duplicate 'groceries' rejected after the debounce, create returns to Home and shows a 'Weekend Planning, 0/0' tile with the selected cart icon and yellow tint). All 6 acceptance criteria pass; 1-spec `[x]`, roadmap 004 → done.

[2026-09-13] + | ListlyApp create-list color picker (feature 006)
- Installed `reanimated-color-picker@^5.1.3` + `react-native-svg@15.15.4` (Finly-parity; reanimated/worklets/gesture-handler already present).
- Added `MODAL_BORDER_RADIUS` (16) + `OVERLAY_BG` to `componentStyles`; added `QUICK_COLORS` (6 hexes) to `src/constants/listColors.ts`.
- Ported Finly picker machinery: `ModalShell` (transparent fade modal card ≤360/max-70%, optional shadow), `ModalFooter` (round Cancel/Confirm footer), `ColorGrid` (quick colors + custom circle + "+" trigger), `ColorPickerModal` (`Panel1`/`HueSlider`/`OpacitySlider`/`Preview`, temp color committed only on OK), hooks `useColorSelection` (tracks `customColor`) + `useResetOnOpen` (re-seed on open).
- Rewired `CreateListScreen` color section from the 12-color grid to `ColorGrid` + modal; default stays `QUICK_COLORS[0]`; create uses the selected (possibly custom) hex.
- Added i18n keys en/es (`color_picker_title`, `color_picker_cancel`, `color_picker_ok`, `color_grid_more`).
- Added tests: `ColorGrid` (selection state, custom circle, trigger), `ColorPickerModal` (OK applies, Cancel discards, seed-on-open) with a `reanimated-color-picker` vi.mock, and CreateListScreen quick/custom-color + modal flows. Suite baseline: 14 files, 111 tests, `npm run test:all` green.
- Verified in-browser at 375px with the verification-loop skill (6 quick colors + "+"; selected circle 3px border checkmark; "+" opens the picker pre-seeded `#22d3ee`; hue-slider drag → `#ee6022`, OK applies and renders a custom circle; Cancel discards a drag; create 'Weekend Planning' shows tile icon `rgb(238,96,34)` + tint `rgba(238,96,34,0.13)` on Home; modal uses surface/text/primary tokens). All 6 acceptance criteria pass; 1-spec `[x]`, roadmap 006 → done.

[2026-09-13] + | ListlyApp home & navigation polish (feature 007)
- Centered the FAB: absolute `alignSelf: 'center'` + `bottom: 56` (was bottom-right).
- Added per-screen header icon + title: `HeaderTitle` now takes `icon`; screens get `home-outline`/Home, `list-outline`/Lists, `checkbox-outline`/`list_detail_title` (ListDetail), `add-circle-outline`/Create list, `settings-outline`/Settings.
- Added `Lists` to `RootStackParamList` + a new `ListsScreen` route; `ListsNavCapture` mirrors `HomeNavCapture`; drawer reset now targets Home or Lists by name; Home and Lists keep the drawer `headerLeft`, others keep the back arrow.
- Extracted `ListsView` (shared search + FlatList body) with a `variant: 'grid' | 'list'`: Home stays the 2/3/4-column grid via `ListCard`, the new Lists screen renders full-width `ListRow`s (icon badge + name + progress); new i18n key `list_detail_title` (en/es).
- Added `tests/screens/ListsScreen.test.tsx` (rows/progress, search, FAB + row navigation, empty state, text-size scaling). Suite baseline: 15 files, 118 tests, `npm run test:all` green.
- Verified in-browser at 375px with the verification-loop skill (FAB centerX 187.5 = viewport center at bottom 56 on Home and Lists; headers icon+title on all 5 screens; Lists shows 6 full-width 351px stacked rows; row → Travel Plan ListDetail header 'List detail'; ListRows search filters to the single matching row; Settings header title fs 17 / weight 600 / text `rgb(30,41,59)`). All 6 acceptance criteria pass; 1-spec `[x]`, roadmap 007 → done.

[2026-09-13] + | ListlyApp add-item note area (feature 008)
- `ListDetailScreen` add bar now has a chevron `Toggle note` button between the name input and "Add": tapping it expands/collapses a multiline note `TextInput` (max `MAX_ITEM_NOTE_LENGTH`) below, with the chevron rotating 180° when open.
- `submitAdd` passes `note: newNote.trim() || null`; after a successful add both fields clear and the note area collapses. Name validation (empty/duplicate) is unchanged.
- Added i18n key `item_add_note_toggle` (en/es); the note field reuses `item_note_label`.
- Added ListDetailScreen tests (toggle expand/collapse, add with note, clear + collapse after add). Suite baseline: 15 files, 121 tests, `npm run test:all` green.
- Verified in-browser at 375px with the verification-loop skill (Toggle note reveals the field with chevron rotated `matrix(-1,0,0,-1)`; 'Almond milk' + 'refrigerated, 1L' added → note icon on the row and 'refrigerated, 1L' in the edit modal; 'Tomatoes' with no note → empty note field; after submit name cleared, note area collapsed, chevron back to none; note input uses surface `rgb(241,245,249)`/border `rgb(226,232,240)`/text `rgb(30,41,59)`/fs 15 matching the name input). All 6 acceptance criteria pass; 1-spec `[x]`, roadmap 008 → done.

[2026-09-14] ~ | ListlyApp DB + home reorder tests (feature 009)
- Fixed the two screen suites (`tests/screens/HomeScreen.test.tsx`, `tests/screens/ListsScreen.test.tsx`) breaking after the sortables integration: added `vi.mock('expo-sqlite', () => ({ openDatabaseSync: vi.fn() }))` — `ListsView` imports the database directly, which dragged the real `expo-sqlite → expo-modules-core` TypeScript under node_modules that the vitest-native engine refuses to strip.
- Added `tests/mocks/react-native-sortables.tsx` (light `Sortable.Grid` renderer + hollow pass-through components) and wired it into `vitest.config.mts` via `resolve.alias` — the real package drags the reanimated/worklets native-module crash (`loadUnpackers`), so the alias keeps unit tests on the mock while the Playwright loop covers the real grid.
- Suite baseline: 15 files, 123 tests, `npm run test:all` green.

[2026-09-14] ~ | ListlyApp grid-item press routing (fix web drag-to-reorder navigating)
- `ListCard`/`ListRow` (sortable grid items) used react-native `TouchableOpacity`; on web the react-native-web press is outside the RNGH gesture system, so releasing a mouse drag still fired `onPress` → navigation into the list.
- Added `src/components/SortablePressable.tsx` wrapping `Sortable.Touchable`: `onPress` → `onTap` (RNGH tap composited with the drag gesture, so a real drag cancels the tap), pressed-opacity feedback via `onTouchesDown`/`onTouchesUp`, and `accessible`/`accessibilityRole="button"`/`accessibilityLabel` passthrough. Swapped `ListCard` and `ListRow` from `TouchableOpacity` to it.
- Updated `tests/mocks/react-native-sortables.tsx` so the mock `Touchable` renders a `Pressable` forwarding `onTap` from `onPress` (fireEvent.press tests keep working).
- Suite baseline: 15 files, 123 tests, `npm run test:all` green. Verified on web at 375px (verification-loop): tile and row taps navigate to ListDetail; long-press drags reorder on Home grid and Lists rows without navigating; new order persists across reload; 0 console errors.

[2026-09-14] + | Feature 010 — bulk select/delete + header search
- Added `listRepo.deleteMany(ids)` and `itemRepo.deleteMany(ids)` (single transaction, no-op on empty) with contract tests; interfaces extended in `tests/database/contractTypes.ts`.
- Added `src/hooks/useSelectMode.ts` (select-mode state: enter/toggle/exit, delete-confirm visibility, `confirmDelete` delegating to `deleteMany`), `src/components/ConfirmModal.tsx` (composed of `ModalShell` + `ModalFooter`) and `src/components/SelectionActionBar.tsx` (count + cancel + delete).
- `ListsView` rewritten: search toggle moved out to `headerRight`, external search/select state, sort disabled in select mode or with an active query, FAB hidden + `SelectionActionBar` shown in select mode, `ConfirmModal` for bulk delete.
- `ListCard`/`ListRow` gained select-mode props (highlight + checkmark badge, long-press) via `SortablePressable.onLongPress`; `ItemRow` gained the same and hides the edit button in select mode.
- `HomeScreen`/`ListsScreen` own search state and `useSelectMode`; set a `headerRight` search toggle via `navigation.setOptions` (tinted primary when active, cleared in select mode). `ListDetailScreen` + `ItemFormModal` handle item select mode with the same action bar + confirm modal.
- i18n: new keys in `en.ts`/`es.ts` (`common_search`, `common_no_results`, `select_selected`, `select_delete`, `select_enter_mode`, `select_exit_mode`, `select_delete_lists_confirm/message`, `select_delete_items_confirm/message`).
- Tests: new `tests/component/ListsView.test.tsx` (search filter, no-results, select toggle, action bar, confirm dialog, nav, long-press); screen tests assert `headerRight` wiring; contract suite covers `deleteMany` no-op/empty and multi-row. Suite baseline: 16 files, 136 tests, `npm run test:all` green.
- Verified on web at 375px (verification-loop): header search toggle open/close + tinted icon; long-press enters select mode with action bar and FAB hidden; toggle + bulk delete lists (2 → confirm dialog → gone, exits select mode); item select mode hides add bar, bulk delete items updates progress; Spanish keys present; 0 console errors.

[2026-09-14] ~ | Feature 010 — header select toggle (Finly parity)
- Added `src/components/SelectToggleButton.tsx` (`checkbox-outline` / `close-outline`, `select_enter_mode`/`select_exit_mode` a11y labels) and `src/components/SelectSearchHeader.tsx` (row with select toggle + search toggle) mirroring Finly's `SelectSearchHeader`.
- `HomeScreen`/`ListsScreen` `headerRight` now renders `SelectSearchHeader`: select toggle shown when `lists.length > 0`, goes `close-outline` (exits select mode) via the existing `useSelectMode.toggleSelectMode`; removed the effect that blanked `headerRight` in select mode.
- `ListDetailScreen` sets a `headerRight` `SelectToggleButton` gated on `items.length > 0` (item select mode enter/exit from the header).
- Long-press entry for lists and items is retained as an alternative to the header icon.
- Tests: new `tests/component/SelectToggleButton.test.tsx`; screen tests assert the header renders both toggles (select hidden when empty) and that pressing the select toggle calls `toggleSelectMode`. Suite baseline: 17 files, 145 tests, `npm run test:all` green.
- Verified on web at 375px (verification-loop): select icon visible next to search on Home/Lists and in ListDetail header when data exists; tap enters select mode (action bar + FAB/add-bar hidden), header flips to close icon and exits; long-press still enters select mode; 0 console errors.

[2026-09-14] ~ | Feature 010 — select-mode refinements + item search
- `ListRow` no longer hides the list icon in select mode: the icon badge stays and selection is shown via a corner check badge (grid `ListCard` already kept its icon).
- Long-press no longer enters list select mode: it is reserved for drag-reorder (sortable activation) on Home grid and Lists rows, per Finly behavior. Select mode on lists is entered only via the header select toggle; item rows in `ListDetail` (not sortable) keep long-press entry. Removed `onLongPressItem` from `ListsView` and `onLongPress` from `ListCard`/`ListRow` props.
- `ListDetailScreen` header now shows the search toggle beside the select toggle via `SelectSearchHeader`; tapping it opens an inline `SearchBar` that filters items by name or note (`filterItemsByQuery`, case-insensitive AND) with a `home_no_results` empty state. Added `item_search_placeholder` key (en/es) and removed `home_search_toggle` (header search button now uses `common_search`).
- Tests: removed the lists long-press→select test; added `filterItemsByQuery` unit tests and a ListDetail header search+select test; screen tests assert the neutral `Search` label. Suite baseline: 17 files, 149 tests, `npm run test:all` green.
- Verified on web at 375px (verification-loop): list icons stay visible on Lists rows during select mode; long-pressing/start-drag on Lists rows and Home tiles reorders without entering select mode; ListDetail header shows Search + Enter-select-mode, search filters items (e.g. "hotel" → only "Reserve hotel") and shows the no-results state; item select mode still works from the header; 0 console errors.

[2026-09-15] ~ | Destructive actions use a red background
- `SelectionActionBar` delete button switched from an outlined red button to a solid `c.red` background (white icon/text) when enabled; the disabled (0 selected) state stays gray.
- `ModalFooter` gained a `destructive` prop (red confirm background); `ConfirmModal` now forwards its (previously unused) `destructive` prop, and the bulk-delete confirm dialogs in `ListsView`/`ListDetailScreen` pass `destructive`. Non-destructive modals (color picker OK) keep the primary color.
- ItemFormModal single-item delete confirm was already solid red — unchanged.
- Verified on web at 375px (verification-loop): select-mode Delete button and the delete-confirmation dialog's Delete button both show `rgb(220, 38, 38)` red background with white text; 0 console errors.

[2026-09-15] + | Feature 011 — item pictures (max 3 per item)
- Installed `expo-image-picker ~57.0.16` and `expo-file-system ~57.0.6` (Finly-parity, Expo SDK 57).
- DB: added migration `src/database/migrations/004_item_pictures.ts` (idempotent `ALTER TABLE items ADD COLUMN pictures TEXT` appended at the end of the row, `SCHEMA_VERSION` → 4); Drizzle `items.pictures` nullable text and Zod `itemSchema.pictures: z.string().nullable()` as the last key (order matches physical columns for the db-drift test).
- Added `src/utils/itemPhotos.ts` (`parseItemPhotos` tolerating legacy scalar values, `serializeItemPhotos`, `itemPhotoFileName`, `deleteItemPhotos`) with lazy `expo-file-system` import so DB tests never load the native module; `src/hooks/useItemPhotos.ts` (take photo native-only, gallery pick copying to the document directory on native vs base64 `data:` URLs on web, remove, `setPhotos` reset).
- `itemRepo` create/update persist `pictures`; `delete`/`deleteMany` gather pics then clean files (helper `deletePhotosOf`); `listRepo.delete`/`deleteMany` clean item photos before the cascade (`deletePhotosOfItems` via `inArray`); `seedData.ts` types slimmed to `Omit<Item, 'created_at' | 'pictures'>`.
- Components: `PhotoSection` (80×80 thumbnails, dashed "Add photo" box hidden at `MAX_ITEM_PICTURES`=3, per-photo remove → `ConfirmModal` destructive "Delete this photo?", source `ModalShell` with Take photo [native] / Add from gallery / Cancel); `PhotoViewer` (full-screen modal + Close, `common_close`); `ItemRow` thumbnail strip (36×36, tap → viewer, hidden in select mode); `ItemFormModal` (`initialPhotos` prop, section under Note, resets on open).
- ListDetailScreen: `useItemPhotos` for the add flow (`newPhotos` + `setNewPhotos([])` after submit), PhotoSection under the Note input inside the expanded details area, edit modal pre-loaded via `parseItemPhotos(editing.pictures)`; details toggle relabeled to "Toggle details" (also es "Alternar detalles").
- i18n en/es: `item_photos_title/add/take/gallery/remove/remove_confirm/remove_message`.
- Tests: pictures contract round-trips in `contractSuite.ts` + `listContract` runs migration 004; `dbDrift` expects `pictures` last + user_version 4; `PhotoSection.test.tsx`, `tests/utils/itemPhotos.test.ts` (hoisted `MockFile`), ItemRow thumbnails, ListDetail add-with-photos/update-with-photos/edit-modal-photos flows with `useItemPhotos` mocked. Suite baseline: 19 files, 173 tests, `npm run test:all` green.
- Verified on web at 375px (verification-loop): details toggle reveals Note + Photos; gallery uploads (base64) up to 3 photos; add box hidden at 3; row thumbnail strip with full-screen viewer + Close; edit modal shows Photos under Note; removal confirm "Delete this photo?"; thumbnails persist after reload; camera capture native-only (not checkable on web). 0 console errors.

[2026-09-15] ~ | Fix Android photo-copy crash on add photo (camera/gallery)
- Root cause: `TypeError: Cannot read property 'reload' of undefined` (caught in `useItemPhotos.ts`) came from the unguarded `window.location.reload()` in `expo/src/async-require/hmr.ts` (SDK 57, expo/expo#48932), which runs whenever a Metro split bundle loads while the HMR socket is disconnected. The lazy `await import('expo-file-system')` in `copyPhotoToStorage` and `deleteItemPhotos` compiled to an async-require split-bundle load, triggering it on native (Expo Go) — `window.location` is undefined there without a polyfill. Web never crashed because `window.location` exists in browsers.
- Fixed by removing the dynamic imports: added `src/utils/fileIo.ts` as the expo-file-system seam and switched `useItemPhotos.ts` (copy) and `itemPhotos.ts` (delete) to static top-level imports, so no `import()` reaches Metro's async-require machinery at photo time.
- `copyPhotoToStorage` now awaits the copy result: `await new File(src).copy(destFile, { overwrite: true })` — `copy`/`move` are async (return a Promise) in expo-file-system 57, so the destination URI is only returned after the file is fully copied and tick-collision overwrites don't throw.
- Vitest: `fileIo` re-exports the mocked `expo-file-system` (existing per-file mock in `itemPhotos.test.ts` still wins locally); a benign global `expo-file-system` mock (`tests/database/fileSystemMock.ts`, registered in `vitest.config.mts` setupFiles) keeps DB/component tests that load the repos from touching the real native module.
- Re-verified `npm run test:all` (typecheck + lint + 19 files, 173 tests) green; native camera/gallery behavior pending Android re-test by the developer.

[2026-09-15] + | Feature 008 refinement — item note preview + char counters
- `ItemRow` now shows a 2-line clipped (`numberOfLines={2}`) preview of the item's note below the name when a note exists (hidden in select mode); the preview is a Pressable (`item_note_preview` a11y label, en "View note" / es "Ver nota") that opens the new full-note `NoteViewer` modal.
- Added `src/components/NoteViewer.tsx` mirroring `PhotoViewer` (transparent fade Modal, dark overlay, scrollable card with the full note, top-right Close button reusing `common_close`) and `src/components/CharCounter.tsx` (`{current}/{max}`, `fs(11)`, right-aligned, red at max via `c.red`).
- ListDetailScreen add bar: name input wrapped in a flex `nameColumn` with a live `CharCounter` under it; the note input (expanded details area) got its own counter too (max `MAX_ITEM_NOTE_LENGTH`). ItemFormModal (edit item) shows the same counters under Name and Note.
- Tests: ItemRow note-preview + viewer-open flow; ListDetailScreen name counter updates / red at max (`darkColors.red`), note counter `0/2000` inside details, edit-modal counters (`4/200`, `10/2000`), note preview → viewer. Suite baseline: 19 files, 180 tests, `npm run test:all` green. NoteViewer content stays mounted in the RN test tree after `visible=false` (fade-out), so tests assert the press fires rather than disappearance.