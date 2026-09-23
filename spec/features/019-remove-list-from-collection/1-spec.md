# 019 - Remove a list from a collection

- **Objective**
  In Collection detail, let the user long-press-drag a member list and drop it on a "Remove from collection" target that appears at the bottom of the screen while dragging, to take that list out of the collection and make it a standalone list.

---

## Functional requirements

### 1. Drop target (Collection detail only)
- While a member list is being dragged, a pill-shaped bar appears at the bottom of the screen (above the FAB): icon (`arrow-undo-outline`) + label `collection_remove_label`.
- The bar is wrapped in a `Sortable.BaseZone` inside the same `Sortable.MultiZoneProvider` (it sits outside the members `Grid`), so it reacts to the active drag via item/zone bounds only.
- The bar is always mounted on Collection detail (so the zone's `measure()` stays valid) but hidden (`opacity: 0`, `pointerEvents: none`, no `accessibilityHint`) until a member drag starts; it fades in on `onDragStart` and hides again when the drag ends or after a drop.
- `onItemEnter` highlights it (accent border `c.primary` + primary-tinted background); `onItemLeave` clears the highlight. Both only react while a **list** is being dragged.

### 2. Drop behavior
- `listRepo.removeFromCollection(listId)` runs inside a transaction: the new position is `COALESCE(MAX(position), -1) + 1` among rows with `collection_id IS NULL` (append at the end of Home's standalone lists), then `UPDATE lists SET collection_id = NULL, position`.
- On drop the view calls `removeFromCollection` + `refresh()`, and skips the grid's `reorder` for that drag (same `zoneDropHandledRef` / `pendingMoveRef` wiring as feature 018).
- Releasing a member list anywhere else keeps the existing reorder-within-collection behavior.

### 3. Drag availability
- On Collection detail the members grid enables dragging with ≥ 1 list (`sortEnabled` allows it in `collection` mode just like Home), so a lone member can be dragged out.

### 4. i18n
- New keys en/es: `collection_remove_label` ("Remove from collection" / "Quitar de la colección") and `collection_remove_hint` ("Drop to remove this list from the collection" / "Suelta para quitar esta lista de la colección", exposed as the drop-target `accessibilityHint` while active).

---

## Non-functional requirements

- **TypeScript strict**, no `any`; theme tokens (`c.primary`, `c.textSecondary`) + `withAlpha`/`ALPHA_TINT`; no new dependencies.
- **Tests**: `listRepo.removeFromCollection` repo tests (make standalone appended at the end, lone member, existing standalone lists); `ListsView` tests (lone member draggable in collection mode, target revealed only during a member drag, drop calls `removeFromCollection` and skips reorder, target absent outside collection mode, reorder still works when released elsewhere).
- **Verification**: `npm run test:all`; web loop at 375px (drag a member onto the bottom target, confirm the highlight, that the list leaves the collection and becomes the last standalone list on Home; a single-member collection can be emptied; reordering members still works when released elsewhere).

---

## Acceptance criteria

- [x] In Collection detail, dragging a member list makes a "Remove from collection" target appear at the bottom of the screen.
- [x] Dropping the member list on that target removes it from the collection and makes it a standalone list on Home (appended at the end).
- [x] The target is highlighted while a member list hovers over it and the highlight clears on leave/drop.
- [x] A collection with a single (lone) member list still allows dragging it out.
- [x] Releasing a member list elsewhere keeps reordering it within the collection.
- [x] The target only exists on Collection detail (not on Home, Lists, or Collections).
- [x] `collection_remove_label` and `collection_remove_hint` exist in en and es.
- [x] `npm run test:all` passes.