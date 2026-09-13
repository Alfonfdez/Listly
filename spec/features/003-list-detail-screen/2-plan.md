# 003 — List detail screen: Plan

## Architecture

```
HomeStack
└── ListDetailScreen (route param { listId })
    ├── Header (icon + name + progress bar) — inside ScreenShell
    ├── FlatList of ItemRow (ordered by position)
    ├── EmptyState (when no items)
    └── bottom inline add input + ItemFormModal (edit)
```

Data comes from `AppContext` (`lists` for the list row, `itemsByListId` for items). Mutations hit `itemRepo` directly and then `AppContext.refresh()`.

## Components

| Component | Location | Responsibility |
|-----------|----------|----------------|
| `ListDetailScreen` | `src/screens/ListDetailScreen.tsx` | Resolves list + items by `listId`, header progress, list + add input, opens edit modal |
| `ItemRow` | `src/components/ItemRow.tsx` | Checkbox toggle (row press), name (strikethrough when done), note indicator, trailing edit button → edit |
| `ItemFormModal` | `src/components/ItemFormModal.tsx` | Name + note fields, Save/Cancel, live validation messages, delete-with-confirm |

## Utils

| File | Responsibility |
|------|----------------|
| `utils/validation.ts` | `validateItemName(value, existingNames, maxLength)` → error message key or `null`; `uniqueNormalizedNames` (trim + lowercase) |

## Context

- `AppContext`: read `lists` + `itemsByListId`; mutation refresh via `refresh()`.
- `ConfigContext`: `activeColors`, `fs()`.

## Repositories

- `itemRepo.toggle(id)` — checkbox flip.
- `itemRepo.create({ list_id, name, note, checked, position })` — add (position = max + 1).
- `itemRepo.update(id, { name?, note? })` — edit.
- `itemRepo.delete(id)` — remove (called after confirm).
- Duplicate names are validated against the in-memory items (already loaded) — no repo round-trip.

## Data flow

1. Screen opens with `listId` → resolves list from `AppContext.lists`, items from `itemsByListId.get(listId)` (already sorted by position via repo `listByList`/`listAll`).
2. Focus → `refresh()` reloads silently.
3. Toggle/add/edit/delete → `itemRepo` write → `refresh()` → progress + rows update.

## Navigation types

- `ListDetailScreen` uses `RootStackParamList['ListDetail'] = { listId: number }` (`useRoute` + `useNavigation` typed via `NavigationProp<'ListDetail'>`).

## Risks / notes

- Focus the input accessibility on web; keyboard `returnKeyType="done"` submits.
- On edit, the current item is excluded from the duplicate-name set.
- Progress uses `home_progress(n, total)` (reused from feature 001).