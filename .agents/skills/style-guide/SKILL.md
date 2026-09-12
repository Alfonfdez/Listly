---
name: style-guide
description: React Native color and typography tokens for the app, loaded via useConfig(). Use for any style or design change (colors, layout, or appearance).
---

# Style Guide

The design system lives in `spec/constitution/4-design-system.md`. Colors and type sizes are
always used as **tokens — never raw hex or hardcoded px** in components.

## Color tokens (`ColorPalette`)

Read via `useConfig()` → `activeColors` (selected by the active dark/light theme).

| Token | Dark hex | Light hex | Usage |
|---|---|---|---|
| `background` | `#0F172A` | `#FFFFFF` | page background |
| `surface` | `#1E293B` | `#F1F5F9` | cards, headers, elevations |
| `text` | `#E2E8F0` | `#1E293B` | primary text |
| `textSecondary` | `#94A3B8` | `#64748B` | secondary text / labels |
| `primary` | `#22D3EE` | `#0891B2` | accents, buttons, links |
| `accent` | `#A78BFA` | `#7C3AED` | details, highlights, hover |
| `green` | `#34D399` | `#059669` | positive / completed items |
| `red` | `#F87171` | `#DC2626` | negative values, errors, delete |
| `border` | `#334155` | `#E2E8F0` | input borders, dividers |

## Typography tokens (`fs()`)

All font sizes go through the `useFontSize()` hook: `fs(N)` returns the size scaled by the
user preference (Small ×0.85, Medium ×1.0, Large ×1.15). Never hardcode font sizes.

| fs(N) | Usage |
|---|---|
| `fs(11)` | auxiliary text, small labels |
| `fs(12)` | badges, metadata, secondary labels |
| `fs(13)` | tabs, chips, sort labels |
| `fs(14)` | **standard** body text, names, buttons |
| `fs(15)` | list item names, search input |
| `fs(16)` | screen titles, modal titles |
| `fs(17)` | stack navigator header titles |
| `fs(18)` | modal totals |
| `fs(22)` | screen totals / progress numbers |
| `fs(28)` | main home total |

## Rules

- Only token values via `useConfig()`; no `bg-[#…]`, no Tailwind classes, no hex literals in components.
- Dark/light themes both supported; theme switch is real-time from Settings.
- Cards and elevations in `surface` with rounded corners (radius 12).
- Main button/icon color in `primary`; hover or highlight in `accent`; completed items in `green`.
- `fontWeight` as strings: `'500'` body/items, `'600'` names/buttons/headers, `'700'` totals and active labels.
- No external UI library: styles via React Native's `StyleSheet.create()`.