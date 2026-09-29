import { describe, expect, it, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react-native';
import { useItemStore, type ItemDraft } from '../../src/hooks/useItemStore';
import type { Item } from '../../src/database/types';

const itemRepoMock = vi.hoisted(() => ({
  create: vi.fn(async () => ({})),
  update: vi.fn(async () => {}),
  delete: vi.fn(async () => {}),
  deleteMany: vi.fn(async () => {}),
  toggle: vi.fn(async () => {}),
  reorder: vi.fn(async () => {}),
  setAllChecked: vi.fn(async () => {}),
  deleteCompleted: vi.fn(async () => {}),
}));

vi.mock('../../src/database', () => ({ itemRepository: itemRepoMock }));

type Vault = Parameters<typeof useItemStore>[0]['vault'];

function item(id: number, position: number): Item {
  return {
    id,
    list_id: 10,
    name: `item-${id}`,
    checked: 0,
    note: null,
    position,
    created_at: 'x',
    updated_at: 'x',
    pictures: null,
    amount_minor: null,
    quantity: 0,
  };
}

function vaultStub(unlocked: boolean, items: Item[] = []) {
  return {
    unlocked,
    items,
    addItem: vi.fn(async () => {}),
    updateItem: vi.fn(async () => {}),
    deleteItem: vi.fn(async () => {}),
    deleteMany: vi.fn(async () => {}),
    toggleItem: vi.fn(async () => {}),
    setAllChecked: vi.fn(async () => {}),
    deleteCompleted: vi.fn(async () => {}),
    reorder: vi.fn(async () => {}),
  };
}

const DRAFT: ItemDraft = { name: 'New', note: null, pictures: null, amount_minor: null, quantity: 0 };

describe('useItemStore', () => {
  beforeEach(() => {
    Object.values(itemRepoMock).forEach((fn) => fn.mockClear());
  });

  it('exposes the repo items when the vault is locked', async () => {
    const repoItems = [item(1, 0), item(2, 1)];
    const { result } = await renderHook(() =>
      useItemStore({ listId: 10, repoItems, refresh: vi.fn(async () => {}), vault: vaultStub(false) as unknown as Vault })
    );
    expect(result.current.items).toBe(repoItems);
  });

  it('exposes the vault items when unlocked', async () => {
    const vaultItems = [item(5, 0)];
    const vault = vaultStub(true, vaultItems);
    const { result } = await renderHook(() =>
      useItemStore({ listId: 10, repoItems: [item(1, 0)], refresh: vi.fn(async () => {}), vault: vault as unknown as Vault })
    );
    expect(result.current.items).toBe(vaultItems);
  });

  it('adds via the repo, computing the next position, then refreshes', async () => {
    const refresh = vi.fn(async () => {});
    const { result } = await renderHook(() =>
      useItemStore({ listId: 10, repoItems: [item(1, 0), item(2, 1)], refresh, vault: vaultStub(false) as unknown as Vault })
    );

    await result.current.add(DRAFT);

    expect(itemRepoMock.create).toHaveBeenCalledWith(
      expect.objectContaining({ list_id: 10, checked: 0, position: 2, name: 'New' })
    );
    expect(refresh).toHaveBeenCalled();
  });

  it('dispatches every repo mutation and refreshes (except removeMany)', async () => {
    const refresh = vi.fn(async () => {});
    const { result } = await renderHook(() =>
      useItemStore({ listId: 10, repoItems: [item(1, 0)], refresh, vault: vaultStub(false) as unknown as Vault })
    );

    await result.current.update(1, { ...DRAFT, name: 'Edited' });
    await result.current.toggle(1);
    await result.current.remove(1);
    await result.current.setAllChecked(true);
    await result.current.setAllChecked(false);
    await result.current.deleteCompleted();
    await result.current.reorder([1]);
    await result.current.removeMany([1]);

    expect(itemRepoMock.update).toHaveBeenCalledWith(1, expect.objectContaining({ name: 'Edited' }));
    expect(itemRepoMock.toggle).toHaveBeenCalledWith(1);
    expect(itemRepoMock.delete).toHaveBeenCalledWith(1);
    expect(itemRepoMock.setAllChecked).toHaveBeenCalledWith(10, true);
    expect(itemRepoMock.setAllChecked).toHaveBeenCalledWith(10, false);
    expect(itemRepoMock.deleteCompleted).toHaveBeenCalledWith(10);
    expect(itemRepoMock.reorder).toHaveBeenCalledWith(10, [1]);
    expect(itemRepoMock.deleteMany).toHaveBeenCalledWith([1]);
    expect(refresh).toHaveBeenCalledTimes(7);
  });

  it('delegates every mutation to the vault when unlocked and never touches the repo', async () => {
    const vault = vaultStub(true, [item(1, 0)]);
    const refresh = vi.fn(async () => {});
    const { result } = await renderHook(() =>
      useItemStore({ listId: 10, repoItems: [], refresh, vault: vault as unknown as Vault })
    );

    await result.current.add(DRAFT);
    await result.current.update(1, { ...DRAFT, name: 'Edited' });
    await result.current.toggle(1);
    await result.current.remove(1);
    await result.current.setAllChecked(true);
    await result.current.deleteCompleted();
    await result.current.reorder([1]);
    await result.current.removeMany([1]);

    expect(vault.addItem).toHaveBeenCalledWith(DRAFT);
    expect(vault.updateItem).toHaveBeenCalledWith(1, expect.objectContaining({ name: 'Edited' }));
    expect(vault.toggleItem).toHaveBeenCalledWith(1);
    expect(vault.deleteItem).toHaveBeenCalledWith(1);
    expect(vault.setAllChecked).toHaveBeenCalledWith(true);
    expect(vault.deleteCompleted).toHaveBeenCalled();
    expect(vault.reorder).toHaveBeenCalledWith([1]);
    expect(vault.deleteMany).toHaveBeenCalledWith([1]);
    expect(itemRepoMock.create).not.toHaveBeenCalled();
    expect(itemRepoMock.update).not.toHaveBeenCalled();
    expect(itemRepoMock.toggle).not.toHaveBeenCalled();
    expect(itemRepoMock.delete).not.toHaveBeenCalled();
    expect(itemRepoMock.deleteMany).not.toHaveBeenCalled();
    expect(itemRepoMock.setAllChecked).not.toHaveBeenCalled();
    expect(itemRepoMock.deleteCompleted).not.toHaveBeenCalled();
    expect(itemRepoMock.reorder).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });
});
