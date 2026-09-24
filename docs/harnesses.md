# Listly — Testing & Verification Harnesses

This document describes the harnesses that guarantee the code generated in this project is
correct, tested, and aligned with its specs. It is the single reference for how Listly is
verified, and it is updated as new harnesses land (each phase).

## How to run

All commands run from the `ListlyApp/` directory (created when feature 001 is implemented).

| Harness | Command |
|---------|---------|
| Everything (typecheck + lint + tests) | `npm run test:all` |
| Unit tests (pure-logic + component) | `npm run test` (`npx vitest run`) |
| Component tests | `npx vitest run tests/components/` |
| DB contract suite (Drizzle + Zod over sql.js) | `npx vitest run tests/database/` |
| Typecheck | `npm run typecheck` |
| Lint | `npm run lint` |
| Web E2E (spec criteria) | `npx expo start --web` then run the `verification-loop` skill (Playwright, 375px viewport) |
| Mobile E2E (Maestro flows) | Deferred — added when native-only criteria appear (see below) |

### Windows / PowerShell notes (host is win32, PowerShell 5.1)

- **No ripgrep in the shell** — use the grep/glob/read tools for searching; do not rely on `rg` in a terminal command.
- **Start the web dev server** (background, from `ListlyApp/`):
  ```powershell
  Start-Process cmd.exe -ArgumentList '/c','cd /d C:\path\to\ListlyApp && npx expo start --web --port 8081' -WindowStyle Hidden
  ```
  then poll `http://localhost:8081` with `Invoke-WebRequest` until it returns HTTP 200 (Metro bundling can be slow on first paint). Optionally save the PID to `C:\Users\<user>\AppData\Local\Temp\opencode\listly-expo.pid` for cleanup.
- **Stop the dev server** — always when done:
  ```powershell
  Get-NetTCPConnection -LocalPort 8081 -State Listen | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
  ```
  and remove the PID file if one was written. Confirm the port is free afterwards. Never leave port 8081 occupied between verifications.

### Current suite baseline

44 files, 333 tests:
- `tests/utils/` — `formatters.test.ts` (scaleFontSize small/medium/large, formatDateForDB/dbTimestamp, backupFileName), `search.test.ts` (searchTerms / matchesAllTerms / filterListsByQuery), `color.test.ts` (withAlpha 8-digit hex + clamping/garbage input), `validation.test.ts` (validateName core: required/trim/max/duplicate + uniqueNormalizedNames), `itemPhotos.test.ts` (photo add/remove limits + max-pictures guard), `errors.test.ts` (typed `ERROR_SCOPE` map, `logError` / `runSafely` error handling), `copyList.test.ts` (copy-text building for names and names+notes).
- `tests/components/` — `ListCard.test.tsx` (icon/name/progress render, press, color tint), `ItemRow.test.tsx` (checked/unchecked icon, done style — secondary-color name + faint green wash, no strikethrough — note preview, `showNotes`/`showPhotos` visibility, toggle/circular-edit press), `ListsView.test.tsx` (search filter, no-results, select toggle, action bar, confirm dialog, nav, drag-in/out collection drop zones incl. `removeFromCollection`), `TypeBadge.test.tsx` (collection type badge), `PhotoSection.test.tsx`, `SelectToggleButton.test.tsx`, `SelectionCheck.test.tsx` (unselected/selected colors, custom background), `FullscreenViewer.test.tsx` (children + close control, hidden state), `FormField.test.tsx` (label/children/error), `ColorGrid.test.tsx` (quick-color circles, selected state, custom circle, "+" trigger), `ColorPickerModal.test.tsx` (temp color OK/Cancel, seed-on-open with a `reanimated-color-picker` stub), `ItemFormModal.test.tsx` (edit-item note/photo fields gated by `editShowNotes`/`editShowPhotos`), `CheckboxRow.test.tsx` (checked/unchecked icon + toggle), `ErrorBoundary.test.tsx` (error fallback + reset) via `tests/helpers/configStub.ts` (virtual `/ Listly` palette + `useConfig` mock) + `tests/mocks/expo-vector-icons.tsx` alias.
- `tests/hooks/` — `useDragOrder.test.ts` (initial order, reorder + id report, no-op on unchanged order/ID count), `useLabels.test.tsx` (labels follow the configured language, English default).
- `tests/screens/` — `HomeScreen.test.tsx` (loading, grid render, collections section, empty state, search filter, no-results, FAB/tile navigation, text-size scaling), `ListsScreen.test.tsx` (rows render with progress, search, FAB + row navigation, empty state, text-size scaling, configured layout), `ListDetailScreen.test.tsx` (header/progress render, toggle, add at end with position, duplicate/empty rejection, done-style row, note-area expand/collapse + add-with-note clear/collapse, edit modal, delete-after-confirm, empty state), `CreateListScreen.test.tsx` (form render with default quick color, create disabled until valid, empty/clamped-name, debounced duplicate, quick-color + custom-color-picker create flows, "+" modal open/cancel), `EditListScreen.test.tsx` (prefill, max-length cap, duplicate exclusion, save/not-found), `CollectionsScreen.test.tsx` (collection tiles, empty state, create/edit/delete flows), `CollectionDetailScreen.test.tsx` (members grid/list, `collectionDetailLayout` variant, empty state, add-member navigation), `EditCollectionScreen.test.tsx` (prefill, rename/save, cascade vs keep members on delete), `HomeSelectionFlow.test.tsx` (Home + Lists selection flows), `SettingsScreen.test.tsx` (hub rows + navigation to the four sub-screens, configured-language labels), `settings/AppearanceScreen.test.tsx` (theme icons + Dark/Light/System order, text-size writes), `settings/RegionalScreen.test.tsx` (LANGUAGE header + Language label, temporary selection + Select applies / Cancel discards), `settings/PersonalizationScreen.test.tsx` (separate home/lists/collection-detail layouts + checkbox groups), `settings/DataScreen.test.tsx` (export/import incl. invalid/newer/cancel, delete-all, typed-DELETE factory reset) via `tests/helpers/appStub.ts` (`useApp` mock) + configStub.
- `tests/database/` — `listContract.test.ts` (sql.js contract suite over seeded fixtures: list/item/config repo CRUD), `listRepo.test.ts` (moveToCollection / removeFromCollection scoped positions + transaction-chaining regression), `collectionRepo.test.ts` (collection CRUD + cascade/keep delete modes), `validate.test.ts` (Zod lenient read-path validation), `dbDrift.test.ts` (migration-vs-schema drift + empty-DB initDatabase idempotency), `schemas.test.ts` (Zod row validation + sanitizeConfig + new config keys), `backup.test.ts` (backup format parse/serialize + export/import round-trip, invalid/newer rejection, clearDataKeepSettings/resetDatabase) via `tests/helpers/fixtures.ts`.

