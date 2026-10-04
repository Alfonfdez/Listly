---
name: verification-loop
description: Browser verification loop (Playwright MCP) against a feature's acceptance criteria in its spec. Use whenever a task says "verification" or when all tasks of a feature are complete.
---
The loop:

1. Read the acceptance criteria from the 1-spec.md of the active feature.
2. Run `npm run test:all` (from ListlyApp/) first. If it is not green, stop and fix it before doing any browser work.
3. Boot the web app: start `npx expo start --web` (from ListlyApp/) in the background and wait until `http://localhost:8081` responds with HTML. Use a fresh browser context.
4. Open `http://localhost:8081` with the Playwright MCP.
5. Check the criteria one by one by interacting for real: type in fields, press buttons, inspect the DOM and resulting styles.
6. If a criterion fails: fix the code and re-check that criterion (and any others the change may affect).
7. Finish when all criteria pass. If the same criterion fails after 3 attempts, stop and explain what is blocking — do not keep iterating blindly.
8. Close the browser and terminate the Expo dev server you started.

When done, report the checklist criterion by criterion with [] or [x] and a comment if needed. If everything passes, mark the verification task as done.

Rules:
- Criteria live in the spec: do not invent, skip, or reinterpret them. If one cannot be checked, say so.
- The web build persists data in IndexedDB (sql.js engine). Before each feature run, start from a fresh browser context (or clear the site's IndexedDB/localStorage) so state from previous checks never leaks into the next one.
- When a criterion mentions responsive or mobile, check it with the viewport at 375px (or 1280px for large screens).
- Criteria that only make sense on a native device (camera/photo capture, native pickers, file system access) are reported as "not checkable on web" — never silently marked done.
- Do not mark any feature as closed (or the verification task as done) with any criterion pending.

Expo web specifics:
- The dev server is `npx expo start --web` on port 8081 (`npm run web` is an alias). Start it in the background, poll the URL until it serves HTML, and kill exactly the process you started (or free port 8081) when finished. Do not leave it running between verifications.
- First paint can be slow on web (Metro bundling). After navigating, wait for the UI element you assert on instead of relying on fixed sleeps.
- The web build persists data in IndexedDB (sql.js engine), so a "fresh install" means a fresh browser context with the site's IndexedDB cleared before the run.

### Windows (PowerShell) notes

- Host is Windows / PowerShell 5.1. Start the server in the background from `ListlyApp/`:
  `Start-Process cmd.exe -ArgumentList '/c','cd /d <abs path to ListlyApp> && npx expo start --web --port 8081' -WindowStyle Hidden`, then poll `http://localhost:8081` until it returns HTML. Optionally save the PID to `C:\Users\<user>\AppData\Local\Temp\opencode\listly-expo.pid`.
- Cleanup: `Get-NetTCPConnection -LocalPort 8081 -State Listen | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }`, delete the PID file if written, and confirm the port is free. Full commands are also in `docs/harnesses.md`.

## Mobile mode (Android emulator via Maestro)

Deferred. Listly's MVP has no native-only criteria, so the web loop is sufficient. If a
feature later brings native-only criteria (camera capture, native pickers, file system),
add a Maestro harness here mirroring the Finly setup: `emulator -avd <avd>`, `adb reverse
tcp:8081 tcp:8081`, `npx expo start`, `maestro test ListlyApp/.maestro/<flow>.yaml`, plus
`helpers/state-reset.yaml` (`launchApp` + `clearState`) to reset the SQLite DB to the seeded
state before each run. Native-only criteria stay reported as "not automatable on emulator"
unless the flow actually exercises them.