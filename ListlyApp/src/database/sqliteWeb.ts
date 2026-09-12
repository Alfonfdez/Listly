import initSqlJs from 'sql.js';
import type { Database, SqlJsStatic } from 'sql.js';
import type { DatabaseBindValue, DatabaseHandle, DatabaseRunResult } from './types';

export const DB_FILE_KEY = 'sqlite';

export interface DatabaseStorage {
  get(): Promise<Uint8Array | null>;
  set(data: Uint8Array): Promise<void>;
}

let sqlReady: SqlJsStatic | null = null;
let sqlPromise: Promise<SqlJsStatic> | null = null;

export function initSqlJsEngine(locateFile?: (file: string) => string): Promise<SqlJsStatic> {
  if (!sqlPromise) {
    sqlPromise = (locateFile ? initSqlJs({ locateFile }) : initSqlJs()).then((sql) => {
      sqlReady = sql;
      return sql;
    });
  }
  return sqlPromise;
}

export function getSqlJsStatic(): SqlJsStatic | null {
  return sqlReady;
}

export class SqlJsDatabase implements DatabaseHandle {
  private readonly db: Database;
  private readonly storage: DatabaseStorage | null;
  private inTransaction = 0;
  private persistQueue: Promise<void> = Promise.resolve();

  constructor(db: Database, storage: DatabaseStorage | null = null) {
    this.db = db;
    this.storage = storage;
    this.db.exec('PRAGMA foreign_keys = ON;');
  }

  async execAsync(source: string): Promise<void> {
    this.db.exec(source);
    await this.persistIfCommitted();
  }

  async runAsync(source: string, ...params: DatabaseBindValue[]): Promise<DatabaseRunResult> {
    this.db.run(source, params);
    const result: DatabaseRunResult = {
      lastInsertRowId: this.lastInsertRowId(),
      changes: this.db.getRowsModified(),
    };
    await this.persistIfCommitted();
    return result;
  }

  async getFirstAsync<T>(source: string, ...params: DatabaseBindValue[]): Promise<T | null> {
    const rows = this.all<T>(source, params);
    return rows.length > 0 ? rows[0] : null;
  }

  async getAllAsync<T>(source: string, ...params: DatabaseBindValue[]): Promise<T[]> {
    return this.all<T>(source, params);
  }

  async withTransactionAsync(task: () => Promise<void>): Promise<void> {
    this.inTransaction += 1;
    this.db.exec('BEGIN');
    try {
      await task();
      this.db.exec('COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    } finally {
      this.inTransaction -= 1;
      await this.persistIfCommitted();
    }
  }

  close(): void {
    this.db.close();
  }

  private lastInsertRowId(): number {
    const rows = this.db.exec('SELECT last_insert_rowid() AS id');
    return rows.length > 0 ? (rows[0].values[0][0] as number) : 0;
  }

  private all<T>(source: string, params: DatabaseBindValue[]): T[] {
    const stmt = this.db.prepare(source);
    try {
      stmt.bind(params);
      const rows: T[] = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject() as T);
      }
      return rows;
    } finally {
      stmt.free();
    }
  }

  private persistIfCommitted(): Promise<void> {
    if (this.inTransaction > 0 || !this.storage) return Promise.resolve();
    const bytes = this.db.export();
    this.db.exec('PRAGMA foreign_keys = ON;');
    this.persistQueue = this.persistQueue
      .then(() => this.storage!.set(bytes))
      .catch((error) => {
        console.error('Failed to persist web database:', error);
      });
    return this.persistQueue;
  }
}

export async function createSqlJsDatabase(
  bytes: Uint8Array | null,
  storage: DatabaseStorage | null = null,
  locateFile?: (file: string) => string
): Promise<SqlJsDatabase> {
  const SQL = await initSqlJsEngine(locateFile);
  return new SqlJsDatabase(new SQL.Database(bytes ?? undefined), storage);
}