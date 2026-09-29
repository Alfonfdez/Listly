import { vi } from 'vitest';
import type { ReactNode } from 'react';
import type { CollectionWithCounts, Item, ListWithCounts } from '../../src/database/types';

interface AppStubState {
  lists: ListWithCounts[];
  collections: CollectionWithCounts[];
  listsByCollectionId: Map<number, ListWithCounts[]>;
  baseLists: ListWithCounts[];
  itemsByListId: Map<number, Item[]>;
  lockedListIds: Set<number>;
  loading: boolean;
  refresh: ReturnType<typeof vi.fn>;
  reset: () => void;
}

interface GlobalWithAppStub {
  __listlyAppStub__?: AppStubState;
}

const EMPTY_MAP = new Map<number, never[]>();

function createStub(): AppStubState {
  const state: AppStubState = {
    lists: [],
    collections: [],
    listsByCollectionId: new Map(),
    baseLists: [],
    itemsByListId: EMPTY_MAP,
    lockedListIds: new Set<number>(),
    loading: false,
    refresh: vi.fn(async () => {}),
    reset: () => {
      state.lists = [];
      state.collections = [];
      state.listsByCollectionId = new Map();
      state.baseLists = [];
      state.itemsByListId = EMPTY_MAP;
      state.lockedListIds = new Set<number>();
      state.loading = false;
      state.refresh.mockClear();
    },
  };
  return state;
}

const g = globalThis as GlobalWithAppStub;
g.__listlyAppStub__ = createStub();

export function buildAppMock() {
  const s = currentStub();
  return {
    lists: s.lists,
    collections: s.collections,
    listsByCollectionId: s.listsByCollectionId,
    baseLists: s.baseLists,
    itemsByListId: s.itemsByListId,
    lockedListIds: s.lockedListIds,
    loading: s.loading,
    refresh: s.refresh,
  };
}

function currentStub(): AppStubState {
  const stub = (globalThis as GlobalWithAppStub).__listlyAppStub__;
  if (!stub) throw new Error('appStub not loaded');
  return stub;
}

export function getAppStub(): AppStubState {
  return currentStub();
}

export function setLists(data: ListWithCounts[]): void {
  currentStub().lists = data;
}

export function setCollections(data: CollectionWithCounts[]): void {
  currentStub().collections = data;
}

export function setListsByCollectionId(map: Map<number, ListWithCounts[]>): void {
  currentStub().listsByCollectionId = map;
}

export function setBaseLists(data: ListWithCounts[]): void {
  currentStub().baseLists = data;
}

export function setItemsByListId(map: Map<number, Item[]>): void {
  currentStub().itemsByListId = map;
}

export function setLockedListIds(ids: Iterable<number>): void {
  currentStub().lockedListIds = new Set(ids);
}

export function setLoading(value: boolean): void {
  currentStub().loading = value;
}

export function resetAppStub(): void {
  currentStub().reset();
}