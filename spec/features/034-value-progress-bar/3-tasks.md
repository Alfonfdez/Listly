# 034 - Value progress bar (numeric lists) — Tasks

- [x] Create `spec/features/034-value-progress-bar/` (1-spec, 2-plan, 3-tasks).
- [x] `numeric.ts`: `valueProgressPercent(totalMinor, doneMinor)` + `formatPercent2(pct)`.
- [x] `DetailHeader`: `valueProgress` prop, reserved fixed-height slot for numeric lists, bar fill + `done / total` + right-aligned percent, a11y label.
- [x] `ListDetailScreen`: derive `showValueBar`/`valuePct` from `totals` and pass `valueProgress`.
- [x] Tests: numeric helpers; `DetailHeader` (shown/reserved/absent); `ListDetailScreen` (numeric toggle; header height stable). `npm run test:all` green.
- [x] Verification loop at 375px (numeric toggle, hidden-state height, standard unaffected, 0 console errors) + acceptance criteria `[x]`.
- [x] Update roadmap (`034-value-progress-bar`) + `docs/harnesses.md` baseline + changelog.
