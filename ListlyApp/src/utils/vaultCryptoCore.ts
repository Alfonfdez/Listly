export const KDF_ITERATIONS = 600_000;
export const KDF_DIGEST = 'sha512';
export const KDF_VERSION = 1;
export const ZERO_SALT_BYTES = 16;
export const AES_IV_BYTES = 12;
export const AES_TAG_BYTES = 16;

const VERIFIER_LABEL = 'verifier';

const WEB_CRYPTO_DIGEST: Record<string, string> = {
  sha256: 'SHA-256',
  sha384: 'SHA-384',
  sha512: 'SHA-512',
};

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function bytesToBase64(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : undefined;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : undefined;
    out += B64[b0 >> 2];
    out += B64[((b0 & 3) << 4) | (b1 === undefined ? 0 : b1 >> 4)];
    out += b1 === undefined ? '=' : B64[((b1 & 15) << 2) | (b2 === undefined ? 0 : b2 >> 6)];
    out += b2 === undefined ? '=' : B64[b2 & 63];
  }
  return out;
}

export function base64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const clean = b64.replace(/[^A-Za-z0-9+/]/g, '');
  const out = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let buffer = 0;
  let bits = 0;
  let p = 0;
  for (let i = 0; i < clean.length; i++) {
    const idx = B64.indexOf(clean[i]);
    if (idx < 0) continue;
    buffer = (buffer << 6) | idx;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[p++] = (buffer >> bits) & 0xff;
    }
  }
  return out.subarray(0, p);
}

export function utf8Encode(str: string): Uint8Array<ArrayBuffer> {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let code = str.charCodeAt(i);
    if (code >= 0xd800 && code <= 0xdbff && i + 1 < str.length) {
      const next = str.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        code = ((code - 0xd800) << 10) + (next - 0xdc00) + 0x10000;
        i++;
      }
    }
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code < 0x10000) {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    } else {
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f)
      );
    }
  }
  return new Uint8Array(bytes);
}

export function utf8Decode(bytes: Uint8Array): string {  let out = '';
  let i = 0;
  while (i < bytes.length) {
    const b0 = bytes[i++];
    let code: number;
    if (b0 < 0x80) {
      code = b0;
    } else if ((b0 & 0xe0) === 0xc0) {
      code = ((b0 & 0x1f) << 6) | (bytes[i++] & 0x3f);
    } else if ((b0 & 0xf0) === 0xe0) {
      code = ((b0 & 0x0f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f);
    } else {
      code =
        ((b0 & 0x07) << 18) |
        ((bytes[i++] & 0x3f) << 12) |
        ((bytes[i++] & 0x3f) << 6) |
        (bytes[i++] & 0x3f);
    }
    if (code > 0xffff) {
      code -= 0x10000;
      out += String.fromCharCode(0xd800 + (code >> 10), 0xdc00 + (code & 0x3ff));
    } else {
      out += String.fromCharCode(code);
    }
  }
  return out;
}

export function bytesToHex(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i++) out += bytes[i].toString(16).padStart(2, '0');
  return out;
}

export function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export function webCryptoHashName(digest: string): string {
  return WEB_CRYPTO_DIGEST[digest.replace(/-/g, '').toLowerCase()] ?? 'SHA-256';
}

export const VAULT_ERROR = {
  wrongPassphrase: 'wrong_passphrase',
  tampered: 'tampered',
  unsupported: 'unsupported',
} as const;

export type VaultErrorCode = (typeof VAULT_ERROR)[keyof typeof VAULT_ERROR];

export class VaultCryptoError extends Error {
  readonly code: VaultErrorCode;

  constructor(code: VaultErrorCode) {
    super(code);
    this.name = 'VaultCryptoError';
    this.code = code;
  }
}

export interface VaultPlatformCrypto {
  randomBytes(length: number): Promise<Uint8Array>;
  pbkdf2(passphrase: string, salt: string, iterations: number, digest: string): Promise<Uint8Array>;
  sha256Hex(data: string): Promise<string>;
  encrypt(key: Uint8Array, plaintext: Uint8Array): Promise<string>;
  decrypt(key: Uint8Array, payload: string): Promise<Uint8Array>;
}

export interface SealedVault {
  salt: string;
  iterations: number;
  digest: string;
  verifier: string;
  payload: string;
}

function verifierInput(keyBytes: Uint8Array, saltHex: string): string {
  return `${saltHex}:${VERIFIER_LABEL}:${bytesToBase64(keyBytes)}`;
}

export async function newSalt(platform: VaultPlatformCrypto): Promise<string> {
  return bytesToHex(await platform.randomBytes(ZERO_SALT_BYTES));
}

export async function deriveKey(
  platform: VaultPlatformCrypto,
  passphrase: string,
  saltHex: string,
  iterations: number,
  digest: string
): Promise<Uint8Array> {
  return platform.pbkdf2(passphrase, saltHex, iterations, digest);
}

export async function makeVerifier(
  platform: VaultPlatformCrypto,
  keyBytes: Uint8Array,
  saltHex: string
): Promise<string> {
  return platform.sha256Hex(verifierInput(keyBytes, saltHex));
}

export async function seal(
  platform: VaultPlatformCrypto,
  passphrase: string,
  json: string,
  iterations: number,
  digest: string
): Promise<SealedVault> {
  const salt = await newSalt(platform);
  const keyBytes = await deriveKey(platform, passphrase, salt, iterations, digest);
  try {
    const payload = await platform.encrypt(keyBytes, utf8Encode(json));
    const verifier = await makeVerifier(platform, keyBytes, salt);
    return { salt, iterations, digest, verifier, payload };
  } finally {
    keyBytes.fill(0);
  }
}

export async function unseal(
  platform: VaultPlatformCrypto,
  vault: SealedVault,
  passphrase: string
): Promise<string> {
  const keyBytes = await deriveKey(platform, passphrase, vault.salt, vault.iterations, vault.digest);
  try {
    const verifier = await makeVerifier(platform, keyBytes, vault.salt);
    if (verifier !== vault.verifier) throw new VaultCryptoError(VAULT_ERROR.wrongPassphrase);
    let plain: Uint8Array;
    try {
      plain = await platform.decrypt(keyBytes, vault.payload);
    } catch {
      throw new VaultCryptoError(VAULT_ERROR.tampered);
    }
    return utf8Decode(plain);
  } finally {
    keyBytes.fill(0);
  }
}

export interface VaultCrypto {
  randomSalt(): Promise<string>;
  seal(passphrase: string, json: string, iterations?: number, digest?: string): Promise<SealedVault>;
  unseal(vault: SealedVault, passphrase: string): Promise<string>;
  verify(vault: SealedVault, passphrase: string): Promise<boolean>;
}

export function bindVaultCrypto(platform: VaultPlatformCrypto): VaultCrypto {
  return {
    randomSalt: () => newSalt(platform),
    seal: (passphrase, json, iterations = KDF_ITERATIONS, digest = KDF_DIGEST) =>
      seal(platform, passphrase, json, iterations, digest),
    unseal: (vault, passphrase) => unseal(platform, vault, passphrase),
    verify: async (vault, passphrase) => {
      const keyBytes = await deriveKey(platform, passphrase, vault.salt, vault.iterations, vault.digest);
      try {
        const verifier = await makeVerifier(platform, keyBytes, vault.salt);
        return verifier === vault.verifier;
      } finally {
        keyBytes.fill(0);
      }
    },
  };
}


