# Tech Stack

## Languages and tools
- **React Native** (Expo managed workflow, SDK 57) — main framework for iOS and Android.
- **TypeScript** — strict mode, no `any`.
- **React Navigation** (native-stack + drawer) — screen navigation.
- **Drizzle ORM** — typed SQL query builder over a shared `DatabaseHandle` (no `drizzle-kit`, migrations stay on `PRAGMA user_version`).
- **Zod 4** — `src/database/schemas.ts` is the single source of truth for row shapes; types derive via `z.infer`; every stored row is validated at the storage boundary.
- **SQLite** (expo-sqlite) — local persistence on native. **sql.js (WASM) + IndexedDB** — the same SQLite schema and repositories on web.
- **@expo/vector-icons** (Ionicons) — icon library used throughout the app.
- **React Context** — global app state (AppContext + ConfigContext).
- **react-native-reanimated** — animations.
- **react-native-gesture-handler** — gesture support (required by navigation and drawer).
- **react-native-screens** — native screen optimization.
- **react-native-safe-area-context** — safe area management.

## File structure (React Native with Expo project)

Listly code lives in the `ListlyApp/` subfolder. The repo root holds the SDD layer: `AGENTS.md`, `PROMPT.md`, `.agents/skills/`, `docs/`, and `spec/`.

```
ListlyApp/
+-- app.json                          <- Expo config (name, version, package)
+-- App.tsx                           <- main entry: DB init + splash + providers
+-- tsconfig.json
+-- package.json
|
+-- src/
|   +-- navigation/
|   |   +-- AppNavigator.tsx          <- Stack + Drawer navigator
|   |
|   +-- screens/
|   |   +-- HomeScreen.tsx            <- lists overview (001)
|   |   +-- ListScreen.tsx            <- list detail (items, progress)
|   |   +-- CreateListScreen.tsx      <- create list
|   |   +-- ModifyListScreen.tsx      <- edit/delete list
|   |   +-- SettingsScreen.tsx        <- settings root
|   |
|   +-- components/
|   |   +-- ListCard.tsx              <- list tile (name, color, icon, progress)
|   |   +-- ItemRow.tsx               <- item row with checkbox
|   |   +-- SearchBar.tsx             <- reusable search bar
|   |   +-- Fab.tsx                   <- floating action button
|   |   +-- EmptyState.tsx            <- empty state with icon + message
|   |   +-- ColorGrid.tsx             <- color grid for lists
|   |   +-- IconGrid.tsx              <- icon grid for lists
|   |   +-- ConfirmationModal.tsx     <- confirm/delete modal
|   |
|   +-- context/
|   |   +-- AppContext.tsx            <- business state (lists, items)
|   |   +-- ConfigContext.tsx         <- user preferences (theme, language, text size)
|   |
|   +-- database/
|   |   +-- database.ts               <- shared init: applies migrations (PRAGMA user_version)
|   |   +-- engine.ts                 <- native engine: opens the expo-sqlite database
|   |   +-- engine.web.ts             <- web engine: sql.js (WASM) + IndexedDB persistence
|   |   +-- types.ts                  <- TypeScript entity interfaces (z.infer re-exports)
|   |   +-- schemas.ts                <- Zod 4 schemas — single source of truth for row shapes
|   |   +-- seedData.ts               <- seed entities
|   |   +-- configDefaults.ts         <- default config values
|   |   +-- drizzle/
|   |   |   +-- schema.ts             <- Drizzle table definitions
|   |   |   +-- proxy.ts              <- sqlite-proxy adapter over DatabaseHandle
|   |   +-- migrations/
|   |   |   +-- 001_initial.ts        <- CREATE TABLE (lists, items, config) + indexes
|   |   |   +-- 002_seed.ts           <- seed lists and items
|   |   +-- repositories/
|   |       +-- listRepo.ts           <- list CRUD + counts
|   |       +-- itemRepo.ts           <- item CRUD + toggle
|   |       +-- configRepo.ts         <- config persistence
|   |
|   +-- i18n/
|   |   +-- index.ts                 <- language selector + t()
|   |   +-- en.ts                    <- English translations
|   |   +-- es.ts                    <- Spanish translations
|   |
|   +-- hooks/
|   |   +-- useFontSize.ts           <- text scaling hook
|   |
|   +-- constants/
|   |   +-- themes.ts                <- dark + light palettes (ColorPalette)
|   |   +-- types.ts                 <- shared types (RootStackParamList)
|   |   +-- listIcons.ts             <- available list icons list
|   |   +-- languages.ts             <- language map + type (en, es)
|   |
|   +-- utils/
|       +-- formatters.ts            <- format dates, counts, etc.
|       +-- search.ts                <- generic search helpers
|       +-- platform.ts              <- centralized platform checks
|       +-- language.ts              <- language re-exports + isSpanish()/isEnglish()
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