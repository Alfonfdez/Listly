import type { DatabaseHandle } from '../types';
import { runExclusive } from '../transaction';
import { createSchema } from './001_initial';
import { addListAmountFormat } from './010_list_amount_format';

/**
 * The schema version this build writes to `PRAGMA user_version`.
 *
 * Bump it only together with a new step in `MIGRATIONS`: the guard in
 * `tests/database/migrations.test.ts` fails `test:all` when the chain does not
 * reach `SCHEMA_VERSION`.
 */
export const SCHEMA_VERSION = 10;

/**
 * The first schema version that ever shipped to users (v1.0.0).
 *
 * Databases below it only exist on development machines, so they may be rebuilt.
 * Anything at or above it holds user data and must be migrated, never dropped.
 */
export const RELEASED_BASELINE = 9;

export interface MigrationStep {
  /** Version the database reports once this step has run. */
  version: number;
  run: (db: DatabaseHandle) => Promise<void>;
}

/**
 * Ordered migration chain.
 *
 * `version: 9` collapses everything that happened before v1.0.0 into the
 * canonical schema: no earlier version was ever released, so there is nothing
 * to replay. Every future bump appends one idempotent step here.
 */
export const MIGRATIONS: readonly MigrationStep[] = [
  { version: RELEASED_BASELINE, run: createSchema },
  { version: 10, run: addListAmountFormat },
];

function targetVersion(steps: readonly MigrationStep[]): number {
  return steps.length > 0 ? steps[steps.length - 1]!.version : SCHEMA_VERSION;
}

export async function readSchemaVersion(db: DatabaseHandle): Promise<number> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  return row?.user_version ?? 0;
}

async function writeSchemaVersion(db: DatabaseHandle, version: number): Promise<void> {
  await db.execAsync(`PRAGMA user_version = ${version}`);
}

async function dropAllTables(db: DatabaseHandle): Promise<void> {
  await db.execAsync(`
    DROP TABLE IF EXISTS items;
    DROP TABLE IF EXISTS lists;
    DROP TABLE IF EXISTS collections;
    DROP TABLE IF EXISTS config;
    DROP TABLE IF EXISTS vaults;
  `);
}

export function pendingSteps(
  fromVersion: number,
  steps: readonly MigrationStep[] = MIGRATIONS,
): MigrationStep[] {
  return steps.filter(step => step.version > fromVersion);
}

/**
 * Brings `db` up to the version of `steps` (defaults to `MIGRATIONS`).
 *
 * - `0` (fresh install): runs the whole chain.
 * - `1..RELEASED_BASELINE-1` (pre-release): drops and rebuilds once, because no
 *   step exists for versions that never shipped.
 * - `RELEASED_BASELINE..target-1`: runs only the missing steps, keeping data.
 * - `>= target`: no-op, so an app downgrade never loses data.
 */
export async function migrateDatabase(
  db: DatabaseHandle,
  steps: readonly MigrationStep[] = MIGRATIONS,
): Promise<number> {
  const target = targetVersion(steps);
  const currentVersion = await readSchemaVersion(db);

  if (currentVersion >= target) return currentVersion;

  return runExclusive(db, async () => {
    const isPreRelease = currentVersion > 0 && currentVersion < RELEASED_BASELINE;
    if (isPreRelease) {
      console.warn(`[db] rebuilding pre-release schema v${currentVersion}: data will be discarded`);
      await dropAllTables(db);
    }

    const stepsToRun = isPreRelease || currentVersion === 0
      ? steps
      : pendingSteps(currentVersion, steps);

    let version = currentVersion;
    for (const step of stepsToRun) {
      await step.run(db);
      await writeSchemaVersion(db, step.version);
      version = step.version;
    }
    return version;
  });
}
