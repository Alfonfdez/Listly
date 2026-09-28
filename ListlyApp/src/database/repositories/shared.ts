import { and, eq, inArray, sql, type AnyColumn, type SQL } from 'drizzle-orm';
import { withTransaction, type DrizzleDb } from '../drizzle/engine';
import { collections, items, lists } from '../drizzle/schema';
import { deleteItemPhotos, duplicateItemPhotos, parseItemPhotos, serializeItemPhotos } from '../../utils/itemPhotos';
import { dbTimestamp } from '../../utils/formatters';

export const countsSelection = {
  total: sql<number>`COUNT(${items.id})`,
  completed: sql<number>`COALESCE(SUM(CASE WHEN ${items.checked} = 1 THEN 1 ELSE 0 END), 0)`,
};

export function nextPositionSql(positionColumn: AnyColumn): SQL<number> {
  return sql<number>`COALESCE(MAX(${positionColumn}), -1) + 1`;
}

type RepoTable = typeof lists | typeof collections | typeof items;

export async function countRows(db: DrizzleDb, table: RepoTable, conditions: SQL[]): Promise<number> {
  const rows = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(table)
    .where(and(...conditions))
    .all();
  return rows[0]?.count ?? 0;
}

export async function nextPosition(
  db: DrizzleDb,
  table: RepoTable,
  positionColumn: AnyColumn,
  where?: SQL
): Promise<number> {
  const row = await db.select({ m: nextPositionSql(positionColumn) }).from(table).where(where).get();
  return row?.m ?? 0;
}

export async function reorderPositions(
  orderedIds: number[],
  updateOne: (db: DrizzleDb, id: number, index: number) => Promise<unknown>
): Promise<void> {
  await withTransaction(async db => {
    for (let i = 0; i < orderedIds.length; i++) {
      await updateOne(db, orderedIds[i], i);
    }
  });
}

export async function deletePhotosOfItems(rows: { pictures: string | null }[]): Promise<void> {
  await deleteItemPhotos(rows.flatMap(row => parseItemPhotos(row.pictures)));
}

export async function picturesOfLists(
  db: DrizzleDb,
  listIds: number[]
): Promise<{ pictures: string | null }[]> {
  if (listIds.length === 0) return [];
  return await db
    .select({ pictures: items.pictures })
    .from(items)
    .where(inArray(items.list_id, listIds))
    .all();
}

export async function copyItemsInto(
  db: DrizzleDb,
  sourceListId: number,
  targetListId: number
): Promise<number[]> {
  const sourceRows = await db
    .select()
    .from(items)
    .where(eq(items.list_id, sourceListId))
    .orderBy(items.position)
    .all();
  const targetRows = await db
    .select({ name: items.name })
    .from(items)
    .where(eq(items.list_id, targetListId))
    .all();
  const knownNames = new Set(targetRows.map(row => row.name.trim().toLowerCase()));
  let position = await nextPosition(db, items, items.position, eq(items.list_id, targetListId));
  const stamp = dbTimestamp();
  const copiedIds: number[] = [];
  for (const row of sourceRows) {
    const name = row.name.trim().toLowerCase();
    if (knownNames.has(name)) continue;
    knownNames.add(name);
    const copiedPictures = await duplicateItemPictures(row.pictures);
    await db
      .insert(items)
      .values({
        list_id: targetListId,
        name: row.name,
        checked: row.checked,
        note: row.note,
        pictures: copiedPictures,
        position,
        created_at: stamp,
        updated_at: stamp,
        amount_minor: row.amount_minor,
        quantity: row.quantity,
      })
      .run();
    copiedIds.push(row.id);
    position += 1;
  }
  return copiedIds;
}

async function duplicateItemPictures(pictures: string | null): Promise<string | null> {
  const photos = parseItemPhotos(pictures);
  if (photos.length === 0) return null;
  return serializeItemPhotos(await duplicateItemPhotos(photos));
}
