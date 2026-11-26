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
- React Native 0.86.3 + Expo SDK 57 (`expo@57.0.26`)
- TypeScript strict mode, no `any`
- Drizzle ORM (query builder over a shared `DatabaseHandle`; no `drizzle-kit`, migrations stay on `PRAGMA user_version`)
- Zod 4 (`src/database/schemas.ts`) — single source of truth for row shapes, `z.infer` types, read-path validation
- SQLite (native, expo-sqlite) / sql.js WASM (web, persisted to IndexedDB) — same schema and repositories on both platforms
- React Navigation 7 (Native Stack + Drawer)
- Context API for global state
- Platforms: iOS, Android, Web

## ENVIRONMENT
- Host: Windows, PowerShell 5.1 shell. There is NO ripgrep in the shell — use the grep/glob/read tools for searching.
- **Never write non-ASCII text through the shell**: PowerShell here-strings, pipes and `>` redirects re-encode with the console codepage and turn accents/dashes into `?` or mojibake. Write such files with the Write/Edit tools (UTF-8), or put the text in a JSON/values file written with Write and let a script read it. `scripts/i18n.mjs` only edits `src/i18n/*.ts` — never the READMEs or other files.
- `opencode.jsonc` is gitignored (it contains the Context7 API key). A secret-free `opencode.example.jsonc` is committed as a template.
- Web verification uses the Playwright MCP browser against the Expo web dev server at `http://localhost:8081`.
- Dev-server lifecycle: start `npx expo start --web` (port 8081) in the background, poll the URL until it serves HTML, and always terminate it when done (free port 8081). Concrete commands are in `docs/harnesses.md` and the `verification-loop` skill.

## GIT WORKFLOW
- `main` — stable releases only, merged from `develop`
- `develop` — active development branch
- Feature branches: `feature/NNN-description` off `develop`, merge back via PR
- Never commit directly to `main` or `develop` — the GitHub branch rulesets require a PR (with approval) for every change.
- The agent always suggests a branch name for each implementation (e.g., `fix/db-cleanup-bugs`, `feature/026-numeric-lists`)
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

## CHANGELOG
Every code/asset change appends an entry to `docs/changelog.md`. **Always use the script** (never hand-edit):
```bash
node scripts/append-changelog.mjs --type <type> --files "<paths>" --bullet "<line>"
```
- `--type`: `+` (added), `~` (modified), `-` (removed), or `feat`/`fix`/`docs`/`refactor`/`style`/`test`/`chore`.
- `--bullet` repeatable (one line each); `--dry-run` to preview; `--date` optional.
- The script guarantees a blank line between entries, CRLF, and refuses to write if the existing tail looks truncated. See the `changelog` skill.

## RUN
```bash
cd ListlyApp
npx expo start
```

## ANDROID BUILD & RELEASE (EAS)
The **official** artifact is an EAS Build; local `gradlew` is a dev smoke-test path only.

```bash
cd ListlyApp
npx eas-cli login                     # once
npx eas-cli init                      # once — writes extra.eas.projectId into app.json
npx eas-cli build --platform android --profile preview   # installable APK (internal)
npx eas-cli build --platform android --profile production --no-wait  # store AAB
```
- `ListlyApp/eas.json` defines three profiles (`development`, `preview`, `production`) with `cli.appVersionSource: "local"` — EAS reads `version` / `android.versionCode` / `ios.buildNumber` straight from `app.json`.
- **Bump `android.versionCode` (and `ios.buildNumber`) for every release**: `versionCode` must strictly increase or Google Play rejects the upload; it is what makes an update install *over* the previous one.
- **Signing keys are managed by EAS** (generated on the first production build and stored on Expo's servers for the project's `projectId`), so consecutive releases share one signature and update in place — no uninstall. Keep an offline backup: `npx eas-cli credentials` → Android → download the keystore + passwords. Never commit a keystore (`.jks`/`.p12`/`.key` are gitignored; `.easignore` also excludes them).
- A locally built `gradlew assembleRelease` APK is signed with the **debug** keystore (`app/build.gradle` uses `signingConfigs.debug`), so it has a different signature than the EAS release — use it only for local smoke tests, and expect to uninstall the debug APK before installing an EAS build.

