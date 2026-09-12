import { vi } from 'vitest';
import type { ReactNode } from 'react';
import type { Item, ListWithCounts } from '../../../src/database/types';

interface AppStubState {
  lists: ListWithCounts[];
  itemsByListId: Map<number, Item[]>;
  loading: boolean;
  refresh: ReturnType<typeof vi.fn>;
  reset: () => void;
}

interface GlobalWithAppStub {
  __listlyAppStub__?: AppStubState;
}

const EMPTY_MAP = new Map<number, Item[]>();

function createStub(): AppStubState {
  const state: AppStubState = {
    lists: [],
    itemsByListId: EMPTY_MAP,
    loading: false,
    refresh: vi.fn(async () => {}),
    reset: () => {
      state.lists = [];
      state.itemsByListId = EMPTY_MAP;
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
    itemsByListId: s.itemsByListId,
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

export function setItemsByListId(map: Map<number, Item[]>): void {
  currentStub().itemsByListId = map;
}

export function setLoading(value: boolean): void {
  currentStub().loading = value;
}

export function resetAppStub(): void {
  currentStub().reset();
}