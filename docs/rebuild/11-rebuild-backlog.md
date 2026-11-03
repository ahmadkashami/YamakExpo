# YAMAK MOBILE — 11. REBUILD BACKLOG (MASTER TASK LIST)

> ⚠️ **Current platform:** `YamakExpoNew` — **Expo + React Native + TypeScript + Expo Router**.
> `YamakMobileNew` (React Native CLI) is **superseded**. Legacy `yamak-mobile` is the **functional /
> business reference only** — see `REBUILD-PLAN.md` §0 (source-of-truth hierarchy) and §2.
>
> Every task maps to evidence in `02-screen-inventory.md`, `04-api-catalog.md`, `06-authentication.md`,
> `09-business-rules.md`. Priorities: P0 (required, unlocks app), P1 (required), P2 (nice-to-have),
> P3 (legacy/stub — decide later).
>
> **Status refreshed 2026-11-03 — this file is a SUPPORTING task ledger, not the plan.**
> Current execution order and the single next step live in `REBUILD-PLAN.md` §5–§6; verified state
> lives in `PROJECT_CONTEXT.md`. `12-rebuild-order.md` is HISTORICAL / SUPERSEDED.
> Historical task IDs are preserved so completed work is never erased. Where this file states a
> status, that status is a snapshot of the evidence, not an instruction to sequence work from it.

---

## 0. Implementation status legend

| Status | Meaning |
|---|---|
| ✅ **DONE** | Implemented **and verified** in `YamakExpoNew` (see `PROJECT_CONTEXT.md`) |
| 🟡 **PARTIAL** | Something exists but the task is not complete |
| ⏳ **TODO** | Not started |
| ⏭ **SUPERSEDED** | Replaced by a different architecture/approach — kept for history, **do not execute** |
| ❌ **SKIP** | Deliberately not rebuilt |

---

## 1. FOUNDATION tasks (Expo — replaces the CLI SETUP-* series)

| ID | Task | Priority | Depends | Status | Notes |
|---|---|---|---|---|---|
| EXPO-FOUND-001 | Expo project (from `create-expo-app`) with Expo Router | P0 | — | ✅ **DONE** | `YamakExpoNew` is the active project |
| EXPO-FOUND-002 | Static Expo config: `app.json` (name, slug, icons, scheme, plugins, permissions) | P0 | FOUND-001 | ✅ **DONE** | `expo-router`, `expo-splash-screen`, `expo-secure-store`, `expo-location` plugins |
| EXPO-FOUND-003 | Application identifiers `com.yamak.assist` (Android + iOS) | P0 | FOUND-002 | ✅ **DONE** | Legacy `mobapp`/`mobstaging`/`mobdev` NOT reused |
| EXPO-FOUND-004 | Design tokens (`src/theme/*`: colors, spacing, radius, typography, interaction) | P0 | FOUND-001 | ✅ **DONE** | Approved token set, single palette |
| EXPO-FOUND-005 | Shared `fetch` HTTP client + typed `ApiError` sanitizer | P0 | FOUND-001 | ✅ **DONE** | `src/api/http-client.ts`, `api-error.ts`; Bearer read from SecureStore |
| EXPO-FOUND-006 | Auth Context + SecureStore session persistence | P0 | FOUND-005 | ✅ **DONE** | `yamak_access_token` + `yamak_auth_user` |
| EXPO-FOUND-007 | Auth-restore loading gate (splash held until session resolves) | P0 | FOUND-006 | ✅ **DONE** | `src/app/_layout.tsx` |
| EXPO-FOUND-008 | Dynamic Expo config `app.config.ts` (env-driven native config) | P0 | FOUND-002 | ✅ **DONE** | Adds the `react-native-maps` plugin from env vars; spreads `app.json` |
| EXPO-FOUND-009 | `.env` + `.env.example` (`EXPO_PUBLIC_API_URL`) | P0 | FOUND-001 | ✅ **DONE** | `.env` gitignored; no values in docs |
| EXPO-FOUND-010 | Brand assets (logo) | P1 | FOUND-001 | ✅ **DONE** | `assets/images/appLogo.png` migrated from the CLI project |
| EXPO-FOUND-011 | i18n system (EN/AR + RTL) | P0 | FOUND-004 | ⏳ **TODO** | Required for EN/AR parity; not yet built. `Service.name` is `{en,ar}`; list components take a `language` prop meanwhile |
| EXPO-FOUND-012 | Shared UI kit (icons wrapper, text, inputs, buttons, screen container, skeletons, modal) | P1 | FOUND-004 | 🟡 **PARTIAL** | Screen-specific blocks exist under `src/components/*`; a shared kit is not yet extracted |

