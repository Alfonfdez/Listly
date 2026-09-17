import { LANGUAGES } from '../constants/languages';
import { LIST_LAYOUTS, TEXT_SIZES, THEMES } from '../constants/types';
import { configSchema } from './schemas';
import type { Config } from './types';

export const DEFAULT_CONFIG: Config = {
  theme: THEMES.system,
  language: LANGUAGES.en,
  textSize: TEXT_SIZES.medium,
  listLayout: LIST_LAYOUTS.grid,
  showNotes: true,
  showPhotos: true,
};

export const DB_KEY_MAP: Record<string, keyof Config> = {
  theme: 'theme',
  language: 'language',
  text_size: 'textSize',
  list_layout: 'listLayout',
  show_notes: 'showNotes',
  show_photos: 'showPhotos',
};

type ConfigValueKind = 'string' | 'boolean';

const CONFIG_VALUE_KINDS: Record<keyof Config, ConfigValueKind> = {
  theme: 'string',
  language: 'string',
  textSize: 'string',
  listLayout: 'string',
  showNotes: 'boolean',
  showPhotos: 'boolean',
};

const DB_KEY_OF: Record<string, string> = Object.fromEntries(
  Object.entries(DB_KEY_MAP).map(([dbKey, configKey]) => [configKey, dbKey])
);

export function decodeConfigValue(key: keyof Config, raw: string): unknown {
  if (CONFIG_VALUE_KINDS[key] === 'boolean') return raw === 'true' || raw === '1';
  return raw;
}

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
