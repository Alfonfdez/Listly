# 029 - More languages

- **Objective**
  Ship the app in the same **nine languages as Finly** (`en, es, ca, gl, eu, fr, de, pt, it`) — same picker order and same flags — so the regional picker, every UI string, and the flag set match the sibling project. This extends the app from en/es to nine languages with typecheck- and test-enforced key parity.

---

## Functional requirements

### 1. Language set
- `LANGUAGES` (`src/constants/languages.ts`) gains seven ids: `ca, gl, eu, fr, de, pt, it`, in the Finly order `en, es, ca, gl, eu, fr, de, pt, it`.
- The `language` enum in `src/database/schemas.ts` includes all nine values.
- The `src/i18n/index.ts` registry maps all nine ids to their translation packs.

### 2. Translation packs
- New files `src/i18n/{ca,gl,eu,fr,de,pt,it}.ts`, each typed against `en`'s `Translations`, so **key parity is enforced at typecheck**.
- Strings shared with Finly (settings, themes, errors, backups) are ported from its reviewed translations; Listly-only strings (collections, items, lists, vault/locked lists, numeric lists, select mode) are translated per language.
- Each pack includes the nine `lang_*` **self-names** (each language shown in its own language).

### 3. Regional picker
- The Regional screen lists all nine options in the fixed order.
- `lang_*` labels render each language in its own language.

### 4. Flags
- Native shows **emoji** flags where they exist (`en, es, fr, de, pt, it`) and a neutral glyph for `ca, gl, eu` (no emoji flag exists for those).
- Web renders **SVG** flags for all nine (Senyera for Catalan, Galician, Basque added to `flagColors.ts` + `FlagIcon.web.tsx`).

### 5. Parity guarantee
- A new i18n parity test asserts every language has exactly the same keys as `en`, matching function arity, no empty strings, and that the registry matches `LANGUAGES`.

---

## Non-functional requirements

- **TypeScript strict**, no `any`; the typed `Translations` interface is the single source of truth for keys.
- **Tests**: `tests/i18n/parity.test.ts` (key/arity/empty-string/registry parity); `useLabels` covers a new language.
- **Verification**: `npm run test:all`; web 375px — switch to several of the nine languages and confirm every screen and the flag render correctly with no console errors.

---

## Acceptance criteria

- [x] `LANGUAGES` lists `en, es, ca, gl, eu, fr, de, pt, it` in that order.
- [x] The `language` config enum and the i18n registry accept all nine.
- [x] Seven new translation packs exist and are typed against `en` (key parity enforced at typecheck).
- [x] The Regional picker lists all nine options in order, each labelled in its own language.
- [x] Web renders an SVG flag for all nine (including ca/gl/eu); native uses emoji where available and a neutral glyph for ca/gl/eu.
- [x] The i18n parity test passes (same keys, arity, no empty strings, registry matches `LANGUAGES`).
- [x] Switching language re-renders the UI in the selected language on web at 375px, with no console errors.
- [x] `npm run test:all` passes.
