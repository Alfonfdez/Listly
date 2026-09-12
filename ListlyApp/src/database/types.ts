import type { z } from 'zod';

import { configSchema, itemSchema, listSchema } from './schemas';

export type List = z.infer<typeof listSchema>;
export type Item = z.infer<typeof itemSchema>;
export type Config = z.infer<typeof configSchema>;

export interface ListWithCounts {
  id: number;
  name: string;
  color: string;
  icon: string;
  created_at: string;
  total: number;
  completed: number;
}

export type DatabaseBindValue = string | number | null | Uint8Array;

export interface DatabaseRunResult {
  lastInsertRowId: number;
  changes: number;
}

export interface DatabaseHandle {
  execAsync(source: string): Promise<void>;
  runAsync(source: string, ...params: DatabaseBindValue[]): Promise<DatabaseRunResult>;
  getFirstAsync<T = unknown>(source: string, ...params: DatabaseBindValue[]): Promise<T | null>;
  getAllAsync<T = unknown>(source: string, ...params: DatabaseBindValue[]): Promise<T[]>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
}