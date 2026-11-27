# 035 - Form name feedback (create/edit list and collection) - Tasks

- [x] Create `spec/features/035-form-name-feedback/` (1-spec, 2-plan, 3-tasks).
- [x] `CharCounter`: medium weight normally, red + bold at `current >= max`.
- [x] `FormField`: optional right slot for the counter in the label row.
- [x] New `FormHint`: reserved two-line band with `role="alert"` + polite live region.
- [x] `EntityForm`: touched on change/blur, red border on error, counter in the label row, hint above the submit button.
- [x] Tests: `CharCounter`; `CreateListScreen` (clean mount, counter, blur, bold at max); `EditListScreen` (counter, cleared name); `EditCollectionScreen` (counter). `npm run test:all` green.
- [x] Re-capture `03-create-list` / `05-edit-list` (full set) and verify at 375px.
- [x] Update roadmap (`035-form-name-feedback`) + `docs/harnesses.md` baseline + changelog.
