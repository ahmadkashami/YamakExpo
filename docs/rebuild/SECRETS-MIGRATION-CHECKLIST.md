# YAMAK MOBILE — SECRETS MIGRATION CHECKLIST

> SECURITY RULE: This file lists WHERE secrets/keys live and their VARIABLE NAMES.
> **No values are copied here.** When the rebuild configures these, the user must copy
> values from the legacy files (or from the owning consoles) directly into the NEW project —
> never into documentation.
> NEVER commit real values to the repo.

---

## 1. Environment secrets (`.env*` files in repo)

| Variable | Used by | Where value originates |
|---|---|---|
| `IOS_CLIENT_ID` | Google Sign-In iOS | Google Cloud Console (iOS client) |
| `ANDROID_CLIENT_ID` | Google Sign-In Android | Google Cloud Console (Android client) |
| `WEB_CLIENT_ID` | Google Sign-In server/web | Google Cloud Console (Web client) |
| `API_URL` | axios base URL | team backend (production `https://yamak-kw.com/api/mobile/v1/`) |
| `SENTRY_DSN` | Sentry init (`src/services/sentry/sentry.config.ts`) | Sentry project settings |
| `FRESHCHAT_APPI_ID` | Freshchat init (`src/services/freshchat/freshchat.config.ts`) | Freshchat dashboard |
| `FRESHCHAT_APP_KEY` | Freshchat init (same) | Freshchat dashboard |

> Values exist in: `.env`, `.env.development`, `.env.staging`, `.env.production`
> (Google ids + API URL are stored there). `SENTRY_DSN` / `FRESHCHAT_*` are consumed
> via `react-native-config` `Config.*` (exact env var names should be re-verified at rebuild time).

## 2. Firebase configuration (source of truth: Firebase console)

| File | Platform | Purpose |
|---|---|---|
| `google-services.json` | Android | FCM + Google Sign-In app config; **per flavor/package** (mobapp/mobstaging/mobdev) |
| `GoogleService-Info.plist` | iOS | Firebase iOS config |
| `firbease.json` (legacy file name typo at repo root) | repo | confirm/remove; NOT a config to copy |

Migration: regenerate for each Android applicationId + iOS bundle in the Firebase console.

## 3. Native API keys (values live in native files)

- Google Maps Android key → `<meta-data android:name="com.google.android.geo.API_KEY" android:value="AIza..."/>` in `android/app/src/main/AndroidManifest.xml`.
- Google Maps iOS key → `ios/Yamak/Info.plist` `GMSApiKey` (verify key name at rebuild).
- Google Sign-In iOS reverses-client URL scheme → `ios/Yamak/Info.plist` `URLSchemes`.

## 4. App signing

| Item | Location (legacy) | Action for rebuild |
|---|---|---|
| Android debug keystore | `android/app/debug.keystore` (password `android`) | regenerate per project; fine for dev |
| Android RELEASE keystore | **none — legacy ships release with debug keystore** | ⚠️ MUST create a real release keystore + store in secret manager; record alias/passwords there, not in repo |
| iOS signing identity | Xcode account | own team credentials |
| Apple Sign-In entitlement | `ios/Yamak/*.entitlements` | re-enable in new project |

## 5. Client IDs behaviour notes

- Google client IDs are semi-public (embedded in builds) but should still be managed via env vars,
  NOT hard-coded in source. Never paste them into issues/PRs/docs.
- `WEB_CLIENT_ID` is used by the backend for token verification — keep in sync between mobile and backend.

## 6. Migration procedure (for rebuild time)

1. Create new `.env*` in the NEW repo with the SAME variable names (copy values from OFF-repo password manager or the owning consoles; or from the legacy `.env*` files directly on your machine — not into git docs).
2. Add `.env*` to `.gitignore`.
3. Regenerate `google-services.json` per flavor; place in each flavor source set.
4. Add `GoogleService-Info.plist` to iOS.
5. Create release keystore; store securely; configure `signingConfigs.release`.
6. Add Sentry DSN + Freshchat keys into the right env files.
7. Verify no key is referenced by value anywhere in `docs/`.

## 7. Guardrail for this documentation set

- `01-project-inventory.md`, `08-environment-and-config.md`, and this file reference
  variable NAMES and FILE PATHS only. If any VALUE appears, treat it as an error and redact.