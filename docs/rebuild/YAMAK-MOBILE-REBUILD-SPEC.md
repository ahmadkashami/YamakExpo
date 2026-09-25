# YAMAK MOBILE — REBUILD SPECIFICATION

> One-page reference of WHAT the rebuilt app must be. Applies to every task in the backlog.
> Backend stays as-is (`https://yamak-kw.com/api/mobile/v1/`). We rebuild the client only.

---

## 1. Product summary

Yamak is a Kuwait roadside-assistance marketplace app. Users find nearby service
providers (bansher/tyre, wench/tow, fix/repair, cleaning, general help), view their
details, request assistance, and contact support. Bilingual (EN/AR), location-aware,
with push notifications.

## 2. Non-negotiable requirements

1. **Bilingual EN/AR.** All user-facing strings via i18n; Arabic renders RTL correctly.
2. **Authentication** via backend token; persisted across restarts; all flows (email, phone OTP, social).
3. **Location** drives nearby-provider queries (lat/lng sent with `vehicles`).
4. **No invented backend.** Reuse every endpoint in `04-api-catalog.md` exactly.
5. **Brown project** (bare React Native, not Expo) with 3 Android flavors (dev/staging/prod).
6. **Security:** tokens only in secure storage; no secrets in code/docs; no debug keystore for release.

## 3. Feature list (priority)

- P0: Auth (login, register, phone OTP, reset), onboarding, home dashboard, vehicle details + request.
- P1: All vehicles, map, favorites, notifications, profile CRUD, my cars, contact/privacy.
- P2: freshchat, about, sentry, alternate icons.
- P3/optional: search, settings, messages (stubs in legacy).

## 4. Technical stack (target)

| Concern | Choice |
|---|---|
| Language | TypeScript |
| UI framework | React Native (bare) 0.8x, React 19, new architecture |
| Navigation | React Navigation v7 (stack/drawer/tabs) |
| State | Zustand v5 + AsyncStorage persist |
| API | Axios (+NetInfo offline guard) |
| Forms | Formik + Yup |
| i18n | i18next (en/ar) |
| Maps | react-native-maps |
| Push | Firebase messaging (FCM) |
| Social | Google Sign-In / Apple Sign-In |
| SDKs | Freshchat, Sentry |
| Icons | react-native-vector-icons |
| Animations | Lottie |
| Config | react-native-config per flavor |

## 5. Architecture rules (JUST-IN-TIME)

- One screen at a time; one small step at a time; STOP after every step.
- Add folders/stores/services/navigators only when the current screen needs them.
- Keep legacy deps/patterns as reference only; fix known defects (see `09` §H).

## 6. Delivery definition of done (per screen)

- Functions against the live backend with no invented params.
- Bilingual, responsive, loading/empty/error states present.
- Variable "STOP gate" verified after every step.
- No dead legacy code, no secrets, no debug leftovers.

## 7. Docs index (for reference while building)

`01` inventory · `02` screens · `03` navigation · `04` APIs · `05` data models ·
`06` auth · `07` assets · `08` env/config · `09` business rules · `10` user flows ·
`11` backlog · `12` order · `13` STEP-BY-STEP PLAN (primary work doc) · `14` readiness ·
`PROJECT-STRUCTURE-LEARNING` · `SECRETS-MIGRATION-CHECKLIST` · this spec · `notion-import.csv`.

## 8. Explicit out-of-scope

- Rebuilding or redesigning the backend.
- Porting legacy stubs (Form/FormAuth, custom-IP modal, duplicate store, old themes).
- Implementing Login or About Yamak App in this pass (user directive) — planned but deferred.
- Any implementation work at documentation time.