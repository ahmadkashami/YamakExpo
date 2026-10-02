# Yamak rebuild plan

## 0. MASTER SOURCE OF TRUTH HIERARCHY

> ⚠️ **Read this section first. When any two documents disagree, apply this order.**

| Rank | Source | Authoritative for |
|---|---|---|
| 1 | `PROJECT_CONTEXT.md` | **Verified current implementation state** of `YamakExpoNew`. What exists, what is verified, what is TODO. |
| 2 | `REBUILD-PLAN.md` (this file) + `12-rebuild-order.md` | **Current execution strategy** — what gets built next and in which order. |
| 3 | Legacy `yamak-mobile` repository | **Functional / business reference** — screens, flows, API contracts, validation, rules, assets/content, required native capabilities. |
| 4 | `docs/rebuild/01`–`11` legacy analysis | **Supporting reference** — reverse-engineered evidence about legacy behavior. Describes the OLD app; not a build instruction. |
| 5 | Current Expo / React Native official documentation | **Technical implementation authority** — how to build/configure on the current platform. |

**Conflict rule:** when documents conflict, **current verified `PROJECT_CONTEXT.md` plus explicit user decisions win.**

---

## 1. Active project

- **ACTIVE rebuild:** `D:\AALYASSIN\Projects\work\YamakProject\YamakExpoNew`
- **SUPERSEDED rebuild:** `D:\AALYASSIN\Projects\work\YamakProject\YamakMobileNew`
  (React Native CLI. Retained temporarily for rollback/migration review. **Not** the active target. Do not delete without explicit approval.)
- **LEGACY functional reference:** `D:\AALYASSIN\Projects\work\YamakProject\yamak-mobile`

`YamakExpoNew` is the **only** active rebuild project.

---

## 2. CURRENT ARCHITECTURE — AUTHORITATIVE

This is what Codex implements **today**. Nothing below is optional or "recommended" — it is the
current, already-shipped foundation.

| Concern | Current (AUTHORITATIVE) |
|---|---|
| Platform | **Expo** (SDK 57 line, `expo@~57.0.25`) — managed workflow + Continuous Native Generation |
| UI runtime | **React Native** `0.86.3` |
| Language | **TypeScript** (`~6.0.3`) |
| **Navigation** | **Expo Router** (`~57.0.23`) — file-based routing in `src/app/`, `typedRoutes: true` |
| State | **React Context** where already chosen (`src/auth/auth-context.tsx`, `src/location/location-context.tsx`) + hook-local state. No global store library. |
| Session storage | **expo-secure-store** (`SecureStore`) — keys `yamak_access_token`, `yamak_auth_user` |
| HTTP client | **`fetch`-based shared client** — `src/api/http-client.ts` (Bearer token read directly from SecureStore) |
| Error handling | `src/api/api-error.ts` — typed `ApiError` + message sanitizer |
| Maps | **`react-native-maps` (`1.28.2`)** via `PROVIDER_GOOGLE`, driven by the `react-native-maps` config plugin |
| Location | **`expo-location`** behind the single shared `UserLocationProvider` |
| Splash | `expo-splash-screen`, held by the auth-ready gate |
| Static config | `app.json` |
| Dynamic config | `app.config.ts` — re-emits `app.json` (spread) and adds the env-driven Maps plugin |
| Env | `.env` (gitignored) + `.env.example`; `EXPO_PUBLIC_*` for client-visible values |
| Application IDs | `android.package = com.yamak.assist`, `ios.bundleIdentifier = com.yamak.assist` |
| Icons/animation | `@expo/vector-icons` (via Expo), `react-native-svg`, `Animated` (no new deps without approval) |

### 2.1 Explicitly NOT part of the current architecture

These were legacy/CLI choices. They are **NOT** required, NOT to be introduced, and must not be
recreated "for fidelity":

- ❌ React Native CLI / bare RN project creation
- ❌ `NavigationContainer`, `createStackNavigator`, `createDrawerNavigator`, `createBottomTabNavigator` as the required architecture
- ❌ `DrawerNavigator` package architecture
- ❌ Zustand (legacy used it; the rebuild does not)
- ❌ Axios (legacy used it; the rebuild uses `fetch`)
- ❌ `react-native-config` (superseded by `app.config.ts` + `.env`)
- ❌ `ScreenNames.ts` route-name constants
- ❌ Android flavor plumbing (`com.yamak.mobapp` / `mobstaging` / `mobdev`) as a current requirement
- ❌ Release signing with the debug keystore
- ❌ Manually created/edited `ios/` or `android/` directories

