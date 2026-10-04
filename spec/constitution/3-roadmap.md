# Roadmap

Local-first list manager (React Native / Expo) for iOS, Android, and web.

## 001-home-screen
Status: done.

Lists overview screen (Home):
- Grid/list of lists with name, color, icon, and progress (N/total completed).
- Floating "+" button (FAB) that navigates to Create List.
- Search bar to filter lists and items.
- Tapping a list navigates to the list detail screen.
- Empty state when there are no lists.
- Drawer navigation with Home, Lists, and Settings.
- Spec: spec/features/001-home-screen/.

## 002-db-design
Status: done.

Local database design:
- `lists`: id, name, color, icon, created_at.
- `items`: id, list_id, name, checked, note, position, created_at (FK → lists ON DELETE CASCADE).
- `config`: key-value configuration table (theme, language, text size).
- Drizzle schema, Zod schemas with `z.infer` types, migrations with `PRAGMA user_version`.
- One SQLite engine on all platforms (expo-sqlite native, sql.js + IndexedDB web).
- Spec: spec/features/002-db-design/.

## 003-list-detail-screen
Status: done.

List detail screen with items:
- Item list with checkbox toggle, name, note indicator.
- Add item via input (or modal).
- Edit/delete item.
- Per-list progress indicator.
- Spec: spec/features/003-list-detail-screen/.

## 004-create-list-screen
Status: done.

Screen for creating a new list:
- Name with validation (not empty, not duplicate).
- Color selection from a grid.
- Icon selection from a grid.
- "Create" button with validation.
- Spec: spec/features/004-create-list-screen/.

## 005-settings-screen
Status: done.

Settings screen:
- Single scroll with four sections: Appearance (theme, text size), Regional (language), Personalization (list layout; Show notes / Show photos), Data (export, import, delete all lists, factory reset).
- Config gains `listLayout`, `showNotes`, `showPhotos` (persisted in the `config` table); `ConfigContext` writes through `configRepo.save` and exposes `reload()`.
- List layout drives Home + Lists; note/photo toggles hide those fields everywhere.
- Backup format `{ app: 'Listly', kind: 'backup', formatVersion: 1, schema, data: { lists, items, config } }`; native uses `expo-sharing` + `expo-document-picker`, web uses Blob download + file input.
- Export UX (local `listly-share` module): Android saves the backup to the public **Downloads** folder and shows a *saved* alert with Share/Done (falling back to the share sheet), iOS reports the true share outcome, web downloads; success feedback only when the export actually succeeded. Requires a development/release build (not Expo Go).
- `clearDataKeepSettings()` / `resetDatabase()` clean data (and photo files), optionally restoring default settings.
- Drawer separator between Lists and Settings; seed data removed (fresh installs start empty).
- Spec: spec/features/005-settings-screen/.

## 006-create-list-color-picker
Status: done.

Color picker for the Create List screen:
- Quick colors row + custom-color circle.
- "+" opens a full color picker modal (`reanimated-color-picker` panel/hue/opacity + preview) with OK/Cancel.
- Picked custom colors persist as a shortcut circle in the row.
- Spec: spec/features/006-create-list-color-picker/.

## 007-home-and-nav-polish
Status: done.

Home & navigation polish:
- FAB centered at the bottom (Home and Lists).
- Per-screen header with icon + title.
- Distinct "Lists" drawer screen with full-width rows (icon, name, progress).
- Shared grid/list `ListsView` (pre-stages the Settings layout toggle).
- Spec: spec/features/007-home-and-nav-polish/.

## 008-add-item-note
Status: done.

Expandable note area in the add-item bar:
- Chevron toggle reveals a note field below the name input.
- Note is optional and included when creating an item.
- Fields clear and the area collapses after submission.
- Spec: spec/features/008-add-item-note/.

## 009-reorder-lists
Status: done.

Drag-to-reorder lists on Home and Lists:
- Migration 003 adds `lists.position` (backfill + index), `SCHEMA_VERSION` 3; Drizzle/Zod/`ListWithCounts` include `position`; `listRepo` orders by position, appends on create, and `reorder(orderedIds)` persists atomically.
- Home grid and Lists rows are drag-reorderable via `Sortable.Grid` (long-press drag, write-through + refresh); dragging is disabled while a search query is active.
- Spec: spec/features/009-reorder-lists/.

