import { createContext, useEffect, useMemo, useCallback, useState, type ReactNode } from 'react';
import type { CollectionWithCounts, Item, ListWithCounts } from '../database/types';
import {
  listRepository as listRepo,
  itemRepository as itemRepo,
  collectionRepository as collectionRepo,
  vaultRepository as vaultRepo,
} from '../database';
import { logError, ERROR_SCOPE } from '../utils/errors';
import { useRequiredContext } from '../hooks/useRequiredContext';

interface AppContextType {
  lists: ListWithCounts[];
  collections: CollectionWithCounts[];
  listsByCollectionId: Map<number, ListWithCounts[]>;
  baseLists: ListWithCounts[];
  itemsByListId: Map<number, Item[]>;
  lockedListIds: Set<number>;
  loading: boolean;
  refresh: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function useApp() {
  return useRequiredContext(AppContext, 'useApp', 'AppProvider');
}

interface LoadedData {
  lists: ListWithCounts[];
  collections: CollectionWithCounts[];
  listsByCollectionId: Map<number, ListWithCounts[]>;
  baseLists: ListWithCounts[];
  itemsByListId: Map<number, Item[]>;
  lockedListIds: Set<number>;
}

async function loadAll(): Promise<LoadedData> {
  const [lists, items, collections, lockedListIds] = await Promise.all([
    listRepo.withCounts(),
    itemRepo.listAll(),
    collectionRepo.withCounts(),
    vaultRepo.listIds(),
  ]);
  const itemsByListId = new Map<number, Item[]>();
  for (const item of items) {
    const existing = itemsByListId.get(item.list_id);
    if (existing) {
      existing.push(item);
    } else {
      itemsByListId.set(item.list_id, [item]);
    }
  }
  const listsByCollectionId = new Map<number, ListWithCounts[]>();
  const baseLists: ListWithCounts[] = [];
  for (const list of lists) {
    if (list.collection_id === null) {
      baseLists.push(list);
    } else {
      const existing = listsByCollectionId.get(list.collection_id);
      if (existing) {
        existing.push(list);
      } else {
        listsByCollectionId.set(list.collection_id, [list]);
      }
    }
  }
  return { lists, itemsByListId, collections, listsByCollectionId, baseLists, lockedListIds: new Set(lockedListIds) };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [lists, setLists] = useState<ListWithCounts[]>([]);
  const [collections, setCollections] = useState<CollectionWithCounts[]>([]);
  const [listsByCollectionId, setListsByCollectionId] = useState<Map<number, ListWithCounts[]>>(new Map());
  const [baseLists, setBaseLists] = useState<ListWithCounts[]>([]);
  const [itemsByListId, setItemsByListId] = useState<Map<number, Item[]>>(new Map());
  const [lockedListIds, setLockedListIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function initialLoad() {
      try {
        const data = await loadAll();
        if (!active) return;
        setLists(data.lists);
        setCollections(data.collections);
        setListsByCollectionId(data.listsByCollectionId);
        setBaseLists(data.baseLists);
        setItemsByListId(data.itemsByListId);
        setLockedListIds(data.lockedListIds);
      } catch (error) {
        logError(ERROR_SCOPE.loadLists, error);
      } finally {
        if (active) setLoading(false);
      }
    }
    void initialLoad();
    return () => { active = false; };
  }, []);

  const refresh = useCallback(async () => {
    try {
      const data = await loadAll();
      setLists(data.lists);
      setCollections(data.collections);
      setListsByCollectionId(data.listsByCollectionId);
      setBaseLists(data.baseLists);
      setItemsByListId(data.itemsByListId);
      setLockedListIds(data.lockedListIds);
    } catch (error) {
      logError(ERROR_SCOPE.refreshLists, error);
    }
  }, []);

  const value = useMemo(
    () => ({ lists, collections, listsByCollectionId, baseLists, itemsByListId, lockedListIds, loading, refresh }),
    [lists, collections, listsByCollectionId, baseLists, itemsByListId, lockedListIds, loading, refresh]
  );

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}