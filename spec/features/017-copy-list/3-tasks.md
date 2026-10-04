# 017 — Copy list: Tasks

- [x] Create `spec/features/017-copy-list/` (1-spec, 2-plan, 3-tasks).
- [x] Add `expo-clipboard`.
- [x] Add `src/utils/copyList.ts` (`buildListCopyText`) with unit tests (order, `✅` marker, notes, empty list).
- [x] Wire two copy buttons + transient feedback into `ListDetailScreen` (hidden when empty).
- [x] i18n keys en/es (`list_copy_names`, `list_copy_all`, `list_copied`).
- [x] `ListDetailScreen` copy tests (hidden when empty, present with items, correct clipboard text, confirmation). `npm run test:all` green.
- [x] Verification loop at 375px (copy both variants, format + `✅` markers, hidden on empty) + flip acceptance criteria `[x]`.
- [x] Update roadmap (017 → done), `6-screens.md`, changelog (append at end).
