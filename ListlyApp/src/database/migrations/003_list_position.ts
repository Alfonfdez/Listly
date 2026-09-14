import type { DatabaseHandle } from '../types';

export async function addListPositions(db: DatabaseHandle): Promise<void> {
  const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(lists);');
  if (columns.some(c => c.name === 'position')) return;

  await db.execAsync(`
    ALTER TABLE lists ADD COLUMN position INTEGER NOT NULL DEFAULT 0;
    UPDATE lists SET position = id - 1;
    CREATE INDEX IF NOT EXISTS lists_position ON lists(position);
  `);
}