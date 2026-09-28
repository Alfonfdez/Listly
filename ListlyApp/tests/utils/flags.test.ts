import { describe, expect, it } from 'vitest';
import { isOn, toFlag } from '../../src/utils/flags';

describe('flags', () => {
  it('isOn is true only for 1', () => {
    expect(isOn(1)).toBe(true);
    expect(isOn(0)).toBe(false);
  });

  it('toFlag maps booleans to 0/1', () => {
    expect(toFlag(true)).toBe(1);
    expect(toFlag(false)).toBe(0);
  });

  it('round-trips through toFlag and isOn', () => {
    expect(isOn(toFlag(true))).toBe(true);
    expect(isOn(toFlag(false))).toBe(false);
  });
});