## 010-bulk-select-delete
Status: done.

Bulk select/delete + header search:
- Multi-select lists (long-press to enter select mode) with bottom action bar (count + delete + cancel).
- Multi-select items (long-press to enter select mode) with the same pattern.
- Bulk delete with confirmation dialog, transactional, refresh after.
- Single list/item delete via long-press in select mode.
- The item batch toolbar shows two rows: Row 1 = item sort pill (022) + *Merge into…* (025, amber `warning` tint); Row 2 = All / None / Clear (full names as a11y labels). Both rows fit at 375px in en/es.
- Search toggle moved from inline ListsView to `headerRight` in the navigator for Home and Lists.
- The bottom action bar wraps its count/buttons (button group right-aligned) so no action is clipped on narrow screens (375px) with long labels (es) or scaled text; button order is Delete → Pin → Cancel (destructive first, separated).
- Spec: spec/features/010-bulk-select-delete/.

## 011-item-pictures
Status: done.

Up to 3 pictures per item:
- `items.pictures` TEXT column (JSON array of URIs), migration 004 / `SCHEMA_VERSION` 4.
- "Add photos" section in the expanded details area of the add bar (under the note input) and under the Note field in the edit modal.
- Thumbnail strip on item rows; full-screen viewer on tap.
- Native stores file URIs in the document directory; web stores base64 data URLs inline; photo files cleaned up on item/list delete.
- Spec: spec/features/011-item-pictures/.

## 012-reorder-items
Status: done.

Drag-to-reorder items inside a list:
- `itemRepo.reorder(listId, orderedIds)` persists the new order atomically via `items.position`.
- Sortable list-detail container (`Sortable.Grid`, 1 column); long-press drag; write-through + refresh.
- Reordering disabled with <2 items, while a search query is active, or in select mode.
- Long-press reserved for drag (no longer enters item select mode; select mode stays behind the header toggle).
- Spec: spec/features/012-reorder-items/.

## 013-edit-list
Status: done.

Edit an existing list (name, icon, color):
- Shared `ListForm` component extracted from `CreateListScreen`, reused by the new `EditListScreen` (route `EditList: { listId }`).
- Pencil entry point on the List detail header block navigates to the edit screen.
- Save via `listRepo.update(listId, { name, icon, color })`; duplicate check excludes the edited list itself.
- Delete moved into Edit List: an outlined-red *Delete list* button above Save (confirm → `listRepo.delete` → returns to the overview); the list-detail header no longer shows a delete icon.
- The Edit List bottom stack is ordered Delete → Merge into… (025) → Duplicate list → Save.
- Spec: spec/features/013-edit-list/.

## 014-code-quality
Status: done.

Behavior-preserving code-quality refactor before Settings (005):
- Removed dead code (`utils/language.ts`, `LIST_COLORS`, `useSelectMode.enterSelectMode`, unused hook returns/styles).
- Centralized style tokens/magic values in `componentStyles.ts`; on-primary text uses `c.background`.
- Extracted shared primitives `SelectionCheck`, `FullscreenViewer`, `FormField`, `ListsScreenBase`, and `useDragOrder`; single-source `Config`/`DEFAULT_CONFIG`.
- Unified i18n naming (`Translations`/`LanguageId`) and test layout (`tests/components`, `tests/hooks`, `tests/helpers`) with new-primitive coverage.
- Spec: spec/features/014-code-quality/.

## 015-settings-sections
Status: done.

Settings restructured as a hub with dedicated sub-screens:
- Settings hub (Appearance, Regional, Personalization, Data) navigating to new stack screens.
- `listLayout` split into `homeLayout` (grid) + `listsLayout` (list); new `editShowNotes` / `editShowPhotos` option checkboxes gate the edit-item modal while `showNotes` / `showPhotos` scope to list-detail rows.
- Finly parity: Appearance options carry icons (Dark, Light, System) and size glyphs with one shared button height; Regional shows an uppercase `LANGUAGE` header above the `Language` label over a bordered flag dropdown (emoji on native, SVG on web) with a temporary selection applied via Select / discarded via Cancel; Personalization splits the Lists screen into three background-separated cards (Layout / Item display / Edit item) with no dividers, the last two using "Optional fields" checkboxes.
- Factory reset requires typing `DELETE` in a second modal.
- Spec: spec/features/015-settings-sections/.

