# 018 — Drag a list into a collection: Plan

## Architecture

```
ListsView (mode home)
├── Sortable.MultiZoneProvider            <- portal so the dragged list floats over both sections
│   ├── Collections grid (Sortable.Grid)
│   │   └── per collection: Sortable.BaseZone(minActivationDistance=8)
│   │       ├── onItemEnter -> handleZoneEnter(id)   (guarded by draggingListRef)
│   │       ├── onItemLeave -> handleZoneLeave()
│   │       └── onItemDrop  -> handleZoneDrop(id)
│   │       └── CollectionCard / CollectionRow dropTarget={hoverCollectionId === item.id}
│   └── Lists grid (Sortable.Grid, standalone lists only)
│       └── onDragStart -> handleListsDragStart  (sets draggingListRef + clears hover)
└── state: hoverCollectionId; refs: draggingListRef, zoneDropHandledRef
```

## Data model

- No schema change. `moveToCollection` reuses `lists.collection_id` + the per-scope `lists.position`.

## Components

| Component | Location | Change |
|-----------|----------|--------|
| `listRepo.ts` | `src/database/repositories/listRepo.ts` | **New** `moveToCollection(listId, collectionId)` — transactional append-at-end |
| `ListsView` | `src/components/ListsView.tsx` | `MultiZoneProvider` wrapper, `BaseZone` per collection, drag tracking refs + zone handlers |
| `CollectionCard` / `CollectionRow` | `src/components/CollectionCard.tsx` / `CollectionRow.tsx` | New `dropTarget` prop (accent border + tint) + `accessibilityHint` |

## Data flow

- Long-press a standalone list → lists grid `onDragStart` records the id in `draggingListRef`.
- Drag over a collection → zone `onItemEnter` sets `hoverCollectionId` → card highlights + hint.
- Release over the collection → `onItemDrop` → `listRepo.moveToCollection(listId, collectionId)` → `refresh()`; `zoneDropHandledRef` makes the grids' `useDragOrder` skip `reorder` for that drag.
- Leave without dropping → `onItemLeave` clears the highlight; normal grid reorder happens.

## Risks / notes

- Must NOT clear `draggingListRef` on the lists grid `onDragEnd`: the zone's `onItemDrop` (runOnJS via animated reaction) can land after the grid's `onDragEnd`, which would make the drop a no-op. A stale ref without an active gesture is harmless (all zone events only fire during a drag).
- Collection-drag `onDragStart` resets `draggingListRef` so reordering collections can't drop lists.
- Zone handlers run on the JS thread (`onItemDrop` fired through the animated reaction) so `setState`/repo calls are safe.
- `BaseZone` wraps the card as a plain `View`; the sortables `ItemCell` applies grid sizing/gestures around the item, so the wrap doesn't break dragging or layout.