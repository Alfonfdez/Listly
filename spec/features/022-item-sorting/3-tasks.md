# 022 — Item sorting: Tasks

- [ ] Create `spec/features/022-item-sorting/` (1-spec, 2-plan, 3-tasks).
- [ ] Schema: `SCHEMA_VERSION` 7, `items.updated_at` (DDL `001_initial.ts`, Drizzle column, Zod `itemSchema`, `Item`/`NewItem` types); drift expectations updated.
- [ ] Repo: stamp `updated_at` on create/update/toggle/setAllChecked/reorder; reads stay ordered by `position`.
- [ ] Backup: `updated_at` in items export/import + INSERT; `backupItemSchema` lenient default (`created_at`) so schema-6 backups import.
- [ ] New `src/utils/itemSort.ts` (ItemSort model + helpers + stable `sortItems`).
- [ ] `ListDetailScreen`: sort state, sorted display, `sortEnabled` gate, sort pill row above the batch toolbar, `OptionPickerModal` with the 5 options.
- [ ] i18n en/es: `item_sort`, `item_sort_manual`, `item_sort_name`, `item_sort_created`, `item_sort_asc`, `item_sort_desc`.
- [ ] Tests: `itemSort` util, repo `updated_at` stamps, backup round-trip/legacy, `itemSchema`, ListDetail sort/flags, drift. `npm run test:all` green.
- [ ] Docs: roadmap 022 (done) + schema note, `docs/harnesses.md` suite baseline refreshed, changelog entry.
- [ ] Verification loop at 375px + acceptance criteria flipped `[x]`.