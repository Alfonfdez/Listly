# Listly

[Español](README.es.md) · [Català](README.ca.md) · [Galego](README.gl.md) · [Euskara](README.eu.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português](README.pt.md) · [Italiano](README.it.md)

**Listly** is a local-first list manager for everyday things. Create as many lists as you need — shopping, tasks, packing, pantry stock — organize them into collections, and check items off as you go. Lists can be plain checklists or numeric lists that track an amount and quantity per item with a running total.

Everything runs **on-device**: your data lives in a local SQLite database (sql.js + IndexedDB on the web), nothing leaves your phone, and there is no account or subscription required.

| | |
|---|---|
| **Platforms** | iOS, Android, and Web |
| **Version** | 1.0.0 |
| **Languages** | English, Spanish, Catalan, Galician, Basque, French, German, Portuguese, Italian |
| **Data** | 100 % local (SQLite on native, sql.js + IndexedDB on web) |
| **Themes** | Dark, Light, and Automatic (follows the system) |

## Features

- **Lists** — create as many lists as you like, each with its own icon and color, and pick between two kinds of list: **Standard** checklists or **Numeric** lists with an amount and quantity per item.
- **Items** — add items quickly from the bottom bar, check them off, and open an item to add a **note** or a **photo** (gallery on every platform, camera on iOS and Android).
- **Numeric lists** — give each item an amount and a quantity; the list header shows the **Total** and the **Done** subtotal, and each item shows its line total (amount × quantity).
- **Collections** — group lists into collections (folders) such as *Home* or *Work*, and drag a list onto a collection to move it in.
- **Drag & drop** — reorder lists and items by long-press and drag; persisted through a `position` column.
- **Locked lists** — protect a list with a passphrase; its items are encrypted **on-device** with AES-256-GCM. If you forget the passphrase there is no recovery.
- **Duplicate, copy & merge** — duplicate a whole list, copy a list with or without its notes, copy selected items into another list, or merge items into another list.
- **Sorting** — sort a list manually, by name, or by the time each item was added, ascending or descending.
- **Select mode** — enter select mode from the header to multi-select items and delete them (or select many lists at once) in one go.
- **Search** — filter lists and items from the header search on Home, Lists, and inside a list.
- **Settings** — theme, text size, language, per-screen layouts (grid or rows), and per-list-kind optional fields (notes and photos on the item display and the edit screen).
- **Data backup** — export your whole database as a JSON snapshot and import it back at any time, with guarded delete-all and factory-reset actions.

## Screenshots

![Home screen](images/screenshots/01-home-empty.png)<br>*Home screen before any collection or list exists.*<br><br>
![Home with data](images/screenshots/02-home.png)<br>*Home with a collection and standalone lists, including a locked list.*<br><br>
![Hamburger menu](images/screenshots/03-hamburger.png)<br>*Drawer with Home, Collections, Lists, and Settings — and the app version at the bottom.*<br><br>
![Create list](images/screenshots/04-create-list.png)<br>*Create a list: name, kind (Standard or Numeric), icon, and color.*<br><br>
![List detail](images/screenshots/05-list-detail.png)<br>*A standard list with checked items, a note, sort control, and batch actions.*<br><br>
![Numeric list](images/screenshots/06-numeric-list.png)<br>*A numeric list with Total and Done, line totals, and the amount/quantity row.*<br><br>
![Add item expanded](images/screenshots/07-add-item-expanded.png)<br>*The add bar expanded to attach a note and photos to the new item.*<br><br>
![Edit item](images/screenshots/08-item-edit.png)<br>*Editing an item: name, note, and photos.*<br><br>
![Collections](images/screenshots/09b-collections.png)<br>*The Collections screen.*<br><br>
![Lists](images/screenshots/09-lists.png)<br>*The Lists screen, showing collection membership and per-list progress.*<br><br>
![Collection detail](images/screenshots/10-collection-detail.png)<br>*A collection with its member lists.*<br><br>
![Lock list](images/screenshots/12-lock-list.png)<br>*Locking a list with a passphrase.*<br><br>
![Locked list](images/screenshots/12b-locked-list.png)<br>*A locked list, waiting for the passphrase.*<br><br>
![Select mode](images/screenshots/13-select-mode.png)<br>*Select mode with the bottom action bar.*<br><br>
![Settings](images/screenshots/14-settings.png)<br>*Settings: Appearance, Regional, Personalization, and Data.*<br><br>
![Appearance settings](images/screenshots/15-settings-appearance.png)<br>*Appearance: theme and text size.*<br><br>
![Language picker](images/screenshots/16b-settings-language.png)<br>*The language picker with all nine languages and their flags.*<br><br>
![Regional settings](images/screenshots/16-settings-regional.png)<br>*Regional settings: language.*<br><br>
![Personalization settings](images/screenshots/17-settings-personalization.png)<br>*Personalization: layouts per screen and optional fields per list kind.*<br><br>
![Data settings](images/screenshots/18-settings-data.png)<br>*Data: export/import and the guarded delete and reset actions.*<br><br>

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native with Expo (SDK 57) |
| Language | TypeScript |
| Navigation | React Navigation (Stack + Drawer) |
| Icons | @expo/vector-icons (Ionicons) |
| Drag & drop | react-native-sortables |
| Color picker | reanimated-color-picker |
| Encryption | quick-crypto (AES-256-GCM for locked lists) |
| Persistence | SQLite (expo-sqlite) on native, sql.js (WASM) + IndexedDB on web |
| ORM | Drizzle ORM (query builder over a shared `DatabaseHandle`) |
| Validation | Zod schemas as single source of truth for stored rows |
| Web | react-native-web |
| State | Context API (AppContext + ConfigContext) |
| i18n | Custom system (en, es, ca, gl, eu, fr, de, pt, it) |

