# 014 — Code-quality refactor: Plan

## Architecture

A behavior-preserving cleanup before Settings (005): remove dead code, centralize tokens, extract shared primitives, and unify naming/types and the test layout. No user-visible change.

## Scope

| Area | Change |
|------|--------|
| Dead code | Remove `src/utils/language.ts`, `LIST_COLORS`, `useSelectMode.enterSelectMode`, unused `useColorSelection` returns, dead `ItemRow` styles |
| Tokens | `src/components/componentStyles.ts` owns overlay/viewer backgrounds, shadows, opacity, icon padding, selection-check size, alpha tint/badge/track, grid gap, breakpoints |
| Primitives | `SelectionCheck`, `FullscreenViewer` (NoteViewer/PhotoViewer), `FormField`, `ListsScreenBase`, `useDragOrder` |
| Types | `Translations` / `LanguageId` + typed language map; single `Config` + `DEFAULT_CONFIG`; `ItemRow` role plain `"checkbox"`; `proxy.ts` explicit `values`/`all` |
| Tests | `tests/components/`, `tests/hooks/`, `tests/helpers/` layout |

## Components

| Component | Location | Change |
|-----------|----------|--------|
| `componentStyles.ts` | `src/components/` | Single source of tokens |
| `SelectionCheck` | `src/components/SelectionCheck.tsx` | **New** — shared check indicator |
| `FullscreenViewer` | `src/components/FullscreenViewer.tsx` | **New** — dark full-screen shell |
| `FormField` | `src/components/FormField.tsx` | **New** — label + error |
| `ListsScreenBase` | `src/screens/ListsScreenBase.tsx` | **New** — shared Home/Lists wrapper |
| `useDragOrder` | `src/hooks/useDragOrder.ts` | **New** — shared reorder state + guards |
| `textStyles.ts` | `src/components/textStyles.ts` | **New** — section-title tokens |

## Risks / notes

- `npm run test:all` stays green after every phase; live web renders identically at 375px with 0 console errors.
- Preserve `sortEnabled` guards and reorder no-op-if-unchanged semantics.
- Convention: on-primary text uses `c.background`; `WHITE` stays only on fixed dark overlays (`FullscreenViewer`) and arbitrary user swatches (`ColorGrid`).
