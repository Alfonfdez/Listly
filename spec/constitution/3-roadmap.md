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
- Collection detail: header block (tinted icon badge, colored name, N/total), member-list grid with search + select-mode bulk delete, pencil → edit, trash → move-lists-to-Lists or delete-lists-too (single confirm when empty), FAB adds a list into the collection.
- Shared `CollectionForm` (name with `validateCollectionName` + debounced duplicate check excluding the edited collection, icon grid, quick/custom color picker), `CreateCollectionScreen` and `EditCollectionScreen`.
- Drawer gains a *Collections* entry (`albums-outline`) opening a dedicated Collections screen (`ListsScreenBase` in `collections` mode: collections only, grid/list, search, drag-reorder, FAB → Create Collection, header select toggle).
- Home select mode mixes collections and standalone lists (combined `N selected`); *Delete* opens the shared `CollectionDeleteModal` (`Delete N collections?`, *Move lists to Lists* / *Delete lists too*), falling through to the lists confirm for any still-selected lists.
- Per-section layout keys `homeCollectionsLayout` / `homeListsLayout` / `collectionsLayout` / `listsLayout` (defaults grid/grid/grid/list; legacy `home_layout` ignored) with Personalization rows for Home Collections, Home Lists, Collections screen, and Lists screen.
- Detail-header cleanup: list detail trash always present (search/select only with items); collection detail trash always present (empty → single confirm, non-empty → chooser).
- Visual polish: the collection identity icon `albums-outline` replaces folder icons (empty states, Create/Detail headers, Add-chooser); Home's fully-empty state gets a combined "no collections or lists" message (`home-outline`); collections and lists carry a small fixed type badge (`albums-outline` / `list-outline`) in grid and list layouts.
- i18n: `collection_*`, `collections_empty`, `home_add_collection`, `home_add_choice_title`, `home_section_lists`, `home_empty_all` / `home_empty_all_hint`, `collection_delete_many_title`, layout/settings keys in both `en` and `es`.
- Spec: spec/features/016-collections/.

## Future scope (not scheduled)
- Tags, due dates, subtasks, recurring items.
- List templates and sharing.
- Cloud sync / multi-device.