import type { DatabaseHandle } from '../types';

export async function addItemPictures(db: DatabaseHandle): Promise<void> {
  const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(items);');
  if (columns.some(c => c.name === 'pictures')) return;

  await db.execAsync('ALTER TABLE items ADD COLUMN pictures TEXT;');
}