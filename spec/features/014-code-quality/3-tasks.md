# 014 — Code-quality refactor: Tasks

- [x] Create `spec/features/014-code-quality/` (1-spec, 2-plan, 3-tasks).
- [x] Remove dead code: `utils/language.ts`, `LIST_COLORS`, `useSelectMode.enterSelectMode`, unused hook returns, dead `ItemRow` styles.
- [x] Centralize tokens in `componentStyles.ts`; replace inline literals (`#FFFFFF`, rgba, alpha hex, magic radii/sizes) across components.
- [x] Extract `SelectionCheck`, `FullscreenViewer` (NoteViewer/PhotoViewer), `FormField`, `ListsScreenBase` (Home/Lists wrappers), `useDragOrder`.
- [x] Naming/types: `Translations` / `LanguageId` + typed `Record<LanguageId, Translations>`; single `Config` + `DEFAULT_CONFIG`; `ItemRow` role `"checkbox"`; `proxy.ts` explicit `values`/`all`.
- [x] Reorganize tests under `tests/components/`, `tests/hooks/`, `tests/helpers/`; add unit tests for the new primitives.
- [x] `npm run test:all` green after every phase (no `any`, no behavior change).
- [x] Verification loop at 375px (Home, Lists, List detail, create/edit list, item modal, note/photo viewers, reorder — no regression, 0 console errors) + flip acceptance criteria `[x]`.
- [x] Update roadmap (014 → done), `docs/harnesses.md` baseline/layout, changelog (append at end).
