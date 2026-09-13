# 003 — List detail screen: Tasks

## Tasks

### 1. Spec
- [x] Write `1-spec.md` (requirements + acceptance criteria).
- [x] Write `2-plan.md`.
- [ ] (Verification) flip acceptance criteria `[ ]` → `[x]` after browser verification.

### 2. Validation helper
- [ ] `src/utils/validation.ts`: `validateItemName(value, existingNames, maxLength)` returning an i18n error key/string or `null`; trim + non-empty + max-length + case-insensitive duplicate rules.
- [ ] `tests/utils/validation.test.ts` covering normal, whitespace-only, > max, and duplicate (incl. case-insensitive) cases.

### 3. i18n
- [ ] Add keys to `en.ts`/`es.ts`: `item_add_placeholder`, `item_add`, `item_empty`, `item_empty_hint`, `item_edit_title`, `item_name_label`, `item_note_label`, `item_save`, `item_delete`, `item_confirm_delete`, `item_name_required`, `item_name_duplicate`, `item_name_max`.

### 4. Components
- [ ] `src/components/ItemRow.tsx`: checkbox toggle, struck name when done, note indicator, `onToggle` + `onEdit`.
- [ ] `src/components/ItemFormModal.tsx`: modal with name/note inputs, Save/Cancel, validation messages, Delete + confirm state.

### 5. Screen
- [ ] `src/screens/ListDetailScreen.tsx`: resolve `listId` → list + items; in-screen header (icon/name/color + progress bar); FlatList of rows; inline add input (validates, `position = max + 1`, calls `itemRepo.create` + `refresh`); edit modal (save via `itemRepo.update`, delete via confirm + `itemRepo.delete`); empty state; `useFocusEffect` refresh.

### 6. Tests
- [ ] `tests/component/ItemRow.test.tsx`.
- [ ] `tests/screens/ListDetailScreen.test.tsx` (mock `src/database` itemRepo + configStub/appStub).
- [ ] `npm run test:all` green.

### 7. Verification (verification-loop skill)
- [ ] Boot Expo web at 375px, check each acceptance criterion in a real browser.
- [ ] Flip all `[ ]` → `[x]` in `1-spec.md`.
- [ ] Roadmap 003 → `done`; update `docs/harnesses.md` baseline and append `docs/changelog.md` entry.