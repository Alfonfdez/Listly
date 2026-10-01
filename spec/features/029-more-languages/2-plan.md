# 029 - More languages — Plan

## Approach

Extend the existing i18n system from two languages to nine, matching Finly's set and order. The typed `Translations` interface (derived from `en`) keeps parity enforced at compile time; a runtime test backs it up.

## Language set

| Item | Value |
|------|-------|
| `LANGUAGES` | `en, es, ca, gl, eu, fr, de, pt, it` |
| `language` enum (`schemas.ts`) | same nine |
| i18n registry | same nine → packs |

## Translation packs

- `src/i18n/en.ts` stays the reference pack; `Translations = typeof en` (or equivalent) types every other pack.
- New packs: `ca.ts`, `gl.ts`, `eu.ts`, `fr.ts`, `de.ts`, `pt.ts`, `it.ts`.
- Shared strings ported from Finly; Listly-only strings translated; all nine include `lang_*` self-names.

## Flags

| Platform | en/es/fr/de/pt/it | ca/gl/eu |
|----------|-------------------|----------|
| Native | emoji flag | neutral glyph (no emoji exists) |
| Web | SVG | SVG (Senyera, Galician, Basque) |

## Files

| File | Change |
|------|--------|
| `src/constants/languages.ts` | add seven ids in Finly order |
| `src/database/schemas.ts` | `language` enum → nine values |
| `src/i18n/index.ts` | registry → nine packs |
| `src/i18n/{ca,gl,eu,fr,de,pt,it}.ts` | **New** packs typed against `en` |
| `src/components/settings/FlagIcon.tsx` | native flags (emoji + neutral glyph) |
| `src/components/settings/FlagIcon.web.tsx` | web SVG flags for all nine |
| `src/constants/flagColors.ts` | SVG data for ca/gl/eu |
| `src/screens/settings/RegionalScreen.tsx` | list all nine in order |

## Tests

- `tests/i18n/parity.test.ts` — **New**: key set equals `en`, function arity matches, no empty strings, registry matches `LANGUAGES`.
- `tests/hooks/useLabels.test.tsx` — covers a newly added language.

## Verification

`npm run test:all`; web 375px — switch among the nine languages and confirm every screen + flag render with 0 console errors.

## Notes

- The per-language README is a later, separate change (delivered under 030).
