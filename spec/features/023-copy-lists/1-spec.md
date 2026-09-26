# 023 — Copy lists

- **Objective**
  Let the user duplicate data inside the app, beyond the clipboard copy (feature 017): (1) spawn an editable draft of an existing list (a new list pre-filled with the source's name/icon/color and a full copy of its items), and (2) copy the items of one list into another existing list.

---

## Functional requirements

### 1. Duplicate a list as an editable draft
- The List detail header's pencil opens Edit List; Edit List gains a *Duplicate list* button.
- Tapping it opens the create-list flow pre-filled with the source list: name `"<Name> copy"`, same icon and color — an editable draft.
- On Save, the new list is created with that name/icon/color and a full copy of the source's items (see §3), then the user is taken to the new list.
- Items are not (re)copied if the draft is cancelled.

### 2. Copy items into another list
- List detail shows a third compact header action next to *Copy names* / *Copy all* (shown only when the list has items).
- Tapping it opens a list picker modal listing every other list (the source is excluded).
- Selecting a target appends a full copy of the source's items to the target and shows transient feedback ("Copied to <Target>").

### 3. Copy fidelity
- Same behavior for both duplicate-list and copy-items: every source item is appended in source `position` order at the end of the target list.
- Preserved per item: `name`, `note`, `checked` state, and `pictures`.
- New rows get fresh `created_at` / `updated_at` and their own `id`s; `position` continues from the target's current `MAX(position) + 1`.
- Duplicates are allowed in the target (no dedupe).
- Photo blobs are shared, not duplicated (no filesystem copies).

### 4. i18n and error handling
- New keys in en/es: `list_duplicate`, `list_copy_to`, `list_copied_to`, `list_picker_title`, destination picker hint.
- Copy/duplicate run under `ERROR_SCOPE.duplicateList` / `ERROR_SCOPE.copyItemsToList`; failures surface via the existing toast/error path.

---

## Non-functional requirements

- **TypeScript strict**, no `any`; theme tokens + `fs()`; accessibility labels on the new button/picker rows.
- **Tests**: `itemRepo.duplicateItems` (fidelity, append positions, fresh timestamps, photo sharing, transaction); draft flow (prefill + `"<Name> copy"` suffix, Save creates list + copies items, navigate, Cancel copies nothing); copy-to-list flow (picker excludes the source list, append, feedback label). `npm run test:all` green.
- **Verification**: web loop at 375px (duplicate a list, edit the draft name/icon/color, save, land on the new populated list; copy a list's items into another list and confirm the append order/checked state; compact third icon hidden on an empty list).

---

## Acceptance criteria

- [ ] Edit List shows a *Duplicate list* button that opens a pre-filled create draft (`"<Name> copy"`, same icon/color).
- [ ] Saving the draft creates the new list and copies the source's items (name, note, checked, pictures) appended in source order.
- [ ] Cancelling the draft creates nothing.
- [ ] List detail shows a third copy-to-list action only when the list has items.
- [ ] The list picker lists other lists, excludes the source, and appends the items to the chosen target.
- [ ] Copies preserve checked state and pictures; duplicates are allowed; photos are shared, not re-imported.
- [ ] "Copied to <Target>" feedback appears after a copy; new labels exist in en and es.
- [ ] `npm run test:all` passes.