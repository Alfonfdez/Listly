# Programming concepts

> **Purpose:** This document is a **learning reference** for the programming concepts used
> across the project. It explains ideas in a general, educational way. It is **not** a
> project working/tooling document — for the actual Listly setup, conventions, and tooling
> see `docs/harnesses.md`, `docs/changelog.md`, `docs/git-commands.md`, and `docs/assets.md`.

# React Native

## React Native
**Definition:** Framework for building native mobile applications using JavaScript/TypeScript and React.
**Explanation:** Allows writing an app that runs on iOS and Android with the same codebase. Uses real native components (not WebView). Listly uses React Native with Expo to simplify development.
**Example:**
```tsx
import { View, Text } from 'react-native';
export default function Greeting() {
  return <View><Text>Hello</Text></View>;
}
```

## Expo
**Definition:** Platform and set of tools that simplifies development with React Native.
**Explanation:** Provides a preconfigured SDK, build management, OTA updates, and access to device APIs without native configurations. Listly uses the Expo managed workflow.
**Example:**
```bash
npx create-expo-app@latest ListlyApp --template blank-typescript
npx expo start
```

## StyleSheet.create
**Definition:** React Native method for creating styles efficiently.
**Explanation:** Styles are defined as JavaScript objects. `create()` optimizes performance by creating styles once and reusing them. It is the alternative to traditional CSS.
**Example:**
```tsx
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  text: { color: '#E2E8F0', fontSize: 16 },
});
```

# TypeScript

## Interfaces vs Types
**Definition:** TypeScript mechanisms for defining the shape of objects.
**Explanation:** Interfaces (`interface`) are used to define object contracts and are extensible. Types (`type`) are more flexible (unions, tuples). In Listly, interfaces are used for data models.
**Example:**
```tsx
interface List {
  id: number;
  name: string;
  color: string;
  icon: string;
}
```

## Type Re-export
**Definition:** TypeScript pattern for re-exporting types from a centralized file, maintaining a Single Source of Truth.
**Explanation:** When multiple files need the same type, it is defined in a single location and re-exported with `export type { X }`. This avoids duplicate definitions and facilitates maintenance.
**Example:**
```tsx
// database/types.ts — original definition (z.infer)
export type List = z.infer<typeof listSchema>;

// components/types.ts — re-export
import { List } from '../database/types';
export type { List };
```

# React

## Context API
**Definition:** React system for sharing state between components without passing props manually.
**Explanation:** `createContext` creates a state container. `Provider` injects the state into the tree. `useContext` (or a custom hook) consumes it. Avoids "prop drilling".
**Example:**
```tsx
const AppContext = createContext<AppContextType | null>(null);
// Provider wraps the entire app
// useApp() consumes the context from any child component
```

## useState
**Definition:** React hook for adding local state to functional components.
**Explanation:** Returns a [value, setter] pair. When the state changes, the component re-renders. In Listly, used to control modals, active tabs, etc.
**Example:**
```tsx
const [modalVisible, setModalVisible] = useState(false);
```

## useMemo
**Definition:** React hook that memoizes the result of an expensive calculation.
**Explanation:** Only recalculates when dependencies change. Used in Listly to filter items, count completed items, and derive per-list progress.
**Example:**
```tsx
const completedCount = useMemo(
  () => items.filter(i => i.checked).length,
  [items]
);
```

## useCallback
**Definition:** React hook that memoizes functions to avoid recreating them on every render.
**Explanation:** Similar to useMemo but for functions. Useful for passing them as props to child components and avoiding unnecessary re-renders.
**Example:**
```tsx
const handleToggle = useCallback((id: number) => {
  itemRepo.toggle(id);
}, []);
```

## useRef
**Definition:** React hook that returns a mutable box (`.current`) whose changes do **not** trigger a re-render.
**Explanation:** Used to hold values that must survive renders without causing one — DOM/native handles, timers, or "latest value" memory. In Listly it keeps the amount typed before focusing an input so it can be restored on blur without re-rendering.
**Example:**
```tsx
const amountBeforeFocus = useRef('');
// read/write without re-rendering:
amountBeforeFocus.current = '0.00';
```

