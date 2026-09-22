# 016 - Collections

- **Objective**
  Let the user group their lists into named, colored, icon-carrying collections: a *Collections* section on Home above the standalone lists, collection detail screens with the same list grid/select/search behavior as Home, create/edit collection forms, and add-a-list-inside-a-collection that scopes membership and ordering. Lists belong to zero or one collection (`collection_id` nullable FK); deleting a collection offers moving its lists back to the standalone Lists or deleting them too.

---

## Functional requirements

### 1. Data model and storage
- New `collections` table (`id`, `name`, `color`, `icon`, `created_at`, `position`) and `lists.collection_id` (nullable, FK → `collections.id`) with a `lists_collection_id` index; `SCHEMA_VERSION` becomes 5.
- Pre-1.0 the migration strategy rebuilds an out-of-date database from the single canonical `createSchema` (tables dropped when `user_version > 0`, then recreated) instead of an incremental migration chain; a real chain starts at v1.0.0.
- Drizzle `collections` table + `lists.collection_id`; Zod `collectionSchema` and `listSchema.collection_id`; DB drift expectations include the new table and column.
- Backup export includes `collections` and `lists.collection_id`; import restores them (collections first, then lists); `clearDataKeepSettings()` and `resetDatabase()` also clear `collections`.

### 2. AppContext grouping
- `AppContext` exposes `collections` (`CollectionWithCounts`), `listsByCollectionId` (`Map<number, ListWithCounts[]>`), and `baseLists` (lists with `collection_id` null); list tile counts keep coming from item rows.
- A new list is created inside a collection at `position = max(collection_id) + 1`, or at `max(collection_id IS NULL) + 1` for standalone lists.

### 3. Home: Collections section and FAB chooser
- Home renders a *Collections* section (uppercase section title) of `CollectionCard` tiles (icon, name, `N/total` progress across member lists) above the *Lists* section, only when collections exist; both sections are drag-reorderable and disabled during select mode or an active search.
- Home search filters collections by name and lists by name + item names.
- The Home FAB no longer navigates directly: it opens an "Add" chooser modal with *Add collection* and *Add list* rows; *Add collection* opens Create Collection, *Add list* opens Create List.
- Lists and Collection modes keep a direct FAB → Create list.

### 4. Collection detail
- Header block: tinted icon badge, collection name in its color, `N/total` progress, edit pencil → Edit Collection; trash opens the delete flow.
- Body: the member lists as a grid (`CollectionDetail`), reusing search, select-mode bulk delete (`SelectionActionBar` + confirm), reorder, and empty state from `ListsView`.
- FAB inside a collection navigates to Create List with `collectionId`, so the new list is added to this collection (not Home).
- Delete flow: empty collection → single confirmation; non-empty → choice modal with *Move lists to Lists* (sets `collection_id` null, keeps the lists) or *Delete lists too* (cascades and cleans up item photos).

### 5. Create / Edit collection
- Shared `CollectionForm`: name (validation via `validateCollectionName` — required / max `MAX_COLLECTION_NAME_LENGTH` / duplicate — with a debounced `existsByName` check that excludes the edited collection), icon grid, and the quick/custom color picker.
- Create Collection seeds the default icon/color and persists through `collectionRepo.create`; Edit Collection prefills and saves through `collectionRepo.update`; both refresh and go back on success.

### 6. i18n
- All new strings live in `en` and `es` (`collection_*`, `home_add_collection`, `home_add_choice_title`, `home_section_lists`) and are read through `useLabels()`.

---

## Non-functional requirements

- **TypeScript strict**, no `any`; theme tokens and `fs()` for all styling; no magic strings (i18n keys, typed validation error codes, `MAX_COLLECTION_NAME_LENGTH`).
- **Multilingual**: every label in both `en` and `es`, reactive to the configured language via `useLabels()`.
- **Tests**: DB drift now guards `collections` + `collection_id`; repo/schema/backup suites cover schema 5; screen/component tests cover the Home Add chooser (both navigations), the collection detail flows, and fixture helpers (`setCollections`, `setBaseLists`, `buildList` `collection_id`).
- **Verification**: `npm run test:all` passes, and the web loop at 375px exercises the criteria below with 0 console errors.

---

## Acceptance criteria

- [x] Home renders a *Collections* section above *Lists* with collection tiles showing icon, name, and N/total progress, and tapping a tile opens the collection detail.
- [x] The Home FAB opens an Add chooser; *Add collection* opens Create Collection and *Add list* opens Create List.
- [x] A list created inside a collection appears in that collection's detail and updates the collection tile's progress, not the standalone Home lists.
- [x] Create Collection validates the name (required/too long/duplicate) and persists the icon and color; Edit Collection prefills and saves without flagging its own name as a duplicate.
- [x] Collection detail shows the header block (badge, colored name, N/total) and its member lists as a grid with empty-state hint.
- [x] Deleting a non-empty collection offers *Move lists to Lists* (lists survive as standalone on Home) and *Delete lists too* (lists and their items/photos are removed); deleting an empty collection uses a single confirmation.
- [x] Collections reorder by drag on Home and the order persists across a reload; reordering is disabled during select mode or an active search.
- [x] Search on Home narrows collections by name alongside the usual list search.
- [x] Select-mode bulk delete of member lists works inside a collection.
- [x] Switching to Spanish shows the translated collection labels.
- [x] `npm run test:all` passes.