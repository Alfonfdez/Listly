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

[2026-09-16] + | Feature 012 — drag-to-reorder items
- Perf/UX: item drag-reorder in ListDetailScreen mirroring the lists pattern — `Sortable.Grid` (1 column) inside the existing ScrollView, long-press activation via `SortablePressable` on `ItemRow` (replaces the plain Pressable root; also removes the old long-press→select-mode behavior, feature 010).
- Data: new `itemRepo.reorder(listId, orderedIds)` persists the new order atomically (transaction, `position` assigned in order, scoped to the given list); `ContractItemRepo.reorder` + contract test in `contractSuite.ts`.
- Guards: `sortEnabled = !selectMode && query === '' && items.length > 1` on item rows; `ListsView` gained the same count-guard (`lists.length > 1`) for lists. Reordering is disabled with <2 rows or while a search query is active.
- Spec: created `spec/features/012-reorder-items/`; updated `spec/features/010-bulk-select-delete/` (item long-press is now drag-only, select mode stays behind the header toggle); roadmap gained `## 012-reorder-items` (Status: in progress).
- Tests: increased the `react-native-sortables` mock with `lastGrid()`/`fireGridDragEnd()`; ItemRow/ListDetailScreen reorder tests (drag-end persists via `itemRepo.reorder`, disabled with a single item / while a search query is active); `useCallback`/hook-order fix in ListDetailScreen triggered by the new hooks. Suite baseline: 19 files, 184 tests, `npm run test:all` green.
- Fix: `itemRepo.listAll()` (the read path `AppContext.loadAll` uses) had no `ORDER BY position`, so a dragged item order reverted to insertion order on any DB re-read (reload / navigate-away-and-back) — verified on web. Added `.orderBy(position, id)` and extended the contract test asserting `listAll` returns the reordered items. Suite baseline after fix: 19 files, 184 tests, `npm run test:all` green.
[2026-09-16] ~ | Fix item-row tap isolation (edit / note / photo)
- Tapping an item's edit button, note preview, or photo thumbnail also toggled Done/Undone because those controls were RN Pressables nested inside the row-level SortablePressable (RNGH tap) - both actions fired on the same tap.
- Fixed in ItemRow.tsx by converting the three interactive controls from Pressable to SortablePressable (Sortable.Touchable) so RNGH child-priority lets the inner tap win and the outer row toggle fails; outer SortablePressable keeps onPress={onToggle}; checkbox untouched.
- Tests: added "does not toggle when tapping the note preview / a photo thumbnail" to ItemRow.test.tsx (note-via-text and photo-via-role presses assert onToggle is never called); reordered so the double-press isolation test stays last to dodge a RNTL/mock quirk where two presses on a SortablePressable in one test poison the next test's render. Suite baseline: 19 files, 186 tests, 
pm run test:all green.

[2026-09-16] ~ | Hide search/select header on Home when there are no lists
- HomeScreen always rendered SelectSearchHeader (search + select icons) even with an empty list set, mirroring the bug ListDetailScreen had for items.
- Fixed in HomeScreen.tsx: headerRight is registered only when lists.length > 0 (otherwise undefined), so an empty Home shows neither search nor select - consistent with the ListDetailScreen empty-state pattern.
- Tests: HomeScreen.test.tsx empty-state case now asserts headerRight is undefined (no search, no select) instead of expecting Search to remain visible.

