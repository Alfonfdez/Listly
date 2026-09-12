# Mission

## Product
Product name: Listly. A modern, lightweight local-first list manager for mobile and web. Users can create multiple lists (shopping, packing, todos, groceries…), add items with check/uncheck, keep optional notes per item, and search across everything. All data is stored locally in SQLite via Drizzle ORM and validated with Zod. No account, no cloud, no network required.

> **Future scope:** tags, due dates, subtasks, list templates/sharing, cloud sync (not included in the current version).

## Goal
Help users manage any kind of list in a simple, offline-first way: create and organize lists (each with a name, color, and icon), track progress (completed/total per list), and search across lists and items through a clear interface that looks consistent on iOS, Android, and web.

## Principles
- Clean and direct tone.
- Looks the same on iOS, Android, and web.
- Offline-first: same SQLite schema on every platform (expo-sqlite native, sql.js + IndexedDB web).
- Multilingual support, starting with English and Spanish (en/es).
- Dark and light theme with real-time switching.
- Accessibility: text scaling based on user preferences.