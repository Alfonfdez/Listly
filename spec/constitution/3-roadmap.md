# Roadmap

Local-first list manager (React Native / Expo) for iOS, Android, and web.

## 001-home-screen
Status: done.

Lists overview screen (Home):
- Grid/list of lists with name, color, icon, and progress (N/total completed).
- Floating "+" button (FAB) that navigates to Create List.
- Search bar to filter lists and items.
- Tapping a list navigates to the list detail screen.
- Empty state when there are no lists.
- Drawer navigation with Home, Lists, and Settings.
- Spec: spec/features/001-home-screen/.

## 002-db-design
Status: done.

Local database design:
- `lists`: id, name, color, icon, created_at.
- `items`: id, list_id, name, checked, note, position, created_at (FK → lists ON DELETE CASCADE).
- `config`: key-value configuration table (theme, language, text size).
- Drizzle schema, Zod schemas with `z.infer` types, migrations with `PRAGMA user_version`.
- One SQLite engine on all platforms (expo-sqlite native, sql.js + IndexedDB web).
- Spec: spec/features/002-db-design/.

## 003-list-detail-screen
Status: done.

List detail screen with items:
- Item list with checkbox toggle, name, note indicator.
- Add item via input (or modal).
- Edit/delete item.
- Per-list progress indicator.
- Spec: spec/features/003-list-detail-screen/.

## 004-create-list-screen
Status: done.

Screen for creating a new list:
- Name with validation (not empty, not duplicate).
- Color selection from a grid.
- Icon selection from a grid.
- "Create" button with validation.
- Spec: spec/features/004-create-list-screen/.

## 005-settings-screen
Status: done.

Settings screen:
- Single scroll with four sections: Appearance (theme, text size), Regional (language), Personalization (list layout; Show notes / Show photos), Data (export, import, delete all lists, factory reset).
- Config gains `listLayout`, `showNotes`, `showPhotos` (persisted in the `config` table); `ConfigContext` writes through `configRepo.save` and exposes `reload()`.
- List layout drives Home + Lists; note/photo toggles hide those fields everywhere.
- Backup format `{ app: 'Listly', kind: 'backup', formatVersion: 1, schema, data: { lists, items, config } }`; native uses `expo-sharing` + `expo-document-picker`, web uses Blob download + file input.
- `clearDataKeepSettings()` / `resetDatabase()` clean data (and photo files), optionally restoring default settings.
- Drawer separator between Lists and Settings; seed data removed (fresh installs start empty).
- Spec: spec/features/005-settings-screen/.

## 006-create-list-color-picker
Status: done.

Color picker for the Create List screen:
- Quick colors row + custom-color circle.
- "+" opens a full color picker modal (`reanimated-color-picker` panel/hue/opacity + preview) with OK/Cancel.
- Picked custom colors persist as a shortcut circle in the row.
- Spec: spec/features/006-create-list-color-picker/.

## 007-home-and-nav-polish
Status: done.

Home & navigation polish:
- FAB centered at the bottom (Home and Lists).
- Per-screen header with icon + title.
- Distinct "Lists" drawer screen with full-width rows (icon, name, progress).
- Shared grid/list `ListsView` (pre-stages the Settings layout toggle).
- Spec: spec/features/007-home-and-nav-polish/.

## 008-add-item-note
Status: done.

Expandable note area in the add-item bar:
- Chevron toggle reveals a note field below the name input.
- Note is optional and included when creating an item.
- Fields clear and the area collapses after submission.
- Spec: spec/features/008-add-item-note/.

## 009-reorder-lists
Status: done.

Drag-to-reorder lists on Home and Lists:
- Migration 003 adds `lists.position` (backfill + index), `SCHEMA_VERSION` 3; Drizzle/Zod/`ListWithCounts` include `position`; `listRepo` orders by position, appends on create, and `reorder(orderedIds)` persists atomically.
- Home grid and Lists rows are drag-reorderable via `Sortable.Grid` (long-press drag, write-through + refresh); dragging is disabled while a search query is active.
- Spec: spec/features/009-reorder-lists/.

