# 028 - Per-kind optional fields

- **Objective**
  Let the user choose the optional item fields (Notes, Photos) independently for **standard** lists and **numeric** lists — the same four checkboxes (Item display: Notes/Photos; Edit item: Notes/Photos) configured per list kind, so hiding a field on numeric lists does not affect standard lists and vice versa.

---

## Functional requirements

### 1. Config layer
- `Config` gains four booleans for numeric lists: `showNotesNumeric`, `showPhotosNumeric`, `editShowNotesNumeric`, `editShowPhotosNumeric` (defaults `true` — they mirror the standard flags). DB keys `show_notes_numeric`, `show_photos_numeric`, `edit_show_notes_numeric`, `edit_show_photos_numeric`.
- The existing `showNotes` / `showPhotos` / `editShowNotes` / `editShowPhotos` keys are the **standard-list** flags and are unchanged (same names and DB keys), so behavior for standard lists is preserved.
- No schema-version change: config is stored row-per-key and read leniently (`configRepo.get` spreads `DEFAULT_CONFIG`), so existing installs and older backups fill the missing numeric keys with the `true` defaults.
- Backups round-trip the new keys as ordinary config rows; a backup without them imports with the defaults.

### 2. Effective flags
- A new hook `useItemDisplayFlags(numeric: boolean)` returns `{ showNotes, showPhotos, editShowNotes, editShowPhotos }`, selecting the `*Numeric` keys when `numeric` is true and the standard keys otherwise.
- `ItemRow`, `AddItemBar` and `ItemFormModal` read their flags through this hook (each already receives the list's `numeric` value); no other component resolves kind-specific visibility.

### 3. Personalization screen
- Under the *Lists screen* section, the optional-field cards are grouped by list kind:
  - **Standard lists** — *Item display* (Notes / Photos) + *Edit item* (Notes / Photos).
  - **Numeric lists** — *Item display* (Notes / Photos) + *Edit item* (Notes / Photos).
- Each checkbox writes its own config key (`showNotes` vs `showNotesNumeric`, etc.).
- New i18n keys `settings_standard_lists` / `settings_numeric_lists` (en/es); the *Item display* / *Edit item* / *Notes* / *Photos* labels are reused.

### 4. Effects (unchanged semantics, per kind)
- *Item display* scopes to the list-detail item rows **and** the add bar; *Edit item* scopes to the edit-item modal — both now per list kind.
- Hidden values are preserved (not wiped) when saving an item, as before.

---

## Acceptance criteria

- [x] Personalization shows a **Standard lists** group and a **Numeric lists** group, each with Item display (Notes/Photos) and Edit item (Notes/Photos) — eight checkboxes total.
- [x] Toggling a standard checkbox writes the standard key; toggling a numeric checkbox writes the `*Numeric` key.
- [x] On a standard list, the item rows, add bar and edit modal follow the standard flags; on a numeric list they follow the numeric flags.
- [x] Changing one kind's flags does not change the other kind's behavior.
- [x] Defaults for both kinds are all-on; a legacy backup without the numeric keys imports them as `true`.
- [x] Numeric lists still show their amount/quantity/line-total regardless of the toggles.
- [x] `npm run test:all` passes.
