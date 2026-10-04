# 009 — Reorder lists: Plan

## Data layer (`lists.position`)

| File | Change |
|------|--------|
| `migrations/003_list_position.ts` | `ALTER TABLE lists ADD COLUMN position INTEGER NOT NULL DEFAULT 0`; backfill `position = id - 1`; index `lists_position ON lists(position)` |
| `database.ts` | `SCHEMA_VERSION = 3`; call `addPosition` when `currentVersion < 3` |
| `drizzle/schema.ts` | `lists.position: integer('position').notNull().default(0)` |
| `schemas.ts` | `listSchema` += `position: z.number().int()` |
| `types.ts` | `ListWithCounts` += `position: number` |
| `seedData.ts` | `SEED_LISTS` entries += `position: 0..5` |
| `002_seed.ts` | INSERT includes `position` |
| `listRepo.ts` | `list()`/`withCounts()` order by `position, id`; `create()` sets `position = max + 1`; new `reorder(orderedIds)` updates positions in a transaction |

## Drag layer

- Install `react-native-sortables` (peers already satisfied: RNGH ≥2, Reanimated ≥3).
- `ListsView` (both variants) swaps `FlatList` for `Sortable.Grid`:
  - grid: `columns = columnCount(width)`, `columnGap = 12`, `rowGap = 12`, items wrapped in `cardWidth` container.
  - rows (Lists): `columns = 1`, `rowGap = 10`, items are bare `ListRow`.
- Local `orderedIds` state reflects the dragged order; `onDragEnd({ data })` → `setOrderedIds`, `listRepo.reorder(ids)`, then `refresh()`.
- `sortEnabled={query === ''}` — dragging disabled while searching.
- Tapping still nav門 to list detail (Sortable.Touchable keeps press working).

## Tests

- `dbDrift.test.ts`: `EXPECTED_COLUMNS.lists` += `position` (last), zod-key match, `version = 3`, seed lists carry positions.
- `listContract.test.ts`: `create` returns appended position; `reorder` persists new indices.
- `ListsScreen.test.tsx` / `HomeScreen.test.tsx`: adjust for `Sortable.Grid` (position in fixtures, render still by name/progress, press/tap still navigates).

## Risks / notes

- `react-native-sortables` web support must be confirmed in the spike; fallback custom RNGH `Gesture.Pan` if it fails to render/interact on web.
- Reorder writes the full DB order; during search the container is non-sortable.