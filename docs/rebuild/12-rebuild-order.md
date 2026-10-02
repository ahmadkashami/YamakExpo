# YAMAK MOBILE — 12. REBUILD ORDER (SEQUENCING)

> ⚠️ **SUPERSEDED BY THE CURRENT EXECUTION PLAN.** This file previously defined a Phase 0→7 CLI
> sequence that is no longer the execution order.
>
> **CURRENT AUTHORITY:** `REBUILD-PLAN.md` §5 (Current Execution Plan) + `PROJECT_CONTEXT.md`.
> Strategy: ONE SCREEN AT A TIME, infrastructure added ONLY when the current screen requires it
> (JUST-IN-TIME). Full per-screen detail lives in `13-SCREEN-BY-SCREEN-REBUILD-PLAN.md`.
>
> **Platform:** `YamakExpoNew` — Expo + React Native + TypeScript + **Expo Router**.

---

## Guide to reading this section

- Phase → group of steps that together deliver a runnable milestone.
- Each phase ends with a checkpoint ("app installs/runs/builds/works").
- Do NOT start the next phase until the previous checkpoint passes.
- Historical CLI phase ordering is retained in the Appendix for reference only.

---

## 1. WHY THE OLD ORDER NO LONGER HOLDS

The original order assumed a strict waterfall: Foundations → Auth → App Shell → Home → Map →
Profile. Reality in `YamakExpoNew` diverged:

- Register + Email OTP + SecureStore session were built first. ✅
- Then **Home data slices** (services, adds, location-aware vehicles). ✅
- Then **Map** (`/map`) — approved UI + native Development Build verification. ✅
- Then **Vehicle Details** (`/vehicle/[id]`). ✅
- **But the authenticated app shell was never assembled.** There is still no authenticated landing,
  no bottom tab bar, and Email OTP success is a dead end.

Because Home / Map / Vehicle Details already exist, the correct remaining sequence is:

> **Finish the shell that contains the work already done — then continue.**

---

## 2. CURRENT EXECUTION PLAN

### Phase A — AUTHENTICATED APP SHELL COMPLETION  ← **CURRENT NEXT PHASE**

| Order | Task | Rationale |
|---|---|---|
| A1 | Session gate for the `(app)` route group in `src/app/(app)/_layout.tsx` | Nothing under `(app)` can be routed safely until unauthenticated vs authenticated is decided in one place. ⬅️ **NEXT TASK** |
| A2 | Natural Email OTP → authenticated app transition | Email OTP success currently renders a success state and stops; the shell must be reachable |
| A3 | Home tab (`src/app/(app)/(tabs)/index.tsx`) | ✅ The four sections are built and verified but **nothing mounts them** — there is no Home route |
| A4 | **Profile Hub tab (`SCREEN-016`)** + logout | Completes the tab set and provides the **only** logout path. ⛔ Must be DONE before `017` / `018` |
| A5 | Bottom-tabs layout (`(app)/(tabs)/_layout.tsx`) | Needs all three destinations to exist; Map moves under the tabs group |
| A6 | First-launch Onboarding gate | Legacy shows onboarding exactly once, **inside** the authenticated area — not before login |
| A7 | Drawer / side-menu behavior — **only if legacy parity requires it** | Implement with the cleanest Expo-compatible approach; **do not** blindly recreate React Navigation architecture |

Checkpoint: after registering and verifying an email OTP, the app lands inside the authenticated
shell; onboarding appears once on a fresh install; Home, Map and Profile are all reachable from the
bottom tabs; logout returns to the unauthenticated area; a completed session survives app restart.

### Phase B — PROFILE HUB CONTENTS

> The **Profile Hub route itself (SCREEN-016) ships in Phase A** as the Profile tab (task **A4**) — it
> is required to complete the shell and it carries the only logout path. Phase B fills in what the hub
> links to. Phase D features (Edit Profile, My Cars) remain gated on the hub being DONE.

| Order | Task | Rationale |
|---|---|---|
| B1 | Wire the Map app-bar ☰ Menu / 🔔 Notifications buttons | The shipped Map has inert buttons; they need real destinations |
| B2 | YAMAK-SCREEN-014 Favorites | Legacy stores favorites locally; no backend favorites routes exist |
| B3 | YAMAK-SCREEN-015 Notifications | Paginated list; read side only (push is Phase F) |
| B4 | Profile sub-route plumbing | Every hub entry gets a real route or an explicit not-yet note |

Checkpoint: the Profile Hub menu is fully wired — no entry leads to an invented or missing route,
and the Map's app-bar buttons are no longer inert.

### Phase C — COMPLETE CORE HOME FLOW

| Order | Task | Rationale |
|---|---|---|
| C1 | YAMAK-SCREEN-011 All Vehicles | "View All" from Home has no destination yet |
| C2 | Finish Vehicle Details request flow — **`POST /requests`** | Services picker + request POST remain TODO (see `PROJECT_CONTEXT.md` 5A/5B for the backend/security decision) |

Checkpoint: Home → All Vehicles → Vehicle Details → request submission all work end to end.

### Phase D — PROFILE FEATURES

| Order | Task | Rationale |
|---|---|---|
| D1 | YAMAK-SCREEN-017 Edit Profile | **Depends on B1 (Profile Hub)** |
| D2 | YAMAK-SCREEN-018 My Cars | **Depends on B1 (Profile Hub)** |
| D3 | YAMAK-SCREEN-014 Favorites | Legacy stores favorites locally; no backend favorites routes exist |
| D4 | YAMAK-SCREEN-015 Notifications | Depends on the notifications backend shape (see `14` §3) |

### Phase E — SECONDARY