## 016-collections
Status: done.

User-defined collections that organize lists, plus a first-class Collections screen, combined select, per-section layouts, and detail/visual polish:
- New `collections` table (id, name, color, icon, created_at, position); `lists.collection_id` nullable FK → collections with a `lists_collection_id` index; `SCHEMA_VERSION` 5 (pre-1.0, the schema is rebuilt from the canonical `createSchema` instead of a versioned migration chain). Drizzle + Zod schemas, DB drift expectations, backup export/import, and `clearDataKeepSettings()` / `resetDatabase()` all cover the new table.
- AppContext groups lists per collection (`listsByCollectionId`) and exposes `baseLists` (standalone lists) + `collections` (`CollectionWithCounts`).
- Home shows a *Collections* section (collection tiles with icon, name, and N/total progress over their member lists) above the standalone *Lists* section; both are drag-reorderable via `Sortable.Grid`, and search scopes collections by name (lists still by name + item names).
- Home FAB opens an "Add" chooser (Add collection / Add list); Lists and Collection modes keep the direct FAB → Create list, and creating inside a collection passes `collectionId` to scope the new list's position.
- Collection detail: header block (tinted icon badge, colored name, N/total), member-list grid with search + select-mode bulk delete, pencil → edit (delete lives on Edit Collection), FAB adds a list into the collection.
- Shared `CollectionForm` (name with `validateCollectionName` + debounced duplicate check excluding the edited collection, icon grid, quick/custom color picker), `CreateCollectionScreen` and `EditCollectionScreen`.
- Drawer gains a *Collections* entry (`albums-outline`) opening a dedicated Collections screen (`ListsScreenBase` in `collections` mode: collections only, grid/list, search, drag-reorder, FAB → Create Collection, header select toggle).
- Home select mode mixes collections and standalone lists (combined `N selected`); *Delete* opens a single modal — the shared `CollectionDeleteModal` chooser (`Delete N collections?`, *Move lists to Lists* / *Delete lists too*) when a selected collection has lists, or one destructive confirm (`Delete N collections and M lists?`) when none do — deleting the standalone lists and collections together with no fallthrough.
- Per-section layout keys `homeCollectionsLayout` / `homeListsLayout` / `collectionsLayout` / `listsLayout` (defaults grid/grid/grid/list; legacy `home_layout` ignored) with Personalization rows for Home Collections, Home Lists, Collections screen, and Lists screen.
- Detail-header cleanup: list/collection detail headers show only search/select toggles (gated on items/member lists); delete moved into the Edit List / Edit Collection screens (outlined-red button above Save, empty → confirm / non-empty → chooser).
- Visual polish: the collection identity icon `albums-outline` replaces folder icons (empty states, Create/Detail headers, Add-chooser); Home's fully-empty state gets a combined "no collections or lists" message (`home-outline`); collections and lists carry a small fixed type badge (`albums-outline` / `list-outline`) plus a colored accent bar (top on grid cards, left on list rows); Home's *Collections* / *Lists* section titles show their type icon, and the *Lists* title appears even when there are only lists; on the Lists screen a collection-list shows its collection name (collection color) under the list name.
- i18n: `collection_*`, `collections_empty`, `home_add_collection`, `home_add_choice_title`, `home_section_lists`, `home_empty_all` / `home_empty_all_hint`, `collection_delete_many_title` / `collection_delete_combined_title` (+ messages), layout/settings keys in both `en` and `es`.
- Spec: spec/features/016-collections/.

## 017-copy-list
Status: done.

Copy a list's contents to the clipboard from the list detail screen:
- Two header-row copy buttons (shown only when the list has items): *Copy names* (`list-outline`) and *Copy all* (`copy-outline`).
- `src/utils/copyList.ts` `buildListCopyText(listName, items, withNotes)` → list name first, then a **blank line**, then each item in position order; done items prefixed `✅`; notes appended after ` — ` when copying all.
- Clipboard via `expo-clipboard` (`setStringAsync`); transient checkmark + "Copied" feedback.
- Spec: spec/features/017-copy-list/.

## 018-drag-list-into-collection
Status: done.

