import type { VaultPlatformCrypto } from './vaultCryptoCore';
import {
  bindVaultCrypto,
  bytesToBase64,
  base64ToBytes,
  utf8Encode,
  bytesToHex,
  webCryptoHashName,
  AES_IV_BYTES,
  AES_TAG_BYTES,
} from './vaultCryptoCore';

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.length);
  copy.set(bytes);
  return copy.buffer;
}

const platform: VaultPlatformCrypto = {
  async randomBytes(length: number): Promise<Uint8Array> {
    return globalThis.crypto.getRandomValues(new Uint8Array(length));
  },

  async pbkdf2(passphrase: string, salt: string, iterations: number, digest: string): Promise<Uint8Array> {
    const subtle = globalThis.crypto.subtle;
    const keyMaterial = await subtle.importKey(
      'raw',
      utf8Encode(passphrase),
      'PBKDF2',
      false,
      ['deriveBits']
    );
    const bits = await subtle.deriveBits(
      { name: 'PBKDF2', salt: utf8Encode(salt), iterations, hash: webCryptoHashName(digest) },
      keyMaterial,
      256
    );
    return new Uint8Array(bits);
  },

  async sha256Hex(data: string): Promise<string> {
    const digest = await globalThis.crypto.subtle.digest('SHA-256', utf8Encode(data));
    return bytesToHex(new Uint8Array(digest));
  },

  async encrypt(key: Uint8Array, plaintext: Uint8Array): Promise<string> {
    const subtle = globalThis.crypto.subtle;
    const iv = globalThis.crypto.getRandomValues(new Uint8Array(AES_IV_BYTES));
    const cryptoKey = await subtle.importKey('raw', toArrayBuffer(key), { name: 'AES-GCM' }, false, ['encrypt']);
    const sealed = await subtle.encrypt(
      { name: 'AES-GCM', iv: toArrayBuffer(iv), tagLength: AES_TAG_BYTES * 8 },
      cryptoKey,
      toArrayBuffer(plaintext)
    );
    const ciphertext = new Uint8Array(sealed);
    const combined = new Uint8Array(iv.length + ciphertext.length);
    combined.set(iv, 0);
    combined.set(ciphertext, iv.length);
    return bytesToBase64(combined);
  },

  async decrypt(key: Uint8Array, payload: string): Promise<Uint8Array> {
    const subtle = globalThis.crypto.subtle;
    const combined = base64ToBytes(payload);
    const iv = combined.subarray(0, AES_IV_BYTES);
    const ciphertext = combined.subarray(AES_IV_BYTES);
    const cryptoKey = await subtle.importKey('raw', toArrayBuffer(key), { name: 'AES-GCM' }, false, ['decrypt']);
    const plain = await subtle.decrypt(
      { name: 'AES-GCM', iv: toArrayBuffer(iv), tagLength: AES_TAG_BYTES * 8 },
      cryptoKey,
      toArrayBuffer(ciphertext)
    );
    return new Uint8Array(plain);
  },
};

export const vaultCrypto = bindVaultCrypto(platform);
export const platformCrypto: VaultPlatformCrypto = platform;

export function isVaultAvailable(): boolean {
  return true;
}

export function __setQuickCryptoModuleForTests(module?: unknown): void {
  void module;
  // no-op on web (crypto.subtle is always available)
}

export * from './vaultCryptoCore';
