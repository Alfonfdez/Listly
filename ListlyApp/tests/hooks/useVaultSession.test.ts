import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react-native';
import { useVaultSession } from '../../src/hooks/useVaultSession';
import type { UnlockedItems } from '../../src/database/repositories/vaultRepo';
import { VaultCryptoError, VAULT_ERROR } from '../../src/utils/vaultCrypto';

const vaultRepoMock = vi.hoisted(() => ({
  unlock: vi.fn(),
  saveUnlocked: vi.fn(async () => {}),
  removeLock: vi.fn(async () => {}),
  changePassphrase: vi.fn(async () => {}),
}));

vi.mock('../../src/database', () => ({ vaultRepo: vaultRepoMock }));

function record(id: number, position: number): UnlockedItems[number] {
  return {
    id,
    list_id: 1,
    name: `item-${id}`,
    checked: 0,
    note: null,
    position,
    created_at: 'x',
    updated_at: 'x',
    pictures: null,
    amount_minor: null,
    quantity: 0,
  };
}

describe('useVaultSession', () => {
  beforeEach(() => {
    Object.values(vaultRepoMock).forEach((fn) => fn.mockClear());
    vaultRepoMock.saveUnlocked.mockResolvedValue(undefined);
  });

  it('assigns a new item id below the existing ones so it never collides', async () => {
    vaultRepoMock.unlock.mockResolvedValue([record(-1, 0)]);
    const { result } = await renderHook(() => useVaultSession(1));

    await act(async () => {
      await result.current.unlock('pw');
    });
    await act(async () => {
      await result.current.addItem({ name: 'new', note: null, pictures: null, amount_minor: null, quantity: 0 });
    });

    const ids = result.current.items.map((item) => item.id);
    expect(ids).toEqual([-1, -2]);
    expect(new Set(ids).size).toBe(ids.length);
    expect(vaultRepoMock.saveUnlocked).toHaveBeenCalledWith(
      1,
      'pw',
      expect.arrayContaining([expect.objectContaining({ id: -2, name: 'new', position: 1 })])
    );
  });

  it('flags a wrong passphrase when removing the lock without throwing', async () => {
    vaultRepoMock.removeLock.mockRejectedValueOnce(new VaultCryptoError(VAULT_ERROR.wrongPassphrase));
    const { result } = await renderHook(() => useVaultSession(1));

    let removed = true;
    await act(async () => {
      removed = await result.current.removeLock('nope');
    });

    expect(removed).toBe(false);
    expect(result.current.wrongPassphrase).toBe(true);
    expect(vaultRepoMock.removeLock).toHaveBeenCalledWith(1, 'nope');
  });

  it('removes the lock on a correct passphrase', async () => {
    vaultRepoMock.unlock.mockResolvedValue([record(1, 0)]);
    const { result } = await renderHook(() => useVaultSession(1));
    await act(async () => {
      await result.current.unlock('pw');
    });

    let removed = false;
    await act(async () => {
      removed = await result.current.removeLock('pw');
    });

    expect(removed).toBe(true);
    expect(result.current.unlocked).toBe(false);
    expect(result.current.wrongPassphrase).toBe(false);
  });
});
