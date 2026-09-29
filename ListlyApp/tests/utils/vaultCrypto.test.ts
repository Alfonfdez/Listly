import { describe, expect, it } from 'vitest';
import { webcrypto } from 'node:crypto';
import {
  KDF_DIGEST,
  KDF_ITERATIONS,
  VaultCryptoError,
  newSalt,
  seal,
  unseal,
  makeVerifier,
  deriveKey,
  bytesToBase64,
  base64ToBytes,
  utf8Encode,
  utf8Decode,
  bindVaultCrypto,
  webCryptoHashName,
  VAULT_ERROR,
  type SealedVault,
  type VaultPlatformCrypto,
} from '../../src/utils/vaultCryptoCore';

const cryptoRef = webcrypto as unknown as Crypto;

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

const testPlatform: VaultPlatformCrypto = {
  async randomBytes(length) {
    return cryptoRef.getRandomValues(new Uint8Array(length));
  },
  async pbkdf2(passphrase, salt, iterations, digest) {
    const material = await cryptoRef.subtle.importKey('raw', utf8Encode(passphrase), 'PBKDF2', false, [
      'deriveBits',
    ]);
    const bits = await cryptoRef.subtle.deriveBits(
      { name: 'PBKDF2', salt: utf8Encode(salt), iterations, hash: webCryptoHashName(digest) },
      material,
      256
    );
    return new Uint8Array(bits);
  },
  async sha256Hex(data) {
    const digest = await cryptoRef.subtle.digest('SHA-256', utf8Encode(data));
    return Array.from(new Uint8Array(digest))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  },
  async encrypt(key, plaintext) {
    const iv = cryptoRef.getRandomValues(new Uint8Array(12));
    const cryptoKey = await cryptoRef.subtle.importKey('raw', toArrayBuffer(key), { name: 'AES-GCM' }, false, [
      'encrypt',
    ]);
    const sealed = new Uint8Array(
      await cryptoRef.subtle.encrypt({ name: 'AES-GCM', iv: toArrayBuffer(iv) }, cryptoKey, toArrayBuffer(plaintext))
    );
    const combined = new Uint8Array(iv.length + sealed.length);
    combined.set(iv, 0);
    combined.set(sealed, iv.length);
    return bytesToBase64(combined);
  },
  async decrypt(key, payload) {
    const combined = base64ToBytes(payload);
    const iv = combined.subarray(0, 12);
    const ciphertext = combined.subarray(12);
    const cryptoKey = await cryptoRef.subtle.importKey('raw', toArrayBuffer(key), { name: 'AES-GCM' }, false, [
      'decrypt',
    ]);
    const plain = await cryptoRef.subtle.decrypt(
      { name: 'AES-GCM', iv: toArrayBuffer(iv) },
      cryptoKey,
      toArrayBuffer(ciphertext)
    );
    return new Uint8Array(plain);
  },
};

const PASSPHRASE = 'correct horse battery';
const FAST_ITERATIONS = 2_000;
const json = JSON.stringify([
  { id: 1, name: 'Milk', note: 'Sin lactosa 🥛', checked: 1 },
  { id: 2, name: 'Café ☕', note: 'àçã — ok', checked: 0 },
]);

describe('vaultCrypto encoding', () => {
  it('round-trips bytes through base64', () => {
    const bytes = new Uint8Array([0, 1, 2, 253, 254, 255, 128, 64]);
    expect(Array.from(base64ToBytes(bytesToBase64(bytes)))).toEqual(Array.from(bytes));
  });

  it('round-trips unicode strings through UTF-8', () => {
    const text = 'Café ☕ àçã — 🥛 emoji';
    expect(utf8Decode(utf8Encode(text))).toBe(text);
  });
});

