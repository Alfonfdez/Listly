# 030 - Multilingual README

- **Objective**
  Ship a complete, multilingual project README (mirroring Finly) that documents the released v1.0.0 app: one English file plus eight translations, with a screenshot gallery, a tech-stack table, and a Development section. Also make the drawer show the app version (`v1.0.0`) so the screenshot and the app match Finly.

---

## Functional requirements

### 1. README files
- Nine files at the repo root: `README.md` (English) + `README.{es,ca,gl,eu,fr,de,pt,it}.md`.
- Each file has a **language bar** linking the other eight, in the Finly order.
- Identical section headings/anchors across all nine; code blocks and tables are language-neutral.

### 2. Sections (each language)
- Intro paragraph(s) + an info table: platforms, version (`1.0.0`), languages, data (100 % local), themes.
- **Features** covering features 001–029 (lists standard/numeric, items incl. notes/photos/amount/quantity, collections, drag & drop, locked lists, duplicate/copy/merge, sorting, select mode, search, settings, backup).
- **Screenshots** gallery with translated captions.
- **Tech Stack** table (Expo SDK 57 / RN 0.86, TypeScript, React Navigation, sortables, reanimated-color-picker, quick-crypto, SQLite/sql.js, Drizzle, Zod, react-native-web, Context API, custom i18n).
- **Development**: requirements, first run, commands (Listly's real scripts), testing, project layout, database, Android build, methodology.
- **License** (MIT, links `LICENSE`).

### 3. Screenshots
- `images/screenshots/` holds real captures of the web build at **375×812** in **dark mode**.
- Required set: home empty/populated, drawer (with the version), create list, list detail, numeric list, add-item expanded, item edit, collections, lists, collection detail, lock modal, locked list, select mode, settings hub, appearance, language picker, regional, personalization, data.

### 4. Drawer version (small app change)
- The drawer content shows the app version right-aligned at the bottom, mirroring Finly: `v{Constants.expoConfig?.version}` = **v1.0.0**.
- Read via `expoconstants` (`expo-constants` added as a dependency); styled with the theme (`c.textSecondary`, `fs(11)`).

---

## Non-functional requirements

- **Docs-only** apart from the drawer version label (and the `expo-constants` dependency it needs).
- All nine READMEs link correctly (language bar, `LICENSE`, `images/screenshots/*`).
- No `src/` behavior change beyond the drawer label; `npm run test:all` stays green.
- **Verification**: `npm run test:all`; web 375px — the drawer shows `v1.0.0`; all screenshots re-checked at 375×812.

---

## Acceptance criteria

- [x] `README.md` plus eight `README.{es,ca,gl,eu,fr,de,pt,it}.md` exist at the repo root.
- [x] Each file has a language bar linking the other eight, and the same section headings.
- [x] The info table shows version `1.0.0`; the features list covers 001–029.
- [x] The screenshot gallery embeds 375×812 dark-mode captures and captions are translated.
- [x] All image/`LICENSE` links in every README resolve.
- [x] The drawer shows `v1.0.0` right-aligned at the bottom, mirroring Finly.
- [x] `expo-constants` is a declared dependency and the version is read from `Constants.expoConfig`.
- [x] `npm run test:all` passes.
