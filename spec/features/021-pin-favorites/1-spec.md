# 021 - Pin/favorite lists and collections

- **Objective**
  Let the user pin (star) lists and collections so they stay pinned at the top of their sections. Pinning is driven from the existing select-mode action bar, and pinned items show an amber star indicator on their card/row.

---

## Functional requirements

### 1. Data model (SCHEMA_VERSION 6)
- New columns `lists.pinned` and `collections.pinned` (`INTEGER NOT NULL DEFAULT 0`, allowed values 0/1), added to the `001_initial` DDL, the Drizzle schema (`.$type<0 | 1>()`), the Zod row schemas (`z.union([z.literal(0), z.literal(1)])`), and the derived `List`/`Collection` plus `ListWithCounts`/`CollectionWithCounts` types.
- `create` returns `pinned: 0`; `NewList`/`NewCollection` omit the column.

### 2. Repository operations and ordering
- `listRepo.setPinned(id, pinned)` and `collectionRepo.setPinned(id, pinned)` — single scoped `UPDATE... SET pinned`.
- `listRepo.list()`, `listRepo.withCounts()`, `collectionRepo.list()`, `collectionRepo.withCounts()` order by `pinned DESC, position, id` so pinned items float to the top while the rest keep their manual order.
- `moveToCollection` / `removeFromCollection` leave `pinned` untouched (a pinned member or standalone list keeps its star).

### 3. Pin action (select-mode action bar)
- On Home, Lists, Collections, and Collection detail, the select-mode `SelectionActionBar` shows a star action between Cancel and Delete (rendered only when `onPin` is provided).
- Pressing it pins every selected list and collection; if all selected items are already pinned it unpins them all instead (single toggle). Both are no-ops when nothing is selected (button disabled at 0 selected).
- The label/icon flip with the action intent: "Pin" + `star` when at least one selected item is unpinned, "Unpin" + `star-outline` when everything selected is pinned (the icon depicts the result of pressing the button).
- Runs under `ERROR_SCOPE.pinLists` / `ERROR_SCOPE.unpinLists` and refreshes after applying.

### 4. Star indicator
- Pinned lists and collections render a filled `star` icon (theme token `c.star`, amber) inline after the name on both grid cards (`ListCard`, `CollectionCard`) and rows (`ListRow`, `CollectionRow`), hidden in select mode. Accessibility label `home_pinned`.

### 5. Backup
- `pinned` is serialized on export and restored on import for both tables.
- Backups from before this feature (schema 5, no `pinned` row) import successfully with `pinned: 0` (lenient `backupPinnedSchema` default), so data never downgrades.

### 6. i18n
- New keys en/es: `select_pin` ("Pin"/"Fijar"), `select_unpin` ("Unpin"/"Desfijar"), `home_pinned` ("Pinned"/"Destacado").

---

## Non-functional requirements

- **TypeScript strict**, no `any`; theme `star` token added to both palettes (dark `#F9A825`, light `#F59E0B`) exposed through `useConfig`; `ERROR_SCOPE.pinLists` / `ERROR_SCOPE.unpinLists`; no new dependencies.
- **Tests**: repo tests (`setPinned` + pinned-first ordering for `list()`/`withCounts()`, `create` returns 0, move/remove keep the flag, unpin restores order); backup tests (pinned round-trip, legacy schema-5 backup imports unpinned); component tests (star on pinned cards/rows, hidden otherwise or in select mode; action-bar pin button render/press/disabled); `ListsView` select-flow tests (Pin/Unpin labels, pin/unpin calls for lists and collections).
- **Verification**: `npm run test:all`; web loop at 375px (pin a list and a collection → both float to the top of their sections with an amber star; repeat → Unpin restores order; disabled at 0 selected; star persists across reload; Spanish labels; 0 console errors).

---

## Acceptance criteria

- [x] Pinning a selection of lists/collections from the select-mode star action moves them to the top of their sections and shows an amber star on their cards/rows.
- [x] Repeating the action on already-pinned items shows **Unpin** and restores their previous order.
- [x] The pin action is inert (disabled) when nothing is selected.
- [x] Pinned items keep their star after reloading the app (persisted).
- [x] Collections pin together with lists on Home and Collections; lists pin on Lists and Collection detail.
- [x] Backup/restore preserves the pinned flags; backups made before pinning (schema 5) import with everything unpinned.
- [x] `select_pin`, `select_unpin`, `home_pinned` exist in en and es.
- [x] `npm run test:all` passes.