Drag a standalone list onto a collection on Home to group it:
- `listRepo.moveToCollection(listId, collectionId)` appends the list at the collection's end (`MAX(position) + 1`) in a transaction.
- The collections grid renders each card/row inside `Sortable.BaseZone` under a `Sortable.MultiZoneProvider`; while a list is dragged over a collection it shows an accent highlight (`dropTarget`) + `home_drop_hint` accessibility hint.
- Zones ignore collection drags (collections-grid `onDragStart` clears the dragging-list ref); the drop skips the grid's reorder for that drag.
- On Home the lists grid enables dragging with ≥ 1 list (other screens keep the `> 1` reorder guard), so a lone list can be dragged into a collection.
- Spec: spec/features/018-drag-list-into-collection/.

## 019-remove-list-from-collection
Status: done.

Drag a member list out of a collection on Collection detail to make it standalone:
- A "Remove from collection" target (pill with icon + label) appears above the FAB while a member list is dragged; dropping on it removes the list (`listRepo.removeFromCollection` sets `collection_id = NULL` and appends it at the end of the standalone lists) and skips the grid reorder.
- The target is highlighted while hovered; releasing a member elsewhere keeps reordering within the collection.
- The members grid enables dragging with ≥ 1 list on Collection detail (like Home), so a lone member can be dragged out.
- Spec: spec/features/019-remove-list-from-collection/.

## 020-complete-all-and-clear-completed
Status: done.

Batch actions for a list's items, from a toolbar under the List detail header:
- A bounded-chip toolbar (Complete all / Uncomplete all / Clear completed) shows when the list has items and no search or select mode is active; each button is disabled when its action is a no-op.
- `itemRepo.setAllChecked(listId, checked)` checks/unchecks every item of one list (Complete all / Uncomplete all); `itemRepo.deleteCompleted(listId)` transactionally deletes the checked items (cleaning up their photos) after a destructive confirmation dialog that displays the count.
- Spec: spec/features/020-complete-all-and-clear-completed/.

## 021-pin-favorites
Status: done.

Pin/favorite lists and collections (star) so they stay on top:
- The select-mode action bar gains a star action on Home, Lists, Collections, and Collection detail: **Pin** (`star`) pins every selected list/collection, **Unpin** (`star-outline`) appears when all selected items are already pinned and restores their order; the button is disabled at 0 selected (the icon depicts the result of pressing the button). Runs under `ERROR_SCOPE.pinLists`/`unpinLists`.
- Pinned lists and collections float to the top of their sections (`pinned DESC, position` ordering via `listRepo.setPinned`/`collectionRepo.setPinned`) and show an amber `star` indicator (theme token `c.star`, a11y `home_pinned`) next to the name on grid cards and rows; the star is also visible while in select mode so pinning/unpinning gives immediate feedback.
- The action bar's star action wraps with the other buttons so it is never clipped on narrow screens (long es labels, scaled text).
- The sortable grids are keyed on the **ordered** item ids so pinning/unpinning re-measures and re-lays out immediately (pinned cards never overlap stale slots), across Home, Lists (grid+list), Collections, and Collection detail; the key is frozen during an active drag (`useFrozenKey`).
- Dragging a single item across the pinned boundary toggles its pin — drop at/above the block **pins**, drop below **unpins** — keeping the dropped position (`listRepo`/`collectionRepo.reorderFromDrag`, applied atomically); the pinned block shows an accent tint while a non-pinned card is dragged. Deterministic (no optimistic-order/refresh race).
- Schema: `lists.pinned`, `collections.pinned` (`SCHEMA_VERSION 6`); backup includes the flags and old schema-5 backups import with everything unpinned.
- Spec: spec/features/021-pin-favorites/.

## 022-item-sorting
Status: done.

