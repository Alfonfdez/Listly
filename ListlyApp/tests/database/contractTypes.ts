import type { Config, Item, List, ListWithCounts } from '../../src/database/types';

export type NewList = Omit<List, 'id' | 'created_at' | 'position' | 'pinned'>;
export type NewItem = Omit<Item, 'id' | 'created_at'>;
export type UpdateList = Partial<Omit<List, 'id' | 'created_at'>>;
export type UpdateItem = Partial<Omit<Item, 'id' | 'created_at'>>;

export interface ContractListRepo {
  list(): Promise<List[]>;
  get(id: number): Promise<List | null>;
  create(data: Omit<List, 'id' | 'created_at' | 'position' | 'pinned'>): Promise<List>;
  update(id: number, data: UpdateList): Promise<void>;
  delete(id: number): Promise<void>;
  deleteMany(ids: number[]): Promise<void>;
  reorder(orderedIds: number[]): Promise<void>;
  withCounts(): Promise<ListWithCounts[]>;
  existsByName(name: string, excludeId?: number): Promise<boolean>;
}

export interface ContractItemRepo {
  listAll(): Promise<Item[]>;
  listByList(listId: number): Promise<Item[]>;
  get(id: number): Promise<Item | null>;
  create(data: NewItem): Promise<Item>;
  update(id: number, data: UpdateItem): Promise<void>;
  reorder(listId: number, orderedIds: number[]): Promise<void>;
  delete(id: number): Promise<void>;
  deleteMany(ids: number[]): Promise<void>;
  toggle(id: number): Promise<void>;
  existsByName(listId: number, name: string, excludeId?: number): Promise<boolean>;
}

export interface ContractConfigRepo {
  get(): Promise<Config>;
  save(partial: Partial<Config>): Promise<void>;
}

export interface ContractBackend {
  list: ContractListRepo;
  item: ContractItemRepo;
  config: ContractConfigRepo;
}