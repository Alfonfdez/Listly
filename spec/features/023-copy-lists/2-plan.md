# 023 — Copy lists: Plan

## Architecture

```
EditListScreen ──Duplicate list──▶ CreateListScreen (duplicateFromListId)
                                  prefilled: name "<Name> copy", same icon/color
                                  on Save: listRepo.create + itemRepo.duplicateItems (one tx)
ListDetailScreen ──third header action──▶ ListPickerModal (excludes current list)
                                          onSelect: itemRepo.duplicateItems(source, target)
```

- Draft = the existing `CreateListScreen` extended with an optional `duplicateFromListId` route param.
- `ListPickerModal` is a new shared component (ModalShell + footer + scrollable rows) also reused by feature 025.

## Data model

- No schema change (`SCHEMA_VERSION` stays 7) and no backup change.
- New `itemRepo.duplicateItems(sourceListId, targetListId)` — `withTransaction`: select source items ordered by `position`, insert copies into the target with `position = base + i` (`base = MAX(position)` of target), copying `name`/`note`/`checked`/`pictures` verbatim and stamping fresh `created_at`/`updated_at`.
- Duplicate-a-list helper: `listRepo.create(...)` + `duplicateItems(...)` inside one transaction (photos shared, not re-imported).

## Components

| Component | Location | Change |
|-----------|----------|--------|
| `itemRepo.ts` | `src/database/repositories/itemRepo.ts` | **New** `duplicateItems(sourceId, targetId)` |
| `listRepo.ts` | `src/database/repositories/listRepo.ts` | **New** `duplicate(id, overrides)` (create + copy items in one tx) |
| `ListPickerModal.tsx` | `src/components/ListPickerModal.tsx` | **New** shared picker (excludes `excludeListId`) |
| `CreateListScreen.tsx` | `src/screens/CreateListScreen.tsx` | Optional `duplicateFromListId` param: prefilled draft; Save duplicates in one tx and navigates to the new list |
| `EditListScreen.tsx` | `src/screens/EditListScreen.tsx` | *Duplicate list* button → navigate to the draft |
| `ListDetailScreen.tsx` | `src/screens/ListDetailScreen.tsx` | Third header copy action + `ListPickerModal` + feedback |
| i18n | `src/i18n/en.ts`, `es.ts` | **New** `list_duplicate`, `list_copy_to`, `list_copied_to`, `list_picker_title` |
| `errors.ts` | `src/utils/errors.ts` | **New** `ERROR_SCOPE.duplicateList`, `copyItemsToList` |

## Data flow

- Duplicate draft Save: `transaction { listRepo.create(...); itemRepo.duplicateItems(sourceId, newId) }` → `refresh()` → `navigation.navigate('ListDetail', { listId: newId })`.
- Copy-items: pick target → `itemRepo.duplicateItems(sourceId, targetId)` → `refresh()` → transient "Copied to <Target>" label (mirrors the existing copy-button feedback, `COPY_FEEDBACK_MS`).

## Risks / notes

- `duplicateItems` must read the source in `position` order and append after `MAX(target.position)` to preserve relative order (mirrors `moveToCollection`'s append semantics).
- Target with no items: base = `0`.
- Keep the copy/duplicate failure path identical to feature 017 (copy buttons) — `runSafely`/`catch` + `logError` + refresh.
- The third header icon must stay hidden when the list is empty (same condition as the existing copy buttons), and be inert during search/select modes.