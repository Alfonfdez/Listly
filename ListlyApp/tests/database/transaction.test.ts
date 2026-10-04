import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DatabaseHandle } from '../../src/database/types';

interface FakeHandle extends DatabaseHandle {
  active: boolean;
}

function makeHandle(): FakeHandle {
  const handle = {
    active: false,
    async withTransactionAsync(task: () => Promise<void>): Promise<void> {
      if (handle.active) throw new Error('nested transaction');
      handle.active = true;
      try {
        await task();
      } finally {
        handle.active = false;
      }
    },
  };
  return handle as unknown as FakeHandle;
}

describe('runExclusive', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('serializes concurrent transactions', async () => {
    const { runExclusive } = await import('../../src/database/transaction');
    const handle = makeHandle();
    const events: string[] = [];

    const first = runExclusive(handle, async () => {
      events.push('a-start');
      await new Promise((resolve) => setTimeout(resolve, 10));
      events.push('a-end');
    });
    const second = runExclusive(handle, async () => {
      events.push('b');
    });

    await Promise.all([first, second]);
    expect(events).toEqual(['a-start', 'a-end', 'b']);
  });

  it('propagates errors and keeps the chain usable afterwards', async () => {
    const { runExclusive } = await import('../../src/database/transaction');
    const handle = makeHandle();

    await expect(
      runExclusive(handle, async () => {
        throw new Error('boom');
      })
    ).rejects.toThrow('boom');
    await expect(runExclusive(handle, async () => 'ok')).resolves.toBe('ok');
  });
});