## 010-bulk-select-delete
Status: complete.

Bulk select/delete + header search:
- Multi-select lists (long-press to enter select mode) with bottom action bar (count + delete + cancel).
- Multi-select items (long-press to enter select mode) with the same pattern.
- Bulk delete with confirmation dialog, transactional, refresh after.
- Single list/item delete via long-press in select mode.
- Search toggle moved from inline ListsView to `headerRight` in the navigator for Home and Lists.
- Spec: spec/features/010-bulk-select-delete/.

## 011-item-pictures
Status: done.

Up to 3 pictures per item:
- `items.pictures` TEXT column (JSON array of URIs), migration 004 / `SCHEMA_VERSION` 4.
- "Add photos" section in the expanded details area of the add bar (under the note input) and under the Note field in the edit modal.
- Thumbnail strip on item rows; full-screen viewer on tap.
- Native stores file URIs in the document directory; web stores base64 data URLs inline; photo files cleaned up on item/list delete.
- Spec: spec/features/011-item-pictures/.

## 012-reorder-items
Status: done.

Drag-to-reorder items inside a list:
- `itemRepo.reorder(listId, orderedIds)` persists the new order atomically via `items.position`.
- Sortable list-detail container (`Sortable.Grid`, 1 column); long-press drag; write-through + refresh.
- Reordering disabled with <2 items, while a search query is active, or in select mode.
- Long-press reserved for drag (no longer enters item select mode; select mode stays behind the header toggle).
- Spec: spec/features/012-reorder-items/.

## 013-edit-list
Status: done.

Edit an existing list (name, icon, color):
- Shared `ListForm` component extracted from `CreateListScreen`, reused by the new `EditListScreen` (route `EditList: { listId }`).
- Pencil entry point on the List detail header block navigates to the edit screen.
- Save via `listRepo.update(listId, { name, icon, color })`; duplicate check excludes the edited list itself.
- Delete moved into Edit List: an outlined-red *Delete list* button above Save (confirm → `listRepo.delete` → returns to the overview); the list-detail header no longer shows a delete icon.
- Spec: spec/features/013-edit-list/.

## 014-code-quality
Status: done.

Behavior-preserving code-quality refactor before Settings (005):
- Removed dead code (`utils/language.ts`, `LIST_COLORS`, `useSelectMode.enterSelectMode`, unused hook returns/styles).
- Centralized style tokens/magic values in `componentStyles.ts`; on-primary text uses `c.background`.
- Extracted shared primitives `SelectionCheck`, `FullscreenViewer`, `FormField`, `ListsScreenBase`, and `useDragOrder`; single-source `Config`/`DEFAULT_CONFIG`.
- Unified i18n naming (`Translations`/`LanguageId`) and test layout (`tests/components`, `tests/hooks`, `tests/helpers`) with new-primitive coverage.
- Spec: spec/features/014-code-quality/.

## 015-settings-sections
Status: done.

Settings restructured as a hub with dedicated sub-screens:
- Settings hub (Appearance, Regional, Personalization, Data) navigating to new stack screens.
- `listLayout` split into `homeLayout` (grid) + `listsLayout` (list); new `editShowNotes` / `editShowPhotos` option checkboxes gate the edit-item modal while `showNotes` / `showPhotos` scope to list-detail rows.
- Finly parity: Appearance options carry icons (Dark, Light, System) and size glyphs with one shared button height; Regional shows an uppercase `LANGUAGE` header above the `Language` label over a bordered flag dropdown (emoji on native, SVG on web) with a temporary selection applied via Select / discarded via Cancel; Personalization splits the Lists screen into three background-separated cards (Layout / Item display / Edit item) with no dividers, the last two using "Optional fields" checkboxes.
- Factory reset requires typing `DELETE` in a second modal.
- Spec: spec/features/015-settings-sections/.

## 016-collections
Status: done.

