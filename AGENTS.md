# AGENTS.md — Listly
- Project built using Specification-Driven Development (SDD). The spec/ folder is the single source of truth.

## IMPORTANT RULES
- Apply project skills (.agents/skills/).
- If asked about the code, only respond: take no action and make no changes.
- Do not paint code in the terminal while generating code.
- Work only within that folder.
- English content, English code.
- The agent always communicates in English.
- If asked for a commit message, the agent only returns the summary in standard git format. Never executes commit, push, pull, fetch, or checkout — the developer does it manually.

## TECH STACK
- React Native 0.86.3 + Expo SDK 57
- TypeScript strict mode, no `any`
- Drizzle ORM (query builder over a shared `DatabaseHandle`; no `drizzle-kit`, migrations stay on `PRAGMA user_version`)
- Zod 4 (`src/database/schemas.ts`) — single source of truth for row shapes, `z.infer` types, read-path validation
- SQLite (native, expo-sqlite) / sql.js WASM (web, persisted to IndexedDB) — same schema and repositories on both platforms
- React Navigation 7 (Native Stack + Drawer)
- Context API for global state
- Platforms: iOS, Android, Web

## ENVIRONMENT
- Host: Windows, PowerShell 5.1 shell. There is NO ripgrep in the shell — use the grep/glob/read tools for searching.
- `opencode.jsonc` is gitignored (it contains the Context7 API key). A secret-free `opencode.example.jsonc` is committed as a template.
- Web verification uses the Playwright MCP browser against the Expo web dev server at `http://localhost:8081`.
- Dev-server lifecycle: start `npx expo start --web` (port 8081) in the background, poll the URL until it serves HTML, and always terminate it when done (free port 8081). Concrete commands are in `docs/harnesses.md` and the `verification-loop` skill.

## GIT WORKFLOW
- `main` — stable releases only, merged from `develop`
- `develop` — active development branch
- Feature branches: `feature/NNN-description` off `develop`, merge back via PR
- Never commit directly to `main` or `develop` — the GitHub branch rulesets require a PR (with approval) for every change.
- The agent always suggests a branch name for each implementation (e.g., `fix/db-cleanup-bugs`, `feature/018-transactions-filter`)
- The agent never creates or switches branches — the developer does. If the developer explicitly says "do not create a branch" for a task, follow that instruction.

## COMMIT CONVENTION
Conventional Commits format:
```
<type>(<scope>): <description>
```
Types: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`
- Scope is optional (e.g., `feat(lists):`, `fix(home):`)
- Description in English, imperative mood, lowercase, no period
- Max 50 chars for subject line

## RUN
```bash
cd ListlyApp
npx expo start
```

## LINT
```bash
npx expo lint
```

## VERIFICATION
- A change is only "done" when `npm run test:all` passes (typecheck + lint + tests).
- Changes to `src/utils/` or `src/database/` logic must include or update tests.
- A feature's "verification" task is done only via the `verification-loop` skill: run `test:all`, boot `npx expo start --web`, then check the spec's acceptance criteria in a real browser (viewport 375px for mobile criteria).
- Criteria that cannot be checked on web (e.g. camera capture) are reported as "not checkable on web", never marked done.
- Spec-docs convention: a code change updates only `spec/features/<NNN>/1-spec.md` (requirement bullets) + `spec/constitution/3-roadmap.md` (entry + Status), and flips the feature's acceptance criteria `[ ]` → `[x]` after verification. Never edit `2-plan.md` or `3-tasks.md` for feature updates. New feature folders must seed all three docs (`1-spec.md`, `2-plan.md`, `3-tasks.md`) at creation.

## DATABASE
- One `DatabaseHandle` interface on all platforms (`src/database/types.ts`); `engine.ts` (native) / `engine.web.ts` (web) select the engine.
- Migrations run from `PRAGMA user_version` in `src/database/database.ts`, applying each step once inside a transaction.
- Drizzle schema in `src/database/drizzle/schema.ts`; repositories written with the Drizzle query builder.
- Every stored row is validated at the storage boundary with Zod (`src/database/schemas.ts`); `src/database/types.ts` re-exports the `z.infer` types.
- Repositories: list, item, config (grows with each feature).

## I18N
- Languages: English, Spanish (en/es). The set grows per feature.
- `t()` returns the language object.
- All UI strings go through `src/i18n/`.
- i18n key naming: `lowercase.with.dots`.

## PROJECT STRUCTURE
```
ListlyApp/
  src/
    components/    — Reusable UI components
    constants/     — Themes, types, colors, icons
    context/       — AppContext, ConfigContext (global state)
    database/      — Drizzle schema, Zod schemas, repos, migrations, types
    i18n/          — Translations (en, es)
    navigation/    — AppNavigator (Drawer + Stack)
    screens/       — Screen components (PascalCase)
    utils/         — Formatters, platform.ts, language.ts
```

## NAMING CONVENTIONS
- Screens: `PascalCaseScreen.tsx` (e.g., `ListScreen.tsx`)
- Components: `PascalCase.tsx` (e.g., `ItemRow.tsx`)
- Repositories: `camelCaseRepo.ts` (e.g., `listRepo.ts`)
- Hooks: `useHookName.ts`
- i18n keys: `lowercase.with.dots` (e.g., `home_empty`, `settings_title`)