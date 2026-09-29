import type * as QuickCryptoModule from 'react-native-quick-crypto';
import type { VaultPlatformCrypto } from './vaultCryptoCore';
import {
  bindVaultCrypto,
  bytesToBase64,
  base64ToBytes,
  utf8Encode,
  bytesToHex,
  VaultCryptoError,
  VAULT_ERROR,
  AES_IV_BYTES,
  AES_TAG_BYTES,
} from './vaultCryptoCore';

declare const require: (id: string) => unknown;

// Canary: react-native-quick-crypto pulls in react-native-quick-base64, which
// resolves `TurboModuleRegistry.getEnforcing('QuickBase64')`. Probing with the
// non-throwing `get` lets us skip the require entirely where the native module
// is missing (Expo Go) — otherwise Metro reports the failed require as fatal.
const QUICK_CRYPTO_MODULE = 'QuickBase64';

type QuickCrypto = typeof QuickCryptoModule.default;

// Test-only global override (see `__setQuickCryptoModuleForTests`): lets the
// test harness inject a mock that survives `vi.resetModules()`.
const QUICK_CRYPTO_OVERRIDE_KEY = '__listlyQuickCryptoOverride';

let cached: QuickCrypto | null | undefined;

export function __setQuickCryptoModuleForTests(module: unknown): void {
  (globalThis as Record<string, unknown>)[QUICK_CRYPTO_OVERRIDE_KEY] = module;
  cached = undefined;
}

function resolveQuickCrypto(module: unknown): QuickCrypto | null {
  if (!module) return null;
  const candidate = ((module as { default?: unknown }).default ?? module) as QuickCrypto;
  return typeof candidate?.randomBytes === 'function' ? candidate : null;
}

function nativeCryptoPresent(): boolean {
  try {
    const registry = require('react-native') as {
      TurboModuleRegistry?: { get(name: string): unknown };
    };
    return registry.TurboModuleRegistry?.get(QUICK_CRYPTO_MODULE) != null;
  } catch {
    return false;
  }
}

function loadQuickCrypto(): QuickCrypto | null {
  const override = (globalThis as Record<string, unknown>)[QUICK_CRYPTO_OVERRIDE_KEY];
  if (override !== undefined) {
    return override === null ? null : resolveQuickCrypto(override);
  }
  if (cached !== undefined) return cached;
  if (!nativeCryptoPresent()) {
    cached = null;
    return cached;
  }
  try {
    cached = resolveQuickCrypto(require('react-native-quick-crypto'));
  } catch {
    cached = null;
  }
  return cached;
}

export function isVaultAvailable(): boolean {
  return loadQuickCrypto() !== null;
}

function quick(): QuickCrypto {
  const module = loadQuickCrypto();
  if (!module) throw new VaultCryptoError(VAULT_ERROR.unsupported);
  return module;
}

const platform: VaultPlatformCrypto = {
  async randomBytes(length: number): Promise<Uint8Array> {
    return new Uint8Array(quick().randomBytes(length));
  },

  async pbkdf2(passphrase: string, salt: string, iterations: number, digest: string): Promise<Uint8Array> {
    const out = quick().pbkdf2Sync(utf8Encode(passphrase), utf8Encode(salt), iterations, 32, digest);
    return new Uint8Array(out);
  },

  async sha256Hex(data: string): Promise<string> {
    const hash = quick().createHash('sha256');
    hash.update(utf8Encode(data));
    return bytesToHex(new Uint8Array(hash.digest()));
  },

  async encrypt(key: Uint8Array, plaintext: Uint8Array): Promise<string> {
    const crypto = quick();
    const iv = new Uint8Array(crypto.randomBytes(AES_IV_BYTES));
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const tag = cipher.getAuthTag();
    return bytesToBase64(new Uint8Array(Buffer.concat([iv, encrypted, tag])));
  },

  async decrypt(key: Uint8Array, payload: string): Promise<Uint8Array> {
    const crypto = quick();
    const combined = base64ToBytes(payload);
    const iv = combined.subarray(0, AES_IV_BYTES);
    const tag = combined.subarray(combined.length - AES_TAG_BYTES);
    const ciphertext = combined.subarray(AES_IV_BYTES, combined.length - AES_TAG_BYTES);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(Buffer.from(tag) as unknown as Parameters<typeof decipher.setAuthTag>[0]);
    return new Uint8Array(Buffer.concat([decipher.update(ciphertext), decipher.final()]));
  },
};

export const vaultCrypto = bindVaultCrypto(platform);
export const platformCrypto: VaultPlatformCrypto = platform;
export * from './vaultCryptoCore';
