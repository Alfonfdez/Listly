# 001 — Home screen: Tasks

## Phase 1 — Scaffold `ListlyApp/`
- [x] T1. Initialize Expo project `ListlyApp/` (blank-typescript), SDK 57.
- [x] T2. Install Drizzle ORM (`drizzle-orm`), Zod 4, expo-sqlite, react-native-svg (if needed), React Navigation (drawer + native-stack), react-native-screens, gesture-handler, safe-area-context, reanimated.
- [x] T3. Set up `src/` folder structure per `spec/constitution/2-tech-stack.md`.
- [x] T4. Wire `npm run test:all` (typecheck + lint + vitest) and the CI-guard (hashFiles once package-lock exists).

## Phase 2 — Database foundation (002 delivers full schema; minimal here if 002 not yet implemented)
- [x] T5. Implement `src/database/` with `DatabaseHandle`, `engine.ts`/`engine.web.ts`, Drizzle schema, Zod schemas, migrations, repos (`list`, `item`, `config`).
- [x] T6. Seed data: 2–3 sample lists with items so Home is not empty on first launch.

## Phase 3 — Context
- [x] T7. `ConfigContext` (theme, language, text size) + `useFontSize`.
- [x] T8. `AppContext`: loads lists + item counts, `loading` flag, `refresh()`; t().

## Phase 4 — Home UI
- [x] T9. `SearchBar`, `EmptyState`, `Fab` components.
- [x] T10. `ListCard` with icon/name/color/progress.
- [x] T11. `HomeScreen` layout: header, search toggle, grid, FAB, empty state, loading.
- [x] T12. `utils/search.ts` `filterListsByQuery` + unit tests.
- [x] T13. `AppNavigator`: Drawer + HomeStack, register Home.
- [x] T14. i18n keys (en/es) and icons.

## Phase 5 — Verification
- [x] T15. `npm run test:all` green.
- [x] T16. `verification-loop`: boot web, check acceptance criteria at 375px, flip `[ ]` → `[x]`.