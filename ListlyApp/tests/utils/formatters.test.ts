import { describe, it, expect } from 'vitest';
import { scaleFontSize } from '../../src/utils/formatters';
import { TEXT_SIZES } from '../../src/constants/types';

describe('scaleFontSize', () => {
  it('keeps medium as an identity scale', () => {
    expect(scaleFontSize(16, TEXT_SIZES.medium)).toBe(16);
    expect(scaleFontSize(17, TEXT_SIZES.medium)).toBe(17);
  });

  it('scales small sizes by 0.85 and rounds to the nearest integer', () => {
    expect(scaleFontSize(16, TEXT_SIZES.small)).toBe(14);
    expect(scaleFontSize(17, TEXT_SIZES.small)).toBe(14);
    expect(scaleFontSize(20, TEXT_SIZES.small)).toBe(17);
  });

  it('scales large sizes by 1.15 and rounds to the nearest integer', () => {
    expect(scaleFontSize(16, TEXT_SIZES.large)).toBe(18);
    expect(scaleFontSize(17, TEXT_SIZES.large)).toBe(20);
    expect(scaleFontSize(14, TEXT_SIZES.large)).toBe(16);
  });
});