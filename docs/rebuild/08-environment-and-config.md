# YAMAK MOBILE — 08. ENVIRONMENT & CONFIGURATION

> # ⚠️ LEGACY REFERENCE — CONFIG BELOW IS NON-CURRENT FOR THE REBUILD
>
> Sections 2–5 document the **legacy `yamak-mobile` native project** (Gradle flavors, native
> manifests, `Info.plist`, `react-native-config`). That project is **SUPERSEDED**. The rebuild is
> **`YamakExpoNew` (Expo + Expo Router)** — see `REBUILD-PLAN.md` §0–§2.
>
> Legacy native config is kept as a **requirements inventory only** (permissions, deep links, fonts,
> identifiers, notification topic) so the Expo equivalents can be reproduced deliberately.
> **Do not recreate `android/`, `ios/`, Gradle flavors, `react-native-config`, or `dotenv.gradle`
> in the rebuild.**
>
> **How the rebuild configures things (this is authoritative):**
> - Env vars: a plain **`.env`** file with **`EXPO_PUBLIC_*`** names, read by `src/api/config.ts`.
>   No flavors, no Gradle env mapping, no build-type switching.
> - App config: **`app.json`** (static) + **`app.config.ts`** (dynamic, spreads `config` and appends
>   the `react-native-maps` plugin with `GOOGLE_MAPS_ANDROID_API_KEY` / `GOOGLE_MAPS_IOS_API_KEY`).
> - Native directories (`android/`, `ios/`) are **generated** by `npx expo prebuild` and are not
>   hand-edited; the project runs via Expo Go / `npx expo run:android`.
> - Current identifiers: `android.package` / `ios.bundleIdentifier` = `com.yamak.assist`,
>   scheme `yamakexponew`.
> - Secret procedure: `SECRETS-MIGRATION-CHECKLIST.md`. **Variable names and sources only — never
>   secret values in any document.**

> Reverse-engineered from legacy `.env*`, `android/build.gradle`, `android/app/build.gradle`,
> `android/gradle.properties`, `ios/Yamak/Info.plist`, legacy `app.json`, `src/constants/CommonConsstats.ts`.
> Evidence: `CONFIRMED`. SECRET RULE: variable NAMES + source locations only — no secret VALUES copied.

---

## 0. CURRENT rebuild configuration (Expo — authoritative)

| Concern | Current mechanism | File |
|---|---|---|
| API base URL | `EXPO_PUBLIC_API_URL` env var | `.env`, `src/api/config.ts` |
| Android Maps key | `GOOGLE_MAPS_ANDROID_API_KEY` → `androidGoogleMapsApiKey` | `.env`, `app.config.ts` |
| iOS Maps key | `GOOGLE_MAPS_IOS_API_KEY` → `iosGoogleMapsApiKey` | `.env`, `app.config.ts` |
| App name / display name | `"name": "Yamak"`, `"displayName": "Yamak"` | `app.json` |
| Android package | `com.yamak.assist` | `app.json` |
| iOS bundle id | `com.yamak.assist` | `app.json` |
| URL scheme | `yamakexponew` | `app.json` |
| Entry point | `expo-router/entry` | `package.json` → `main` |
| Typed routes | `experiments.typedRoutes: true` | `app.json` |
| Config plugins | `expo-router`, `expo-splash-screen`, `expo-secure-store`, `expo-location`, `react-native-maps` | `app.json` + `app.config.ts` |
| Page size for vehicles | `10` (server default; client sends none, matching legacy) | `src/api/vehicles.ts` |

⛔ **Not configured / not installed yet (PLANNED — NOT YET MIGRATED):** Firebase, Google Sign-In,
Sentry, Freshchat, FCM topic subscription (`yamak-all`), deep-link domains (`yamak://`,
`https://yamak-kw.com`, `https://yamak.page.link.com`), and a release signing keystore. See
`SECRETS-MIGRATION-CHECKLIST.md`.

---

## 1. Environment files — HISTORICAL (legacy `react-native-config`)

> ⛔ **NON-CURRENT.** Legacy loaded these through `react-native-config` + `dotenv.gradle` + build
> flavors. The rebuild uses **`.env` + `EXPO_PUBLIC_*`** (§0). Retained as a variable-name inventory.

Files: `.env`, `.env.development`, `.env.staging`, `.env.production`.

| Variable | Purpose | Example value (production) |
|---|---|---|
| `NODE_ENV` | dev/staging/production flag (`isDev`, `AppEnv`) | `production` |
| `IOS_CLIENT_ID` | Google Sign-In iOS client id | (OAuth client id — see SECRETS doc) |
| `ANDROID_CLIENT_ID` | Google Sign-In Android client id | (see SECRETS doc) |
| `WEB_CLIENT_ID` | Google Sign-In web/server client id | (see SECRETS doc) |
| `API_URL` | Backend base URL | `https://yamak-kw.com/api/mobile/v1/` |

Flavor → env mapping (`android/app/build.gradle` `project.ext.envConfigFiles`):
```
productiondebug/release    → .env.production
stagingdebug/release       → .env.staging
developmentdebug/release   → .env.development
```

