# 017 - Copy list

- **Objective**
  Let the user copy a list's contents to the clipboard from the list detail screen: the list name plus each item's name (optionally with notes), with done items marked with a green check.

---

## Functional requirements

### 1. Copy actions (ListDetailScreen)
- Two header-row copy buttons, rendered only when the list has items:
  - *Copy names* (`copy-outline` icon): list name + item names.
  - *Copy all* (`reader-outline` icon): list name + item names + notes.
- Both write plain text to the clipboard via `expo-clipboard` (`setStringAsync`).

### 2. Copy format
- `src/utils/copyList.ts` `buildListCopyText(listName, items, withNotes)` returns:
  - First line: the list name.
  - One line per item in `position` order.
  - Done items (`checked === 1`) are prefixed with `✅ `.
  - With notes: a non-empty note is appended after ` — `; empty/null notes are omitted.

### 3. Feedback
- After copying, the tapped button's icon flips to a green `checkmark` and a transient, action-specific label appears — "List copied" (names only) or "List + notes copied" (with notes) — reverting after ~1.5s.

### 4. i18n
- New keys en/es: `list_copy_all`, `list_copy_names`, `list_copied_names`, `list_copied_notes`.

---

## Non-functional requirements

- **TypeScript strict**, no `any`; theme tokens + `fs()`; accessibility labels on both buttons.
- **Dependency**: adds `expo-clipboard` (iOS/Android/Web).
- **Tests**: `buildListCopyText` unit tests; `ListDetailScreen` tests (icons hidden when empty, present when items exist, each action calls `Clipboard.setStringAsync` with the right text, confirmation label).
- **Verification**: `npm run test:all`; web loop at 375px (copy both variants, confirm format + `✅` markers; icons hidden on an empty list).

---

## Acceptance criteria

- [x] Two copy icons appear in the list header only when the list has items.
- [x] *Copy names* copies the list name and each item name (done items marked `✅`).
- [x] *Copy all* copies the list name, item names, and their notes.
- [x] After copying, the icon briefly shows a checkmark and a specific label ("List copied" or "List + notes copied").
- [x] The copy text is in position order.
- [x] All new labels exist in en and es.
- [x] `npm run test:all` passes.
