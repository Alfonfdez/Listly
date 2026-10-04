# Screens

Listly 1.0 screens. Each maps to a feature spec (`spec/features/<NNN>-…/`) with functional requirements, plan, and tasks.

## 1. Home (001-home-screen, 016-collections, 018-drag-list-into-collection)
- Header with hamburger menu (Drawer) + "Listly" title.
- Search toggle in the header to filter lists and items.
- *Collections* section (tiles) above the *Lists* section; each tile shows icon + name + color + N/total progress.
- Drag a standalone list onto a collection to move it into that collection (drops at the collection's end; the target is highlighted while hovering). Home lists stay draggable with ≥ 1 list so a lone list can be dropped into a collection.
- Floating "+" FAB → Add chooser (Add collection / Add list).
- Empty state when there are no collections and no lists.
- Tapping a list → List detail; tapping a collection → Collection detail.
- Select mode (header toggle) selects collections and standalone lists together for a combined delete.
- Pinning (select-mode star action) floats items to the top of their section; the grid/list re-measures immediately so reordered cards never overlap. Dragging a card across the pinned boundary toggles its pin (drop at/above the block pins, drop below unpins) and keeps the dropped position; the pinned block is tinted as a drop hint.

## 2. Lists (007-home-and-nav-polish, 016-collections)
- Drawer screen listing all lists as full-width rows (icon, name, progress).
- Same search/select/FAB behavior as Home; list layout by default.
- A list that belongs to a collection shows its collection name (with a small folder icon, in the collection's color) under the list name.

## 3. Collections (016-collections)
- Drawer screen listing only collections (grid or list layout).
- Search, drag-reorder, FAB → Create Collection, header select toggle.

## 4. List detail (003-list-detail-screen, 008, 011, 012, 013, 017, 020, 022, 034)
- Header block: list icon/name/color + N/total progress (numeric lists add a value-weight progress bar carrying the Total/Done sums) + edit pencil; copy buttons (names / names+notes / copy-to-list) when items exist.
- **Sticky top area**: the header (icon/name/buttons + progress bars), transient notices, and the batch toolbar stay pinned above the scrolling items and above the pinned add/selection bar; on Android the body keeps `paddingBottom = keyboard height` so the pinned area stays above the keyboard.
- Batch toolbar (single non-wrapping row, when items exist, outside select/search modes): icon-only **sort** pill (022) + **All**, **None**, **Clear** (short labels; full names as a11y labels). *All* checks every item, *None* unchecks every item, *Clear* deletes the checked items after a confirmation dialog showing their count.
- Item list: checkbox toggle, name (faded secondary color + faint green row wash when checked, no strikethrough), circular edit button, note preview, photo thumbnails.
- Inline add bar with a details area (note + photos); edit/delete via modal.
- Search/select toggles in the header (when items exist); long-press drag-reorders items.
- Empty state when the list has no items.
- Delete and Merge live on Edit List (pencil → Edit List).

## 5. Collection detail (016-collections, 019-remove-list-from-collection)
- Header block: tinted badge, colored name, N/total, edit pencil.
- Member lists (grid cards or full-width rows, per the *Collection detail* layout setting) with search, select-mode bulk delete, reorder, and empty state; FAB adds a list into the collection.
- Dragging a member up to a "Remove from collection" target that appears at the bottom of the screen (above the FAB) takes the list out of the collection and makes it standalone; the target is highlighted while hovered, and members stay draggable even with a single member.
- Delete lives on Edit Collection (pencil → Edit Collection → Delete): empty → single confirm; non-empty → move-lists-to-Lists or delete-lists-too.

## 6. Create / Edit List (004, 006, 013)
- Shared `ListForm`: name (validated), icon grid, color grid + custom color picker; debounced duplicate check.
- Create list (FAB / Add chooser); Edit list (pencil on list detail) with an outlined-red *Delete list* button above Save.

## 7. Create / Edit Collection (016)
- Shared `CollectionForm`: name (validated), icon grid, quick/custom color picker.
- Create collection (FAB / Add chooser); Edit collection (pencil on collection detail) with an outlined-red *Delete collection* button above Save.

## 8. Settings (005, 015)
- Hub with four rows: Appearance (theme, text size), Regional (language), Personalization (Home/Lists/Collections/Collection detail layouts + item/edit visibility), Data (export/import backup, delete all lists, factory reset).

## Navigation map
```
AppNavigator (Drawer → Main native stack)
├── Home          → HomeScreen (lists + collections overview)
├── Lists         → ListsScreen (standalone lists)
├── Collections   → CollectionsScreen
├── ListDetail / CollectionDetail
├── CreateList / EditList
├── CreateCollection / EditCollection
└── Settings      → SettingsScreen → Appearance / Regional / Personalization / Data
```

Drawer entries: Home, Collections, Lists, Settings (with a separator before Settings).
