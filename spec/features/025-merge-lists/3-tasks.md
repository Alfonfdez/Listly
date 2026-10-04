# 025 — Merge lists: Tasks

- [ ] Create `spec/features/025-merge-lists/` (1-spec, 2-plan, 3-tasks).
- [ ] Repo: `itemRepo.mergeInto(sourceListId, targetListId)` — transactional: append full-fidelity copies of the source's items to the target (per 023 `duplicateItems`), then delete the source with photo cleanup; rollback on error.
- [ ] `ListDetailScreen`: *Merge into…* action (hidden when list empty / during search or select) + `ListPickerModal` (excludes self, empty state when no other lists) + destructive `ConfirmModal` with item count and target name.
- [ ] After confirm: merge → `refresh()` → navigate to target ListDetail + "Merged into <Target>" feedback.
- [ ] i18n en/es: `list_merge_into`, `list_merge_confirm_title`, `list_merge_confirm_message`, `list_merged`.
- [ ] `errors.ts`: `ERROR_SCOPE.mergeLists`.
- [ ] Tests: `mergeInto` (fidelity, append positions, source deleted, photo cleanup, rollback on failure), guards (self-merge impossible, empty-source no action), flow (picker excludes self, confirm text, navigation + toast, cancel changes nothing). `npm run test:all` green.
- [ ] Docs: roadmap 025 (entry + status), `docs/harnesses.md` suite baseline refreshed, changelog entry.
- [ ] Verification loop at 375px + acceptance criteria flipped `[x]`.