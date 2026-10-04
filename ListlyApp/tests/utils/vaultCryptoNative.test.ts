import { describe, expect, it } from 'vitest';
import { vaultCrypto, isVaultAvailable, __setQuickCryptoModuleForTests } from '../../src/utils/vaultCrypto';
import { VaultCryptoError } from '../../src/utils/vaultCryptoCore';

describe('vaultCrypto native availability', () => {
  it('reports the vault available when the native module is present', () => {
    expect(isVaultAvailable()).toBe(true);
  });

  it('reports the vault unavailable and rejects with "unsupported" when the module is missing', async () => {
    __setQuickCryptoModuleForTests(null);
    expect(isVaultAvailable()).toBe(false);
    await expect(vaultCrypto.seal('passphrase', '[]', 1000, 'sha512')).rejects.toBeInstanceOf(
      VaultCryptoError
    );
  });
});
