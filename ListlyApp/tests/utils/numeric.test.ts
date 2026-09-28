import { describe, expect, it } from 'vitest';
import {
  clampAmountMinor,
  clampQuantity,
  formatMinor,
  lineTotalMinor,
  parseAmountInput,
  sanitizeAmountText,
  sumTotals,
} from '../../src/utils/numeric';
import { MAX_AMOUNT_MINOR, MAX_QUANTITY } from '../../src/constants/types';

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
});