### 1.1 Historical CLI SETUP tasks — SUPERSEDED (do not execute)

> ⛔ Retained for history. These described a **React Native CLI** project and are replaced by §1.

| ID | Historical task | Status | Superseded by |
|---|---|---|---|
| YAMAK-SETUP-001 | Create bare React Native TypeScript project (RN CLI) | ⏭ **SUPERSEDED** | EXPO-FOUND-001 |
| YAMAK-SETUP-002 | `.env*` + `react-native-config` + Gradle flavors | ⏭ **SUPERSEDED** | EXPO-FOUND-008 + §3 env |
| YAMAK-SETUP-003 | Design tokens (legacy `Colors.ts`/`Sizes.ts`/`fonts.ts`) | ✅ realized as `src/theme/*` | EXPO-FOUND-004 |
| YAMAK-SETUP-004 | Copy brand assets | ✅ done (logo) | EXPO-FOUND-010 |
| YAMAK-SETUP-005 | i18n (i18next + `lang` key) | ⏳ still needed, tech undecided | EXPO-FOUND-011 |
| YAMAK-SETUP-006 | `axios.config.ts` client + NetInfo guard | ⏭ **SUPERSEDED** | EXPO-FOUND-005 (fetch client) |
| YAMAK-SETUP-007 | Zustand auth store (AsyncStorage `auth`) + `RootFun` gate | ⏭ **SUPERSEDED** | EXPO-FOUND-006 + EXPO-FOUND-007 (SecureStore + Context) |
| YAMAK-SETUP-008 | `NavigationContainer` + `AuthStackNavigator` | ⏭ **SUPERSEDED** | Expo Router file-based routes |
| YAMAK-SETUP-009 | Global error toast (`useErrorStore` + `AppFlashMessage`) | ⏳ **TODO** | Equivalent still needed |
| YAMAK-SETUP-010 | `DrawerStackNavigator` + `isLunched` onboarding flag | ⏭ **SUPERSEDED** (architecture) | Phase A3 onboarding gate |
| YAMAK-SETUP-011 | `TabNavigator` + `CustomDrawerContent` | ⏭ **SUPERSEDED** (architecture) | Phase A5 Expo Router `Tabs` (+ drawer if parity requires) |
| YAMAK-SETUP-012 | Splash screen + display name/branding | ✅ **DONE** | `expo-splash-screen` + `app.json` |

---

## 2. APP SHELL tasks — ✅ PHASE A CLOSED (status refreshed 2026-11-03)

> Phase A (A1–A7) is **CLOSED**. The rows below keep their historical IDs and now carry the closure
> status. Do not re-open Phase A work.

| ID | Phase | Task | Priority | Depends | Status |
|---|---|---|---|---|---|
| SHELL-001 | A1 | **Session gate for the `(app)` group** (`src/app/(app)/_layout.tsx`) | P0 | FOUND-007 | ✅ **DONE** — delivered & runtime-verified 2026-10-02 (also gated `index.tsx` + `register.tsx`) |
| SHELL-002 | A2 | Natural **Email OTP → authenticated shell** transition | P0 | SHELL-001 | ✅ **DONE** — delivered & runtime-verified 2026-10-02 (no dead end) |
| SHELL-003 | — | Authenticated Expo Router layout (hosts shared providers) | P0 | SHELL-001 | ✅ **DONE** — `(app)/_layout.tsx` hosts `UserLocationProvider` + tabs + drawer |
| SHELL-005 | A3 | **Home tab route** `(app)/(tabs)/home.tsx` — mounts the four verified sections | P0 | SHELL-001 | ✅ **DONE** |
| SHELL-007 | A4 | **Profile Hub tab** + **logout** | P0 | SHELL-001 | ✅ **DONE** |
| SHELL-009 | A5 | Bottom-tabs layout `(app)/(tabs)/_layout.tsx` | P0 | SHELL-005, SHELL-007 | ✅ **DONE** |
| SHELL-006 | A5 | Bottom tabs: **Map** | P0 | SHELL-009 | ✅ **DONE** |
| SHELL-010 | B1 (old) | Wire the Map app-bar ☰ Menu / 🔔 Notifications buttons | P2 | SHELL-009, YAMAK-SCREEN-015 | ☰ **DONE** via A7 drawer; 🔔 **moved to B7 Notifications** (still inert today) |
| SHELL-004 | A6 | First-launch **Onboarding** gate (shows once, **inside** the authenticated area) | P0 | SHELL-009 | ✅ **DONE** — backend-managed, runtime-verified (A6.2–A6.5) |
| SHELL-008 | A7 | Drawer / side menu | P1 | SHELL-009 | ✅ **DONE** — approved UI, runtime-verified (A7.2–A7.8) |

