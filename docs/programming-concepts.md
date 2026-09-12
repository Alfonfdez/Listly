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
**Explanation:** All user-facing strings go through `src/i18n/`. Each language (en/es) is a flat object of keys; `t()` returns the language object so components read `t.hello_world`. Key naming is `lowercase.with.dots`.
**Example:**
```tsx
// src/i18n/en.ts
export default { home_empty: 'No lists yet', settings_title: 'Settings' };

// Component
import { useApp } from '../context/AppContext';
const t = useApp().t;
<Text>{t.home_empty}</Text>
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