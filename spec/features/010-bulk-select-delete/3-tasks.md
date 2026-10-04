# 010 — Bulk select/delete + header search: Tasks

- [x] Create `spec/features/010-bulk-select-delete/` (1-spec, 2-plan, 3-tasks).
- [x] Add `listRepo.deleteMany(ids)` and `itemRepo.deleteMany(ids)` (single transaction, no-op on empty) with contract tests.
- [x] Add `useSelectMode` (enter/toggle/exit, delete-confirm, `confirmDelete` → `deleteMany`), `ConfirmModal`, `SelectionActionBar`.
- [x] Rewrite `ListsView` with external search/select state: search toggle moved to `headerRight`, FAB hidden + action bar in select mode, sort disabled in select/search, bulk-delete confirm.
- [x] `ListCard`/`ListRow`/`ItemRow` select-mode props (highlight + check badge); `ItemRow` hides edit in select mode.
- [x] `HomeScreen`/`ListsScreen` own search state + `useSelectMode`; set `headerRight` search toggle (tinted when active); `ListDetailScreen` item select mode + `SelectSearchHeader`.
- [x] i18n keys in en/es; `filterItemsByQuery` (items by name/note).
- [x] Tests: `ListsView`, `SelectToggleButton`, screen header/select/bulk-delete flows, `filterItemsByQuery`, contract `deleteMany`. `npm run test:all` green.
- [x] Verification loop at 375px (header search toggle, select mode entry/exit, bulk delete lists + items, tinted icon, 0 console errors) + flip acceptance criteria `[x]`.
- [x] Update roadmap (010 → done), harnesses baseline, changelog (append at end).
