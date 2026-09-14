# 006 — Create list color picker: Tasks

- [x] Create `spec/features/006-create-list-color-picker/` (1-spec, 2-plan, 3-tasks).
- [x] Install `reanimated-color-picker@^5.1.2` + `react-native-svg`.
- [x] Add `MODAL_BORDER_RADIUS`, `OVERLAY_BG` to `componentStyles`; add `QUICK_COLORS` to `listColors`.
- [x] Add hooks `useColorSelection`, `useResetOnOpen`.
- [x] Add components `ModalShell`, `ModalFooter`, `ColorGrid`, `ColorPickerModal`.
- [x] Add i18n keys (`color_picker_title`, `color_picker_cancel`, `color_picker_ok`, `color_grid_more`) to en/es.
- [x] Rewire `CreateListScreen` color section to `ColorGrid` + modal.
- [x] Add `tests/components/ColorGrid.test.tsx` + `ColorPickerModal.test.tsx`; update `tests/screens/CreateListScreen.test.tsx`.
- [x] `npm run test:all` green.
- [x] Verification loop at 375px (includes real picker interaction on web) + flip acceptance criteria `[x]`.
- [x] Update roadmap (006 → done), harnesses baseline, changelog (append at end).