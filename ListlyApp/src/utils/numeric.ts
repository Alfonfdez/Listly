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

export function parseAmountInput(input: string): number {
  const cleaned = input.replace(/[^0-9.]/g, '');
  const firstDot = cleaned.indexOf('.');
  let normalized = firstDot === -1
    ? cleaned
    : cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '');
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