## Development

This section is for contributors and for anyone who wants to run, fork, or extend the app.

### Requirements

- Node.js 20+ (Node 24 recommended)
- npm
- An optional Android emulator (the `android/` folder is generated by CNG — see below)

### First time after cloning

```bash
cd ListlyApp
npm install
npx expo start
```

This starts Metro Bundler. Then:

| To view on… | Do this |
|---|---|
| **Browser** | Open http://localhost:8081 or run `npx expo start --web` |
| **Android (emulator)** | Run `npx expo run:android` |
| **iOS (simulator)** | Run `npx expo run:ios` (macOS only) |

> Note: locked lists and the share sheet rely on native modules, so use a development or release build rather than Expo Go.

### Commands

| Command | Description |
|---|---|
| `npm start` | Start Expo in dev mode |
| `npm run web` | Start and open in browser |
| `npm run android` | Start on Android emulator |
| `npm run ios` | Start on iOS simulator (macOS only) |
| `npm run typecheck` | TypeScript check (`tsc --noEmit`) |
| `npm run lint` | ESLint through `expo lint` |
| `npm test` | Run the Vitest suite |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run test:all` | typecheck + lint + tests (the full local gate) |

### Testing

- **Unit / integration** — Vitest. The suite covers the database repositories on both SQLite backends (native + sql.js), backup round-trips, encryption, and components rendered with `@testing-library/react-native`.
- **Web verification** — the acceptance criteria of each feature are verified in a real browser at 375px with Playwright.
- The CI pipeline runs the full `npm run test:all` gate on every push and pull request to `develop` and `main`.

> **Local gate:** a change is only done when `npm run test:all` passes.

### Project layout

```
ListlyApp/
  src/
    components/    — reusable UI components
    constants/     — themes, types, colors, icons
    context/       — AppContext, ConfigContext (global state)
    database/      — SQLite/sql.js engines, repositories, migrations, Drizzle schema
    hooks/         — custom hooks
    i18n/          — translations (en, es, ca, gl, eu, fr, de, pt, it)
    navigation/    — AppNavigator (Drawer + Stack)
    screens/       — screen components (PascalCase)
    utils/         — formatters, platform, language
```

### Database

- One engine interface (`DatabaseHandle`) on all platforms: expo-sqlite on native, sql.js (WASM) with IndexedDB persistence on web.
- The schema is created from a canonical `createSchema` and versioned with `PRAGMA user_version`; migrations run once, inside a transaction.
- Repositories are written with the Drizzle query builder over the shared handle; stored rows are validated with Zod schemas.
- On web the exported SQLite bytes are persisted to IndexedDB, so the same data outlives reloads.

### Building an Android APK

The native `android/` folder is generated by Expo CNG (`expo prebuild`) and is not committed:

```bash
cd ListlyApp
npx expo prebuild --platform android
cd android
./gradlew assembleRelease   # APK → app/build/outputs/apk/release/app-release.apk
```

Run `npx expo prebuild --platform android` again whenever `assets/` or the icon/splash config in `app.json` changes, otherwise the APK keeps the stale icons.

### Methodology

This project uses **Specification-Driven Development (SDD).** Specs live in `spec/` and are the single source of truth — what to build is defined first in `1-spec.md` docs, then implemented, then verified against the acceptance criteria. The roadmap is tracked in `spec/constitution/3-roadmap.md`.

## License

Listly is licensed under the MIT License — see the [LICENSE](LICENSE) file.
