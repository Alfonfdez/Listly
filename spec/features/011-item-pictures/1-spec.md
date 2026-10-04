# 011 — Item pictures

- **Objective**
  Allow attaching up to 3 pictures to each item. The picker lives in the same expandable "details" section as the note in the inline add bar (below the note input), and under the Note field in the item edit modal. Item rows show a small thumbnail strip and tapping a thumbnail opens a full-screen viewer. Storage mirrors Finly: a single `items.pictures` TEXT column holding a JSON array of URIs — file URIs in the app document directory on native, base64 data URLs persisted inline on web.

---

## Functional requirements

### 1. Data model
- The `items` table gains a nullable `pictures TEXT` column (migration `004_item_pictures`, guarded idempotently against an existing column; `SCHEMA_VERSION` bumps to 4).
- The column stores a JSON-serialized array of photo URIs (`"..."` → pseudo no-op; `[]` → `null`). Reading tolerates a legacy non-array value as a single photo.
- Maximum of 3 pictures per item (`MAX_ITEM_PICTURES`), enforced in the UI only.

### 2. Add flow (ListDetailScreen inline add bar)
- The existing chevron toggle that expands the note input now expands a "details" area: the note input plus an "Add photos" section beneath it.
- The photo section shows existing thumbnails (80×80) with a remove button per photo (remove requires confirmation); a dashed "Add photo" box opens a source modal (Take photo — native only; Add from gallery).
- The add box is hidden once 3 photos are attached.
- Submitting the add bar serializes the chosen photos into the item; the photo state clears along with the name/note after creation.

### 3. Edit flow (ItemFormModal)
- The photo section appears under the Note field when editing an item, pre-loaded with the item's existing photos.
- Saving persists the current photo list; removing all photos clears the column.

### 4. Display (ItemRow)
- Items with photos render a thumbnail strip (up to 3, 36×36) below the item name.
- Tapping a thumbnail opens a full-screen viewer with a close button.

### 5. Photo storage & cleanup
- Native: picked photos are copied to the app document directory and stored as file URIs; removing a photo or deleting the owning item/list deletes the files.
- Web: photos are stored as base64 data URLs inline in the DB (persisted via IndexedDB); no file cleanup is needed.
- `itemRepo.delete` / `deleteMany` and `listRepo.delete` / `deleteMany` gather the affected `pictures` before the row deletion and clean up files after (no-op on web / empty lists).

---

## Non-functional requirements

- **Multilingual**: new i18n keys (en/es) for photos title, add/take/gallery/remove, removal confirmation, and message; the details toggle label changes to "Toggle details".
- **Theme/text size**: photo surfaces use `c.surface`/`c.border`/`c.text`; the photo remove button and its confirmation use `c.red` with white text; all text through `fs()`.
- **Tests**: repo contract tests for pictures create/update round-trip; `itemPhotos` util tests (parse/serialize/delete/file naming); component tests for `PhotoSection` (max-3 guard, removal confirmation, source picker) and `ItemRow` thumbnails; `ListDetailScreen` tests for the details area, photo serialization on create/update, and add-state reset; db-drift/migration expectations updated to `SCHEMA_VERSION` 4.
- **Verification**: web loop at 375px — details area shows the photo section, add up to 3 photos via gallery (base64), max-3 guard, row thumbnail strip, full-screen viewer, edit modal shows photos under Note, removal confirmation, persistence after reload. Camera capture is native-only (not checkable on web).

---

## Acceptance criteria

- [x] A nullable `items.pictures` column exists (migration 004, `SCHEMA_VERSION` 4) and zod/drizzle schemas match it.
- [x] The expanded details area in the add bar shows the note input plus an "Add photos" section with an add box and per-photo remove buttons.
- [x] Choosing "Add from gallery" attaches a photo; the add box disappears at 3 photos; up to 3 pictures persist on the item after adding.
- [x] The edit modal shows the photo section under the Note field, pre-loaded with the item's photos, and saving changes (including removing all) persists.
- [x] Item rows with pictures render a thumbnail strip under the name; tapping a thumbnail opens a full-screen viewer with a close button.
- [x] Removing a photo requires confirmation; web photos are data URLs stored inline; native file cleanup is wired in item/list delete paths.
- [x] All new UI respects theme tokens and `fs()` scaling; all visible text exists in en and es.
- [x] All tests pass (repo contract tests, util tests, component tests, typecheck, lint).

---