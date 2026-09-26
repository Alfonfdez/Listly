# 025 — Merge lists

- **Objective**
  Let the user merge one list into another: the source's items are appended to the target list and the source list is deleted.

---

## Functional requirements

### 1. Merge action
- List detail shows a *Merge into…* action only when the list has items (and it stays inert during search/select modes).
- Tapping it opens a list picker modal listing every other list (the source is excluded). If no other list exists, the picker shows an empty/info state.
- Selecting a target opens a destructive confirmation: "Merge N items into <Target> and delete <Source>?".
- Confirming merges and takes the user to the target list with a *Merged into <Target>* toast.

### 2. Merge semantics
- The source's items are appended at the end of the target in source `position` order, with full fidelity: `name`, `note`, `checked` state, and `pictures` (photo blobs shared, not re-imported).
- The merge applies the same name-dedupe rule as 023: a source item whose name (case-insensitive) already exists in the target is skipped, and the target's matching item is never modified. Consequence for merge: note/photos carried only by a skipped source item are lost with the source's deletion.
- The source list is then deleted inside the same transaction (including its item rows and photo cleanup).
- Cancelling the confirmation or the picker changes nothing.

### 3. Guards
- Merging a list into itself is impossible (the source is excluded from the picker).
- An empty source list shows no *Merge into…* action (nothing to merge).
- The operation fails safely if either list no longer exists.

### 4. i18n and error handling
- New keys in en/es: `list_merge_into`, `list_merge_confirm_title`, `list_merge_confirm_message`, `list_merged`.
- The merge runs under a new `ERROR_SCOPE.mergeLists`; failures surface via the existing error path and leave both lists untouched (transaction).

---

## Non-functional requirements

- **TypeScript strict**, no `any`; theme tokens + `fs()`; accessibility labels on the action, picker, and confirmation.
- **Tests**: `itemRepo.mergeInto` (fidelity, append positions, source deleted, photo cleanup, rollback); guards (source ≠ target, empty source no action); flow (picker excludes self, confirmation, navigation + toast). `npm run test:all` green.
- **Verification**: web loop at 375px (merge list B into list A: confirm appends B's items in order with checked state, B disappears, user lands on A with the toast; cancel changes nothing).

---

## Acceptance criteria

- [ ] List detail shows a *Merge into…* action only when the list has items.
- [ ] The picker lists other lists, excludes the source, and lets the user pick a target.
- [ ] The confirmation states the item count and the target name, with Cancel and Merge.
- [ ] Confirming appends the source's items (name, note, checked, pictures) to the target in source order and deletes the source list in one transaction.
- [ ] Photo blobs are shared, not re-imported; source item photos are cleaned up.
- [ ] After merging, the app navigates to the target with a *Merged into <Target>* toast.
- [ ] Cancelling the picker or confirmation changes nothing.
- [ ] New labels exist in en and es.
- [ ] `npm run test:all` passes.