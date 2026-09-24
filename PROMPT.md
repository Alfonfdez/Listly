# Prompt — Copy & Paste for New Sessions

This is the Listly project — a React Native/Expo local-first list manager with SQLite (mobile) and sql.js/IndexedDB (web), following Specification-Driven Development (SDD). Follow these steps to get context:

1. Read `AGENTS.md` for rules, tech stack, and conventions.
2. Read `spec/constitution/` files for project mission, tech stack, design system, validations, screens, and platform differences (mobile vs web).
3. Read `spec/features/` files for feature specifications, plans, and task breakdowns.
4. Read `docs/` files for changelog, git workflows, programming concepts, app assets reference, and the verification harnesses in `docs/harnesses.md`.
5. Read project code in `ListlyApp/src/`.
6. Check skills in `.agents/skills/` and apply them when relevant.
7. Use Context7 MCP to look up up-to-date library documentation when working with external packages.
8. After code changes, run `npm run test:all` from `ListlyApp/` (typecheck + lint + unit tests) and follow the harness rules in `docs/harnesses.md`.
9. Any code update must be documented in `docs/changelog.md`.
10. When asked for a commit message **or a branch name alone**, follow the workflow in `docs/git-commands.md` (run `git status` + `git diff --stat`, then generate a conventional commit + branch name). Never run `git commit`/`push`/`pull`/`fetch`/`checkout` — the developer performs all git write operations.
11. Spec docs: a code change updates only `spec/features/<NNN>/1-spec.md` + `spec/constitution/3-roadmap.md` and flips acceptance criteria `[ ]` → `[x]` after verification. Never edit `2-plan.md` or `3-tasks.md` for feature updates. New feature folders must seed all three docs (`1-spec.md`, `2-plan.md`, `3-tasks.md`) at creation.
12. After web verification, close the browser and terminate the Expo dev server on port 8081 (see `docs/harnesses.md`). The host is Windows/PowerShell — no ripgrep in the shell; use the grep/glob/read tools.
13. Always consult the developer before adding, modifying, or deleting code. Wait for verification.