[2026-09-16] ~ | Differentiate ListDetail empty-state icon
- The "No items yet" empty state on ListDetailScreen used the same generic list-outline icon as the "No lists yet" states on Home/Lists, making the two empty screens hard to tell apart.
- EmptyState gained an optional color prop (falls back to the theme textSecondary) and ListDetailScreen now renders the list's own icon in the list's color (list.icon as IconName, list.color) when a list has no items - matching the header badge for that list while Home/Lists keep the default gray list-outline.
- Verified on web at 375px: an empty Travel Plan list shows its cyan airplane icon (distinct from Home's gray list-outline), console 0 errors. Suite unchanged: 19 files, 186 tests, `npm run test:all` green.

[2026-09-16] ~ | Hide search/select header on Lists screen when there are no lists
- The Lists screen always registered SelectSearchHeader, so its Search icon stayed visible with an empty list set (the select icon was already hidden via showSelect).
- Fixed in ListsScreen.tsx: headerRight is now registered only when lists.length > 0 (otherwise undefined), matching HomeScreen.
- Test: ListsScreen.test.tsx empty-state case now asserts the last setOptions has headerRight undefined (no search, no select) instead of expecting Search to remain visible. Verified on web at 375px (with a list the icons appear; without lists they do not), console 0 errors. Suite unchanged: 19 files, 186 tests, `npm run test:all` green.

[2026-09-16] + | Feature 013 - edit list (name, icon, color)
- New `ListForm` component extracted from `CreateListScreen` (name input + live char counter, icon grid, color grid + custom color picker, debounced duplicate-name validation, submit button); `CreateListScreen` is now a thin wrapper over it and keeps its exact behavior.
- New `EditListScreen` (route `EditList: { listId: number }`): finds the list and pre-fills `name`/`icon`/`color`, passes the list id as `excludeId` to `listRepo.existsByName` so a list keeps its own name, saves via `listRepo.update(listId, { name, icon, color })` + refresh + goBack; a missing id renders the existing not-found empty state.
- Entry point: pencil button at the right edge of the List detail header block (ListDetailScreen headerRow, `create-outline`, a11y label `list_edit_label`) navigates to `EditList` for the current list; always available and independent of item select/search modes.
- Wiring: `AppNavigator` registers the screen (title `edit_list_title`, `create-outline` icon); `EditList: { listId: number }` added to `constants/types.ts`; i18n keys `edit_list_title`, `list_edit_label`, `list_save` added to en/es.
- Spec: created `spec/features/013-edit-list/`; roadmap gained `## 013-edit-list` (Status: in progress, flipped to done after verification).
- Tests: new `EditListScreen.test.tsx` (prefill, max-length cap, same-name save excludes self via `existsByName(name, id)`, duplicate-name rejection blocks save, save + goBack, not-found state); `ListDetailScreen.test.tsx` pencil navigates to `EditList` with `{ listId }`. Suite baseline: 20 files, 193 tests, `npm run test:all` green.
- Verified on web at 375px: pencil opens the pre-filled edit screen; saving name/icon/color changes ("Groceries Express" / airplane / #F472B6) updates the List detail header (name, badge and empty-state icon all render pink #F472B6); another list's name shows the duplicate error and blocks Save; saving without changes succeeds and returns; console 0 errors.

[2026-09-17] ~ | Feature 014 - code-quality refactor (behavior-preserving)
- Dead code: removed `src/utils/language.ts`, `LIST_COLORS` (`QUICK_COLORS` kept), `useSelectMode.enterSelectMode` (+ its header/test wiring), the unused `useColorSelection` returns, and dead `ItemRow` styles.
- Tokens: `componentStyles.ts` now owns overlay/viewer backgrounds, shadows, pressed/disabled opacity, icon-button padding, selection-check size/radius, alpha tint/selected/badge/track levels, grid gap and the responsive breakpoints; inline `#FFFFFF`/rgba/literal radii replaced across `ModalShell`/`Fab`/`SearchBar`/`SelectToggleButton`/`SelectSearchHeader`/`ListForm`/`ItemFormModal`/`ListDetailScreen`/`ListCard`/`ListRow`/`ItemRow`/`ColorGrid`/`PhotoSection`/`NoteViewer`/`PhotoViewer`/`ListsView`/`SelectionActionBar`/`ColorPickerModal`. Convention: on-primary text uses `c.background` (`WHITE` kept on fixed dark overlays + user swatches).
- Primitives: new `SelectionCheck` (ItemRow/ListCard/ListRow), `FullscreenViewer` (NoteViewer/PhotoViewer wrappers), `FormField` (ListForm/ItemFormModal label+error), `ListsScreenBase({ variant })` (Home/Lists become thin wrappers) and `useDragOrder` (ListsView/ListDetailScreen keep their `sortEnabled` guards and no-op-if-unchanged semantics); `ItemFormModal` rewritten on `ModalShell` (3-action footer + inline confirm kept).
- Types/naming: single `Config` (`database/types.ts`) + `DEFAULT_CONFIG` (`database/configDefaults.ts`) consumed by `ConfigContext`; i18n `Translations`/`LanguageId` with a typed `Record<LanguageId, Translations>` map; `ItemRow` role is a plain `"checkbox"`; `proxy.ts` handles `values`/`all` explicitly (no silent `default`).
- Tests: moved `tests/component/*` → `tests/components/*` and the stubs → `tests/helpers/`, updated `vitest.config.mts` setupFiles + imports; new `SelectionCheck.test.tsx`, `FullscreenViewer.test.tsx`, `FormField.test.tsx`, `useDragOrder.test.ts`. Suite baseline: 24 files, 206 tests, `npm run test:all` green. `docs/harnesses.md` baseline/layout updated.
- Spec: created `spec/features/014-code-quality/`; roadmap gained `## 014-code-quality` (Status: done after verification).
- Verified on web at 375px with the verification-loop skill: seeded Home grid, Lists rows, List detail (header/checkboxes/note preview), item edit modal (FormField label/input/counter spacing), note viewer (FullscreenViewer close), create + edit list forms (labels/icon/color grids), select mode (SelectionCheck checkmarks, "1 selected" bar), and a live pointer drag that reordered items (Bananas → first) and persisted across navigation; console 0 errors. All 7 acceptance criteria pass.

[2026-09-17] + | Feature 005 - settings screen
- Config: `Config` gains `listLayout` (`grid` | `list`, DB key `list_layout`), `showNotes` / `showPhotos` (booleans, DB keys `show_notes` / `show_photos`); `configDefaults.ts` extended with `CONFIG_VALUE_KINDS` + `decodeConfigValue` so booleans round-trip as strings and `configSchema` stays strict; `ConfigContext` persists each change via `configRepo.save` (optimistic + rollback) and exposes `reload()`.
- Settings screen (`src/screens/SettingsScreen.tsx`) rewritten as a single scroll in `ScreenShell` with Appearance (Theme, Text size), Regional (Language), Personalization (Lists layout; Item display Show notes / Show photos) and Data (Export, Import, Delete all lists, Factory reset) sections; new `src/components/settings/` primitives (`settingsStyles.ts`, `SettingsSection`, `SettingsSelectRow`, `SelectorInline`, `ToggleRow`, `SettingsRow`).
- Personalization effects: `ListsScreenBase` reads `config.listLayout` (Home/Lists are prop-less wrappers); `ItemRow` and `ItemFormModal` gate note/photo UI behind `showNotes` / `showPhotos` while still preserving hidden values on save.
- Backup: new `src/database/backup.ts` (`BACKUP_FORMAT_VERSION = 1`; snapshot `{ app, kind, formatVersion, exportedAt, schema, data: { lists, items, config } }`; `buildBackup` / `applyBackup` transactional replace; `parseBackup` / `serializeBackup`; `BackupValidationError` `invalid_json` | `invalid_format` | `newer_version`) plus `backupService.ts` (`exportBackup` / `importBackup`); `src/utils/backupIO.ts` native (expo-sharing + expo-document-picker, `listly-backup-YYYY-MM-DD.json`) and `backupIO.web.ts` (Blob download + hidden file input); `backupFileName()` in `formatters.ts`.
- Data actions: `clearDataKeepSettings()` (items/lists + photo files, settings kept) and `resetDatabase()` (also clears config → defaults) in `database.ts`; feedback is an inline status message (`accessibilityRole="alert"`, green/red) instead of a native alert so it is web-verifiable; import / delete-all / factory-reset are gated by `ConfirmModal` (import confirm uses the distinct `settings_import_action` label).
- Seed removal: deleted `migrations/002_seed.ts` + `seedData.ts` and dropped the `currentVersion < 2` seed step; `SCHEMA_VERSION` stays 4 and existing DBs (`user_version >= 2`) are unaffected, fresh installs start empty. Drawer shows a separator between Lists and Settings (`DrawerItemDef` union).
- Deps: added `expo-sharing` + `expo-document-picker` (`app.json` plugins updated). i18n: full `settings_*` block in en/es (incl. `settings_import_action`).
- Tests refactored/added: `tests/helpers/fixtures.ts` (`buildList` / `buildItem` / `seedFixtures`) + contract suite reseeded to fixtures, `backup.test.ts`, `SettingsScreen.test.tsx` (12), `ItemRow` visibility tests, `backupFileName`, list-layout test, `dbDrift`/`schemas` updated for the empty seed and new config keys. Suite baseline: 26 files, 233 tests, `npm run test:all` green.
- Verified on web at 375px with the verification-loop skill from a fresh IndexedDB: Settings renders all four sections; Theme/Dark, Text size/Large, Language/es and Layout/List persist across reload and switch both Home and Lists to full-width rows; Show notes/photos off hide the row note + item-form Note/Photos (and the hidden note value survives a save + reload → re-enabling shows "Sin lactosa"); Export downloads a valid `listly-backup-2026-09-17.json` (app/kind/formatVersion 1/schema 4/data.lists+items+config) with a green success message; Import of that file (after renaming the list to "Cambiada") restores the original name/items/config after confirmation; an invalid file and a `schema: 999` file are each rejected with their specific red message and no data change; Delete all lists empties the app while keeping theme/language/layout; Factory reset empties the app and restores Theme/System, Medium, English, Grid, toggles on; fresh install and post-reset start empty; drawer shows a 1px separator between Lists and Settings; 0 console errors (only the pre-existing `props.pointerEvents` deprecation warning). All 11 acceptance criteria pass; 1-spec `[x]`, roadmap 005 → done.

[2026-09-17] + | Feature 015 - settings sections
- Settings restructured into a hub: `SettingsScreen` now renders four `SettingsRow`s (Appearance / Regional / Personalization / Data) that navigate to new stack routes `SettingsAppearance`, `SettingsRegional`, `SettingsPersonalization`, `SettingsData` (added to `RootStackParamList` and registered in `AppNavigator` with titles + icons).
- New sub-screens under `src/screens/settings/`: `AppearanceScreen` (Theme, Text size via `SelectorInline`), `RegionalScreen` (language dropdown), `PersonalizationScreen` (Home screen layout, Lists screen layout, Item display, Edit item) and `DataScreen` (export/import/delete-all/factory-reset + status + confirmations, moved out of the old single Settings scroll).
- Config split: dropped `listLayout` in favour of `homeLayout` (default `grid`, key `home_layout`) + `listsLayout` (default `list`, key `lists_layout`); added `editShowNotes` / `editShowPhotos` (default true, keys `edit_show_notes` / `edit_show_photos`). `showNotes` / `showPhotos` now scope to the list-detail item rows (`ItemRow`) while the new pair gates `ItemFormModal`; the legacy `list_layout` row is unmapped and ignored.
- New components: `src/components/settings/SettingsPickerRow.tsx` (label + value + chevron), `src/components/settings/OptionPickerModal.tsx` (radio list; tap applies and closes) and `src/components/settings/ConfirmWithTextModal.tsx` (typed confirmation); `ConfirmModal` gained optional `children` + `confirmDisabled`. Factory reset requires typing `DELETE` (`FACTORY_RESET_CONFIRMATION` in `constants/types.ts`); delete-all keeps a single confirm.
- Wiring: `ListsScreenBase` takes `layoutKey: 'homeLayout' | 'listsLayout'` (`HomeScreen` passes `homeLayout`, `ListsScreen` passes `listsLayout`).
- i18n en/es: added `settings_language_picker_title`, `settings_home_screen`, `settings_lists_screen`, `settings_edit_item`, `settings_edit_notes`, `settings_edit_photos` and `settings_factory_reset_confirm_hint(word)`; removed `settings_lists`.
- Tests: rewrote `tests/screens/SettingsScreen.test.tsx` (hub navigation), added `tests/screens/settings/{AppearanceScreen,RegionalScreen,PersonalizationScreen,DataScreen}.test.tsx` and `tests/components/ItemFormModal.test.tsx`, updated `tests/database/{schemas,backup,dbDrift}.test.ts`, `tests/screens/ListsScreen.test.tsx` and `tests/helpers/configStub.ts`. Suite baseline: 31 files, 244 tests, `npm run test:all` green.
- Verified on web at 375px with the verification-loop skill from a fresh IndexedDB: hub shows Appearance/Regional/Personalization/Data and each row opens its screen; Appearance Theme/Dark + Text size/Large select inline; Regional opens the "Select language" dropdown, picking Español applies (drawer becomes Inicio/Listas/Ajustes) and closes the modal, picking English reverts; Personalization defaults Grid (Home) / List (Lists) and changing them to List/Grid swaps the rendered widths independently (Home 351px rows vs Lists 170px tiles); Show notes off hides the row note preview while the edit modal keeps its Note field, and Edit item Notes off hides it there instead (Photos/other controls unaffected); Data keeps export/import/delete-all (single confirm) and Factory reset goes through a second modal with a "Type DELETE to confirm" input whose Delete button stays disabled until `DELETE` is typed (red when enabled), then resets to defaults (System/Medium, empty Home); factory-reset and delete-all statuses render as alerts; 0 console errors. All 7 acceptance criteria pass; 1-spec `[x]`, roadmap 015 → done.

[2026-09-17] ~ | Feature 015 - Finly-parity settings refinements
- Appearance (`AppearanceScreen.tsx`): theme options now carry Ionicons `moon` / `sunny` / `phone-portrait-outline` (16px, `c.text`) and are ordered Dark, Light, System; text-size options render a bold "A" glyph at `fs(11/15/19)`.
- Regional: `SettingsPickerRow.tsx` restyled to Finly's bordered select box (label above, value + `chevron-down`, `BUTTON_BORDER_RADIUS`); language options carry a flag via new `FlagIcon.tsx` (native emoji) / `FlagIcon.web.tsx` (react-native-svg UK + Spain, colors in new `constants/flagColors.ts`, so unit tests never load `react-native-svg`). `OptionPickerModal.tsx` now keeps a temporary selection (radio rows with optional leading icon, seeded on open via `useResetOnOpen`) and applies it on a new `confirmLabel` button (Select/Seleccionar) or discards it on Cancel.
- Personalization (`PersonalizationScreen.tsx`): Item display / Edit item are now nested subsections of the Lists screen card (divider + title + "Optional fields" subtitle) using the new `CheckboxRow.tsx` (`checkbox`/`square-outline`, checkbox role) instead of `ToggleRow` (deleted). Config keys unchanged (`showNotes`/`showPhotos`, `editShowNotes`/`editShowPhotos`).
- i18n en/es: added `common_select`, `settings_optional_fields`, `settings_notes`, `settings_photos`; removed `settings_show_notes`, `settings_show_photos`, `settings_edit_notes`, `settings_edit_photos` (both groups reuse Notes/Photos).
- Tests: added `tests/components/CheckboxRow.test.tsx`; updated `tests/screens/settings/{AppearanceScreen,RegionalScreen,PersonalizationScreen}.test.tsx` (icon/order assertions, temp-select + Select/Cancel flow, nested checkbox structure with `getAllByRole('checkbox')`). Suite baseline: 32 files, 248 tests, `npm run test:all` green.
- Verified on web at 375px (verification-loop): Appearance shows the moon/sunny/phone icons (glyph codepoints f460/f5ad/f4b5) with size glyphs at 11/15/19 and Dark selectable; the Regional trigger is a 1px bordered box, the picker shows the UK SVG / Spanish flag with native names, Español only highlights (no apply), Cancel keeps English, Select applies it (drawer → Inicio/Listas/Ajustes) and English reverts; Personalization nests Item display / Edit item with two "Optional fields" subtitles and 4 checkboxes (f21a filled → f593 empty); unchecking Item display Notes hides the row's "View note" while the edit modal keeps its Note field, and unchecking Edit item Notes hides it there instead; Data's typed factory reset stays disabled until `DELETE` (red when enabled); 0 console errors. All 7 acceptance criteria pass; 1-spec `[x]`, roadmap 015 kept done.

[2026-09-17] ~ | Feature 015 - settings layout refinements
- Regional (`RegionalScreen.tsx`): wrapped the picker row in `SettingsSection`, so the screen now shows an uppercase `LANGUAGE` header above the `Language` label (not uppercased) and the bordered dropdown; flags stay emoji on native and the `react-native-svg` fallback on web.
- Personalization (`PersonalizationScreen.tsx`): the Lists screen is now a header (no outer card) plus three background-separated surface cards — Layout, Item display, Edit item — with no divider lines; `settingsStyles.subsection` (`borderTop`) replaced by `groupTitle` / `groupSubtitle`. Home screen card unchanged.
- Appearance: `SelectorInline` wraps each `option.icon` in a fixed 20px icon slot and the size "A" glyph got `lineHeight: 20`, so all six Theme / Text size buttons render at one height (42px on web).
- Tests: `tests/screens/settings/RegionalScreen.test.tsx` asserts the header + label (`getAllByText('Language')` → 2). Suite unchanged: 32 files, 248 tests, `npm run test:all` green.
- Verified on web at 375px (verification-loop): the Regional header computes `text-transform: uppercase` / 12px / `letter-spacing: 1px` while the label stays 14px mixed case, and the picker still shows the UK SVG + Spanish flag with temp-select / Select / Cancel; the Personalization Lists screen renders three cards (`rgb(241,245,249)` surface, `border-top: 0`, 12px radius, 8px gaps); all six Appearance buttons measure 42px; a checkbox toggle persists across navigation; 0 console errors. All 8 acceptance criteria pass; roadmap 015 kept done.

[2026-09-17] ~ | Reactive language labels + Personalization title parity
- New `src/hooks/useLabels.ts`: returns `getLabels(config.language)` from `useConfig()`, so a component that renders translations subscribes to the config and re-renders when the language changes. `src/i18n/index.ts` gained `getLabels(id)` (`t()`/`setLanguage` stay for the non-React caller `utils/backupIO.ts`).
- Fixed the stale-language bug: `SettingsScreen` rendered `t()` without consuming the config, so switching language in Regional left the hub rows in the previous language after going back. Converted every React screen/component from `const labels = t()` to `useLabels()` (`SettingsScreen`, `settings/*`, `ListDetailScreen`, `EditListScreen`, `CreateListScreen`, `ItemRow`, `ListRow`, `ListCard`, `ListsView`, `ListForm`, `ItemFormModal`, `SearchBar`, `PhotoSection`, `SelectSearchHeader`, `SelectToggleButton`, `FullscreenViewer`, `ColorGrid`, `ColorPickerModal`, `ComingSoon`) and `AppNavigator` (`StackHeaderLeft` a11y label, `CustomDrawerContent`, `HomeStack`, `AppDrawer` `drawerLabel`).
- Personalization (`PersonalizationScreen.tsx`): the *Item display* / *Edit item* titles now use the same `settingsStyles.label` as *Layout* (`fs(15)`, weight 600, 10px bottom margin); removed the unused `groupTitle` style.
- Tests: new `tests/hooks/useLabels.test.tsx` (configured language + English default); `tests/screens/SettingsScreen.test.tsx` renders the hub in Spanish under `{ language: 'es' }` (with a `resetStub` `beforeEach`). Suite baseline: 33 files, 251 tests, `npm run test:all` green.
- Verified on web at 375px (verification-loop, fresh IndexedDB): switching Regional → Español updates the drawer (Inicio/Listas/Ajustes), the Settings header (`Ajustes`), the hub rows (`Apariencia`/`Personalización`/`Datos`) and the header drawer button a11y label (`Abrir menú`), and switching back to English reverts all of them without a reload; Personalization computes `font-size: 15px` / `font-weight: 600` / `margin-bottom: 10px` for Diseño, Visualización de elementos and Editar elemento (subtitle stays 13px); 0 console errors. All 9 acceptance criteria pass; roadmap 015 kept done.

[2026-09-17] ~ | Shared form-section typography + heading cleanup
- New `src/components/textStyles.ts`: single source for Finly-parity section titles — `SECTION_TITLE_FONT_SIZE = 15`, `SECTION_SUBTITLE_FONT_SIZE = 13`, `SECTION_TITLE_STYLE = { fontWeight: '600', marginBottom: 10 }`, `SECTION_SUBTITLE_STYLE = { fontWeight: '400', marginBottom: 8 }`, exposed as `textStyles.sectionTitle` / `textStyles.sectionSubtitle` (color/size still applied inline because they depend on theme + text-size).
- `FormField.tsx` labels now use `textStyles.sectionTitle` with `color: c.text` / `fs(15)` (was `c.textSecondary` / `fs(13)` / margin 8), so Create/Edit list `Name` / `Icon` / `Color` and the item modal `Name` / `Notes` labels match Finly's *Categories* / *Day* / *Tags* section titles.
- Settings labels unified on the same token: `SettingsSelectRow` and `PersonalizationScreen` use `textStyles.sectionTitle` / `sectionSubtitle`; removed the now-unused `settingsStyles.label` and `groupSubtitle`.
- Removed the redundant in-body heading from `ListForm` (dropped the `heading` prop, the `<Text>` and `styles.heading`); `CreateListScreen` / `EditListScreen` no longer pass it. The nav header keeps `create_list_title` / `edit_list_title`.
- Tests: dropped the now-invalid `Create list` / `Edit list` body assertions from `tests/screens/CreateListScreen.test.tsx` and `tests/screens/EditListScreen.test.tsx`. Suite baseline unchanged: 33 files, 251 tests, `npm run test:all` green.
- Verified on web at 375px: Create list and Edit list show no in-body heading (only the nav-header title) and compute `Name`/`Icon`/`Color` at `font-size: 15px` / `font-weight: 600` / `rgb(30,41,59)` / `margin-bottom: 10px`; Personalization unchanged (titles 15/600/10, subtitle 13/400/8, uppercase headers 12/600/8); 0 console errors.

[2026-09-22] + | 016-collections — collections grouping, detail screens, and Home add-chooser
- Data layer: new `collections` table (`id`, `name`, `color`, `icon`, `created_at`, `position`) and `lists.collection_id` (nullable FK → `collections.id`) with a `lists_collection_id` index; `SCHEMA_VERSION` becomes 5. Pre-1.0 `migrate()` rebuilds an out-of-date database from the single canonical `createSchema` (drops tables when `user_version > 0`, then recreates) — a real versioned migration chain starts at v1.0.0.
- Drizzle `collections` table + `lists.collection_id` in `src/database/drizzle/schema.ts`; Zod `collectionSchema` and nullable `listSchema.collection_id` in `src/database/schemas.ts`; new `collectionRepo` (create/update/delete/list/existsByName) and `listRepo` deletes keep `collection_id` scoping; backup export includes `collections` and `lists.collection_id`, import restores collections first then lists, `clearDataKeepSettings()` / `resetDatabase()` also clear `collections`; DB drift expectations updated.
- `AppContext` exposes `collections` (`CollectionWithCounts`), `listsByCollectionId`, and `baseLists` (standalone lists); new lists position at `max(collection_id) + 1` (or `max(collection_id IS NULL) + 1` standalone); delete/list logic moves lists into/out of collections.
- Home: *Collections* section (uppercase title) of `CollectionCard` tiles (icon, name, N/total progress) above *Lists*, drag-reorderable via `Sortable.Grid` and disabled during select mode or an active search; search scopes collections by name; FAB now opens an "Add" chooser (`Add collection` / `Add list`).
- Collection detail (`CollectionDetailScreen`): tinted icon badge, colored name, N/total, edit pencil, trash → move-lists-to-Lists or delete-lists-too (single confirm when empty); member-list grid reuses search, select-mode bulk delete, reorder, and empty state; FAB adds a list with `collectionId`.
- Shared `CollectionForm` (name via `validateCollectionName` + debounced duplicate check excluding the edited collection, icon grid, quick/custom color picker) behind `CreateCollectionScreen` / `EditCollectionScreen`; `MAX_COLLECTION_NAME_LENGTH = 100`.
- i18n: `collection_*`, `home_add_collection`, `home_add_choice_title`, `home_section_lists` keys in both `en` and `es`, read via `useLabels()`.
- Tests: Home Add chooser navigations (Create List / Create Collection), collection detail/forms/delete flows, fixture helpers (`setCollections`, `setBaseLists`, `buildList` `collection_id`), dbDrift guard for `collections` + `collection_id`; fixed two stale tests (`ListsView.test.tsx` `onToggleItem`, `HomeScreen.test.tsx` FAB flow). Suite baseline: 33 files, 252 tests.
- Docs: `spec/features/016-collections/1-spec.md` created with 11 acceptance criteria (all passing); roadmap `## 016-collections` added (Status: done) and the former `016-form-typography` renumbered to `## 017-form-typography` (the already-merged branch `feature/016-form-typography` keeps its historical number); `docs/harnesses.md` baseline updated to 33 files / 252 tests.
- Verified on web at 375px, fresh IndexedDB, 0 console errors: Collections section with tiles (icon, name, N/total) opens collection detail; FAB chooser; list created inside a collection updates the tile's progress and never shows as standalone; Create/Edit Collection validate (required/duplicate disabled Create; >100 chars blocked by input `maxLength`) and persist icon+color, Edit prefills and excludes its own name; detail header + member grid + empty-state hint; delete flows (empty single confirm, Move lists to Lists, Delete lists too w/ cascade); drag reorder persisted across reload and disabled during select mode / active (filtering) search; Home search narrows collections by name; select-mode bulk delete of member lists inside a collection; Spanish labels across Home sections, chooser, forms, and collection detail. Final `npm run test:all` green.

[2026-09-22] + | 018-collections-screen — Collections screen, combined select, per-section layouts, detail-header cleanup
- Collections screen: drawer gains a *Collections* entry (`albums-outline`) between Home and Lists opening a `CollectionsScreen` that reuses `ListsScreenBase` in `collections` mode (collections only, grid/list, search by name, drag-reorder, FAB → Create Collection, header select toggle).
- Combined select on Home: select mode applies to collections and standalone lists together; the action bar shows the combined `N selected` count; *Delete* opens the shared `CollectionDeleteModal` (`Delete N collections?`, selected names listed when more than one, *Move lists to Lists* / *Delete lists too*), then falls through to the lists `ConfirmModal` for any still-selected lists (or exits select mode when none remain).
- Per-section layout keys `homeCollectionsLayout` / `homeListsLayout` / `collectionsLayout` / `listsLayout` (DB keys `home_collections_layout` / `home_lists_layout` / `collections_layout` / `lists_layout`; defaults grid/grid/grid/list; legacy `home_layout` ignored on read) with Personalization rows for Home Collections, Home Lists, Collections screen, and Lists screen; Home renders each section with its own variant.
- Detail-header cleanup: list detail trash always present in `headerRight` (search/select only when the list has items); collection detail trash always present (empty → single confirm, non-empty → the chooser).
- i18n: new `collection_delete_many_title` / `collections_empty` (+ hint) / layout and settings keys in en/es. Fixed a Spanish plural bug where `collection_delete_many_title` produced "colecciónes" (now `¿Eliminar N colecciones?`).
- Tests: config layout-key suite, `collectionRepo.deleteMany(ids, mode)` move/cascade contract tests, `CollectionsScreen` (incl. cancel keeps selection + no repo deletes), Home combined-select flow (count combine, move + fallthrough, cascade, cancel), CollectionDetail chooser, ListDetail always-visible trash, updated fixtures. Suite baseline: 37 files, 281 tests, `npm run test:all` green.
- Spec: `spec/features/018-collections-screen/1-spec.md` created (8 acceptance criteria, all passing); roadmap `## 018-collections-screen` added (Status: done).
- Verified on web at 375px with the verification-loop skill: drawer → Collections grid + empty state + FAB; Home combined select (collection + standalone list → "2 selected" → `Delete 1 collection?` → Move lists to Lists → fallthrough `Delete 1 list?`; Delete lists too cascades; Cancel keeps selection and deletes nothing); Personalization shows all 4 layout rows, toggling Collections screen Grid→List swaps to stacked rows and persists across reload; Collections search filters by name (Beta removed on "Al"); drag-reorder (long-press pointer) swaps Alpha/Beta and persists across reload; List detail (empty) shows only trash; Collection detail empty → single confirm, non-empty → chooser; Spanish drawer/labels/layout rows and the corrected `¿Eliminar 2 colecciones?` chooser. 0 console errors.

[2026-09-22] ~ | Collection icon, combined Home empty state, and type badges
- Collection identity icon: replaced the remaining `folder-outline` / `folder-open-outline` icons with `albums-outline` — `AddChooserModal` "Add collection" row, `AppNavigator` Collection detail + Create collection header icons, and the `ListsView` empty states for the Collections screen and collection detail ("No lists yet").
- Home empty state: `ListsView.renderEmpty` now branches on `mode === 'home'` to show a distinct combined empty state (`home-outline` icon + new `home_empty_all` / `home_empty_all_hint` keys — en "No collections or lists yet" / "Tap + to create your first collection or list", es "Aún no hay colecciones ni listas" / "Pulsa + para crear tu primera colección o lista"); the Lists screen keeps the existing lists-only empty state.
- Type badges: new `src/components/TypeBadge.tsx` (neutral `textSecondary` badge, fixed `albums-outline` / `list-outline` icon) wired into `CollectionCard` / `ListCard` (absolute top-right) and `CollectionRow` / `ListRow` (trailing), hidden in select mode so collections and lists are distinguishable in both grid and list layouts.
- Tests: new `tests/components/TypeBadge.test.tsx`; `ListCard.test.tsx` type-badge assertion; `HomeScreen.test.tsx` empty state updated to the combined message + hint. Suite baseline: 38 files, 284 tests, `npm run test:all` green.
- Docs: `spec/features/018-collections-screen/1-spec.md` (section 1 empty-state icon, section 6 i18n keys, new section 7), roadmap 018 bullet, this changelog entry.

[2026-09-22] ~ | Consolidate collections spec docs into 016-collections
- Merged the `018-collections-screen` spec into `spec/features/016-collections/` (the collections implementation feature) and removed the `018-collections-screen` folder.
- `016-collections` now has the full three-document set: `1-spec.md` (merged + type-badge/icon/empty-state polish documented, 17 acceptance criteria), `2-plan.md` (architecture/components/navigation/i18n/data-flow/risks), `3-tasks.md` (full checklist).
- Roadmap: removed the standalone `## 018-collections-screen` entry and folded its bullets into `## 016-collections` (Status: done).

[2026-09-22] ~ | Unified delete modal, trash spacing, accent bars, section-title icons
- Unified combined delete: `ListsScreenBase` now deletes collections and standalone lists in a single modal — the shared `CollectionDeleteModal` chooser when at least one selected collection has member lists (`listsByCollectionId`), or one destructive `ConfirmModal` ("Delete N collections and M lists?") when none do — removing the old second lists-confirm fallthrough and the pointless chooser on empty collections.
- `CollectionDeleteModal` gained a `standaloneListCount` prop and a clarifying message (`collection_delete_standalone_message`) when standalone lists are also selected; new i18n keys `collection_delete_combined_title` / `collection_delete_combined_message` / `collection_delete_empty_many_message` (en/es).
- Detail header: the delete (trash) button now gets extra `marginRight` spacing from the search/select toggles only when those are present (`CollectionDetailScreen`, `ListDetailScreen`).
- Collection visual: `CollectionCard` (top) and `CollectionRow` (left) render a colored accent bar in the collection's color (`overflow: hidden`), reinforcing the container look alongside the `TypeBadge`.
- Home section titles: `ListsView` now shows the *Lists* title whenever Home has standalone lists (not only alongside collections) and both *Collections* / *Lists* titles render a leading type icon (`albums-outline` / `list-outline`).
- Tests: rewrote `HomeSelectionFlow` (chooser move/cascade + empty-collection confirm, both delete standalone lists in one action) and added an empty-collection confirm case to `CollectionsScreen`; `setListsByCollectionId` used to model collections-with-lists. Suite baseline: 38 files, 287 tests, `npm run test:all` green.
- Docs: `016-collections/1-spec.md` (sections 5/8/10/11/12 + acceptance criteria), `2-plan.md` (data flow), `3-tasks.md`, roadmap 016 bullets.

[2026-09-22] ~ | ListlyApp dependencies — Expo SDK 57 patch bump
- Bumped `expo` 57.0.22 → 57.0.24, `expo-image-picker` 57.0.17 → 57.0.19, and `expo-sharing` 57.0.20 → 57.0.21 via `npx expo install --fix`; `npx expo install --check` now reports "Dependencies are up to date".
- `npm run test:all` still green (typecheck + lint + 38 files / 287 tests).

[2026-09-22] ~ | Complete spec docs to the 3-document structure
- Created the missing `2-plan.md` + `3-tasks.md` for seven features that only had `1-spec.md`: 005-settings-screen, 010-bulk-select-delete, 011-item-pictures, 012-reorder-items, 013-edit-list, 014-code-quality, 015-settings-sections (14 files, matching the current code and the `016`/`007` format).
- Flipped stale unchecked tasks/criteria to `[x]`: `009-reorder-lists` `1-spec.md` acceptance criteria + `3-tasks.md`, and `001`/`002`/`003`/`004` `3-tasks.md`.
- Added the missing `## 009-reorder-lists` entry to `spec/constitution/3-roadmap.md` (Status: done).

[2026-09-22] ~ | Refresh tech-stack doc to match current code
- `spec/constitution/2-tech-stack.md`: expanded the "Languages and tools" list with the missing packages (`react-native-sortables`, `react-native-svg`, `expo-image-picker`/`expo-file-system`, `expo-sharing`/`expo-document-picker`, `expo-splash-screen`/`expo-status-bar`, `react-native-web`, `react-native-worklets`, `reanimated-color-picker`) and rewrote the "File structure" tree as a trimmed, corrected view of the actual `src/` tree (renamed/deleted files fixed; collections, settings sub-screens, DB migrations/repos, and newer hooks/components added).

[2026-09-22] ~ | Refresh remaining constitution docs to match current code
- `1-mission.md`: product + goal now mention grouping lists into collections and per-item photos.
- `4-design-system.md`: removed the stale `fs(22)`/`fs(28)` rows and added `fs(24)` (drawer title); corrected screen padding to `12`; added `listColors.ts` and the `albums-outline`/`list-outline` type identity to the icons section.
- `5-validations.md`: added collection-name rules (`MAX_COLLECTION_NAME_LENGTH = 100`, globally-unique duplicate check).
- `6-screens.md`: rewrote from a "planned / not started" draft into the actual 1.0 screens (Home, Lists, Collections, list/collection detail, create/edit forms, Settings hub) with a correct navigation map.
- `7-platform-differences.md`: replaced the "no native-only criteria" note with the real native-only surfaces (item-photo camera capture, native backup share/pick vs web Blob/file-input).

[2026-09-22] + | Feature 017 — copy list to clipboard
- New `src/utils/copyList.ts` (`buildListCopyText(listName, items, withNotes)`) — list name first, then each item in `position` order; done items prefixed `✅ `; notes appended after ` — ` when copying all.
- `ListDetailScreen` header row gains two copy buttons (shown only when the list has items): *Copy names* (`list-outline`) and *Copy all* (`copy-outline`), writing to the clipboard via `expo-clipboard` (`setStringAsync`) with a transient checkmark + "Copied" label (~1.5s).
- i18n: `list_copy_names` / `list_copy_all` / `list_copied` (en/es).
- Tests: `copyList` util (order, `✅` marker, notes, empty list) + `ListDetailScreen` copy flows (hidden when empty, correct clipboard text, confirmation). Suite baseline: 39 files, 295 tests, `npm run test:all` green.
- Spec: `spec/features/017-copy-list/` (1-spec with 7 acceptance criteria, 2-plan, 3-tasks); roadmap `## 017-copy-list` (done) + `6-screens.md` line.
- Verified on web at 375px: copy icons appear with items and are hidden on an empty list; "Copy list" produces `Snacks` / `✅ Milk` / `Eggs` and "Copy list with notes" produces `Snacks` / `✅ Milk` / `Eggs — free-range`; "Copied" feedback appears; 0 console errors.

[2026-09-22] ~ | Feature 017 — clearer copy icons + specific feedback
- Replaced the confusing `list-outline` "Copy names" icon with `copy-outline`, and the "Copy all" icon with `reader-outline` (distinct, not reused by the `ItemRow` note indicator).
- The transient confirmation is now action-specific: "List copied" (names only) vs "List + notes copied" (with notes), replacing the generic "Copied". i18n keys `list_copied` → `list_copied_names` / `list_copied_notes` (en/es).
- Tests: split the confirmation test into the two specific labels. Suite baseline: 39 files, 296 tests, `npm run test:all` green.
- Docs: updated `017-copy-list` 1-spec (icons, feedback, i18n) and 2-plan (i18n + data flow).

[2026-09-22] ~ | Move delete out of detail headers into the Edit screens
- Removed the delete (trash) icon from the `ListDetailScreen` and `CollectionDetailScreen` nav headers, which now show only the search/select toggles (gated on items / member lists). Removed the now-dead list/collection delete flows, `headerActions`/`trashSpacing` styles, and unused repo imports from those screens.
- `ListForm` / `CollectionForm` gained optional `deleteLabel`/`onDelete` props rendering an outlined-red "Delete …" button above Save (create screens unaffected).
- `EditListScreen` now hosts the list delete: confirm → `listRepo.delete` → `refresh()` → `popToTop()`. `EditCollectionScreen` hosts the collection delete: empty → single confirm, non-empty → `CollectionDeleteModal` (move / delete-lists-too) → `collectionRepo.delete(id, mode)` → `popToTop()`.
- Tests: removed the list-delete tests from `ListDetailScreen`, added a delete-flow test to `EditListScreen`, removed the trash/delete tests from `CollectionDetailScreen`, and added `EditCollectionScreen.test.tsx` (empty confirm + move/cascade). Suite baseline: 40 files, 297 tests, `npm run test:all` green.
- Docs: updated `016-collections` (1-spec sections 6/7/8/10 + criteria, plan, tasks), `013-edit-list` (1-spec + plan + tasks), roadmap 013/016 bullets, and `6-screens.md`.

[2026-09-22] ~ | Show a list's collection on the Lists screen
- `ListsView.renderItem` (lists mode) now resolves each list's containing collection and passes it to `ListRow` / `ListCard`.
- `ListRow` and `ListCard` gained an optional `collection` prop: when a list belongs to a collection, a small `albums-outline` icon + the collection name render under the list name in the collection's color (hidden in select mode); standalone lists show no hint.
- Tests: `ListsView` (collection-list shows its collection, standalone doesn't) + `ListCard` (hint shows / hides in select mode). Suite baseline: 40 files, 301 tests, `npm run test:all` green.
- Docs: `016-collections` 1-spec (section 11 + acceptance criterion), `6-screens.md` (Lists screen), roadmap 016 bullet.

[2026-09-22] + | Drag a list into a collection on Home (feature 018)
- `listRepo.moveToCollection(listId, collectionId)` — transactional append-at-end (`COALESCE(MAX(position), -1) + 1` among the target collection's members, then `UPDATE lists SET collection_id, position`).
- `ListsView` (home mode) wraps the content in `Sortable.MultiZoneProvider`, each collection card/row in `Sortable.BaseZone` (`minActivationDistance={8}`), and tracks the dragged list (`draggingListRef` set on the lists-grid `onDragStart`, cleared by a collections-grid `onDragStart` so collection reorders never drop lists). Enter → `hoverCollectionId` (highlight); leave → clear; drop → `moveToCollection` + `refresh()`, with `zoneDropHandledRef` making the grid skip its `reorder` for that drag. Skills note: the ref is intentionally not cleared on list `onDragEnd` because the zone's drop can land after it.
- `CollectionCard` / `CollectionRow` gain a `dropTarget` prop (accent `c.primary` border + primary tint) + `accessibilityHint`; i18n `home_drop_hint` (en/es).
- Tests: `tests/database/listRepo.test.ts` (append at end, empty collection, between collections) + 4 `ListsView` drop-wiring tests (grid + list layouts: highlight on enter, clear on leave/drop, no highlight without a list drag, `moveToCollection(1, 10)` + reorder skipped), `tests/mocks/react-native-sortables.tsx` captures `BaseZone` handlers + grid `onDragStart`. Suite baseline: 41 files, 308 tests, `npm run test:all` green.
- Docs: new `spec/features/018-drag-list-into-collection/` (1-spec with 8 acceptance criteria, 2-plan, 3-tasks), roadmap `## 018-drag-list-into-collection` (in progress), `6-screens.md` Home bullet.

[2026-09-23] ~ | Fix web drop for feature 018 (transactions + refresh ordering)
- engine.ts withTransaction now serializes through a module-level promise chain (transactionChain): on web the grid's reorder and the zone's moveToCollection could run concurrently, nesting BEGIN and crashing sql.js with `cannot start a transaction within a transaction`.
- ListsView drop handler now awaits moveToCollection before refreshing (pendingMoveRef), so the view no longer re-queries the pre-commit DB; handleDragEnd skips the grid reorder while a collection zone is hovered (hoverCollectionIdRef) or a drop move is pending.
- Tests: added the concurrency regression test to listRepo.test.ts (fails pre-fix with the exact browser error, passes post-fix). Suite baseline: 41 files, 309 tests, npm run test:all green.
- Verified on web at 375px (Playwright, CDP touch): dragged Groceries / Todos / Workout onto the Shopping collection (grid card + row layouts) — highlight appears while hovering (accent border + tint) and clears after; each drop removes the list from Home and appends it last in Shopping; reordering collections swaps positions without dropping lists (zone fires with a null dragging ref, no moveToCollection); 0 console errors.
- Docs: 018 1-spec acceptance criteria flipped to [x], roadmap ## 018-drag-list-into-collection (done).

[2026-09-23] ~ | Drag a single list on Home (feature 018 follow-up)
- On Home the lists grid now enables dragging with >= 1 list (sortEnabled = !selectMode && !searching && displayLists.length > (inHome ? 0 : 1)), so a lone list can be dragged and dropped into a collection. Other screens keep the `> 1` reorder guard.
- Tests: added to `ListsView.test.tsx` -- a single Home list is draggable and can be dropped into a collection (`moveToCollection`, reorder skipped), and a single list outside Home keeps sorting disabled.
- Docs: `018-drag-list-into-collection` 1-spec requirement + new acceptance criterion, roadmap 018 bullet, `6-screens.md` Home line.

[2026-09-23] + | Drag a list out of a collection (feature 019)
- New `listRepo.removeFromCollection(listId)`: in a transaction sets `collection_id = NULL` and appends the list at the end of the standalone lists (`MAX(position) + 1` among rows with no collection).
- Collection detail (`ListsView` in collection mode): while a member list is dragged, a `Remove from collection` pill (icon + label) appears above the FAB, wrapped in a `Sortable.BaseZone` inside the existing `MultiZoneProvider`; it highlights while hovered and hides on leave/drop. Dropping on it calls `removeFromCollection` + refresh and skips the grid reorder (same `zoneDropHandledRef` / `pendingMoveRef` wiring as 018). Releasing elsewhere keeps reordering within the collection.
- The members grid now enables dragging with >= 1 list on Collection detail (like Home), so a lone member can be dragged out.
- i18n en/es: `collection_remove_label`, `collection_remove_hint`.
- Tests: `listRepo` (append-at-end, lone member, existing standalones) and `ListsView` (lone-member draggable, target revealed only during a member drag, drop removes + skips reorder, target absent outside collection mode, reorder intact when released elsewhere).
- Docs: new `019-remove-list-from-collection` spec, roadmap entry, `6-screens.md` Collection detail bullet.

[2026-09-23] ~ | Refactor: shared entity form + magic values to constants
- New `src/components/EntityForm.tsx` (generic `<TError extends StringTranslationKey>` name/icon/color form: debounced duplicate check, submit, delete/save buttons) and `src/components/IconGrid.tsx`; `ListForm.tsx` / `CollectionForm.tsx` are now thin wrappers passing their entity-specific validate/existsByName/labels/max-length (public props unchanged), removing ~250 duplicated lines.
- New `src/constants/icons.ts` (`ICONS` map) replacing repeated icon-name literals (`albums-outline`, `list-outline`, `create-outline`, `help-circle-outline`, `arrow-undo-outline`).
- New constants: `ALPHA_SUBTLE`, `HIT_SLOP`, `HIT_SLOP_SMALL`, `FAB_BOTTOM_OFFSET`, `ZONE_MIN_ACTIVATION_DISTANCE` (componentStyles.ts) and `COPY_FEEDBACK_MS`, `PHOTO_QUALITY` (constants/types.ts); replaced the `1500` copy timeout, `quality: 0.7`, `minActivationDistance={8}`, duplicated FAB `bottom: 56`, `0.08` alpha, and `hitSlop={8|4}` literals.
- Replaced remaining `'transparent'` literals with the existing `TRANSPARENT` token (ListCard/ListRow/CollectionCard/CollectionRow/ModalFooter/SelectionCheck/SelectorInline/OptionPickerModal/ListsView).
- Behavior-preserving; `npm run test:all` green (41 files, 319 tests).

[2026-09-23] ~ | Refactor: screen/component de-duplication (Phase 4)
- New `src/components/NotFoundScreen.tsx` (shared missing-entity guard) replacing the identical block in `ListDetailScreen`, `CollectionDetailScreen`, `EditListScreen`, `EditCollectionScreen`.
- New `src/components/DetailHeader.tsx` (icon badge + name + progress + edit pencil, optional `trailing` slot and progress bar) adopted by both detail screens; `ListDetailScreen` passes its copy-actions as `trailing` + `progressPercent`.
- `ListsScreenBase.tsx`: extracted `resetSelectionExtras()` (toggle/exit select) and merged `performCollectionDelete` / `confirmCombinedDelete` into one `runCollectionDelete(mode, closeModal, errorLabel)`.
- `ListsView.tsx`: extracted `performZoneDrop(action)` shared by the collection-hover drop and the remove-from-collection drop.
- Behavior-preserving; `npm run test:all` green (41 files, 319 tests).

[2026-09-23] ~ | Refactor: repository helpers + config/validation (Phase 3 core + Phase 5)
- New `src/database/repositories/shared.ts` with `countsSelection` (`total`/`completed` SQL), `nextPositionSql(column)` (`COALESCE(MAX(...), -1) + 1`), `deletePhotosOfItems(rows)` and `deletePhotosOfLists(listIds)`.
- `listRepo.ts` / `collectionRepo.ts` / `itemRepo.ts` now use the shared helpers (removed the duplicated photo-cleanup function, the `nextPosition` SQL literal and the withCounts aggregate SQL).
- `configDefaults.ts`: dropped the parallel `CONFIG_VALUE_KINDS` map; `decodeConfigValue` derives the value kind from `DEFAULT_CONFIG`.
- `validation.ts`: single `validateName(value, maxLength, isDuplicate)` core behind `validateItemName` / `validateListName` / `validateCollectionName` (public APIs unchanged).
- `useItemPhotos.ts`: extracted `addAsset(asset)` shared by the camera and gallery pickers.
- Behavior-preserving; `npm run test:all` green (41 files, 319 tests).

[2026-09-23] ~ | Refactor: dead-code removal + small de-dup bundle
- Deleted the unused `src/components/ComingSoon.tsx` and its `coming_soon` i18n key (en/es).
- `AppNavigator.tsx`: replaced `HomeNavCapture` / `ListsNavCapture` / `CollectionsNavCapture` with a single `createNavCapture(Screen)` factory.
- `repositories/shared.ts`: added `reorderPositions(orderedIds, updateOne)`; exported `DrizzleDb` from `drizzle/engine.ts`; `listRepo` / `collectionRepo` / `itemRepo` reorder methods now use it (itemRepo keeps its `list_id` guard).
- New `src/utils/set.ts` (`toggleInSet`); used by `useSelectMode.toggleItem` and `ListsScreenBase.toggleCollection`.
- Behavior-preserving; `npm run test:all` green (41 files, 319 tests).

[2026-09-23] ~ | Refactor: split ListsView into a drop-zone hook and components
- New `src/hooks/useCollectionDropZones.ts`: owns the drag-drop state/refs and handlers (`handleListsDragStart`, `handleCollectionsDragStart`, `handleListsDragEnd`, collection zone enter/leave/drop, remove-target enter/leave/drop + `performZoneDrop`).
- New `src/components/RemoveFromCollectionTarget.tsx`: the collection-detail remove pill (`Sortable.BaseZone` stays the outer measured element) and its styles.
- New `src/components/SectionTitle.tsx`: the shared section icon + upper-case label row.
- `ListsView.tsx` now delegates to those (571 -> 399 lines); `ListViewMode` / `ListsViewVariant` still exported from it.
- Behavior-preserving; `npm run test:all` green (41 files, 319 tests).

[2026-09-23] ~ | Refactor: extract AddItemBar from ListDetailScreen
- New `src/components/AddItemBar.tsx` (props `listId`, `existingNames`, `position`, `onAdded`): owns the add-item state, `useItemPhotos`, validation, `itemRepo.create` + reset, and the add row / expandable note / `PhotoSection` markup + styles.
- `ListDetailScreen.tsx` now renders `<AddItemBar />` in place of the inline block and drops the moved state/handler/styles/imports (512 -> 318 lines).
- Behavior-preserving; `npm run test:all` green (41 files, 319 tests).

[2026-09-23] + | Error handling: error boundary, toast feedback, lenient read parsing
- New `src/utils/errors.ts` (`logError`, `runSafely`, `subscribeToErrors`): central error logging + an error-event publisher.
- New `src/components/ErrorBoundary.tsx` (+ themed fallback with a Try again button) mounted in `App.tsx` around `AppShell`; new `src/context/ToastContext.tsx` + `src/components/Toast.tsx` render a transient toast whenever `logError` fires.
- Wired `logError`/`runSafely` through the catch sites (`AppContext`, `ConfigContext`, `EditListScreen`, `EditCollectionScreen`, `AddItemBar`, `ListDetailScreen`, `ListsScreenBase`, `useSelectMode`, `useItemPhotos`, `useCollectionDropZones`, `ListsView`); fixed `performZoneDrop`'s unhandled rejection (now clears `pendingMoveRef` and reports). `DataScreen` inline status and infra paths stay console-only.
- `src/database/validate.ts`: `parseRows` / `parseRowOrNull` are now lenient (skip + `console.warn` an invalid row instead of throwing).
- i18n en/es: `error_generic`, `error_boundary_title`, `error_boundary_message`, `error_boundary_retry`.
- Error scopes are grouped in a typed `ERROR_SCOPE` map (`src/utils/errors.ts`); `logError`/`runSafely` only accept these values.
- Docs: `spec/constitution/5-validations.md` (Zod lenient + new "Error handling" section).
- Tests: `validate.test.ts`, `errors.test.ts`, `ErrorBoundary.test.tsx`; `npm run test:all` green (44 files, 330 tests).

[2026-09-23] + | Collection detail layout setting
- New config key `collectionDetailLayout` (`grid` default / `list`), DB key `collection_detail_layout`; added to `configSchema`, `DEFAULT_CONFIG` and `DB_KEY_MAP`.
- `PersonalizationScreen`: new *Collection detail* section under *Collections screen* with the shared Layout Grid/List selector.
- `CollectionDetailScreen`: passes `config.collectionDetailLayout` as the `ListsView` `variant` (replacing the fixed `grid`).
- i18n en/es: `settings_collection_detail_screen`.
- Tests: `PersonalizationScreen` (new section + key), `CollectionDetailScreen` (list → single column, grid default → multi-column), `schemas`/`dbDrift`/config stub updated.
- Docs: `6-screens.md` and the `015-settings-sections` spec; `npm run test:all` green (44 files, 333 tests).

[2026-09-23] ~ | Polish: uniform ListCard height + Personalization spacing
- `ListCard` gains `reserveCollectionLine`; on the Lists screen grid every card keeps the tallest (icon + name + collection + progress) height, so standalone and collection lists match. Home / Collection-detail cards are unchanged.
- `ListsView` passes `reserveCollectionLine={mode === 'lists'}`.
- `PersonalizationScreen`: 16px spacer between the *Collections* and *Lists* rows of the *Home screen* section, so the *Lists* title is no longer tight under the toggle.
- `npm run test:all` green (44 files, 333 tests); verified on web at 375px (both Lists cards h=147; 16px Home-row gap).

[2026-09-23] ~ | Refactor: group identifier literals into constants (Tier 1)
- `constants/types.ts`: added `LIST_VIEW_MODES` (+ `ListViewMode`) and `COLLECTION_DELETE_MODES` (+ `CollectionDeleteMode`); `LIST_LAYOUTS` reused for the raw `'grid'`/`'list'` literals.
- Replaced the raw list-view mode literals in `ListsView` / `ListsScreenBase` / `HomeScreen` / `CollectionsScreen` / `CollectionDetailScreen` (and the `'move'`/`'cascade'` literals in `collectionRepo` / `EditCollectionScreen`).
- New `constants/text.ts` (`NBSP`) for the `ListCard` filler; new `database/constants.ts` (`DATABASE_NAME`, `DB_STORE_NAME`) removing the duplicated `'Listly.db'` and `'sqlite'` literals (`database.ts`, `sqliteWeb.ts`, `storage/indexedDb.ts`).
- Pure refactor; `npm run test:all` green (44 files, 333 tests).

[2026-09-23] ~ | Fix: hide ListCard reserved collection line on native
- In `ListCard`, the reserved collection slot (standalone lists on the Lists screen grid) is now hidden with `opacity: 0` on the row instead of `color: 'transparent'` on the icon/text, which was not reliably invisible on Android. `color` falls back to `c.textSecondary`; the row still occupies its line so card heights stay uniform.
- Web behavior is unchanged (already invisible); `npm run test:all` green (44 files, 333 tests).

[2026-09-23] ~ | Fix: Toast native-driver warning on web
- `Toast.tsx` now uses `useNativeDriver: isNative` (from `utils/platform`) instead of `true`, removing the web warning "useNativeDriver is not supported because the native animated module is missing"; the native driver is still used on iOS/Android.
- `npm run test:all` green (44 files, 333 tests); web load shows no `useNativeDriver` warning.

[2026-09-23] ~ | Polish: item row (note icon, done style, edit affordance)
- `ItemRow`: removed the descriptive `document-text-outline` note indicator (the tappable note preview remains).
- Done items no longer use a strikethrough; the name stays `textSecondary` and the row gets a faint green wash (`withAlpha(c.green, ALPHA_SUBTLE)`).
- The edit pencil is now a circular button (30x30, primary-tinted) with the `create-outline` icon in `c.primary`.
- Tests: `ItemRow` (no strike-through, green wash, note preview only) and `ListDetailScreen` (note preview assertion) updated; docs `003-list-detail-screen` spec. `npm run test:all` green (44 files, 333 tests).

[2026-09-24] ~ | Docs: 019 retro plan/tasks, verification record, doc audit
- Retro-created `spec/features/019-remove-list-from-collection/2-plan.md` and `3-tasks.md` (all `[x]`), grounded in the shipped code (`listRepo.removeFromCollection`, `RemoveFromCollectionTarget`, `useCollectionDropZones`, `ListsView` collection-mode wiring, `sortEnabled >= 1`); the folder now has the full three-document set.
- `6-screens.md`: List detail bullet updated — done items use the faded secondary-color name + faint green row wash (no strikethrough) and a circular edit button.
- `docs/harnesses.md` "Current suite baseline" refreshed: 33 files / 252 tests → 44 files / 333 tests, enumerating the added suites (utils `errors`/`copyList`; components `TypeBadge`/`ErrorBoundary`; screens `HomeSelectionFlow`/`CollectionsScreen`/`CollectionDetailScreen`/`EditCollectionScreen`; database `validate`/`listRepo`/`collectionRepo`) and the corrected `ItemRow` description.
- `AGENTS.md` + `PROMPT.md`: new feature folders must seed all three docs (`1-spec.md`, `2-plan.md`, `3-tasks.md`) at creation.
- Verified on web at 375px (Playwright, CDP touch) for 019: while dragging a member the "Remove from collection" pill appears (idle opacity 0 → drag opacity 1) above the FAB and highlights on hover (primary border `rgb(8,145,178)` + tint); dropping removes the list and appends it as the last standalone on Home (Milk → Standalone, Milk); a single-member collection can be emptied to the "No lists yet" empty state; releasing a member elsewhere still reorders (Eggs↔Bread swap persisted across reload); the target is absent on Home/Lists/Collections/Settings; 0 console errors.

[2026-09-24] + | Feature 020: Complete all / Clear completed
- `itemRepo.setAllChecked(listId, checked)`: single scoped `UPDATE items SET checked` for one list. `itemRepo.deleteCompleted(listId)`: transactional delete of the list's checked rows + photo cleanup via `deletePhotosOfItems` (same warning-tolerant path as item delete).
- `ListDetailScreen`: new batch toolbar under the header (visible when the list has items and neither select mode nor search is active) with two bounded chips — *Complete all* (`checkmark-done-outline`, disabled when everything is already checked, `ERROR_SCOPE.completeAllItems`) and *Clear completed* (`close-circle-outline`, disabled when nothing is checked, opens a destructive `ConfirmModal` showing the completed count via `item_clear_completed_confirm(done)`; confirm runs `deleteCompleted` under `ERROR_SCOPE.clearCompletedItems`).
- `errors.ts`: new scopes `completeAllItems`, `clearCompletedItems`.
- i18n en/es: `item_complete_all`, `item_clear_completed`, `item_clear_completed_confirm(count)` (plural-aware), `item_clear_completed_message`.
- Tests: new `tests/database/itemRepo.test.ts` (checks/unchecks only the target list; delete removes only the target list's checked items; no-op when nothing is checked) and `ListDetailScreen` additions (toolbar visible with items, hidden on empty/search, complete-all action + inert when all done, clear-completed confirm flow + inert when nothing is checked). `npm run test:all` green (45 files, 344 tests).
- Docs: new `spec/features/020-complete-all-and-clear-completed/` (1-spec, 2-plan, 3-tasks), roadmap entry 020 (done) + 021/022 stubs (not started), `6-screens.md` List detail batch-toolbar bullet; `docs/harnesses.md` suite baseline refreshed to 45 files / 344 tests.
- Verified on web at 375px (fresh IndexedDB) for 020: with items present the toolbar shows Complete all + Clear completed under the header; Clear completed starts disabled (0 checked) and enables after checking Milk (1/3); pressing it opens "Delete 1 completed item?" and confirming removes only Milk (Eggs/Bread remain, 0/2); Complete all checks the rest (2/2, 100%) and turns disabled; the toolbar is absent on the empty list, while searching, and in select mode; clearing the remaining 2 shows the plural "Delete 2 completed items?" and empties the list back to the empty state; Spanish renders "Completar todo" / "Borrar completados" and "¿Eliminar 1 elemento completado?" with the "Los elementos completados se eliminarán permanentemente." body; 0 console errors (only the pre-existing `props.pointerEvents is deprecated` warning from feature 019).

[2026-09-24] + | Feature 020 (follow-up): Uncomplete all
- `ListDetailScreen`: the batch toolbar gains a third bounded chip - *Uncomplete all* (`square-outline`, tinted with the list color) between Complete all and Clear completed; disabled when no item is checked; on press runs `setAllChecked(listId, false)` under `ERROR_SCOPE.uncompleteAllItems`, undoing an accidental Complete all. The row now uses `flexWrap: 'wrap'` so the three chips fit 375px.
- `errors.ts`: new scope `uncompleteAllItems`. i18n en/es: `item_uncomplete_all` ("Uncomplete all" / "Desmarcar todo").
- Tests: `ListDetailScreen` additions - third button shown with items, hidden on empty/search, "unchecks every item" (`setAllChecked(listId, false)`) and "ignores uncomplete all when nothing is checked" (no call). `npm run test:all` green (45 files, 346 tests).
- Docs: 020 spec requirement + acceptance criteria extended (Uncomplete all unchecks all at once; inert at 0 checked), roadmap 020 bullet updated, `docs/harnesses.md` baseline refreshed to 45 files / 346 tests.
- Verified on web at 375px (fresh IndexedDB): the three chips render on one row in English; Uncomplete all is disabled at 0/3, enables after checking Milk+Eggs (2/3), pressing it unchecks both (0/3, all boxes empty) and returns to disabled; in Spanish the toolbar reads "Completar todo" / "Desmarcar todo" / "Borrar completados", and after checking Milk, "Desmarcar todo" unchecks it (0/3) and disables again; 0 console errors (same pre-existing warning).

[2026-09-25] + | Feature 021: Pin/favorite lists and collections
- Schema: `SCHEMA_VERSION 5 → 6`; new `pinned INTEGER NOT NULL DEFAULT 0` columns on `lists` and `collections` (DDL in `001_initial.ts`, Drizzle `.$type<0 | 1>()`, Zod `z.union([z.literal(0), z.literal(1)])`, `List`/`Collection`/`ListWithCounts`/`CollectionWithCounts` types); `create` returns `pinned: 0`, `NewList`/`NewCollection` omit the column.
- Repos: `listRepo.setPinned` + `collectionRepo.setPinned` (scoped `UPDATE`); `list()`/`withCounts()` order by `desc(pinned), position, id` so pinned items float to the top; `moveToCollection`/`removeFromCollection` keep the flag.
- Backup: `pinned` serialized and restored for both tables; lenient `backupPinnedSchema` default 0 so schema-5 backups without `pinned` import with everything unpinned.
- Pin action: `SelectionActionBar` gained optional `onPin`/`pinLabel`/`pinIcon`/`pinAccessibilityLabel` - a star button between Cancel and Delete (disabled at 0 selected, `.actions` now `flexWrap: 'wrap'`); `ListsView` derives `selectedListItems`/`selectedCollectionItems`/`allSelectedPinned` and `handlePinPress` pins all selected lists+collections (or unpins the whole selection when everything is already pinned) under `ERROR_SCOPE.pinLists`/`unpinLists`, then refreshes. Wins on Home, Lists, Collections, and Collection detail (not List detail item select, which passes no `onPin`).
- Star indicator: `ListCard`/`CollectionCard`/`ListRow`/`CollectionRow` render an amber `star` icon (`c.star`, a11y `home_pinned`) inline after the name when `pinned === 1 && !selectMode`.
- Theme: `star` token on both palettes (dark `#F9A825`, light `#F59E0B`); `errors.ts` scopes `pinLists`/`unpinLists`; i18n `select_pin` ("Pin"/"Fijar"), `select_unpin` ("Unpin"/"Desfijar"), `home_pinned` ("Pinned"/"Destacado").
- Tests: repo (setPinned + pinned-first ordering catches the ASC `ORDER BY pinned` bug - now `desc` - create returns 0, move/remove keep flag, unpin restores), backup (pinned round-trip, legacy schema-5 default), new components `SelectionActionBar.test.tsx`/`CollectionCard.test.tsx`/`ListRow.test.tsx` + ListCard star cases, `ListsView` select-flow Pin/Unpin for lists and collections; all list/collection fixtures updated with `pinned`. `npm run test:all` green (48 files, 371 tests).
- Icon semantics polish: the action-bar icon now depicts the *result* of the press, not the current state - **Pin** shows `star`, **Unpin** shows `star-outline` (`ListsView` swap + `SelectionActionBar` default); `ListsView` Pin/Unpin select-flow tests assert the per-state icon via `within()`, spec func. req. 3 and roadmap 021 wording updated. `npm run test:all` still green (48 files, 371 tests).
- Docs: new `spec/features/021-pin-favorites/` (1-spec, 2-plan, 3-tasks), roadmap 021 (done) + 022 schema-bump note (SCHEMA_VERSION 7), `docs/harnesses.md` suite baseline refreshed to 48 files / 371 tests.

[2026-09-25] + | Feature 022: Per-list item sorting on List detail
- Schema: `SCHEMA_VERSION 6 → 7`; `items.updated_at TEXT NOT NULL` added to `001_initial.ts` DDL, Drizzle schema, Zod `itemSchema` (`updated_at: z.string()`), and `Item`/`NewItem` types; no new migration file (canonical pre-1.0 rebuild path only, `dbDrift.EXPECTED_COLUMNS` updated).
- Repos: `itemRepo.create` now returns `updated_at: dbTimestamp()` and its input type omits it (`Omit<Item, 'id' | 'created_at' | 'updated_at'>`); `update`/`toggle`/`setAllChecked`/`reorder` stamp `updated_at` without touching `created_at`.
- Backup: `updated_at` serialized and restored; lenient `backupItemSchema` defaults it to `created_at` so schema-6 backups import (state drawn from a re-exported extracted `itemShape`).
- Sort model: new pure `src/utils/itemSort.ts` - `ItemSortKey` (`manual`/`name`/`created`), `SortDirection` (`asc`/`desc`), `ItemSort`, `DEFAULT_ITEM_SORT` (`manual`, asc), serialized values `manual|name-asc|name-desc|created-asc|created-desc` via `itemSortValue`/`parseItemSortValue`; `sortItems` applies a stable, non-mutating sort (name: case-insensitive `localeCompare` with `numeric: true, sensitivity: 'base'`; created: lexicographic timestamp compare; ties keep position).
- UI (ListDetailScreen): sort pill (`swap-vertical` + mode label + direction arrow + `chevron-down`, primary-tinted when non-manual) in its own row above the batch toolbar (hidden when list empty, during search, or in select mode); `OptionPickerModal` with five one-tap options (Manual / Name Asc/Desc / Created Asc/Desc). `sortEnabled` gates drag-reorder: disabled in non-manual modes, re-enabled on Manual; `Sortable.Grid` receives `data={displayItems}` so sorted modes render the sorted list.
- State: sort is local component state (`ItemSort`), reset to `DEFAULT_ITEM_SORT` when leaving/backing into the list; search keeps the active sort applied to `filteredItems` while the pill hides.
- i18n en/es keys: `item_sort` ("Sort items"/"Ordenar elementos"), `item_sort_manual`, `item_sort_name`, `item_sort_created`, `item_sort_asc` ("Ascending"/"Ascendente"), `item_sort_desc` ("Descending"/"Descendente").
- Tests: new `tests/utils/itemSort.test.ts` (values/default, stable case-insensitive numeric-aware name sort, lexicographic created sort, non-mutating); `tests/database/itemRepo.test.ts` `updated_at` suite (create stamps; update/toggle/setAllChecked/reorder stamp without touching `created_at`); backup schema-7 round-trip + legacy schema-6 default; `schemas.test.ts` missing-`updated_at` rejection; `dbDrift` includes `items.updated_at`; all Item test literals gained `updated_at`; ListDetailScreen sort tests (pill visibility empty/search, name asc + drag disabled via `lastGrid()`, created desc, restore Manual, sort retained in search results). `npm run test:all` green (49 files, 392 tests).
- Verified on web at 375px (fresh IndexedDB, 3-item Groceries list): pill "Sort items: Manual" shown with items / hidden when empty; modal 5 options with radio states; Name Asc → apple, Banana, Cherry / Desc → Cherry, Banana, apple; Created Desc → Cherry, apple, Banana / Asc → Banana, apple, Cherry; search keeps sort with pill hidden and it returns after clearing; re-entering the list resets to Manual; real pointer-drag reorder persists (apple, Banana, Cherry after dragging Banana under apple) and manual order survives a re-entry; Cancel discards; Spanish labels ("Ordenar elementos: Manual", "Completar todo", etc.); pill shows primary tint only in non-manual modes; 0 console errors (same pre-existing warning).
- Docs: new `spec/features/022-item-sorting/` (1-spec verified + criteria flipped, 2-plan, 3-tasks), roadmap 022 (done) + SCHEMA_VERSION 7 + backup-import details, `docs/harnesses.md` suite baseline refreshed to 49 files / 392 tests.

[2026-09-26] ~ | ListlyApp/tests/screens/ListDetailScreen.test.tsx, ListlyApp/tests/mocks/react-native-sortables.tsx
- Fixed the flaky sort-picker tests that intermittently failed CI (`expected [ 'Milk', 'Eggs' ] to deeply equal [ 'Eggs', 'Milk' ]` at the sort-assertion line, and later `[ 'Old', 'New' ]` vs `[ 'New', 'Old' ]`).
- Root causes (two independent, both test-side; app behavior verified correct): (1) the mock `Grid`/`BaseZone` captured props during the render phase, so React 19 interrupted/abandoned renders could corrupt `lastGrid()`/`getZoneHandlers()`; (2) `lastGrid()` order assertions after the picker flow read mock module state that can lag the committed tree when a commit lands outside `act`, while `view` already shows the correct order.
- Fix: mock now writes `lastGridProps`/`lastZoneHandlerProps` in `useLayoutEffect` (commit phase), and the four post-interaction sort-order assertions assert the committed tree order via `view.getAllByText(/^(Milk|Eggs)$/ | /^(Old|New)$/)` instead of `lastGrid()?.data`. Dropped the two post-interaction `lastGrid().sortEnabled` asserts (implied by the pill-label asserts under the test conditions). Also removed a bare `act(() => {})` that desync'd the renderer for subsequent tests. `npm run test:all` green (49 files, 392 tests); ListDetailScreen file stable across 13 consecutive full-file runs.

[2026-09-26] + | Feature 023: Copy lists (duplicate draft + copy items into another list)
- Shared data helper: `src/database/repositories/shared.ts` gains `copyItemsInto(db, sourceListId, targetListId)` - selects the source items ordered by `position`, computes `base = COALESCE(MAX(position), -1) + 1` on the target (`nextPositionSql`), and inserts full-fidelity copies (name, note, checked, pictures) with fresh `created_at`/`updated_at` and `pictures` shared by reference (no filesystem copies).
- Repos: `itemRepo.duplicateItems(sourceListId, targetListId)` wraps `copyItemsInto` in `withTransactionAsync` (FK `ON DELETE CASCADE` makes a missing target roll back the insert); `listRepo.duplicate(id, overrides)` atomically inserts the copy list at the end of its section (standalone end or same collection after members, `pinned: 0`) and calls `copyItemsInto` in the same transaction.
- Utils/i18n/errors: `utils/copyList.ts` gains `makeListCopyName(name, maxLength = MAX_LIST_NAME_LENGTH)` clamping long names so the `" copy"` suffix survives; `errors.ts` scopes `duplicateList` + `copyItemsToList`; `constants/types.ts` `CreateList` params become `{ collectionId?: number; duplicateFromListId?: number } | undefined`; i18n en/es keys `list_duplicate` ("Duplicate list"/"Duplicar lista"), `list_copy_to`, `list_copied_to(name)`, `list_picker_title`, `list_picker_hint`, `list_picker_empty`.
- Duplicate draft: `EditListScreen` gains a *Duplicate list* outline-primary button above the form navigating to `CreateList` with `duplicateFromListId`; `CreateListScreen` reads it, prefills name/icon/color/collection from the source (`initialCollectionId`), and on Save calls `listRepo.duplicate` then `navigation.replace('ListDetail', { listId: created.id })` (holds `collection_id: collectionIdToUse ?? collectionId ?? null`); cancel/back creates nothing.
- Copy-to-list: new `src/components/ListPickerModal.tsx` (ModalShell maxWidth 380, one-tap rows with tinted icon badge + name + chevron, `excludeListId` filters the source, Cancel footer, empty hint `list_picker_empty`); `ListDetailScreen` third compact header action (`git-branch-outline`, hidden when empty, a11y hint) opens it, `handlePickTarget` runs `duplicateItems` under `ERROR_SCOPE.copyItemsToList` and shows transient "Copied to <Target>" with the copy button switching to a green checkmark; copiedAction extended with `'to-list'` + `copiedToName` state.
- Tests: `copyList.test.ts` `makeListCopyName` (suffix + long-name clamp); `itemRepo.test.ts` `duplicateItems` (append in source order with `MAX(position)+1` base, fidelity incl. checked/note/pictures + fresh timestamps, source untouched, empty target from 0, FK rollback); `listRepo.test.ts` `duplicate` (end-of-section placement, items copied, collection member appended after others); `ListPickerModal.test.tsx` (rows + source exclusion, select closes, cancel closes without selecting, empty hint); `CreateListScreen.test.tsx` (mutable route params + prefilled draft, Save → `duplicate` + `navigation.replace`, stays in collection, default create path untouched); `EditListScreen.test.tsx` (duplicate button navigates); `ListDetailScreen.test.tsx` (third action hidden when empty, picker excludes source, select calls `duplicateItems(1,2)` + "Copied to Work Tasks"). `npm run test:all` green (50 files, 411 tests).
- Docs: new `spec/features/023-copy-lists/` (1-spec verified + criteria flipped, 2-plan, 3-tasks); roadmap 023 marked done; `docs/harnesses.md` suite baseline refreshed to 50 files / 411 tests.
- Verified on web at 375px (fresh IndexedDB): Groceries (Milk checked, Eggs + "free-range" note) → Edit List shows *Duplicate list* → draft prefilled "Groceries copy" with cart-outline + #22D3EE selected → renamed/retinted/reiconed to "Groceries Express" (book icon) → Save lands on the new populated list (1/2, Milk checked, Eggs note, source order); cancelling a second draft created nothing (Home still 2 lists); List detail's third "Copy items to another list" icon is hidden when the list is empty and shown otherwise; the picker lists other lists and excludes the source; copying Groceries → Recipes twice produced 2/4 (Milk✓, Eggs+note, Milk✓, Eggs+note) proving append order, checked/note fidelity, and duplicates-allowed; "Copied to Recipes" feedback visible right after the run; 0 console errors (same pre-existing warning).

[2026-09-26] ~ | ListlyApp [023 refinement: duplicate button placement + name dedupe on copy]
- `EntityForm`/`ListForm` gain optional outline-primary `middleLabel`/`onMiddle` slot rendered between the Delete button and the Save button; `EditListScreen` moves *Duplicate list* out of the top bar into that slot (footer now Delete → Duplicate → Save; unused imports/styles removed). Draft flow unchanged.
- `shared.ts` `copyItemsInto` now dedupes by item name: it pre-loads the target's names and skips any source item whose trimmed name matches case-insensitively (same rule as the add-item `existsByName` check); matched target items are never modified (their note/pictures kept even when the skipped source item carries content); repeats within the same copy run are skipped too. `position` advances only on inserted rows so the target stays contiguous after skips. Duplicate-list relies on `copyItemsInto` against a fresh empty list ⇒ never skips anything.
- `itemRepo.test.ts` `duplicateItems` gains 2 tests (case-insensitive skip + target original untouched; batch repeat skipped, contiguous positions). `npm run test:all` green (50 files, 413 tests).
- Specs/docs: 023 1-spec §2/§3 + acceptance criteria now state the dedupe rule (was "duplicates are allowed / no dedupe"); 025 1-spec §2 and roadmap 025 note the merge reuses the same rule (still pending, criteria unchecked); roadmap 023 bullet updated.
- Verified on web at 375px (fresh IndexedDB): Edit List footer now stacked Delete list → Duplicate list → Save (top standalone button removed); Duplicate still opens a prefilled "Recipes copy" draft that saves into a populated copy; copying Groceries (Milk✓ + "source note", Eggs, Bread) into Recipes (had "Milk") produced 0/3 — order Milk, Eggs, Bread, positions contiguous, and the target's original Milk stayed unchecked without a note (skipped source content never merged); repeated full-overlap copies added nothing (Recipes stayed 0/3); "Copied to Recipes" feedback + green checkmark visible on the copy action; picker excluded the source; 0 console errors (same pre-existing warning). Items/spec baseline: 50 files / 413 tests.

[2026-09-27] ~ | ListlyApp [024: move list between collections]
- `EntityForm`/`ListForm` gain an optional `fieldSlot` React node rendered between the color picker and the Delete button; `EditListScreen` uses it to host a Collection selector row (new `src/components/CollectionSelectRow.tsx`: FormField-wrapped pressable with tinted collection icon badge, name or `list_collection_none` label, chevron, a11y label).
- New `src/components/CollectionPickerModal.tsx` (ModalShell maxWidth 380): always lists a *Standalone / No collection* row first, then every collection with icon+color badge, checkmark + `accessibilityState.selected` on the current `collection_id`, one-tap select (id or null) then close, Cancel footer.
- `EditListScreen` wiring: `collectionId` state seeded from `list.collection_id` (unconditional hook before the not-found return); on Save `listRepo.update(id, { name, icon, color })` then, only when changed, `moveToCollection(id, collectionId)` (to a collection) or `removeFromCollection(id)` (to standalone); `refresh()` + `goBack()`; whole save runs under `ERROR_SCOPE.moveList` try/catch (failure logs and keeps the screen).
- i18n en/es keys `list_collection_label` ("Collection"/"Colección"), `list_collection_none` ("Standalone / No collection"/"Independiente / Sin colección"), `list_collection_picker_title` ("Choose a collection"/"Elegir colección").
- Tests: new `CollectionPickerModal.test.tsx` (standalone + collections listed, default standalone selected, current collection marked, select collection/null closes, cancel no-op); `EditListScreen.test.tsx` +7 (current collection/standalone shown in the row, Save into collection calls `moveToCollection`, Save standalone calls `removeFromCollection`, unchanged collection is untouched, failed move keeps the screen). `npm run test:all` green (51 files, 425 tests).
- Docs: roadmap 024 marked done; `docs/harnesses.md` baseline refreshed to 51 files / 425 tests.
- Verified on web at 375px (fresh IndexedDB): Edit List shows *Collection* above Delete (Create List builds standalone lists only); picker lists Standalone + Kitchen + Garden with the current one checkmarked; Save moves Reading into Kitchen appended after Meals; re-saving on the same collection is a no-op (order unchanged); moved Reading into Garden, then back to *Standalone*; long-press drag-in (Reading → Kitchen card) and drag-out (Meals → Remove from collection zone) still work; Spanish UI shows "Colección", "Elegir colección", "Independiente / Sin colección", "Guardar"; 0 console errors (same pre-existing warning).

[2026-09-28] ~ | ListlyApp [025: merge lists]
- Data layer: `src/database/repositories/shared.ts` `copyItemsInto` now returns the copied source item ids; `itemRepo.mergeInto(sourceListId, targetListId)` added — throws on self-merge; inside one `withTransactionAsync`: `copyItemsInto` (full-fidelity copies with the same case-insensitive name-dedupe rule as 023, target items never modified), selects the source rows, deletes photos only of the dedupe-skipped source items (`deletePhotosOfItems`), then deletes the source list row (item rows cascade). Rolls back on failure (missing list, missing target). `errors.ts` gains `ERROR_SCOPE.mergeLists` ("merge lists").
- i18n en/es keys `list_merge_into` ("Merge into…"/"Combinar en…"), `list_merge_confirm` ("Merge"/"Combinar"), `list_merge_confirm_title` ("Merge list?"/"¿Combinar lista?"), `list_merge_confirm_message(count,target,source)`, `list_merged(name)` ("Merged into X"/"Combinado en X"), `list_merge_empty` ("No other lists to merge into"/"No hay más listas para combinar"); `ListPickerModal` gains an `emptyLabel?` prop (defaults `list_picker_empty`) used for the empty state.
- Screen wiring: `ListDetailScreen` shows a *Merge into…* tile as the 4th batch action (visible only when the list has items, inert during search/select modes); tapping opens the list picker excluding the source; picking a target opens a destructive `ConfirmModal` ("Merge N items into <Target> and delete <Source>?" with the total source count, Cancel + Merge, disabled while running); confirming runs `mergeInto` under `ERROR_SCOPE.mergeLists`, `await refresh()`, then `navigation.replace('ListDetail', { listId: target.id, notice: 'merged' })`; the screen shows a transient "Merged into <Target>" label (1500ms, `COPY_FEEDBACK_MS`) when arriving with the `notice` param (`types.ts` `MERGE_NOTICE` + route param type).
- Tests: `itemRepo.test.ts` `mergeInto` (append fidelity/order/count + source deleted; dedupe skip with target untouched; photo cleanup only for skipped, merged copies keep shared photos; self-merge rejects; missing target rollback; empty source no-op) via a `vi.mock` of `../../src/utils/itemPhotos` (real parser, stubbed `deleteItemPhotos`); `ListDetailScreen.test.tsx` +7 (tile hidden when empty / hidden while searching / shown with items, picker excludes self, destructive confirm copy with count/target/source, merge calls `mergeInto` + `refresh` + `replace` with notice, confirm-cancel changes nothing, transient "Merged into" label on arrival); `ListPickerModal.test.tsx` custom `emptyLabel`. `npm run test:all` green (51 files, 440 tests).
- Docs: 025 1-spec acceptance criteria flipped + roadmap 025 marked done; `docs/harnesses.md` baseline refreshed to 51 files / 440 tests.
- Verified on web at 375px (fresh data, built via UI since seed was removed): Groceries (Milk checked, Eggs + "free-range" note, Bread) merged into Recipes (had Milk) — confirmation read "Merge 3 items into Recipes and delete Groceries?", confirming appended Eggs+note and Bread to Recipes (target's Milk untouched, checked source Milk skipped by dedupe → Recipes 0/3), Groceries gone from Home, user landed on Recipes; picker/confirmation cancels changed nothing; "Merged into Recipes" and Spanish "Combinado en Recipes" toasts captured; repeated merges (single-item Test/Temp/Dup/Last/Origen lists) appended contiguous items (Recipes ended 0/8 in order Milk, Eggs+note, Bread, Salt, Pepper, Cocoa, Vinegar, Aceite); Spanish UI verified end-to-end ("Combinar en…", "No hay más listas para combinar", "¿Combinar lista?", "¿Combinar 1 elementos en Recipes y eliminar Origen?", "Combinar", "Cancelar"); 0 console errors (same pre-existing pointerEvents warning). Live photo capture not checkable on web — photo sharing + cleanup semantics covered by `mergeInto` unit tests.

[2026-09-28] ~ | ListlyApp [010/021: selection action bar wrap]
- `SelectionActionBar`: the bar row now wraps (`flexWrap`) and the count/actions can shrink (`flexShrink: 1`; the actions group gets `marginLeft: 'auto'`), so with long labels (Spanish "Fijar/Cancelar/Eliminar", "N seleccionados") and scaled text (Large) the button group drops to a second line, right-aligned, instead of overflowing — the last button (Delete/Eliminar) is no longer clipped.
- No repo/schema/i18n changes; `SelectionActionBar.test.tsx` unchanged. `npm run test:all` green (51 files, 440 tests).
- Docs: requirement bullets + acceptance criteria added to 010 and 021 specs; roadmap 010/021 notes updated.
- Verified on web at 375px (fresh IndexedDB, data built via UI, Spanish + Large text): Home select mode with a collection + 2 lists selected shows "3 seleccionados" with Pin/Cancel on the first row and the red Delete wrapped to the second row, all inside the 375px viewport (right edge 347px, 0 horizontal overflow); List detail (1 item selected) keeps Cancel+Delete on one row (right edge 359px); 0 console errors (same pre-existing pointerEvents warning).

[2026-09-28] ~ | ListlyApp [deps: expo 57.0.25 patch bump]
- `npx expo install --fix`: `expo` `~57.0.24` -> `~57.0.25`, `expo-image-picker` `~57.0.19` -> `~57.0.20`, `expo-sharing` `~57.0.21` -> `~57.0.22` (SDK 57 patch releases; `package.json` + `package-lock.json` updated, 8 packages changed).
- `npx expo install --check` reports "Dependencies are up to date".
- `npm run test:all` green (51 files, 440 tests). Web smoke at 375px: app boots and Home renders with data, 0 console errors, no horizontal overflow. Expo Go / web, so no native rebuild needed.

[2026-09-28] ~ | ListlyApp [021: pin star visible in select mode]
- `ListCard` / `ListRow` / `CollectionCard` / `CollectionRow`: the amber `home_pinned` star now renders whenever `pinned === 1` (dropped the `&& !selectMode` gate), so pressing Pin/Unpin from the select-mode action bar shows/removes the star on the selected cards/rows immediately, without leaving select mode. Pinned items still float to the top on refresh (unchanged).
- Tests: `ListCard.test.tsx` / `ListRow.test.tsx` / `CollectionCard.test.tsx` star assertions flipped from "hidden in select mode" to "kept visible in select mode". `npm run test:all` green (51 files, 440 tests).
- Docs: 021 spec requirement + tests bullet + new acceptance criterion; roadmap 021 note.
- Verified on web at 375px (Spanish + Large text): Home select mode with 1 collection + 1 list selected shows 0 stars before Pin; pressing "Fijar" shows 2 amber stars instantly (Col + Uno) and floats them to the top of their sections while the bar flips to "Desfijar"; pressing "Desfijar" removes both stars immediately; 0 console errors.

[2026-09-28] ~ | ListlyApp [010: selection action bar button order]
- `SelectionActionBar`: button order changed to destructive-first — **Delete → Pin (when present) → Cancel** (was Pin → Cancel → Delete). Delete gets an extra `marginRight` to separate it from the safe actions; no color/size changes. Restores the 010 spec wording ("count, delete, cancel") and keeps 021's "Pin between Delete and Cancel". Applies to both usages: lists/collections = `Delete · Pin · Cancel`, items = `Delete · Cancel`.
- Tests: existing assertions query by accessibility label, so order changes are unaffected. `npm run test:all` green (51 files, 440 tests).
- Docs: 010 spec gains a button-order requirement + acceptance criterion; roadmap 010 note.
- Verified on web at 375px: lists/collections bar (Spanish + Large) shows "Eliminar · Fijar" on the first row and "Cancelar" wrapped to the second, in that left-to-right order, 0 horizontal overflow; List detail item bar shows "Eliminar · Cancelar" on one row; 0 console errors.

[2026-09-28] ~ | ListlyApp [refactor: flag helpers for 0/1 columns]
- New `src/utils/flags.ts` exporting `Flag` (`0 | 1`), `isOn(flag)` and `toFlag(value)`; the UI read-sites now call `isOn(...)` instead of `pinned === 1` / `checked === 1` in `ListCard`, `ListRow`, `CollectionCard`, `CollectionRow`, `ListsView` (`allSelectedPinned`), `ItemRow` (`isDone`), `ListDetailScreen` (`done` count) and `copyList`.
- Repo write-sites (`setPinned`, `itemRepo.toggle`) and the `0 | 1` storage types (Zod/Drizzle/`database/types.ts`) are intentionally unchanged — the literal flag representation stays at the storage boundary.
- Tests: new `tests/utils/flags.test.ts` (`isOn`/`toFlag` + round-trip). `npm run test:all` green (52 files, 443 tests).
- Docs: changelog only (pure refactor; no spec/behavior change).
- Verified on web at 375px: Home renders, pin/unpin via the select bar still shows/removes the star (1 -> 0), List detail renders the checked progress; 0 console errors.

[2026-09-28] ~ | ListlyApp [023: clarify copy-to-list action]
- `ListPickerModal`: new optional `subtitle` prop rendered under the title (`c.textSecondary`, `fs(13)`), so a picker can explain its intent to sighted users (previously only available as an accessibility hint).
- `ListDetailScreen`: the copy-to-list header action swaps `git-branch-outline` for `duplicate-outline` (distinct from the `copy-outline`/`reader-outline` clipboard actions) and its picker now uses the descriptive title `list_copy_to` plus the new `list_copy_picker_subtitle`.
- i18n en/es: `list_copied_to` reworded to name the result ("Items copied into \"<Target>\"" / "Elementos copiados en \"<Destino>\""); new `list_copy_picker_subtitle`.
- Tests: `ListPickerModal.test.tsx` subtitle render/absence case; `ListDetailScreen.test.tsx` feedback assertion updated. `npm run test:all` green (52 files, 444 tests).
- Docs: 023 spec §2/§4 + acceptance criterion; roadmap 023 note.
- Verified on web at 375px (Spanish): the copy picker shows title "Copiar elementos a otra lista" + subtitle "Esta lista se mantiene; sus elementos se añaden a la lista que elijas (los que ya existan se omiten)."; selecting "Dos" shows the toast `Elementos copiados en "Dos"`; 0 console errors.

[2026-09-28] ~ | ListlyApp [020/022: single-row list toolbar]
- `ListDetailScreen`: removed the dedicated `sortRow`; the item sort pill is now the first chip of the shared `batchRow` (with an extra `marginRight` to separate it from the bulk actions) so the toolbar no longer wastes a whole line on sort alone.
- Shortened the bulk-action visible labels (en `All` / `None` / `Clear`, es `Todo` / `Nada` / `Limpiar`) with new full-name accessibility labels (`item_*_a11y`), so 5 labeled chips fit **two rows** at 375px in both languages (previously 3 rows). Bulk behavior unchanged.
- i18n en/es: `item_complete_all` / `item_uncomplete_all` / `item_clear_completed` shortened; added `item_complete_all_a11y`, `item_uncomplete_all_a11y`, `item_clear_completed_a11y`.
- Tests: existing assertions query the accessibility labels (unchanged), so they stay green. `npm run test:all` green (52 files, 444 tests).
- Docs: 020 spec §1/§3 + acceptance criteria; 022 spec §1; roadmap 010/020/022.
- Verified on web at 375px: English/Medium `Manual · All · None` / `Clear · Merge into…` (2 rows); Spanish/Medium `Manual · Todo · Nada` / `Limpiar · Combinar en…` (2 rows); no horizontal overflow; 0 console errors.

[2026-09-28] ~ | ListlyApp [020/022/025: two-row toolbar + warning token]
- `ListDetailScreen`: the item toolbar is now two explicit rows — Row 1 = sort pill + *Merge into…*, Row 2 = All / None / Clear — instead of a single wrapping row. Merge moves out of the bulk trio and next to the sort control, away from the item-state toggles (reduces mis-taps next to Clear).
- `constants/themes.ts`: new `warning` palette token (dark `#F9A825`, light `#F59E0B`) added to `ColorPalette` + both palettes; the *Merge into…* pill (icon, text, border) now uses `c.warning`, distinct from the primary-blue view actions and from red (pure-delete) semantics — merge deletes the source list but preserves its items in the target.
- No repo/schema/i18n change. `npm run test:all` green (52 files, 444 tests).
- Docs: 4-design-system palette (incl. the previously-missing `star`); 020 spec §1 + criteria; 022 §1; 025 §1 + criterion; roadmap 010/020/022/025.
- Verified on web at 375px: light theme `Manual · Combinar en…` (amber `#F59E0B`) / `Todo · Nada · Limpiar`; dark theme merge `#F9A825` legible; two rows in en/es; no overflow; 0 console errors.

[2026-09-28] fix | ListlyApp [photo cleanup on list/collection delete]
- Fix a photo leak: deleting a list (or a collection with its lists) removed the rows first and *then* queried `items.pictures`, so the cascade had already erased the rows and no photo files were ever cleaned up.
  - `shared.ts`: replaced `deletePhotosOfLists` with `picturesOfLists(db, listIds)` that gathers the pictures *before* the delete.
  - `listRepo.delete` / `deleteMany`: gather the target items' pictures inside the transaction, delete the list(s), then run `deletePhotosOfItems` after commit (file IO stays outside the transaction).
  - `collectionRepo.delete` / `deleteMany` (cascade): same — gather member lists' item pictures inside the transaction, then clean up after commit; move mode is unaffected (lists survive).
- Tests: `listRepo.test.ts` +2 and `collectionRepo.test.ts` +2 regression cases with real `pictures` JSON (assert the exact URIs are cleaned and unrelated lists' photos are untouched), mocking `deleteItemPhotos` like the merge tests. `npm run test:all` green (52 files, 448 tests).
- No schema or behavior change beyond correct cleanup; `SCHEMA_VERSION` unchanged.

[2026-09-28] fix | ListlyApp [deep-copy item photos on duplicate/copy/merge]
- Fix a data-integrity bug: duplicated / copied / merged items reused the *same* image file URIs. Removing a photo in one list called `deleteItemPhotos`, which deleted the shared file and silently broke the photo in the other list.
  - `utils/itemPhotos.ts`: added `copyItemPhotoToStorage(src)` (shared by the picker) and `duplicateItemPhotos(photos)` — copies each non-`data:` file to a fresh `item_photo_*.jpg` and returns the new URIs; web `data:` URLs are kept inline (sharing is harmless there). Per-photo failures fall back to the original URI with a warning.
  - `repositories/shared.ts` `copyItemsInto`: each copied row now stores `duplicateItemPhotos(row.pictures)` instead of the source's URIs.
  - `itemRepo.mergeInto`: since merged copies now own duplicate files, the source's originals are all deleted on merge (previously only the dedupe-skipped items' photos were cleaned). The target's existing items are never touched.
  - `hooks/useItemPhotos.ts` now reuses `copyItemPhotoToStorage` for the picker path (no behavior change).
- Tests: `itemRepo.test.ts` merge/duplicate cases assert `duplicateItemPhotos` is called and copies carry `copy-of-` URIs while the source keeps its own; the merge-cleanup case asserts all source photos are deleted and the target's are untouched. `listRepo.test.ts` duplicate case updated for copied URIs. `npm run test:all` green (52 files, 449 tests).
- Docs: 023 §3 and 025 §2 wording ("photo blobs shared" -> deep-copied); roadmap 023 note. No schema change (`SCHEMA_VERSION` unchanged).

[2026-09-28] fix | ListlyApp [item edit modal resets while open]
- Fix: the item edit modal reset its fields whenever the parent re-rendered. `ListDetailScreen` passed `initialPhotos={parseItemPhotos(...)}`, a new array each render, and `ItemFormModal`'s effect depended on that identity — so any re-render (e.g. an unrelated state change) wiped the user's in-progress name/note/photos.
  - `ItemFormModal`: the reset effect now runs only on the `visible` transition (opening the modal) and reads the current initial values through a ref, so changing prop identity while open no longer resets the form.
- Tests: `ItemFormModal.test.tsx` new case — type a name, re-render with a fresh `initialPhotos` array, assert the input is preserved and `setPhotos` is not called again. `npm run test:all` green (52 files, 450 tests).

[2026-09-28] fix | ListlyApp [await writes before refresh]
- Fix a race: several flows fired a repository write and immediately called `refresh()` without awaiting the write, so `refresh` could read the pre-write state (stale order/contents until the next focus).
  - `utils/errors.ts`: added `runSafelyAsync(action, scope)` — awaits the action, routing failures to `logError` (keeps `runSafely` for fire-and-forget callers).
  - `ListDetailScreen`: item reorder and copy-to-list now `await runSafelyAsync(...)` before `refresh()`.
  - `ListsView`: collection reorder awaits before refresh.
  - `useCollectionDropZones`: list reorder on drag-end awaits before refresh.
- Tests: `ListDetailScreen.test.tsx` new case with a deferred `reorder` promise asserts `refresh` is not called until the write resolves. `npm run test:all` green (52 files, 451 tests).
- No behavior change on success; only the ordering of the read relative to the write.

[2026-09-28] fix | ListlyApp [handle photo-picker and clipboard errors]
- Fix unhandled promise rejections in the photo flows: `useItemPhotos.handleTakePhoto` / `handlePickFromGallery` called the permission and launch APIs without a `try/catch`, so a denied/failed camera or gallery launch surfaced as an unhandled rejection instead of going through the app's error path.
  - `hooks/useItemPhotos.ts`: both handlers now wrap the permission + launch in `try/catch` -> `logError(ERROR_SCOPE.addPhoto, err)`; `handleRemovePhoto` wraps the file delete -> `logError(ERROR_SCOPE.removePhoto, err)` (state still updates so the photo disappears from the UI).
  - `screens/ListDetailScreen.tsx`: the clipboard write in `copyList` now `.catch(...)` -> `logError(ERROR_SCOPE.copyToClipboard, err)`.
  - `utils/errors.ts`: new `ERROR_SCOPE.removePhoto` and `ERROR_SCOPE.copyToClipboard`.
- Tests: new `tests/hooks/useItemPhotos.test.ts` (camera permission rejection, gallery launch rejection, denied permission does not launch) — mocks `expo-image-picker` via `vi.hoisted`. `npm run test:all` green (53 files, 454 tests).

[2026-09-28] ~ | ListlyApp [refactor: shared tile internals]
- Extracted the duplicated internals of the four tile components (`ListCard`, `ListRow`, `CollectionCard`, `CollectionRow`) into a new `src/components/Tile.tsx`:
  - `TileShell` — owns `SortablePressable` + the selection border styles, `accessibilityRole`/`accessibilityState`/`accessibilityLabel` (and optional `accessibilityHint`/`dropTarget`) so the a11y + selection wiring lives in one place.
  - `TileName` (name + pinned star, parameterized font/star size), `TileCollection` (collection line with reserve), `TileProgress` (completed/total), `TileBadge` (circular icon badge), `TileIcon`, plus shared `tileStyles`.
- The four components now compose these helpers and keep only their own layout container (card vs row padding/gap/radius, accent bar, `nameColumn` for the list row). No props, behavior, colors, or a11y labels changed.
- `npm run test:all` green (53 files, 454 tests) with the existing tile/a11y/star/drop-hint tests unchanged. Lint + typecheck clean.
- Verified on web at 375px (dark theme): Home grid tiles, Lists rows (icon badge, progress, type badge), and select mode (selection border + check overlay on the icon, pinned star, action bar) all render identically; 0 console errors.
- No spec/roadmap change (pure refactor).

[2026-09-28] ~ | ListlyApp [refactor: shared picker modal chrome]
- Extracted the duplicated picker chrome into `src/components/PickerModal.tsx`:
  - `PickerModal` — `ModalShell` (maxWidth 380, padding 20) + centered `fs(18)` title + optional subtitle + a `ScrollView` for rows + a footer slot.
  - `PickerRow` — the shared row (leading node | flex label with selected tint | trailing node) with `accessibilityRole="button"` and `accessibilityState={{ selected }}`; optional `selectedTint` reproduces the collection picker's highlighted row.
  - `pickerStyles` — shared `row`/`label`/`iconBadge`/`leading`/`footer` styles.
- `ModalFooter`: `confirmLabel` is now optional — when omitted it renders a single full-width Cancel button (used by the list/collection pickers, matching their previous single-button footer). Existing callers pass `confirmLabel`, so behavior is unchanged.
- Refactored `ListPickerModal`, `CollectionPickerModal` and `OptionPickerModal` to compose `PickerModal`/`PickerRow` (list + collection pickers use a single-Cancel footer; the option picker keeps Cancel + Confirm). Removed ~200 lines of duplicated styles/markup. No prop-signature, i18n, or visual changes.
- `npm run test:all` green (53 files, 454 tests); lint + typecheck clean.
- Verified on web at 375px (dark theme, Spanish): copy-to-list picker (title + subtitle + icon badge row + chevron + single Cancel), sort option picker (radios + tinted selected label + Cancel/Seleccionar), collection picker (standalone row selected with tint + checkmark + Cancel). 0 console errors.
- No spec/roadmap change (pure refactor).

[2026-09-28] ~ | ListlyApp [refactor: shared repository helpers]
- Added two helpers to `src/database/repositories/shared.ts`:
  - `countRows(db, table, conditions)` — the `SELECT COUNT(*) ... WHERE and(...conditions)` used by every `existsByName`.
  - `nextPosition(db, table, positionColumn, where?)` — the `COALESCE(MAX(position), -1) + 1` read (wraps the existing `nextPositionSql`).
- Replaced the duplicated bodies:
  - `existsByName` in `listRepo` / `collectionRepo` / `itemRepo` now build their `conditions` and delegate to `countRows`.
  - The next-position block (previously repeated in `listRepo.create`, `listRepo.duplicate`, `listRepo.moveToCollection`, `listRepo.removeFromCollection`, `collectionRepo.create`, and `copyItemsInto`) now calls `nextPosition`.
- No public method signatures, SQL semantics, casing, or defaults changed. No schema/i18n/spec change.
- `npm run test:all` green (53 files, 454 tests); lint + typecheck clean.
- Verified on web at 375px (Spanish): creating a list appends it (position), and a duplicate list name is rejected (existsByName). 0 console errors.

[2026-09-28] ~ | ListlyApp [refactor: shared select/search header hook]
- New `src/hooks/useSelectSearchHeader.tsx`: centralizes the header wiring repeated across screens — the `toggleSearch` callback (guards on select mode, clears the query when closing) plus the `navigation.setOptions({ headerRight })` effect and its `headerRight: undefined` cleanup effect.
- `ListDetailScreen`, `ListsScreenBase` and `CollectionDetailScreen` now call the hook instead of each declaring `toggleSearch`, the `setOptions` effect, and the cleanup effect (removed ~40 duplicated lines across the three screens). Each screen keeps its own `searchActive`/`query` state and passes its `visible`/`showSelect`/`showSearch` flags and select-toggle handler.
- No behavior change: same guards, same query clearing, same header visibility conditions, same unmount cleanup. `SelectSearchHeader` unchanged.
- `npm run test:all` green (53 files, 454 tests); lint + typecheck clean.
- Verified on web at 375px (Spanish): Home / Lists / List detail headers show select + search only with data; opening and closing search works (query clears); entering/exiting select mode from the header works. 0 console errors.
- No spec/roadmap change (pure refactor).

[2026-09-28] ~ | ListlyApp [polish: tokens, text scaling and a11y]
- `utils/platform.ts`: removed the unused `isIOS` / `isAndroid` exports (only `isWeb` / `isNative` are used).
- `components/settings/FlagIcon.web.tsx`: replaced the four hardcoded `#fff` flag strokes/fills with the `WHITE` theme constant.
- Text scaling: the hardcoded `lineHeight` values that ignored the user's text-size preference are now scaled via `fs()` — `ItemRow` note preview (`fs(18)`), `NoteViewer` note text (`fs(22)`). (`AppearanceScreen`'s size-preview glyph keeps a fixed line height on purpose, since it is a non-scaling preview.)
- Accessibility: added the missing `accessibilityRole="button"` to `Fab` and the `SearchBar` close button; added `accessibilityLabel` to the `PhotoSection` take-photo / gallery options.
- `ColorGrid`: swatches now expose the `button` role and human-readable color names instead of raw hex. New i18n keys (en/es) `color_cyan/red/green/amber/pink/lime` + `color_custom`, mapped via `QUICK_COLOR_LABELS` in `constants/listColors.ts`; the custom swatch and the "+" use `color_custom` / `color_grid_more`.
- Tests: `ColorGrid.test.tsx`, `CreateListScreen.test.tsx`, `EditListScreen.test.tsx` updated to query swatches by their new color-name labels. `npm run test:all` green (53 files, 454 tests); lint + typecheck clean.
- Verified on web at 375px (Spanish): Create List shows the color swatches labeled Cian/Rojo/Verde/Ámbar/Rosa/Lima + "Más colores"; the FAB exposes `role="button"`; 0 console errors.
- No spec/roadmap change (polish refactor).

[2026-09-28] test | ListlyApp [hook tests + unused i18n keys]
- Tests: new `tests/hooks/useSelectMode.test.ts` (7 cases: idle state, enter/exit select mode clears selection, item toggle, open/close delete confirm, confirmDelete calls `deleteMany` + exits + runs `afterDelete`, failure logs and still exits) and `tests/hooks/useCollectionDropZones.test.ts` (8 cases: reorder on plain drag end, `removeTargetActive` from `inCollectionDetail`, hover tracking only while dragging, zone drop → `moveToCollection` + refresh, remove-zone drop → `removeFromCollection`, handled-drop and hover-drag-end skip reorder, move failure logs). `npm run test:all` green (55 files, 469 tests); lint + typecheck clean.
- i18n: removed the unused keys `collection_delete_title` and `list_picker_title` from `en.ts` and `es.ts` (no references in `src/`).
- No production behavior change.

[2026-09-28] ~ | ListlyApp [refactor: extract ListDetail flow hooks]
- Split the state and flows of `ListDetailScreen` (625 -> 517 lines) into five focused hooks under `src/hooks/`, leaving the JSX in place:
  - `useItemSort` — sort mode + modal state, `displayItems`, sort options/labels (uses the item-sort utils and theme icons).
  - `useClipboardCopy` — clipboard copy (names / with notes), copy-to-list, transient feedback state and timeout cleanup.
  - `useMergeFlow` — merge picker/target/busy state, the "Merged into" notice effect, and `doMerge` (navigates via `replace`).
  - `useItemEditing` — edit form state, `editingExclusiveNames`, `saveEdit`, `deleteItem`.
  - `useBatchItemActions` — Complete all / Uncomplete all / Clear completed and the clear-completed confirm visibility.
- No behavior, props, or i18n changes; the screen keeps its render tree, `useSelectMode`, `useSelectSearchHeader`, drag ordering, and all modals.
- `npm run test:all` green (55 files, 469 tests); lint + typecheck clean.
- Verified on web at 375px (Spanish): sort modal, copy-names feedback, Complete all / Uncomplete all, merge picker, item edit modal, and select mode all work; 0 console errors.
- No spec/roadmap change (pure refactor).

[2026-09-28] fix | ListlyApp [hide cross-list actions without a target]
- Fix a dead-end: with a single list in the app, the *Copy items into another list* header icon and the *Merge into…* pill were shown but their pickers had nothing to select.
  - `ListDetailScreen`: added `hasOtherLists = lists.some(l => l.id !== listId)`; the copy-to-list header icon and the *Merge into…* pill now render only when another list exists (clipboard *Copy* / *Copy with notes* stay). Derived from the global lists, so they reappear automatically once a second list is created (or the other is deleted).
- Tests: `ListDetailScreen.test.tsx` updated the merge-visibility cases to provide a second list, plus new cases — hidden with one list (both actions), shown with two. `npm run test:all` green (55 files, 471 tests); lint + typecheck clean.
- Docs: 023 §2 + criterion, 025 §1/§3 + criterion, roadmap 023/025 notes.
- Verified on web at 375px (fresh IndexedDB): with a single list the copy-to-list icon and merge pill are absent (clipboard copy still present); after creating a second list both appear again. 0 console errors.

[2026-09-28] feat | ListlyApp [026: numeric lists]
- New list kind: `lists.kind` (`'standard'` | `'numeric'`), chosen via a **Type** selector in Create List and changeable in Edit List (`KindSelectRow` → `SelectorInline`). The selector sits directly under **Name** (`EntityForm` gained an optional `kindSlot`, rendered between the Name and Icon fields). `listRepo.create/duplicate/update/withCounts` carry `kind`.
- Numeric items: `items.amount_minor` (INTEGER minor units, nullable) and `items.quantity` (INTEGER, default 0); `SCHEMA_VERSION` 7 → 8 (DDL, Drizzle, Zod, types). `utils/numeric.ts` (parse/format/clamp/lineTotal/sumTotals) does all arithmetic in integer minor units (cap 999,999.99 / quantity 0..99,999, qty starts at 1).
- UI (numeric lists only): `AddItemBar` gains an Amount input + `QuantityStepper` (+/−) + read-only line total; `ItemRow` shows `amount × qty` and the line total; `ItemFormModal` gains Amount + Quantity. `DetailHeader` shows two read-only rows — **Total** (all items) and **Done** (checked only). Standard lists render exactly as before.
- Cross-list: `copyItemsInto` carries `amount_minor`/`quantity` (any kind into any kind); `listRepo.duplicate` copies the source kind.
- Backup: `backup.ts` round-trips `kind` + numeric fields; older backups import as `standard` / null / 0.
- Amount input is sanitized live (`sanitizeAmountText`): only digits and a single decimal point, ≤2 decimals, integer part capped at 6 digits — invalid keystrokes are rejected instead of silently stripped/merged (`123bgbv456` no longer becomes `123456`).
- i18n en/es: `list_kind_label`, `list_kind_standard`, `list_kind_numeric`, `item_amount_label`, `item_quantity_label`, `item_line_total_label`, `list_total_label`, `list_done_total_label`.
- Tests: `numeric.test.ts` (7), `itemRepo` numeric fields (3), `listRepo` kind (2), backup round-trip + legacy numeric (2), `ListDetailScreen` numeric (3). `npm run test:all` green (56 files, 488 tests); lint + typecheck clean.
- Docs: new `spec/features/026-numeric-lists/` (1-spec/2-plan/3-tasks) + roadmap entry.
- Verified on web at 375px (fresh IndexedDB): created a numeric list via the Type selector, added an item (Amount 1.50, qty 2) → line total 3.00, header Total 3.00 / Done 0.00; checking it moved Done to 3.00; a standard list shows no Amount/Total rows; 0 console errors.

[2026-09-28] spike | ListlyApp [027: pre-spec crypto spike for locked lists]
- Throwaway spike (no product code) to de-risk feature 027 (locked lists / encrypted vault) before writing the spec: throwaway `ListlyApp/spike/vaultSpike.ts` + `spike/VaultSpikeScreen.tsx` wired temporarily as the stack's `initialRouteName` (navigator + `RootStackParamList` `VaultSpike` route), all reverted and the `spike/` folder deleted after the measurements.
- Web (browser/jsdom-free real browser): expo-crypto AES-GCM primitives + `getRandomBytesAsync` + iterated-SHA-256 KDF all pass (salt, 256-bit key import from derived bytes, verifier, unicode round-trip, wrong-passphrase and GCM-tamper rejection); KDF iterated SHA-256 50k = 250 ms, 120k = 557 ms.
- Native (Android emulator `finly_test`, `sdk_gphone64_x86_64` API 35, x86_64) via Expo Go 57 → the AES module **is** bundled in Expo Go: all functional checks pass, but the iterated-SHA-256 KDF is ~60x slower than web (each `digestStringAsync` is a JS↔native bridge round-trip): 50k = 15 s, 120k = 36 s. Option A (pure-JS PBKDF2-HMAC-SHA256 via `@noble/hashes`) was also measured and rejected: 100k = 20 s, 600k = 123 s.
- Option B (`react-native-quick-crypto`, JSI/Nitro native PBKDF2) measured on the dev build: **sha256 600k = 52 ms**, **sha512 600k = 165 ms** (~3,000x faster than pure JS, ~8,000x faster than the bridge loop) — all checks pass including a native-derived-key + AES round-trip. Decision: **PBKDF2-HMAC-SHA-512 with 600,000 iterations** (digest + count stored per vault row for future upgrades); this **requires a development build** (quick-crypto cannot run in Expo Go); web will branch to `crypto.subtle` PBKDF2.
- Deps: added `react-native-quick-crypto ^1.1.7` + `react-native-nitro-modules ^0.37.1` (Expo config plugin `react-native-quick-crypto` in `app.json`); `expo-crypto` and the spike-only `@noble/hashes` were installed during the spike and uninstalled after (AES will come from quick-crypto in 027). `npx expo prebuild --platform android` + `npx expo run:android` generated the (already gitignored) `android/` dev-build project and installed it on the emulator.
- `npm run test:all` green after cleanup (56 files, 490 tests); typecheck + lint clean; navigator/`RootStackParamList` restored (no spike route), dev server stopped and port 8081 freed.
- No spec/roadmap change yet — feature 027 is still unscheduled; this entry records the spike and the resulting tech-stack decision.

[2026-09-28] + | spec/features/027-locked-lists/, spec/constitution/3-roadmap.md
- Created the spec set for feature 027 — locked lists (encrypted vault): `1-spec.md` (threat model + scope, functional requirements for lock/locked-state/unlock/remove-lock, cross-list guards, vault persistence + KDF/AES/backup, i18n/errors, 12 acceptance criteria), `2-plan.md` (architecture, `vaults` schema, crypto core + platform branches, `vaultRepo` operations, components, data flow, risks), `3-tasks.md` (checklist seeded from the completed crypto spike).
- Key decisions recorded: per-list passphrase (min 6 chars, unrecoverable), PBKDF2-HMAC-SHA-512 @ 600k → AES-256-GCM, locked list = badge + hidden progress + excluded from search/totals, in-memory unlock re-locked on leaving the screen, photos disallowed in locked lists (v1), vault exported encrypted in backups and locked items omitted from plaintext.
- Roadmap: added `## 027-locked-lists` (Status: not started).
- No code changes; implementation follows the spec.

[2026-09-28] + | ListlyApp [027: locked lists / encrypted vault]
- Crypto core: `src/utils/vaultCryptoCore.ts` (pure: RN-safe base64/UTF-8, `deriveKey`, `makeVerifier`, `seal`/`unseal`, `bindVaultCrypto`, `VaultCryptoError`, `KDF_ITERATIONS = 600_000`, `KDF_DIGEST = 'sha512'`, `KDF_VERSION = 1`); platform branches `vaultCrypto.native.ts` (react-native-quick-crypto: PBKDF2 + AES-256-GCM) and `vaultCrypto.ts` (web: `crypto.subtle`); derived-key buffers are zeroed after use.
- Schema: `SCHEMA_VERSION` 8 → 9; new `vaults` table (`list_id` PK FK→lists ON DELETE CASCADE, `salt`, `kdf_iterations`, `kdf_digest`, `kdf_version`, `verifier`, `payload`, `updated_at`) in canonical `createSchema`; Drizzle `vaults`, Zod `vaultSchema`, `Vault` type; `clearDataKeepSettings()` / `resetDatabase()` clear vaults.
- Repo: `src/database/repositories/vaultRepo.ts` — `listIds`, `exists`, `meta`, `readPlainItems`, `lock` (encrypt + insert vault + delete plaintext rows in one transaction), `unlock` (verify + decrypt to memory), `saveUnlocked` (re-encrypt on edit), `removeLock` (decrypt + re-insert plaintext + delete vault in one transaction).
- Backup: `data.vaults` exported as-is (encrypted) and restored on import; lock items are absent from `data.items`; legacy backups import with `vaults` defaulting to `[]`.
- State/guards: `AppContext` exposes `lockedListIds`; locked lists show a lock badge with hidden progress (`TileName` lock + `TileLocked`), are excluded from search/totals, and cannot be the source/target of copy-to-list, merge, or duplicate (hidden in `ListDetailScreen` and `EditListScreen`).
- UI: `LockListModal` (passphrase ×2, min 6 chars, unrecoverable-warning checkbox, blocked when the list has photos), `VaultUnlockView` (passphrase lock screen + *Remove lock*), `UnlockedVaultList` (in-memory encrypted session: add/edit/delete/toggle/reorder re-encrypt via `saveUnlocked`), `useVaultSession` (unlock/relock; re-locks on leaving the screen via focus-effect cleanup). `AddItemBar` gained an optional `onSubmitOverride` so the unlocked session can persist through the vault.
- i18n en/es: `list_lock_*`, `list_locked_*`, `vault_*`, `list_unlock_*`, `list_remove_lock*`, `home_locked`; `errors.ts` adds `lockList`/`unlockList`/`removeLock`/`saveLockedList`; `ICONS.lock`/`unlock`/`removeLock`.
- Tests: `tests/utils/vaultCrypto.test.ts` (11: encoding, deterministic key, verifier accept/reject, unicode round-trip, wrong-passphrase + GCM tamper rejection, bound API + 600k/sha512 defaults), `tests/database/vaultRepo.test.ts` (8: lock deletes plaintext + stores vault, unlock fidelity, wrong passphrase, re-encrypt on edit, remove-lock restore, listIds, cascade delete), backup (+2: encrypted vault export/import + legacy no-vaults), `tests/components/LockListModal.test.tsx` (5), `ListDetailScreen` (+5: lock action, lock screen, wrong passphrase, unlock session, hidden cross-list actions). New `tests/database/quickCryptoMock.ts` (setupFile) keeps repo tests off the native module. Suite baseline: 59 files, 521 tests; typecheck + lint clean.
- Note: `react-native-quick-crypto` requires a development build (no Expo Go); native KDF timing was verified by the spike (PBKDF2 sha512 600k ≈ 165 ms), web uses `crypto.subtle`.
- Docs: roadmap 027 entry; `docs/harnesses.md` baseline refreshed to 59 files / 521 tests.

[2026-09-29] fix | ListlyApp/src/screens/ListDetailScreen.tsx
- Fix: *Remove lock* deleted the vault row but the screen stayed on the lock view because `lockedListIds` was not refreshed. `onRemoveLock` now `await vaultRepo.removeLock(...)` then `await refresh()`, so the list returns to the normal plaintext view immediately.
- Found during the 027 browser verification loop (web, 375px, `crypto.subtle`); re-verified after the fix.
- 027 verified end-to-end: lock action + modal (short-passphrase rejection, unrecoverable warning, confirm), locking hides item names and shows the lock screen, Home tile lock badge + "Locked" progress, locked items excluded from search, wrong passphrase rejected, correct passphrase unlocks (items visible), locked state persists across reload, re-locks on leaving the screen, and *Remove lock* restores plaintext items. 0 console errors (only the pre-existing `props.pointerEvents` warning). Native KDF path/camera capture not checkable on web (web uses `crypto.subtle`; native PBKDF2 timing documented from the spike).
- Backups: encrypted-vault round-trip and legacy no-vaults import covered by `backup.test.ts`.
- Docs: 027 `1-spec.md` acceptance criteria flipped `[x]`; roadmap 027 → done.

[2026-09-29] fix | ListlyApp/src/screens/ListDetailScreen.tsx, ListlyApp/src/components/UnlockedVaultList.tsx (deleted)
- Fix: the unlocked vault session rendered a stripped-down parallel view (`UnlockedVaultList`), so the unlocked list lost the normal UX — the add bar was not bottom-pinned, the edit button did nothing, and delete / search / sort / Complete all / Uncomplete all / Clear completed were missing or inert.
- Removed `UnlockedVaultList` and made the real `ListDetailScreen` render tree serve the unlocked session: item data comes from `vault.items`, and every mutation routes through the vault when unlocked — `toggle`, drag-reorder `reorder`, select-mode `deleteMany`, add (`AddItemBar` `onSubmitOverride`), edit save, delete, and the batch actions (`setAllChecked` / `deleteCompleted`) all persist re-encrypted via `saveUnlocked`. Wrappers `handleSaveEdit` / `handleDeleteItem` / `handleCompleteAll` / `handleUncompleteAll` / `handleClearCompleted` branch on `vault.unlocked`.
- Result: an unlocked locked list now behaves exactly like a normal list (bottom-pinned add bar, working edit modal, search, select mode, sort, batch toolbar, drag-reorder), while writes stay encrypted at rest.
- Verified on web at 375px (relocked then unlocked "Secrets"): add-bar bounding box bottom = 691 of a 720 viewport (pinned), edit modal opens + renames, delete confirm removes the item, search filters ("Recovery" hides "PIN 9999"), sort pill + batch toolbar present. 0 console errors.
- `npm run test:all` green (59 files, 521 tests).

[2026-09-29] feat | ListlyApp [027: change passphrase]
- A locked list, once unlocked, now shows *Change passphrase* instead of *Lock list* (the plain header action is gated: `locked ? 'key-outline'/change : 'lock-closed-outline'/lock`).
- `vaultRepo.changePassphrase(listId, currentPassphrase, newPassphrase)`: verifies the current passphrase against the stored `verifier` (rejects with `VaultCryptoError('wrong_passphrase')` otherwise), decrypts the payload, re-seals with the **new** passphrase under a **fresh salt** while preserving `kdf_iterations`/`kdf_digest`, and updates the vault row. Items are untouched.
- `useVaultSession.changePassphrase` calls the repo then updates the in-memory passphrase so subsequent edits re-encrypt with the new one.
- `LockListModal` gained a `mode: 'lock' | 'change'` prop (reused, not duplicated): change mode adds a *Current passphrase* field, uses the change title/confirm (`list_change_passphrase_confirm` = "Change"/"Cambiar"), and surfaces `vault_wrong_current` inline on a wrong current passphrase or other errors generically.
- `ListDetailScreen`: header now hides the clipboard copy actions for a locked list and shows the change action; a transient *Passphrase changed* label (`COPY_FEEDBACK_MS`) confirms success. New `ERROR_SCOPE.changePassphrase`.
- i18n en/es: `list_change_passphrase`, `list_change_passphrase_title`, `list_change_passphrase_confirm`, `vault_current_passphrase_label`, `vault_wrong_current`, `vault_passphrase_changed`.
- Tests: `vaultRepo.test.ts` +3 (old fails/new works/items intact, wrong current rejected + vault usable, fresh salt + preserved iterations/digest), `LockListModal.test.tsx` +2 (change mode requires current; confirms with new+current), `ListDetailScreen.test.tsx` +2 (Change shown not Lock on a locked list; change flow calls `changePassphrase`). `npm run test:all` green (59 files, 528 tests); typecheck + lint clean.
- Verified on web at 375px: unlocked "Secrets" shows *Change passphrase* (copy buttons hidden), modal requires the current passphrase (wrong → "Current passphrase is incorrect"), correct change closes the modal, re-locks on leaving, and the **new** passphrase unlocks while the old no longer does. 0 console errors.
- Docs: 027 `1-spec.md` (change-passphrase section + 2 criteria), roadmap 027 note, `docs/harnesses.md` baseline (528 tests).

[2026-09-29] fix | ListlyApp/src/screens/ListDetailScreen.tsx
- Fix: the *Change passphrase* key button only appeared when the locked list had at least one item, so an **empty** locked list had no way to change its passphrase. The header `trailing` block was gated on `items.length > 0`; changed the outer condition to `locked || items.length > 0` and the clipboard-copy group to `!locked && items.length > 0`.
- Result: a locked list always shows *Change passphrase* (items or not); copy actions keep their `items > 0` requirement; a normal empty list is unchanged.
- Test: `ListDetailScreen.test.tsx` +1 ("shows Change passphrase for a locked list with no items"). `npm run test:all` green (59 files, 529 tests).
- Verified on web at 375px: unlocked "Secrets", deleted its only item (0/0), the key button remained and opened the change-passphrase modal. 0 console errors.
- Docs: 027 `1-spec.md` change-passphrase criterion notes it is shown even when empty; `docs/harnesses.md` baseline (529 tests).

[2026-09-29] fix | ListlyApp/src/screens/ListDetailScreen.tsx, spec/features/027-locked-lists/1-spec.md
- Fix: the *Lock list* action (lock icon) only appeared when the list had at least one item, because the header `trailing` group was gated on `locked || items.length > 0`. Now the header action group always renders: any non-locked list shows *Lock list* (with or without items) and any locked list shows *Change passphrase*; the clipboard-copy actions keep their `!locked && items.length > 0` requirement.
- Enables the "lock first, then fill" flow: a list can be locked while empty (its vault seals an empty payload), then unlocked to add items (encrypted), change passphrase, etc. The photos guard and cross-list guards are unchanged.
- Spec: 027 `1-spec.md` §1 now states the *Lock list* action is available for any list (not only ones with items); acceptance criterion updated; roadmap 027 note updated.
- Test: `ListDetailScreen.test.tsx` +1 ("shows a lock action for a list with no items"). `npm run test:all` green (59 files, 530 tests).
- Verified on web at 375px: an empty list shows the lock icon, locking works, and after unlocking an item can be added. 0 console errors.
- Docs: `docs/harnesses.md` baseline (530 tests).

[2026-09-29] fix | ListlyApp/src/utils/vaultCrypto.native.ts, ListlyApp/src/utils/vaultCrypto.ts, ListlyApp/src/screens/ListDetailScreen.tsx, ListlyApp/tests/database/quickCryptoMock.ts
- Fix: the app crashed in **Expo Go** with `TurboModuleRegistry.getEnforcing(...): 'QuickBase64' could not be found` because `vaultCrypto.native.ts` imported `react-native-quick-crypto` at module top-level, and the startup graph (`App → AppContext → database → vaultRepo → vaultCrypto`) evaluated it. Expo Go ships no quick-crypto native module, so locked lists cannot work there — but the app must not crash.
- `vaultCrypto.native.ts` now loads quick-crypto **lazily** (`require` inside the platform methods, cached) and exposes `isVaultAvailable()`; vault operations throw `VaultCryptoError('unsupported')` when the module is absent. `vaultCryptoCore` `VaultCryptoError` gained the `'unsupported'` code; the web module (`vaultCrypto.ts`) returns `isVaultAvailable() === true`.
- `ListDetailScreen`: a `vaultReady = isVaultAvailable()` flag. When unavailable, the *Lock list* / *Change passphrase* action stays visible and opens a new **`InfoModal`** ("Locked lists need a development build"), and a previously locked list shows an explanatory `EmptyState` instead of the passphrase prompt. All other features work unchanged. New i18n en/es `vault_unsupported_title` / `vault_unsupported_message`; new `src/components/InfoModal.tsx`.
- Tests: the global `tests/database/quickCryptoMock.ts` now also injects its mock via a `globalThis`-backed test seam (`__setQuickCryptoModuleForTests`) so repo tests survive `vi.resetModules()`; `ListDetailScreen.test.tsx` +2 (lock action explains when the vault is unavailable; locked list shows the unsupported view). Suite: 59 files, 532 tests; typecheck + lint clean.
- Docs: new `docs/locked-lists.md` (crypto, platform support matrix web / dev build / Expo Go, graceful degradation, how to test); `spec/constitution/7-platform-differences.md` + `027/1-spec.md` updated; `docs/harnesses.md` baseline (532 tests).
- Verified on web at 375px: app boots, locked lists still show the normal unlock screen (`crypto.subtle`), 0 console errors. Expo Go now boots and shows the explanatory message on the lock action (developer to confirm on device).

[2026-09-29] fix | ListlyApp/src/utils/vaultCrypto.native.ts
- Fix: opening a list in **Expo Go** still raised `TurboModuleRegistry.getEnforcing(...): 'QuickBase64' could not be found` from `isVaultAvailable()`, even though the `require('react-native-quick-crypto')` was wrapped in `try/catch`. Cause: Metro's `guardedLoadModule` calls `ErrorUtils.reportFatalError(e)` when a module factory throws, so the red screen is raised *before* the catch runs — swallowing the rethrow is too late.
- `vaultCrypto.native.ts` now **probes** the native module first with the non-throwing `TurboModuleRegistry.get('QuickBase64')` (accessed via `require('react-native')`, not a static named import) and only then `require`s quick-crypto. Where the module is absent (Expo Go) the require is skipped entirely, so no fatal report; `isVaultAvailable()` returns `false` and the existing InfoModal / unsupported view handle it.
- Note: the probe keys on `QuickBase64` (the module `react-native-quick-base64` resolves); documented in a comment and in `docs/locked-lists.md`.
- Tests: new `tests/utils/vaultCryptoNative.test.ts` (+2: `isVaultAvailable()` true with the module, and false + `VaultCryptoError('unsupported')` when the override is null). Suite: 60 files, 534 tests; typecheck + lint clean.
- Docs: `docs/locked-lists.md` (probe + Metro fatal-report rationale), `docs/harnesses.md` baseline (534 tests).
- Verified on web at 375px (unchanged path, 0 console errors); Expo Go to be re-confirmed on device.

[2026-09-29] ~ | ListlyApp/src/utils/vaultCryptoCore.ts, vaultCrypto.ts, vaultCrypto.native.ts, vaultRepo.ts, useVaultSession.ts, LockListModal.tsx
- Refactor (behavior-preserving) of the vault constants/codes flagged in review:
  - `vaultCryptoCore.ts` is the single source for the crypto parameters: added `AES_IV_BYTES = 12` and `AES_TAG_BYTES = 16` (the duplicated `IV_BYTES` in `vaultCrypto.ts`/`vaultCrypto.native.ts` and the magic `TAG_BYTES` are gone); web now passes `tagLength: AES_TAG_BYTES * 8` explicitly.
  - Error codes are a typed const map (house pattern, mirrors `ERROR_SCOPE`): `VAULT_ERROR = { wrongPassphrase, tampered, unsupported } as const` + `type VaultErrorCode`. `VaultCryptoError` takes `VaultErrorCode`; all literals replaced in `vaultCryptoCore`, `vaultCrypto.native`, `vaultRepo`, `useVaultSession`, `LockListModal` and the two tests.
  - Minor: `VERIFIER_LABEL` constant for the verifier input separator; `webCryptoHashName` uses a `WEB_CRYPTO_DIGEST` map instead of inline literals; `vaultRepo` invariant messages extracted (`VAULT_NOT_FOUND`, `VAULT_PAYLOAD_INVALID`).
  - Native-only constants kept local but clarified: `QUICK_CRYPTO_MODULE` (canary) and `QUICK_CRYPTO_OVERRIDE_KEY` (test-only global, documented).
- No behavior or public-API change beyond a few additional named exports from `vaultCryptoCore`. `npm run test:all` green (60 files, 534 tests); typecheck + lint clean. No spec change.

[2026-09-29] ~ | ListlyApp/src/hooks/useRequiredContext.ts, src/context/{AppContext,ConfigContext,ToastContext}.tsx
- Refactor (behavior-preserving): new `useRequiredContext(context, hookName, providerName)` helper DRYs the repeated "must be used within provider" guard; `useApp` / `useConfig` / `useToast` now delegate to it, keeping their exact error messages and return types. Removed the now-unused `useContext` imports from the three contexts.
- `npm run test:all` green (60 files, 534 tests); typecheck + lint clean. No spec change.

[2026-09-29] fix | ListlyApp/tests/database/itemRepo.test.ts
- Fix a **flaky** test: `itemRepo.updated_at` compared values written at operation time against a fresh `dbTimestamp()` at assertion time, and `dbTimestamp()` has second granularity, so crossing a second boundary made it fail intermittently (CI saw `12:32:28` vs `12:32:29`). The failure was timing-only and unrelated to the vault/context refactor.
- Replaced the 6 exact `toBe(dbTimestamp())` assertions (create, update/toggle/reorder/setAllChecked, duplicateItems) with a new `expectStamped(value, before, after)` helper that brackets each write and asserts the stamp lies within `[before, after]` (lexicographic compare on the sortable `YYYY-MM-DD HH:MM:SS` format). Test-only; no production code change.
- `npm run test:all` green (60 files, 534 tests); the itemRepo file passed across repeated runs.

[2026-09-29] + | ListlyApp/modules/listly-share/, src/utils/backupIO.ts, src/utils/backupIO.web.ts, src/constants/shareResult.ts, src/utils/platform.ts
- Ported Finly's Data export UX: new local Expo module `listly-share` (`ListlyShare`) — `shareFileAsync` (FileProvider + chooser; iOS reports the true outcome via `completionWithItemsHandler`, Android resolves `saved` on activity return) and `saveToDownloadsAsync` (Android `MediaStore.Downloads`, API 29+, `IS_PENDING`). Includes `expo-module.config.json`, `package.json`, `src/index.ts` (lazy `requireNativeModule`, never crashes at startup), `android/build.gradle`, Android manifest (FileProvider `${applicationId}.listlyshare.fileprovider` + SEND query), `listly_share_paths.xml`, `ListlyShareModule.kt`, `ListlyShareModule.swift`.
- `src/constants/shareResult.ts` (`ShareResult` + `ShareResultValue`); `src/utils/platform.ts` gains `isAndroid` + `isAndroidPlatform()`.
- `backupIO.ts`: `saveBackupFile` returns `ShareResultValue` (writes the file, shares via the module after the `expo-sharing` availability gate) and new `saveBackupToDownloads` (Android-only); `backupIO.web.ts` returns `saved` and adds `saveBackupToDownloads`. `.gitignore` ignores `modules/**/android/build/`.

[2026-09-29] + | ListlyApp/src/screens/settings/DataScreen.tsx
- Data export switched to the Finly flow: Android first saves to the public Downloads folder and shows a *saved* `Alert` with **Share** / **Done** (optional share, fire-and-forget; falls back to the share sheet when the Downloads write returns `false`); otherwise it shares and shows success only when the share completed (`dismissed` shows nothing). Import/delete-all/factory-reset now use native `Alert`s instead of the inline status message (removed the inline `status` state, `Text`/`useFontSize`/`StyleSheet` usage).
- i18n en/es: `backup_dialog_title`, `settings_export_downloaded_title`, `settings_export_downloaded_message`, `settings_export_share_action`, `settings_export_done_action` (to be translated in the pending 9-language pass).
- Tests: rewrote `tests/screens/settings/DataScreen.test.tsx` for `Alert` + the Android flow (success only on saved, dismissed = no feedback, Downloads alert with Share triggering the share, fallback when unsupported, failure → error); new `tests/utils/backupIO.test.ts` (saved-when-unavailable, delegates to `shareFileAsync`, Downloads Android-only + delegation) and `tests/utils/platform.test.ts`. `npm run test:all` green (62 files, 544 tests); typecheck + lint clean.
- Docs: `spec/features/005-settings-screen/1-spec.md` (§5/§6 + acceptance criteria: Android Downloads + share, success only on real completion, feedback native-only), `spec/constitution/7-platform-differences.md`, `spec/constitution/3-roadmap.md`, `docs/harnesses.md`.
- Note: the local native module requires a development/release build (not Expo Go); export/import feedback (Alert) is not checkable in the web loop.

[2026-09-29] fix | ListlyApp/src/utils/vaultCrypto.native.ts, src/screens/ListDetailScreen.tsx, tests/database/quickCryptoMock.ts
- Fix: locking a list on a native build failed with the generic "Something went wrong. Please try again." Root cause: `vaultCrypto.native.ts` used the **global** `Buffer` in `encrypt`/`decrypt`, but `react-native-quick-crypto` only sets `global.Buffer` when `install()` is called (we don't), so the runtime threw `ReferenceError: Buffer is not defined` (dev builds masked it via a dev-only polyfill). Now uses the module's own `crypto.Buffer` (`quick().Buffer`), so no global is required.
- Added error logging to the vault entry points so failures are no longer swallowed: the lock/change `onConfirm`, `onUnlock` and `onRemoveLock` now `logError(ERROR_SCOPE.lockList|changePassphrase|unlockList|removeLock, error)` and rethrow (the user still sees the generic message; the real error reaches the toast/console).
- `tests/database/quickCryptoMock.ts` mock gained `Buffer`. `npm run test:all` green (62 files, 544 tests); typecheck + lint clean.

[2026-09-29] ~ | ListlyApp/src/i18n/en.ts, src/i18n/es.ts, src/screens/settings/DataScreen.tsx, tests/screens/settings/DataScreen.test.tsx
- Aligned the Settings > Data export/import feedback with Finly (en/es): every result is now a **title + message** `Alert` instead of a single-line message.
  - `settings_export_success_title/_message` ("Export complete" / "Your data has been saved to a backup file."), `settings_export_error_title/_message` ("Export failed" / "Could not export your data.").
  - `settings_import_confirm_title/_message` ("Import data?" / "This will replace all current lists, collections, items, and settings with the contents of the backup. This cannot be undone.").
  - `settings_import_success_title/_message`, `settings_import_error_title/_message`, `settings_import_invalid_title/_message` ("Invalid backup"), `settings_import_newer_title/_message` ("Newer backup" / "…Update the app to import it.").
  - `backup_dialog_title` → "Listly backup" / "Copia de seguridad Listly"; Downloads alert ES title "Copia guardada" and done action "Listo".
- `DataScreen` now calls `Alert.alert(title, message)` for all export/import outcomes. Tests updated to the new title+message calls. `npm run test:all` green (62 files, 544 tests); typecheck + lint clean.
- Note: the new/aligned keys must be carried into the pending 9-language pass.

[2026-09-29] ~ | spec/constitution/2-tech-stack.md, docs/programming-concepts.md
- Docs sync: refreshed `2-tech-stack.md` — tech list now includes `react-native-quick-crypto` (+ `react-native-nitro-modules`) and the local `listly-share` module, with a note that both require a development/release build (not Expo Go); rewrote the file-structure tree to match the current `src/` (vault, numeric, sort, error bus, all hooks/components/repos, `modules/listly-share/`).
- `programming-concepts.md`: added learning entries for the recent commits — **Cryptography** (encryption at rest, AES-GCM, PBKDF2 + salt/iterations, verifier, key zeroization), **Native modules** (local Expo module, lazy loading, probing a TurboModule before requiring it + not relying on optional-library globals, dev build vs Expo Go graceful degradation, FileProvider/MediaStore Downloads, iOS share result), **Money** (integer minor units), **Concurrency** (serialized async transactions), and **TypeScript** (`as const` maps for typed codes).
- Docs only; no code change.

[2026-09-29] fix | ListlyApp/src/database/sqliteWeb.ts, src/database/storage/indexedDb.ts, src/database/engine.web.ts, src/utils/errors.ts
- Fix (Tier 0): web persistence failures were silently swallowed — `indexedDb.set`/`get` resolved on error and `SqlJsDatabase.persistIfCommitted` caught with `console.error`, so writes reported success even when the IndexedDB persist failed (data lost on reload).
- `indexedDb.ts`: open/read/write now **reject** on error (returns `null` only when `indexedDB` is unavailable).
- `sqliteWeb.ts`: `persistIfCommitted` now **propagates** the failure (while keeping the serialized queue alive) and notifies a new `onPersistenceError` listener; `engine.web.ts` subscribes it to `logError(ERROR_SCOPE.saveDatabase, error)` (new scope) so the existing toast surfaces "unsaved" states.
- Tests: new `tests/database/sqliteWeb.test.ts` (persist failure rejects + notifies; nested transaction rejected).

[2026-09-29] fix | ListlyApp/src/database/transaction.ts, src/database/drizzle/engine.ts, src/database/database.ts, src/database/backup.ts, src/database/sqliteWeb.ts
- Fix (Tier 0): a **single transaction authority**. Writes now all go through `runExclusive(handle, task)` in the new `src/database/transaction.ts`, which chains every transaction onto the previous one. `drizzle/engine.ts`'s `withTransaction` delegates to it, and `database.ts` (`migrate`, `clearDataKeepSettings`, `resetDatabase`) and `backup.ts` (`applyBackup`) no longer call `handle.withTransactionAsync` directly — removing the two-authority race that could nest `BEGIN` on web.
- `sqliteWeb.ts` `withTransactionAsync` now throws a clear error on a nested transaction (defensive guard).
- Tests: new `tests/database/transaction.test.ts` (serializes concurrent transactions; propagates errors and keeps the chain usable). `npm run test:all` green (64 files, 548 tests); typecheck + lint clean.

[2026-09-29] ~ | ListlyApp/src/hooks/useItemStore.ts, src/hooks/useItemEditing.ts, src/hooks/useBatchItemActions.ts, src/hooks/useVaultSession.ts, src/screens/ListDetailScreen.tsx
- Refactor (Tier 1, behavior-preserving): new `useItemStore({ listId, repoItems, refresh, vault })` exposes one item API (`items`, `add`, `update`, `remove`, `removeMany`, `toggle`, `setAllChecked`, `deleteCompleted`, `reorder`) that dispatches to the vault session when unlocked (re-encrypting writes) or to `itemRepo` + `refresh` otherwise, keeping the existing `ERROR_SCOPE`s. Removes the **9** `if (vault.unlocked)` branches and the six screen-level `handle*` wrappers from `ListDetailScreen` (which no longer imports `itemRepo`, `runSafelyAsync` or `serializeItemPhotos`).
- `useItemEditing` and `useBatchItemActions` became dependency-injected state controllers (`useItemEditing({ items, update, remove })`, `useBatchItemActions({ setAllChecked, deleteCompleted })`) with no repo calls or logging of their own (the store owns it); `useSelectMode` unchanged.
- Folded Tier 2 cleanups: removed the dead `VaultSessionState` export and the module-level `tempIdCounter` (now derived per-add); fixed the `done`/`total` single-line artifact in `ListDetailScreen`.
- Fix: vault temp-id collision — a new item's id is now derived below the smallest existing id (`min(ids, 0) - 1`), so a fresh session can't reuse a negative id already persisted in the vault (previously showed a React duplicate-key warning when adding items to a previously-locked list).
- Tests: new `tests/hooks/useItemStore.test.ts` (repo vs vault dispatch, `add` position, logging), `tests/hooks/useVaultSession.test.ts` (new id below existing). `npm run test:all` green (66 files, 554 tests); typecheck + lint clean.
- Verified on web at 375px: normal list add/toggle/clear-completed; locked list lock → unlock → add two items (no duplicate-key error, 3 rows, 0/3). 0 console errors.

[2026-09-29] fix | ListlyApp/src/hooks/useVaultSession.ts, src/screens/ListDetailScreen.tsx, src/components/VaultUnlockView.tsx
- Fix: **"Remove lock" with a wrong passphrase** on the lock screen no longer shows the generic error toast. `useVaultSession.removeLock` now mirrors `unlock`: on `VaultCryptoError(wrong_passphrase)` it sets `wrongPassphrase` and resolves `false` (no throw); it resolves `true` on success (relock). The screen only calls `refresh()` when it returns `true`, and `VaultUnlockView` already renders `vault_wrong_passphrase` ("Wrong passphrase" / "Contraseña incorrecta").
- `VaultUnlockView.run` gained a `catch` so an already-logged failure can't surface as an unhandled promise rejection (it was `void run(...)` with `try/finally` only).
- Tests: `tests/hooks/useVaultSession.test.ts` (wrong passphrase → `false` + flag, correct → `true` + relock), `tests/screens/ListDetailScreen.test.tsx` (Remove lock with a bad passphrase shows "Wrong passphrase"). `npm run test:all` green (66 files, 557 tests); typecheck + lint clean.

[2026-09-29] fix | ListlyApp/src/utils/vaultCryptoCore.ts, src/screens/ListDetailScreen.tsx, src/components/LockListModal.tsx, src/hooks/useVaultSession.ts
- Fix: a **wrong current passphrase** when changing a list's passphrase is no longer logged as a failure. `ListDetailScreen`'s change-passphrase catch only calls `logError` for unexpected errors now; previously it logged `Failed to change passphrase: [VaultCryptoError: wrong_passphrase]` **and** triggered the generic error toast (`ToastContext` subscribes to `logError`) on top of the correct inline "Current passphrase is incorrect". Coding the wrong current passphrase is an expected user error, not a system failure.
- New helper `isWrongPassphrase(error)` in `vaultCryptoCore.ts` (re-exported by `vaultCrypto`), replacing the repeated `error instanceof VaultCryptoError && error.code === VAULT_ERROR.wrongPassphrase` predicate at all four call sites (`LockListModal`, `useVaultSession.unlock` / `removeLock`, `ListDetailScreen`).
- Tests: `tests/utils/vaultCrypto.test.ts` (helper classification), `tests/screens/ListDetailScreen.test.tsx` (wrong current → inline message and no `change passphrase` log; unexpected failure → generic message and logs). `npm run test:all` green (66 files, 560 tests); typecheck + lint clean.

[2026-09-29] ~ | ListlyApp/src/components/EntityTile.tsx, src/components/ListsView.tsx, src/components/{ListCard,ListRow,CollectionCard,CollectionRow}.tsx
- Refactor (Tier 1, behavior-preserving): the four near-identical tiles (`ListCard`, `ListRow`, `CollectionCard`, `CollectionRow`) collapse into one `EntityTile` driven by a normalized `TileEntity` (`kind`, `name/color/icon/pinned`, `completed/total`, optional `locked` + `collection`) and a `layout: 'card' | 'row'`. It composes the same `Tile` primitives (`TileShell/TileName/TileProgress/TileLocked/TileIcon/TileBadge/TileCollection`) + `SelectionCheck`/`TypeBadge` and keeps the exact card/row structure, collection accent bar, pinned star, locked label, drop-target hint, and select-mode checkbox role/label. `ListsView` (the sole consumer) builds the entity models and picks card/row via the existing layout variants.
- Removed the four component files and their three test files; replaced with `tests/components/EntityTile.test.tsx` covering list/collection × card/row, press, icon color, collection line shown/hidden in select mode, pin star, locked label, drop hint, and select-mode role.
- Docs: `spec/constitution/2-tech-stack.md` structure tree + `docs/harnesses.md`. `npm run test:all` green (64 files, 556 tests); typecheck + lint clean.

[2026-09-29] ~ | ListlyApp/src/hooks/useItemDraft.ts, src/components/{ItemFields,ItemPhotosField,AddItemBar,ItemFormModal,ItemRow}.tsx
- Refactor (Tier 1, behavior-preserving): item name/amount/quantity/note/photo field state and markup are now shared between the add bar and the edit modal.
  - New `useItemDraft({ existingNames, numeric, validateOnChange })` owns `name/note/amount/quantity/error` + `useItemPhotos`, `validate()`, `buildPayload()` (numeric vs standard), `applySeed(seed)` and `reset()`; it replaces the duplicated local state and submit/validation logic in `AddItemBar` and `ItemFormModal`.
  - New `ItemFields.tsx` exports `ItemNameField` (input + `CharCounter`), `ItemAmountField` (sanitized decimal input), `ItemQuantityField` (`QuantityStepper` + labels), `ItemNoteField` (multiline + counter) and `ItemLineTotal` (formatted `amount × quantity` with the labelled total); `ItemPhotosField.tsx` wraps `PhotoSection` over the draft's photo handlers. Consumers pass a `style` so the bar (`c.surface`, fixed height) and modal (`c.background`, `FormField`) looks are unchanged.
  - `AddItemBar` and `ItemFormModal` are rewired onto the draft + fields (`ItemFormModal` keeps its seed-once-on-open effect so a parent re-render never resets typed input); `ItemRow` uses `ItemLineTotal` for its numeric total.
  - `ItemPhotosField` is a separate module (not part of the `ItemFields` barrel) so `ItemRow`, which only needs the line total, does not pull `PhotoSection`/`expo-image-picker` into its import graph.
- Tests: new `tests/hooks/useItemDraft.test.ts` (validate on demand + live, duplicate, numeric/standard payload, amount sanitize, seed/reset) and `tests/components/ItemFields.test.tsx` (counters, placeholders, stepper labels, line total); existing `ItemFormModal`/`ItemRow`/`ListDetailScreen` suites unchanged. `npm run test:all` green (66 files, 567 tests); typecheck + lint clean.
- Verified on web at 375px (0 console errors): standard add clears the bar, edit modal seeds name/note, numeric add shows a live total (`1.50 × 2` → `3.00`) and updates the header Total, numeric edit modal seeds Amount/Quantity.

[2026-09-29] fix | ListlyApp/src/components/AddItemBar.tsx
- Fix: the list-detail **add bar ignored the Personalization "Notes" / "Photos" toggles**. `showNotes` / `showPhotos` hid the note/photo UI in the item rows and edit modal but the add bar rendered its "toggle details" chevron, note field and photo section unconditionally, so hiding either toggle had no effect when adding an item (most noticeable on numeric lists, where the always-on details block stacked under the amount/quantity row).
- `AddItemBar` now reads `config`: each field follows its own toggle and the details chevron is hidden when **both** are off (`canAddDetails = showNotes || showPhotos`), with an effect collapsing the expanded block if the toggles change to "both off" mid-open. Amount/quantity/line total on numeric lists are unchanged.
- Spec: clarifying requirement added to `spec/features/005-settings-screen/1-spec.md` (§4) and `spec/features/015-settings-sections/1-spec.md` (§7) — the item-form scope explicitly includes the add bar.
- Tests: new `tests/components/AddItemBar.test.tsx` (default details, notes-only, photos-only, both-off chevron, numeric unaffected). `npm run test:all` green (67 files, 573 tests); typecheck + lint clean.
- Verified on web at 375px, 0 console errors: English + Spanish; standard list (Notes off → no note field, Photos on; both off → no chevron) and numeric list (both off → no chevron while Amount/Quantity/Total stay).

[2026-09-29] fix | ListlyApp/vitest.config.mts
- Fix (test harness): `test-renderer` was resolved to **two different builds** — Node's `require` picked `main` (`dist/index.cjs`) while Vite picked `module` (`dist/index.js`) — so `@testing-library/react-native`'s module-level cleanup queue existed twice and `vitest-native` warned on every run ("resolves to two different files"). `vitest.config.mts` now pins `resolve.mainFields` (`module` → … → `main`) and aliases `test-renderer` to its CJS entry so both resolvers agree on one file; the warning is gone.
- No app code changed. `npm run test:all` green (67 files, 573 tests) and stable across three consecutive runs; typecheck + lint clean. Spot-runs of the component/hook/screen suites individually also pass.

[2026-09-29] + | ListlyApp/src/hooks/useItemDisplayFlags.ts, src/database/{schemas,configDefaults}.ts, src/screens/settings/PersonalizationScreen.tsx, src/components/{ItemRow,AddItemBar,ItemFormModal}.tsx
- Feature (028, per-kind optional fields): the Notes / Photos optional-field options are now configurable **independently for standard and numeric lists**. `Config` gains `showNotesNumeric` / `showPhotosNumeric` / `editShowNotesNumeric` / `editShowPhotosNumeric` (default `true`, DB keys `*_numeric`); the existing four keys stay the standard-list flags, so standard behavior is unchanged and no schema-version bump is needed (row-per-key config, lenient read → existing installs and legacy backups fill the new keys with the defaults).
- New `useItemDisplayFlags(numeric)` resolves the effective `{ showNotes, showPhotos, editShowNotes, editShowPhotos }` pair; `ItemRow`, `AddItemBar` and `ItemFormModal` read through it (each already receives the list's `numeric`; the add bar keeps sharing the *Item display* flags with the rows).
- Personalization: the optional-field cards are grouped under **Standard lists** and **Numeric lists** headings (Item display + Edit item each) — eight checkboxes total; new i18n `settings_standard_lists` / `settings_numeric_lists` (en/es).
- Tests: `tests/hooks/useItemDisplayFlags.test.ts`, `tests/components/ItemRow.perKind.test.tsx` (new), plus kind-aware cases in `AddItemBar`/`ItemFormModal`, `PersonalizationScreen` (8 toggles), `schemas`/`dbDrift`/`backup` (round-trip + legacy defaults) and the config stub. `npm run test:all` green (69 files, 584 tests); typecheck + lint clean.
- Spec: new `spec/features/028-per-kind-optional-fields/` (1-spec / 2-plan / 3-tasks), roadmap 028 entry, and a clarifying bullet in 015's 1-spec.

[2026-09-30] ~ | ListlyApp/src/database/access.ts, repositories/{listRepo,itemRepo,collectionRepo,configRepo,vaultRepo,appData}.ts, src/context/AppContext.tsx
- Refactor (Tier 1, behavior-preserving): the database access boundary is consolidated. New `src/database/access.ts` exports `read(task)` (resolves the Drizzle handle) and `write(task)` (runs `withTransaction`); every repository method now opens with `read(async db => …)` / `write(async db => …)` instead of the repeated `const db = await getDrizzle()` (24 sites) and `withTransaction(async db => …)` boilerplate. Identical SQL, queries and transaction scope — only the handle acquisition is centralized. `getDrizzle`/`withTransaction` (and their singleton/serialization semantics) are unchanged.
- New `repositories/appData.ts` `loadAppData()` returns `{ lists, itemsByListId, collections, listsByCollectionId, baseLists, lockedListIds }`, moving the derive/grouping logic out of `AppContext` (which now calls the one loader for both the initial load and `refresh`).
- Fixed the `vaultRepo.removeLock` signature/multi-statement formatting artifact.
- Tests: existing repos/backup/contract/screen suites unchanged and green; new `tests/database/access.test.ts` (read passes the db through; write delegates to `withTransaction`). `npm run test:all` green (70 files, 586 tests); typecheck + lint clean.
- Verified on web at 375px (0 console errors): Home loads collections + standalone lists with counts and the locked badge; add item → progress updates; delete item → progress reverts. Release APK rebuilt and smoke-tested on device.
- Docs: `spec/constitution/2-tech-stack.md` tree (`access.ts`, `appData`) + `docs/harnesses.md`.

[2026-09-30] ~ | ListlyApp/src/hooks/{useListsViewData,useListsSelection,useListsDrag}.ts, src/components/ListsView.tsx
- Refactor (Tier 1, behavior-preserving): `ListsView`'s logic is extracted into three hooks, leaving the component as wiring + JSX (474 → ~360 lines incl. JSX).
  - `useListsViewData({ mode, collectionId, query, lists, collections, listsByCollectionId, baseLists, itemsByListId, refresh })` owns the per-mode list scoping, the list/collection query filters, and the collections `useDragOrder` (+ `collectionRepo.reorder` / `ERROR_SCOPE.reorderCollections`).
  - `useListsSelection({ lists, collections, selectedIds, selectedCollectionIds, refresh })` owns the selected-item derivation, the all-pinned check, and `handlePinPress` (the `listRepo`/`collectionRepo.setPinned` loop with the pin/unpin scope).
  - `useListsDrag({ refresh, inCollectionDetail, filteredLists })` pairs `useCollectionDropZones` with the lists `useDragOrder`, returning the drop-zone state/handlers plus the optimistic list order.
- `ListsScreenBase` / `CollectionDetailScreen` / `HomeScreen` / `ListsScreen` / `CollectionsScreen` unchanged; the 19-prop API is kept (the prop-object consolidation stays deferred to a later Tier-2 item). `useCollectionDropZones` itself is unmodified.
- Tests: new `tests/hooks/useListsViewData.test.ts` (6), `useListsSelection.test.ts` (5), `useListsDrag.test.ts` (4); the existing `ListsView`/screen suites pass unchanged as the end-to-end guard. `npm run test:all` green (73 files, 601 tests); typecheck + lint clean.
- Verified on web at 375px (0 console errors): Home (collections + lists sections), search filter, select mode (tiles → checkboxes, Pin/Unpin a mixed list+collection selection), Collections screen, and Collection detail (empty state + remove target). Release APK rebuilt.

[2026-09-30] ~ | ListlyApp/src/utils/vaultCryptoCore.ts, src/context/ToastContext.tsx, src/i18n/{en,es}.ts, + narrowed exports
- Refactor (Tier 2, dead code): removed the unused `hexToBytes` helper (`vaultCryptoCore.ts`) and the unused `useToast` context hook (`ToastContext.tsx` — the toast is driven by `subscribeToErrors`; the context/provider stay).
- Removed 4 unused i18n keys from `en`/`es`: `list_locked_badge`, `list_remove_lock_title`, `list_remove_lock_message`, `list_remove_lock_confirm` (verified unreferenced, incl. dynamic `labels[...]` paths).
- Dropped the `export` keyword on same-file-only symbols (kept as locals): `ItemDraftPayload`, `ItemDisplayFlags`, `ItemSortKey`, `ListNameError`, `CollectionNameError`, `NewCollection`, `nextPositionSql`, `BackupValidationCode`, `SqliteProxyCallback`, `initSqlJsEngine`, `ZERO_SALT_BYTES`, `VaultErrorCode`, `EntityKind`, `EntityLayout`, `SECTION_TITLE_STYLE`, `SECTION_SUBTITLE_STYLE`.
- No behavior change. `npm run test:all` green (73 files, 601 tests); typecheck + lint clean.

[2026-09-30] ~ | ListlyApp/src/constants/types.ts, src/utils/errors.ts, src/screens/settings/DataScreen.tsx, App.tsx, src/components/{LockListModal,EntityForm}.tsx, src/hooks/useItemSort.tsx, src/screens/ListsScreenBase.tsx, src/utils/vaultCryptoCore.ts
- Refactor (Tier 2, consistency): constants and error handling unified. Added `MIN_PASSPHRASE_LENGTH` (6) and `TOAST_DURATION_MS` (3000) to `constants/types.ts`, replacing the inline `6` in `LockListModal` and the local `TOAST_DURATION_MS` in `ToastContext`.
- Error bus: added `ERROR_SCOPE` entries `initDatabase`, `saveEntity`, `exportBackup`, `importBackup`, `deleteAllData`, `factoryReset`. `DataScreen`'s 6 `console.error` calls now route through `logError` (user-facing `Alert`s unchanged); `App.tsx`'s init failure uses `logError(initDatabase)`; `EntityForm.submit` gained a `catch` + `logError(saveEntity)` so a rejecting `onSubmit` (invoked via `void submit()`) is logged instead of becoming an unhandled rejection.
- Cleanups: `useItemSort` self-import (`'../hooks/useLabels'` → `'./useLabels'`), dropped a redundant `ids as number[]` cast in `ListsScreenBase`, reflowed `utf8Decode`'s body off the signature line.
- No user-visible behavior change. `npm run test:all` green (73 files, 601 tests); typecheck + lint clean. Verified on web at 375px (0 console errors): app load, lock modal, Settings > Data export (backup downloads). Release APK rebuilt.






















