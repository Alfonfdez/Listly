# Listly — Testing & Verification Harnesses

This document describes the harnesses that guarantee the code generated in this project is
correct, tested, and aligned with its specs. It is the single reference for how Listly is
verified, and it is updated as new harnesses land (each phase).

## How to run

All commands run from the `ListlyApp/` directory (created when feature 001 is implemented).

| Harness | Command |
|---------|---------|
| Everything (typecheck + lint + tests) | `npm run test:all` |
| Unit tests (pure-logic + component) | `npm run test` (`npx vitest run`) |
| Component tests | `npx vitest run tests/component/` |
| DB contract suite (Drizzle + Zod over sql.js) | `npx vitest run tests/database/` |
| Typecheck | `npm run typecheck` |
| Lint | `npm run lint` |
| Web E2E (spec criteria) | `npx expo start --web` then run the `verification-loop` skill (Playwright, 375px viewport) |
| Mobile E2E (Maestro flows) | Deferred — added when native-only criteria appear (see below) |

### Windows / PowerShell notes (host is win32, PowerShell 5.1)

- **No ripgrep in the shell** — use the grep/glob/read tools for searching; do not rely on `rg` in a terminal command.
- **Start the web dev server** (background, from `ListlyApp/`):
  ```powershell
  Start-Process cmd.exe -ArgumentList '/c','cd /d C:\path\to\ListlyApp && npx expo start --web --port 8081' -WindowStyle Hidden
  ```
  then poll `http://localhost:8081` with `Invoke-WebRequest` until it returns HTTP 200 (Metro bundling can be slow on first paint). Optionally save the PID to `C:\Users\<user>\AppData\Local\Temp\opencode\listly-expo.pid` for cleanup.
- **Stop the dev server** — always when done:
  ```powershell
  Get-NetTCPConnection -LocalPort 8081 -State Listen | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
  ```
  and remove the PID file if one was written. Confirm the port is free afterwards. Never leave port 8081 occupied between verifications.

### Current suite baseline

Pending — the app (`ListlyApp/`) is scaffolded with feature 001. The baseline line is added
here once the first test files land, and updated after any session that adds or removes
tests. A drop in the baseline is a regression signal.

## Verification loop (what "done" means)

After every code change, the agent runs:

```bash
cd ListlyApp
npm run test:all
```

`test:all` = `npm run typecheck && npm run lint && npm run test`. A change is only "done"
when all three stages pass. For spec features, the `verification-loop` skill then checks the
acceptance criteria in a real browser.

## Harness stack (planned)

| Harness | Tooling | Status | Covers |
|---------|---------|--------|--------|
| Pure-logic unit tests | Vitest + happy-dom | Pending (Phase A, with feature 002+) | Formatters, item filtering, search, color utils, DB query-builders |
| DB contract suite | Vitest + sql.js (real SQLite in Node) | Pending (Phase B) | One shared engine (native parity via expo-sqlite mock + web via sql.js/IndexedDB), Drizzle repo contract, DB drift vs types |
| Type-checking | `tsc --noEmit` (strict, no `any`) | Pending | Whole codebase types |
| Linting | `npx expo lint` (eslint-config-expo) | Pending | Code style, unused imports, React hooks rules |
| Schema layer + validation | Zod 4 (`src/database/schemas.ts`) | Pending (Phase F pattern) | Row types derived via `z.infer`; read-path validation in native + web backends; schema-vs-migration drift test |
| Component unit tests | Vitest + RNTL | Pending (Phase D) | Presentational components + context/hooks/screens suites with ConfigContext stubbed |
| UI / E2E verification | Playwright MCP + `verification-loop` skill | Pending (Phase C) | Spec acceptance criteria in a live Expo web app |
| CI pipeline | GitHub Actions (`.github/workflows/ci.yml`) | Scaffolded (guarded) | `npm run test:all` on every PR to `develop`/`main` and push to those branches |
| SDD alignment | `spec/` + changelog + test mapping | In use | Every feature spec maps to tests + changelog entries |
| Mobile E2E | Maestro on Android emulator | Deferred | Needed only when native-only criteria appear |

### CI workflow note

`.github/workflows/ci.yml` is guarded so it no-ops green until `ListlyApp/package-lock.json`
exists (`if: hashFiles(...) != ''` at the step level). Once the app is scaffolded, CI runs
`npm ci` + `npm run test:all` automatically on every PR/push to `develop`/`main`. Enable the
"require status checks" rule in the GitHub branch ruleset only after the workflow has run at
least once successfully.

## Adding a test

1. Create `ListlyApp/tests/<area>/<module>.test.ts` (mirror the module path).
2. Import only pure modules (no `react-native` / `expo-*` runtime imports); if a module
   imports those, mock them or keep it out of Phase A scope.
3. Cover: normal cases, edge cases, and at least one regression seed per previously fixed bug.
4. Run `npm run test` (or `npm run test:watch`) and `npm run test:all` before finishing.

For component tests (`.test.tsx` under `tests/component/`), stub `ConfigContext` via a
`tests/component/helpers/configStub.ts` setupFiles entry and alias `@expo/vector-icons` to a
plain-`Text` mock — no other component mocks are needed.