These may appear **only** under headings marked **Historical CLI plan / Legacy implementation /
Superseded decision**.

---

## 3. THE MOST IMPORTANT RULE — LEGACY IS THE BEHAVIORAL SOURCE OF TRUTH

### Legacy `yamak-mobile` **IS** source of truth for:

- functionality and business behavior
- screens and screen composition
- user flows and navigation *behavior*
- API contracts (endpoints, params, envelopes, envelopes' quirks)
- validation rules
- assets, branding, and content/copy
- required native capabilities (Maps, notifications, chat, social sign-in)

### Legacy `yamak-mobile` is **NOT** source of truth for:

- package versions
- navigation implementation
- state-management library choice
- old React Native architecture
- deprecated native configuration
- obsolete workarounds (e.g. hardcoded localhost IPs, debug-keystore release builds, committed API keys)

> **Current Expo / React Native official documentation is the technical authority.**

**The goal is FUNCTIONAL PARITY with legacy Yamak — not identical architecture.**

---

## 4. CURRENT IMPLEMENTATION STATUS (verified)

> Only what is proven is recorded. Anything not listed here is NOT implemented.

### 4.1 FOUNDATION — DONE

| Item | Status |
|---|---|
| Expo migration complete (`YamakMobileNew` → `YamakExpoNew`) | ✅ DONE — see `EXPO-MIGRATION.md` |
| Expo Router active (file-based routes, typed routes) | ✅ DONE |
| Theme foundation implemented (`src/theme/*`: colors, spacing, radius, typography, interaction) | ✅ DONE |
| API client implemented (`src/api/http-client.ts`, `config.ts`, `api-error.ts`, feature modules) | ✅ DONE |
| SecureStore auth persistence implemented (`src/auth/auth-storage.ts`) | ✅ DONE |
| Auth restore loading gate (splash held until session status resolves) | ✅ DONE |
| App identifiers set (`com.yamak.assist` both platforms) | ✅ DONE |
| Dynamic config with env-driven Google Maps keys (`app.config.ts`) | ✅ DONE |

### 4.2 AUTH

| Item | Status |
|---|---|
| Register screen implemented | ✅ DONE |
| Email OTP UI + verification implemented | ✅ DONE |
| Authenticated session persistence exists | ✅ DONE (SecureStore) |
| Email OTP success → **complete authenticated shell** | ⚠️ **NOT YET — currently a dead end** (renders a success state, never enters the app shell) |

### 4.3 HOME

| Item | Status |
|---|---|
| Services section implemented (`GET /services`) | ✅ DONE |
| Adds carousel implemented (`GET /adds`) | ✅ DONE |
| Location-aware vehicles implemented (`GET /vehicles` + shared location provider) | ✅ DONE |
| Approved Home design work exists | ✅ DONE — `docs/rebuild/approve-ui/home/`, `ViewMap.tsx` radar card implemented |

> Home sections are built but **not yet mounted by an authenticated Home screen** — they belong to the authenticated shell (Phase A).

### 4.4 VEHICLE DETAILS

| Item | Status |
|---|---|
| Detail screen implemented (`/vehicle/[id]`) | ✅ DONE |
| Services read-only (chips) | ✅ DONE |
| Safety / contact content retained | ✅ DONE |
| Other vehicles retained | ✅ DONE |
| **`POST /requests`** | ⏳ **TODO** — deliberately deferred (backend/security decision pending) |

### 4.5 MAP — COMPLETE

| Item | Status |
|---|---|
| Approved Map implementation complete | ✅ DONE |
| Native Development Build verified | ✅ DONE (Android dev build running) |
| Google basemap verified | ✅ DONE |
| Location context implemented | ✅ DONE |
| Custom user marker verified | ✅ DONE |
| Custom vehicle markers verified | ✅ DONE |
| Haversine distance implemented | ✅ DONE (client-side km; backend Euclidean `distance` never rendered) |
| Recenter / Layers / Traffic implemented | ✅ DONE |
| Marker → Vehicle Details implemented | ✅ DONE |
| Commit checkpoint | `143bc8d feat(map): complete approved map UI and native verification` |

---

## 5. CURRENT EXECUTION PLAN

> ⚠️ The original phase order (`12-rebuild-order.md` "Phase 0…7") is **NO LONGER the execution
> sequence**: several later features (Home slices, Map, Vehicle Details) were implemented
> *before* the authenticated shell existed. The order below reflects reality and the verified
> dependency graph.

### A. AUTHENTICATED APP SHELL COMPLETION — **CURRENT NEXT PHASE**

| # | Task | Why |
|---|---|---|
| A1 | Session gate for the `(app)` group | No route under `(app)` is safe until unauthenticated vs authenticated is decided in one place. ⬅️ **NEXT TASK** |
| A2 | Natural Email OTP → authenticated app transition | Email OTP success currently dead-ends |
| A3 | Home tab | The four sections are built and verified but **nothing mounts them** — there is no Home route |
| A4 | **Profile Hub tab (`SCREEN-016`)** + logout | Completes the tab set and provides the **only** logout path |
| A5 | Bottom-tabs layout | Needs all three destinations to exist; Map moves under the tabs group |
| A6 | First-launch Onboarding gate | Legacy shows onboarding once, **inside** the authenticated area |
| A7 | Drawer / side-menu behavior — **ONLY if required by legacy parity** | Implement with the cleanest Expo-compatible approach; do **not** blindly recreate React Navigation architecture |

### B. PROFILE HUB CONTENTS

> The Profile Hub **route** ships in Phase A (task A4). Phase B completes what it links to.

- B1 — Wire the Map app-bar ☰ Menu / 🔔 Notifications buttons
- B2 — Favorites (`SCREEN-014`)
- B3 — Notifications (`SCREEN-015`)
- B4 — Profile sub-route plumbing

### C. COMPLETE CORE HOME FLOW

- C1 — All Vehicles
- C2 — Finish the Vehicle Details request flow (**`POST /requests`** — blocked on a backend decision)

### D. PROFILE FEATURES

- D1 — Edit Profile (`SCREEN-017`) — ⛔ gated on the Profile Hub
- D2 — My Cars (`SCREEN-018`) — ⛔ gated on the Profile Hub

### E. SECONDARY

- E1 — Privacy
- E2 — Contact Us
- E3 — Join Us
- E4 — No Network
- E5 — Freshchat

### F. DEFERRED AUTH / INTEGRATIONS

- F1 — Login
- F2 — Phone authentication
- F3 — Password reset
- F4 — Social authentication
- F5 — FCM and other native integrations, as dependencies require

### G. FINAL LEGACY PARITY AUDIT

- G1 — Compare **every** legacy screen, route, action, API, and business rule against `YamakExpoNew`.
- Objective: **FUNCTIONAL PARITY with legacy Yamak**, not identical architecture.

### 5.1 Dependency rules (current, enforced)

- **`SCREEN-016` Profile Hub (Phase A task A4) MUST precede `SCREEN-017` Edit Profile, `SCREEN-018`
  My Cars, and any profile-side navigation feature.** Those screens are reached *through* the hub,
  and the hub is the only logout path.
- Home / Map / Profile must live **inside the authenticated shell** (task A1 gate) before anything
  else is finalized.
- Do not begin Edit Profile or My Cars while the shell or the Profile Hub is incomplete.
- **`POST /requests` (C2) stays blocked** until the backend owner decides auth + `payload` handling.
  The contact-only Vehicle Details design is the approved interim state.
- **No screen starts before its listed dependencies.**

---

## 6. NEXT 10 TASKS

| Order | Task | Note |
|---|---|---|
| 1 | **A1 — session gate for the `(app)` group** in `src/app/(app)/_layout.tsx` | ✅ **DONE** 2026-10-02 (also gated `index.tsx` + `register.tsx`) |
| 2 | A2 — Email OTP → authenticated shell transition | ⬅️ **START HERE** — unblocked; A1 is done |
| 3 | A3 — Home tab `(app)/(tabs)/index.tsx` (mount the four verified sections) | blocked on 1 |
| 4 | **A4 — Profile Hub tab `(app)/(tabs)/profile.tsx` + logout** | blocked on 1; ⛔ gates D1/D2 |
| 5 | A5 — bottom-tabs layout `(app)/(tabs)/_layout.tsx` | blocked on 3 + 4 |
| 6 | B1 — wire the Map app-bar Menu / Notifications buttons | blocked on 5 |
| 7 | A6 — first-launch Onboarding gate | blocked on 5 |
| 8 | C1 — All Vehicles | blocked on A3 |
| 9 | B2 — Favorites (`SCREEN-014`) | blocked on A4 |
| 10 | B3 — Notifications (`SCREEN-015`) | blocked on A4 |

> ⏭ A7 (drawer) is **conditional** — build it only on an explicit decision that legacy parity
> requires it. ⛔ C2 (`POST /requests`) stays blocked on the backend decision.

---

## 7. JUST-IN-TIME ARCHITECTURE

Add only the route, component, hook, dependency, state owner, or API layer required by the
approved current functionality. No speculative folders, no speculative dependencies.

---

## 8. Historical CLI plan — NON-CURRENT

> ⛔ **Everything in this section is superseded. It is kept only as history and must not be
> implemented.**

- The rebuild originally started as a **React Native CLI** project named `Yamak` in
  `YamakMobileNew`, with `react-native-config`, Gradle flavors (dev/staging/prod), React
  Navigation stacks/drawer/tabs, Zustand, and Axios.
- Superseded by the Expo + Expo Router architecture in §2.
- `docs/rebuild/13-SCREEN-BY-SCREEN-REBUILD-PLAN.md` §PHASE 0 and `docs/rebuild/12-rebuild-order.md`
  §"Phase 0 — Foundations" retain the original CLI setup steps as **historical record**.
- The only current artifact of that CLI work is the `assets/images/appLogo.png` asset migrated into
  `YamakExpoNew` (see `EXPO-MIGRATION.md`).

### Historical milestones (records, not instructions)

| Milestone | Status | Record |
| --- | --- | --- |
| YAMAK-SETUP-001 — environment verification | Completed historically | User-confirmed; no dedicated source file |
| YAMAK-SETUP-002 — clean React Native CLI project | Completed historically | `YamakMobileNew` commit `8f24f51` |
| YAMAK-SETUP-003 — Android startup verification | Completed historically | User-confirmed; no dedicated source file |
| YAMAK-SETUP-004 — clean project understanding | Completed historically | User-confirmed; no dedicated source file |
| YAMAK-SETUP-005 — minimum `src` structure | Completed historically | `YamakMobileNew` commit `c2d5252` |
| REGISTER STEP 1 — navigation scaffold and Register placeholder | Completed | `YamakMobileNew` commit `eb41709`; translated to Expo Router in `YamakExpoNew` |
| REGISTER STEP 2 — partial visual pass | Superseded | Unapproved CLI blue header was never migrated |
| YAMAK-MIGRATION-EXPO-001 — move completed rebuild work to Expo | Completed | See `EXPO-MIGRATION.md` |

---

## 9. Design workflow

```text
Legacy analysis, one screen at a time
  → screen inventory
  → brand analysis
  → external UI/UX research
  → Yamak new design system
  → complete UI prototypes
  → user review
  → user approval
  → incremental Expo implementation
```

Approved visual references live in `docs/rebuild/approve-ui/<screen>/` (`code.html` + `screen.png`).
Provisional `docs/rebuild/new-ui/` prototypes remain **PROPOSED** and are superseded by any
matching `approve-ui/` reference.

---

## 10. Constraints

- `docs/rebuild/EXPO-MIGRATION.md` decides that **Expo Router replaces**
  `NavigationContainer` / `AuthStackNavigator` / `ScreenNames`. No second React Navigation tree.
- Copy, never invent: endpoints and behavior come from `docs/rebuild/*` and the legacy source.
- No dependency is added without explicit approval; prefer `npx expo install`.
- `ios/` and `android/` are generated (Continuous Native Generation) — never hand-edited. Native
  behavior is configured in `app.json` / `app.config.ts` and config plugins.
- Expo Go only ships its bundled native modules; native-library features require a development build.
- Never commit secrets. See `SECRETS-MIGRATION-CHECKLIST.md`.