## useEffect
**Definition:** React hook for running side effects after a render (and cleaning them up).
**Explanation:** Runs after the component renders, and again when its dependency array changes; the returned function cleans up (timers, subscriptions). Used in Listly to seed a modal when it opens and to clear timeout handles.
**Example:**
```tsx
useEffect(() => {
  if (!visible) return;
  applySeed(initialRef.current);
}, [visible, applySeed]);
```

# Navigation

## React Navigation (Stack Navigator)
**Definition:** Navigation system that stacks screens on top of each other.
**Explanation:** Each new screen is placed on top of the previous one. The user can go back with the native button. In Listly, used to navigate from Home to a List detail screen.
**Example:**
```tsx
const Stack = createNativeStackNavigator({
  screens: {
    Home: { screen: HomeScreen, options: { headerShown: false } },
    ListDetail: { screen: ListDetailScreen },
  },
});
```

## React Navigation (Drawer Navigator)
**Definition:** Side menu that slides from the left edge of the screen.
**Explanation:** Shows navigation options in a hidden panel. In Listly, the drawer contains Home, Lists, and Settings.
**Example:**
```tsx
const Drawer = createDrawerNavigator({
  screens: { Main: { screen: HomeStack } },
  screenOptions: { drawerStyle: { backgroundColor: '#1E293B' } },
});
```

## DrawerActions
**Definition:** Reusable actions for controlling the Drawer Navigator from any screen, even if nested inside another navigator.
**Explanation:** When a Screen is inside a Stack that is itself inside a Drawer, `navigation.openDrawer()` does not exist on the Stack's type. The solution is to dispatch the action with `navigation.dispatch(DrawerActions.openDrawer())`.
**Example:**
```tsx
import { useNavigation, DrawerActions } from '@react-navigation/native';
navigation.dispatch(DrawerActions.openDrawer());
```

# Persistence

## Drizzle ORM
**Definition:** Lightweight, TypeScript-first SQL query builder and ORM.
**Explanation:** Drizzle lets you write typed, composable database queries in TypeScript instead of raw SQL strings. You declare tables once in a schema module and then use `db.select().from(table)`, `db.insert(table).values(...)`, `db.update(table).set(...)` and `db.delete(table)`. Listly uses it as a query builder only: migrations stay on `PRAGMA user_version`, runtime validation stays on Zod, and there is no `drizzle-kit`/codegen.
**Example:**
```ts
const rows = await db
  .select()
  .from(lists)
  .where(eq(lists.userId, userId))
  .orderBy(sql`name COLLATE NOCASE`)
  .all();
```

## Zod
**Definition:** TypeScript-first schema validation library.
**Explanation:** Zod schemas define the shape of data and validate it at runtime, deriving the TypeScript types via `z.infer`. In Listly, `src/database/schemas.ts` is the single source of truth for every stored row shape, and rows are validated at the storage boundary of both backends.
**Example:**
```ts
import { z } from 'zod';
export const listSchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(100),
  color: z.string(),
  icon: z.string(),
});
export type List = z.infer<typeof listSchema>;
```

## SQLite (expo-sqlite)
**Definition:** Embedded relational database for React Native with native support in Expo.
**Explanation:** Stores data in a local file with a schema of tables, relationships, and SQL queries. Listly uses it on mobile devices (Android/iOS) to persist lists, items, and config. Web runs the same SQLite schema through sql.js (a WebAssembly build of SQLite) persisted to IndexedDB, so both platforms share the same migrations and repositories.
**Example:**
```tsx
import { openDatabaseSync } from 'expo-sqlite';
const db = openDatabaseSync('Listly.db');
await db.runAsync('INSERT INTO lists (name, color, icon) VALUES (?, ?, ?)', 'Groceries', '#22D3EE', 'cart');
```

