import { describe, expect, it, vi, afterEach } from 'vitest';
import { logError, runSafely, subscribeToErrors, ERROR_SCOPE } from '../../src/utils/errors';

describe('errors utils', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logError logs and notifies subscribers', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const listener = vi.fn();
    const unsubscribe = subscribeToErrors(listener);

    logError(ERROR_SCOPE.saveConfig, new Error('nope'));

    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(ERROR_SCOPE.saveConfig, expect.any(Error));
    unsubscribe();
  });

  it('stops notifying after unsubscribe', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const listener = vi.fn();
    subscribeToErrors(listener)();

    logError(ERROR_SCOPE.saveConfig, new Error('nope'));

    expect(listener).not.toHaveBeenCalled();
  });

  it('runSafely swallows a rejected promise and logs it', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    runSafely(Promise.reject(new Error('boom')), ERROR_SCOPE.reorderLists);
    await Promise.resolve();
    await Promise.resolve();

    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  it('runSafely does nothing for a fulfilled promise', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    runSafely(Promise.resolve(), ERROR_SCOPE.reorderLists);
    await Promise.resolve();
    await Promise.resolve();

    expect(errorSpy).not.toHaveBeenCalled();
  });
});
