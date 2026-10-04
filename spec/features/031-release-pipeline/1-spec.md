# 031 - Release pipeline

- **Objective**
  Prepare the v1.0.0 release (mirroring Finly): declare the version metadata EAS needs, add the EAS Build scaffolding, and put the **signing-key strategy** in place so future versions (1.0 → 2.0) install **over** the current build with no uninstall. This is release tooling and documentation, not an app feature.

---

## Functional requirements

### 1. Version metadata (`app.json`)
- `expo.version` = `"1.0.0"`.
- `expo.android.versionCode` = `1` (integer; **must strictly increase** every release — it is what lets an update install in place).
- `expo.ios.buildNumber` = `"1.0.0"`.
- `expo.android.adaptiveIcon.backgroundColor` = `#E6F4FE` (match Finly; the launch splash stays `#0F172A`).

### 2. EAS Build scaffolding
- `ListlyApp/eas.json` with three profiles and local version sourcing:
  - `cli.appVersionSource: "local"` — EAS reads `version` / `versionCode` / `buildNumber` from `app.json`.
  - `development` (dev client, internal), `preview` (internal APK), `production` (`distribution: "store"`, `android.buildType: "app-bundle"`).
- Root `.easignore` excluding keystores, generated `/ListlyApp/android/` + `/ListlyApp/ios/`, dev artifacts, and tooling dirs.
- `extra.eas.projectId` in `app.json` is created by `npx eas-cli init` (one-time, per project) — Listly gets its **own** id, separate from Finly's.

### 3. Signing keys (the update guarantee)
- The **official** artifact is an EAS Build. EAS generates the Android upload/release keystore on the first production build and stores it on Expo's servers for the project's `projectId`; every later build reuses it, so consecutive releases share one signature and update in place.
- The keystore is **backed up offline** once via `npx eas-cli credentials`.
- Keystores are never committed (`.gitignore` + `.easignore` exclude `.jks`/`.p8`/`.p12`/`.key`).
- The local `gradlew assembleRelease` path remains a dev smoke-test only (debug-signed); switching a device from that APK to an EAS build needs one uninstall.

### 4. CI parity
- `.github/workflows/ci.yml` is test-only, matching Finly (`npm ci` + `npm run test:all`); the scaffold-era "Check app exists" guard is removed.

### 5. Doctor gate
- `expo-font` is declared explicitly in `package.json` (`~57.0.4`, mirroring Finly) — `@expo/vector-icons` requires it as a peer dependency, and resolving it only transitively fails `expo doctor` ("Missing peer dependency: expo-font") and can crash a standalone/release build.
- `npx expo-doctor` must report **21/21 checks passed** before an EAS build is triggered.

### 5. Documentation
- `AGENTS.md`: EAS release section (official vs local build, versionCode bump rule, key backup, debug-vs-EAS signature); I18N section refreshed to the nine languages.
- `docs/harnesses.md`: official EAS commands + a release-signing note.
- `README.md` (English): build section rewritten to EAS profiles (with the local dev build noted).
- `docs/changelog.md` + `spec/constitution/3-roadmap.md` (`031-release-pipeline`).

---

## Non-functional requirements

- **Config/docs only** — no `src/` behavior change; `npm run test:all` stays green.
- JSON valid for `app.json` and `eas.json`; all touched files use the repo CRLF convention.
- No secrets in the repo (keystores and credentials stay out of git).

---

## Acceptance criteria

- [x] `app.json` has `version` `1.0.0`, `android.versionCode` `1`, `ios.buildNumber` `"1.0.0"`, adaptiveIcon bg `#E6F4FE`.
- [x] `ListlyApp/eas.json` exists with `development`/`preview`/`production` profiles and `cli.appVersionSource: "local"`.
- [x] Root `.easignore` exists and excludes generated native dirs and keystores.
- [x] The release path is documented as EAS Build, with the signing key stored by EAS and backed up via `eas credentials`, and never committed.
- [x] `.github/workflows/ci.yml` is test-only (Finly parity).
- [x] `expo-font` is declared in `package.json` and `npx expo-doctor` reports 21/21 checks passed.
- [x] `AGENTS.md`, `docs/harnesses.md`, `README.md`, `docs/changelog.md`, and the roadmap reflect the release pipeline.
- [x] `app.json` and `eas.json` parse as valid JSON.
- [x] `npm run test:all` passes.
