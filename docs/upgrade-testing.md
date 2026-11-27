# Database upgrade testing

Listly keeps user data across releases. The migration chain in
`ListlyApp/src/database/migrations/index.ts` guarantees that a database at or
above `RELEASED_BASELINE` (9, the schema v1.0.0 shipped) is only ever migrated,
never dropped.

## What runs in CI

```bash
cd ListlyApp
npx vitest run tests/database/migrations.test.ts tests/database/upgrade.test.ts
```

`tests/database/migrations.test.ts` covers the chain itself:

- it ends at `SCHEMA_VERSION` and starts at `RELEASED_BASELINE`
- it has exactly one step per version (so bumping `SCHEMA_VERSION` without a
  step fails `test:all`)
- a fresh database (`user_version = 0`) gets the canonical schema at 9
- a released database (`9`) is a no-op and keeps its rows
- a pre-release database (`1..8`) is rebuilt once and logs a warning
- a future bump (`9 -> 10`) runs only the missing step and keeps the rows
- a database newer than the build is never touched

`tests/database/upgrade.test.ts` replays `tests/fixtures/upgrade/v1.0.0.sql` -
a frozen snapshot of a real 1.0.0 install with collections, pinned and numeric
lists, items with notes/photos/amounts, config rows and a vault - then runs the
migration and asserts the rows and the version are unchanged.

## Fixture rules

- The fixture is **frozen**. Do not regenerate or edit `v1.0.0.sql`; it
  represents what 1.0.0 users actually have.
- When a release changes the schema, add a new fixture (for example
  `v1.1.0.sql`) and a new case in `upgrade.test.ts` instead of changing the old
  one.
- The fixture is plain SQL so it can be reviewed in the PR diff and replayed on
  both engines (sql.js in tests, SQLite on device).

## Manual device check for a release

The automated test proves the SQL logic; the device check proves the packaging:

1. Install the published previous version (for 1.1.0: the EAS `versionCode 1`
   APK) and create real data: a few lists, a pinned list, a numeric list, notes,
   a photo, and change theme/language/text size.
2. Export a backup from Settings -> Data and keep it.
3. Install the new EAS build **over** it, without uninstalling (same EAS signing
   key; `versionCode` must be higher).
4. Verify the lists, items, notes, photos, vault and settings are all there, and
   that new settings keep their defaults.
5. Open a list and edit an item, then restart the app to confirm writes persist.

Anything that cannot be checked this way is reported as not verified, never as
done.

## Adding the next migration

1. Append one step to `MIGRATIONS` in
   `ListlyApp/src/database/migrations/index.ts`:

   ```ts
   {
     version: 10,
     run: async db => {
       await db.execAsync('ALTER TABLE lists ADD COLUMN archived INTEGER NOT NULL DEFAULT 0;');
     },
   }
   ```

2. Bump `SCHEMA_VERSION` to the same number.
3. Make the step idempotent (check `PRAGMA table_info(...)` or use
   `IF NOT EXISTS`), because a fresh install also runs it.
4. Run `npm run test:all`; the chain guard fails until step and version match.
5. Update the Zod schema, the Drizzle schema and the drift expectations in
   `tests/database/dbDrift.test.ts`.
