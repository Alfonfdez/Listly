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