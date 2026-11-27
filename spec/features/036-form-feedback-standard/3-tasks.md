# 036 - Form feedback standard (counters and validation) - Tasks

- [x] Create `spec/features/036-form-feedback-standard/` (1-spec, 2-plan, 3-tasks).
- [x] `ItemFields`: `showCounter` prop for Name/Note.
- [x] `ItemFormModal`: counters in the Name/Note label rows, red name border, 3 name lines / 7 note lines, 64×64 photo tiles and an 8px gap to the buttons.
- [x] `EntityForm`: inline name error under the field (keyboard-safe); `FormHint` band and component removed.
- [x] `AddItemBar`: red name border on error (counters stay under the inputs).
- [x] `LockListModal`: red border on the passphrase/confirm/current field per error.
- [x] `PHOTO_METRICS.regular`: 64×64 tiles + `images-outline` icon (add bar unchanged at 56); modal photo→buttons gap 8px.
- [x] Tests: ItemFields, ItemFormModal, LockListModal, ListDetailScreen, PhotoSection. `npm run test:all` green.
- [x] Design-system standard + roadmap `036` + changelog + harness baseline.
- [ ] Re-capture `06-b-item-edit` as `-v2` and update the 9 READMEs (deferred to the next UI batch).
