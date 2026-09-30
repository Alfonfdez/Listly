import { beforeEach, describe, expect, it, vi } from 'vitest';

const engine = vi.hoisted(() => ({
  getDrizzle: vi.fn(),
  withTransaction: vi.fn(),
}));

vi.mock('../../src/database/drizzle/engine', () => ({
  getDrizzle: engine.getDrizzle,
  withTransaction: engine.withTransaction,
}));

describe('database access helpers', () => {
  beforeEach(() => {
    engine.getDrizzle.mockReset();
    engine.withTransaction.mockReset();
  });

  it('read passes the resolved db to the task and returns its value', async () => {
    const db = { tag: 'db' };
    engine.getDrizzle.mockResolvedValue(db);
    const { read } = await import('../../src/database/access');

    const result = await read(async handle => {
      expect(handle).toBe(db);
      return 'ok';
    });

    expect(result).toBe('ok');
    expect(engine.getDrizzle).toHaveBeenCalledTimes(1);
    expect(engine.withTransaction).not.toHaveBeenCalled();
  });

  it('write delegates to withTransaction and returns its value', async () => {
    const db = { tag: 'db' };
    engine.withTransaction.mockImplementation(async (task: (h: unknown) => Promise<unknown>) => task(db));
    const { write } = await import('../../src/database/access');

    const result = await write(async handle => {
      expect(handle).toBe(db);
      return 42;
    });

    expect(result).toBe(42);
    expect(engine.withTransaction).toHaveBeenCalledTimes(1);
    expect(engine.getDrizzle).not.toHaveBeenCalled();
  });
});
