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
Status: not started.

Settings screen:
- Appearance: Theme (dark/light/system), text size.
- Regional: Language (en/es).
- Layout: grid vs full-width list view for lists (config stored; pre-staged by feature 007 List row view).
- Spec: to be created when started.

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

## Future scope (not scheduled)
- Tags, due dates, subtasks, recurring items.
- List templates and sharing.
- Cloud sync / multi-device.