# 023 — Copy lists: Tasks

- [ ] Create `spec/features/023-copy-lists/` (1-spec, 2-plan, 3-tasks).
- [ ] Repo: `itemRepo.duplicateItems(sourceListId, targetListId)` (transaction, position-order append, full fidelity incl. pictures, fresh timestamps).
- [ ] Repo: `listRepo.duplicate(id, overrides)` — create + copy items in one transaction.
- [ ] Cache: pic-agnostic, photos shared by reference (no re-import).
- [ ] New `src/components/ListPickerModal.tsx` (ModalShell + footer + scrollable rows, `excludeListId`).
- [ ] `CreateListScreen`: optional `duplicateFromListId` route param — prefilled `<Name> copy` draft, Save duplicates in one tx and navigates to the new list.
- [ ] `EditListScreen`: *Duplicate list* button → draft.
- [ ] `ListDetailScreen`: third header copy-to-list action (hidden when empty) + `ListPickerModal` + "Copied to <Target>" feedback.
- [ ] i18n en/es: `list_duplicate`, `list_copy_to`, `list_copied_to`, `list_picker_title`.
- [ ] `errors.ts`: `ERROR_SCOPE.duplicateList`, `copyItemsToList`.
- [ ] Tests: `duplicateItems` (fidelity, append positions, timestamps, photos shared, tx), draft flow (prefill/suffix, save-copies-navigate, cancel-copies-nothing), copy flow (picker excludes source, append, feedback). `npm run test:all` green.
- [ ] Docs: roadmap 023 (entry + status), `docs/harnesses.md` suite baseline refreshed, changelog entry.
- [ ] Verification loop at 375px + acceptance criteria flipped `[x]`.