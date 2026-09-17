import type { ContractBackend, NewItem, NewList } from '../database/contractTypes';

export function buildList(name: string, overrides: Partial<NewList> = {}): NewList {
  return {
    name,
    color: '#22D3EE',
    icon: 'cart-outline',
    ...overrides,
  };
}

export function buildItem(listId: number, name: string, overrides: Partial<NewItem> = {}): NewItem {
  return {
    list_id: listId,
    name,
    checked: 0,
    note: null,
    pictures: null,
    position: 0,
    ...overrides,
  };
}

const GROCERIES_ITEMS = [
  { name: 'Milk', checked: 0 },
  { name: 'Eggs', checked: 1 },
  { name: 'Bread', checked: 0 },
  { name: 'Coffee beans', checked: 1 },
  { name: 'Bananas', checked: 0 },
] as const;

const WORK_ITEMS = ['Email', 'Report', 'Standup'] as const;

export interface SeedResult {
  groceriesId: number;
  workId: number;
}

export async function seedFixtures(backend: ContractBackend): Promise<SeedResult> {
  const groceries = await backend.list.create(
    buildList('Groceries', { color: '#22D3EE', icon: 'cart-outline' })
  );
  const work = await backend.list.create(
    buildList('Work Tasks', { color: '#F87171', icon: 'briefcase-outline' })
  );

  let position = 0;
  for (const fixture of GROCERIES_ITEMS) {
    await backend.item.create(
      buildItem(groceries.id, fixture.name, { checked: fixture.checked, position: position++ })
    );
  }

  position = 0;
  for (const name of WORK_ITEMS) {
    await backend.item.create(buildItem(work.id, name, { position: position++ }));
  }

  return { groceriesId: groceries.id, workId: work.id };
}
