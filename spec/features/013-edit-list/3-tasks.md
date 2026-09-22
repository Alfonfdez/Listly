# 013 — Edit list: Tasks

- [x] Create `spec/features/013-edit-list/` (1-spec, 2-plan, 3-tasks).
- [x] Extract `ListForm` from `CreateListScreen` (name + counter, icon grid, color grid + picker, debounced duplicate validation, submit); `CreateListScreen` becomes a thin wrapper.
- [x] Add `EditListScreen` (route `EditList: { listId }`): pre-fill, `excludeId` duplicate check, `listRepo.update` + refresh + goBack, not-found state.
- [x] Pencil button on `ListDetailScreen` header block → `EditList`.
- [x] Register `EditList` in `AppNavigator`; add `EditList` to `RootStackParamList`; i18n keys `edit_list_title` / `list_edit_label` / `list_save`.
- [x] Tests: `EditListScreen` (prefill, duplicate-excludes-self, save+goBack, not-found), `ListDetailScreen` pencil navigation; existing `CreateListScreen` stays green. `npm run test:all` green.
- [x] Verification loop at 375px (pencil → pre-filled edit, save name/icon/color, header updates, duplicate error, same-name save) + flip acceptance criteria `[x]`.
- [x] Update roadmap (013 → done), harnesses baseline, changelog (append at end).
