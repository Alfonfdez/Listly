import { describe, expect, it } from 'vitest';
import { readDragMeta } from '../../src/utils/dragParams';

describe('readDragMeta', () => {
  it('reads the dragged id and indices from valid metadata', () => {
    expect(readDragMeta({ key: '7', fromIndex: 2, toIndex: 0 })).toEqual({
      draggedId: 7,
      fromIndex: 2,
      toIndex: 0,
    });
  });

  it('returns null when params are missing or the key is absent', () => {
    expect(readDragMeta(undefined)).toBeNull();
    expect(readDragMeta({})).toBeNull();
    expect(readDragMeta({ fromIndex: 0, toIndex: 1 })).toBeNull();
  });

  it('returns null when the indices are not integers', () => {
    expect(readDragMeta({ key: '1', fromIndex: 0.5, toIndex: 1 })).toBeNull();
    expect(readDragMeta({ key: '1', fromIndex: 0, toIndex: undefined })).toBeNull();
    expect(readDragMeta({ key: '1', fromIndex: NaN, toIndex: 1 })).toBeNull();
  });
});
