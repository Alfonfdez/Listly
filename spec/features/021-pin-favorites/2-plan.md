# 021 — Pin/favorite lists and collections: Plan

## Architecture

```
ListsView (Home / Lists / Collections / Collection detail)
├── select-mode SelectionActionBar
│   ├── Pin (star-outline)  -> listRepo.setPinned(id, true)  + collectionRepo.setPinned(id, true)
│   └── Unpin (star)        -> setPinned(id, false)  (all selected already pinned)
├── ListCard / CollectionCard / ListRow / CollectionRow
│   └── star icon (c.star, amber) next to name when pinned === 1 && !selectMode
└── state: selectedListItems / selectedCollectionItems / allSelectedPinned (derived from selectedIds + lists/collections)
```

## Data model

- SCHEMA_VERSION 5 → 6. New `pinned INTEGER NOT NULL DEFAULT 0` columns on `lists` and `collections` (DDL in `001_initial.ts`, Drizzle `.$type<0 | 1>()`, Zod union literal 0/1, `List`/`Collection`/`ListWithCounts`/`CollectionWithCounts` types).
- Repos: `setPinned(id, pinned)` on `listRepo` and `collectionRepo`; every summary read orders by `desc(pinned), position, id`.
- Backup: `pinned` column in INSERTs and snapshot rows; `backupPinnedSchema = z.union(0/1).default(0)` so schema-5 backups (no `pinned`) import as unpinned.

## Components

| Component | Location | Change |
|-----------|----------|--------|
| `listRepo.ts` / `collectionRepo.ts` | `src/database/repositories/` | **New** `setPinned(id, pinned)`; order pinned first (`desc`) in `list()`/`withCounts()` |
| `database.ts` | `src/database/database.ts` | `SCHEMA_VERSION` 5 → 6 |
| `backup.ts` | `src/database/backup.ts` | Include `pinned` on export/import; lenient `backupPinnedSchema` default 0 |
| `themes.ts` | `src/constants/themes.ts` | **New** `star` token on both palettes (dark `#F9A825`, light `#F59E0B`) |
| `errors.ts` | `src/utils/errors.ts` | **New** scopes `pinLists`, `unpinLists` |
| `SelectionActionBar.tsx` | `src/components/SelectionActionBar.tsx` | **New** optional `onPin`/`pinLabel`/`pinIcon`/`pinAccessibilityLabel`; star button between Cancel and Delete; `.actions` wraps so three buttons fit 375px |
| `ListCard.tsx` / `CollectionCard.tsx` / `ListRow.tsx` / `CollectionRow.tsx` | `src/components/` | **New** inline `star` indicator (`c.star`, a11y `home_pinned`) when `pinned === 1 && !selectMode` |
| `ListsView.tsx` | `src/components/ListsView.tsx` | `selectedListItems`/`selectedCollectionItems`/`hasPinSelection`/`allSelectedPinned`; `handlePinPress` pins/unpins all selected and refreshes; passes label/icon/a11y to the action bar |
| i18n | `src/i18n/en.ts`, `es.ts` | **New** `select_pin`, `select_unpin`, `home_pinned` |

## Data flow

- Enter select mode → select lists/collections → action bar derives `allSelectedPinned`; label = all pinned ? "Unpin" (star filled) : "Pin" (star outline).
- Press → `setPinned(id, !allSelectedPinned)` for each selected list and collection under `ERROR_SCOPE.pinLists`/`unpinLists` → `refresh()` re-reads → pinned items render at the top with the star.
- Star hint `home_pinned` used by cards/rows; bar buttons keep explicit accessibility labels for screen-reader tests and web verification.

## Risks / notes

- ASC `ORDER BY pinned` would sort unpinned (0) first — every pinned-first orderBy must use `desc(pinned)` ({GitHub `desc` from drizzle-orm`).
- The pin action only applies to lists + collections; the List detail item select mode intentionally has no pin action (no `onPin` passed → button not rendered by `SelectionActionBar`).
- `items.updated_at` is deferred to 022 (that feature will bump SCHEMA_VERSION to 7).