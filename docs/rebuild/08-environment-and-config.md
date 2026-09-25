# YAMAK MOBILE — 08. ENVIRONMENT & CONFIGURATION

> Reverse-engineered from `.env*`, `android/build.gradle`, `android/app/build.gradle`,
> `android/gradle.properties`, `ios/Yamak/Info.plist`, `app.json`, `src/constants/CommonConsstats.ts`.
> Evidence: `CONFIRMED`. SECRET RULE: variable NAMES + source locations only — no secret VALUES copied.

---

## 1. Environment files (react-native-config)

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

## 2. Android configuration

- `compileSdk 37`, `targetSdk 36`, `minSdk 24` (ext vars in `android/build.gradle`).
- NDK `28.2.13676358`, Kotlin `2.2.0`, `newArchEnabled = true`, Hermes enabled.
- Flavors: `production` (`com.yamak.mobapp`), `staging` (`com.yamak.mobstaging`), `development` (`com.yamak.mobdev`).
- `versionCode 15`, `versionName "2.8"`.
- `resValue "string", "build_config_package", "com.yamak"` per flavor (react-native-config requirement).
- Release build currently signs with the DEBUG keystore (legacy caveat — for real release a production keystore is REQUIRED; document in SECRETS).
- Firebase plugin applied (`com.google.gms.google-services`) with `google-services.json` (see SECRETS).
- Sentry gradle (`@sentry/react-native/.../sentry.gradle`) applied.
- Dependencies: react-native-vector-icons, react-native-restart, react-native-splash-screen, react-native-config, react-native-localize as local (`:project`) modules; OkHttp 5 logging interceptor.

## 3. Android manifest essentials (CONFIRMED)

- Permissions: `INTERNET`, `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, `POST_NOTIFICATIONS`.
- Google Maps API key via meta-data (`AIza...` value — see SECRETS doc).
- Deep links: `yamak://`, `https://yamak-kw.com`, `https://yamak.page.link.com`.

## 4. iOS configuration (`ios/Yamak/Info.plist`)

- Display name: Yamak.
- Google Sign-In reverse-client URL scheme (`com.googleusercontent.apps.<ios-client-id>`).
- Alternate app icons: `Ramadan_AppIcon`, `defualt_AppIcon` (legacy typo).
- Permissions: camera, photo library, location.
- 28 UIAppFonts (Roboto family).

## 5. Runtime constants (`src/constants/CommonConsstats.ts`)

| Constant | Value | Notes |
|---|---|---|
| `AppLimitList` | 10 | default page size for vehicles |
| `NotificationTopicConstants.yamakAll` | `yamak-all` | FCM topic subscribe |
| `appVersion` / `appBuildNumber` | from device-info | shown in About/Profile |
| `isDev` | `NODE_ENV !== "production"` | gates console logs |
| Store/AppStore links | Yamak apps | see 07 §1 |

## 6. App-level config (`app.json`)

```
{ "name": "Yamak", "displayName": "Yamak" }
```
(Bare React Native — not Expo.)

## 7. Rebuild prerequisites (config to reproduce)

1. `.env*` files created with same 5 variable names (values from SECRETS doc).
2. Gradle flavors + flavor→env mapping.
3. Android package names match Google-services/FCM configs.
4. iOS Info.plist: URL schemes, fonts, icons, permissions.
5. Keystore strategy for release (production keystore — legacy used debug keystore).
6. Deep links registered on both platforms.