User-defined collections that organize lists, plus a first-class Collections screen, combined select, per-section layouts, and detail/visual polish:
- New `collections` table (id, name, color, icon, created_at, position); `lists.collection_id` nullable FK → collections with a `lists_collection_id` index; `SCHEMA_VERSION` 5 (pre-1.0, the schema is rebuilt from the canonical `createSchema` instead of a versioned migration chain). Drizzle + Zod schemas, DB drift expectations, backup export/import, and `clearDataKeepSettings()` / `resetDatabase()` all cover the new table.
- AppContext groups lists per collection (`listsByCollectionId`) and exposes `baseLists` (standalone lists) + `collections` (`CollectionWithCounts`).
- Home shows a *Collections* section (collection tiles with icon, name, and N/total progress over their member lists) above the standalone *Lists* section; both are drag-reorderable via `Sortable.Grid`, and search scopes collections by name (lists still by name + item names).
- Home FAB opens an "Add" chooser (Add collection / Add list); Lists and Collection modes keep the direct FAB → Create list, and creating inside a collection passes `collectionId` to scope the new list's position.
- Collection detail: header block (tinted icon badge, colored name, N/total), member-list grid with search + select-mode bulk delete, pencil → edit (delete lives on Edit Collection), FAB adds a list into the collection.
- Shared `CollectionForm` (name with `validateCollectionName` + debounced duplicate check excluding the edited collection, icon grid, quick/custom color picker), `CreateCollectionScreen` and `EditCollectionScreen`.
- Drawer gains a *Collections* entry (`albums-outline`) opening a dedicated Collections screen (`ListsScreenBase` in `collections` mode: collections only, grid/list, search, drag-reorder, FAB → Create Collection, header select toggle).
- Home select mode mixes collections and standalone lists (combined `N selected`); *Delete* opens a single modal — the shared `CollectionDeleteModal` chooser (`Delete N collections?`, *Move lists to Lists* / *Delete lists too*) when a selected collection has lists, or one destructive confirm (`Delete N collections and M lists?`) when none do — deleting the standalone lists and collections together with no fallthrough.
- Per-section layout keys `homeCollectionsLayout` / `homeListsLayout` / `collectionsLayout` / `listsLayout` (defaults grid/grid/grid/list; legacy `home_layout` ignored) with Personalization rows for Home Collections, Home Lists, Collections screen, and Lists screen.
- Detail-header cleanup: list/collection detail headers show only search/select toggles (gated on items/member lists); delete moved into the Edit List / Edit Collection screens (outlined-red button above Save, empty → confirm / non-empty → chooser).
- Visual polish: the collection identity icon `albums-outline` replaces folder icons (empty states, Create/Detail headers, Add-chooser); Home's fully-empty state gets a combined "no collections or lists" message (`home-outline`); collections and lists carry a small fixed type badge (`albums-outline` / `list-outline`) plus a colored accent bar (top on grid cards, left on list rows); Home's *Collections* / *Lists* section titles show their type icon, and the *Lists* title appears even when there are only lists; on the Lists screen a collection-list shows its collection name (collection color) under the list name.
- i18n: `collection_*`, `collections_empty`, `home_add_collection`, `home_add_choice_title`, `home_section_lists`, `home_empty_all` / `home_empty_all_hint`, `collection_delete_many_title` / `collection_delete_combined_title` (+ messages), layout/settings keys in both `en` and `es`.
- Spec: spec/features/016-collections/.

## 017-copy-list
Status: done.

Copy a list's contents to the clipboard from the list detail screen:
- Two header-row copy buttons (shown only when the list has items): *Copy names* (`list-outline`) and *Copy all* (`copy-outline`).
- `src/utils/copyList.ts` `buildListCopyText(listName, items, withNotes)` → list name first, then each item in position order; done items prefixed `✅`; notes appended after ` — ` when copying all.
- Clipboard via `expo-clipboard` (`setStringAsync`); transient checkmark + "Copied" feedback.
- Spec: spec/features/017-copy-list/.

## 018-drag-list-into-collection
Status: done.

