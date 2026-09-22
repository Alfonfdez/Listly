# Design System

## Colors

### ColorPalette Interface
```typescript
interface ColorPalette {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  primary: string;
  accent: string;
  green: string;
  red: string;
  border: string;
}
```

### Dark Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `background` | `#0F172A` | Page background |
| `surface` | `#1E293B` | Cards, headers, elevations |
| `text` | `#E2E8F0` | Primary text |
| `textSecondary` | `#94A3B8` | Secondary text, labels |
| `primary` | `#22D3EE` | Accents, buttons, links |
| `accent` | `#A78BFA` | Details, highlights, hover |
| `green` | `#34D399` | Positive values, completed items |
| `red` | `#F87171` | Negative values, errors, delete |
| `border` | `#334155` | Input borders, dividers |

### Light Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `background` | `#FFFFFF` | Page background |
| `surface` | `#F1F5F9` | Cards, headers, elevations |
| `text` | `#1E293B` | Primary text |
| `textSecondary` | `#64748B` | Secondary text, labels |
| `primary` | `#0891B2` | Accents, buttons, links |
| `accent` | `#7C3AED` | Details, highlights, hover |
| `green` | `#059669` | Positive values, completed items |
| `red` | `#DC2626` | Negative values, errors, delete |
| `border` | `#E2E8F0` | Input borders, dividers |

### Usage Rules
- Always use tokens via `useConfig()` → `activeColors` (`c.background`, `c.primary`, etc.).
- Never hardcode hex values in components.
- Theme switchable from Settings (Dark / Light / System) with real-time switching.

## Typography

### Scaling System
- `useFontSize()` hook returns `fs(size)` that scales based on user preference.
- Factors: Small = x0.85, Medium = x1.0, Large = x1.15.
- All font sizes in the app must use `fs()` — never hardcoded values.
- The function rounds to the nearest integer to avoid sub-pixels.

### Font Sizes by Element

| fs(N) | Usage | Examples |
|-------|-------|----------|
| `fs(11)` | Auxiliary text, small labels | char counters, hint text |
| `fs(12)` | Badges, metadata, secondary labels | progress counts, error messages |
| `fs(13)` | Secondary labels, hints | progress text, empty-state hints |
| `fs(14)` | **Standard** — body text, names, buttons | list names, buttons, modals |
| `fs(15)` | List item names, search input | item names, SearchBar |
| `fs(16)` | Screen titles, modal titles | modal titles, section headers |
| `fs(17)` | Stack navigator header titles | All `headerTitle` in AppNavigator.tsx |
| `fs(18)` | List/collection detail names, modal titles | header names, totals |
| `fs(24)` | Drawer title | "Listly" app name in the drawer header |

### Font Weights

| fontWeight | Usage | Examples |
|------------|-------|----------|
| `'500'` | Normal body text, item names | ItemRow names, list names |
| `'600'` | **Most used** — names, buttons, trigger text, headers | buttons, headerTitle, active tabs |
| `'700'` | Totals, modal titles, active labels | progress totals, modal titles |

## Icons
- **Library:** `@expo/vector-icons` (Ionicons)
- **Usage:** `Ionicons` used throughout the app.
- **List icons:** defined in `constants/listIcons.ts` (`LIST_ICONS`), reused by collections.
- **Quick colors:** defined in `constants/listColors.ts` (`QUICK_COLORS`).
- **Type identity:** the collection identity icon is `albums-outline`; lists use `list-outline`.

## Layout & Spacing
- **Screen padding:** `paddingHorizontal: 12`
- **Section spacing:** `marginTop: 8` for section titles; `gap: 12` between grid items
- **Border radius:** `10` for inputs/buttons, `12` for cards, `16` for modals, `999` for pill/circle
- **Grid gap:** `12` for icon/color grids

## Header
- Stack navigator header titles are centered (`headerTitleAlign: 'center'` in `screenOptions`).
- Drawer screens show the hamburger on the left.

## No External UI Library
- Styles using React Native's `StyleSheet.create()`.
- No Tailwind, no NativeBase, no React Native Paper.