import { describe, expect, it } from 'vitest';
import { MAX_ITEM_NAME_LENGTH, MAX_ITEM_NOTE_LENGTH } from '../../src/constants/types';
import { uniqueNormalizedNames, validateItemName } from '../../src/utils/validation';

describe('validateItemName', () => {
  const existing = new Set(['milk', 'coffee beans']);

  it('accepts a valid unique name', () => {
    expect(validateItemName('  Tea  ', existing)).toBeNull();
  });

  it('trims whitespace before validating', () => {
    expect(validateItemName('   ', existing)).toBe('item_name_required');
    expect(validateItemName('t', existing)).toBeNull();
  });

  it('rejects an empty or whitespace-only name', () => {
    expect(validateItemName('', existing)).toBe('item_name_required');
    expect(validateItemName('  \t  ', existing)).toBe('item_name_required');
  });

  it('rejects a name over the max length', () => {
    const tooLong = 'a'.repeat(MAX_ITEM_NAME_LENGTH + 1);
    expect(validateItemName(tooLong, existing)).toBe('item_name_max');
    expect(validateItemName('a'.repeat(MAX_ITEM_NAME_LENGTH), existing)).toBeNull();
  });

  it('rejects a duplicate name case-insensitively', () => {
    expect(validateItemName('MILK', existing)).toBe('item_name_duplicate');
    expect(validateItemName('Coffee Beans', existing)).toBe('item_name_duplicate');
    expect(validateItemName('Coffee', existing)).toBeNull();
  });

  it('uses a custom max length when provided', () => {
    expect(validateItemName('abcdef', existing, 5)).toBe('item_name_max');
    expect(validateItemName('Milk', existing, 5)).toBe('item_name_duplicate');
  });
});

describe('uniqueNormalizedNames', () => {
  it('normalizes to trimmed lowercase', () => {
    expect(uniqueNormalizedNames(['Milk', '  milk ', 'Tea'])).toEqual(new Set(['milk', 'tea']));
  });

  it('ignores empty entries', () => {
    expect(uniqueNormalizedNames(['', '  ', 'Milk'])).toEqual(new Set(['milk']));
  });
});

describe('max length constants used by the form', () => {
  it('notes have their own max', () => {
    expect(MAX_ITEM_NOTE_LENGTH).toBeGreaterThan(MAX_ITEM_NAME_LENGTH);
  });
});