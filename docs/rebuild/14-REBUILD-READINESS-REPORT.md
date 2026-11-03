# YAMAK MOBILE — 14. REBUILD READINESS REPORT

> # ⛔ HISTORICAL POINT-IN-TIME SNAPSHOT — NON-CURRENT
>
> **This report was written before Phase A closed. Its status tables are stale and must not be used
> to plan or sequence work.** It is preserved as a readiness record, not as authority.
>
> **CURRENT STATE:** `PROJECT_CONTEXT.md` (CURRENT MASTER STATUS).
> **CURRENT ROADMAP + NEXT STEP:** `REBUILD-PLAN.md` §5 + §6.
>
> Corrections that supersede this snapshot:
> - Phase A (A1–A7) is **CLOSED**; the authenticated shell, tabs, drawer and onboarding are built.
> - Home is mounted; All Vehicles shipped (**B1**, `50e9c67`).
> - The Vehicle Details request flow shipped (**B2.3**, `253dc04`; B2.4C idempotency/409). The
>   canonical endpoint is **`POST /api/mobile/v1/requests`** — not the legacy public `POST /requests`.
> - Profile Hub is **DONE** (A4), so Edit Profile (B4) and My Cars (B5) are no longer gated on it.
> - The **single next step is B2.5A — Request Lifecycle + Channel Analysis (analysis only)**.
>
> **Current platform:** `YamakExpoNew` — Expo + React Native + TypeScript + **Expo Router**.
> Source-of-truth hierarchy: `REBUILD-PLAN.md` §0.

---

## 1. Documentation status

| # | File | Status |
|---|---|---|
| 0 | `PROJECT_CONTEXT.md` | **COMPLETE — verified current implementation state (rank 1 authority)** |
| 0b | `REBUILD-PLAN.md` | **COMPLETE — master plan: hierarchy, architecture, execution order (rank 2 authority)** |
| 1 | `01-project-inventory.md` | COMPLETE (legacy analysis — supporting reference) |
| 2 | `02-screen-inventory.md` | COMPLETE (legacy analysis — supporting reference) |
| 3 | `03-navigation-map.md` | **COMPLETE — legacy navigation (reference) + NEW EXPO TARGET BEHAVIOR (authoritative)** |
| 4 | `04-api-catalog.md` | COMPLETE (legacy analysis — supporting reference) |
| 5 | `05-data-models.md` | COMPLETE (legacy analysis — supporting reference) |
| 6 | `06-authentication.md` | COMPLETE (legacy analysis — supporting reference) |
| 7 | `07-assets-and-branding.md` | COMPLETE (legacy analysis — supporting reference) |
| 8 | `08-environment-and-config.md` | COMPLETE (legacy analysis + Expo config section) |
| 9 | `09-business-rules.md` | COMPLETE (legacy analysis — supporting reference) |
| 10 | `10-user-flows.md` | COMPLETE (legacy analysis — supporting reference) |
| 11 | `11-rebuild-backlog.md` | **COMPLETE — updated for Expo + current status** |
| 12 | `12-rebuild-order.md` | **HISTORICAL — SUPERSEDED execution order; non-current** |
| 13 | `13-SCREEN-BY-SCREEN-REBUILD-PLAN.md` | COMPLETE (screen requirements CURRENT; phase/status/order markers HISTORICAL) |
| 14 | `14-REBUILD-READINESS-REPORT.md` | HISTORICAL snapshot (this file) — non-current statuses |
| 15 | `PROJECT-STRUCTURE-LEARNING.md` | **COMPLETE — rewritten for the Expo structure** |
| 16 | `SECRETS-MIGRATION-CHECKLIST.md` | **COMPLETE — Expo terminology; pending integrations marked PLANNED / NOT YET MIGRATED** |
| 17 | `YAMAK-MOBILE-REBUILD-SPEC.md` | **COMPLETE — Expo architecture + current business model** |
| 18 | `yamak-rebuild-notion-import.csv` | FORMAT-SENSITIVE Notion import snapshot — non-authoritative, includes stale `NEXT TASK` cells |
| — | `EXPO-MIGRATION.md` | COMPLETE (historical migration record) |

## 2. Implementation readiness (2026-10 SNAPSHOT — see banner for current state)

| Area | Readiness | Notes |
|---|---|---|
| Platform / project | **READY** | `YamakExpoNew` on Expo SDK 57 + Expo Router; single app id `com.yamak.assist` |
| Theme foundation | **READY** | `src/theme/*` implemented and in use |
| API contracts | **READY** | `services`, `adds`, `vehicles`, `services/{id}/vehicles`, `vehicles/{id}` live-verified in `PROJECT_CONTEXT.md` |
| Authentication (register path) | **PARTIAL** | Register + Email OTP done; resend/countdown still open. *(Shell entry has since shipped — A2.)* |
| Authenticated app shell | **DONE since this snapshot** | Session routing gate, tabs, drawer and onboarding all shipped in Phase A |
| Home data sections | **DONE since this snapshot** | Mounted at `(app)/(tabs)/home.tsx` (A3) |
| Map | **READY** | Approved UI + native Development Build verified |
| Vehicle Details | **DONE (+ B2 request flow)** | Request flow shipped B2.3/B2.4C; coordinate/channel/lifecycle extension = B2.5B–D |
| Profile hub | **DONE since this snapshot** | Shipped in A4; no longer blocks profile extensions |
| i18n (EN/AR + RTL) | **NOT STARTED** | Blocks full product parity |
| Data models | **PARTIAL** | several legacy fields `UNKNOWN` — confirm against the live backend |
| Assets / branding | **READY** | logo migrated; theme tokens in place |

