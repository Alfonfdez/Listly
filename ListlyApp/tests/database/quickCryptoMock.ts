import { vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import { __setQuickCryptoModuleForTests } from '../../src/utils/vaultCrypto';

const cryptoRef = webcrypto as unknown as Crypto;

function concat(parts: Uint8Array[]): Uint8Array<ArrayBuffer> {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function hashBytes(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(32);
  let acc = 2166136261;
  for (let i = 0; i < bytes.length; i++) {
    acc = (acc ^ bytes[i]) >>> 0;
    acc = Math.imul(acc, 16777619) >>> 0;
  }
  for (let i = 0; i < out.length; i++) {
    acc = Math.imul(acc ^ i, 2246822519) >>> 0;
    out[i] = (acc >>> ((i % 4) * 8)) & 0xff;
  }
  return out;
}

function tagOf(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(16);
  out.set(hashBytes(bytes).subarray(0, 16));
  return out;
}

function buildMock() {
  return {
    randomBytes(length: number): Uint8Array {
      return cryptoRef.getRandomValues(new Uint8Array(length));
    },
    pbkdf2Sync(
      passphrase: Uint8Array,
      salt: Uint8Array,
      iterations: number,
      keylen: number,
      digest: string
    ): Uint8Array {
      void iterations;
      void digest;
      const out = new Uint8Array(keylen);
      let state = hashBytes(concat([passphrase, salt]));
      for (let i = 0; i < keylen; i++) {
        state = hashBytes(concat([state, salt, new Uint8Array([i & 0xff])]));
        out[i] = state[0];
      }
      return out;
    },
    createHash() {
      const chunks: Uint8Array[] = [];
      return {
        update(data: Uint8Array) {
          chunks.push(data);
        },
        digest(): Uint8Array {
          return hashBytes(concat(chunks));
        },
      };
    },
    createCipheriv(_algorithm: string, key: Uint8Array, iv: Uint8Array) {
      let sealed = new Uint8Array(0);
      return {
        update(data: Uint8Array) {
          const out = new Uint8Array(data.length);
          for (let i = 0; i < data.length; i++) {
            out[i] = data[i] ^ key[i % key.length] ^ iv[i % iv.length];
          }
          sealed = concat([sealed, out]);
          return out;
        },
        final() {
          return new Uint8Array(0);
        },
        getAuthTag() {
          return tagOf(concat([iv, sealed]));
        },
      };
    },
    createDecipheriv(_algorithm: string, key: Uint8Array, iv: Uint8Array) {
      let authTag: Uint8Array = new Uint8Array(0);
      let sealed: Uint8Array<ArrayBuffer> = new Uint8Array(0);
      return {
        setAuthTag(value: Uint8Array) {
          authTag = value;
        },
        update(data: Uint8Array) {
          sealed = concat([sealed, data]);
          const out = new Uint8Array(data.length);
          for (let i = 0; i < data.length; i++) {
            out[i] = data[i] ^ key[i % key.length] ^ iv[i % iv.length];
          }
          return out;
        },
        final() {
          const expected = tagOf(concat([iv, sealed]));
          if (expected.length !== authTag.length || expected.some((b, i) => b !== authTag[i])) {
            throw new Error('bad tag');
          }
          return new Uint8Array(0);
        },
      };
    },
  };
}

vi.mock('react-native-quick-crypto', () => ({ default: buildMock() }));

__setQuickCryptoModuleForTests(buildMock());
