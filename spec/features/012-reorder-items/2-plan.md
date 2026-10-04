# 012 — Reorder items: Plan

## Architecture

```
ListDetailScreen
└── Sortable.Grid (1 column) of ItemRow
    └── onDragEnd → useDragOrder → itemRepo.reorder(listId, orderedIds) → refresh
```

Item reordering mirrors the lists reorder pattern (feature 009): a sortable container with long-press drag, write-through persistence, and the same guards.

## Data model

- No schema change (uses the existing `items.position`).
- New `itemRepo.reorder(listId: number, orderedIds: number[])`: one transaction, `position` assigned in order, scoped to `listId` — never touches items in other lists.

## Components

| Component | Location | Change |
|-----------|----------|--------|
| `ItemRow` | `src/components/ItemRow.tsx` | Wrapped in `SortablePressable` (drag via long-press); long-press no longer enters select mode |
| `ListDetailScreen` | `src/screens/ListDetailScreen.tsx` | `Sortable.Grid` (1 column) + `useDragOrder` + `sortEnabled` guard |
| `useDragOrder` | `src/hooks/useDragOrder.ts` | Shared guard + reorder no-op-if-unchanged |

## Data flow

- `sortEnabled = !selectMode && query === '' && items.length > 1`.
- Long-press → drag; release → `itemRepo.reorder(listId, orderedIds)` → `refresh()`.

## Risks / notes

- Read path (`itemRepo.listAll`) must `ORDER BY position, id` so a dragged order survives re-reads (reload / navigate away and back).
- Long-press is drag-only; item select mode stays behind the header select toggle (010).
