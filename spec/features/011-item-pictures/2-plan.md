# 011 — Item pictures: Plan

## Architecture

```
ListDetailScreen
├── add bar (details area) → PhotoSection (thumbnails + "Add photo" + source modal)
└── ItemFormModal (edit) → PhotoSection under Note
ItemRow → thumbnail strip → PhotoViewer (full-screen)
```

Photos attach in the same expandable "details" area as the note. Storage mirrors Finly: one `items.pictures` TEXT column holding a JSON array of URIs — file URIs in the document directory on native, base64 data URLs inline on web.

## Data model

- Migration `004_item_pictures` adds nullable `items.pictures TEXT` (idempotent `ALTER TABLE`); `SCHEMA_VERSION` → 4.
- Drizzle `items.pictures` nullable text; Zod `itemSchema.pictures: z.string().nullable()` (last key, matching physical column order for db-drift).
- JSON array of URIs (`[]` → `null`); reads tolerate a legacy scalar as a single photo. `MAX_ITEM_PICTURES = 3` (UI-only).

## Components

| Component | Location | Change |
|-----------|----------|--------|
| `itemPhotos.ts` | `src/utils/itemPhotos.ts` | **New** — `parseItemPhotos` / `serializeItemPhotos` / `itemPhotoFileName` / `deleteItemPhotos` |
| `useItemPhotos` | `src/hooks/useItemPhotos.ts` | **New** — take/gallery/remove state |
| `PhotoSection` | `src/components/PhotoSection.tsx` | **New** — 80×80 thumbs, dashed add box, source modal |
| `PhotoViewer` | `src/components/PhotoViewer.tsx` | **New** — full-screen viewer + close |
| `ItemRow` | `src/components/ItemRow.tsx` | Thumbnail strip (36×36) below name |
| `ItemFormModal` | `src/components/ItemFormModal.tsx` | Photo section under Note, `initialPhotos` |

## Navigation

- No new routes; the photo viewer and source modal are local modals.

## i18n

New keys en/es: `item_photos_title`, `item_photos_add`, `item_photos_take` (native only), `item_photos_gallery`, `item_photos_remove`, `item_photos_remove_confirm`, `item_photos_remove_message`; the details toggle relabels to `item_add_note_toggle` ("Toggle details").

## Data flow

- Create/update serialize `pictures` via `serializeItemPhotos`; `itemRepo.create/update` persist it.
- `itemRepo.delete/deleteMany` and `listRepo.delete/deleteMany` gather affected `pictures`, delete files after the row deletion (`deleteItemPhotos`), no-op on web.
- Native copies picked photos into the document directory (`useItemPhotos`); web stores base64 data URLs.

## Risks / notes

- Keep `expo-file-system` out of the DB test import graph (lazy/static seam).
- Photo cleanup must run after the row delete (idempotent on web / empty lists).
- Camera capture is native-only and not checkable on web.
