# 004 — Create list screen: Plan

## Architecture

```
HomeStack
└── CreateListScreen (route CreateList, FAB from Home)
    ├── Heading (create_list_title) — inside ScreenShell
    ├── Name TextInput (maxLength 100, live validation)
    ├── Icon picker grid (LIST_ICONS)
    ├── Color picker grid (LIST_COLORS)
    └── Create button (disabled until name valid)
```

Data writes: `listRepo.create`. Duplicate check: `listRepo.existsByName` (debounced). After create, `AppContext.refresh()` then `goBack()`.

## Components

| Component | Location | Responsibility |
|-----------|----------|----------------|
| `CreateListScreen` | `src/screens/CreateListScreen.tsx` | Form state, validation, debounced duplicate check, icon/color selection, create + back |

Grids are inline sections in the screen (no shared grid component; Modify-List will factor one if needed).

## Constants

| File | Content |
|------|---------|
| `src/constants/listIcons.ts` | `LIST_ICONS: IconName[]` — curated ~16 Ionicons covering the seed set + extras |
| `src/constants/listColors.ts` | `LIST_COLORS: string[]` — ~12 theme-agnostic hex colors |

## Usage and validation

- `validateListName(value, exists, maxLength)` in `src/utils/validation.ts` → `'list_name_required' \| 'list_name_max' \| 'list_name_duplicate' \| null` (trim, max, duplicate-flag).
- `MAX_LIST_NAME_LENGTH = 100` (existing in constants/types).

## i18n

New keys (en/es): `create_list_title`, `list_name_label`, `list_color_label`, `list_icon_label`, `list_create`, `list_name_required`, `list_name_max`, `list_name_duplicate`.

## Repositories

- `listRepo.create({ name, color, icon })` — insert.
- `listRepo.existsByName(name)` — debounced duplicate check (race-guarded with a request sequence number).

## Data flow

1. FAB → `CreateList`.
2. Name change → local required/max error immediate; `existsByName` debounced 300 ms → duplicate error.
3. `Create` (valid only) → `create(...)` → `refresh()` → `goBack()`; Home already refreshes on focus.

## Navigation types

- `CreateList` route is already `undefined` in `RootStackParamList`; screen uses `useNavigation<NavigationProp<'CreateList'>>()` for `goBack`.

## Risks / notes

- Debounce: use a ref sequence number so a stale `existsByName` result never overwrites a newer one.
- Disable Create while `name` trimmed is empty or an error is set, and while a submit is in flight (prevent double submits).
- On web, `goBack()` returns to Home which re-runs `useFocusEffect` → refresh.