# 009 — Reorder lists

- **Objective**
  Let users reorder their lists by dragging, on the Home grid and the Lists row screen, persisting the order in the database via a new `lists.position` column.

---

## Functional requirements

### 1. Data layer: `lists.position`
- Migration adds `position INTEGER NOT NULL DEFAULT 0` to `lists`, backfills `position = id - 1`, and indexes `(position)`.
- Drizzle schema, Zod `listSchema`, and `ListWithCounts` include `position`.
- Seed lists carry explicit positions (0..5).
- `listRepo.list()` and `listRepo.withCounts()` order by `position` (then `id` for stability).
- `listRepo.create()` appends new lists at the end (`position = max + 1`).
- New `listRepo.reorder(orderedIds: number[])` persists the new order atomically.

### 2. Drag-to-reorder (Home grid + Lists rows)
- Both the grid (Home) and the rows (Lists) are draggable via the list's sortable container.
- Dragging an item and releasing it persists the new order (write-through to `reorder`, then refresh).
- While a search query is active, dragging is disabled (search filters the set).

### 3. Tapping still works
- Tapping a tile (grid) or a row still navigates to its list detail; the drag gesture and the tap/press coexist.

---

## Non-functional requirements

- **Multilingual**: no new visible texts required (drag is gesture-based); reuse existing keys.
- **Theme/text size**: tiles and rows keep their current styling (ListCard / ListRow).
- **Tests**: `dbDrift` column list + zod keys updated for `position`; contract test for `create` position assignment and `reorder`; `ListsView`/screens tests updated for the sortable container and drag-persistence.
- **Verification**: web loop at 375px (drag on Home grid and Lists rows, persistence across reload).

---

## Acceptance criteria

- [ ] Lists have an order: row lists and Home grid list them by `position`.
- [ ] Dragging a list on Home reorders it and other lists follow.
- [ ] Dragging a list on the Lists rows has the same effect.
- [ ] The new order persists after a reload (DB `position` writes).
- [ ] A list created afterwards is appended at the end.
- [ ] Tap still opens list detail; searching keeps filtering; all theme/text-size behavior is unchanged.