## IndexedDB (web SQLite)
**Definition:** Browser database API for storing large structured data (objects, blobs) asynchronously and persistently per origin.
**Explanation:** IndexedDB keeps the whole exported SQLite database file as a single value. On web the app opens the same schema with sql.js (`initSqlJs({ locateFile })`), so every query is real SQL — filtering, joins and aggregates behave identically to native. The engine writes the database bytes back once per committed transaction.
**Example:**
```ts
const bytes = await storage.get();   // Uint8Array | null
await storage.set(exportedBytes);
```

## Platform-resolved database engine (one SQLite on both platforms)
**Definition:** Pattern that opens the same `DatabaseHandle` on every platform, delegating only the *engine* selection to the platform.
**Explanation:** Listly has a single repository layer and a single set of migrations. A factory module `src/database/engine.ts` (native) and `src/database/engine.web.ts` (web) exports an `openEngine(name)` function that returns the engine: native opens `expo-sqlite` synchronously, web loads the sql.js WASM engine bound to IndexedDB storage. `src/database/database.ts` runs the same `PRAGMA user_version` migrations on either handle.
**Example:**
```tsx
// src/database/engine.ts (native)
import { openDatabaseSync } from 'expo-sqlite';
export async function openEngine(name: string): Promise<DatabaseHandle> {
  return openDatabaseSync(name) as unknown as DatabaseHandle;
}
```

## PRAGMA user_version
**Definition:** Integer metadata that SQLite stores in the database header to control which migrations have been executed.
**Explanation:** Used as a schema version counter. Each migration checks if `user_version` is less than its number, runs the necessary SQL changes, and then increments the value. The app knows at each startup which migrations are missing without needing additional control tables.
**Example:**
```tsx
let { user_version: v } = await db.getFirstAsync('PRAGMA user_version');
if (v < 1) { await migrate001(db); v = 1; }
if (v < 2) { await seed002(db); v = 2; }
await db.execAsync(`PRAGMA user_version = ${v}`);
```

## INSERT OR IGNORE
**Definition:** INSERT variant that silently skips insertion if the row violates a duplicate key constraint (PRIMARY KEY or UNIQUE).
**Explanation:** Very useful in seeds and migrations so the app can run the same initialization script without failures if the data already exists. It does not update existing records.
**Example:**
```tsx
await db.runAsync(
  'INSERT OR IGNORE INTO lists (id, name, color, icon) VALUES (?, ?, ?, ?)',
  1, 'Groceries', '#22D3EE', 'cart'
);
```

# i18n

## Centralized language checks
**Definition:** Patterns for storing the active language and looking up translations from a single i18n module.
**Explanation:** All user-facing strings go through `src/i18n/`. Listly ships nine languages (`en, es, ca, gl, eu, fr, de, pt, it`); each is a flat object of keys and `t()` returns the active language object so components read `t.hello_world`. Key naming is `lowercase.with.dots`.
**Example:**
```tsx
// src/i18n/en.ts
export default { home_empty: 'No lists yet', settings_title: 'Settings' };

// Component
const t = useLabels();
<Text>{t.home_empty}</Text>
```

## Typed translation packs (key-parity via the type system)
**Definition:** Deriving one language's shape as a TypeScript type and declaring every other language against it.
**Explanation:** Each pack is typed as `Translations` (derived from `en`), so a missing/extra/renamed key is a **compile error**, not a runtime fallback. A parity test backs the types at runtime too (same keys, matching function arity, no empty strings).
**Example:**
```ts
export type Translations = typeof en;
export const es: Translations = { /* must match en exactly */ };
```

# UI Components

## FlatList
**Definition:** React Native component for efficiently rendering long lists.
**Explanation:** Only renders elements visible on screen (virtualization), which saves memory. Accepts `data`, `renderItem`, and `keyExtractor`. Used in the Home screen, list detail, and search results.
**Example:**
```tsx
<FlatList
  data={lists}
  keyExtractor={(item) => item.id.toString()}
  renderItem={({ item }) => <Text>{item.name}</Text>}
/>
```

