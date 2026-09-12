# Screens

Planned screens for Listly 1.0. Each gets a dedicated feature spec (`spec/features/<NNN>-…/`) with functional requirements, plan, and tasks.

## 1. Home (001-home-screen)
Lists overview:
- Header with hamburger menu (Drawer) + "Listly" title.
- Search bar to filter lists and items.
- Grid/list of lists: each tile shows icon + name + color + progress (N/total completed).
- Floating "+" FAB → Create List.
- Empty state with message and CTA when no lists exist.
- Tapping a list → List detail.

## 2. List detail (003-list-detail-screen, not started)
- Header with list icon + name + back button.
- Progress indicator (completed/total).
- Item list: checkbox toggle, name (strikethrough when checked), note indicator.
- Add item input (or modal), edit/delete item.
- Empty state when the list has no items.

## 3. Create List (004-create-list-screen, not started)
- Name field with validation (non-empty, unique).
- Icon grid (shared `LIST_ICONS`).
- Color grid.
- "Create" button (disabled until valid).

## 4. Modify/Delete List (planned, not started)
- Same form as Create, preloaded.
- Delete with confirmation modal (cascades to items).

## 5. Settings (005-settings-screen, not started)
- Appearance: Theme (dark/light/system), Text size (small/medium/large).
- Regional: Language (en/es).

## Navigation map (planned)
```
AppNavigator (Drawer)
├── Home (Stack root → HomeScreen)
├── Lists → Stack: HomeScreen (lists), ListScreen, CreateListScreen, ModifyList (planned)
└── Settings → SettingsScreen (planned)
```