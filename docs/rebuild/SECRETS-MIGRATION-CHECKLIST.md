# YAMAK MOBILE — SECRETS MIGRATION CHECKLIST

> # 🔒 SECURITY RULES (UNCHANGED — STILL FULLY BINDING)
>
> 1. This file lists **WHERE** secrets/keys live and their **VARIABLE NAMES** only.
> 2. **NO VALUES ARE EVER WRITTEN IN THIS DOCUMENT.** If any value appears anywhere in `docs/`,
>    treat it as an error and redact it.
> 3. Values are copied by the **user** directly from the owning console / password manager into the
>    NEW project's local `.env` — never into documentation, never into source, never into an issue.
> 4. **NEVER commit real values to the repo.** `.env` is gitignored.
> 5. **Never reuse the legacy committed Google Maps keys.** Rotate / restrict instead
>    (see §4).
>
> ⛔ **Legacy leak recorded (do not replicate):** the legacy `yamak-mobile` repository has a Google
> Maps Android key hardcoded in tracked `AndroidManifest.xml` files and a separate iOS key in a
> tracked `AppDelegate.mm`. Firebase keys are also committed in tracked files and even in tracked log
> files. **The Expo rebuild must not repeat this.** Rotate those keys in Google Cloud.

---

## 1. Environment configuration in Expo

`YamakExpoNew` uses Expo configuration, not `react-native-config`:

| Mechanism | Purpose |
|---|---|
| `.env` | Local, **gitignored** environment values. Loaded by the Expo CLI at config-evaluation time. |
| `.env.example` | Tracked template showing **variable NAMES only**. Never values. |
| `EXPO_PUBLIC_*` | Variables inlined into the JS bundle and readable at runtime via `process.env`. Only put **public** values here (a base URL is public; a secret is not). |
| Non-`EXPO_PUBLIC_` variables | Read **at build/config time only** (e.g. inside `app.config.ts`). Never shipped in the bundle. |

> ⛔ **`react-native-config` is NOT used by `YamakExpoNew`.** It was a legacy CLI choice and is
> superseded by `app.config.ts` + `.env`. Do not reintroduce it.

### 1.1 Current variable names

| Variable | Used by | Where the value originates | Current status |
|---|---|---|---|
| `EXPO_PUBLIC_API_URL` | Shared fetch client (`src/api/config.ts`) — API base URL | team backend (production `https://yamak-kw.com/api/mobile/v1/`) | ✅ **IN USE.** Present in `.env.example`; a public value, not a secret. |
| `GOOGLE_MAPS_ANDROID_API_KEY` | `app.config.ts` → `react-native-maps` plugin → Android `com.google.android.geo.API_KEY` meta-data | Google Cloud Console → Maps SDK for Android | ✅ **IN USE.** Configured (build-time only). Restriction status in §4. |
| `GOOGLE_MAPS_IOS_API_KEY` | `app.config.ts` → `react-native-maps` plugin → iOS `GMSApiKey` + Google pod + AppDelegate init | Google Cloud Console → Maps SDK for iOS | ✅ **IN USE.** Configured (build-time only). Restriction status in §4. |

### 1.2 `app.config.ts` handling (current)

- `app.json` is the **static source of truth** for every other value.
- `app.config.ts` re-emits `app.json` wholesale via a spread and appends the `react-native-maps`
  plugin entry. **The spread is load-bearing** — the dynamic config *is* the resolved config.
- Both Maps keys are read from `process.env` **only**. No key is hardcoded anywhere in the project.
- A falsy/undefined key is a safe no-op for that platform (no Maps SDK injection for the platform
  without a key).

```ts
// shape only — NO VALUES
const mapsPlugin = [
  'react-native-maps',
  {
    androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY,
    iosGoogleMapsApiKey: process.env.GOOGLE_MAPS_IOS_API_KEY,
  },
];
```

---

## 2. Google Maps keys — current handling

| Platform | Injection | Value location |
|---|---|---|
| Android | `react-native-maps` config plugin writes `com.google.android.geo.API_KEY` meta-data into the **generated** manifest | `.env` → `app.config.ts` |
| iOS | `react-native-maps` config plugin writes `GMSApiKey` into the generated `Info.plist` + Google pod + Swift AppDelegate init | `.env` → `app.config.ts` |

**Generated native files are never edited by hand.** The `android/` / `ios/` directories are produced
by prebuild/EAS and are gitignored; the key reaches them only through the config plugin.

Prerequisites for the keys to work in a standalone build (all user/console actions, never in this repo):

- Maps SDK for Android **enabled** in Google Cloud — *needs external verification*.
- Maps SDK for iOS **enabled** in Google Cloud — *needs external verification*.
- Android key restricted to package `com.yamak.assist` **+ the signing SHA-1** (debug SHA-1 for dev,
  Play App Signing SHA-1 for production — the debug SHA-1 becomes available only after the first
  successful debug build). *Pending.*
- iOS key restricted to bundle id `com.yamak.assist`. *Needs external verification.*

---

## 3. PLANNED / NOT YET MIGRATED

