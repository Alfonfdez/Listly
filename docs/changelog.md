# Changelog — Listly

[2026-09-11] + | Repo scaffold
- Created the SDD scaffold mirroring the Finly project structure: AGENTS.md, PROMPT.md, docs/, spec/, .agents/skills/, .github/workflows/ci.yml.
- Added `opencode.jsonc` (gitignored, contains Context7 API key) and the secret-free `opencode.example.jsonc` template.
- Added `spec/constitution/` (1-mission, 2-tech-stack, 3-roadmap, 4-design-system, 5-validations, 6-screens, 7-platform-differences) defining the Listly MVP: local-first list manager (lists with name/color/icon, items with check/uncheck, per-list progress, search, per-item notes), offline-first via Drizzle ORM + Zod over SQLite (native) and sql.js/IndexedDB (web).
- Added pending feature specs `001-home-screen` and `002-db-design` (1-spec / 2-plan / 3-tasks each).
- Added 5 skills under `.agents/skills/`: changelog, document-concepts, style-guide (RN token palette + fs() scaling), frontend-design, verification-loop (Playwright MCP, port 8081).
- Added `docs/changelog.md`, `docs/git-commands.md`, `docs/harnesses.md`, `docs/programming-concepts.md`, `docs/assets.md`.
- Added guarded CI workflow (`.github/workflows/ci.yml`) that no-ops until `ListlyApp/` exists, then runs `npm run test:all` on PR/push to develop/main.
- Extended `.gitignore` with `opencode.jsonc` and `.playwright-mcp/`.

[2026-09-11] ~ | .github/workflows/ci.yml, docs/harnesses.md
- Fixed the CI guard: the "Check app exists" step now runs from the repo root (`working-directory: .`) instead of the missing `ListlyApp/` default folder, so scaffold-only runs no longer fail the job before the guard executes.
- Gated `setup-node` behind the same app-exists check to keep pre-app runs fully green (no npm cache lookup without a lock file).
- Updated the CI workflow note in `docs/harnesses.md` to document the real guard mechanism ("Check app exists" step with an `exists` output) instead of the stale `hashFiles` description.

[2026-09-12] + | ListlyApp app scaffold
- Created `ListlyApp/` (Expo SDK 57 blank-typescript, RN 0.86.3, React 19.2.3, TS ~6.0.3, vitest 5) pinning the same dependency set as FinlyApp.
- Added `src/` skeleton mirroring Finly: `constants/` (themes, types, languages), `utils/` (platform, language, formatters `scaleFontSize`), `hooks/useFontSize.ts`, `i18n/` (en/es + `t()`/`setLanguage`), `context/ConfigContext.tsx` (in-memory config stub with `activeColors`/`updateConfig`), `navigation/AppNavigator.tsx` (native-stack placeholder Home with themed NavigationContainer).
- Added app entry (`App.tsx` = ConfigProvider + StatusBar + splash handling, `index.ts`), `app.json` (Listly, com.listly.app, splash plugin), `tsconfig.json` (strict + verbatimModuleSyntax), `eslint.config.js` (expo flat), `vitest.config.mts` (happy-dom).
- Added scripts `test`/`test:watch`/`typecheck`/`lint`/`test:all` and first test (`tests/utils/formatters.test.ts`, 3 cases). `npm run test:all` green.
- CI auto-flips to run the real `test:all` now that `ListlyApp/package-lock.json` exists.