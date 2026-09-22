# 016 - Collections

- **Objective**
  Give collections a first-class home: user-defined, named/colored/icon-carrying collections that group lists (`lists.collection_id` nullable FK); a *Collections* section on Home above the standalone lists; a dedicated *Collections* screen reached from the drawer (browse, search, reorder, bulk-delete); collection detail screens with the same list grid/select/search behavior as Home; create/edit collection forms; a combined select mode on Home that mixes collections and standalone lists in one deletion flow; per-section grid/list layout preferences; detail-header cleanup so the delete action is always reachable; and a clear visual distinction between collections and lists (a fixed type badge) with a consistent `albums-outline` collection identity icon.

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

### 4. Collections screen
- The drawer gains a *Collections* entry (icon `albums-outline`) between *Home* and *Lists*; it opens a dedicated screen that reuses `ListsScreenBase` in `collections` mode (title *Collections*).
- The Collections screen shows only collections (never standalone lists), as the chosen layout (`collectionsLayout`: grid tiles or list rows), with an empty state ("No collections yet" + hint, `albums-outline` icon) when there are none.
- Search narrows collections by name; drag-reorder persists through `collectionRepo.reorder` and is disabled during select mode or an active search.
- FAB inside the Collections screen opens Create Collection directly; the header select toggle enables bulk select of collections.

### 5. Combined collection + list select on Home
- On Home, select mode applies to collections *and* standalone lists together: tapping either type toggles it, and the action bar count shows the combined selection (`N selected`).
- Pressing *Delete* (Home) with collections selected opens a single modal:
  - if at least one selected collection has member lists → the shared chooser (`Delete N collections?`, the selected names listed when more than one) with *Move lists to Lists* / *Delete lists too*; a message clarifies that the selected standalone lists are also deleted;
  - otherwise → a single destructive confirm (`Delete N collections and M lists?`, or `Delete N collections?` when no lists are selected).
- Either way the standalone lists and the collections are deleted in one action (no second modal); with only lists selected, Delete uses the existing lists confirm dialog.
- The Collections screen supports the same combined-select deletion on its own collection list via the shared `CollectionDeleteModal`.

### 6. Collection detail
- Header block: tinted icon badge, collection name in its color, `N/total` progress, edit pencil → Edit Collection; trash opens the delete flow.
- Body: the member lists as a grid (`CollectionDetail`), reusing search, select-mode bulk delete (`SelectionActionBar` + confirm), reorder, and empty state from `ListsView`.
- FAB inside a collection navigates to Create List with `collectionId`, so the new list is added to this collection (not Home).
- Delete flow: empty collection → single confirmation; non-empty → choice modal with *Move lists to Lists* (sets `collection_id` null, keeps the lists) or *Delete lists too* (cascades and cleans up item photos).

### 7. Create / Edit collection
- Shared `CollectionForm`: name (validation via `validateCollectionName` — required / max `MAX_COLLECTION_NAME_LENGTH` / duplicate — with a debounced `existsByName` check that excludes the edited collection), icon grid, and the quick/custom color picker.
- Create Collection seeds the default icon/color and persists through `collectionRepo.create`; Edit Collection prefills and saves through `collectionRepo.update`; both refresh and go back on success.

### 8. Shared collection delete modal
- New shared `CollectionDeleteModal` (title, optional name list for multi-select, *Move lists to Lists* / *Delete lists too* options, cancel, and a clarifying message when standalone lists are also selected) reused by Home/Lists/Collections combined select and by Collection detail, keeping one behavior everywhere.
- When the selected collections all have no member lists, the flow collapses to a single destructive confirm (no move/delete-too chooser) and deletes the collections and any selected standalone lists together.
- Collection detail wires the header trash through it: empty collection → single confirm; non-empty → the chooser.

### 9. Per-section layout preferences
- New config keys `homeCollectionsLayout`, `homeListsLayout`, `collectionsLayout`, `listsLayout` (all grid/list), stored in the `config` table (`home_collections_layout`, `home_lists_layout`, `collections_layout`, `lists_layout`), covering DB read/write validation and `PRAGMA`-agnostic `DB_KEY_MAP` decode.
- Defaults: grid for Home collections, Home lists, and the Collections screen; list for the Lists screen. The legacy `home_layout` row is no longer read (ignored on load), so existing installs keep the new defaults.
- Personalization settings gains layout rows: Home screen (*Collections* and *Lists* sections) and Collections screen (*Layout*), replacing the old single lists rule; the existing Lists screen *Layout* row remains.
- Home renders collections with the `homeCollectionsLayout` variant and standalone lists with `homeListsLayout`; the Collections screen uses `collectionsLayout`; the Lists screen uses `listsLayout`.

### 10. Detail-screen header cleanup
- List detail: the list delete (trash) button is always present in `headerRight`; search and select toggles appear only when the list has items.
- Collection detail: the delete (trash) button is always present; search and select toggles appear only while the collection has member lists.
- The delete (trash) button is separated from the search/select toggles with extra spacing when those toggles are present (no extra spacing when it is the only icon).

