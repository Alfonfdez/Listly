# 018 - Drag a list into a collection

- **Objective**
  On Home, let the user long-press-drag a standalone (base) list and drop it onto a collection card or row to move that list into the collection, appended at the last position. While hovering, the target collection is highlighted.

---

## Functional requirements

### 1. Drop target (Home only)
- Each collection card/row rendered on Home is wrapped in a `Sortable.BaseZone` (inside `Sortable.MultiZoneProvider`) with `minActivationDistance={8}`.
- Zones only react while a **list** is being dragged:
  - The lists grid sets a `draggingListRef` on `onDragStart` (from the dragged item key) and clears hover.
  - A collections-grid `onDragStart` resets that ref, so reordering collections never triggers fake list drops.
- `onItemEnter` (list-drag active only) sets `hoverCollectionId`; `onItemLeave` clears it; `onItemDrop` moves the list.
- On Home the lists grid enables dragging with ≥ 1 list (`sortEnabled = !selectMode && !searching && displayLists.length > (inHome ? 0 : 1)`), so a lone list can still be dragged onto a collection; other screens keep the `> 1` reorder guard.

### 2. Target highlight
- `CollectionCard` / `CollectionRow` gain a `dropTarget` prop: when hovering, the card shows an accent border (`c.primary`) on top of a primary-tinted background and exposes `accessibilityHint` = `home_drop_hint`.
- The highlight clears on leave and after a drop.

### 3. Drop behavior
- `listRepo.moveToCollection(listId, collectionId)` runs inside a transaction: the new position is `COALESCE(MAX(position), -1) + 1` among rows with the target `collection_id` (append at end), then `UPDATE lists SET collection_id, position`.
- On drop the view calls `moveToCollection` + `refresh()`, and skips the grid's `reorder` for that drag (positions are per-scope, so doing both would still be safe).
- Works in `collectionsVariant` grid and list layouts.

### 4. i18n
- New key en/es: `home_drop_hint` ("Drop to move the list into this collection" / "Suelta para mover la lista a esta colección").

---

## Non-functional requirements

- **TypeScript strict**, no `any`; theme tokens (`c.primary`) + existing card styles; no new dependencies.
- **Tests**: `listRepo.moveToCollection` repo tests (append at end, empty collection, between collections); `ListsView` drop-wiring tests (grid + list layouts: highlight on enter, clear on leave/drop, no highlight without a list drag, `moveToCollection(listId, collectionId)` on drop, reorder skipped).
- **Verification**: `npm run test:all`; web loop at 375px (drag a base list onto a collection card and row, confirm highlight and that the list appears last inside the collection; reordering a collection doesn't move lists).

---

## Acceptance criteria

- [x] On Home, a standalone list can be dragged and dropped onto a collection card to move it into that collection.
- [x] On Home, a single (lone) list can still be dragged and dropped into a collection.
- [x] The list is appended as the last member of the collection.
- [x] The target collection is highlighted while the dragged list hovers over it (accent border + tint).
- [x] The highlight clears when leaving the collection and after the drop.
- [x] The drop also works with the collections/list layout set to list rows.
- [x] Reordering collections does not drop lists into them.
- [x] `home_drop_hint` exists in en and es.
- [x] `npm run test:all` passes.