Per-list sort toggle on List detail (Manual → Name → Created) with a direction arrow, kept in local state (not a settings option):
- A bounded pill (`swap-vertical` + mode label + direction arrow + `chevron-down`) is the first chip of the toolbar's first row (next to *Merge into…*), and opens the shared `OptionPickerModal` with five one-tap options (Manual, Name asc/desc, Created asc/desc); the pill is primary-tinted and drag-reorder is disabled in non-manual modes.
- Pure `src/utils/itemSort.ts` (`sortItems` stable, case-insensitive numeric-aware `localeCompare` for name, lexicographic for `created_at`); search keeps the active sort applied to filtered results; the choice resets to Manual on re-entry.
- Schema `SCHEMA_VERSION 7`: `items.updated_at` added to DDL/Drizzle/Zod, stamped on create/update/toggle/setAllChecked/reorder; backup round-trips it and leniently defaults it to `created_at` for schema-6 imports.
- i18n en/es keys `item_sort*`. Verified on web at 375px (all sort modes, search retention, drag persistence, reset-to-Manual, Spanish labels).
- Spec: spec/features/022-item-sorting/.

## 023-copy-lists
Status: done.

Copy a list's data into the app (beyond the feature-017 clipboard copy):
- *Duplicate list*: Edit List gains a *Duplicate list* button opening the create flow pre-filled as an editable draft (`"<Name> copy"`, same icon/color); Save creates the list and copies its items in one transaction.
- *Copy items into another list*: a third compact header action on List detail (hidden when empty or when no other list exists, `duplicate-outline` icon) opens a shared `ListPickerModal` with a descriptive title + subtitle, and appends a full-fidelity copy of the items (name, note, checked, pictures; fresh timestamps; image files deep-copied so each list owns its photos; same-name items already in the target are skipped — case-insensitive dedupe, target items never modified, positions stay contiguous); feedback names the result ("Items copied into \"<Target>\"").
- Repo: `itemRepo.duplicateItems(sourceListId, targetListId)` + a transactional duplicate-list path; no schema change (`SCHEMA_VERSION` 7).
- Spec: spec/features/023-copy-lists/.

## 024-move-list-between-collections
Status: done.

Assign / move a list between collections (and back to standalone) from Edit List, complementing drag-in/drag-out:
- A *Collection* selector row opens a `CollectionPickerModal` (all collections + *Standalone / No collection*, current selection checked); the move applies on Save via `listRepo.moveToCollection` / `listRepo.removeFromCollection` (append at destination's end, parity with drag) only when the selection changed.
- No schema or repo change (`SCHEMA_VERSION` 7).
- Spec: spec/features/024-move-list-between-collections/.

## 025-merge-lists
Status: done.

Merge one list into another:
- A *Merge into…* action on the source list **Edit List** screen (visible when the list has items **and another list exists**, hidden for locked lists; the second button of the bottom stack, under *Delete list*, amber `warning` token); it opens `ListPickerModal` (excludes self), then a destructive confirmation ("Merge N items into <Target> and delete <Source>?").
- `itemRepo.mergeInto(sourceId, targetId)` transactionally appends a full-fidelity copy of the source's items to the target (same case-insensitive name-dedupe rule as 023: same-name items already in the target are skipped and the target item is never modified), deletes the source (cleaning up only the dedupe-skipped items' photos), and rolls back on failure; after merging the app resets the stack to the target (Home → ListDetail) with a "Merged into <Target>" toast.
- No schema change (`SCHEMA_VERSION` 7).
- Spec: spec/features/025-merge-lists/.

## 026-numeric-lists
Status: done.

Lists whose items also carry a generic Amount and an integer Quantity (shopping, counting materials):
- `lists.kind` (`'standard'` | `'numeric'`), chosen in Create List and changeable in Edit List. `items.amount_minor` (integer minor units, nullable) and `items.quantity` (INTEGER, default 0); schema `SCHEMA_VERSION` 8.
- On a numeric list, `AddItemBar` / `ItemFormModal` / `ItemRow` show an Amount (2 decimals, cap 999,999.99), a Quantity stepper (0..99,999, starts at 1) and a read-only line total (`amount × quantity`); standard lists are unchanged.
- The list detail header shows two read-only rows — **Total** (all items) and **Done** (checked items only) — summed in integer minor units (no float drift) and formatted with 2 decimals. (Feature 034 later adds a value-weighted progress bar above these rows.)
- Duplicate / copy-to-list / merge carry `kind` and the numeric fields (any kind into any kind); backups round-trip them with lenient defaults for older backups.
- A numeric list's tile shows a kind badge (`calculator-outline`, accessible label `list_kind_numeric`) on Home / Lists / Collection detail, so the kind is visible without opening it; standard lists and collections show none.
- `utils/numeric.ts` (parse/format/clamp/lineTotal/sumTotals); i18n en/es `list_kind*`, `item_amount_label`, `item_quantity_label`, `item_line_total_label`, `list_total_label`, `list_done_total_label`.
- Spec: spec/features/026-numeric-lists/.

