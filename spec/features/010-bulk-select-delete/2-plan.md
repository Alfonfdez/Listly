# 010 — Bulk select/delete + header search: Plan

## Architecture

```
HomeScreen / ListsScreen / ListDetailScreen
├── headerRight → SelectSearchHeader (select toggle + search toggle)
└── ListsView (Home/Lists) / ListDetailScreen (items)
    ├── useSelectMode (enter/toggle/exit, delete-confirm, confirmDelete → deleteMany)
    ├── SelectionActionBar (count + cancel + delete) in select mode
    └── ConfirmModal (bulk delete confirmation)
```

Select mode is entered via the header select toggle (long-press is reserved for drag-reorder). Search is toggled from the header; the inline `SearchBar` stays below the header inside `ListsView`.

## Data model

- No schema change. New `listRepo.deleteMany(ids: number[])` and `itemRepo.deleteMany(ids: number[])` — each deletes in a single transaction, no-op on empty.

## Components

| Component | Location | Change |
|-----------|----------|--------|
| `useSelectMode` | `src/hooks/useSelectMode.ts` | **New** — select state + delete-confirm + `deleteMany` |
| `SelectToggleButton` | `src/components/SelectToggleButton.tsx` | **New** — `checkbox-outline` / `close-outline` |
| `SelectSearchHeader` | `src/components/SelectSearchHeader.tsx` | **New** — select + search toggles |
| `SelectionActionBar` | `src/components/SelectionActionBar.tsx` | **New** — count + cancel + delete |
| `ConfirmModal` | `src/components/ConfirmModal.tsx` | **New** — ModalShell + ModalFooter confirm |
| `ListsView` | `src/components/ListsView.tsx` | External search/select state; FAB hidden + action bar in select mode; sort disabled in select/search |
| `ListCard` / `ListRow` | `src/components/` | Select-mode props (highlight + corner check) |
| `ItemRow` | `src/components/ItemRow.tsx` | Select-mode props; hides edit button in select mode |

## Navigation

- Home and Lists set `headerRight` via `navigation.setOptions` (search toggle tinted when active, cleared in select mode). `ListDetailScreen` sets a `SelectSearchHeader` gated on `items.length > 0`.

## i18n

New keys en/es: `common_search`, `common_no_results`, `select_selected`, `select_delete`, `select_enter_mode`, `select_exit_mode`, `select_delete_lists_confirm`/`select_delete_lists_message`, `select_delete_items_confirm`/`select_delete_items_message`, `item_search_placeholder`.

## Data flow

- Select toggle → `toggleSelectMode`; tapping items/lists → `toggleItem`/`toggleCollection`.
- Delete button → `openDeleteConfirm` → `ConfirmModal` → `confirmDelete` → `deleteMany(ids)` → `refresh()` + `exitSelectMode`.
- Search filters lists by name + item names; items by name/note (`filterItemsByQuery`).

## Risks / notes

- Long-press is reserved for drag-reorder (sortable activation), so select mode must only be entered via the header toggle.
- Keep list icons visible during select mode (corner check badge, not icon replacement).
- `react-native-sortables` long-press vs select-mode must not conflict.
