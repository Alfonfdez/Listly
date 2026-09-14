# 007 — Home & navigation polish: Plan

## Architecture

```
HomeStack (native stack)
├── Home (route)     → HomeNavCapture → ListsView variant="grid"
├── Lists (route)    → ListsNavCapture → ListsView variant="list"
├── ListDetail (route)
├── CreateList (route)
└── Settings (route)
```

Drawer reset (Home/Lists) dispatches `CommonActions.reset` to `{ name: screen }` on the captured stack navigation. Headers render `<HeaderTitle icon label/>`.

## Components

| Component | Location | Change |
|-----------|----------|--------|
| `Fab` | `src/components/Fab.tsx` | Absolute bottom-center (`alignSelf: 'center'`, `bottom: 56`) |
| `ListRow` | `src/components/ListRow.tsx` | **New** — full-width row (icon badge, name, progress) |
| `ListsView` | `src/components/ListsView.tsx` | **New** — shared search + FlatList (grid or rows) + FAB + loading/empty |
| `HeaderTitle` | `src/navigation/AppNavigator.tsx` | Accepts `icon: IconName` (icon + label row) |
| `HomeScreen` | `src/screens/HomeScreen.tsx` | Becomes a thin `<ListsView variant="grid" />` wrapper |
| `ListsScreen` | `src/screens/ListsScreen.tsx` | **New** — `<ListsView variant="list" />` wrapper |

## Navigation

- `RootStackParamList` gains `Lists: undefined`.
- `ScreenDef` in `AppNavigator` gains `icon` + per-screen header label; Home and Lists set `headerLeft`.
- `ListsNavCapture` captures the stack nav (mirrors `HomeNavCapture`); `openDrawerScreen` resets to the tapped root (Home or Lists).

## i18n

New key: `list_detail_title` ('List detail' / 'Detalle de lista').

## Data flow

- Both variants read `useApp()` (lists, itemsByListId, loading, refresh), filter with `filterListsByQuery`, refresh on focus.
- Grid rows use `ListCard` (existing tiles); list rows use `ListRow`.
- Shared empty states: no lists → `home_empty`; no results → `home_no_results`.

## Risks / notes

- Keep `HomeScreen` tests passing by preserving labels/props (progress text, search toggle, FAB label, tile press).
- The row list uses a 1-column FlatList (no `numColumns`), so progress text and accessibility labels read identically to the grid.
- `freezeOnBlur`-style behavior unchanged; drawered roots still refresh on focus.