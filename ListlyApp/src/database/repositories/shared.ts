import { inArray, sql, type AnyColumn, type SQL } from 'drizzle-orm';
import { getDrizzle } from '../drizzle/engine';
import { items } from '../drizzle/schema';
import { deleteItemPhotos, parseItemPhotos } from '../../utils/itemPhotos';

export const countsSelection = {
  total: sql<number>`COUNT(${items.id})`,
  completed: sql<number>`COALESCE(SUM(CASE WHEN ${items.checked} = 1 THEN 1 ELSE 0 END), 0)`,
};

export function nextPositionSql(positionColumn: AnyColumn): SQL<number> {
  return sql<number>`COALESCE(MAX(${positionColumn}), -1) + 1`;
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
