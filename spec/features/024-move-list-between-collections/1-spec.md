# 024 — Move list between collections

- **Objective**
  Let the user assign a list to a collection (or move it between collections / back to standalone) from Edit List, complementing the drag-in/drag-out flows (features 018/019) with a picker.

---

## Functional requirements

### 1. Collection picker in Edit List
- Edit List gains a *Collection* selector row (between the form fields and the Save button, above Delete list).
- Tapping it opens a collection picker modal listing:
  - every collection (icon, color, name), and
  - a *Standalone / No collection* option.
- The option matching the list's current `collection_id` is shown as selected. The list's own collection is included (moving a list to its current collection is a no-op).
- Changing the selection does not apply anything by itself — the move happens on Save together with name/icon/color.

### 2. Persistence
- On Save, Edit List calls `listRepo.update(id, { name, icon, color })` and, if the collection changed:
  - to a collection → `listRepo.moveToCollection(id, collectionId)` (append at the collection's end — parity with drag),
  - to standalone → `listRepo.removeFromCollection(id)` (append at the end of the standalone lists).
- Then `refresh()` and `goBack()`.
- Unchanged: drag-in (018) and drag-out (019) keep working.

### 3. i18n and error handling
- New keys in en/es: `list_collection_label`, `list_collection_none`, `list_collection_picker_title`.
- The move runs under the existing `ERROR_SCOPE.moveList`; failures surface via the existing error path.

---

## Non-functional requirements

- **TypeScript strict**, no `any`; theme tokens + `fs()`; accessibility labels on the picker row and modal.
- **Tests**: Edit List renders the current collection selection; picking a collection + Save calls `moveToCollection`; picking *Standalone* + Save calls `removeFromCollection`; save updates name/icon/color and refreshes + goes back; drag flows (018/019) tests stay green. `npm run test:all` green.
- **Verification**: web loop at 375px (move a standalone list into a collection via Edit List, move it between collections, return it to Standalone, confirm ordering parity with drag).

---

## Acceptance criteria

- [ ] Edit List shows a *Collection* selector row that opens a picker with all collections and a *Standalone / No collection* option.
- [ ] The current collection is highlighted as selected; moving to the same collection is a no-op.
- [ ] Saving with a new collection calls `moveToCollection`; saving *Standalone* calls `removeFromCollection`.
- [ ] The moved list appears at the end of its destination (parity with drag), and drag-in/drag-out still work.
- [ ] New labels exist in en and es.
- [ ] `npm run test:all` passes.