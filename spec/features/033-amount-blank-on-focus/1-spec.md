# 033 - Blank the amount field on focus when it is zero

- **Objective**
  When editing a numeric list item, tapping the **Amount** input should not force the user to delete a pre-filled `0.00` before typing. If the amount is empty or zero, focusing the field clears it; a real (non-zero) amount is left untouched. If the user blurs without typing, the previous amount is restored so nothing is lost.

---

## Functional requirements

### 1. Blank-on-focus (numeric amount only)
- Tapping the **Amount** input on a numeric item clears the field when its current text is **empty or parses to 0** (`''`, `'0'`, `'0.00'`), so the user can type a new amount immediately.
- A **non-zero** amount (e.g. `1.20`) is **not** cleared on focus — it stays so the user can edit it in place.

### 2. Restore on untouched blur
- If the field was cleared on focus and the user blurs **without typing anything**, the previous amount text is restored (so `0.00` stays `0.00` and a `null` amount stays empty).
- If the user **typed** something, the typed value is kept (and persisted on save).

### 3. Persistence semantics (unchanged)
- Saving with a typed amount persists it (`parseAmountInput` / `sanitizeAmountText` as today).
- Saving after a restore keeps the previous amount. A `null` amount remains `null`; `0` remains `0`.
- There is **no** way to clear an amount to "no amount" from the edit modal (out of scope, by decision).

### 4. Scope
- Applies to **numeric lists** only (the amount field exists only there).
- Applies to **both** the edit modal (`ItemFormModal`) and the add bar (`AddItemBar`) for consistency; the add bar starts blank, so its behavior is effectively unchanged.
- The **quantity stepper** is not a text input and is unchanged.

---

## Non-functional requirements

- **TypeScript strict**, no `any`.
- The focus/blur logic lives in **`useItemDraft`** (shared by both screens, unit-testable without rendering); `ItemAmountField` stays presentational and only forwards `onFocus`/`onBlur`.
- No new dependencies; no i18n keys.
- **Tests**: `useItemDraft` unit cases (blank-when-zero, keep-when-non-zero, restore-on-untouched-blur, typed persists, null stays null) + a modal/add-bar integration case.
- **Verification**: `npm run test:all`; web 375px — edit `0.00` → blank → type → save; edit `1.20` → unchanged on focus; edit `0.00` → focus+blur untouched → still `0.00`.

---

## Acceptance criteria

- [x] Focusing the amount of a numeric item whose amount is empty or zero clears the field.
- [x] Focusing the amount of a numeric item with a non-zero amount leaves the text unchanged.
- [x] Blurring an untouched (cleared) field restores the previous amount text.
- [x] Typing an amount after focus keeps it; saving persists the typed amount.
- [x] A `null` amount stays empty (and saved as `null`); a `0` amount can be restored to `0`.
- [x] The add bar behaves consistently (starts blank; no regression).
- [x] The quantity stepper is unchanged.
- [x] `npm run test:all` passes.
