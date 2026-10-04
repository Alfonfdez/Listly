# 025 — Merge lists: Plan

## Architecture

```
ListDetailScreen ──Merge into… (batch-row tile)──▶ ListPickerModal (excludes self, empty state)
                                                    onSelect: ConfirmModal (destructive, "N items → Target")
                                                    onConfirm: itemRepo.mergeInto(sourceId, targetId)
                                                               refresh → navigation.replace(ListDetail, target, notice) + transient toast
```

- Reuses the shared `ListPickerModal` from feature 023 (adds `emptyLabel` prop for merge wording).
- Uses the existing destructive `ConfirmModal` pattern used by delete flows.
- *Merge into…* action is a 4th tile in the batch row (Complete all / Clear completed group); the row hides during search/select modes and when the list is empty, satisfying "visible only when the list has items (inert during search/select)".
- After the merge the source screen is replaced with the target's ListDetail (`navigation.replace`) so back navigation never lands on the deleted list's NotFound screen; the target reads a route `notice` param and shows a transient `list_merged(list.name)` label under the header, cleared after `COPY_FEEDBACK_MS`.

## Data model

- No schema change (`SCHEMA_VERSION` stays 7) and no backup change.
- New `itemRepo.mergeInto(sourceListId, targetListId)` — `withTransaction`:
  1. reject `sourceListId === targetListId` (self-merge),
  2. `copyItemsInto(db, source, target)` (returns the copied source item ids) — appends in source `position` order with full fidelity (name/note/checked/pictures by reference),
  3. delete the photos of the source items that were **skipped by the dedupe rule** only (orphaned files); the copied items' photos stay referenced by the target rows and must not be cleaned,
  4. `db.delete(lists).where(id = source)` — `ON DELETE CASCADE` (FK in `001_initial.ts`, `foreign_keys = ON` on both engines) removes the source item rows.
- Missing target → FK violation inside the tx → rollback (source untouched). Empty source → no-op.
- `copyItemsInto` return type changes `void` → `Promise<number[]>`; existing callers (`duplicateItems`, `listRepo.duplicate`) ignore the result.

## Components

| Component | Location | Change |
|-----------|----------|--------|
| `itemRepo.ts` | `src/database/repositories/itemRepo.ts` | **New** `mergeInto(sourceId, targetId)` (reuses `copyItemsInto`) |
| `ListDetailScreen.tsx` | `src/screens/ListDetailScreen.tsx` | *Merge into…* batch tile + `ListPickerModal` + `ConfirmModal` + replace+notice toast |
| `ListPickerModal.tsx` | `src/components/ListPickerModal.tsx` | Add optional `emptyLabel` prop (defaults to `list_picker_empty`) |
| `types.ts` | `src/constants/types.ts` | `ListDetail` params gain optional `notice?: 'merged'`; new `MERGE_NOTICE` const |
| i18n | `src/i18n/en.ts`, `es.ts` | **New** `list_merge_into`, `list_merge_confirm`, `list_merge_confirm_title`, `list_merge_confirm_message`, `list_merged`, `list_merge_empty` |
| `errors.ts` | `src/utils/errors.ts` | **New** `ERROR_SCOPE.mergeLists` |

## Data flow

- Pick target → `ConfirmModal` → `await itemRepo.mergeInto(sourceId, targetId)` → `await refresh()` → `navigation.replace('ListDetail', { listId: targetId, notice: 'merged' })` → target shows transient "Merged into <Target>" label.
- Cancel at any step leaves state untouched.
- Failure: `catch` + `logError` under `ERROR_SCOPE.mergeLists`, stay on the source list (still exists), existing error toast.

## Risks / notes

- The source must be read before the delete inside the same transaction; reuse the exact selection/insert logic from `copyItemsInto` so fidelity and append-positions stay consistent.
- Photo cleanup runs on the deleted source's item rows but **only for items the dedupe rule skipped** — copied items share photo URIs with the target rows, so cleaning them would break the merged pictures.
- `MAX(position)` of the target must be sampled inside the transaction to avoid duplicate positions under concurrent edits.
- The action's visibility mirrors the copy buttons' empty-list condition; hide it in search/select modes.