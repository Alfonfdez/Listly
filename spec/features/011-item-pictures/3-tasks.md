# 011 — Item pictures: Tasks

- [x] Create `spec/features/011-item-pictures/` (1-spec, 2-plan, 3-tasks).
- [x] Migration `004_item_pictures` (`items.pictures TEXT`, idempotent, `SCHEMA_VERSION` 4); Drizzle + Zod updated (nullable, last key).
- [x] Add `itemPhotos.ts` (parse/serialize/`itemPhotoFileName`/`deleteItemPhotos`) + `useItemPhotos` (take/gallery/copy/remove).
- [x] `PhotoSection` (thumbnails, dashed add box, source modal) + `PhotoViewer` (full-screen) + `ItemRow` thumbnails + `ItemFormModal` photo section.
- [x] `itemRepo` create/update persist `pictures`; delete/deleteMany and `listRepo` delete/deleteMany clean photo files.
- [x] ListDetailScreen add flow (details area + photos + reset after submit) and edit flow (pre-loaded photos).
- [x] i18n `item_photos_*` keys in en/es; `expo-image-picker` + `expo-file-system` deps.
- [x] Tests: pictures contract round-trip, `itemPhotos` util, `PhotoSection`, `ItemRow` thumbnails, `ListDetailScreen` add/update photos; dbDrift/schemas → version 4. `npm run test:all` green.
- [x] Verification loop at 375px (details area, up to 3 gallery photos, max-3 guard, thumbnails, viewer, edit modal, removal confirm, persistence; camera native-only) + flip acceptance criteria `[x]`.
- [x] Update roadmap (011 → done), harnesses baseline, changelog (append at end).
