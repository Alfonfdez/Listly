# 021 — Pin/favorite lists and collections: Tasks

- [x] Create `spec/features/021-pin-favorites/` (1-spec, 2-plan, 3-tasks).
- [x] Schema: `SCHEMA_VERSION` 6, `lists.pinned` + `collections.pinned` (DDL `001_initial.ts`, Drizzle `.$type<0 | 1>()`, Zod union 0/1, `List`/`Collection`/`ListWithCounts`/`CollectionWithCounts` types); `create` returns `pinned: 0`; `NewList`/`NewCollection` omit the column.
- [x] Repos: `listRepo.setPinned` + `collectionRepo.setPinned`; pinned-first ordering (`desc(pinned), position, id`) in `list()`/`withCounts()`; move/remove keep the flag.
- [x] Backup: `pinned` in export/import + INSERTs; `backupPinnedSchema` default 0 so schema-5 backups import unpinned.
- [x] Theme `star` token (dark `#F9A825`, light `#F59E0B`); `ERROR_SCOPE.pinLists`/`unpinLists`; i18n `select_pin`/`select_unpin`/`home_pinned` en/es.
- [x] `SelectionActionBar` optional pin props (star button between Cancel and Delete, disabled at 0 selected, `.actions` wraps); star indicators on `ListCard`/`CollectionCard`/`ListRow`/`CollectionRow` (hidden in select mode).
- [x] `ListsView` pin wiring: `selectedListItems`/`selectedCollectionItems`/`allSelectedPinned`, `handlePinPress` (Pin/Unpin toggle + refresh), label/icon/a11y props.
- [x] Tests: repo (setPinned + pinned-first ordering, create returns 0, move/remove keep flag, unpin restores), backup (pinned round-trip, legacy default), component (card/row star, action-bar pin), `ListsView` select-flow (Pin/Unpin for lists + collections); fixtures updated with `pinned`. `npm run test:all` green (48 files, 371 tests).
- [x] Docs: roadmap 021 (done) + 022 schema bump note, `docs/harnesses.md` suite baseline refreshed to 48 files / 371 tests, changelog entry.
- [x] Verification loop at 375px (pin a list + a collection → float to top with amber star; repeat → Unpin restores order; disabled at 0 selected; star persists across reload; Spanish "Fijar"/"Desfijar"/"Destacado"; 0 console errors) + acceptance criteria flipped `[x]`.