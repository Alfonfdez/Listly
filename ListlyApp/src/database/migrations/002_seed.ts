import type { DatabaseHandle } from '../types';
import { SEED_ITEMS, SEED_LISTS } from '../seedData';

export async function seedData(db: DatabaseHandle): Promise<void> {
  await db.withTransactionAsync(async () => {
    await seedDataInner(db);
  });
}

export async function seedDataInner(db: DatabaseHandle): Promise<void> {
  for (const list of SEED_LISTS) {
    await db.runAsync(
      `INSERT OR IGNORE INTO lists (id, name, color, icon) VALUES (?, ?, ?, ?)`,
      list.id, list.name, list.color, list.icon
    );
  }

  for (const item of SEED_ITEMS) {
    await db.runAsync(
      `INSERT OR IGNORE INTO items (id, list_id, name, checked, note, position) VALUES (?, ?, ?, ?, ?, ?)`,
      item.id, item.list_id, item.name, item.checked, item.note, item.position
    );
  }
}