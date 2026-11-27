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
- **Android bottom-pinned inputs / keyboard:** the Android activity uses `windowSoftInputMode="adjustResize"` (the window shrinks to the keyboard). Screens whose input/action bar is pinned to the bottom (e.g. the List detail add-item bar) wrap the scroll area in a `flex: 1` body and add `paddingBottom` equal to the keyboard height via `useKeyboardHeight()` (Android-only; `0` on iOS/web so those platforms are unaffected), so the bar stays visible while typing and the gap closes when the keyboard hides. Form screens keep the scroll area `flex: 1` so the submit button stays reachable.
- **Exactly one `ScreenShell` per screen.** It is the only component that applies the bottom safe-area inset; screens own it (shared list content such as `ListsView` must not wrap itself). Nested shells applied the inset twice on devices with a home indicator / gesture bar, which pushed the FAB and the list's bottom padding up (Collection detail vs Home). The FAB itself is shared (`Fab`, `FAB_BOTTOM_OFFSET = 56`, Finly parity) and the scroll padding is `LIST_BOTTOM_FAB_PADDING`.
- Never rely on `Platform.OS === 'web'` inline: use `src/utils/platform.ts` constants (`isWeb`, `isNative`, `isIOS`, `isAndroid`).

## Native-only features
- **Item photos (camera):** the "Take photo" source is native-only and gated with `isNative`; web stores base64 data URLs inline while native copies files into the document directory. Camera capture is reported "not checkable on web".
- **Backup export/share/pick:** native writes the file then shares via the local `listly-share` module (iOS reports the true share outcome; Android can also save to the public Downloads folder); imports via `expo-document-picker`. Web downloads a Blob and imports via a hidden file input (same `backupIO` API, per-platform implementation). `listly-share` requires a development/release build (not Expo Go).
- **Locked lists (encryption):** key derivation/encryption use `react-native-quick-crypto` (native) and `crypto.subtle` (web). This is a **native development build only** — Expo Go lacks the native modules, so vault actions are disabled there with an explanatory message (the app still runs). See `docs/locked-lists.md`.
- Anything else native-only must be gated with `isNative`, hidden on web, and its criteria reported "not checkable on web".

## App data and OS-level backup

| Platform | Behaviour |
|----------|-----------|
| Android | **OS auto-backup is disabled** (`expo.android.allowBackup: false` in `app.json`; prebuild emits `android:allowBackup="false"` in the packaged manifest). The database lives in the app's private storage (`files/SQLite/Listly.db`), so with Android's default `allowBackup="true"` the OS cloud backup copied it and **restored it when the app was installed again** — a fresh install could come up with a previous install's data (even from a differently signed build of the same package). `false` disables cloud backup and restore (and `adb backup`); device-to-device transfer on API 31+ is out of scope. |
| iOS | No equivalent flag: reinstalling an app never restores its data (only a full device restore does). |
| Web | The data lives in the browser origin's IndexedDB; the app has no control over it. |

Data is moved between installs or devices **only** through the in-app JSON export/import.

## Verification
- Web acceptance criteria are checked in a real browser at 375px (mobile criteria) via the `verification-loop` skill.
- A change is only "done" when `npm run test:all` passes AND the feature criteria are verified (loop).