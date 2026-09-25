# YAMAK MOBILE — 11. REBUILD BACKLOG (MASTER TASK LIST)

> Every task maps to evidence in `02-screen-inventory.md`, `04-api-catalog.md`, `06-authentication.md`,
> `09-business-rules.md`. Priorities: P0 (required, unlocks app), P1 (required), P2 (nice-to-have), P3 (legacy/stub — decide later).
> Status default: `Not started`. This file feeds `13-SCREEN-BY-SCREEN-REBUILD-PLAN.md` and `yamak-rebuild-notion-import.csv`.
> Do NOT start implementation — this is planning only.

---

## 1. SETUP tasks (YAMAK-SETUP-*)

| ID | Task | Priority | Depends | Status |
|---|---|---|---|---|
| YAMAK-SETUP-001 | Create bare React Native TypeScript project (RN CLI), app name `Yamak` | P0 | — | Not started |
| YAMAK-SETUP-002 | Add `.env`, `.env.development`, `.env.staging`, `.env.production` + `react-native-config`; flavor→env mapping (Android) | P0 | 001 | Not started |
| YAMAK-SETUP-003 | Design tokens: `Colors.ts` (AppColorsTheme2), `Sizes.ts`, `fonts.ts` | P0 | 001 | Not started |
| YAMAK-SETUP-004 | Copy brand assets: logo, images, Lottie files, Roboto fonts; verify render | P0 | 003 | Not started |
| YAMAK-SETUP-005 | i18n: i18next + `en.json`/`ar.json`, language store, `lang` AsyncStorage key | P0 | 001 | Not started |
| YAMAK-SETUP-006 | HTTP client: `axios.config.ts` (base URL, Bearer interceptor, NetInfo offline guard) | P0 | 002 | Not started |
| YAMAK-SETUP-007 | Auth store: Zustand `auth` persist (AsyncStorage `auth`) + `RootFun` token gate | P0 | 006 | Not started |
| YAMAK-SETUP-008 | Navigation root: `NavigationContainer` + `AuthStackNavigator` + `App.tsx` wiring | P0 | 007 | Not started |
| YAMAK-SETUP-009 | Global error toast: `useErrorStore` + `AppFlashMessage` | P1 | 006 | Not started |
| YAMAK-SETUP-010 | Drawer root: `DrawerStackNavigator` + onboarding flag (`isLunched`) | P0 | 008 | Not started |
| YAMAK-SETUP-011 | Tab bar: `TabNavigator` (Home/Map/Profile) + `CustomDrawerContent` | P0 | 010 | Not started |
| YAMAK-SETUP-012 | Splash screen + app display name/branding (android/iOS) | P1 | 001 | Not started |

## 2. SCREEN tasks (YAMAK-SCREEN-*)

Core auth flow (P0):

| ID | Task | Priority | Depends | APIs | Screen |
|---|---|---|---|---|---|
| YAMAK-SCREEN-001 | **Login screen** (email+password, validation, submit, error handling, token persist) | P0 | SETUP-007/008 | `auth/login` | login |
| YAMAK-SCREEN-002 | Register screen (name/email/phone/terms + submit) | P0 | 001 | `auth/signup` | register |
| YAMAK-SCREEN-003 | Phone login screen (number + country code) | P0 | 001 | `auth/sendCode` | auth (phone) |
| YAMAK-SCREEN-004 | Phone OTP verification + resend | P0 | 003 | `auth/checkCode` | otpVerification |
| YAMAK-SCREEN-005 | Email OTP verification (after signup) | P0 | 002 | `auth/verify-email` | otpEmailVerification |
| YAMAK-SCREEN-006 | Reset-password OTP | P0 | 001 | `auth/check-reset-password` | otpResetPassword |
| YAMAK-SCREEN-007 | New-password screen (confirm match) | P0 | 006 | `auth/reset-password` | NewPassword |
| YAMAK-SCREEN-008 | Forgot-password email form | P0 | 001 | `auth/send-reset-password` | Login (EmailForgotPassword) |

Main app (P0/P1):

