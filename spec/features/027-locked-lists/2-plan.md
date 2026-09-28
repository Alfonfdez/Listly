# 027 — Locked lists (encrypted vault): Plan

## Architecture

```
                    ┌─────────────────────────────┐
ListDetailScreen ──▶│ Lock list (passphrase modal)│──▶ vaultRepo.lock(listId, passphrase, items)
                    └─────────────────────────────┘        │ encrypt items → vaults row
                                                            └ delete plaintext items (1 tx)

Locked list (no vault decrypted) ──▶ LockScreen (passphrase) ──▶ vaultRepo.unlock(listId, pass)
                                                                     │ verify → decrypt → Item[] (memory)
                                                                     └ session state (hook), no persistence

Unlocked session edit ──▶ vaultRepo.saveUnlocked(listId, pass, items) ──▶ re-encrypt payload

Remove lock ──▶ vaultRepo.removeLock(listId, pass) ──▶ decrypt → insert plaintext rows + delete vault (1 tx)
```

- **Crypto core** (`src/utils/vaultCrypto.ts`) is pure and platform-agnostic:
  - `deriveKey(passphrase, saltHex, iterations, digest)` → `Uint8Array` (32B). Native uses `react-native-quick-crypto` `pbkdf2Sync`; web uses `crypto.subtle` PBKDF2. One interface, two platform branches via `utils/platform.ts` + a `.web.ts` split.
  - `makeVerifier(keyBytes, saltHex)` → hex digest (SHA-256 over `salt:verifier:key`).
  - `encryptPayload(keyBytes, json)` → `{ payload }` (base64 AES-256-GCM sealed blob).
  - `decryptPayload(keyBytes, payload)` → json string.
  - AES on native via quick-crypto (`createCipheriv('aes-256-gcm', …)`); on web via `crypto.subtle.encrypt('AES-GCM', …)`. The spike proved native AES via quick-crypto and (previously) expo-crypto; quick-crypto covers both.
  - Encoding helpers (base64/UTF-8) are manual (no `Buffer`/`TextEncoder` assumptions) — validated in the spike.
- **Repo** (`src/database/repositories/vaultRepo.ts`):
  - `lock(listId, passphrase, items)` — one `withTransaction`: build salt/key/verifier/payload from `items` JSON, `INSERT` the vault row, `DELETE FROM items WHERE list_id = ?`.
  - `unlock(listId, passphrase)` — read the vault, derive key, verify, decrypt → `Item[]` (never persisted).
  - `saveUnlocked(listId, passphrase, items)` — re-derive/verify then `UPDATE vaults SET payload, updated_at` (used by every edit in an unlocked session).
  - `removeLock(listId, passphrase)` — verify+decrypt, re-`INSERT` plaintext items, `DELETE` the vault row, in one transaction.
  - `meta(listId)` — `salt/iterations/digest/verifier` for the unlock prompt (no secrets).
  - `exists(listId)` — drives the badge/guards.
- **Session state** (`src/hooks/useVaultSession.ts`): holds `{ listId, key, items }` in memory for the currently open list; clears on screen blur (`useFocusEffect` cleanup) so leaving re-locks. Passphrase is passed to the hook per action and not retained beyond the write.
- **Guards:** `AppContext`/screens consult `vaultExists` set to hide progress + exclude from search/totals and to disable copy/merge/duplicate; `ItemRow`/`AddItemBar`/`ItemFormModal` hide photo affordances inside a locked list.

## Data model

- Schema `SCHEMA_VERSION` 8 → 9.
- New table (canonical `createSchema` in `001_initial.ts`):
  ```sql
  CREATE TABLE IF NOT EXISTS vaults (
    list_id INTEGER PRIMARY KEY,
    salt TEXT NOT NULL,
    kdf_iterations INTEGER NOT NULL,
    kdf_digest TEXT NOT NULL,
    kdf_version INTEGER NOT NULL,
    verifier TEXT NOT NULL,
    payload TEXT NOT NULL,          -- base64 AES-256-GCM sealed blob
    updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE
  );
  ```
