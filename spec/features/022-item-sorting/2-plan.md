# 022 — Item sorting: Plan

## Architecture

```
ListDetailScreen
├── local state: sort: ItemSort (default { key: 'manual', direction: 'asc' }) + sortModalVisible
├── displayItems = sortActive ? sortItems(filteredItems, sort) : useDragOrder(filteredItems).display
├── Sortable.Grid sortEnabled = !selectMode && query === '' && items.length > 1 && !sortActive
├── sort pill row (own row above the batch toolbar, same visibility)
└── OptionPickerModal (5 one-tap radio options: Manual / Name ↑ / Name ↓ / Created ↑ / Created ↓)
```

## Data model

- SCHEMA_VERSION 6 → 7. New `items.updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))` (DDL in `001_initial.ts`, Drizzle column, Zod `z.string()`, `Item` type; `NewItem` omits it).
- Repos: `itemRepo` stamps `updated_at: dbTimestamp()` on update/toggle/setAllChecked/reorder and returns it on create; reads stay ordered by `position` (sorting is app-layer in `sortItems`).
- Backup: `updated_at` column in the items INSERT and snapshot rows; `backupItemSchema = itemSchema.extend({ updated_at: z.string().optional() }).transform(... => updated_at ?? created_at)` so schema-6 backups import.

## Components

| Component | Location | Change |
|-----------|----------|--------|
| `itemSort.ts` | `src/utils/itemSort.ts` | **New** pure `ItemSort` model + `sortItems` (stable, case-insensitive numeric-aware name, lexicographic created) |
| `itemRepo.ts` | `src/database/repositories/itemRepo.ts` | Stamp `updated_at` on create/update/toggle/setAllChecked/reorder; `create` returns it |
| `database.ts` | `src/database/database.ts` | `SCHEMA_VERSION` 6 → 7 |
| `backup.ts` | `src/database/backup.ts` | `updated_at` on items export/import; lenient `backupItemSchema` default `created_at` |
| `ListDetailScreen.tsx` | `src/screens/ListDetailScreen.tsx` | Sort state + `sortItems` display wiring; `sortEnabled` gate; sort pill row above the batch toolbar; `OptionPickerModal` |
| i18n | `src/i18n/en.ts`, `es.ts` | **New** `item_sort`, `item_sort_manual`, `item_sort_name`, `item_sort_created`, `item_sort_asc`, `item_sort_desc` |

## Data flow

- Default Manual → `useDragOrder` display (unchanged UX). Pick Name/Created → `sortItems(filteredItems, sort)` feeds the grid, drag off. Search keeps the sort on the filtered window; leaving search/screen restores/clears the pill; leaving the screen drops the local state (next visit starts Manual).

## Risks / notes

- `useDragOrder` keeps its own local order state — it is bypassed (not the display source) while a non-manual sort is active, so drag state never leaks into sorted views.
- `localeCompare` with `numeric: true` makes "Item 2" precede "Item 10"; `sensitivity: 'base'` makes it case-insensitive.
- Tie-breaks return 0 so the underlying stable sort keeps manual (position) order for equal keys.
- Item select mode passes no sort concerns; the pill shares the batch row's visibility condition (`items.length > 0 && !selectMode && !searchActive`).