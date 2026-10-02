# YAMAK MOBILE - 07. ASSETS & BRANDING

> # ⚠️ LEGACY REFERENCE FOR CONTENT — NON-CURRENT FOR DESIGN AUTHORITY
>
> This document catalogs the legacy **`yamak-mobile`** project's brand assets and tokens, which is
> **SUPERSEDED**. It is retained ONLY as the source of truth for **which assets, icons, fonts,
> copy, logo files and app identity values exist and must be reproduced**.
>
> The active project is **`YamakExpoNew` (Expo + Expo Router)** — see `REBUILD-PLAN.md` §0–§2.
>
> **Design authority is NOT legacy.** Legacy's own palette is known to fail WCAG AA
> (gold `#EEB247`/`#F7B123` on white ≈1.9:1). The rebuild's single palette is the **approved**
> token set in `src/theme/` (`colors.ts`, `spacing.ts`, `radius.ts`, `typography.ts`,
> `interaction.ts`), as approved through the `YAMAK-DESIGN-001` gate in
> `13-SCREEN-BY-SCREEN-REBUILD-PLAN.md`. Legacy colors/fonts below are **content inventory only**.
>
> Also note: legacy `android/`, `ios/`, and hardcoded build config (application IDs, flavors,
> Gradle) are historical. The rebuild configures through **`app.json` / `app.config.ts`** with
> `android.package` / `ios.bundleIdentifier` = `com.yamak.assist` and the scheme `yamakexponew`.
>
> **Never reuse a legacy secret.** The Google Maps keys committed in legacy manifests must never
> be copied into the rebuild — see `SECRETS-MIGRATION-CHECKLIST.md`.

> Reverse-engineered from `src/constants/`, legacy `app.json`, `src/assets/`, `ios/Yamak/Info.plist`,
> `android/app/src/main/res/`. Evidence: `CONFIRMED` | `INFERRED` | `UNKNOWN`.
> IMPORTANT: This doc preserves brand tokens so the rebuild looks identical. Asset binary files
> (images/lottie/fonts) must be re-delivered by the user or extracted from the legacy repo.

---

## 1. Brand identity

| Item | Value (CONFIRMED) |
|---|---|
| App name | Yamak |
| Display name (iOS bundle) | Yamak |
| Android application ids | `com.yamak.mobapp` (prod), `com.yamak.mobstaging` (staging), `com.yamak.mobdev` (dev) |
| Android version | versionCode 15, versionName 2.8 |
| Website | `https://yamak-kw.com` |
| App store links | iOS: `https://apps.apple.com/kw/app/yamak-%D9%8A%D9%85%D9%83/id6473277118`<br/>Android: `https://play.google.com/store/apps/details?id=com.yamak.mobapp` |

## 2. Color palette (design tokens)

### Primary theme — `AppColorsTheme2` (ACTIVE theme; CONFIRMED used in navigators/UI)
| Token | Hex |
|---|---|
| `primary` | `#002F6C` (dark navy — headers, tab/drawer bars) |
| `primary200` | `#E0EDF3` |
| `primaryLight` | `#ccd5e1` |
| `primary700` | `#5b8cb8` |
| `secondary` | `#F7B123` (amber — active highlight, buttons) |
| `secandaryLight` | `#fdefd3` |
| `secondary200` | `#d4d5e3` |
| `offWhite` | `#f4f1f6` (screen backgrounds) |
| `gray` | `#ABB0B8` |
| `black` | `#000000` |
| `white` | `#ffffff` |
| `white2` | `#fafafa` |
| `offGray` | `#efefef` |

### Legacy themes (NOT active, keep for reference only)
- `AppColors`: `primary #73b6cc`, `secondary #4196b2`, `gray #e5e5e5` — old palette.
- `AppColorsTheme3`: `primary #80a7b8`, `secondary #f3485b` — unused experimental palette (UNUSED?).
> Rebuild decision: use ONLY `AppColorsTheme2`; drop the other two.

## 3. Typography

| Font family key | Actual font file(s) | Style |
|---|---|---|
| `Roboto-Medium` | Roboto (medium) | default text font (`AppText`) |
| `Roboto-MedItalic` | Roboto (medium italic) | secondary |

- iOS links 28 UIAppFonts (Roboto family). Android ships font via `react-native` assets or
  `android/app/src/main/assets/fonts/` (confirm location during extraction).
- `AppSizes`: small 12, xSmall 14, medium 16, xMedium 18, large 20, xLarge 24, xxLarge 32.

## 4. Icons

- Library: `react-native-vector-icons`. Central wrapper: `src/components/ui/appIcon.tsx`
  (`AppIcon`) with typed families: Ionicons, AntDesign, MaterialIcons, Entypo, FontAwesome,
  Fontisto, MaterialCommunityIcons, FontAwesome5.
- Icon usage map (sampled): `home-outline`, `person-outline`, `favorite-outline`, `map`,
  `map-marker-radius-outline`, `chatbox-ellipses-outline`, `md-menu`, `close`.
- Rebuild: re-create the same wrapper; keep icon names identical for 1:1 parity.

## 5. Images & logos

Legacy locations (paths CONFIRMED):
- `src/assets/images/appLogo.png` — used in Home header; copy to rebuild `src/assets/images/`.
- `src/assets/images/` — additional app images (onboarding, auth, profile).
- `src/constants/lootiesFiles/` — Lottie JSON animations (e.g. `LoadignSec.json` used by `LoadingLoatie`).
> Extraction requires access to the binary files; the user must copy them from the legacy repo
> into the new repo. Keep the same relative paths so code compiles unchanged.

## 6. App icons (launcher)

- Android: adaptive launcher icons under `android/app/src/main/res/` (mipmap-*).
- iOS: `ios/Yamak/Images.xcassets/AppIcon.appiconset` plus ALTERNATE icons:
  - `Ramadan_AppIcon`, `defualt_AppIcon` (note: typo "defualt" in legacy) — toggled via `react-native-change-icon`.
- `RootFun.setAppIconImage()` sets `Ramadan_AppIcon` on iOS at startup (CONFIRMED).
- Deep links (launch URLs): `yamak://`, `https://yamak-kw.com`, `https://yamak.page.link.com`.

## 7. Copy-to-rebuild checklist (assets)

- [ ] `assets/images/appLogo.png` and all images copied into new project.
- [ ] Lottie JSON files copied into `src/constants/lootiesFiles/`.
- [ ] Roboto font files registered (iOS Info.plist fonts + Android assets/fonts).
- [ ] Android launcher icons + iOS AppIcon set recreated.
- [ ] Alternate iOS app icons (Ramadan + default) configured; `react-native-change-icon` integrated.
- [ ] Vector icons font (react-native-vector-icons) linked.
- [ ] Colors use `AppColorsTheme2` only.
- [ ] App display name = "Yamak".