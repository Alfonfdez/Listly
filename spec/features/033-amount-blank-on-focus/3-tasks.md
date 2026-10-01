# 033 - Blank the amount field on focus when it is zero — Tasks

- [x] Create `spec/features/033-amount-blank-on-focus/` (1-spec, 2-plan, 3-tasks).
- [x] `useItemDraft`: `onAmountFocus` (blank when empty/zero, remember prior) + `onAmountBlur` (restore if untouched) + touched flag in `onAmountChange`; reset on `applySeed`.
- [x] `ItemFields.ItemAmountField`: accept and forward optional `onFocus` / `onBlur`.
- [x] Wire `ItemFormModal` and `AddItemBar` to the draft focus/blur handlers.
- [x] Tests: `useItemDraft` (blank-when-zero, keep-non-zero, restore-untouched, typed-persists, null-stays-null) + `ItemFormModal` integration. `npm run test:all` green.
- [x] Verification loop at 375px (edit 0.00 / 1.20 cases, add bar) + acceptance criteria `[x]`.
- [x] Update roadmap (`033-amount-blank-on-focus`) + changelog.
