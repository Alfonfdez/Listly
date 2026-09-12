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