> **Historical dependency rules — all satisfied by the Phase A closure.** They are kept because they
> explain why the order was safe (no route under `(app)` before SHELL-001; Profile Hub before the
> profile extensions; tabs only after all three destinations existed).
> **Current dependency rules:** `REBUILD-PLAN.md` §5.7.

---

## 3. AUTHENTICATION tasks (YAMAK-SCREEN-00x)

| ID | Task | Priority | Depends | APIs | Screen | Status |
|---|---|---|---|---|---|---|
| YAMAK-SCREEN-002 | Register screen (name/email/phone/terms + signup) | P0 | FOUND-006 | `auth/signup` | register | ✅ **DONE** |
| YAMAK-SCREEN-005 | Email OTP verification (after signup) | P0 | 002, SHELL-002 | `auth/verify-email` | email-otp | 🟡 **PARTIAL** — UI + verification done; **does not enter the authenticated shell** |
| YAMAK-SCREEN-001 | Login screen (email+password, validation, submit, token persist) | P0 | SHELL-003 | `auth/login` | login | ⏳ **TODO — DEFERRED (B10 Remaining Auth/Integrations)** |
| YAMAK-SCREEN-003 | Phone login (number + country code) | P0 | SHELL-003 | `auth/sendCode` | auth (phone) | ⏳ **TODO — DEFERRED (B10)** |
| YAMAK-SCREEN-004 | Phone OTP verification + resend | P0 | 003 | `auth/checkCode`, `app-users/profile` | otpVerification | ⏳ **TODO — DEFERRED (B10)** |
| YAMAK-SCREEN-006 | Reset-password OTP | P0 | 008 | `auth/check-reset-password` | resetOtp | ⏳ **TODO — DEFERRED (B10)** |
| YAMAK-SCREEN-007 | New password (confirm match) | P0 | 006 | `auth/reset-password` | newPassword | ⏳ **TODO — DEFERRED (B10)** |
| YAMAK-SCREEN-008 | Forgot-password email form | P0 | 001 | `auth/send-reset-password` | forgotPassword | ⏳ **TODO — DEFERRED (B10)** |
| — | Social login buttons (Google / Apple) | P1 | NATIVE-001/002 | `auth/login-social` | — | ⏳ **TODO — DEFERRED (B10)** |

---

## 4. DATA / SCREEN tasks (main app)

| ID | Task | Priority | Depends | APIs | Screen | Status |
|---|---|---|---|---|---|---|
| YAMAK-SCREEN-010a | Services section (`GET /services`, localized names, selection) | P0 | FOUND-005 | `services` | — | ✅ **DONE** |
| YAMAK-SCREEN-010b | Adds carousel (`GET /adds`, external link open) | P0 | FOUND-005 | `adds` | — | ✅ **DONE** |
| YAMAK-SCREEN-010c | Location-aware vehicles (`GET /vehicles`, Haversine km) | P0 | FOUND-011 (location) | `vehicles` | — | ✅ **DONE** |
| YAMAK-SCREEN-010d | Approved Home radar card / ViewMap CTA → `/map` | P1 | MAP-001 | — | — | ✅ **DONE** |
| YAMAK-SCREEN-010 | **Home screen assembly** (header + all four sections) | P0 | 010a/b/c/d, SHELL-005 | `services`,`adds`,`vehicles` | Home | ✅ **DONE** — Phase A3 |
| YAMAK-SCREEN-011 | All vehicles list (pagination, filters, search) | P1 | YAMAK-SCREEN-010 | `vehicles` | AllVehicles | ✅ **DONE** — **B1 CLOSED**, commit `50e9c67` |
| YAMAK-SCREEN-012a | Vehicle Details screen (image, provider, services, safety, other vehicles, contact) | P0 | FOUND-005 | `vehicles/:id` | `/vehicle/[id]` | ✅ **DONE** |
| YAMAK-SCREEN-012b | Vehicle Details **request flow** — services picker + **`POST /api/mobile/v1/requests`** | P0 | 012a, SHELL-003 (auth decision) | `requests` | — | ✅ **DONE** — **B2.3**, commit `253dc04`; idempotency + 409 in B2.4C. **Coordinates/channel/lifecycle are now mandatory and NOT yet implemented → B2.5B–D** (see `REQ-DEC-001…012`) |
| YAMAK-SCREEN-013 | Map screen (markers, service chips, distance, controls, marker → details) | P1 | FOUND-011 | `services/{id}/vehicles` | Map | ✅ **DONE** |
| YAMAK-SCREEN-016 | **Profile hub** (user info + menu + logout) | P0 | SHELL-001, SHELL-007 | `app-users/profile` | Profile | ✅ **DONE** — Phase A4 |
| YAMAK-SCREEN-017 | Edit profile (form + map location + save) | P1 | YAMAK-SCREEN-016 ✅ | `app-users/profile` (PATCH) | EditProfile | ⏳ **TODO (B4)** |
| YAMAK-SCREEN-018 | My cars (list/add/delete) | P1 | YAMAK-SCREEN-016 ✅ | `user-cars` | MyCar | ⏳ **TODO (B5)** |
| YAMAK-SCREEN-014 | Favorites (local ids, cards, empty state) | P1 | YAMAK-SCREEN-016 ✅ | — (local) | Favorites | ⏳ **TODO — B6** — no backend favorites routes exist |
| YAMAK-SCREEN-015 | Notifications (paginated list) | P1 | YAMAK-SCREEN-016 ✅ | `user-notifications/mine` | Notifications | ⏳ **TODO — B7** — read side + FCM together |
| YAMAK-SCREEN-009 | Onboarding (carousel, language picker, first-launch gate) | P0 | SHELL-009 | `app-setting` (opt) | Onboarding | ✅ **DONE** — Phase A6 (backend-managed, runtime-verified) |

