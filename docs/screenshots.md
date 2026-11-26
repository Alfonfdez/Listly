# Release screenshots

The `v1.1.0` set (21 screens) in `images/screenshots/` is generated from a committed mock backup, so every release can be re-shot with the same data and layout.

## Run it

From `ListlyApp/`:

```bash
npm run screenshots
```

The script:

1. starts the Expo web dev server on port 8081 **with `--clear`** if nothing is listening there (and always stops the server it started);
2. launches the installed Chrome through `playwright-core`;
3. opens a fresh browser context (new IndexedDB) at `375x812`, DPR 1, English, dark theme, `Europe/Madrid`;
4. loads the app twice (warm-up) so Metro has finished rebuilding after any code/config change;
5. captures the empty-state screen first, imports `scripts/screenshots/fixture.json` through Settings -> Data -> Import, then captures the populated screens in manifest order; the locked-list screens lock a list through the UI with the passphrase `listly`;
6. writes `images/screenshots/v1.1.0-*.png` and fails on unexpected console errors.

Options:

```bash
npm run screenshots -- --only 03-create-list   # one screen (fixture imported when needed)
npm run screenshots -- --set v1.2.0            # future release set
npm run screenshots -- --no-server             # use an already running dev server
npm run screenshots -- --url http://localhost:8081 --out ../images/screenshots
```

## Version bump

The drawer footer renders the app version, so bump it **before** capturing:

- `ListlyApp/app.json`: `version`, `ios.buildNumber`, `android.versionCode`
- `ListlyApp/package.json`: `version`
- the 9 `README*.md` version rows
- `SET` in `ListlyApp/scripts/screenshots/manifest.mjs`

## Fixture

`ListlyApp/scripts/screenshots/fixture.json` is a real Listly backup (`app: "Listly"`, `kind: "backup"`, `formatVersion: 1`, `schema: 9`):

- two collections (Home, Work), one of them pinned in the UI by the lists it holds;
- five lists: a pinned standard list with checked items and notes, a numeric list with amounts and quantities, one per collection, and two standalone lists;
- 19 items, including a long two-line name, a long note, and one **data-URI photo** (a `file://` URI would render broken on web);
- the dark / English / medium configuration used by the captures.

Rules:

- Keep the dates fixed (`2026-11-*`) and inside the same month.
- Keep ids and foreign keys internally consistent (`collection_id`, `list_id`, `vaults.list_id`).
- The fixture must remain importable: `tests/tooling/screenshots.test.ts` runs it through `parseBackup` and checks every reference and config key.
- The fixture has **no vault**: the two lock screens create one through the UI, which is the real code path.
- If the backup schema or the seed data changes, update the fixture and re-run the capture.

## Naming and versioning

- Every file is `<set>-<key>.png`, e.g. `v1.1.0-01-b-home.png`; sub-screens use `<index><letter>` (`04-a`, `04-b`, ...).
- A set is tied to a release (`v1.1.0`); bump `SET` in `manifest.mjs` for the next release so every image gets a new name.
- The README screenshot order must match `SCREENS` exactly; the tooling test enforces it in all 9 languages.
- Old sets stay in the repo for history; the READMEs point at the current one.

## Adding or changing a screen

1. Add an entry to `ListlyApp/scripts/screenshots/manifest.mjs` with a stable `key`, a `phase` (`empty` or `fixture`) and a `run` function using the helpers (`reload`, `drawer`, `settings`, `openList`, `openLockModal`, ...).
2. Add the image block (alt text + caption) to all 9 `README*.md` files, in the same order.
3. Run `npm run screenshots -- --only <key>`, inspect the PNG, then run the full set.
4. Run `npm run test:all` (the tooling test checks the fixture and the 9 READMEs).

## Checklist

- 375x812, DPR 1.
- English, dark theme, medium text.
- No focus caret, no clipped content, no browser scrollbars.
- No console errors during the run.
- All 9 READMEs reference the same 21 files in manifest order and every path exists.
