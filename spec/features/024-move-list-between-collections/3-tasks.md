# 024 — Move list between collections: Tasks

- [ ] Create `spec/features/024-move-list-between-collections/` (1-spec, 2-plan, 3-tasks).
- [ ] New `src/components/CollectionPickerModal.tsx` (ModalShell + footer + scrollable rows; collections + *Standalone / No collection* footer option; current selection checked).
- [ ] `EditListScreen`: *Collection* selector row (initialized from `list.collection_id`, between form and Save); Save applies `moveToCollection` / `removeFromCollection` only when the selection changed (no-op for same collection / standalone unchanged).
- [ ] i18n en/es: `list_collection_label`, `list_collection_none`, `list_collection_picker_title`.
- [ ] Reuse `ERROR_SCOPE.moveList` for the move error path.
- [ ] Tests: current selection rendered; pick a collection + Save → `moveToCollection` (repo mock); pick *Standalone* + Save → `removeFromCollection`; same-collection save is a no-op; name/icon/color still update; drag-in/drag-out tests stay green. `npm run test:all` green.
- [ ] Docs: roadmap 024 (entry + status), `docs/harnesses.md` suite baseline refreshed, changelog entry.
- [ ] Verification loop at 375px + acceptance criteria flipped `[x]`.