# 019 — Remove a list from a collection: Plan

## Architecture

```
ListsView (mode collection-detail)
├── Sortable.MultiZoneProvider            <- portal so the dragged member floats over the grid + target
│   ├── members grid (Sortable.Grid)      <- onDragStart -> handleListsDragStart (sets draggingListRef,
│   │                                       setRemoveTargetActive(true)); onDragEnd -> handleListsDragEnd
│   │                                       (hides target, reorders unless drop handled)
│   └── RemoveFromCollectionTarget        <- Sortable.BaseZone pill above the FAB, always mounted
│       ├── onItemEnter -> handleRemoveZoneEnter(id)  (guarded by draggingListRef)
│       ├── onItemLeave -> handleRemoveZoneLeave()
│       └── onItemDrop  -> handleRemoveZoneDrop(id)
│           └── performZoneDrop(id => listRepo.removeFromCollection(id))
└── state: removeTargetActive, removeHover;
    refs: draggingListRef, zoneDropHandledRef, pendingMoveRef
```

## Data model

- No schema change. `removeFromCollection` reuses `lists.collection_id` + the per-scope `lists.position`
  (position = `nextPositionSql('position')` among rows with `collection_id IS NULL`, i.e. append at the end of Home's standalone lists).

## Components

| Component | Location | Change |
|-----------|----------|--------|
| `listRepo.ts` | `src/database/repositories/listRepo.ts` | **New** `removeFromCollection(listId)` — transactional `collection_id = NULL` + append-at-end position |
| `RemoveFromCollectionTarget` | `src/components/RemoveFromCollectionTarget.tsx` | **New** base-zone pill (icon `arrow-undo-outline` + `collection_remove_label`); hidden until active, highlight on hover, `accessibilityHint` while active |
| `useCollectionDropZones` | `src/hooks/useCollectionDropZones.ts` | **New** remove-target state/handlers (`removeTargetActive`, `removeHover`, `handleRemoveZoneEnter/Leave/Drop`) sharing `performZoneDrop` |
| `ListsView` | `src/components/ListsView.tsx` | Render the target in collection mode, wire the zone handlers, `performZoneDrop` branch, `sortEnabled >= 1` in collection mode so a lone member can be dragged |
| `icons.ts` / i18n | `src/constants/icons.ts`, `src/i18n/en.ts`, `es.ts` | `ICONS.removeFromCollection`, `collection_remove_label`, `collection_remove_hint` |

## Data flow

- Long-press a member list → members grid `onDragStart` records the id in `draggingListRef` and sets `removeTargetActive` (Collection detail only).
- Drag near the pill → zone `onItemEnter` (guarded by `draggingListRef`) sets `removeHover` → pill highlights (accent border `c.primary` + primary-tinted background).
- Release over the pill → `onItemDrop` → `handleRemoveZoneDrop` → `performZoneDrop` → `listRepo.removeFromCollection(listId)` + `refresh()`; `zoneDropHandledRef` / `pendingMoveRef` make `useDragOrder` skip the grid reorder for that drag.
- Leave without dropping → `onItemLeave` clears the highlight; normal reorder-within-collection happens.

## Risks / notes

- The target must stay mounted on Collection detail (its `measure()` must remain valid) but hidden (`opacity: 0`, `pointerEvents: none`, no `accessibilityHint`) until a member drag starts, so an inactive app never exposes it.
- Same ref-discipline as feature 018: `handleListsDragEnd` must NOT clear `draggingListRef` before the zone's `onItemDrop` (fired through the animated reaction) runs, or the drop becomes a no-op; a stale ref without an active gesture is harmless.
- All zone handlers run on the JS thread, so `setState`/repo calls are safe; `performZoneDrop` awaits the repo call through `pendingMoveRef` before refreshing.
- `sortEnabled` is `!selectMode && !searching && displayLists.length > (inHome || inCollectionDetail ? 0 : 1)`: on Collection detail a lone member keeps the grip so it can be dragged out.