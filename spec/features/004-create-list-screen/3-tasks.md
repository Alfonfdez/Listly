# 004 — Create list screen: Tasks

- [ ] Create `spec/features/004-create-list-screen/` (1-spec, 2-plan, 3-tasks).
- [ ] Add `src/constants/listIcons.ts` (`LIST_ICONS`) and `src/constants/listColors.ts` (`LIST_COLORS`).
- [ ] Add `validateListName(value, exists, maxLength)` to `src/utils/validation.ts`.
- [ ] Add i18n keys to `en.ts`/`es.ts`.
- [ ] Rewrite `src/screens/CreateListScreen.tsx` (form + debounced duplicate + grids).
- [ ] Add `validateListName` cases to `tests/utils/validation.test.ts`.
- [ ] Add `tests/screens/CreateListScreen.test.tsx` (render, validation, debounce, create flow).
- [ ] `npm run test:all` green.
- [ ] Verification loop at 375px + flip acceptance criteria `[x]`.
- [ ] Update roadmap (004 → done), harnesses baseline, changelog (append at end).