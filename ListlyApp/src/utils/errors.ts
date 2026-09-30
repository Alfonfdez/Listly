export const ERROR_SCOPE = {
  loadLists: 'load lists',
  refreshLists: 'refresh lists',
  loadConfig: 'load config',
  saveConfig: 'save config',
  reloadConfig: 'reload config',
  saveDatabase: 'save database',
  initDatabase: 'initialize database',
  addItem: 'add item',
  updateItem: 'update item',
  toggleItem: 'toggle item',
  deleteItem: 'delete item',
  addPhoto: 'add photo',
  removePhoto: 'remove photo',
  reorderLists: 'reorder lists',
  reorderItems: 'reorder items',
  reorderCollections: 'reorder collections',
  moveList: 'move list',
  deleteList: 'delete list',
  deleteCollection: 'delete collection',
  deleteSelectedItems: 'delete selected items',
  deleteSelectedCollections: 'delete selected collections',
  deleteSelection: 'delete selection',
  completeAllItems: 'complete all items',
  clearCompletedItems: 'clear completed items',
  uncompleteAllItems: 'uncomplete all items',
  pinLists: 'pin lists and collections',
  unpinLists: 'unpin lists and collections',
  duplicateList: 'duplicate list',
  copyItemsToList: 'copy items to another list',
  mergeLists: 'merge lists',
  copyToClipboard: 'copy to clipboard',
  lockList: 'lock list',
  unlockList: 'unlock list',
  removeLock: 'remove lock',
  saveLockedList: 'save locked list',
  changePassphrase: 'change passphrase',
  saveEntity: 'save entity',
  exportBackup: 'export backup',
  importBackup: 'import backup',
  deleteAllData: 'delete all data',
  factoryReset: 'factory reset',
} as const;

export type ErrorScope = (typeof ERROR_SCOPE)[keyof typeof ERROR_SCOPE];

type ErrorListener = (scope: ErrorScope, error: unknown) => void;

let errorListener: ErrorListener | null = null;

export function subscribeToErrors(listener: ErrorListener): () => void {
  errorListener = listener;
  return () => {
    if (errorListener === listener) errorListener = null;
  };
}

export function logError(scope: ErrorScope, error: unknown): void {
  console.error(`Failed to ${scope}:`, error);
  errorListener?.(scope, error);
}

export function runSafely(action: Promise<unknown>, scope: ErrorScope): void {
  void action.catch(error => logError(scope, error));
}

export async function runSafelyAsync(action: Promise<unknown>, scope: ErrorScope): Promise<void> {
  try {
    await action;
  } catch (error) {
    logError(scope, error);
  }
}
