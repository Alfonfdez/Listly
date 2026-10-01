# 031 - Release pipeline — Plan

## Approach

Mirror Finly's release setup: put the version metadata in `app.json`, add the EAS profiles and ignore file, and document the EAS-managed signing so updates install in place. Keep CI test-only. No application code changes.

## Version metadata

| Field | Value | Why |
|-------|-------|-----|
| `expo.version` | `"1.0.0"` | display / store version |
| `expo.android.versionCode` | `1` | store upload + in-place update trigger (strictly increasing) |
| `expo.ios.buildNumber` | `"1.0.0"` | iOS build number |
| `expo.android.adaptiveIcon.backgroundColor` | `#E6F4FE` | parity with Finly |

`eas.json` sets `cli.appVersionSource: "local"`, so EAS reads these from `app.json`.

## EAS profiles

| Profile | Distribution | Output |
|---------|--------------|--------|
| `development` | internal, dev client | dev-client build |
| `preview` | internal | installable APK |
| `production` | store | publishable AAB (`android.buildType: "app-bundle"`) |

## Signing

| Aspect | Detail |
|--------|--------|
| Who signs | EAS (keystore generated on first production build, stored on Expo servers per `projectId`) |
| Update behavior | same signature across releases → install over the old build, no uninstall |
| Backup | `npx eas-cli credentials` → Android → download keystore + passwords |
| Never | commit a keystore (`.gitignore` + `.easignore` exclude `.jks`/`.p8`/`.p12`/`.key`) |
| Local `gradlew` | debug-signed smoke build only; switching to an EAS build needs one uninstall |

## Files

| File | Change |
|------|--------|
| `ListlyApp/app.json` | version metadata + adaptiveIcon bg |
| `ListlyApp/eas.json` | **New** — profiles |
| `.easignore` | **New** — root ignore for EAS archives |
| `.github/workflows/ci.yml` | test-only (drop scaffold guard) |
| `AGENTS.md` | EAS release section + I18N refresh |
| `docs/harnesses.md` | official EAS commands + signing note |
| `README.md` | build section → EAS profiles |
| `docs/changelog.md` | entry |
| `spec/constitution/3-roadmap.md` | `031-release-pipeline` |

## Manual steps (developer, needs Expo login)

1. `npx eas-cli login`
2. `cd ListlyApp && npx eas-cli init` → writes `extra.eas.projectId`
3. `npx eas-cli build --platform android --profile preview` (APK) / `--profile production` (AAB)
4. `npx eas-cli credentials` → back up the keystore

## Tests

No new unit tests (config/docs). The gate is `npm run test:all`.
JSON validity for `app.json` / `eas.json`; CRLF on all touched files.

## Verification

`npm run test:all`; confirm `app.json` + `eas.json` parse; confirm the official artifact path and key-backup steps are documented; confirm no keystore is tracked by git.
