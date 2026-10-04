# Assets — Listly

All image assets live in `ListlyApp/assets/`. Expo reads them from `app.json` and uses them across platforms.

## The mark

The Listly mark is **three list rows** (a bullet dot + a rounded bar each), with the **middle row checked** (an outlined dot containing a checkmark) and a cyan gradient; the other two rows use the dark slate fill. Colors come from the light theme (`#0891B2` / `#22D3EE` gradient, `#1E293B` bars) on a **white** background, in the same spirit as Finly's gradient-on-white icon.

The mark is defined as SVG and rasterized by a small generator at `ListlyApp/scripts/gen-assets.mjs` (writes all six files). `sharp` is intentionally **not** a project dependency (icons change rarely) — run the script from a directory that resolves `sharp`:

```bash
# from FinlyApp (which has sharp installed):
node ../../Listly-app/Listly/ListlyApp/scripts/gen-assets.mjs
# or temporarily: npm i -D sharp && node scripts/gen-assets.mjs
```

## Asset reference

| File | Purpose | Dimensions | Safe zone / Notes |
|---|---|---|---|
| `icon.png` | Primary app icon (iOS home screen, Android non-adaptive, Expo manifest) | 1024 × 1024 px | Full square, do not add rounded corners — the OS applies its own mask |
| `android-icon-background.png` | Bottom layer of Android adaptive icon | 1024 × 1024 px | Full bleed. Solid color or pattern behind the foreground |
| `android-icon-foreground.png` | Top layer of Android adaptive icon | 1024 × 1024 px | Artwork authored at `scale(0.9)` (mark fills ~49% of the canvas width, comfortable padding inside the Android 66% safe zone) |
| `android-icon-monochrome.png` | Android 13+ Material You wallpaper-themed icon | 1024 × 1024 px | Single-color flat version (white on transparent) at the same `scale(0.9)` as the foreground |
| `favicon.png` | Browser tab icon (web / PWA) | 1024 × 1024 px (Expo downsizes at export) | |
| `splash-icon.png` | Centered logo during app boot (native splash) | 1024 × 1024 px | The mark is authored at `scale(1.0)` and fills ~55% of the canvas width, centered. Background color configured in `app.json` |

## app.json mapping

```json
{
  "expo": {
    "icon": "./assets/icon.png",
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/android-icon-foreground.png",
        "backgroundColor": "#E6F4FE",
        "backgroundImage": "./assets/android-icon-background.png",
        "monochromeImage": "./assets/android-icon-monochrome.png"
      }
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-sqlite",
      "expo-sharing",
      "react-native-quick-crypto",
      [
        "expo-splash-screen",
        {
          "image": "./assets/splash-icon.png",
          "resizeMode": "contain",
          "backgroundColor": "#0F172A"
        }
      ]
    ]
  }
}
```

## Format requirements

- **Format**: PNG with transparent background where applicable.
- **Quality**: PNG-24 or PNG-32, no visible quality loss.
- **Size**: Each file must not exceed 1 MB.
- **Compatibility**: Files must be readable by Expo's build system (EAS Build and expo publish).

## Web splash screen

The native Expo splash (`expo-splash-screen` plugin in `app.json`) only works on native builds. On web, an in-app `SplashScreen` component in `App.tsx` handles the loading screen:

- Logo (`icon.png`) centered, 80 × 80 px, borderRadius 20.
- Background: the current theme's `background` color.
- Logo fades in and springs to scale on mount; the screen exits with a 400 ms fade/scale-out once the database is ready.