| Order | Task |
|---|---|
| E1 | YAMAK-SCREEN-020 Privacy & policy |
| E2 | YAMAK-SCREEN-019 Contact us |
| E3 | YAMAK-SCREEN-021 Join us |
| E4 | YAMAK-SCREEN-024 No network |
| E5 | YAMAK-SCREEN-023 Freshchat (requires the Freshchat SDK) |

### Phase F — DEFERRED AUTH / INTEGRATIONS

| Order | Task |
|---|---|
| F1 | YAMAK-SCREEN-001 Login |
| F2 | YAMAK-SCREEN-003 / 004 Phone authentication |
| F3 | YAMAK-SCREEN-008 / 006 / 007 Password reset |
| F4 | Social authentication (Google / Apple) |
| F5 | FCM push and other native integrations, as dependencies require |

### Phase G — FINAL LEGACY PARITY AUDIT

Compare **every** legacy screen, route, action, API, and business rule against `YamakExpoNew`.

> **The goal is FUNCTIONAL PARITY with legacy Yamak — not identical architecture.**

---

## 3. Final validating order (current)

1. **Phase A** — authenticated app shell: auth gate → Email OTP transition → `(app)` layout → Home
   tab → **Profile Hub tab (`SCREEN-016`)** → tabs layout → onboarding → drawer (only if required)
2. **Phase B** — Profile Hub contents: Map app-bar wiring, Favorites, Notifications, sub-route plumbing
3. **Phase C** — All Vehicles + Vehicle Details request flow (`POST /requests` blocked on a backend decision)
4. **Phase D** — Edit Profile, My Cars (both gated on the Profile Hub)
5. **Phase E** — secondary screens
6. **Phase F** — deferred auth / native integrations
7. **Phase G** — legacy parity audit

---

## 4. Key dependency rules (current — validated in `14-REBUILD-READINESS-REPORT.md`)

- **No screen starts before its listed dependencies.**
- Auth must be able to reach the authenticated area before any authenticated screen is finalized.
- **Home / Map / Profile must live inside the authenticated shell** before profile extensions continue.
- **`SCREEN-016` Profile Hub MUST precede `SCREEN-017` Edit Profile, `SCREEN-018` My Cars, and any
  profile-side navigation feature.**
- **Do not start Edit Profile while Phase A or Phase B is incomplete.**
- Native SDK tasks gate the screens that use them (Maps, Freshchat, Google/Apple Sign-In).
- Stub/legacy screens are P3 and must not block P0/P1.
- Copy, never invent: all endpoints/params shared from `04-api-catalog.md`.

---

## Appendix — Historical CLI phase order (NON-CURRENT)

> ⛔ **SUPERSEDED — retained for history only. Do not execute. The platform below
> (React Native CLI, `react-native-config`, Gradle flavors, React Navigation
> `NavigationContainer`/`AuthStack`/`Drawer`/`Tabs`, Zustand, Axios) is NOT the current
> architecture. See `REBUILD-PLAN.md` §2.**

<details>
<summary>Historical Phase 0 — Foundations (no UI)</summary>

| Order | Task | Rationale |
|---|---|---|
| 1 | YAMAK-SETUP-001 Create RN TS project | Everything runs on this |
| 2 | SETUP-002 env + react-native-config + flavors | Every config depends on it |
| 3 | SETUP-003 design tokens | First UI needs tokens (Login) |
| 4 | SETUP-004 assets (logo/fonts/lottie) | Branding must exist before UI |
| 5 | SETUP-005 i18n | Login text is bilingual |
| 6 | SETUP-006 axios client | First API call needs it |
| 7 | SETUP-007 auth store + token gate | Login persists token through it |
| 8 | SETUP-012 splash/branding | App polish baseline |
| 9 | NATIVE-010 linking (icons/fonts) | Icons/fonts used everywhere |

Checkpoint: `npx react-native run-android` / `run-ios` shows blank app, no crash, env loaded, tokens render.
</details>

<details>
<summary>Historical Phase 1 — Authentication flow (unauthenticated area)</summary>

| Order | Task | Rationale |
|---|---|---|
| 10 | SETUP-008 NavigationContainer + AuthStack | Login needs a root |
| 11 | YAMAK-SCREEN-001 Login (email+password) | Primary unlock; feeds token gate |
| 12 | SCREEN-002 Register | Signup contract |
| 13 | SCREEN-008 Forgot-password form | Reset entry point |
| 14 | SCREEN-006 Reset OTP | Uses `check-reset-password` |
| 15 | SCREEN-007 New password | Final reset step |
| 16 | SCREEN-003 Phone login | Alternative auth |
| 17 | SCREEN-004 Phone OTP | Completes phone auth |
| 18 | SCREEN-005 Email OTP | Completes signup |
| 19 | SETUP-009 global error toast | All auth screens show errors |
</details>

<details>
<summary>Historical Phase 2 — App shell (authenticated area)</summary>

| Order | Task | Rationale |
|---|---|---|
| 20 | SETUP-010 DrawerStack + onboarding flag | First authenticated screen |
| 21 | SCREEN-009 Onboarding | First-launch gate |
| 22 | SETUP-011 TabNavigator + CustomDrawerContent | Tabs needed for Home/Map/Profile |
| 23 | SCREEN-016 Profile hub (minimal) | Third tab content; user object display |
| 24 | NATIVE-004 FCM + `AuthedReadyApp` wiring | Authenticated shell standard features |
</details>

<details>
<summary>Historical Phases 3–7</summary>

Phase 3 Home & data (UI kit → Home → All Vehicles → Vehicle Details) · Phase 4 Map & location ·
Phase 5 Profile extensions · Phase 6 Secondary screens · Phase 7 Optional / stubs.
These remain valid only as **screen content references**; their ordering is superseded by §2.
</details>