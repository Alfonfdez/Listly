# 006 — Create list color picker: Plan

## Architecture

```
CreateListScreen
├── Name field / validation (unchanged)
├── Icon grid (unchanged, inline)
├── Color section → ColorGrid (quick colors + custom circle + "+")
└── ColorPickerModal (RN Modal, reanimated-color-picker)
```

Color selection state via `useColorSelection` (Finly port): `selectedColor`, `customColor`, `handleColorSelect`. Modal visibility owned by the screen. The chosen color flows unchanged into `listRepo.create`.

## Components (ported from Finly, Listly-conventions)

| Component | Location | Responsibility |
|-----------|----------|----------------|
| `ColorGrid` | `src/components/ColorGrid.tsx` | Quick-color circles + custom circle + "+" trigger |
| `ColorPickerModal` | `src/components/ColorPickerModal.tsx` | Modal with color picker + OK/Cancel (temp color on OK) |
| `ModalShell` | `src/components/ModalShell.tsx` | Transparent centered modal card (shared) |
| `ModalFooter` | `src/components/ModalFooter.tsx` | Footer action buttons (shared) |
| `useColorSelection` | `src/hooks/useColorSelection.ts` | Selection + custom-color tracking |
| `useResetOnOpen` | `src/hooks/useResetOnOpen.ts` | Reset temp state when modal opens |

## Dependencies

- Add `reanimated-color-picker@^5.1.2`, `react-native-svg` (expo-managed). `react-native-reanimated`, `react-native-worklets`, `react-native-gesture-handler` already installed.

## Constants

- `src/constants/componentStyles.ts`: add `MODAL_BORDER_RADIUS = 16`, `OVERLAY_BG = 'rgba(0,0,0,0.6)'`.
- `src/constants/listColors.ts`: add `QUICK_COLORS` (6 hexes from the existing palette; first equals the current default).
- Reuse `WHITE`/`TRANSPARENT` from `themes.ts`, `CARD_BORDER_RADIUS`/`BUTTON_BORDER_RADIUS`.

## i18n

New keys (en/es): `color_picker_title`, `color_picker_cancel`, `color_picker_ok`, `color_grid_more`.

## Data flow

1. Quick color tap → `handleColorSelect(color)` (updates selection + checkmark).
2. "+" → `ColorPickerModal` opens; `useResetOnOpen` seeds `tempColor` from `selectedColor ?? c.primary`.
3. Picker drags update `tempColor` (no commit).
4. OK → `onSelect(tempColor)` (sets selection, records custom if not in `QUICK_COLORS`), closes. Cancel → close only.
5. Create → `listRepo.create({ name, color: selectedColor })` (unchanged path).

## Risks / notes

- Reanimated-color-picker uses `react-native-svg`; verify both render under RN Web in the browser loop.
- `ModalShell` `onRequestClose` → Cancel path (back button on Android, ESC on web).
- `CreateListScreen` tests reference the old `LIST_COLORS` grid — update them to press circle labels (color hexes / `color_grid_more`).