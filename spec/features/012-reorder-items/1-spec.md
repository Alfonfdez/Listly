# 012 — Reorder items

- **Objective**
  Let users reorder the items inside a list by dragging, persisting the new order in the database via each item's existing `items.position` column.

---

## Functional requirements

### 1. Data layer: `itemRepo.reorder`
- New `itemRepo.reorder(listId: number, orderedIds: number[])` persists the new order atomically (one transaction, `position` assigned in order, scoped to the given list).
- Reordering never touches items that belong to other lists.

### 2. Drag-to-reorder (ListDetailScreen)
- The item list is rendered in a sortable container (`Sortable.Grid`, 1 column) matching the lists pattern.
- Long-press activates the drag; releasing persists the new order (write-through to `reorder`, then refresh).
- Reordering is disabled when: a search query is active (the set is filtered), select mode is active, or the list has fewer than 2 items.
- While a search query is active, dragging is disabled.

### 3. Long-press is reserved for drag (not select mode)
- Long-pressing an `ItemRow` drags to reorder and does NOT enter select mode.
- Item select mode is still reachable via the header select toggle (feature 010).

### 4. Guards mirror the lists behavior
- Follows the same restriction as lists reordering (feature 009): no reordering when the list has 0 or 1 items.

### 5. Auto-scroll while dragging
- The items `Sortable.Grid` receives a `scrollableRef` (an `AnimatedRef` to the screen's `Animated.ScrollView`), enabling the library's auto-scroll: dragging an item within `AUTO_SCROLL_ACTIVATION_OFFSET` (90 px) of the top/bottom edge scrolls the list continuously at up to `AUTO_SCROLL_MAX_VELOCITY` (1400 px/s), so a long list can be reordered to position #1 in one gesture instead of repeated small drags.
- Same tuning constants are shared with the lists grids (feature 009).

---

## Non-functional requirements

- **Multilingual**: no new visible texts required (drag is gesture-based); reuse existing keys.
- **Theme/text size**: item rows keep their current styling.
- **Tests**: `dbDrift` unchanged (no schema change); contract test for `itemRepo.reorder`; `ItemRow` and `ListDetailScreen` tests updated for the sortable container, drag-persistence, and the disabled reordering cases (single item, search active, select mode).
- **Verification**: web loop at 375px (long-press-drag on items, persistence across reload, disabled cases).

---

## Acceptance criteria

- [x] Items have an order: the list detail renders items by `position`.
- [x] Long-pressing and dragging an item reorders it and the other items follow.
- [x] The new order persists after a reload (DB `position` writes via `itemRepo.reorder`).
- [x] Reordering is disabled with fewer than 2 items, while a search query is active, and in select mode.
- [x] Long-press on an item no longer enters select mode; the header select toggle still does.
- [x] Reordering one list's items never affects another list.
- [x] Dragging an item near the top/bottom edge auto-scrolls the list so it can be moved across a long list in one gesture.