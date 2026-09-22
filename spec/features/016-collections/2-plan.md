# 016 — Collections: Plan

## Architecture

```
AppDrawer
└── Main (HomeStack, native stack)
    ├── Home        → ListsScreenBase mode="home"      (homeListsLayout / homeCollectionsLayout)
    ├── Lists       → ListsScreenBase mode="lists"     (listsLayout)
    ├── Collections → ListsScreenBase mode="collections" (collectionsLayout)
    ├── CollectionDetail → CollectionDetailScreen (ListsView mode="collection")
    ├── CreateList / EditList
    ├── CreateCollection / EditCollection
    └── Settings* (hub + sub-screens)
```

`ListsScreenBase` is the single orchestration point for Home/Lists/Collections: it owns search + select state, the combined select count, the collection-delete chooser, and hands variants + modes to the shared `ListsView`. The drawer reset (Home/Lists/Collections) dispatches `CommonActions.reset` to the tapped root.

## Data model

- New `collections` table (`id`, `name`, `color`, `icon`, `created_at`, `position`) + `lists.collection_id` nullable FK (index `lists_collection_id`); `SCHEMA_VERSION` 5 (pre-1.0 rebuild from `createSchema`).
- New config keys `homeCollectionsLayout` / `homeListsLayout` / `collectionsLayout` / `listsLayout` (DB keys `home_collections_layout` / `home_lists_layout` / `collections_layout` / `lists_layout`; defaults grid/grid/grid/list).
- `collectionRepo` gains `deleteMany(ids, mode)` (`move` → clear `collection_id`, `cascade` → delete lists + photos) and `reorder`.

## Components

| Component | Location | Change |
|-----------|----------|--------|
| `CollectionCard` / `CollectionRow` | `src/components/` | **New** — collection tile / row (badge, name, N/total) + `TypeBadge` |
| `ListCard` / `ListRow` | `src/components/` | Add `TypeBadge` (top-right on cards, trailing on rows) |
| `TypeBadge` | `src/components/TypeBadge.tsx` | **New** — fixed `albums-outline` / `list-outline` badge, hidden in select mode |
| `AddChooserModal` | `src/components/` | **New** — "Add" chooser (Add collection / Add list) |
| `CollectionDeleteModal` | `src/components/` | **New** — shared chooser (`Move lists to Lists` / `Delete lists too`) |
| `ListsView` | `src/components/` | Mode/variant support, combined empty states, collection section, drag reorder |
| `ListsScreenBase` | `src/screens/` | **New** — shared Home/Lists/Collections orchestration |
| `HomeScreen` / `ListsScreen` | `src/screens/` | Thin wrappers over `ListsScreenBase` |
| `CollectionsScreen` | `src/screens/` | **New** — `ListsScreenBase` in `collections` mode |
| `CollectionDetailScreen` | `src/screens/` | Header block, member grid, trash → `CollectionDeleteModal` |
| `CollectionForm` + `Create/EditCollectionScreen` | `src/screens/`, `src/components/` | **New** — shared form + screens |
| `PersonalizationScreen` | `src/screens/settings/` | 4 layout rows (Home Collections/Lists, Collections, Lists) |

## Navigation

- `RootStackParamList` gains `Collections`, `CollectionDetail`, `CreateCollection`, `EditCollection`.
- `AppNavigator`: drawer *Collections* entry (`albums-outline`); Collection detail + Create collection headers use `albums-outline`; `CollectionsNavCapture` mirrors `HomeNavCapture`.

## i18n

New keys (en/es): `collection_*`, `collections_empty` (+ hint), `home_add_collection`, `home_add_choice_title`, `home_section_lists`, `home_empty_all` / `home_empty_all_hint`, `collection_delete_many_title`, `settings_collections_screen`, `settings_list_layout`, `layout_grid`, `layout_list`.

## Data flow

- `useApp()` → `collections`, `listsByCollectionId`, `baseLists`, `lists`, `itemsByListId`; refresh on focus.
- Home search filters collections by name and lists by name + item names; Collections search filters collections only.
- Combined select: `selectedIds` (lists) + `selectedCollectionIds` (collections) → `selectedCount`; delete routes through a single modal — `CollectionDeleteModal` chooser when a selected collection has member lists, or one destructive `ConfirmModal` when none do — deleting the standalone lists and collections together.

## Risks / notes

- `react-native-sortables` drag must stay behind `sortEnabled = !selectMode && !searching && length > 1`; unit tests use the sortables mock, the real grid is covered by the Playwright loop.
- The RN `Modal` (`animationType="fade"`) keeps children mounted after close in tests — assert the functional contract (repo calls, selection state), not modal disappearance.
- The `TypeBadge` must not collide with `SelectionCheck` (both top-right): badge is hidden in select mode.