These legacy requirements still exist as **capabilities** and must be preserved as requirements —
but nothing is configured in `YamakExpoNew` yet. Do **not** delete them; do **not** assume they are
done. Marked **PLANNED / NOT YET MIGRATED**.

| Item | Variable / file names (no values) | Status | Notes |
|---|---|---|---|
| **Firebase** — Android config | `google-services.json` | **PLANNED / NOT YET MIGRATED** | Regenerate for the NEW applicationId `com.yamak.assist` (never the legacy flavors). |
| **Firebase** — iOS config | `GoogleService-Info.plist` | **PLANNED / NOT YET MIGRATED** | Regenerate for bundle id `com.yamak.assist`. |
| **FCM push** | push-token field name `fcmToken` vs `notificationToken` (unconfirmed) | **PLANNED / NOT YET MIGRATED** | Topic `yamak-all` in legacy. Field name must be confirmed against the backend. |
| **Google Sign-In** | `GOOGLE_EXPO_CLIENT_ID` (Android) / `IOS_CLIENT_ID` (iOS) / `WEB_CLIENT_ID` (server) — legacy names `ANDROID_CLIENT_ID`, `IOS_CLIENT_ID`, `WEB_CLIENT_ID` | **PLANNED / NOT YET MIGRATED** | In Expo the client ids are Expo config (`app.json` `ios.config.googleServicesFile`, Android `android.googleServicesFile`, plus `expo-auth-session` / config plugin). Names must be re-confirmed at implementation time. |
| **Apple Sign-In** | iOS entitlement + Apple team credentials | **PLANNED / NOT YET MIGRATED** | iOS only. |
| **Sentry** | `SENTRY_DSN` | **PLANNED / NOT YET MIGRATED** | Legacy read it via `react-native-config`; Expo equivalent is build-time config (config plugin or `app.config.ts`). DSN from Sentry project settings. |
| **Freshchat** | `FRESHCHAT_APPI_ID`, `FRESHCHAT_APP_KEY` | **PLANNED / NOT YET MIGRATED** | Freshchat dashboard. Note the legacy variable name typo (`APPI`). |
| **Alternate app icons** | legacy `Ramadan_AppIcon`, `defualt_AppIcon` (typo) | **PLANNED / NOT YET MIGRATED** | Expo equivalent decided at implementation time. |
| **Deep links** | legacy `yamak://`, `https://yamak-kw.com`, `https://yamak.page.link.com` | **PLANNED / NOT YET MIGRATED** | Current scheme is `yamakexponew`; the share link `yamak.page.link/app` is used by Vehicle Details share. |
| **Custom dev API-IP override** | legacy AsyncStorage key `environment` | ⛔ NOT TO REBUILD | Legacy dev-only workaround (BR-060). Do not port. |

### 3.1 Legacy client-ID behaviour notes (historical, still applicable)

- Google client IDs are semi-public (embedded in builds) but should still be managed via env/config,
  **not** hardcoded in source. Never paste them into issues/PRs/docs.
- The web/server client ID is used by the backend for token verification — keep mobile and backend
  in sync.

---

## 4. App signing (current position)

| Item | Legacy position | Action for the Expo rebuild |
|---|---|---|
| Android debug keystore | `android/app/debug.keystore` (password `android`) | Expo/Gradle auto-generates `~/.android/debug.keystore`; fine for dev. Debug SHA-1 needed to restrict the Maps key. |
| Android RELEASE keystore | **none — legacy ships release with the debug keystore** | ⚠️ **MUST create a real release keystore** and store alias/passwords in a secret manager. Never in the repo. Never sign release with the debug keystore. |
| iOS signing identity | Xcode account | Own Apple Developer team credentials. |
| Apple Sign-In entitlement | `ios/Yamak/*.entitlements` | Re-enable when social auth is migrated. |

---

## 5. Migration procedure (at rebuild time)

1. Copy variable **NAMES** into a new local `.env` in `YamakExpoNew`; paste **values** locally from
   the owning consoles / password manager (never into git, never into docs).
2. Confirm `.env` is gitignored and `.env.example` contains **names only**.
3. Maps keys flow through `.env` → `app.config.ts` → `react-native-maps` plugin → generated native
   project. Never edit the generated `android/` / `ios/` files.
4. For Firebase / FCM / social / Sentry / Freshchat: regenerate or create each artifact for
   `com.yamak.assist` / `com.yamak.assist` in the owning console **before** wiring it, then wire it
   through the documented Expo config mechanism and mark the item migrated here.
5. Create the release keystore; store it securely; configure release signing (EAS credentials or a
   managed keystore) — never commit it.
6. Verify no key value is referenced anywhere in `docs/`.

---

## 6. Guardrail for this documentation set

- `01-project-inventory.md`, `08-environment-and-config.md`, and this file reference variable
  **NAMES** and **FILE PATHS** only. If any VALUE appears, treat it as an error and redact.
- All key *values* in this project live only in the machine-local, gitignored `.env`.
- Logs, screenshots, and verification artifacts must never capture a key value. Masked fragments
  only (e.g. a truncated prefix) — never a full key.