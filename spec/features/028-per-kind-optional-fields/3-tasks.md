# 028 - Per-kind optional fields — Tasks

- [x] Create `spec/features/028-per-kind-optional-fields/` (1-spec, 2-plan, 3-tasks).
- [x] Config: add `showNotesNumeric` / `showPhotosNumeric` / `editShowNotesNumeric` / `editShowPhotosNumeric` to `configSchema`, `DEFAULT_CONFIG` and `DB_KEY_MAP` (all `true`).
- [x] `useItemDisplayFlags(numeric)` hook resolving the effective flag pair.
- [x] `ItemRow` / `AddItemBar` / `ItemFormModal` read flags through the hook.
- [x] Personalization: Standard / Numeric groups, four optional-field cards.
- [x] i18n `settings_standard_lists` / `settings_numeric_lists` (en/es).
- [x] Tests: configStub, schemas, dbDrift, backup (round-trip + legacy defaults), Personalization, `useItemDisplayFlags`, `ItemRow.perKind`, AddItemBar / ItemFormModal kind cases. `npm run test:all` green.
- [ ] Verification loop at 375px (standard + numeric lists, en/es, 0 console errors) + flip acceptance criteria `[x]`.
- [ ] Update roadmap (028 entry + status), `docs/harnesses.md` baseline, changelog.
