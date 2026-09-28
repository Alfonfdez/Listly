# 027 — Locked lists (encrypted vault)

- **Objective**
  Let the user lock a list with a passphrase so its items are stored **encrypted at rest** and are unreadable without that passphrase — not searchable, not counted, not visible in any list/collection total, and not present as plaintext in a backup. This is real confidentiality (per-list key), not a UI hide: a locked list's items live only as ciphertext until unlocked.

---

## Threat model and scope

- **What this protects.** The item rows of a locked list (names, notes, checked state, numeric fields) are encrypted in the database file and in exported backups. Someone who obtains the database/backup cannot read a locked list's contents without its passphrase.
- **What this does NOT protect (v1).** The list's metadata stays plaintext: name, color, icon, kind, pinned, position, collection membership. The existence of the list and its name are visible. Photos are **not allowed** in locked lists (v1), so no photo file can leak a locked list's contents.
- **No recovery.** There is no backdoor, escrow, or recovery code. A lost passphrase means permanent, unrecoverable loss of the locked list's items. The UI warns about this before locking.
- **Per-list model.** Each locked list has its own passphrase and its own derived key. A compromised passphrase exposes only that list.

---

## Functional requirements

### 1. Locking a list
- List detail offers a *Lock list* action (available when the list has items and is not already locked).
- Locking asks for a passphrase (entered twice to confirm) and requires an explicit acknowledgement that the passphrase is unrecoverable if lost.
- Passphrase rule: **minimum 6 characters**, no maximum. The UI states that longer is stronger (a 6-char passphrase is weak against offline brute force) — the work factor compensates as far as possible.
- On confirm, the list's items are encrypted into the vault and the plaintext item rows are **deleted** from the `items` table in one transaction. From that moment the items exist only as ciphertext.
- A list that contains photos **cannot** be locked: the *Lock list* action is blocked with a clear message (photos are not encrypted in v1), and the user is told to remove the photos first.

### 2. Locked state
- A locked list shows a **lock badge** wherever the list is displayed (Home, Lists, Collections screen, Collection detail, list detail header).
- While locked, the list's progress is hidden (a lock marker instead of `N/total`) and its items are excluded from search results. It is not counted in any aggregate total.
- Opening a locked list shows a **lock screen** (not the items): passphrase input + *Unlock*, with a hint that the passphrase is not recoverable.
- The lock state is derived from the existence of the list's vault row.

### 3. Unlocking
- Entering the correct passphrase decrypts the items **into memory only** (a session view); nothing is written back as plaintext.
- A wrong passphrase is rejected with a clear error (verified without exposing whether decryption returned garbage).
- The unlocked session lasts while the list screen is open and is **re-locked automatically when the user leaves the screen**: the in-memory items and derived key are discarded, and the list returns to the locked state.
- While unlocked, the list behaves like a normal list (view, toggle, add, edit, delete, reorder, sort, copy clipboard, etc.), except that edits are persisted **encrypted**: every write re-encrypts the vault payload rather than inserting plaintext rows.
- Photos remain disallowed while unlocked in a locked list (consistent with §1).

### 4. Removing the lock
- An *Unlock permanently* / *Remove lock* action (from the locked/unlocked list) requires the passphrase, then decrypts and re-inserts the items as plaintext rows and deletes the vault row in one transaction; the list becomes a normal list again.

### 5. Cross-list and global guards
- A locked list cannot be the **source or target** of copy-to-list, merge, or a full duplicate while locked (its items are not readable). These actions are hidden/disabled for a locked list (and hidden when a locked list is the only candidate target).
- Drag a list into/out of a collection, rename, recolor, reicon, change kind, pin/unpin, and delete the list remain allowed while locked — they only touch plaintext metadata. Deleting a locked list deletes its vault row and ciphertext with it.
- The *locked* list stays in its normal position/section ordering (metadata is plaintext), it is simply not openable without the passphrase.