Drag a standalone list onto a collection on Home to group it:
- `listRepo.moveToCollection(listId, collectionId)` appends the list at the collection's end (`MAX(position) + 1`) in a transaction.
- The collections grid renders each card/row inside `Sortable.BaseZone` under a `Sortable.MultiZoneProvider`; while a list is dragged over a collection it shows an accent highlight (`dropTarget`) + `home_drop_hint` accessibility hint.
- Zones ignore collection drags (collections-grid `onDragStart` clears the dragging-list ref); the drop skips the grid's reorder for that drag.
- On Home the lists grid enables dragging with ≥ 1 list (other screens keep the `> 1` reorder guard), so a lone list can be dragged into a collection.
- Spec: spec/features/018-drag-list-into-collection/.

## 019-remove-list-from-collection
Status: done.

Drag a member list out of a collection on Collection detail to make it standalone:
- A "Remove from collection" target (pill with icon + label) appears above the FAB while a member list is dragged; dropping on it removes the list (`listRepo.removeFromCollection` sets `collection_id = NULL` and appends it at the end of the standalone lists) and skips the grid reorder.
- The target is highlighted while hovered; releasing a member elsewhere keeps reordering within the collection.
- The members grid enables dragging with ≥ 1 list on Collection detail (like Home), so a lone member can be dragged out.
- Spec: spec/features/019-remove-list-from-collection/.

## 020-complete-all-and-clear-completed
Status: done.

Batch actions for a list's items, from a toolbar under the List detail header:
- A bounded-chip toolbar (Complete all / Uncomplete all / Clear completed) shows when the list has items and no search or select mode is active; each button is disabled when its action is a no-op.
- `itemRepo.setAllChecked(listId, checked)` checks/unchecks every item of one list (Complete all / Uncomplete all); `itemRepo.deleteCompleted(listId)` transactionally deletes the checked items (cleaning up their photos) after a destructive confirmation dialog that displays the count.
- Spec: spec/features/020-complete-all-and-clear-completed/.

## 021-pin-favorites
Status: done.

Pin/favorite lists and collections (star) so they stay on top:
- The select-mode action bar gains a star action on Home, Lists, Collections, and Collection detail: **Pin** (`star`) pins every selected list/collection, **Unpin** (`star-outline`) appears when all selected items are already pinned and restores their order; the button is disabled at 0 selected (the icon depicts the result of pressing the button). Runs under `ERROR_SCOPE.pinLists`/`unpinLists`.
- Pinned lists and collections float to the top of their sections (`pinned DESC, position` ordering via `listRepo.setPinned`/`collectionRepo.setPinned`) and show an amber `star` indicator (theme token `c.star`, a11y `home_pinned`) next to the name on grid cards and rows, hidden in select mode.
- Schema: `lists.pinned`, `collections.pinned` (`SCHEMA_VERSION 6`); backup includes the flags and old schema-5 backups import with everything unpinned.
- Spec: spec/features/021-pin-favorites/.

## 022-item-sorting
Status: done.

Per-list sort toggle on List detail (Manual → Name → Created) with a direction arrow, kept in local state (not a settings option):
- A bounded pill (`swap-vertical` + mode label + direction arrow + `chevron-down`) in its own row above the batch toolbar opens the shared `OptionPickerModal` with five one-tap options (Manual, Name asc/desc, Created asc/desc); the pill is primary-tinted and drag-reorder is disabled in non-manual modes.
- Pure `src/utils/itemSort.ts` (`sortItems` stable, case-insensitive numeric-aware `localeCompare` for name, lexicographic for `created_at`); search keeps the active sort applied to filtered results; the choice resets to Manual on re-entry.
- Schema `SCHEMA_VERSION 7`: `items.updated_at` added to DDL/Drizzle/Zod, stamped on create/update/toggle/setAllChecked/reorder; backup round-trips it and leniently defaults it to `created_at` for schema-6 imports.
- i18n en/es keys `item_sort*`. Verified on web at 375px (all sort modes, search retention, drag persistence, reset-to-Manual, Spanish labels).
- Spec: spec/features/022-item-sorting/.

## Future scope (not scheduled)
- Tags, due dates, subtasks, recurring items.
- List templates and sharing.
- Cloud sync / multi-device.