## Remount-to-remeasure (sortable grid keys)
**Definition:** Giving a component a React `key` that changes to force it to remount (rebuild + re-measure) when its input fundamentally changes.
**Explanation:** Absolute-positioned sortable grids (react-native-sortables) measure each item once and place it by coordinates. If the **data order** changes but the grid is not remounted, it keeps stale measured positions and items overlap. Deriving the `key` from the **ordered** item ids makes the grid re-measure on any sequence change (pin, reorder, add/remove). Because a drag produces its own optimistic order, the key is **frozen during an active drag** (a small `useFrozenKey` hook) so the gesture does not force a mid-drag remount/flicker.
**Related — grouped reorder:** when a list is *sorted by a flag* (e.g. pinned-first) as well as a manual `position`, a naive reorder can silently revert a cross-group drop, because the `ORDER BY` re-sorts the rows. The fix is to make the drop **match the sort**: detect when a single-item drag crossed the group boundary and toggle that item's flag (drop into the top group ⇒ set the flag), then persist position + flag together in one transaction — "what you drop is what you get".
**Example:**
```tsx
// key changes when the order changes → grid remounts/re-measures
<Sortable.Grid key={`grid-${ids.join('-')}`} data={items} … />
```

## Modal
**Definition:** React Native component that displays content overlaid on the current screen.
**Explanation:** Useful for dialogs, selectors, or forms without changing screens. In Listly, used for item creation, color/icon pickers, and confirmations.
**Example:**
```tsx
<Modal visible={visible} transparent animationType="slide">
  <View style={overlay}><Text>Modal content</Text></View>
</Modal>
```

## TouchableOpacity
**Definition:** React Native component that reacts to touch with an opacity effect.
**Explanation:** Wraps any element to make it pressable. When pressed, it reduces its opacity. `hitSlop` expands the touch area to improve accessibility.
**Example:**
```tsx
<TouchableOpacity onPress={handlePress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
  <Text>Press</Text>
</TouchableOpacity>
```

## SafeAreaView
**Definition:** React Native component that respects the safe areas of the screen (notch, status bar, etc.).
**Explanation:** Prevents content from being hidden behind operating system elements. Used in all Listly screens.
**Example:**
```tsx
<SafeAreaView style={{ flex: 1 }}>
  <Text>Safe content</Text>
</SafeAreaView>
```

## Keyboard avoidance (keyboard height)
**Definition:** Adjusting the layout so the on-screen keyboard does not cover inputs or the bottom bar.
**Explanation:** Mobile keyboards overlay the app; the bottom add-bar/list must lift by the keyboard's height. Listly measures the keyboard (via the OS keyboard events) and offsets content/actions accordingly.
**Example:**
```tsx
// track the keyboard height and apply it as bottom padding/offset
const { height } = useKeyboardHeight();
<View style={{ paddingBottom: height }} />
```

## Debounce (delaying an action)
**Definition:** Waiting for a pause in rapid events before running an action, instead of firing on every one.
**Explanation:** Used on name/search inputs and duplicate checks so the app does not validate/query on every keystroke — only after the user stops typing briefly.
**Example:**
```ts
const checkDuplicate = useDebounced(check, 300); // runs 300ms after the last change
```

# Design Principles

## Single Source of Truth (SSOT)
**Definition:** Design principle that states that each piece of information should have a single authoritative source in the system.
**Explanation:** Prevents inconsistencies caused by duplicated data in multiple locations. When a value changes, it is only modified in one place. In Listly, the Zod schemas in `src/database/schemas.ts` are the SSOT for row shapes, and `src/constants/` holds shared icon/color lists used across screens.
**Example:**
```tsx
// ✅ SSOT: a single file defines the item icon list
// constants/itemIcons.ts
export const LIST_ICONS = ['cart', 'book', 'home', 'star-outline'] as const;
```