### 2.1 Blocking gap analysis (historical — the gap described here is closed)

> ⛔ **The "single blocking gap" below no longer exists.** The authenticated app shell shipped in
> Phase A. The diagram is kept only to show the dependency reasoning used at the time.

**Single blocking gap: the authenticated app shell.** *(historical)*

Home, Map, and Vehicle Details were built **before** the shell existed, so none of them is reachable
in a normal authenticated session. Everything else can proceed **after** Phase A + Phase B.

Dependency chain (historical):

```
A1  session gate for the (app) group          ✅ DONE 2026-10-02
   → A2  Email OTP → authenticated shell      ✅ DONE 2026-10-02
   → A3  Home tab                             ✅ DONE
   → A4  Profile Hub tab + logout             ✅ DONE (no longer gates B4/B5)
       → A5  bottom-tabs layout               ✅ DONE
           → A6  onboarding gate              ✅ DONE
           → A7  drawer                       ✅ DONE (approved UI)
           → B1  All Vehicles                 ✅ DONE (`50e9c67`)
           → B6  Favorites                    ⏭
           → B7  Notifications                ⏭
           → B4  Edit Profile                 ⏭ (hub dependency satisfied)
           → B5  My Cars                      ⏭ (hub dependency satisfied)
```

## 3. UNKNOWN / MUST-CONFIRM items

1. Exact `user-cars` fields for the add-car form.
2. `user-notifications/mine` item shape.
3. Backend push-token field name (`fcmToken` vs `notificationToken`).
4. Whether `auth/login-social` needs a Facebook SDK or only Google/Apple.
5. `auth/signup` password behavior (legacy posts `{name,email,phone}` only).
6. ~~Whether `POST /requests` stays public/unauthenticated and whether its silently-dropped
   `payload` should be persisted~~ — **RESOLVED**: the canonical contract is the authenticated
   `POST /api/mobile/v1/requests` (B2.3). Residual open questions belong to B2.5A (lifecycle +
   channel analysis).
7. i18n library choice and the EN/AR key set.

> `vehicles` / `services` / `adds` response shapes are **no longer UNKNOWN** — they are live-verified
> in `PROJECT_CONTEXT.md`.

## 4. Documentation compliance checklist

- [x] Every discovered screen has a task → `11-rebuild-backlog.md` + `yamak-rebuild-notion-import.csv`
- [x] Every actionable screen has step-by-step instructions → `13-...`
- [x] Every API is documented → `04-api-catalog.md`
- [x] APIs mapped to screens/features → `04` §3 + `02` §D
- [x] Assets documented → `07-assets-and-branding.md`
- [x] Environment/configuration documented → `08-environment-and-config.md` + `SECRETS-MIGRATION-CHECKLIST.md`
- [x] Business rules documented → `09-business-rules.md`
- [x] Navigation documented, legacy vs new target distinguished → `03-navigation-map.md`
- [x] Authentication documented → `06-authentication.md`
- [x] Task dependencies valid → `REBUILD-PLAN.md` §5.7 (current) — `12-rebuild-order.md` §4 is historical
- [x] No secrets copied → only variable names/locations
- [x] No legacy application source code modified
- [x] No contradictory CURRENT statements about architecture (bare RN / React Navigation / Zustand /
      Axios / `react-native-config` / `YamakMobileNew`) — all confined to clearly labelled
      Historical/Legacy/Superseded sections
- [x] No stale "Edit Profile is next" claim while the App Shell / Profile Hub is incomplete

## 5. Readiness verdict (2026-10 SNAPSHOT — superseded)

> ⛔ This verdict is historical. The implementation has moved well past it.

**Documentation: READY.**
**Implementation: NOT ready to continue past the authenticated app shell.** *(historical)*

- Startable NOW at the time: **Phase A / A2**. *(A2 is now ✅ DONE.)*
- Then: the rest of Phase A → B → C → D → E → F → G. *(Superseded by the B1…B11 numbering.)*
- ⛔ ~~Edit Profile and My Cars cannot start until the Profile Hub is DONE.~~ ✅ **Hub shipped in
  A4**; Edit Profile is now **B4** and My Cars is **B5**.
- Requires user input before the relevant phase: the optional-stub decisions; the push-token field
  name; the B2.5A lifecycle/channel analysis outcome.

**Current verdict instead:** see `PROJECT_CONTEXT.md` CURRENT MASTER STATUS. The single next step is
**B2.5A — Request Lifecycle + Channel Analysis (analysis only)**.

## 6. Recommended next task (2026-10 SNAPSHOT — superseded)

> ⛔ **Historical recommendation only.** The current next task is **B2.5A — Request Lifecycle +
> Channel Analysis (analysis only)** in `REBUILD-PLAN.md` §6.

> **A1 — session gate for the `(app)` group** in `src/app/(app)/_layout.tsx`: branch to the
> unauthenticated area or the authenticated shell based on `useAuth().status`, keeping the existing
> splash gate intact and leaving `UserLocationProvider` mounted exactly once.
>
> **✅ COMPLETE — delivered and runtime-verified 2026-10-02.** A1 also gated the startup route
> (`src/app/index.tsx`) and the unauthenticated Register screen; `/email-otp` was deliberately left
> ungated. See the `PHASE A — STEP A1` section in `PROJECT_CONTEXT.md`.
>
> **A2, A3, A4 and the rest of Phase A are also ✅ COMPLETE.** Phase A is CLOSED.