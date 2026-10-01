# 031 - Release pipeline — Tasks

- [x] Create `spec/features/031-release-pipeline/` (1-spec, 2-plan, 3-tasks).
- [x] `app.json`: set `android.versionCode` `1`, `ios.buildNumber` `1.0.0`, adaptiveIcon bg `#E6F4FE`.
- [x] Add `ListlyApp/eas.json` (development / preview / production, `appVersionSource: local`).
- [x] Add root `.easignore` (generated native dirs + keystores + dev artifacts).
- [x] Simplify `.github/workflows/ci.yml` to test-only (Finly parity).
- [x] Declare `expo-font` (`~57.0.4`) so `expo doctor` passes 21/21 (fixes the peer-dependency failure of the first EAS build).
- [x] Document the signing strategy: EAS-managed key, `eas credentials` backup, never commit; local `gradlew` = debug smoke only.
- [x] Docs: `AGENTS.md` (EAS release section + I18N refresh), `docs/harnesses.md`, `README.md` build section, `docs/changelog.md`, roadmap `031`.
- [x] Validate `app.json` + `eas.json` JSON; normalize touched files to CRLF.
- [x] `npm run test:all` green (76 files, 652 tests); typecheck + lint clean.
- [ ] Developer manual steps: `eas-cli login` → `eas init` (projectId) → `eas build` → `eas credentials` backup.
- [x] Acceptance criteria `[x]`.
