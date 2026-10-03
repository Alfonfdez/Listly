import { MAX_AMOUNT_MINOR, MAX_QUANTITY } from '../constants/types';

export function clampQuantity(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const int = Math.trunc(value);
  if (int < 0) return 0;
  if (int > MAX_QUANTITY) return MAX_QUANTITY;
  return int;
}

export function clampAmountMinor(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const int = Math.round(value);
  if (int < 0) return 0;
  if (int > MAX_AMOUNT_MINOR) return MAX_AMOUNT_MINOR;
  return int;
}

export function sanitizeAmountText(raw: string): string {
  const allowed = raw.replace(/[^0-9.]/g, '');
  const firstDot = allowed.indexOf('.');
  const hasDot = firstDot !== -1;
  const intRaw = hasDot ? allowed.slice(0, firstDot) : allowed;
  const decRaw = hasDot ? allowed.slice(firstDot + 1).replace(/\./g, '') : '';
  const maxIntLength = String(Math.floor(MAX_AMOUNT_MINOR / 100)).length;
  const intPart = intRaw.slice(0, maxIntLength);
  const decimals = decRaw.slice(0, 2);
  return hasDot ? `${intPart}.${decimals}` : intPart;
}

export function parseAmountInput(input: string): number {
  const normalized = sanitizeAmountText(input);
  const [intPart = '', decPart] = normalized.split('.');
  const decimals = decPart === undefined ? '' : decPart.slice(0, 2);
  const minor = Number.parseInt(intPart || '0', 10) * 100 + Number.parseInt(decimals.padEnd(2, '0') || '0', 10);
  return clampAmountMinor(Number.isFinite(minor) ? minor : 0);
}

export function formatMinor(minor: number | null): string {
  const value = Math.abs(minor ?? 0);
  const euros = Math.floor(value / 100);
  const cents = value % 100;
  return `${euros}.${String(cents).padStart(2, '0')}`;
}

export function lineTotalMinor(amountMinor: number | null, quantity: number): number {
  return clampAmountMinor((amountMinor ?? 0) * clampQuantity(quantity));
}

export function sumTotals(
  items: { amount_minor: number | null; quantity: number; checked: 0 | 1 }[],
  options: { onlyDone: boolean }
): number {
  let total = 0;
  for (const item of items) {
    if (options.onlyDone && item.checked !== 1) continue;
    total += lineTotalMinor(item.amount_minor, item.quantity);
  }
  return total;
}

// Value-weighted progress (0..100): the share of the total money checked off.
// Guards a non-positive total (returns 0).
export function valueProgressPercent(totalMinor: number, doneMinor: number): number {
  if (totalMinor <= 0) return 0;
  return Math.max(0, Math.min(100, (doneMinor / totalMinor) * 100));
}

// Formats a percentage with two decimals and a dot separator (locale-agnostic,
// matching the numeric UI): 13.958.. -> "13.96".
export function formatPercent2(pct: number): string {
  return (Math.round(pct * 100) / 100).toFixed(2);
}