---

## 5. SECONDARY tasks

| ID | Task | Priority | Depends | Status |
|---|---|---|---|---|
| YAMAK-SCREEN-020 | Privacy & policy | P1 | YAMAK-SCREEN-016 ✅ | ⏳ **TODO (B8)** |
| YAMAK-SCREEN-019 | Contact us (phone/mail/WhatsApp) | P1 | YAMAK-SCREEN-016 ✅ | ⏳ **TODO (B8)** |
| YAMAK-SCREEN-021 | Join us | P2 | YAMAK-SCREEN-016 ✅ | ⏳ **TODO (B8)** |
| YAMAK-SCREEN-024 | No-network screen + retry | P1 | FOUND-005 | ⏳ **TODO (B9)** |
| YAMAK-SCREEN-023 | Freshchat support chat | P2 | NATIVE-006, YAMAK-SCREEN-016 ✅ | ⏳ **TODO (B10)** — Freshchat **NOT YET MIGRATED** |
| YAMAK-SCREEN-022 | About Yamak app | P3 | YAMAK-SCREEN-016 | ⏭ **PLANNED ONLY** — user directive: do not implement |
| YAMAK-SCREEN-025 | Settings (legacy stub) | P3 | YAMAK-SCREEN-016 | ⏳ optional |
| YAMAK-SCREEN-026 | Messages (legacy stub) | P3 | YAMAK-SCREEN-016 | ⏳ optional |
| YAMAK-SCREEN-027 | Search (legacy stub → full) | P3 | YAMAK-SCREEN-010 | ⏳ optional |
| YAMAK-SCREEN-028 | Email validations (legacy stub) | P3 | YAMAK-SCREEN-002 | ⏳ optional |
| YAMAK-SCREEN-029 | Form / FormAuth | P3 | — | ❌ **SKIP** — legacy duplicates |
| YAMAK-SCREEN-030 | **Legacy parity audit** — compare every legacy screen/route/action/API/rule | P0 | all above | ⏳ **TODO (B11)** |

---

## 6. NATIVE / INTEGRATION tasks (YAMAK-NATIVE-*)

