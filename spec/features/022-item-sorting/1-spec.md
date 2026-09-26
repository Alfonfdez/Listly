# 022 - Item sorting

- **Objective**
  Let the user sort the items of a list from the List detail screen: Manual (drag-to-reorder, the default), Name, or Created, each with a direction arrow (asc/desc). The sort toggle lives in local state (not a settings option) and non-manual modes disable drag-reorder and render the sorted list.

---

## Functional requirements

### 1. Sort model (pure util)
- `src/utils/itemSort.ts` exports `ItemSortKey = 'manual' | 'name' | 'created'`, `SortDirection = 'asc' | 'desc'`, `ItemSort = { key, direction }`, `DEFAULT_ITEM_SORT = { key: 'manual', direction: 'asc' }`, and the combined value helpers `itemSortValue` / `parseItemSortValue` mapping to `manual | name-asc | name-desc | created-asc | created-desc`.
- `sortItems(items, sort)` is pure and stable: `manual` returns the array unchanged (manual position order); `name` compares case-insensitively with numeric awareness (`localeCompare` `{ numeric: true, sensitivity: 'base' }`); `created` compares the `created_at` timestamp strings lexicographically (`YYYY-MM-DD HH:MM:SS` sorts correctly). On ties the input order (manual position) is preserved.

### 2. Sort toggle on List detail
- A bounded sort pill (icon + current mode label + chevron) renders in its own row above the batch toolbar when the list has items and neither select mode nor search is active. It is primary-tinted when a non-manual sort is active and reflects the current direction with an arrow icon.
- Tapping it opens the shared `OptionPickerModal` with five one-tap radio options: Manual, Name asc, Name desc, Created asc, Created desc (Manual has no direction). Cancel discards; a confirmation button (`common_select`) applies the temporary selection.

### 3. Sorting behavior
- Selecting Manual (default) keeps the current manual order and enables drag-to-reorder as today.
- Selecting Name or Created reorders the rendered items via `sortItems` and disables drag-reorder (`Sortable.Grid` `sortEnabled` is false) so no `itemRepo.reorder` is ever persisted in a sorted mode.
- Search keeps the active sort applied to the filtered result set.
- The sort choice is local component state: navigating away from the list and back resets to Manual.

### 4. Data model (SCHEMA_VERSION 7)
- New `items.updated_at` column (`TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))`), added to the `001_initial` DDL, the Drizzle schema, the Zod `itemSchema`, and the derived `Item` type; `NewItem` omits it.
- `itemRepo` stamps `updated_at` on item writes so it is actually tracked for future use: create (via the DDL default + returned value), update, toggle, setAllChecked, and reorder. `listByList`/`listAll` ordering stays by `position` (sorting is app-layer).

### 5. Backup
- `updated_at` is serialized on export and restored on import for items.
- Backups from before this feature (schema 6, no `updated_at` row) import successfully with `updated_at` defaulted to the item's `created_at` (lenient `backupItemSchema` transform), so data never downgrades.

### 6. i18n
- New keys en/es: `item_sort`, `item_sort_manual`, `item_sort_name`, `item_sort_created`, `item_sort_asc`, `item_sort_desc`.

---

## Non-functional requirements

- **TypeScript strict**, no `any`; no new dependencies; reuses `OptionPickerModal` / `Option` for the picker.
- **Tests**: `itemSort` util (case/numeric order, asc/desc, ties keep manual order, manual passthrough); repo `updated_at` stamped on create/update/toggle/setAllChecked/reorder while ordering stays by position; backup round-trip + legacy schema-6 default; `itemSchema.updated_at` validation; ListDetail sorts the view, disables drag in sorted modes, search retains sort, pill hidden in select/search and when empty, Spanish labels.
- **Verification**: `npm run test:all`; web loop at 375px (Manual drag persists; Name asc/desc; Created asc/desc; drag disabled in sorted modes; search keeps the sort; pill returns after leaving search; sort resets to Manual on navigation re-entering; Spanish labels; 0 console errors).

---

## Acceptance criteria

- [x] Manual (default) shows the list in manual position order with the pill reading Manual; drag-to-reorder keeps working.
- [x] Selecting Name sorts items alphabetically (case-insensitive, numeric-aware) and the direction arrow flips the order.
- [x] Selecting Created sorts by creation time and the direction arrow flips the order.
- [x] In Name/Created modes drag-reorder is disabled and no reorder is persisted.
- [x] Searching keeps the active sort applied to the results; the pill is hidden while searching.
- [x] The sort choice is local state and resets to Manual when leaving the list.
- [x] Schema 7 adds `items.updated_at`, stamped on item writes, round-tripped through backup; schema-6 backups import with `updated_at` defaulted.
- [x] `item_sort*` keys exist in en and es, and `npm run test:all` passes.