## Shared constants across screens
**Definition:** Lists of data (icons, colors, etc.) that are defined once in a `constants/` file and imported from multiple screens.
**Explanation:** When two screens use the same list of options, the list must be defined in a single shared file. In Listly, `constants/listIcons.ts` is used by both the create-list and edit-list screens.
**Example:**
```tsx
// constants/listIcons.ts — SSOT for list icons
export const LIST_ICONS = ['cart-outline', 'book-outline', 'home-outline', 'star-outline'] as const;
```

## Named Constants (Avoiding Magic Numbers)
**Definition:** Replacing hardcoded literal values with constants that have descriptive names.
**Explanation:** "Magic numbers" or "magic strings" appear out of nowhere in the code, making comprehension and maintenance difficult. Extracting them to named constants makes their purpose clear.
**Example:**
```tsx
// ❌ Magic number
const maxNameLength = 100;

// ✅ Named constant
const MAX_LIST_NAME_LENGTH = 100;
```

## Spread Before .sort() (Avoiding Mutation)
**Definition:** Using the spread operator `[...array]` before `.sort()` to avoid mutating the original array.
**Explanation:** JavaScript's `.sort()` method **sorts the array in-place**. If that array is React state, mutating its internal reference causes bugs. By doing `[...list].sort(...)`, a copy is created and sorted, leaving the original intact.
**Example:**
```tsx
// ✅ Safe copy: does not touch the original array
return [...items].sort((a, b) => a.name.localeCompare(b.name));
```

## ComponentProps (Type-Safe Library Props)
**Definition:** React utility type that extracts the props of a component, allowing dynamic values from external libraries to be typed without using `as any`.
**Explanation:** When a library like `@expo/vector-icons` defines a union type for a prop (e.g., icon names), `ComponentProps<typeof Component>['prop']` extracts the exact type, maintaining type safety.
**Example:**
```tsx
// ✅ ComponentProps: type-safe against the component definition
import { ComponentProps } from 'react';
<Ionicons name={item.icon as ComponentProps<typeof Ionicons>['name']} size={22} color={item.color} />
```

## Extracting Pure Functions Outside the Component
**Definition:** Moving functions that do not depend on hooks or state out of the component body and into the file scope, so they are not recreated on every render.
**Explanation:** When a function is defined inside a React component, a new reference is created on every render. Pure functions can be defined outside the component and receive the needed values as arguments.
**Example:**
```tsx
// ✅ Defined outside, stable reference
function sortByChecked(a: Item, b: Item): number {
  return Number(a.checked) - Number(b.checked);
}
```

# SQL and Database

## Date Formats and SQLite String Comparison
**Definition:** SQLite stores and compares dates as strings, so the string format directly affects the result of `>=` / `<=` comparisons.
**Explanation:** In Listly, dates are stored in the format `"YYYY-MM-DD HH:MM:SS"` (space as separator, local time). `Date.toISOString()` produces ISO 8601 format with a `T` separator and UTC timezone. Since SQLite performs lexicographic string comparison, mixing formats breaks range queries. Use one consistent format for both storage and queries.
**Example:**
```tsx
function formatDateForDB(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
```

## Foreign keys with ON DELETE CASCADE
**Definition:** A foreign key constraint that automatically deletes child rows when the parent row is deleted.
**Explanation:** In Listly, `items` reference `lists` with `ON DELETE CASCADE`, so deleting a list removes all its items automatically — no manual cleanup loops.
**Example:**
```sql
CREATE TABLE items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  list_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  checked INTEGER NOT NULL DEFAULT 0,
  note TEXT DEFAULT NULL,
  FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE
);
```

# Cryptography

## Encryption at rest
**Definition:** Storing data in encrypted (ciphertext) form so a raw copy of the database reveals nothing without the key.
**Explanation:** In Listly, locking a list encrypts its items into a single ciphertext blob (the `vaults` row) and **deletes the plaintext item rows**. The items only exist in memory while the list is unlocked. Metadata (name, color, icon) stays plaintext.
**Example:**
```ts
// lock: encrypt then remove plaintext
const sealed = await vaultCrypto.seal(passphrase, JSON.stringify(items));
await db.insert(vaults).values(sealed).run();
await db.delete(items).where(eq(items.list_id, listId)).run();
```

