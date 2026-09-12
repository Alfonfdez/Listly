# 001 — Home screen: Tasks

## Phase 1 — Scaffold `ListlyApp/`
- [ ] T1. Initialize Expo project `ListlyApp/` (blank-typescript), SDK 57.
- [ ] T2. Install Drizzle ORM (`drizzle-orm`), Zod 4, expo-sqlite, react-native-svg (if needed), React Navigation (drawer + native-stack), react-native-screens, gesture-handler, safe-area-context, reanimated.
- [ ] T3. Set up `src/` folder structure per `spec/constitution/2-tech-stack.md`.
- [ ] T4. Wire `npm run test:all` (typecheck + lint + vitest) and the CI-guard (hashFiles once package-lock exists).

## Phase 2 — Database foundation (002 delivers full schema; minimal here if 002 not yet implemented)
- [ ] T5. Implement `src/database/` with `DatabaseHandle`, `engine.ts`/`engine.web.ts`, Drizzle schema, Zod schemas, migrations, repos (`list`, `item`, `config`).
- [ ] T6. Seed data: 2–3 sample lists with items so Home is not empty on first launch.

## Phase 3 — Context
- [ ] T7. `ConfigContext` (theme, language, text size) + `useFontSize`.
- [ ] T8. `AppContext`: loads lists + item counts, `loading` flag, `refresh()`; t().

## Phase 4 — Home UI
- [ ] T9. `SearchBar`, `EmptyState`, `Fab` components.
- [ ] T10. `ListCard` with icon/name/color/progress.
- [ ] T11. `HomeScreen` layout: header, search toggle, grid, FAB, empty state, loading.
- [ ] T12. `utils/search.ts` `filterListsByQuery` + unit tests.
- [ ] T13. `AppNavigator`: Drawer + HomeStack, register Home.
- [ ] T14. i18n keys (en/es) and icons.

## Phase 5 — Verification
- [ ] T15. `npm run test:all` green.
- [ ] T16. `verification-loop`: boot web, check acceptance criteria at 375px, flip `[ ]` → `[x]`.