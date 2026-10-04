# 030 - Multilingual README — Plan

## Approach

Write the README once in English, then translate it eight times (same structure/anchors, prose + captions translated, technical tokens untranslated). Capture the screenshots first from the web build in dark mode so the gallery reflects the released UI. Add the small drawer-version label needed for parity and the drawer screenshot.

## README matrix

| File | Language |
|------|----------|
| `README.md` | English (reference) |
| `README.es.md` | Spanish |
| `README.ca.md` | Catalan |
| `README.gl.md` | Galician |
| `README.eu.md` | Basque |
| `README.fr.md` | French |
| `README.de.md` | German |
| `README.pt.md` | Portuguese |
| `README.it.md` | Italian |

## Screenshots (375×812, dark mode, `images/screenshots/`)

| File | Scene |
|------|-------|
| `01-home-empty.png` | Home before any collection/list |
| `02-home.png` | Home with a collection + lists (incl. locked) |
| `03-hamburger.png` | Drawer (with `v1.0.0`) |
| `04-create-list.png` | Create list (name/type/icon/color) |
| `05-list-detail.png` | Standard list with checked items + note |
| `06-numeric-list.png` | Numeric list (Total/Done, line totals) |
| `07-add-item-expanded.png` | Add bar expanded (note + photos) |
| `08-item-edit.png` | Edit item modal |
| `09b-collections.png` | Collections screen |
| `09-lists.png` | Lists screen (membership + progress) |
| `10-collection-detail.png` | Collection with member lists |
| `12-lock-list.png` | Lock modal |
| `12b-locked-list.png` | Locked list screen |
| `13-select-mode.png` | Select mode + action bar |
| `14-settings.png` | Settings hub |
| `15-settings-appearance.png` | Appearance |
| `16b-settings-language.png` | Language picker (9 flags) |
| `16-settings-regional.png` | Regional |
| `17-settings-personalization.png` | Personalization |
| `18-settings-data.png` | Data |

## Files

| File | Change |
|------|--------|
| `README.md` + `README.{es,ca,gl,eu,fr,de,pt,it}.md` | **New/expanded** multilingual docs |
| `images/screenshots/*.png` | **New** dark-mode 375×812 captures |
| `ListlyApp/src/navigation/AppNavigator.tsx` | right-aligned `v{Constants.expoConfig?.version}` in the drawer |
| `ListlyApp/package.json` (+ lockfile) | add `expo-constants` |

## Method

- Boot `npx expo start --web` (port 8081), Playwright at **375×812**, switch Theme → Dark, seed demo data, capture each scene, then stop the server (free 8081).
- Write the English README from the feature set (001–029), then produce the eight translations in the Finly order.

## Tests / Verification

- No new unit tests (docs + a presentational label). `npm run test:all` remains the gate (76 files / 652 tests).
- Link check: every `![...](images/...)` and `LICENSE` link resolves in all nine files.
- Web: confirm the drawer shows `v1.0.0`.

## Notes

- Docs-only besides the drawer label; no `src/` behavior change.