## 027-locked-lists
Status: done.

Lock a list with a passphrase so its items are encrypted at rest (real confidentiality):
- Per-list passphrase (min 6 chars) → PBKDF2-HMAC-SHA-512 (600,000 iterations) → AES-256-GCM; a `vaults` table (`list_id`, `salt`, `kdf_iterations`, `kdf_digest`, `kdf_version`, `verifier`, `payload`, `updated_at`); `SCHEMA_VERSION` 8 → 9.
- Locking encrypts the items into the vault and deletes the plaintext rows in one transaction; any list can be locked (even empty — lock first, add items after unlocking); a locked list shows a lock badge, hides its progress, is excluded from search/totals, and opens a passphrase lock screen.
- Unlock decrypts into memory for the open session and re-locks on leaving the screen; edits are re-encrypted; *Remove lock* restores plaintext rows. No recovery (lost passphrase = permanent loss); photos are disallowed in locked lists (v1).
- Cross-list actions (copy-to-list / merge / duplicate) are unavailable for a locked list; backup exports the vault encrypted and omits locked items from plaintext.
- KDF is native (`react-native-quick-crypto`) on device and `crypto.subtle` on web; requires a development build (no Expo Go). Crypto spike verified: PBKDF2 sha512 600k ≈ 165 ms on the emulator. In Expo Go the native crypto is loaded lazily so the app runs normally and vault actions show an explanatory message (see `docs/locked-lists.md`).
- An unlocked locked list renders as a normal list (bottom-pinned add bar, search, select, sort, batch toolbar, edit/delete), with every write re-encrypted via `saveUnlocked`; a locked list offers *Change passphrase* (current + new ×2, fresh salt, same KDF config, items unchanged) instead of *Lock list*. The photo affordance is hidden in the add bar and edit modal whenever the list is locked (so photos can't enter a locked list), and *Change passphrase* is never photo-blocked — the photos guard applies only to locking a plaintext-with-photos list.
- Spec: spec/features/027-locked-lists/.

## 028-per-kind-optional-fields
Status: done.

Configure the optional item fields (Notes, Photos) independently for standard and numeric lists:
- `Config` gains `showNotesNumeric` / `showPhotosNumeric` / `editShowNotesNumeric` / `editShowPhotosNumeric` (default `true`, DB keys `*_numeric`); the existing four keys remain the standard-list flags. No schema-version change (row-per-key config, lenient read).
- `useItemDisplayFlags(numeric)` resolves the effective flag pair; `ItemRow`, `AddItemBar` and `ItemFormModal` read through it.
- Personalization groups the optional-field cards by kind (Standard lists / Numeric lists), eight checkboxes total.
- Spec: spec/features/028-per-kind-optional-fields/.

## 029-more-languages
Status: done.

Ship the app in the same nine languages as Finly (same order, same flags):
- `LANGUAGES` = `en, es, ca, gl, eu, fr, de, pt, it`; the `language` config enum and `i18n/index` registry cover all nine.
- New translation files `ca/gl/eu/fr/de/pt/it` (typed against `en`'s `Translations`, so key parity is enforced by typecheck + an i18n parity test). Shared strings are ported from Finly; Listly-only strings (collections, items, lists, vault, numeric) are translated.
- Regional picker lists all nine in order; `lang_*` labels show each language in its own language. Native flags use emoji where available (en/es/fr/de/pt/it) and a neutral glyph for ca/gl/eu (no emoji flag); web renders SVG flags for all nine.
- The multilingual README (English + eight translations) ships under 030.

## 030-multilingual-readme
Status: done.

Ship a full multilingual README for the project (mirroring Finly), documenting the released app:
- Nine files at the repo root: `README.md` (English) + `README.{es,ca,gl,eu,fr,de,pt,it}.md`, each with a language bar linking the other eight and identical section headings.
- Sections: intro + info table (platforms, version, languages, data, themes); a feature list covering features 001-029; a screenshot gallery; a tech-stack table; Development (requirements, first run, commands, testing, project layout, database, Android build, methodology); License.
- `images/screenshots/` holds the real **375x812** captures of the web build in **dark mode** (Home empty/populated, drawer with the app version, create list, list detail, numeric list, add-item expanded, item edit, collections/lists/collection detail, lock + locked, select mode, settings hub/appearance/language/regional/personalization/data).
- Small app change for parity + the screenshot: the drawer shows `v{Constants.expoConfig?.version}` (`v1.0.0`) right-aligned at the bottom, via the new `expo-constants` dependency.
- Spec: spec/features/030-multilingual-readme/.

## 031-release-pipeline
Status: done.

Prepare the v1.0.0 release: version metadata, EAS Build scaffolding, and signing-key strategy (mirrors Finly):
- `app.json` gains `android.versionCode` (`1`) and `ios.buildNumber` (`"1.0.0"`), read by EAS via `cli.appVersionSource: "local"`; `android.adaptiveIcon.backgroundColor` aligned to Finly (`#E6F4FE`).
- `ListlyApp/eas.json` (development / preview / production profiles; production = store AAB) and a root `.easignore`. `npx eas-cli init` creates Listly's own `extra.eas.projectId`.
- Signing: the official artifact is an EAS Build, which generates and stores the Android release keystore for the project so later versions share one signature and update in place, with no uninstall. Back the key up with `eas credentials`; keystores are never committed.
- Declared `expo-font` (`~57.0.4`) so `expo doctor` passes 21/21 (peer dependency required by `@expo/vector-icons`; missing it fails the EAS build).
- CI simplified to Finly parity (test-only: `npm ci` + `npm run test:all`).
- Spec: spec/features/031-release-pipeline/.

## 032-numeric-copy-amounts
Status: done.

Include amounts, quantities and sums when copying a numeric list to the clipboard:
- Numeric item lines become `[✅ ]<name> — <amount> × <quantity> = <lineTotal>` (segment always shown, incl. quantity 1; a null amount renders as `0.00`).
- A non-empty numeric list ends with a blank line then `Total:` (all items) and `Done:` (checked only), using the existing localized `list_total_label` / `list_done_total_label`. Empty numeric lists omit the footer.
- Standard lists are unchanged. `buildListCopyText` takes an options object `{ withNotes, numeric?, labels? }` and stays pure (labels injected by `useClipboardCopy` via `useLabels`).
- Spec: spec/features/032-numeric-copy-amounts/.

## 033-amount-blank-on-focus
Status: done.

Stop forcing users to delete a pre-filled `0.00` before typing an amount when editing a numeric item:
- Focusing the **Amount** field of a numeric item clears it when the current text is empty or parses to `0` (empty, `0`, `0.00`); a non-zero amount is left untouched so it can be edited in place.
- Blurring an untouched (cleared) field restores the previous text, so a `0` amount stays `0` and a `null` amount stays empty; typing keeps the typed value and saves it.
- Logic lives in `useItemDraft` (shared by the edit modal and the add bar); `ItemAmountField` only forwards `onFocus`/`onBlur`. Quantity (a stepper) is unchanged; no way to clear an amount to "no amount".
- Spec: spec/features/033-amount-blank-on-focus/.

## 034-value-progress-bar
Status: done.

Add a second, value-weighted progress bar to numeric list headers:
- Below the existing item-count bar, numeric lists show a value bar whose fill is `doneValue / totalValue` (sum of checked value over total value), with the numbers (`3.20 / 22.93`) and a right-aligned percentage to two decimals (dot separator). No currency symbol.
- Shown only when the list is numeric and both total and done values are greater than zero; hidden otherwise (non-numeric, total 0, or done 0). The slot is **space-reserved** on numeric lists so toggling items never reflows the header.
- Pure helpers `valueProgressPercent` / `formatPercent2` in `src/utils/numeric.ts`; no DB/repo changes. A11y label `list_value_progress_label`.
- Spec: spec/features/034-value-progress-bar/.

## Future scope (not scheduled)
- Per-list currency symbol (the numeric list is currency-agnostic for now).
- A third "pending" (all − done) total.
- Tags, due dates, subtasks, recurring items.
- List templates and sharing.
- Cloud sync / multi-device.