describe('vaultCrypto seal/unseal', () => {
  it('derives a stable 32-byte key for the same salt and passphrase', async () => {
    const salt = await newSalt(testPlatform);
    const a = await deriveKey(testPlatform, PASSPHRASE, salt, FAST_ITERATIONS, KDF_DIGEST);
    const b = await deriveKey(testPlatform, PASSPHRASE, salt, FAST_ITERATIONS, KDF_DIGEST);
    expect(a.length).toBe(32);
    expect(Array.from(a)).toEqual(Array.from(b));
  });

  it('changes the key when the passphrase changes', async () => {
    const salt = await newSalt(testPlatform);
    const a = await deriveKey(testPlatform, PASSPHRASE, salt, FAST_ITERATIONS, KDF_DIGEST);
    const b = await deriveKey(testPlatform, 'wrong', salt, FAST_ITERATIONS, KDF_DIGEST);
    expect(Array.from(a)).not.toEqual(Array.from(b));
  });

  it('verifier accepts the right passphrase and rejects a wrong one', async () => {
    const salt = await newSalt(testPlatform);
    const key = await deriveKey(testPlatform, PASSPHRASE, salt, FAST_ITERATIONS, KDF_DIGEST);
    const verifier = await makeVerifier(testPlatform, key, salt);
    const same = await makeVerifier(testPlatform, key, salt);
    const other = await deriveKey(testPlatform, 'wrong', salt, FAST_ITERATIONS, KDF_DIGEST);
    expect(verifier).toBe(same);
    expect(await makeVerifier(testPlatform, other, salt)).not.toBe(verifier);
  });

  it('round-trips a unicode payload', async () => {
    const vault = await seal(testPlatform, PASSPHRASE, json, FAST_ITERATIONS, KDF_DIGEST);
    expect(await unseal(testPlatform, vault, PASSPHRASE)).toBe(json);
  });

  it('rejects a wrong passphrase', async () => {
    const vault = await seal(testPlatform, PASSPHRASE, json, FAST_ITERATIONS, KDF_DIGEST);
    await expect(unseal(testPlatform, vault, 'wrong')).rejects.toMatchObject({ code: VAULT_ERROR.wrongPassphrase });
  });

  it('rejects a tampered payload (GCM tag)', async () => {
    const vault = await seal(testPlatform, PASSPHRASE, json, FAST_ITERATIONS, KDF_DIGEST);
    const tampered: SealedVault = { ...vault, payload: `${vault.payload.slice(0, -4)}AAAA` };
    await expect(unseal(testPlatform, tampered, PASSPHRASE)).rejects.toBeInstanceOf(VaultCryptoError);
  });

  it('produces a fresh salt each time', async () => {
    const a = await newSalt(testPlatform);
    const b = await newSalt(testPlatform);
    expect(a).toHaveLength(32);
    expect(a).not.toBe(b);
  });
});

describe('vaultCrypto bound API', () => {
  it('verifies, seals and unseals through the bound interface', async () => {
    const vaultCrypto = bindVaultCrypto(testPlatform);
    const vault = await vaultCrypto.seal(PASSPHRASE, json, FAST_ITERATIONS, KDF_DIGEST);
    expect(vault.iterations).toBe(FAST_ITERATIONS);
    expect(vault.digest).toBe(KDF_DIGEST);
    expect(await vaultCrypto.verify(vault, PASSPHRASE)).toBe(true);
    expect(await vaultCrypto.verify(vault, 'wrong')).toBe(false);
    expect(await vaultCrypto.unseal(vault, PASSPHRASE)).toBe(json);
    expect(await vaultCrypto.randomSalt()).toHaveLength(32);
  });

  it('exposes production defaults (600k sha512)', async () => {
    expect(KDF_ITERATIONS).toBe(600_000);
    expect(KDF_DIGEST).toBe('sha512');
    const bound = bindVaultCrypto(testPlatform);
    const vault = await bound.seal(PASSPHRASE, 'x');
    expect(vault.iterations).toBe(KDF_ITERATIONS);
    expect(vault.digest).toBe(KDF_DIGEST);
  });
});
