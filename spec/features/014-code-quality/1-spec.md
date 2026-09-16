# 014 — Code-quality refactor

- **Objective**
  Behavior-preserving cleanup pass before implementing Settings (005): remove dead code, centralize style tokens/magic values, extract duplicated UI/logic into shared primitives, fix naming/types, and unify the test layout. No user-visible behavior changes.

---

## Functional requirements

### 1. Dead code removal
- Delete `src/utils/language.ts` and the unused `LIST_COLORS` export (`QUICK_COLORS` stays).
- Drop unused API surface: `useSelectMode.enterSelectMode`, unused returns of `useColorSelection`, and dead styles/imports in `ItemRow`.

### 2. Style tokens and magic values
- `src/components/componentStyles.ts` becomes the single home for shared style values: overlay/viewer backgrounds, shadows, pressed/disabled opacity, icon-button padding, selection-check size/radius, alpha tint/badge/track levels, grid gap, and responsive breakpoints.
- Replace inline literals (`#FFFFFF`, `rgba(...)`, alpha hex like `'15'`, magic radii/sizes) across components with these tokens.
- Convention: text/icons on a primary-colored surface use `c.background`; `WHITE` stays only on fixed dark overlays (`FullscreenViewer`/viewers) and arbitrary user swatches (`ColorGrid`).

### 3. Shared primitives (extract duplicated markup/logic)
- `SelectionCheck` — one selectable check indicator used by `ItemRow`, `ListCard`, `ListRow`.
- `FullscreenViewer` — one dark full-screen modal shell; `NoteViewer` and `PhotoViewer` become thin wrappers.
- `FormField` — label + optional error wrapper used by `ListForm` and `ItemFormModal`.
- `ListsScreenBase({ variant })` — collapses the duplicated `HomeScreen`/`ListsScreen` logic; each screen is a thin wrapper choosing `variant`.
- `useDragOrder` — shared drag-reorder state/guard hook used by `ListsView` and `ListDetailScreen`, preserving `sortEnabled` guards and the no-op-if-unchanged check.

### 4. Naming and types
- i18n: the translation-shape type is named `Translations` (was a second `Language`); the language id type is `LanguageId`; the language map is `Record<LanguageId, Translations>` (no `Record<string, ...>` drift).
- Single source for config: one `Config` type (`database/types.ts`) and one `DEFAULT_CONFIG` (`database/configDefaults.ts`), imported by `ConfigContext`.
- `ItemRow` accessibility role is a plain `"checkbox"` (no tautological ternary); `proxy.ts` switch handles the `values`/`all` methods explicitly with no silent `default`.

### 5. Test layout
- Component tests live under `tests/components/`; hook tests under `tests/hooks/`; shared stubs under `tests/helpers/`; setup/import paths updated to match.
- New primitives get unit tests (`SelectionCheck`, `FullscreenViewer`, `FormField`, `useDragOrder`).

---

## Non-functional requirements

- **No behavior change**: `npm run test:all` (typecheck + lint + tests) stays green after every phase; live web screens render identically at 375px with 0 console errors.
- **Constraints honored**: no `any`; strict TypeScript; existing i18n en/es parity; `sortEnabled` guards and reorder no-op semantics unchanged.
- **Docs**: `docs/harnesses.md` reflects the new test layout and suite baseline; changelog + roadmap updated.

---

## Acceptance criteria

- [x] `npm run test:all` is green (typecheck + lint + all tests) with no `any` introduced.
- [x] Dead code is gone (`utils/language.ts`, `LIST_COLORS`, `useSelectMode.enterSelectMode`, unused hook returns/styles) with no remaining references.
- [x] Shared tokens cover the former magic values; no stray `#FFFFFF`/literal alpha/radii remain outside the token file (documented exceptions: `WHITE` on fixed dark overlays/user swatches, `ItemRow` thumbnail radius).
- [x] `SelectionCheck`, `FullscreenViewer`, `FormField`, `ListsScreenBase`, and `useDragOrder` are used by all previous call sites with unchanged behavior.
- [x] `Config`/`DEFAULT_CONFIG` have a single source; i18n uses `Translations`/`LanguageId` with a typed language map.
- [x] Tests are organized under `tests/components/`, `tests/hooks/`, `tests/helpers/` and the new primitives are covered.
- [x] Web verification at 375px (Home, Lists, List detail, create/edit list, item modal, note/photo viewers, reorder) shows no visual or behavioral regression and 0 console errors.