Read at runtime via `Config.NODE_ENV`, etc. (`react-native-config`).
> Additional actual runtime base URL precedence in `axios.config.ts`:
> `process.env.EXPO_PUBLIC_API_PRO || "https://yamak-kw.com/api/mobile/v1/"` (CONFIRMED), THEN
> overridden by custom IP from AsyncStorage `env` (see `AppCustomIpModal`).
>
> ⚠️ **Rebuild:** the custom-IP `env` override and `AppCustomIpModal` are **NOT to be ported**.
> The rebuild resolves its base URL solely from `EXPO_PUBLIC_API_URL`.

## 2. Android configuration — HISTORICAL (legacy Gradle)

> ⛔ **NON-CURRENT.** None of this is recreated in the rebuild. Expo generates `android/` via
> `npx expo prebuild` and manages SDK versions. Retained as a requirements inventory only.

- `compileSdk 37`, `targetSdk 36`, `minSdk 24` (ext vars in `android/build.gradle`).
- NDK `28.2.13676358`, Kotlin `2.2.0`, `newArchEnabled = true`, Hermes enabled.
- Flavors: `production` (`com.yamak.mobapp`), `staging` (`com.yamak.mobstaging`), `development` (`com.yamak.mobdev`).
- `versionCode 15`, `versionName "2.8"`.
- `resValue "string", "build_config_package", "com.yamak"` per flavor (react-native-config requirement).
- Release build currently signs with the DEBUG keystore (legacy caveat — for real release a production keystore is REQUIRED; document in SECRETS).
- Firebase plugin applied (`com.google.gms.google-services`) with `google-services.json` (see SECRETS).
- Sentry gradle (`@sentry/react-native/.../sentry.gradle`) applied.
- Dependencies: react-native-vector-icons, react-native-restart, react-native-splash-screen, react-native-config, react-native-localize as local (`:project`) modules; OkHttp 5 logging interceptor.

## 3. Android manifest essentials (CONFIRMED) — legacy

> ⚠️ Permissions and deep links below are **requirements to reproduce** in Expo
> (`app.json` permissions, `expo-location` plugin, scheme). The legacy manifest itself is not copied.

- Permissions: `INTERNET`, `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, `POST_NOTIFICATIONS`.
- Google Maps API key via meta-data (`AIza...` value — see SECRETS doc). ⛔ **NEVER reuse the legacy
  key**; issue a new SHA-1/bundle-restricted key and supply it via `GOOGLE_MAPS_ANDROID_API_KEY`.
- Deep links: `yamak://`, `https://yamak-kw.com`, `https://yamak.page.link.com`.

## 4. iOS configuration (`ios/Yamak/Info.plist`) — legacy

> ⛔ **NON-CURRENT file.** Requirements to reproduce: permissions, fonts, alternate icons, URL schemes.

- Display name: Yamak.
- Google Sign-In reverse-client URL scheme (`com.googleusercontent.apps.<ios-client-id>`).
- Alternate app icons: `Ramadan_AppIcon`, `defualt_AppIcon` (legacy typo).
- Permissions: camera, photo library, location.
- 28 UIAppFonts (Roboto family).

## 5. Runtime constants (`src/constants/CommonConsstats.ts`) — legacy

| Constant | Value | Notes |
|---|---|---|
| `AppLimitList` | 10 | default page size for vehicles |
| `NotificationTopicConstants.yamakAll` | `yamak-all` | FCM topic subscribe |
| `appVersion` / `appBuildNumber` | from device-info | shown in About/Profile |
| `isDev` | `NODE_ENV !== "production"` | gates console logs |
| Store/AppStore links | Yamak apps | see 07 §1 |

## 6. App-level config (`app.json`)

⛔ **HISTORICAL — legacy value.** The legacy `app.json` was `{ "name": "Yamak", "displayName": "Yamak" }`
(Bare React Native — not Expo).

✅ **CURRENT — `YamakExpoNew`.** It is an **Expo** project: `app.json` (name `Yamak`, package/bundle id
`com.yamak.assist`, scheme `yamakexponew`, `experiments.typedRoutes: true`, plugins) plus
`app.config.ts` for the Maps keys. See §0 for the full table.

## 7. Rebuild prerequisites (config to reproduce)

> ✅ **APPLIED (Expo):** items 1, 3 and 6 below. ⛔ **NOT APPLICABLE in Expo:** items 2 and 5
> (Gradle flavors; manual keystore wiring). ⏭ **PENDING:** items 4 and the release signing decision.

1. ✅ `.env` created with `EXPO_PUBLIC_API_URL` + the two Maps keys (**Expo naming**, not the legacy
   flavor scheme).
2. ⛔ Gradle flavors + flavor→env mapping — **not applicable**; Expo + `.env` replaces it.
3. ✅ Android package / bundle id = `com.yamak.assist` — matches the app identity that Firebase/FCM
   configs will need.
4. ⏭ iOS URL schemes, fonts, icons, permissions — reproduce via Expo config when those screens land.
5. ⏭ Keystore strategy for release (production keystore — legacy used the debug keystore).
6. ⏭ Deep links registered on both platforms (scheme `yamakexponew` today; legacy domains pending).