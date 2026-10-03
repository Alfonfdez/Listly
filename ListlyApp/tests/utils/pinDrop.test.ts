import { describe, expect, it } from 'vitest';
import { resolvePinOnDrop } from '../../src/utils/pinDrop';

interface Row {
  id: number;
  pinned: 0 | 1;
}

function rows(...spec: [number, 0 | 1][]): Row[] {
  return spec.map(([id, pinned]) => ({ id, pinned }));
}

// Display order is pinned-first. e.g. rows([1,1],[2,1],[3,0],[4,0]) means 1 & 2
// are pinned (indices 0,1) and 3 & 4 are unpinned (indices 2,3).
describe('resolvePinOnDrop', () => {
  it('pins an unpinned item dropped above/inside the pinned block', () => {
    const items = rows([1, 1], [2, 1], [3, 0], [4, 0]);
    // drag item 3 (index 2, unpinned) up to index 0 → pins
    expect(resolvePinOnDrop(items, 2, 0)).toBe(true);
    // dropped exactly at the boundary (index 1, inside the block) → pins
    expect(resolvePinOnDrop(items, 2, 1)).toBe(true);
  });

  it('leaves an unpinned item unpinned when dropped below the block', () => {
    const items = rows([1, 1], [2, 1], [3, 0], [4, 0]);
    // drag item 3 (index 2) to index 3 (still below the block) → unchanged
    expect(resolvePinOnDrop(items, 2, 3)).toBeNull();
  });

  it('unpins a pinned item dropped below the pinned block', () => {
    const items = rows([1, 1], [2, 1], [3, 0], [4, 0]);
    // drag item 1 (index 0, pinned) to index 3 (below the block) → unpins
    expect(resolvePinOnDrop(items, 0, 3)).toBe(false);
    // index == pinnedCount - 1 = 1 → below the remaining pinned block → unpins
    expect(resolvePinOnDrop(items, 0, 1)).toBe(false);
  });

  it('leaves a pinned item pinned when kept inside the block', () => {
    const items = rows([1, 1], [2, 1], [3, 0], [4, 0]);
    // swap the two pinned items (0 <-> … stays within the block)
    expect(resolvePinOnDrop(items, 0, 0)).toBeNull();
  });

  it('never pins when nothing is pinned', () => {
    const items = rows([1, 0], [2, 0], [3, 0]);
    expect(resolvePinOnDrop(items, 0, 2)).toBeNull();
    expect(resolvePinOnDrop(items, 2, 0)).toBeNull();
  });

  it('never unpins when everything is pinned', () => {
    const items = rows([1, 1], [2, 1], [3, 1]);
    expect(resolvePinOnDrop(items, 0, 2)).toBeNull();
    expect(resolvePinOnDrop(items, 2, 0)).toBeNull();
  });

  it('ignores out-of-range indices and empty lists', () => {
    const items = rows([1, 1], [2, 0]);
    expect(resolvePinOnDrop(items, -1, 0)).toBeNull();
    expect(resolvePinOnDrop(items, 0, 5)).toBeNull();
    expect(resolvePinOnDrop([], 0, 0)).toBeNull();
  });
});
