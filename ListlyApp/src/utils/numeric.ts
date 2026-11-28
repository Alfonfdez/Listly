import { AMOUNT_FORMATS, MAX_AMOUNT_MINOR, MAX_QUANTITY, type AmountFormat } from '../constants/types';
import { CURRENCY_NONE, getCurrencySymbol, type CurrencyId } from '../constants/currencies';

export interface AmountFormatOptions {
  currency?: CurrencyId;
  amountFormat?: AmountFormat;
}

const DEFAULT_AMOUNT_FORMAT = AMOUNT_FORMATS.plain;

function amountSeparators(amountFormat: AmountFormat): { decimal: string; grouping: string | null } {
  switch (amountFormat) {
    case AMOUNT_FORMATS.dot:
      return { decimal: '.', grouping: ',' };
    case AMOUNT_FORMATS.comma:
      return { decimal: ',', grouping: '.' };
    default:
      return { decimal: '.', grouping: null };
  }
}

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
  const cleaned = raw.replace(/[^0-9.,]/g, '');
  const lastDot = cleaned.lastIndexOf('.');
  const lastComma = cleaned.lastIndexOf(',');
  const hasDot = lastDot !== -1;
  const hasComma = lastComma !== -1;
  // With both separators, the last one is the decimal and the other is grouping
  // ("1.234,56" / "1,234.56"). With one, the first occurrence is the decimal
  // (matching the historic "1.2.3" -> "1.23" behaviour).
  const decimal = hasDot && hasComma
    ? (lastDot > lastComma ? '.' : ',')
    : (hasDot ? '.' : (hasComma ? ',' : null));
  const separatorIndex = decimal ? cleaned.indexOf(decimal) : -1;
  const hasSeparator = separatorIndex !== -1;
  const intRaw = (hasSeparator ? cleaned.slice(0, separatorIndex) : cleaned).replace(/[.,]/g, '');
  const decRaw = hasSeparator ? cleaned.slice(separatorIndex + 1).replace(/[.,]/g, '') : '';
  const maxIntLength = String(Math.floor(MAX_AMOUNT_MINOR / 100)).length;
  const intPart = intRaw.slice(0, maxIntLength);
  const decimals = decRaw.slice(0, 2);
  // Canonical storage uses a dot; the UI swaps it for the configured separator.
  return hasSeparator ? `${intPart}.${decimals}` : intPart;
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

/**
 * Formats a minor-unit amount for display: grouping (dot/comma formats), the
 * configured decimal separator and an optional trailing currency symbol.
 * `plain` keeps the historic `1234.56` output (no grouping, dot decimal).
 */
export function formatAmount(minor: number | null, options: AmountFormatOptions = {}): string {
  const currency = options.currency ?? CURRENCY_NONE;
  const amountFormat = options.amountFormat ?? DEFAULT_AMOUNT_FORMAT;
  const { decimal, grouping } = amountSeparators(amountFormat);
  const [integer, cents] = formatMinor(minor).split('.');
  const integerText = grouping ? integer.replace(/\B(?=(\d{3})+(?!\d))/g, grouping) : integer;
  const symbol = getCurrencySymbol(currency);
  return `${integerText}${decimal}${cents}${symbol ? ` ${symbol}` : ''}`;
}

/** Canonical (dot) amount text swapped to the configured separator, for inputs. */
export function toDisplayAmount(raw: string, amountFormat: AmountFormat = DEFAULT_AMOUNT_FORMAT): string {
  return amountFormat === AMOUNT_FORMATS.comma ? raw.replace(/\./g, ',') : raw;
}

/** Input seed text: two decimals with the configured separator, no symbol/grouping. */
export function formatAmountInput(minor: number | null, amountFormat: AmountFormat = DEFAULT_AMOUNT_FORMAT): string {
  return toDisplayAmount(formatMinor(minor), amountFormat);
}

export function lineTotalMinor(amountMinor: number | null, quantity: number): number {
  return clampAmountMinor((amountMinor ?? 0) * clampQuantity(quantity));
}

export function sumTotals(
  items: { amount_minor: number | null; quantity: number; checked: 0 | 1 }[],
  options: { onlyDone: boolean },
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

// Formats a percentage with two decimals, using the configured decimal
// separator (no grouping): 13.958.. -> "13.96" / "13,96".
export function formatPercent2(pct: number, amountFormat: AmountFormat = DEFAULT_AMOUNT_FORMAT): string {
  const text = (Math.round(pct * 100) / 100).toFixed(2);
  return toDisplayAmount(text, amountFormat);
}