## AES-GCM (authenticated encryption)
**Definition:** A block-cipher mode that encrypts **and** authenticates data (AEAD): a wrong key or any tampering makes decryption fail instead of returning garbage.
**Explanation:** Listly uses AES-256-GCM. The stored blob is `iv + ciphertext + tag` (base64). The GCM authentication tag is what lets the app reject a tampered payload; the initialization vector (IV) must be random per encryption.
**Example:**
```ts
const iv = randomBytes(12);
const cipher = createCipheriv('aes-256-gcm', key, iv);
const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
const tag = cipher.getAuthTag(); // verified on decrypt
```

## Key derivation (PBKDF2), salt and iteration count
**Definition:** Turning a human passphrase into a fixed-size cryptographic key using a deliberately slow, salted function.
**Explanation:** Passphrases are low-entropy, so we never use them directly as a key. PBKDF2-HMAC-SHA-512 with a random **salt** and a high **iteration count** (600,000) makes brute force expensive. The salt and iteration count are stored with the vault (non-secret) so the same key can be re-derived later.
**Example:**
```ts
const key = await platform.pbkdf2(passphrase, saltHex, 600_000, 'sha512'); // 32 bytes
```

## Verifier (check a passphrase without decrypting)
**Definition:** A non-secret value that lets the app reject a wrong passphrase before attempting decryption.
**Explanation:** Listly stores `SHA-256(salt : verifier : base64(key))`. On unlock, the derived key is re-hashed and compared; a mismatch means "wrong passphrase" without ever decrypting. The GCM tag remains the final integrity check.
**Example:**
```ts
if ((await makeVerifier(keyBytes, salt)) !== vault.verifier) {
  throw new VaultCryptoError('wrong_passphrase');
}
```

## Key zeroization
**Definition:** Overwriting a sensitive buffer (key bytes) with zeros once it is no longer needed.
**Explanation:** Reduces the window in which a derived key sits in memory. Listly wipes the key buffer in a `finally` block after sealing/unsealing.
**Example:**
```ts
try {
  /* use keyBytes */
} finally {
  keyBytes.fill(0);
}
```

# Native modules

## Local Expo module
**Definition:** A custom native module kept in the app repo (under `modules/`) instead of being installed from npm.
**Explanation:** Autolinked by `expo-modules-autolinking` (no `app.json` plugin needed). Listly's `listly-share` exposes the share sheet and Android Downloads from JavaScript. It needs an `expo-module.config.json`, a Gradle entry, and a Swift/Kotlin module, and only works in a **development/release build**.
**Example:**
```ts
// modules/listly-share/src/index.ts
const module = requireNativeModule<ListlyShareNativeModule>('ListlyShare');
return module.shareFileAsync(url, mimeType, dialogTitle);
```

## Lazy native module loading (never crash at startup)
**Definition:** Loading an optional native module only when it is first used, instead of at module import.
**Explanation:** If a native module is missing at runtime (e.g. locked lists in Expo Go), a top-level `import`/`require` throws while the app boots. Loading it lazily inside a function keeps the app usable elsewhere.
**Example:**
```ts
let nativeModule: T | null = null;
function getNativeModule(): T | null {
  if (nativeModule) return nativeModule;
  try { nativeModule = requireNativeModule('ListlyShare'); } catch { nativeModule = null; }
  return nativeModule;
}
```

