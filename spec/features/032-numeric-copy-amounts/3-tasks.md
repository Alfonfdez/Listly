# 032 - Numeric copy text (amounts, quantities, sums) — Tasks

- [x] Create `spec/features/032-numeric-copy-amounts/` (1-spec, 2-plan, 3-tasks).
- [x] `buildListCopyText` options object: `{ withNotes, numeric?, labels? }`; standard output unchanged.
- [x] Numeric item lines: `[✅ ]name — amount × quantity = lineTotal` (always shows the segment, incl. qty 1; null amount = `0.00`).
- [x] Footer for numeric non-empty lists: blank line, `Total:` (all) + `Done:` (checked), localized labels passed in.
- [x] `useClipboardCopy`: pass `numeric` + `labels` (from `useLabels()`) into the builder.
- [x] Tests: numeric qty>1 / qty=1 / null amount / checked / with-notes / footer sums / empty (no footer) + standard regression. `npm run test:all` green.
- [x] Verification loop at 375px (copy numeric with/without notes + standard list, paste, 0 console errors) + acceptance criteria `[x]`.
- [x] Update roadmap (`032-numeric-copy-amounts`) + changelog.
