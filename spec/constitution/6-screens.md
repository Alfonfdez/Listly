# Screens

Listly 1.0 screens. Each maps to a feature spec (`spec/features/<NNN>-…/`) with functional requirements, plan, and tasks.

## 1. Home (001-home-screen, 016-collections)
- Header with hamburger menu (Drawer) + "Listly" title.
- Search toggle in the header to filter lists and items.
- *Collections* section (tiles) above the *Lists* section; each tile shows icon + name + color + N/total progress.
- Floating "+" FAB → Add chooser (Add collection / Add list).
- Empty state when there are no collections and no lists.
- Tapping a list → List detail; tapping a collection → Collection detail.
- Select mode (header toggle) selects collections and standalone lists together for a combined delete.

## 2. Lists (007-home-and-nav-polish)
- Drawer screen listing all lists as full-width rows (icon, name, progress).
- Same search/select/FAB behavior as Home; list layout by default.

## 3. Collections (016-collections)
- Drawer screen listing only collections (grid or list layout).
- Search, drag-reorder, FAB → Create Collection, header select toggle.

## 4. List detail (003-list-detail-screen, 008, 011, 012, 013, 017)
- Header block: list icon/name/color + N/total progress + edit pencil.
- Copy buttons (names / names+notes) in the header when items exist, writing to the clipboard.
- Item list: checkbox toggle, name (strikethrough when checked), note preview, photo thumbnails.
- Inline add bar with a details area (note + photos); edit/delete via modal.
- Search/select toggles in the header (when items exist); long-press drag-reorders items.
- Empty state when the list has no items.
- Delete lives on Edit List (pencil → Edit List → Delete).

## 5. Collection detail (016-collections)
- Header block: tinted badge, colored name, N/total, edit pencil.
- Member lists grid with search, select-mode bulk delete, reorder, and empty state; FAB adds a list into the collection.
- Delete lives on Edit Collection (pencil → Edit Collection → Delete): empty → single confirm; non-empty → move-lists-to-Lists or delete-lists-too.

## 6. Create / Edit List (004, 006, 013)
- Shared `ListForm`: name (validated), icon grid, color grid + custom color picker; debounced duplicate check.
- Create list (FAB / Add chooser); Edit list (pencil on list detail) with an outlined-red *Delete list* button above Save.

## 7. Create / Edit Collection (016)
- Shared `CollectionForm`: name (validated), icon grid, quick/custom color picker.
- Create collection (FAB / Add chooser); Edit collection (pencil on collection detail) with an outlined-red *Delete collection* button above Save.

## 8. Settings (005, 015)
- Hub with four rows: Appearance (theme, text size), Regional (language), Personalization (Home/Lists/Collections layouts + item/edit visibility), Data (export/import backup, delete all lists, factory reset).

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
