import { createContext, useEffect, useMemo, useCallback, useState, type ReactNode } from 'react';
import type { CollectionWithCounts, Item, ListWithCounts } from '../database/types';
import { loadAppData } from '../database/repositories/appData';
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

export function AppProvider({ children }: { children: ReactNode }) {
  const [lists, setLists] = useState<ListWithCounts[]>([]);
  const [collections, setCollections] = useState<CollectionWithCounts[]>([]);
  const [listsByCollectionId, setListsByCollectionId] = useState<Map<number, ListWithCounts[]>>(new Map());
  const [baseLists, setBaseLists] = useState<ListWithCounts[]>([]);
  const [itemsByListId, setItemsByListId] = useState<Map<number, Item[]>>(new Map());
  const [lockedListIds, setLockedListIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  const applyData = useCallback((data: Awaited<ReturnType<typeof loadAppData>>) => {
    setLists(data.lists);
    setCollections(data.collections);
    setListsByCollectionId(data.listsByCollectionId);
    setBaseLists(data.baseLists);
    setItemsByListId(data.itemsByListId);
    setLockedListIds(data.lockedListIds);
  }, []);

  useEffect(() => {
    let active = true;
    async function initialLoad() {
      try {
        const data = await loadAppData();
        if (!active) return;
        applyData(data);
      } catch (error) {
        logError(ERROR_SCOPE.loadLists, error);
      } finally {
        if (active) setLoading(false);
      }
    }
    void initialLoad();
    return () => { active = false; };
  }, [applyData]);

  const refresh = useCallback(async () => {
    try {
      applyData(await loadAppData());
    } catch (error) {
      logError(ERROR_SCOPE.refreshLists, error);
    }
  }, [applyData]);

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