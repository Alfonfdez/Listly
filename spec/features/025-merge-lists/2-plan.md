# 025 — Merge lists: Plan

## Architecture

```
ListDetailScreen ──Merge into…──▶ ListPickerModal (excludes self)
                                   onSelect: ConfirmModal (destructive, "N items → Target")
                                   onConfirm: itemRepo.mergeInto(sourceId, targetId)
                                              refresh → navigate(ListDetail, target) + toast
```

- Reuses the shared `ListPickerModal` from feature 023.
- Uses the existing destructive `ConfirmModal` pattern used by delete flows.

## Data model

- No schema change (`SCHEMA_VERSION` stays 7) and no backup change.
- New `itemRepo.mergeInto(sourceListId, targetListId)` — `withTransaction`:
  1. copy source items into the target (same fidelity/append logic as `023 duplicateItems`, including photo references),
  2. delete the source list + its original item rows with photo cleanup (`listRepo.delete(sourceId)` / existing photo-cleanup helper) inside the same tx.
- Failure anywhere rolls back the whole merge (both lists untouched).

## Components

| Component | Location | Change |
|-----------|----------|--------|
| `itemRepo.ts` | `src/database/repositories/itemRepo.ts` | **New** `mergeInto(sourceId, targetId)` (reuses `duplicateItems` internals) |
| `ListDetailScreen.tsx` | `src/screens/ListDetailScreen.tsx` | *Merge into…* action + `ListPickerModal` + `ConfirmModal` + navigate+toast |
| `ListPickerModal.tsx` | `src/components/ListPickerModal.tsx` | Reused (feature 023) — supports empty state |
| i18n | `src/i18n/en.ts`, `es.ts` | **New** `list_merge_into`, `list_merge_confirm_title`, `list_merge_confirm_message`, `list_merged` |
| `errors.ts` | `src/utils/errors.ts` | **New** `ERROR_SCOPE.mergeLists` |

## Data flow

- Pick target → `ConfirmModal` → `await itemRepo.mergeInto(sourceId, targetId)` → `await refresh()` → `navigation.navigate('ListDetail', { listId: targetId })` → transient "Merged into <Target>" label.
- Cancel at any step leaves state untouched.
- Failure: `runSafely`/`catch` + `logError` under `ERROR_SCOPE.mergeLists`, stay on the source list (still exists), existing error toast.

## Risks / notes

- The source must be read before the delete inside the same transaction; reuse the exact selection/insert logic from `duplicateItems` so fidelity and append-positions stay consistent.
- Photo cleanup runs on the deleted source's item rows (must not touch the copied target rows, which share blobs).
- `MAX(position)` of the target must be sampled inside the transaction to avoid duplicate positions under concurrent edits.
- The action's visibility mirrors the copy buttons' empty-list condition; hide it in search/select modes.