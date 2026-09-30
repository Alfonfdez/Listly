import { sql } from 'drizzle-orm';
import { read, write } from '../access';
import { config } from '../drizzle/schema';
import { DEFAULT_CONFIG, DB_KEY_MAP, decodeConfigValue, sanitizeConfig, toConfigRows } from '../configDefaults';
import type { Config } from '../types';

function parseConfig(rows: { key: string; value: string }[]): Config {
  const map = Object.fromEntries(rows.map(row => [row.key, row.value]));
  const parsed: Record<string, unknown> = {};
  for (const [dbKey, configKey] of Object.entries(DB_KEY_MAP)) {
    const raw = map[dbKey];
    if (raw === undefined) continue;
    parsed[configKey] = decodeConfigValue(configKey, raw);
  }
  return { ...DEFAULT_CONFIG, ...(parsed as Partial<Config>) };
}

export const configRepo = {
  async get(): Promise<Config> {
    const rows = await read(async db => db.select({ key: config.key, value: config.value }).from(config).all());
    return sanitizeConfig(rows.length > 0 ? parseConfig(rows) : DEFAULT_CONFIG);
  },

  async save(partial: Partial<Config>): Promise<void> {
    const rows = toConfigRows(partial);
    if (rows.length === 0) return;
    await write(async db => {
      for (const row of rows) {
        await db
          .insert(config)
          .values(row)
          .onConflictDoUpdate({ target: config.key, set: { value: sql`excluded.value` } })
          .run();
      }
    });
  },
};