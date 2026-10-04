# 006 — Create list color picker

- **Objective**
  Replace the Create List flat color grid with the Finly pattern: a row of quick colors plus a "+" trigger that opens a full color picker modal (`reanimated-color-picker`), with a custom-color circle persisted in the row.

---

## Functional requirements

### 1. Color section
- The color section becomes a `ColorGrid`: a horizontal row of `QUICK_COLORS` circles, an optional custom-color circle (rendered only after a custom color has been picked), and a trailing "+" circle (`color_grid_more`).
- Circles are ~36 px taps; the selected one gets a border highlight + checkmark, and reports `accessibilityState.selected`.
- Quick colors come from `QUICK_COLORS` in `src/constants/listColors.ts` (6 theme-agnostic hexes drawn from the existing palette).

### 2. Picker modal
- The "+" opens `ColorPickerModal`: an RN `Modal` (transparent, fade) centered card, `maxWidth` 360, `maxHeight` ~70%, rounded once (radius 16), overlay `rgba(0,0,0,0.6)`.
- Body uses `reanimated-color-picker`: `Panel1` (200 px), `HueSlider`, `OpacitySlider`, `Preview` — initialized to the current selection (or the theme primary) each time the modal opens (`useResetOnOpen`).
- Footer: Cancel / OK buttons (row, top border). Cancel (or overlay dismiss) discards; OK applies the temp color.

### 3. Colors and creation flow
- Applying a color selects it immediately; if it is not in `QUICK_COLORS` it is also stored as `customColor` so the row keeps a shortcut circle for it.
- The selected color feeds the existing create path: `listRepo.create({ name, color, icon })`. No schema change.

### 4. Edge behavior
- The picker always opens with a valid starting color (current selection, else theme primary), so OK never produces an empty value.
- A custom color created via the picker persists on the row for reuse during the same session.
- Existing duplicate/required/max name validation is untouched.

---

## Non-functional requirements

- **New dependencies**: `reanimated-color-picker@^5.1.2` + `react-native-svg` (expo-managed). Requires `react-native-reanimated`, `react-native-worklets` and `react-native-gesture-handler` (already installed).
- **Reuse**: new `ModalShell`, `ModalFooter`, `ColorGrid`, `ColorPickerModal`, `useColorSelection`, `useResetOnOpen` (ported from Finly, adapted to Listly conventions); constants `MODAL_BORDER_RADIUS`, `OVERLAY_BG` added to `componentStyles`.
- **Multilingual**: new keys `color_picker_title`, `color_picker_cancel`, `color_picker_ok`, `color_grid_more` (en/es).
- **Theme/text size**: all colors via `useConfig().activeColors`, all sizes via `useFontSize()`.
- **Tests**: `ColorGrid` component test (selection + custom circle + trigger), updated `CreateListScreen` test (quick-color select, open modal, confirm custom color, cancel keeps old), existing create-flow tests updated to the new quick-color row.
- **Web**: RN `Modal` + reanimated-color-picker must work under React Native Web; verified in the browser loop.

---

## Acceptance criteria

- [x] The Create List color section shows a row of quick colors plus a "+" trigger.
- [x] Tapping a quick color selects it (highlight) and it is used for the created list.
- [x] Tapping "+" opens the color picker modal pre-seeded with the current color.
- [x] Adjusting the picker and confirming (OK) applies the new color and creates a custom circle; Cancel discards it.
- [x] A list created with the picked color shows that color on Home.
- [x] All texts are multilingual and respect theme + text size.