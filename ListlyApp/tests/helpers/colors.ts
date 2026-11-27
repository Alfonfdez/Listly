import { QUICK_COLOR_LABELS } from '../../src/constants/listColors';
import { en } from '../../src/i18n/en';

/** The English a11y label a quick colour exposes (the raw hex as fallback). */
export function colorLabel(color: string): string {
  const key = QUICK_COLOR_LABELS[color];
  const value = key ? en[key] : undefined;
  return typeof value === 'string' ? value : color;
}