| ID | Task | Priority | Depends | Status | Notes |
|---|---|---|---|---|---|
| YAMAK-NATIVE-011 | `react-native-maps` dependency | P0 | — | ✅ **DONE** | `1.28.2` (intentional override; SDK 57 pins 1.27.2) |
| YAMAK-NATIVE-012 | `react-native-maps` config plugin + Maps keys via `app.config.ts` | P0 | — | ✅ **DONE** | Keys **PLANNED / NOT YET MIGRATED** for the other integrations |
| YAMAK-NATIVE-013 | Google basemap verified on a native **Development Build** | P0 | — | ✅ **DONE** | Android dev build verified |
| YAMAK-NATIVE-014 | `expo-location` + location permissions | P0 | — | ✅ **DONE** | Single shared provider |
| YAMAK-NATIVE-003 | Firebase config (`google-services.json` / `GoogleService-Info.plist`) | P0 | FOUND-003 | ⏳ **PLANNED / NOT YET MIGRATED** | Regenerate for `com.yamak.assist` |
| YAMAK-NATIVE-004 | FCM push (foreground/background/quit + topic + token → profile) | P1 | NATIVE-003, SHELL-003 | ⏳ **PLANNED / NOT YET MIGRATED — B7** | Confirm token field name with the backend |
| YAMAK-NATIVE-001 | Google Sign-In | P1 | — | ⏳ **PLANNED / NOT YET MIGRATED — B10** | Expo config mechanism |
| YAMAK-NATIVE-002 | Apple Sign-In (iOS) | P1 | — | ⏳ **PLANNED / NOT YET MIGRATED — B10** | Expo config mechanism |
| YAMAK-NATIVE-006 | Freshchat SDK init | P2 | — | ⏳ **PLANNED / NOT YET MIGRATED — B10** | |
| YAMAK-NATIVE-007 | Sentry | P2 | — | ⏳ **PLANNED / NOT YET MIGRATED — B10** | |
| YAMAK-NATIVE-008 | Alternate app icons | P2 | — | ⏳ **TODO — B10** | |
| YAMAK-NATIVE-009 | Deep links (`yamak.page.link` share link + scheme) | P1 | SHELL-003 | ⏳ **TODO — B10** | Vehicle Details share uses `yamak.page.link/app` |
| YAMAK-NATIVE-010 | Icon/font linking | P0 | — | ⏭ **SUPERSEDED** | Expo/vector-icons handles this |

---

## 7. Cross-cutting (YAMAK-UI-*)

| ID | Task | Priority | Depends | Status |
|---|---|---|---|---|
| YAMAK-UI-002 | Localized text component (EN/AR, RTL-correct) | P0 | EXPO-FOUND-011 | ⏳ **TODO** — blocked on i18n |
| YAMAK-UI-003 | Text input + validation error display | P0 | EXPO-FOUND-011 | 🟡 **PARTIAL** — auth inputs exist; not yet a shared component |
| YAMAK-UI-004 | Buttons + pressable wrapper | P0 | EXPO-FOUND-004 | 🟡 **PARTIAL** — screen-local |
| YAMAK-UI-005 | Screen container (safe area + keyboard) | P0 | EXPO-FOUND-004 | 🟡 **PARTIAL** — screen-local |
| YAMAK-UI-006 | Loading + skeleton placeholders | P1 | EXPO-FOUND-004 | ✅ **DONE** — block-skeleton pattern in use |
| YAMAK-UI-007 | Modal / bottom-sheet wrappers | P1 | — | ⏳ **TODO** |
| YAMAK-UI-008 | Favorites heart control on cards | P1 | YAMAK-SCREEN-014 | ⏳ **TODO** |
| YAMAK-UI-001 | Icon wrapper (vector icons) | P0 | EXPO-FOUND-004 | ✅ **DONE** — `react-native-svg` icon components in use |

---

## 8. Housekeeping (not product work)

| ID | Task | Status |
|---|---|---|
| HS-001 | Remove unused `create-expo-app` template leftovers (`app-tabs*`, `animated-icon*`, `web-badge`, `external-link`, `hint-row`, `ui/collapsible`, `themed-text`, `themed-view`, `use-color-scheme*`, `constants/theme.ts`) | ⏳ **TODO** |
| HS-002 | Remove the pre-existing `src/components/app-tabs.web.tsx(27,38)` `"/explore"` TS error | ⏳ **TODO** — reported separately, deliberately not fixed as a side effect |
| HS-003 | Rotate/restrict the legacy committed Google Maps keys; strip them from the legacy repo | ⏳ **TODO** — separate repo; user action |
| HS-004 | Purge the stray dev `requests` row created by a no-auth probe | ⏳ **TODO** — user decision |

---

## 9. Totals (snapshot 2026-11-03)

- Foundation tasks: 12
- App shell tasks: 8
- Auth screen tasks: 8 (+ social)
- Data/screen tasks: 15
- Secondary/stub tasks: 11
- Native/integration tasks: 14
- Cross-cutting UI tasks: 8
- Housekeeping: 4
- **Total: ~80 tracked tasks**

> Status counts: Foundation 10 done / 2 partial; App shell 8 done / 1 partially superseded
> (🔔 folded into B7); Data/screens: Home, All Vehicles, Vehicle Details, request flow, Map,
> Profile Hub, Onboarding done — the B2 request-tracking extension and B3 My Requests remain open.
> This ledger is **not** a progress authority; `PROJECT_CONTEXT.md` is.

> Remaining P3 / SKIP items (Settings, Messages, Search, EmailValidations, Form/FormAuth, custom-IP
> modal) require a user decision during the rebuild; default = optional or skip.