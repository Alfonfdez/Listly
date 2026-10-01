# 030 - Multilingual README — Tasks

- [x] Create `spec/features/030-multilingual-readme/` (1-spec, 2-plan, 3-tasks).
- [x] Add `expo-constants` dependency and the right-aligned `v{Constants.expoConfig?.version}` label in `AppNavigator`'s drawer content.
- [x] Boot web (port 8081), set Theme → Dark, seed demo data, capture the 20 scenes at 375×812 into `images/screenshots/`.
- [x] Write `README.md` (English): language bar, info table (v1.0.0), features 001–029, screenshot gallery, tech-stack table, Development/Testing/Database/Android-build/Methodology, License.
- [x] Write `README.{es,ca,gl,eu,fr,de,pt,it}.md` (eight translations, same structure + anchors, translated captions).
- [x] Link check: every image and `LICENSE` link resolves in all nine files.
- [x] Stop the web server and free port 8081.
- [x] `npm run test:all` green (76 files, 652 tests); typecheck + lint clean.
- [x] Rebuild the release APK and verify the drawer version is bundled.
- [x] Verification loop at 375px (drawer shows `v1.0.0`) + acceptance criteria `[x]`.
- [x] Update roadmap (030 entry + status) and changelog.
