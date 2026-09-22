# 004 — Create list screen: Tasks

- [x] Create `spec/features/004-create-list-screen/` (1-spec, 2-plan, 3-tasks).
- [x] Add `src/constants/listIcons.ts` (`LIST_ICONS`) and `src/constants/listColors.ts` (`LIST_COLORS`).
- [x] Add `validateListName(value, exists, maxLength)` to `src/utils/validation.ts`.
- [x] Add i18n keys to `en.ts`/`es.ts`.
- [x] Rewrite `src/screens/CreateListScreen.tsx` (form + debounced duplicate + grids).
- [x] Add `validateListName` cases to `tests/utils/validation.test.ts`.
- [x] Add `tests/screens/CreateListScreen.test.tsx` (render, validation, debounce, create flow).
- [x] `npm run test:all` green.
- [x] Verification loop at 375px + flip acceptance criteria `[x]`.
- [x] Update roadmap (004 → done), harnesses baseline, changelog (append at end).