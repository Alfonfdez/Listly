import { describe, expect, it } from 'vitest';
import { withAlpha } from '../../src/utils/color';

describe('withAlpha', () => {
  it('appends an 8-digit hex alpha to a 6-digit color', () => {
    expect(withAlpha('#22D3EE', 13)).toBe('#22D3EE21');
    expect(withAlpha('#22D3EE', 50)).toBe('#22D3EE80');
    expect(withAlpha('#FFFFFF', 100)).toBe('#FFFFFFff');
    expect(withAlpha('#000000', 0)).toBe('#00000000');
  });

  it('clamps percent out of range', () => {
    expect(withAlpha('#22D3EE', 130)).toBe('#22D3EEff');
    expect(withAlpha('#22D3EE', -5)).toBe('#22D3EE00');
  });

  it('returns non-hex colors unchanged', () => {
    expect(withAlpha('tomato', 13)).toBe('tomato');
    expect(withAlpha('rgba(0,0,0,0.1)', 13)).toBe('rgba(0,0,0,0.1)');
  });
});