## Probing a TurboModule before requiring it
**Definition:** Checking that a native module is actually registered before importing its JS package.
**Explanation:** Some packages throw from a module factory (via `TurboModuleRegistry.getEnforcing`). Metro reports a *failed require* as a fatal error **before** a surrounding `try/catch` runs — so catching is too late. The fix is to **probe** with the non-throwing `TurboModuleRegistry.get(name)` and skip the require entirely when it is absent.
**Example:**
```ts
const present = require('react-native').TurboModuleRegistry?.get('QuickBase64') != null;
if (present) cached = require('react-native-quick-crypto');
```
- Never rely on a **global** that an optional native library only sets after `install()` (e.g. `global.Buffer` from `react-native-quick-crypto`); use the module's own export instead (`crypto.Buffer`).

## Development build vs Expo Go (graceful degradation)
**Definition:** Designing features that need custom native code to be *unavailable but non-fatal* in Expo Go.
**Explanation:** Listly gates the vault behind `isVaultAvailable()`; when the native module is absent the lock action shows an explanatory message and every other feature works. See `docs/locked-lists.md`.
**Example:**
```ts
const vaultReady = useMemo(() => isVaultAvailable(), []);
onPress={() => (vaultReady ? setLockModalVisible(true) : setVaultInfoVisible(true))}
```

## FileProvider and MediaStore Downloads (Android file sharing)
**Definition:** Android mechanisms for handing a private app file to another app (`FileProvider` content URI) and for writing a file to the public Downloads folder (`MediaStore.Downloads`).
**Explanation:** The `listly-share` Android module wraps both: sharing uses a `FileProvider` authority declared in the module manifest; saving to Downloads uses `MediaStore` with an `IS_PENDING` write (API 29+).
**Example:**
```kotlin
FileProvider.getUriForFile(context, "$packageName.listlyshare.fileprovider", file)
resolver.insert(MediaStore.Downloads.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY), values)
```

## Share-sheet result (iOS completion handler)
**Definition:** Reporting whether the user actually completed a share or dismissed the sheet.
**Explanation:** On iOS, `UIActivityViewController.completionWithItemsHandler` reports `completed`; the module resolves `"saved"`/`"dismissed"` accordingly. Android has no reliable result for share targets, so it reports `"saved"` whenever the sheet returns.
**Example:**
```swift
activityController.completionWithItemsHandler = { _, completed, _, error in
  promise.resolve(completed ? "saved" : "dismissed")
}
```

# Money and numbers

## Integer minor units (avoiding floating-point drift)
**Definition:** Storing money as an integer number of the smallest unit (e.g. cents) instead of a float.
**Explanation:** Binary floating point cannot represent values like `0.1` exactly, so summing prices drifts. Numeric lists store `amount_minor` as integer minor units and only divide by 100 for display; all arithmetic is integer.
**Example:**
```ts
const lineTotalMinor = amountMinor * quantity;   // integers
const total = formatMinor(items.reduce((sum, i) => sum + i.amount_minor * i.quantity, 0));
```

# Concurrency

## Serialized async transactions (mutex/queue)
**Definition:** Ensuring only one database transaction runs at a time by chaining calls through a single promise queue.
**Explanation:** Two overlapping `BEGIN`s crash SQLite ("cannot start a transaction within a transaction"). Listly funnels write transactions through one authority that chains each call onto the previous, so concurrent drags/refreshes can never nest.
**Example:**
```ts
let chain: Promise<unknown> = Promise.resolve();
export async function runExclusive<T>(task: () => Promise<T>): Promise<T> {
  const run = chain.then(task);
  chain = run.then(() => undefined, () => undefined);
  return run;
}
```

# TypeScript

## `as const` maps for typed codes and unions
**Definition:** Using `as const` on an object literal to get narrow literal types, then deriving a union type from it.
**Explanation:** Centralizes "magic strings" (error codes, scopes, status) in one place and gives a compile-time union. Listly uses this for `ERROR_SCOPE` and `VAULT_ERROR`.
**Example:**
```ts
export const VAULT_ERROR = { wrongPassphrase: 'wrong_passphrase', tampered: 'tampered', unsupported: 'unsupported' } as const;
export type VaultErrorCode = (typeof VAULT_ERROR)[keyof typeof VAULT_ERROR];
```

# JavaScript utilities