- Drizzle `vaults` table + Zod `vaultSchema` (`z.infer` types re-exported from `database/types.ts`); read-path validation via `parseRowOrNull`.
- `listRepo.delete`/`deleteMany` and `collectionRepo` cascade paths already delete lists; the vault row goes with the cascade (and its ciphertext needs no cleanup).
- Backup (`backup.ts`): `backupVaultSchema` added to the snapshot `data` (`vaults` array, optional, default `[]` for legacy backups); `buildBackup` selects vault rows as-is; `applyBackup` inserts them after lists/items. Locked items are absent from `data.items` because they do not exist as rows.
- `clearDataKeepSettings()` / `resetDatabase()` also clear `vaults`.

## Components

| Component | Location | Change |
|-----------|----------|--------|
| `vaultCrypto.ts` (+ `.web.ts`) | `src/utils/` | **New** KDF/verifier/encrypt/decrypt over platform branches |
| `vaultRepo.ts` | `src/database/repositories/` | **New** lock/unlock/saveUnlocked/removeLock/meta/exists |
| `vaultSchema` / `Vault` | `src/database/schemas.ts`, `types.ts` | **New** row shape + type |
| `vaults` | `src/database/drizzle/schema.ts`, `001_initial.ts` | **New** table + DDL |
| `useVaultSession.ts` | `src/hooks/` | **New** in-memory unlock session, re-lock on blur |
| `LockListModal.tsx` | `src/components/` | **New** set-passphrase (twice) + unrecoverable warning |
| `UnlockListScreen`/`VaultLockScreen.tsx` | `src/components/` (rendered by `ListDetailScreen`) | **New** passphrase prompt + error |
| `VaultLockBadge` | `src/components/Tile.tsx` / `DetailHeader` | **New** lock indicator + progress placeholder |
| `AppContext.tsx` | `src/context/` | Expose `lockedListIds`; exclude locked lists from search/totals helpers |
| `ListDetailScreen.tsx` | `src/screens/` | Lock action, locked view, unlock session wiring, guards |
| `backup.ts` | `src/database/` | Export/import `vaults`, legacy default |
| i18n | `src/i18n/en.ts`, `es.ts` | **New** vault keys |
| `errors.ts` | `src/utils/` | **New** `lockList`/`unlockList`/`removeLock`/`saveLockedList` scopes |

## Data flow

- Lock: modal → `await vaultRepo.lock(listId, pass, items)` → `await refresh()` → list now locked (badge, hidden progress).
- Open locked list: `ListDetailScreen` sees `vaultExists` → renders the lock screen instead of items. Unlock → `vaultRepo.unlock` → session hook holds items + key → screen renders normally.
- Edit while unlocked: mutation updates the in-memory items and calls `vaultRepo.saveUnlocked` (re-encrypt); `refresh()` after the await (per the existing await-before-refresh rule).
- Leave screen: `useFocusEffect` cleanup clears the session → locked again.
- Failure: `catch` + `logError` under the vault scopes; state untouched (transaction / in-memory rollback).

## Risks / notes

- **Irreversible data loss** is by design; the warning must be explicit and the confirmation hard to trigger by accident.
- **Photos:** v1 forbids them in locked lists to avoid leaking unencrypted files; the guard must also cover the copy/merge paths that could otherwise inject photos.
- **Concurrent refresh:** all vault writes must be awaited before `refresh()`, and lock/unlock must run inside a single transaction to avoid a window with both plaintext rows and a vault row.
- **Platform KDF divergence:** web (`crypto.subtle`) and native (quick-crypto) must both produce the same 32-byte key for the same inputs; unit-test the native path and document the web path. `crypto.subtle` requires a secure origin (localhost/https).
- **Dev build required:** `react-native-quick-crypto` needs a development build (no Expo Go); this is now part of the project's native workflow.
- **Scope discipline:** locked items cannot participate in cross-list reads while locked; keep those actions hidden rather than failing mid-flow.
