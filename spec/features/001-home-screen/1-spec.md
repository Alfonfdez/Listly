# 001 — Home screen

- **Objective**
  Lists overview — the first screen of the app. Shows every list with its name, color, icon, and progress (completed/total), plus a search bar and a floating "+" button to create a new list.

---

## Functional requirements

### 1. Header
- Hamburger menu (Drawer Navigator) on the left.
- "Listly" title in the center (multilingual → `app_name`).
- Optionally a search toggle button on the right.

### 2. Search bar
- Toggleable search (`home_search_placeholder`): client-side, case-insensitive substring filter.
- Filters list tiles by list display name **and** by matching item names within each list (a list matches if its name or any of its items match).
- Empty results show a "No results found" state (`home_no_results`).

### 3. Lists grid
- Tiles (2 columns on mobile, more on wide web) with: icon, name, and progress "N/total" (`home_progress(n, total)`).
- Tile background uses the list's color (subtle) with `borderRadius` 12.
- Tapping a tile navigates to the list detail screen (003, route param `{ list }`).
- Completed count: items with `checked = 1`.

### 4. Floating "+" button
- `Fab` bottom-right → navigates to Create List (004).

### 5. Empty state
- When there are no lists: icon + `home_empty` ("No lists yet") + hint `home_empty_hint` ("Tap + to create your first list").
- The FAB stays visible in the empty state.

### 6. Drawer
- Items: Home, Lists (→ this screen), Settings (placeholder "coming soon" until 005 lands).
- Drawer style follows the active theme.

### 7. Data loading
- Lists + item counts loaded from the repository on startup (AppContext) and refreshed on focus.
- Show a loading indicator while the database initializes.

---

## Non-functional requirements

- **Multilingual**: all new texts go through `t()` (en/es).
- **Reuse**: `SearchBar`, `EmptyState`, `Fab`.
- **Theme/text size**: screens/components use `useConfig().activeColors` and `useFontSize()`.
- **No schema changes**: reads only.
- **Tests**: pure-logic tests for the search/filter helper; component test for the list tile.

---

## Acceptance criteria

- [x] The Home screen shows a title and the lists grid on first launch (seeded data).
- [x] Each list tile shows icon, name, color, and "N/total" progress, with the count of completed items.
- [x] Toggling a search shows the search bar; typing filters list tiles by list name and by matching item names.
- [x] "No results found" shows when no list matches; clearing the search restores all lists.
- [x] The floating "+" button navigates to Create List.
- [x] With no lists, the empty state shows its message and the "+" button remains visible.
- [x] The drawer shows Home, Lists, and Settings; the hamburger opens it.
- [x] All texts are multilingual and respect theme + text size.