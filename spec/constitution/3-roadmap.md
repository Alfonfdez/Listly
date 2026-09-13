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
Status: not started.

Screen for creating a new list:
- Name with validation (not empty, not duplicate).
- Color selection from a grid.
- Icon selection from a grid.
- "Create" button with validation.
- Spec: to be created when started.

## 005-settings-screen
Status: not started.

Settings screen:
- Appearance: Theme (dark/light/system), text size.
- Regional: Language (en/es).
- Spec: to be created when started.

## Future scope (not scheduled)
- Tags, due dates, subtasks, recurring items.
- List templates and sharing.
- Cloud sync / multi-device.