# 029 - More languages — Tasks

- [x] Create `spec/features/029-more-languages/` (1-spec, 2-plan, 3-tasks).
- [x] `LANGUAGES`: add `ca, gl, eu, fr, de, pt, it` in Finly order.
- [x] `language` config enum (`schemas.ts`) + i18n registry → nine values/packs.
- [x] New packs `ca/gl/eu/fr/de/pt/it` typed against `en` (key parity enforced by typecheck).
- [x] Port shared strings from Finly; translate Listly-only strings; add nine `lang_*` self-names.
- [x] Flags: native emoji (en/es/fr/de/pt/it) + neutral glyph (ca/gl/eu); web SVG for all nine (`FlagIcon.web.tsx` + `flagColors.ts`).
- [x] Regional screen lists all nine in order.
- [x] Tests: `tests/i18n/parity.test.ts` (keys/arity/empty/registry); `useLabels` new language. `npm run test:all` green.
- [x] Verification loop at 375px (switch languages, flags, 0 console errors) + acceptance criteria `[x]`.
- [x] Update roadmap (029 entry + status), `spec/constitution/2-tech-stack.md` i18n tree, changelog.