### Local dev build (icons/splash regeneration)
```bash
cd ListlyApp
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease   # APK → app/build/outputs/apk/release/app-release.apk
```
- `ListlyApp/android/` is a **generated** native project (gitignored). Expo copies `assets/*` and the `app.json` icon/splash config into native resources (`res/mipmap-*/ic_launcher*.webp`, `res/drawable-*/splashscreen_logo.png`) **only during `expo prebuild`**.
- **After changing `assets/` or the icon/splash config in `app.json`, run `npx expo prebuild --platform android` before building** — otherwise the APK keeps the stale icons/splash (Gradle won't regenerate them).
- Web favicon is injected only at export time: `npx expo export --platform web` (dev `expo start --web` serves no favicon).

## LINT / FORMATTING
```bash
npm run lint       # expo lint . --max-warnings 0 (src, tests, scripts, configs)
npm run lint:fix   # the same with --fix (indent, quotes, commas, EOL)
```
- Formatting is **machine-enforced**: 2-space indent (`case` one level deeper), single quotes, double JSX quotes, semicolons, trailing commas in multiline literals, no trailing spaces, a final newline, no BOM. `.editorconfig` mirrors it; ESLint is the gate.
- `eslint-plugin-boundaries` enforces the layer import rules (`constants` → `utils` → `i18n` → `database` → `context` → `hooks` → `components` → `screens` → `navigation`).
- Node scripts are linted with Node globals; tests get a test-only React override.
- Run `npm run lint:fix` before committing style changes; never hand-fix indentation. `npm run lint` must report **0 problems and 0 warnings**.

## VERIFICATION
- A change is only "done" when `npm run test:all` passes (typecheck + lint + tests).
- Changes to `src/utils/` or `src/database/` logic must include or update tests.
- A feature's "verification" task is done only via the `verification-loop` skill: run `test:all`, boot `npx expo start --web`, then check the spec's acceptance criteria in a real browser (viewport 375px for mobile criteria).
- Criteria that cannot be checked on web (e.g. camera capture) are reported as "not checkable on web", never marked done.
- Spec-docs convention: a code change updates only `spec/features/<NNN>/1-spec.md` (requirement bullets) + `spec/constitution/3-roadmap.md` (entry + Status), and flips the feature's acceptance criteria `[ ]` → `[x]` after verification. Never edit `2-plan.md` or `3-tasks.md` for feature updates. New feature folders must seed all three docs (`1-spec.md`, `2-plan.md`, `3-tasks.md`) at creation.

## DATABASE
- One `DatabaseHandle` interface on all platforms (`src/database/types.ts`); `engine.ts` (native) / `engine.web.ts` (web) select the engine.
- The migration chain lives in `src/database/migrations/index.ts`: `MIGRATIONS` is an ordered list of `{ version, run }` steps and `SCHEMA_VERSION` (9 since v1.0.0) is the version this build writes to `PRAGMA user_version`.
- **Never drop a database at or above `RELEASED_BASELINE` (9).** Bumping `SCHEMA_VERSION` means appending one idempotent step to `MIGRATIONS`; `tests/database/migrations.test.ts` fails if the chain does not end at `SCHEMA_VERSION`. Only pre-release databases (`1..8`) are rebuilt.
- `tests/fixtures/upgrade/v1.0.0.sql` is a frozen v9 snapshot; `tests/database/upgrade.test.ts` proves an upgrade keeps every row. See `docs/upgrade-testing.md`.
- Drizzle schema in `src/database/drizzle/schema.ts`; repositories written with the Drizzle query builder.
- Every stored row is validated at the storage boundary with Zod (`src/database/schemas.ts`); `src/database/types.ts` re-exports the `z.infer` types.
- Repositories: list, item, config, collection, vault.

## I18N
- Languages: English, Spanish, Catalan, Galician, Basque, French, German, Portuguese, Italian (en, es, ca, gl, eu, fr, de, pt, it).
- `t()` returns the language object.
- All UI strings go through `src/i18n/`; every pack is typed against `en`'s `Translations`, so key parity is enforced at typecheck (plus `tests/i18n/parity.test.ts` and the encoding guard in `tests/i18n/encoding.test.ts`).
- i18n key naming: `snake_case` (e.g. `home_empty`, `settings_title`).

## I18N KEYS
Every key must exist in all nine language files with the same key set. **Always use the script** (never hand-edit the nine files):
```bash
npm run i18n -- list --check                                        # key counts + parity problems
npm run i18n -- list --key home_                                    # show matching keys per language
npm run i18n -- add --key foo --value "Foo" --after bar --dry-run
npm run i18n -- add --key foo --values-file keys.json --after bar
npm run i18n -- set --key foo --value "Foo" --lang es
npm run i18n -- remove --key foo
```
- `--values-file` takes a JSON object keyed by language code; use it for anything containing a quote, backslash, `$` or backtick (never `--value` on the command line).
- The script is all-or-nothing, keeps comments/sections/CRLF, and writes UTF-8; it is covered by `tests/tooling/i18n.test.ts`.
- After any i18n change run `npm run test:all` (the parity + encoding tests must pass).

## PROJECT STRUCTURE
```
ListlyApp/
  src/
    components/    — Reusable UI components
    constants/     — Themes, types, colors, icons
    context/       — AppContext, ConfigContext (global state)
    database/      — Drizzle schema, Zod schemas, repos, migrations, types
    hooks/         — Custom hooks
    i18n/          — Translations (en, es, ca, gl, eu, fr, de, pt, it)
    navigation/    — AppNavigator (Drawer + Stack)
    screens/       — Screen components (PascalCase)
    utils/         — Formatters, platform, validation, numeric
```

## NAMING CONVENTIONS
- Screens: `PascalCaseScreen.tsx` (e.g., `ListScreen.tsx`)
- Components: `PascalCase.tsx` (e.g., `ItemRow.tsx`)
- Repositories: `camelCaseRepo.ts` (e.g., `listRepo.ts`)
- Hooks: `useHookName.ts`
- i18n keys: `snake_case` (e.g., `home_empty`, `settings_title`)