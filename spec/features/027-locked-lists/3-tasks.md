# 027 — Locked lists (encrypted vault): Tasks

## Spike (done — see changelog)
- [x] Crypto spike on web + native: AES-GCM, random salt, KDF, verifier, round-trip, wrong-passphrase/tamper rejection, timing.
- [x] KDF decision: **PBKDF2-HMAC-SHA-512, 600,000 iterations** via `react-native-quick-crypto` on native / `crypto.subtle` on web; dev build required.

## Crypto core
- [ ] `src/utils/vaultCrypto.ts` (+ `.web.ts`): `deriveKey`, `makeVerifier`, `encryptPayload`, `decryptPayload`, RN-safe base64/UTF-8 helpers; platform KDF branch.
- [ ] `KDF_ITERATIONS = 600_000`, `KDF_DIGEST = 'sha512'`, `KDF_VERSION = 1` constants (per-vault row storage for upgrades).
- [ ] Zero derived-key buffers after use; never log passphrases/keys.

## Data model
- [ ] Schema `SCHEMA_VERSION` 8 → 9; `vaults` table in canonical `createSchema` (`001_initial.ts`) with `ON DELETE CASCADE`.
- [ ] Drizzle `vaults` table + Zod `vaultSchema`; `Vault` type re-exported from `database/types.ts`; db-drift expectations updated.
- [ ] `vaultRepo`: `lock`, `unlock`, `saveUnlocked`, `removeLock`, `meta`, `exists` (transactions for lock/removeLock; awaited writes).
- [ ] `clearDataKeepSettings()` / `resetDatabase()` clear `vaults`.
- [ ] Backup: `backupVaultSchema` in snapshot `data`, export as-is, import after lists/items, legacy default `[]`.

## Guards and global state
- [ ] `AppContext` exposes `lockedListIds` (from `vaults`); progress/search/totals helpers exclude locked lists.
- [ ] Disable/hide copy-to-list, merge, and duplicate for a locked list as source **and** target.
- [ ] Delete/rename/icon/color/kind/pin/collection-move remain allowed while locked; delete cascades the vault.

## UI
- [ ] `LockListModal`: set passphrase (twice), min 6 chars, unrecoverable warning; blocked when the list has photos (clear message).
- [ ] `ListDetailScreen`: *Lock list* action; when locked, render the passphrase lock screen instead of items.
- [ ] `LockListModal`/lock screen errors: wrong passphrase, mismatch, too short.
- [ ] `Tile`/`DetailHeader`: lock badge + hidden progress placeholder for locked lists.
- [ ] `useVaultSession`: in-memory items/key while open; re-lock on screen blur; edits call `saveUnlocked`.
- [ ] Hide photo affordances inside a locked list; *Remove lock* action restores plaintext rows.

## i18n and errors
- [ ] en/es keys: lock/unlock/remove-lock actions, passphrase label + confirm, unrecoverable warning, min-length hint, photos-not-allowed, wrong passphrase, locked badge, lock-screen copy.
- [ ] `errors.ts`: `lockList`, `unlockList`, `removeLock`, `saveLockedList` scopes.

## Tests
- [ ] `vaultCrypto` unit: derive determinism + digest/count, verifier accept/reject, encrypt/decrypt round-trip (incl. unicode), wrong passphrase + tamper rejection.
- [ ] `vaultRepo`: lock deletes plaintext rows; unlock returns items; edit re-encrypts; removeLock restores rows; cascade delete; guards (photos, cross-list).
- [ ] Backup: vault exported encrypted + plaintext items absent; legacy import (no vaults); round-trip.
- [ ] Screens: lock flow + warning; locked badge + hidden progress; excluded from search/totals; unlock success/wrong passphrase; re-lock on leaving; copy/merge/duplicate hidden.
- [ ] `npm run test:all` green; `docs/harnesses.md` baseline refreshed.

## Docs and verification
- [ ] Roadmap `## 027-locked-lists` (entry + status), `docs/changelog.md` entry.
- [ ] Verification loop at 375px (web), acceptance criteria flipped `[x]`; native KDF timing documented; photo/camera noted as not checkable on web.