### 11. Collection/list visual polish (icons, empty state, type badge, accent bar, section titles)
- The collection identity icon is `albums-outline` everywhere a folder icon used to appear: the Collections screen and collection-detail empty states, the Create collection / Collection detail header icons, and the Home FAB *Add collection* chooser row.
- Home's fully-empty state (no collections *and* no lists) shows a distinct message + hint ("No collections or lists yet" / "Tap + to create your first collection or list", `home-outline` icon); the Lists screen keeps the existing lists-only empty state.
- Collections and lists carry a small fixed *type badge* so they are distinguishable in both grid and list layouts: `albums-outline` for collections, `list-outline` for lists, positioned top-right on grid cards and trailing on list rows, and hidden in select mode (where `SelectionCheck` occupies the corner).
- Collections additionally carry a colored *accent bar* (top edge on grid cards, left edge on list rows) in the collection's color, reinforcing the container look beyond the type badge.
- On Home, the *Collections* and *Lists* section titles render with a leading type icon (`albums-outline` / `list-outline`); the *Lists* title appears whenever Home has standalone lists (not only when collections are also present).

### 12. i18n
- All new strings live in `en` and `es` (`collection_*`, `collections_empty`, `home_add_collection`, `home_add_choice_title`, `home_section_lists`, `home_empty_all` / `home_empty_all_hint`, `collection_delete_*` (single/many/combined variants + messages), `settings_collections_screen`, `settings_list_layout`, `layout_grid`, `layout_list`) and are read through `useLabels()`.

---

## Non-functional requirements

- **TypeScript strict**, no `any`; theme tokens and `fs()` for all styling; no magic strings (i18n keys, typed validation error codes, `MAX_COLLECTION_NAME_LENGTH`, layout values via `LIST_LAYOUTS`).
- **Multilingual**: every label in both `en` and `es`, reactive to the configured language via `useLabels()`.
- **Tests**: DB drift guards `collections` + `collection_id`; repo/schema/backup suites cover schema 5; config suite covers the four layout keys; `collectionRepo.deleteMany(ids, mode)` move/cascade unit tests; screen/component tests cover the Home Add chooser (both navigations), the collection detail flows, the Collections screen, the combined Home selection flow (single modal: chooser move/cascade, empty-collection confirm, cancel), the collection detail chooser, the List detail always-visible trash, and the type badges; fixture helpers extended (`setCollections`, `setBaseLists`, `buildList` `collection_id`, config stub layout keys).
- **Verification**: `npm run test:all` passes, and the web loop at 375px exercises the criteria below with 0 console errors.

---

## Acceptance criteria

- [x] Home renders a *Collections* section above *Lists* with collection tiles (icon, name, N/total); tapping a tile opens the collection detail, and a list created inside a collection updates the tile's progress without ever showing as standalone.
- [x] The Home FAB opens an Add chooser; *Add collection* opens Create Collection and *Add list* opens Create List.
- [x] Create Collection validates the name (required/too long/duplicate) and persists the icon and color; Edit Collection prefills and saves without flagging its own name as a duplicate.
- [x] Collection detail shows the header block (badge, colored name, N/total) and its member lists as a grid with an empty-state hint.
- [x] Deleting a non-empty collection offers *Move lists to Lists* (lists survive as standalone) and *Delete lists too* (lists and their items/photos are removed); deleting an empty collection uses a single confirmation.
- [x] Collections reorder by drag on Home and the Collections screen, and the order persists across a reload; reordering is disabled during select mode or an active search.
- [x] Search narrows collections by name (on Home alongside the list search, and on the Collections screen).
- [x] Select-mode bulk delete of member lists works inside a collection.
- [x] The drawer shows a *Collections* entry that opens a Collections screen showing only collections with the chosen layout, an empty state when none exist, and a FAB that creates a collection.
- [x] Home select mode selects collections and standalone lists together, the count combines them, and *Delete* shows a single modal: the `Delete N collections?` chooser (Move lists to Lists / Delete lists too) when a selected collection has lists, or a `Delete N collections and M lists?` confirm when none do — with no second modal for the standalone lists.
- [x] Cancelling the collection chooser deletes nothing and keeps the selection intact.
- [x] Personalization offers Grid/List for Home *Collections*, Home *Lists*, the Collections screen, and the Lists screen; toggling a layout changes the corresponding section and persists across a reload (new installs start with the documented defaults).
- [x] List detail shows the trash button even when the list is empty, without search/select toggles; collection detail also shows trash on an empty collection (single confirm) and the chooser on a non-empty one.
- [x] The detail-screen delete (trash) button is visually separated from the search/select toggles when those are present.
- [x] Collections and lists carry a fixed type badge (`albums-outline` / `list-outline`) in both grid and list layouts so they are visually distinguishable; collections additionally carry a colored accent bar (top edge on grid cards, left edge on list rows).
- [x] The collection identity icon `albums-outline` appears in the Add-chooser row, the Create/Detail headers, and the Collections/collection-detail empty states; Home's fully-empty state shows a combined "no collections or lists" message with the `home-outline` icon.
- [x] On Home, the *Collections* and *Lists* section titles show their type icon, and the *Lists* title appears even when there are only lists (no collections).
- [x] Switching to Spanish shows the translated collection labels, layout and delete-chooser labels.
- [x] `npm run test:all` passes.
