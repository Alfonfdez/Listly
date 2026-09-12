import { DB_FILE_KEY, type DatabaseStorage } from '../sqliteWeb';

const DATABASE_NAME = 'Listly.db';
const STORE_NAME = 'sqlite';

interface OpenHandle {
  db: IDBDatabase | null;
  promise: Promise<IDBDatabase | null>;
}

let open: OpenHandle | null = null;

function openDatabase(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  if (!open) {
    const handle: OpenHandle = { db: null, promise: Promise.resolve(null) };
    handle.promise = new Promise((resolve) => {
      const request = indexedDB.open(DATABASE_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => {
        handle.db = request.result;
        resolve(request.result);
      };
      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        resolve(null);
      };
    });
    open = handle;
  }
  return open.promise;
}

function objectStore(mode: IDBTransactionMode): Promise<IDBObjectStore | null> {
  return openDatabase().then((db) => {
    if (!db) return null;
    return db.transaction(STORE_NAME, mode).objectStore(STORE_NAME);
  });
}

export function createIndexedDbStorage(): DatabaseStorage {
  return {
    async get(): Promise<Uint8Array | null> {
      const store = await objectStore('readonly');
      if (!store) return null;
      return new Promise((resolve) => {
        const request = store.get(DB_FILE_KEY);
        request.onsuccess = () => {
          const value = request.result;
          resolve(value instanceof Uint8Array ? value : null);
        };
        request.onerror = () => resolve(null);
      });
    },
    async set(data: Uint8Array): Promise<void> {
      const store = await objectStore('readwrite');
      if (!store) return;
      await new Promise<void>((resolve) => {
        const request = store.put(data, DB_FILE_KEY);
        request.onsuccess = () => resolve();
        request.onerror = () => {
          console.error('Failed to write IndexedDB:', request.error);
          resolve();
        };
      });
    },
  };
}