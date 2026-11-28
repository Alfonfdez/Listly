import { describe, expect, it } from 'vitest';
import {
  clampAmountMinor,
  clampQuantity,
  formatAmount,
  formatAmountCode,
  formatAmountInput,
  formatMinor,
  formatPercent2,
  lineTotalMinor,
  parseAmountInput,
  resolveListAmountFormat,
  sanitizeAmountText,
  sumTotals,
  toDisplayAmount,
  valueProgressPercent,
} from '../../src/utils/numeric';
import { AMOUNT_FORMATS, MAX_AMOUNT_MINOR, MAX_QUANTITY } from '../../src/constants/types';

describe('numeric utils', () => {
  it('parses amount input into minor units with at most 2 decimals', () => {
    expect(parseAmountInput('12')).toBe(1200);
    expect(parseAmountInput('12.3')).toBe(1230);
    expect(parseAmountInput('12.34')).toBe(1234);
    expect(parseAmountInput('12.345')).toBe(1234);
    expect(parseAmountInput('0.05')).toBe(5);
    expect(parseAmountInput('')).toBe(0);
    expect(parseAmountInput('abc')).toBe(0);
  });

  it('ignores extra dots and non-numeric characters', () => {
    expect(parseAmountInput('1.2.3')).toBe(123);
    expect(parseAmountInput('9.99')).toBe(999);
    expect(parseAmountInput('1 000')).toBe(100000);
  });

  it('clamps the amount to the maximum', () => {
    expect(parseAmountInput('9999999.99')).toBe(MAX_AMOUNT_MINOR);
    expect(clampAmountMinor(-5)).toBe(0);
  });

  it('clamps quantity to integer bounds', () => {
    expect(clampQuantity(3.9)).toBe(3);
    expect(clampQuantity(-1)).toBe(0);
    expect(clampQuantity(MAX_QUANTITY + 1)).toBe(MAX_QUANTITY);
    expect(clampQuantity(Number.NaN)).toBe(0);
  });

  it('formats minor units with two decimals', () => {
    expect(formatMinor(0)).toBe('0.00');
    expect(formatMinor(5)).toBe('0.05');
    expect(formatMinor(1234)).toBe('12.34');
    expect(formatMinor(100000)).toBe('1000.00');
    expect(formatMinor(null)).toBe('0.00');
  });

  it('formats amounts with plain, dot and comma styles', () => {
    expect(formatAmount(123456)).toBe('1234.56');
    expect(formatAmount(123456, { amountFormat: AMOUNT_FORMATS.dot })).toBe('1,234.56');
    expect(formatAmount(123456, { amountFormat: AMOUNT_FORMATS.comma })).toBe('1.234,56');
    expect(formatAmount(5, { amountFormat: AMOUNT_FORMATS.comma })).toBe('0,05');
  });

  it('appends the currency symbol after the amount', () => {
    expect(formatAmount(123456, { currency: 'currency_euro' })).toBe('1234.56 €');
    expect(formatAmount(123456, { currency: 'currency_chf', amountFormat: AMOUNT_FORMATS.comma }))
      .toBe('1.234,56 CHF');
    expect(formatAmount(123456, { currency: 'none', amountFormat: AMOUNT_FORMATS.dot }))
      .toBe('1,234.56');
  });

  it('formats the ISO code for clipboard text', () => {
    expect(formatAmountCode(123456, { currency: 'currency_usd', amountFormat: AMOUNT_FORMATS.comma }))
      .toBe('1.234,56 USD');
    expect(formatAmountCode(123456, { currency: 'currency_euro' })).toBe('1234.56 EUR');
    expect(formatAmountCode(123456, { currency: 'none' })).toBe('1234.56');
  });

  it('formats and swaps the separator for amount inputs', () => {
    expect(formatAmountInput(1234)).toBe('12.34');
    expect(formatAmountInput(1234, AMOUNT_FORMATS.comma)).toBe('12,34');
    expect(toDisplayAmount('12.34', AMOUNT_FORMATS.comma)).toBe('12,34');
    expect(toDisplayAmount('12.', AMOUNT_FORMATS.comma)).toBe('12,');
  });

  it('parses comma decimals and mixed grouping separators', () => {
    expect(parseAmountInput('12,34')).toBe(1234);
    expect(parseAmountInput('1.234,56')).toBe(123456);
    expect(parseAmountInput('1,234.56')).toBe(123456);
    expect(sanitizeAmountText('12,')).toBe('12.');
    expect(sanitizeAmountText('1.234,56')).toBe('1234.56');
  });

  it('resolves per-list overrides with a global fallback', () => {
    const global = { currency: 'currency_euro' as const, amountFormat: AMOUNT_FORMATS.comma };
    expect(resolveListAmountFormat(null, global)).toEqual(global);
    expect(resolveListAmountFormat({ currency: null, amount_format: null }, global)).toEqual(global);
    expect(
      resolveListAmountFormat({ currency: 'currency_chf', amount_format: AMOUNT_FORMATS.dot }, global),
    ).toEqual({ currency: 'currency_chf', amountFormat: AMOUNT_FORMATS.dot });
    expect(resolveListAmountFormat({ currency: 'none', amount_format: 'plain' }, global)).toEqual({
      currency: 'none',
      amountFormat: AMOUNT_FORMATS.plain,
    });
  });

  it('computes a line total in minor units', () => {
    expect(lineTotalMinor(250, 3)).toBe(750);
    expect(lineTotalMinor(null, 5)).toBe(0);
    expect(lineTotalMinor(199, 0)).toBe(0);
  });

  it('sums totals for all items or only done ones', () => {
    const items = [
      { amount_minor: 250, quantity: 2, checked: 1 as const },
      { amount_minor: 1000, quantity: 1, checked: 0 as const },
      { amount_minor: 333, quantity: 3, checked: 1 as const },
    ];
    expect(sumTotals(items, { onlyDone: false })).toBe(500 + 1000 + 999);
    expect(sumTotals(items, { onlyDone: true })).toBe(500 + 999);
  });

  it('sanitizeAmountText strips invalid characters, collapses dots and caps decimals', () => {
    expect(sanitizeAmountText('123bgbv456')).toBe('123456');
    expect(sanitizeAmountText('1.2.3')).toBe('1.23');
    expect(sanitizeAmountText('1.999')).toBe('1.99');
    expect(sanitizeAmountText('abc')).toBe('');
    expect(sanitizeAmountText('')).toBe('');
    expect(sanitizeAmountText('12.')).toBe('12.');
    expect(sanitizeAmountText('0.05')).toBe('0.05');
  });

  it('sanitizeAmountText clamps the integer part to the max', () => {
    expect(sanitizeAmountText('9999999')).toBe('999999');
    expect(sanitizeAmountText('12345678.99')).toBe('123456.99');
    expect(sanitizeAmountText('999999.999')).toBe('999999.99');
  });

  it('computes value progress percent with a positive-total guard', () => {
    expect(valueProgressPercent(2293, 320)).toBeCloseTo(13.956, 3);
    expect(valueProgressPercent(2293, 2293)).toBe(100);
    expect(valueProgressPercent(2293, 0)).toBe(0);
    expect(valueProgressPercent(0, 500)).toBe(0);
    expect(valueProgressPercent(-10, 5)).toBe(0);
  });

  it('formats percent with two decimals and the configured separator', () => {
    expect(formatPercent2(valueProgressPercent(2293, 320))).toBe('13.96');
    expect(formatPercent2(100)).toBe('100.00');
    expect(formatPercent2(0)).toBe('0.00');
    expect(formatPercent2(100 / 3)).toBe('33.33');
    expect(formatPercent2(13.956, AMOUNT_FORMATS.comma)).toBe('13,96');
  });
});
