import { eq, inArray, sql, type AnyColumn, type SQL } from 'drizzle-orm';
import { getDrizzle, withTransaction, type DrizzleDb } from '../drizzle/engine';
import { items } from '../drizzle/schema';
import { deleteItemPhotos, parseItemPhotos } from '../../utils/itemPhotos';
import { dbTimestamp } from '../../utils/formatters';

export const countsSelection = {
  total: sql<number>`COUNT(${items.id})`,
  completed: sql<number>`COALESCE(SUM(CASE WHEN ${items.checked} = 1 THEN 1 ELSE 0 END), 0)`,
};

export function nextPositionSql(positionColumn: AnyColumn): SQL<number> {
  return sql<number>`COALESCE(MAX(${positionColumn}), -1) + 1`;
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

export async function deletePhotosOfLists(listIds: number[]): Promise<void> {
  if (listIds.length === 0) return;
  const db = await getDrizzle();
  const rows = await db
    .select({ pictures: items.pictures })
    .from(items)
    .where(inArray(items.list_id, listIds))
    .all();
  await deletePhotosOfItems(rows);
}

export async function copyItemsInto(
  db: DrizzleDb,
  sourceListId: number,
  targetListId: number
): Promise<void> {
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
  const baseRow = await db
    .select({ m: nextPositionSql(items.position) })
    .from(items)
    .where(eq(items.list_id, targetListId))
    .get();
  let position = baseRow?.m ?? 0;
  const stamp = dbTimestamp();
  for (const row of sourceRows) {
    const name = row.name.trim().toLowerCase();
    if (knownNames.has(name)) continue;
    knownNames.add(name);
    await db
      .insert(items)
      .values({
        list_id: targetListId,
        name: row.name,
        checked: row.checked,
        note: row.note,
        pictures: row.pictures,
        position,
        created_at: stamp,
        updated_at: stamp,
      })
      .run();
    position += 1;
  }
}
