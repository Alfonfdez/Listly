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

69 files, 584 tests:
- `tests/utils/` — `formatters.test.ts` (scaleFontSize small/medium/large, formatDateForDB/dbTimestamp, backupFileName), `search.test.ts` (searchTerms / matchesAllTerms / filterListsByQuery), `color.test.ts` (withAlpha 8-digit hex + clamping/garbage input), `validation.test.ts` (validateName core: required/trim/max/duplicate + uniqueNormalizedNames), `itemPhotos.test.ts` (photo add/remove limits + max-pictures guard), `errors.test.ts` (typed `ERROR_SCOPE` map, `logError` / `runSafely` error handling), `copyList.test.ts` (copy-text building for names and names+notes, `makeListCopyName` suffix + long-name clamp), `itemSort.test.ts` (values/parse defaults, stable case-insensitive numeric-aware name sort, lexicographic created sort, non-mutating), `vaultCrypto.test.ts` (encoding round-trips, deterministic 32-byte PBKDF2 key, verifier accept/reject, unicode seal/unseal, wrong-passphrase + GCM tamper rejection, bound API + 600k/sha512 defaults), `vaultCryptoNative.test.ts` (native availability: `isVaultAvailable()` true with the module, false + `unsupported` without), `backupIO.test.ts` (native save returns the share outcome; Downloads is Android-only and delegates to the module), `platform.test.ts` (`isWeb`/`isNative`/`isAndroid`/`isAndroidPlatform` reflect `Platform.OS`).
- `tests/components/` — `EntityTile.test.tsx` (list/collection × card/row render, press, icon color, list collection line shown / hidden in select mode, pin star visible when pinned + in select mode, locked label instead of progress, drop hint, select-mode checkbox role/state), `ItemFields.test.tsx` (name/note counters, amount placeholder, quantity stepper labels, line total), `AddItemBar.test.tsx` (default details, notes/photos toggles honored independently, chevron hidden when both off, numeric list unaffected), `ItemRow.perKind.test.tsx` (numeric vs standard flags independent, numeric photos), `ItemRow.test.tsx` (checked/unchecked icon, done style — secondary-color name + faint green wash, no strikethrough — note preview, `showNotes`/`showPhotos` visibility, toggle/circular-edit press), `ListsView.test.tsx` (search filter, no-results, select toggle, action bar, confirm dialog, nav, drag-in/out collection drop zones incl. `removeFromCollection`, Pin/Unpin select-flow for lists and collections + per-state icon `star`/`star-outline`), `TypeBadge.test.tsx` (collection type badge), `PhotoSection.test.tsx`, `SelectToggleButton.test.tsx`, `SelectionCheck.test.tsx` (unselected/selected colors, custom background), `SelectionActionBar.test.tsx` (pin button rendered only with `onPin`, press fires, icon mirrors Pin action, disabled at 0 selected alongside delete), `FullscreenViewer.test.tsx` (children + close control, hidden state), `FormField.test.tsx` (label/children/error), `ListPickerModal.test.tsx` (other-list rows + source exclusion, select/cancel, empty hint, custom `emptyLabel`), `CollectionPickerModal.test.tsx` (standalone + collections listed, default standalone selected, current collection marked, select collection/null closes, cancel no-op), `ColorGrid.test.tsx` (quick-color circles, selected state, custom circle, "+" trigger), `ColorPickerModal.test.tsx` (temp color OK/Cancel, seed-on-open with a `reanimated-color-picker` stub), `ItemFormModal.test.tsx` (edit-item note/photo fields gated by `editShowNotes`/`editShowPhotos`), `CheckboxRow.test.tsx` (checked/unchecked icon + toggle), `ErrorBoundary.test.tsx` (error fallback + reset), `LockListModal.test.tsx` (photos block, too-short/mismatch/acknowledge validation, confirm with passphrase, change mode current-required + new/current confirm) via `tests/helpers/configStub.ts` (virtual `/ Listly` palette + `useConfig` mock) + `tests/mocks/expo-vector-icons.tsx` alias.
- `tests/hooks/` — `useDragOrder.test.ts` (initial order, reorder + id report, no-op on unchanged order/ID count), `useLabels.test.tsx` (labels follow the configured language, English default), `useSelectMode.test.ts` (select-mode state, confirm-delete + `deleteMany`, failure handling), `useCollectionDropZones.test.ts` (list/collection drag, zone drop + remove-zone, handled-drop skip), `useItemStore.test.ts` (repo vs vault dispatch, `add` position, logging), `useItemDraft.test.ts` (name validation on demand/live, numeric vs standard payload, amount sanitize, seed/reset), `useItemDisplayFlags.test.ts` (standard vs numeric flag selection + defaults), `useVaultSession.test.ts` (new item id below the existing ones; remove-lock wrong/correct passphrase).
- `tests/screens/` — `HomeScreen.test.tsx` (loading, grid render, collections section, empty state, search filter, no-results, FAB/tile navigation, text-size scaling), `ListsScreen.test.tsx` (rows render with progress, search, FAB + row navigation, empty state, text-size scaling, configured layout), `ListDetailScreen.test.tsx` (header/progress render, toggle, add at end with position, duplicate/empty rejection, done-style row, note-area expand/collapse + add-with-note clear/collapse, edit modal, delete-after-confirm, empty state, complete-all / clear-completed batch toolbar incl. confirm flow and inert states, sort pill visibility + sort modes via the sortables `lastGrid()` mock incl. drag disabled in sorted modes and reset to Manual, copy-to-list third action hidden when empty + picker excludes source + `duplicateItems` + "Copied to" feedback, merge-into flow: tile shown only with items/hidden empty/hidden while searching, picker excludes self, destructive confirm with count/target/source, merge calls `mergeInto` + `refresh` + `navigation.replace` with the merge notice, confirm-cancel no-op, transient "Merged into" label on arrival), `CreateListScreen.test.tsx` (form render with default quick color, create disabled until valid, empty/clamped-name, debounced duplicate, quick-color + custom-color-picker create flows, "+" modal open/cancel, duplicate-draft prefill + Save → `duplicate` + replace-nav + collection retention), `EditListScreen.test.tsx` (prefill, max-length cap, duplicate exclusion, save/not-found, duplicate-draft button navigation, collection selector row shows current/standalone, Save into collection calls `moveToCollection`, Save standalone calls `removeFromCollection`, unchanged collection untouched, failed move keeps the screen), `CollectionsScreen.test.tsx` (collection tiles, empty state, create/edit/delete flows), `CollectionDetailScreen.test.tsx` (members grid/list, `collectionDetailLayout` variant, empty state, add-member navigation), `EditCollectionScreen.test.tsx` (prefill, rename/save, cascade vs keep members on delete), `HomeSelectionFlow.test.tsx` (Home + Lists selection flows), `SettingsScreen.test.tsx` (hub rows + navigation to the four sub-screens, configured-language labels), `settings/AppearanceScreen.test.tsx` (theme icons + Dark/Light/System order, text-size writes), `settings/RegionalScreen.test.tsx` (LANGUAGE header + Language label, temporary selection + Select applies / Cancel discards), `settings/PersonalizationScreen.test.tsx` (separate home/lists/collection-detail layouts + checkbox groups), `settings/DataScreen.test.tsx` (export/import incl. invalid/newer/cancel, delete-all, typed-DELETE factory reset) via `tests/helpers/appStub.ts` (`useApp` mock) + configStub.
- `tests/database/` — `listContract.test.ts` (sql.js contract suite over seeded fixtures: list/item/config repo CRUD), `listRepo.test.ts` (moveToCollection / removeFromCollection scoped positions + transaction-chaining regression, `setPinned` + pinned-first ordering incl. move/remove keeping the flag and unpin restoring order, `duplicate` end-of-section + item-copy + collection-member placement), `itemRepo.test.ts` (setAllChecked checks/unchecks only the target list; deleteCompleted removes only its checked items + no-op when nothing is checked; `updated_at` stamped on create/update/toggle/setAllChecked/reorder without touching `created_at`; `duplicateItems` append order/base positions, full fidelity + fresh timestamps, source untouched, name-dedupe case-insensitive skips + batch-repeat + contiguous positions, FK rollback; `mergeInto` append fidelity/order + source deleted, dedupe skip with target untouched, photo cleanup only for dedupe-skipped items (merged copies keep their shared photos), self-merge rejection, missing-target rollback, empty-source no-op), `collectionRepo.test.ts` (collection CRUD + cascade/keep delete modes, `setPinned` + pinned-first ordering), `validate.test.ts` (Zod lenient read-path validation), `dbDrift.test.ts` (migration-vs-schema drift incl. `items.updated_at` + empty-DB initDatabase idempotency), `schemas.test.ts` (Zod row validation incl. pinned 0/1, `updated_at` required + sanitizeConfig + new config keys), `backup.test.ts` (backup format parse/serialize + export/import round-trip incl. pinned flags + `updated_at` round-trip and legacy schema-5/6 defaults, invalid/newer rejection, clearDataKeepSettings/resetDatabase, locked-list encrypted vault export/import + legacy no-vaults), `vaultRepo.test.ts` (lock deletes plaintext rows + stores the vault, unlock fidelity incl. note/checked, wrong passphrase rejected, re-encrypt on `saveUnlocked`, `removeLock` restores plaintext + deletes the vault, `listIds`, cascade delete, `changePassphrase` old-fails/new-works + wrong-current rejection + fresh-salt/preserved-KDF), `transaction.test.ts` (runExclusive serializes concurrent transactions + error propagation), `sqliteWeb.test.ts` (persist failure rejects + notifies the listener; nested transaction rejected) via `tests/helpers/fixtures.ts`.

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
| Component unit tests | Vitest + vitest-native + RNTL | In use | Presentational components + screen suites (EntityTile, HomeScreen) with ConfigContext/AppContext stubbed |
| UI / E2E verification | Playwright MCP + `verification-loop` skill | In use | Spec acceptance criteria in a live Expo web app (feature 001 verified) |
| CI pipeline | GitHub Actions (`.github/workflows/ci.yml`) | Scaffolded (guarded) | `npm run test:all` on every PR to `develop`/`main` and push to those branches |
| SDD alignment | `spec/` + changelog + test mapping | In use | Every feature spec maps to tests + changelog entries |
| Mobile E2E | Maestro on Android emulator | Deferred | Needed only when native-only criteria appear |

Components under `tests/components/` / `tests/screens/` stub `ConfigContext`/`AppContext` via the `tests/helpers/configStub.ts` + `tests/helpers/appStub.ts` setup helpers and alias `@expo/vector-icons` to a plain-`Text` mock (`tests/mocks/expo-vector-icons.tsx`).

`vitest.config.mts` pins `resolve.mainFields` and aliases `test-renderer` to its CJS entry (`node_modules/test-renderer/dist/index.cjs`) so Node's `require` and Vite's import graph load the **same** build. Without this the two resolvers picked `main` vs `module` (two copies), splitting RNTL's module-level cleanup queue; the shared build keeps the `vitest-native` "resolves to two different files" warning away.

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