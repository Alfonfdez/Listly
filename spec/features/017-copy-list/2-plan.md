# 017 — Copy list: Plan

## Architecture

```
ListDetailScreen header row
└── copy group (shown when items.length > 0)
    ├── Copy names → buildListCopyText(list.name, items, false) → Clipboard.setStringAsync
    └── Copy all   → buildListCopyText(list.name, items, true)  → Clipboard.setStringAsync
```

## Data model

- No schema change; reads `list.name` and the existing `items` (`name`, `checked`, `note`, `position`).

## Components

| Component | Location | Change |
|-----------|----------|--------|
| `copyList.ts` | `src/utils/copyList.ts` | **New** — pure `buildListCopyText(listName, items, withNotes)` |
| `ListDetailScreen` | `src/screens/ListDetailScreen.tsx` | Two copy buttons (in the header row, left of the pencil) + transient feedback |

## Clipboard

- `expo-clipboard` (`setStringAsync`) — one API for iOS/Android/Web.

## i18n

- New keys en/es: `list_copy_names`, `list_copy_all`, `list_copied_names`, `list_copied_notes`.

## Data flow

- Copy buttons render only when `items.length > 0`; pressing one calls `copyList(withNotes)` → `setStringAsync(text)` → `copiedAction` state → checkmark + specific label ("List copied" / "List + notes copied") for ~1.5s.

## Risks / notes

- The full-copy icon must not collide with `ItemRow`'s note indicator (`document-text-outline`); use `copy-outline`.
- The copy callback guards against `list === null` (missing route id) and is registered before the `if (!list)` early return to keep hooks order stable.
- The feedback timeout is cleared on unmount to avoid a post-unmount state update.
