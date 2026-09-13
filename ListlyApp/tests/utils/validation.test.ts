import { describe, expect, it } from 'vitest';
import { MAX_ITEM_NAME_LENGTH, MAX_ITEM_NOTE_LENGTH, MAX_LIST_NAME_LENGTH } from '../../src/constants/types';
import { uniqueNormalizedNames, validateItemName, validateListName } from '../../src/utils/validation';

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

describe('validateListName', () => {
  it('accepts a valid unique name', () => {
    expect(validateListName('  Travel Plan  ', false)).toBeNull();
  });

  it('rejects an empty or whitespace-only name', () => {
    expect(validateListName('', false)).toBe('list_name_required');
    expect(validateListName('  \t  ', false)).toBe('list_name_required');
  });

  it('rejects a name over the max length', () => {
    const tooLong = 'a'.repeat(MAX_LIST_NAME_LENGTH + 1);
    expect(validateListName(tooLong, false)).toBe('list_name_max');
    expect(validateListName('a'.repeat(MAX_LIST_NAME_LENGTH), false)).toBeNull();
  });

  it('rejects a duplicate name when exists is true', () => {
    expect(validateListName('Groceries', true)).toBe('list_name_duplicate');
    expect(validateListName('GROCERIES', true)).toBe('list_name_duplicate');
  });

  it('accepts a unique name even when exists is false', () => {
    expect(validateListName('Groceries', false)).toBeNull();
  });

  it('uses a custom max length when provided', () => {
    expect(validateListName('abcdef', false, 5)).toBe('list_name_max');
    expect(validateListName('Milk', true, 5)).toBe('list_name_duplicate');
  });
});

describe('max length constants used by the form', () => {
  it('notes have their own max', () => {
    expect(MAX_ITEM_NOTE_LENGTH).toBeGreaterThan(MAX_ITEM_NAME_LENGTH);
  });
});