| ID | Task | Priority | Depends | APIs | Screen |
|---|---|---|---|---|---|
| YAMAK-SCREEN-009 | Onboarding screen (carousel, language picker, first-launch gate) | P0 | SETUP-010 | `app-setting` (opt) | OnBoarding |
| YAMAK-SCREEN-010 | Home screen (services, adds, vehicles, search bar, header logo) | P0 | SETUP-011 | `services`, `adds`, `vehicles` | Home |
| YAMAK-SCREEN-011 | All vehicles list (pagination, filters, search) | P1 | 010 | `vehicles` | AllViceless |
| YAMAK-SCREEN-012 | Vehicle/Provider detail (info, services, request CTA, share) | P0 | 010 | `vehicles/:id`, `services/:id/vehicles`, `requests` | VehicleDetails |
| YAMAK-SCREEN-013 | Map screen (markers, service filter, card detail, user location) | P1 | 010 | `vehicles` (location) | Map |
| YAMAK-SCREEN-014 | Favorites (local ids, cards, empty state) | P1 | 010 | — (local) | Favorites |
| YAMAK-SCREEN-015 | Notifications list (paginated) | P1 | SETUP-012 | `user-notifications/mine` | Notifications |
| YAMAK-SCREEN-016 | Profile hub (header, menu buttons, profile load) | P0 | SETUP-011 | `app-users/profile` | Profile |
| YAMAK-SCREEN-017 | Edit profile (form + map location) | P1 | 016 | `app-users/profile` (PATCH) | EditProfile |
| YAMAK-SCREEN-018 | My cars (list/add/delete) | P1 | 016 | `user-cars` | MyCar |
| YAMAK-SCREEN-019 | Contact us (phone/mail/WhatsApp) | P1 | 016 | — | ContactUs |
| YAMAK-SCREEN-020 | Privacy & policy (modal) | P1 | 016 | `app-setting` (opt) | PrivacyAndPolicy |
| YAMAK-SCREEN-021 | Join us | P2 | 016 | — | JoinUs |
| YAMAK-SCREEN-022 | About Yamak app | P3 — PLANNED ONLY (user directive: do not implement Login or About Us implementation in this pass) | 016 | — (static) | AboutYamakApp |
| YAMAK-SCREEN-023 | Freshchat support chat (SDK) | P2 | NATIVE-006 | — | FreshChat |
| YAMAK-SCREEN-024 | No-network screen + retry | P1 | 009 | — | NoNetwork |

Stubs / legacy (P3 — decide later, mark optional):

| ID | Task | Priority | Depends | Status |
|---|---|---|---|---|
| YAMAK-SCREEN-025 | Settings screen (currently stub) | P3 | 016 | Not started (optional) |
| YAMAK-SCREEN-026 | Messages screen (currently stub) | P3 | 016 | Not started (optional) |
| YAMAK-SCREEN-027 | Search screen (stub → full design) | P3 | 010 | Not started (optional) |
| YAMAK-SCREEN-028 | Email validations screen (stub) | P3 | 002 | Not started (optional) |
| YAMAK-SCREEN-029 | Form / FormAuth legacy screens | P3 | — | SKIP — legacy/duplicate |
| — | Social login buttons on Login/Register | P1 | NATIVE-001/002 | part of 001/002 steps |

## 3. NATIVE tasks (YAMAK-NATIVE-*)

| ID | Task | Priority | Depends |
|---|---|---|---|
| YAMAK-NATIVE-001 | Google Sign-In setup (client ids from `.env`, URL scheme iOS, manifest) | P1 | SETUP-002 |
| YAMAK-NATIVE-002 | Apple Sign-In setup (iOS entitlement + invertase package) | P1 | — |
| YAMAK-NATIVE-003 | Firebase: `google-services.json` / `GoogleService-Info.plist`, app + messaging; flavors aligned | P0 | SETUP-002 |
| YAMAK-NATIVE-004 | FCM push: `useNotification` (foreground/background/quit + topic `yamak-all`), token→profile | P1 | NATIVE-003 |
| YAMAK-NATIVE-005 | Google Maps SDK + Android `API_KEY` meta-data + iOS | P1 | — |
| YAMAK-NATIVE-006 | Freshchat SDK init (`FRESHCHAT_APPI_ID`, `FRESHCHAT_APP_KEY`) | P2 | SETUP-002 |
| YAMAK-NATIVE-007 | Sentry (`SENTRY_DSN` + gradle integration) | P2 | SETUP-002 |
| YAMAK-NATIVE-008 | Alternate app icons (`react-native-change-icon`; Ramadan + default) | P2 | — |
| YAMAK-NATIVE-009 | Deep links (`yamak://`, yamak-kw.com, yamak.page.link.com) | P3 | — |
| YAMAK-NATIVE-010 | vector-icons fonts + splash + Roboto fonts linking | P0 | — |

## 4. Cross-cutting (YAMAK-UI-*)

| ID | Task | Priority | Depends |
|---|---|---|---|
| YAMAK-UI-001 | `AppIcon` wrapper (vector-icons) | P0 | SETUP-003 |
| YAMAK-UI-002 | `AppText` (localized, Roboto) | P0 | SETUP-003/005 |
| YAMAK-UI-003 | `AppTextInput` + validation error display | P0 | SETUP-005 |
| YAMAK-UI-004 | Buttons (filled/outlined) + `Pressable` wrapper | P0 | SETUP-003 |
| YAMAK-UI-005 | `Screen` container + safe-area + keyboard wrapper | P0 | SETUP-003 |
| YAMAK-UI-006 | Loading (Lottie + simple loader) and placeholders | P1 | SETUP-004 |
| YAMAK-UI-007 | Modal/BottomSheet wrappers (promise-based modal context) | P1 | — |
| YAMAK-UI-008 | Favorites heart control on cards | P1 | SCREEN-014 |

## 5. Totals

- Setup tasks: 12
- Screen tasks: 29 (+social handled in 001/002)
- Native tasks: 10
- UI tasks: 8
- **Total: ~59 tasks**

> Remaining P3 / SKIP items (Settings, Messages, Search, EmailValidations, Form/FormAuth, custom-IP modal)
> require a user decision during rebuild; default = optional or skip.