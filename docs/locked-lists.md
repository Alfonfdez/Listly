# Locked lists — platforms, encryption and Expo Go

This document explains how **locked lists** (feature 027) work, why they need real cryptography,
and what happens on each platform — web, a native development build, and Expo Go.

## What a locked list is

A locked list stores its **items encrypted at rest**. The plaintext item rows are deleted and
replaced by a single ciphertext blob; the items only exist in memory while the list is unlocked.
The list's metadata (name, color, icon, kind, pinned, position, collection) stays plaintext.

- Per-list passphrase (min 6 chars, entered twice, unrecoverable warning).
- **No recovery:** a lost passphrase means permanent loss of the list's items.
- While locked: lock badge, hidden progress, excluded from search and totals, cross-list actions
  (copy-to-list / merge / duplicate) unavailable.
- Open a locked list → passphrase **lock screen**; unlock decrypts into memory for that screen
  only and **re-locks when you leave it**. Every edit while unlocked is re-encrypted.
- *Change passphrase* re-seals with a fresh salt (same KDF settings) and keeps the items.
- *Remove lock* decrypts and restores plaintext rows.
- Photos are disallowed in locked lists (v1) so no unencrypted file can leak the contents.

## Cryptography

- **Key derivation:** PBKDF2-HMAC-SHA-512, 600,000 iterations (iteration count and digest are
  stored per vault row for future upgrades).
- **Encryption:** AES-256-GCM; the sealed blob (IV + ciphertext + tag) is stored base64.
- A salted **verifier** rejects a wrong passphrase without decrypting; the GCM tag rejects
  tampered ciphertext.
- The passphrase and derived key are **never** stored (not in the DB, not in a backup, not in a
  keystore). `verify`/`unseal` are handled by `src/utils/vaultCryptoCore.ts`, with a per-platform
  implementation behind one `VaultPlatformCrypto` interface.
- Backups export the vault row **as-is (still encrypted)** and omit locked items from the
  plaintext `items` array, so a backup of a locked list is useless without its passphrase.

## Platform support

| Platform | Crypto backend | Locked lists |
|----------|----------------|--------------|
| **Web** (Expo web / browser) | `crypto.subtle` (WebCrypto PBKDF2 + AES-GCM) | **Works.** Requires a secure origin (HTTPS; `localhost` counts). |
| **Native development build** (`npx expo run:android` / `run:ios`, or an EAS dev build) | `react-native-quick-crypto` (Nitro/JSI native PBKDF2 + AES-GCM) | **Works.** This is the supported way to test locked lists on a device. |
| **Expo Go** | none (module absent) | **Not available — but no longer crashes.** See below. |

### Why Expo Go cannot provide locked lists

`react-native-quick-crypto` ships **native TurboModules** (for example `QuickBase64`) built on
Nitro. Expo Go contains a **fixed set of prebuilt native modules** and does not include them, so
importing the library in Expo Go throws:

```
Invariant Violation: TurboModuleRegistry.getEnforcing(...): 'QuickBase64' could not be found.
```

The JS-only alternative (iterating SHA-256 across the JS↔native bridge, or pure-JS PBKDF2) was
measured during the feature spike and is roughly **60× slower** on device (tens of seconds per
unlock), so it is not a viable replacement. Locked lists therefore require real native crypto.

### Graceful degradation in Expo Go

To keep Expo Go useful as a fast iteration loop for everything else, the native crypto is now
**loaded lazily**:

- `src/utils/vaultCrypto.native.ts` no longer imports quick-crypto at startup; it `require`s it
  only when a vault operation runs, and caches availability in `isVaultAvailable()`.
- Before requiring, it **probes the native module** with the non-throwing
  `TurboModuleRegistry.get('QuickBase64')` (the canary for the missing module). This matters
  because Metro reports a *failed require* via `ErrorUtils.reportFatalError` — so a plain
  `try/catch` around the `require` is not enough (the red screen is raised before the catch runs).
  Skipping the require when the probe is empty avoids the fatal report entirely.
- If the module is missing (Expo Go), `isVaultAvailable()` returns `false` and vault operations
  throw `VaultCryptoError('unsupported')` instead of crashing the app.
- On the list screen, when the vault is unavailable:
  - the **Lock list / Change passphrase** action stays visible and, on press, opens an
    informational modal ("Locked lists need a development build");
  - a previously locked list shows an explanatory view instead of the passphrase prompt.

So in Expo Go you can use Home, Lists, Collections, Settings, numeric lists, merge/copy, etc.;
only locking/unlocking a list is disabled, with a clear message.

On **web** and in a **development build** `isVaultAvailable()` is `true` and the lock/unlock/
change/remove flows run normally.

## How to test

- **Web:** `npx expo start --web` (or `npm run web`) and open the app. Locked lists work
  end-to-end (PBKDF2/AES via `crypto.subtle`).
- **Native dev build:** `npx expo run:android` (or `run:ios`, or EAS). The installed app is
  `com.listly.app`; open it via the dev server. Locked lists work (quick-crypto).
- **Expo Go:** `npx expo start` and scan with Expo Go. The app runs; the lock action shows the
  "needs a development build" message instead of crashing.

> Note: the app's database is per-platform (native SQLite file vs web IndexedDB), so a list locked
> in a dev build is not the same data as on web — that is expected, not a bug.

## References

- Spec: `spec/features/027-locked-lists/`.
- Crypto core: `src/utils/vaultCryptoCore.ts`, `src/utils/vaultCrypto.ts` (web),
  `src/utils/vaultCrypto.native.ts` (native + lazy loader).
- Repo: `src/database/repositories/vaultRepo.ts`.
- Spike measurements: `docs/changelog.md` (feature 027 crypto spike entry).
