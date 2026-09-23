import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import { parseRows, parseRowOrNull } from '../../src/database/validate';

const schema = z.object({ id: z.number().int() });
const table = 'things';

describe('parseRows (lenient)', () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
  });

  it('returns valid rows and skips invalid ones', () => {
    const result = parseRows(schema, table, [{ id: 1 }, { id: 'nope' }, { id: 2 }, {}]);
    expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it('returns an empty array when every row is invalid', () => {
    expect(parseRows(schema, table, [{ id: 'x' }])).toEqual([]);
  });
});

describe('parseRowOrNull (lenient)', () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
  });

  it('returns the parsed row when valid', () => {
    expect(parseRowOrNull(schema, table, { id: 3 })).toEqual({ id: 3 });
    expect(warn).not.toHaveBeenCalled();
  });

  it('returns null for a null/undefined row without warning', () => {
    expect(parseRowOrNull(schema, table, null)).toBeNull();
    expect(parseRowOrNull(schema, table, undefined)).toBeNull();
    expect(warn).not.toHaveBeenCalled();
  });

  it('returns null and warns for an invalid row', () => {
    expect(parseRowOrNull(schema, table, { id: 'x' })).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
  });
});
