# Platform differences

Listly targets **iOS, Android, and web** with one codebase. This file collects how the platforms differ and the rules that keep behavior consistent.

## Data layer
- **Native (iOS/Android):** real SQLite via `expo-sqlite` (`openDatabaseSync`). File on device; migrations via `PRAGMA user_version`.
- **Web:** the same SQLite schema runs through **sql.js (WASM)**; the database bytes persist to **IndexedDB** (one write per committed transaction, reload restores the committed state).
- Both platforms share one `DatabaseHandle` interface, one set of Drizzle queries, one Zod schema set, and one migration runner selected per platform by `engine.ts` / `engine.web.ts`. Behavior is enforced by the DB contract suite run on a real sql.js engine in Node.

## Persistence storage key
- The IndexedDB store name matches the database name (e.g. `Listly.db`), so a database rename requires updating both native `openDatabaseSync(name)` and the web storage key.

## UI / layout
- Components use flexbox + `Dimensions`/`onLayout` sizing; grids must react to resize on web and work at 375px on mobile.
- Web shows scrollbars; style them consistently with the theme (thumb + track via injected CSS).
- Modals: on web prefer centered max-width popups; on mobile full-screen/slide. Keep the same component API.
- `keyboardShouldPersistTaps="handled"` where a modal/screen has a ScrollView and inputs, so the first tap isn't swallowed (Android behavior found in Finly).
- Never rely on `Platform.OS === 'web'` inline: use `src/utils/platform.ts` constants (`isWeb`, `isNative`, `isIOS`, `isAndroid`).

## Native-only features
- **Item photos (camera):** the "Take photo" source is native-only and gated with `isNative`; web stores base64 data URLs inline while native copies files into the document directory. Camera capture is reported "not checkable on web".
- **Backup share/pick:** native uses `expo-sharing` + `expo-document-picker`; web downloads a Blob and imports via a hidden file input (same `backupIO` API, per-platform implementation).
- Anything else native-only must be gated with `isNative`, hidden on web, and its criteria reported "not checkable on web".

## Verification
- Web acceptance criteria are checked in a real browser at 375px (mobile criteria) via the `verification-loop` skill.
- A change is only "done" when `npm run test:all` passes AND the feature criteria are verified (loop).