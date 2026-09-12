# Assets — Listly

All image assets live in `ListlyApp/assets/`. Expo reads them from `app.json` and uses them across platforms.

## Asset reference

| File | Purpose | Dimensions | Safe zone / Notes |
|---|---|---|---|
| `icon.png` | Primary app icon (iOS home screen, Android non-adaptive, Expo manifest) | 1024 × 1024 px | Full square, do not add rounded corners — the OS applies its own mask |
| `android-icon-background.png` | Bottom layer of Android adaptive icon | 1024 × 1024 px | Full bleed. Solid color or pattern behind the foreground |
| `android-icon-foreground.png` | Top layer of Android adaptive icon | 1024 × 1024 px | Keep artwork inside center **675 × 675 px** safe zone (Android crops edges) |
| `android-icon-monochrome.png` | Android 13+ Material You wallpaper-themed icon | 1024 × 1024 px | Single-color flat version (white on transparent). Artwork inside center **675 × 675 px** safe zone |
| `favicon.png` | Browser tab icon (web / PWA) | 1024 × 1024 px (Expo downsizes at export) | |
| `splash-icon.png` | Centered logo during app boot (native splash) | 1024 × 1024 px | Keep artwork inside center **288 × 288 px** safe zone. Background color configured in `app.json` |

## app.json mapping

```json
{
  "expo": {
    "icon": "./assets/icon.png",
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/android-icon-foreground.png",
        "backgroundColor": "#0F172A",
        "monochromeImage": "./assets/android-icon-monochrome.png"
      }
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-sqlite",
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