## `Set` (uniqueness and O(1) membership)
**Definition:** A collection of unique values with fast `has`/`add` lookups.
**Explanation:** Used to deduplicate and to test membership in constant time (e.g. `existingNames` for duplicate detection, selected item ids). Preferred over an array when you only need "is it present?".
**Example:**
```ts
const existingNames = new Set(items.map(i => i.name.toLowerCase()));
existingNames.has('milk'); // true
```

## `Array.prototype.reduce` (folding a list into one value)
**Definition:** Array method that walks a list accumulating a single result.
**Explanation:** Used to sum line totals and build strings/lookups without a manual loop. `reduce` is where money math happens, so it stays integer-only.
**Example:**
```ts
const total = items.reduce((sum, i) => sum + i.amount_minor * i.quantity, 0);
```

## Regular expressions (pattern matching)
**Definition:** A syntax for describing text patterns used to search, validate, or transform strings.
**Explanation:** Listly uses small regexes to sanitize numeric input (strip non-digits/dots) and to search lists/items case-insensitively.
**Example:**
```ts
const allowed = raw.replace(/[^0-9.]/g, ''); // keep only digits and dots
```

# Release and build (EAS)

## EAS Build
**Definition:** Expo's cloud build service that produces signed, installable iOS/Android artifacts.
**Explanation:** Instead of building locally, `eas build` uploads the project, builds on Expo's servers, and returns an APK/AAB download. It manages the Android release keystore so every release shares one signature (updates install in place). Configured in `ListlyApp/eas.json`.
**Example:**
```bash
cd ListlyApp
npx eas-cli build --platform android --profile preview     # installable APK
npx eas-cli build --platform android --profile production  # store AAB
```

## CNG (Continuous Native Generation) and `expo prebuild`
**Definition:** Generating the native `android/` and `ios/` projects from `app.json` + config plugins instead of committing them.
**Explanation:** The native folders are **build artifacts** (gitignored). `expo prebuild` (re)creates them, folding in the icon/splash config and native modules. Editing generated files by hand is not durable — they are overwritten on the next prebuild.
**Example:**
```bash
npx expo prebuild --platform android   # regenerate native project
```

## Debug vs release signing
**Definition:** Which keystore signs the APK, and therefore whether it can update another install.
**Explanation:** Android refuses to install an APK whose signature differs from the installed app. A local `gradlew assembleRelease` is signed with the **debug** key; an EAS build is signed with **EAS's release key** — different signatures, so switching between them needs one uninstall. Consistent EAS-signed releases update in place.
**Example:**
```bash
# inspect an APK's signer
apksigner verify --print-certs app-release.apk
```

## `versionCode` vs `versionName`
**Definition:** Android's two version numbers: an integer build number and a human-readable name.
**Explanation:** `versionCode` (`android.versionCode`) must strictly increase or the store rejects the upload and in-place updates fail; `versionName` (`expo.version`) is what users see. EAS reads both from `app.json` when `cli.appVersionSource` is `"local"`.
**Example:**
```jsonc
// app.json
"version": "1.0.0",          // versionName
"android": { "versionCode": 1 }
```

## Build profiles (`development` / `preview` / `production`)
**Definition:** Named presets in `eas.json` describing how a build is produced.
**Explanation:** `development` (dev client, internal), `preview` (internal APK for testers), `production` (`distribution: store`, AAB for the Play Store). Picking a profile selects distribution, build type, and Node version.
**Example:**
```jsonc
// eas.json
"production": { "distribution": "store", "android": { "buildType": "app-bundle" } }
```

## `expo doctor` (pre-build health check)
**Definition:** A tool that validates a project against Expo's expectations before building.
**Explanation:** EAS runs it as part of a build; missing **peer dependencies** (e.g. `expo-font`, required by `@expo/vector-icons`) fail the check and abort the build. Run `npx expo-doctor` locally to catch these early.
**Example:**
```bash
npx expo-doctor   # → "21/21 checks passed"
```

