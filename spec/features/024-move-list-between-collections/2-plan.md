# 024 — Move list between collections: Plan

## Architecture

```
EditListScreen
├── local state: collectionId (initialized from list.collection_id)
├── ListForm (name / icon / color, unchanged)
├── Collection selector row (between form and Save) ──▶ CollectionPickerModal
│      options: every collection + "Standalone / No collection"
└── Save: listRepo.update(...) + moveToCollection | removeFromCollection (if changed)
```

- The picker is a new shared `CollectionPickerModal` (ModalShell + footer + scrollable rows), sibling of `ListPickerModal` (feature 023).

## Data model

- No schema, backup, or migration change (`SCHEMA_VERSION` 7).
- No repo change: reuse `listRepo.moveToCollection(listId, collectionId)` (append at the collection's end, transactional) and `listRepo.removeFromCollection(listId)` (append at the end of the standalone lists).
- `listRepo.update` keeps its current signature (it intentionally omits `collection_id`); the picker value is applied through move/remove, not `update`.

## Components

| Component | Location | Change |
|-----------|----------|--------|
| `CollectionPickerModal.tsx` | `src/components/CollectionPickerModal.tsx` | **New** shared picker (collections + standalone footer option) |
| `EditListScreen.tsx` | `src/screens/EditListScreen.tsx` | Collection row + picker state; Save applies move/remove when changed |
| i18n | `src/i18n/en.ts`, `es.ts` | **New** `list_collection_label`, `list_collection_none`, `list_collection_picker_title` |

## Data flow

- Open Edit List → `collectionId` = `list.collection_id`. Change picker → update local state only.
- Save: `await listRepo.update(...)`; then if `collectionId` changed with respect to the initial value: target defined → `moveToCollection`, null → `removeFromCollection`; `await refresh()`, `navigation.goBack()`.
- Failure of the move logs under `ERROR_SCOPE.moveList` and keeps the user on the screen (existing edit-screen error pattern).

## Risks / notes

- The picker needs the full collections list + the list's own `collection_id`; both come from `useApp()` (`collections`, `lists`).
- Moving to the same collection must be a no-op (compare against the initial value, not just "is defined"), or `moveToCollection` would re-append and reorder the list.
- Selecting *Standalone* must trigger `removeFromCollection`, not `moveToCollection` with a null target.
- The collection selector row must remain visible even when there are no collections (shows only the *Standalone* option), mirroring how a list without a collection is displayed today.