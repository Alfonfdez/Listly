import { TEXT_SIZES, type TextSize } from '../constants/types';

const FACTORS: Record<TextSize, number> = {
  [TEXT_SIZES.small]: 0.85,
  [TEXT_SIZES.medium]: 1.0,
  [TEXT_SIZES.large]: 1.15,
};

export function scaleFontSize(size: number, textSize: TextSize): number {
  return Math.round(size * FACTORS[textSize]);
}

export function formatDateForDB(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}:${s}`;
}

export function backupFileName(): string {
  return `listly-backup-${new Date().toISOString().slice(0, 10)}.json`;
}

export function dbTimestamp(): string {
  return formatDateForDB(new Date());
}