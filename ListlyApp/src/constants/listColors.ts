import type { Translations } from '../i18n/en';

export const QUICK_COLORS: string[] = [
  '#22D3EE',
  '#F87171',
  '#34D399',
  '#FBBF24',
  '#F472B6',
  '#A3E635',
];

export const QUICK_COLOR_LABELS: Record<string, keyof Translations> = {
  '#22D3EE': 'color_cyan',
  '#F87171': 'color_red',
  '#34D399': 'color_green',
  '#FBBF24': 'color_amber',
  '#F472B6': 'color_pink',
  '#A3E635': 'color_lime',
};
