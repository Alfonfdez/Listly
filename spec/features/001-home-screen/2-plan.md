# 001 — Home screen: Plan

## Architecture

```
App (App.tsx)
└── AppProvider (AppContext: lists + item counts)
    └── AppNavigator (Drawer)
        └── HomeStack
            ├── HomeScreen
            └── (003 ListScreen, 004 CreateList — added by their features)
```

## Components

| Component | Location | Responsibility |
|-----------|----------|----------------|
| `HomeScreen` | `src/screens/HomeScreen.tsx` | Layout: header row, search, grid, FAB, empty state; loads/refreshes data via AppContext |
| `ListCard` | `src/components/ListCard.tsx` | List tile: icon + name + progress `N/total`, subtle color background, press → detail |
| `SearchBar` | `src/components/SearchBar.tsx` | Reusable text input + clear button + onChangeText |
| `EmptyState` | `src/components/EmptyState.tsx` | Icon + title + message |
| `Fab` | `src/components/Fab.tsx` | Floating "+" action button |

## Utils

| File | Responsibility |
|------|----------------|
| `utils/search.ts` | `filterListsByQuery(lists, itemsById, query)` — case-insensitive multi-term (AND) over list name and item names |

## Context

- `AppContext`: `lists`, `itemsByListId` (or counts), `loading`, `refresh()`.
- `ConfigContext`: `activeColors`, `fs()` (via `useFontSize`).

## Repositories

- `listRepo.list()` → all lists.
- `itemRepo.countByList(listId)` or `itemRepo.listByList(listId)` for checked/total.

## Data flow

1. App boot → DB init (migrations + seed) → AppContext loads lists + counts → Home renders.
2. Home focus → `refresh()` reloads silently.
3. Search/filter is purely client-side over the loaded lists.

## Navigation types

- `RootStackParamList`: `Home`, `ListDetail: { listId: number }`, `CreateList`, `Settings`.
- Drawer: Home (reset to root), Lists (reset to root), Settings (placeholder).

## Risks / notes

- Large item sets on web: counts should come from a single SQL `GROUP BY` query, not a fetch-per-list.
- Grid column count must respond to width (`onLayout`/`Dimensions`) and work at 375px.