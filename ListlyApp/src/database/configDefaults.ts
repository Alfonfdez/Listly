import { LANGUAGES } from '../constants/languages';
import { TEXT_SIZES, THEMES } from '../constants/types';
import { configSchema } from './schemas';
import type { Config } from './types';

export const DEFAULT_CONFIG: Config = {
  theme: THEMES.system,
  language: LANGUAGES.en,
  textSize: TEXT_SIZES.medium,
};

export const DB_KEY_MAP: Record<string, keyof Config> = {
  theme: 'theme',
  language: 'language',
  text_size: 'textSize',
};

const DB_KEY_OF: Record<string, string> = Object.fromEntries(
  Object.entries(DB_KEY_MAP).map(([dbKey, configKey]) => [configKey, dbKey])
);

export function toConfigRows(partial: Partial<Config>): { key: string; value: string }[] {
  const rows: { key: string; value: string }[] = [];
  for (const [key, value] of Object.entries(partial)) {
    if (value === undefined) continue;
    rows.push({ key: DB_KEY_OF[key] ?? key, value: String(value) });
  }
  return rows;
}

export function sanitizeConfig(config: Config): Config {
  const result = configSchema.safeParse(config);
  return result.success ? result.data : DEFAULT_CONFIG;
}