# 007 — Home & navigation polish: Tasks

- [x] Create `spec/features/007-home-and-nav-polish/` (1-spec, 2-plan, 3-tasks).
- [x] Center the FAB (`alignSelf: 'center'`, `bottom: 56`).
- [x] Add `ListRow` (full-width icon/name/progress row) and `ListsView` (shared grid/list body) components.
- [x] Make `HomeScreen`/new `ListsScreen` wrappers over `ListsView` (`grid`/`list`).
- [x] Add `Lists` route to `RootStackParamList` + stack; `HeaderTitle` icon support; per-screen icon/label; drawer reset targets Home/Lists.
- [x] Add `list_detail_title` i18n key (en/es).
- [x] Add `tests/screens/ListsScreen.test.tsx` (rows, search, FAB, row → ListDetail, empty state).
- [x] `npm run test:all` green (including existing HomeScreen suite).
- [x] Verification loop at 375px + flip acceptance criteria `[x]`.
- [x] Update roadmap (007 → done), harnesses baseline, changelog (append at end).