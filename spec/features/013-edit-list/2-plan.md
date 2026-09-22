# 013 — Edit list: Plan

## Architecture

```
ListDetailScreen header block → pencil → EditList: { listId }
CreateListScreen ─┐
                  ├─> ListForm (shared name/icon/color form + debounced duplicate)
EditListScreen  ──┘
```

A single `ListForm` is extracted from `CreateListScreen` and reused by the new `EditListScreen`, so create and edit share one implementation.

## Data model

- No schema change. Reuses `listRepo.update(id, { name, icon, color })` and `listRepo.existsByName(name, excludeId?)` (excludes the edited list from the duplicate check).

## Components

| Component | Location | Change |
|-----------|----------|--------|
| `ListForm` | `src/components/ListForm.tsx` | **New** — name input + counter, icon grid, color grid + picker, debounced duplicate validation, submit; optional outlined-red delete button (`deleteLabel`/`onDelete`) |
| `CreateListScreen` | `src/screens/CreateListScreen.tsx` | Thin wrapper over `ListForm` (behavior unchanged) |
| `EditListScreen` | `src/screens/EditListScreen.tsx` | **New** — pre-filled `ListForm`; save via `listRepo.update`; delete button → confirm → `listRepo.delete` |
| `ListDetailScreen` | `src/screens/ListDetailScreen.tsx` | Pencil button in header row → `EditList` (delete no longer in header) |

## Navigation

- `RootStackParamList` gains `EditList: { listId: number }`; registered in `AppNavigator` (title `edit_list_title`, `create-outline` icon).
- The pencil sits at the right of the list header block; always available, independent of item select/search modes.

## i18n

New keys en/es: `edit_list_title`, `list_edit_label`, `list_save`. Field labels reuse `list_name_label` / `list_color_label` / `list_icon_label`; validation reuses `list_name_required` / `list_name_duplicate` / `list_name_max`.

## Data flow

- `EditListScreen` finds the list, pre-fills name/icon/color, passes `listId` as `excludeId`; save → `listRepo.update` → `refresh()` → `goBack()`. Delete → confirm → `listRepo.delete` → `refresh()` → `popToTop()`. Missing id renders the not-found empty state.

## Risks / notes

- No in-screen heading (nav header shows "Edit list"); labels use `textStyles.sectionTitle`.
- Keep `CreateListScreen` tests green after the shared-form extraction.