Updated here whenever a session adds or removes tests. A drop in the baseline is a regression signal. The RN test harness runs on `vitest-native` (real react-native, `test-renderer`) with `happy-dom`; `setupFiles` pulls in `tests/helpers/configStub.ts`.

## Verification loop (what "done" means)

After every code change, the agent runs:

```bash
cd ListlyApp
npm run test:all
```

`test:all` = `npm run typecheck && npm run lint && npm run test`. A change is only "done"
when all three stages pass. For spec features, the `verification-loop` skill then checks the
acceptance criteria in a real browser.

## Harness stack

| Harness | Tooling | Status | Covers |
|---------|---------|--------|--------|
| Bootstrap + app config | Expo SDK 57 + Metro | In use | `app.json`/`tsconfig`/`metro.config.js` (wasm assetExts for sql.js) |
| Pure-logic unit tests | Vitest + happy-dom | In use | Formatters, search/filter, color utilities |
| DB contract suite | Vitest + sql.js (real SQLite in Node) | In use | One shared engine (native parity via expo-sqlite mock + web via sql.js/IndexedDB), Drizzle repo contract, DB drift vs types |
| Type-checking | `tsc --noEmit` (strict, no `any`) | In use | Whole codebase types |
| Linting | `npx expo lint` (eslint-config-expo) | In use | Code style, unused imports, React hooks rules |
| Schema layer + validation | Zod 4 (`src/database/schemas.ts`) | In use | Row types derived via `z.infer`; read-path validation in native + web backends; schema-vs-migration drift test |
| Component unit tests | Vitest + vitest-native + RNTL | In use | Presentational components + screen suites (ListCard, HomeScreen) with ConfigContext/AppContext stubbed |
| UI / E2E verification | Playwright MCP + `verification-loop` skill | In use | Spec acceptance criteria in a live Expo web app (feature 001 verified) |
| CI pipeline | GitHub Actions (`.github/workflows/ci.yml`) | Scaffolded (guarded) | `npm run test:all` on every PR to `develop`/`main` and push to those branches |
| SDD alignment | `spec/` + changelog + test mapping | In use | Every feature spec maps to tests + changelog entries |
| Mobile E2E | Maestro on Android emulator | Deferred | Needed only when native-only criteria appear |

Components under `tests/components/` / `tests/screens/` stub `ConfigContext`/`AppContext` via the `tests/helpers/configStub.ts` + `tests/helpers/appStub.ts` setup helpers and alias `@expo/vector-icons` to a plain-`Text` mock (`tests/mocks/expo-vector-icons.tsx`).

### CI workflow note

`.github/workflows/ci.yml` is guarded so it no-ops green until `ListlyApp/package-lock.json`
exists (a "Check app exists" step, run from the repo root, gates setup-node + `npm ci` +
`npm run test:all` via its `exists` output). Once the app is scaffolded, CI runs `npm ci` +
`npm run test:all` automatically on every PR/push to `develop`/`main`. Enable the
"require status checks" rule in the GitHub branch ruleset only after the workflow has run at
least once successfully with the real app (first `ListlyApp/` PR).

## Adding a test

1. Create `ListlyApp/tests/<area>/<module>.test.ts` (mirror the module path).
2. Import only pure modules (no `react-native` / `expo-*` runtime imports); if a module
   imports those, mock them or keep it out of Phase A scope.
3. Cover: normal cases, edge cases, and at least one regression seed per previously fixed bug.
4. Run `npm run test` (or `npm run test:watch`) and `npm run test:all` before finishing.

For component tests (`.test.tsx` under `tests/components/`), stub `ConfigContext` via a
`tests/helpers/configStub.ts` setupFiles entry and alias `@expo/vector-icons` to a
plain-`Text` mock — no other component mocks are needed.