# 007 — Home & navigation polish

- **Objective**
  Home/navigation polish aligned with Finly: bottom-center FAB, per-screen header with icon + title, and a distinct "Lists" drawer screen showing lists as full-width rows (one under another) while Home keeps the grid. Pre-stages the future Settings grid/list layout toggle.

---

## Functional requirements

### 1. Centered FAB
- The FAB is centered horizontally at the bottom of the screen (`alignSelf: 'center'`, `bottom: 56`), replacing the current bottom-right position.
- Applies to every screen that shows the FAB (Home and the new Lists screen).

### 2. Header icon + title per screen
- The native-stack header shows an icon + title for each screen (like Finly's `HeaderTitle`), theme/text-size aware:
  - Home → `home-outline` + `app_name`
  - Lists → `list-outline` + `nav_lists`
  - ListDetail → `checkbox-outline` + `list_detail_title` (new key)
  - CreateList → `add-circle-outline` + `create_list_title`
  - Settings → `settings-outline` + `settings_title`
- Home and Lists keep the drawer menu button (`headerLeft`); the other screens keep the default back arrow.

### 3. Distinct Lists screen (row view)
- The "Lists" drawer item opens its own stack route (`Lists`) — no longer a duplicate of Home.
- Lists renders the same data as Home but as full-width rows: icon badge, name, progress — one list per line.
- Tapping a row opens `ListDetail`; an FAB (centered) opens `CreateList`.
- Search works exactly as on Home (filter by list name and item names), same placeholder and empty/no-results states.

### 4. Shared grid/list presentation
- A shared `ListsView` component renders either the grid (Home) or the row list (Lists) from the same data/search/loading logic — the layout toggle for Settings (005) will drive this same component.

---

## Non-functional requirements

- **Multilingual**: new key `list_detail_title` (en/es); all labels via `t()`.
- **Theme/text size**: headers and rows use `useConfig().activeColors` + `useFontSize()`.
- **Reuse**: `ScreenShell`, `SearchBar`, `EmptyState`, `FAB`, `ListCard` (grid) unchanged; new `ListRow` for the row view.
- **Tests**: `ListsScreen` suite (rows render, progress, search, FAB → CreateList, row → ListDetail, empty state); existing `HomeScreen` suite still green.
- **Navigation**: `Lists` added to `RootStackParamList`; drawer reset targets `Home` or `Lists` by name.

---

## Acceptance criteria

- [x] The FAB is centered at the bottom (not right-aligned) on Home and Lists.
- [x] Every stack screen shows an icon + title in its header.
- [x] The Lists drawer item opens a distinct full-width row list (icon, name, progress), one list per line.
- [x] Home still shows the grid layout.
- [x] Search on Lists filters rows like Home; rows open ListDetail and the FAB opens Create List.
- [x] All texts are multilingual and respect theme + text size.