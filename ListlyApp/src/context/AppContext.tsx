import { createContext, useContext, useEffect, useMemo, useCallback, useState, type ReactNode } from 'react';
import type { Item, ListWithCounts } from '../database/types';
import { listRepository as listRepo, itemRepository as itemRepo } from '../database';

interface AppContextType {
  lists: ListWithCounts[];
  itemsByListId: Map<number, Item[]>;
  loading: boolean;
  refresh: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

async function loadAll(): Promise<{ lists: ListWithCounts[]; itemsByListId: Map<number, Item[]> }> {
  const [lists, items] = await Promise.all([listRepo.withCounts(), itemRepo.listAll()]);
  const itemsByListId = new Map<number, Item[]>();
  for (const item of items) {
    const existing = itemsByListId.get(item.list_id);
    if (existing) {
      existing.push(item);
    } else {
      itemsByListId.set(item.list_id, [item]);
    }
  }
  return { lists, itemsByListId };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [lists, setLists] = useState<ListWithCounts[]>([]);
  const [itemsByListId, setItemsByListId] = useState<Map<number, Item[]>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function initialLoad() {
      try {
        const data = await loadAll();
        if (!active) return;
        setLists(data.lists);
        setItemsByListId(data.itemsByListId);
      } catch (error) {
        console.error('Failed to load lists:', error);
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
      setItemsByListId(data.itemsByListId);
    } catch (error) {
      console.error('Failed to refresh lists:', error);
    }
  }, []);

  const value = useMemo(
    () => ({ lists, itemsByListId, loading, refresh }),
    [lists, itemsByListId, loading, refresh]
  );

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}