### 6. Persistence, crypto, and backup
- A new `vaults` table stores, per locked list: `list_id` (PK, FK → lists, `ON DELETE CASCADE`), `salt`, `kdf_iterations`, `kdf_digest`, `kdf_version`, `verifier`, `payload`, `updated_at`. Schema `SCHEMA_VERSION` 8 → 9.
- **Key derivation:** PBKDF2-HMAC-SHA-512, **600,000 iterations** (measured ≈ 165 ms on the dev-build emulator; the count and digest are stored per vault row for future upgrades). Web uses `crypto.subtle` PBKDF2; native uses `react-native-quick-crypto`.
- **Encryption:** AES-256-GCM; the sealed blob is stored as base64. A `verifier` (a salted hash of the derived key) lets the app reject a wrong passphrase without decrypting, and the GCM tag rejects tampered ciphertext.
- The derived key and passphrase are **never** stored anywhere (not in the DB, not in backups, not in a keystore).
- **Backup:** the vault row is exported as-is (still encrypted) and restored on import; locked items are **absent** from the plaintext `items` array. A backup of a locked list is unusable without its passphrase. Backups made before this feature import with no vaults (all lists unlocked, lenient).

### 7. i18n and error handling
- New keys in en/es covering: lock/unlock/remove-lock actions, passphrase label + confirm, the unrecoverable warning, the min-length hint, the "photos not allowed" message, wrong-passphrase error, the locked badge/progress placeholder, and the lock screen copy.
- New error scopes for the vault operations (`lockList`, `unlockList`, `removeLock`, `saveLockedList`); failures surface through the existing error path and leave the state untouched (transactions).

---

## Non-functional requirements

- **TypeScript strict**, no `any`; theme tokens + `fs()`; accessibility labels/roles on the passphrase fields, lock/unlock buttons, and the lock badge.
- **Pure crypto core** (`utils/vaultCrypto.ts`) is platform-agnostic and unit-testable: `deriveKey`, `makeVerifier`, `encryptPayload`, `decryptPayload` — with native/web KDF branches behind one interface.
- **Performance:** unlocking must feel instant — target well under ~500 ms for key derivation on a mid device (spike: 165 ms at 600k SHA-512 on the emulator).
- **Secret hygiene:** passphrases are held in component state only for the duration of the action; derived key buffers are zeroed after use; no logging of passphrases or keys.
- **Tests:** crypto unit tests (derive determinism, verifier accept/reject, encrypt/decrypt round-trip, wrong passphrase + tamper rejection, unicode payloads); repo tests (lock deletes plaintext rows, unlock returns them, re-encrypt on edit, remove-lock restores rows, cascade delete, guards for photos/cross-list ops); backup tests (vault exported encrypted, plaintext items absent, legacy import); screen tests (lock flow, unlock, wrong passphrase, locked badge, hidden progress, excluded from search/totals, re-lock on leaving the screen).
- **Verification:** `npm run test:all` green; web loop at 375px (lock a list → items disappear from the list/search/counts → unlock → visible → leave the screen → re-locked; wrong passphrase rejected; remove lock restores). Native KDF timing is verified by a documented dev-build spike (see `docs/harnesses.md`); camera/photo and native-only paths are reported as not checkable on web where applicable.

---

## Acceptance criteria

- [ ] A list with items can be locked with a passphrase (min 6 chars, entered twice, unrecoverable warning acknowledged).
- [ ] A list containing photos cannot be locked (blocked with a clear message).
- [ ] Locking encrypts the items and deletes the plaintext item rows in one transaction; the vault row stores salt, iterations, digest, verifier, and ciphertext.
- [ ] A locked list shows a lock badge and hides its progress everywhere it appears, and its items are excluded from search and from all totals.
- [ ] Opening a locked list shows a passphrase lock screen; the correct passphrase unlocks it, a wrong passphrase is clearly rejected.
- [ ] Unlocking decrypts into memory only; the unlocked session re-locks automatically when leaving the list screen.
- [ ] Edits to an unlocked locked list are persisted encrypted (no plaintext item rows are created).
- [ ] *Remove lock* (with the correct passphrase) restores the items as plaintext rows and deletes the vault row.
- [ ] Copy-to-list, merge, and full duplicate are unavailable for a locked list (as source or target) while locked.
- [ ] Backup exports the vault encrypted and omits the locked items from plaintext; import restores the encrypted vault; older backups import with no vaults.
- [ ] Key derivation is PBKDF2-HMAC-SHA-512 with 600,000 iterations (digest/count stored per vault) and AES-256-GCM encryption, with no key or passphrase persisted.
- [ ] New labels and error scopes exist; `npm run test:all` passes.
