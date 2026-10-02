# YAMAK MOBILE — 14. REBUILD READINESS REPORT

> Assessment of whether documentation and implementation are ready to continue the rebuild.
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
| 12 | `12-rebuild-order.md` | **COMPLETE — rewritten: current phases A–G + historical CLI phases** |
| 13 | `13-SCREEN-BY-SCREEN-REBUILD-PLAN.md` | COMPLETE (CLI assumptions corrected and labelled historical) |
| 14 | `14-REBUILD-READINESS-REPORT.md` | COMPLETE (this file) |
| 15 | `PROJECT-STRUCTURE-LEARNING.md` | **COMPLETE — rewritten for the Expo structure** |
| 16 | `SECRETS-MIGRATION-CHECKLIST.md` | **COMPLETE — Expo terminology; pending integrations marked PLANNED / NOT YET MIGRATED** |
| 17 | `YAMAK-MOBILE-REBUILD-SPEC.md` | **COMPLETE — Expo architecture + current business model** |
| 18 | `yamak-rebuild-notion-import.csv` | **COMPLETE — realigned to the current task sequence** |
| — | `EXPO-MIGRATION.md` | COMPLETE (historical migration record) |

## 2. Implementation readiness

| Area | Readiness | Notes |
|---|---|---|
| Platform / project | **READY** | `YamakExpoNew` on Expo SDK 57 + Expo Router; single app id `com.yamak.assist` |
| Theme foundation | **READY** | `src/theme/*` implemented and in use |
| API contracts | **READY** | `services`, `adds`, `vehicles`, `services/{id}/vehicles`, `vehicles/{id}` live-verified in `PROJECT_CONTEXT.md` |
| Authentication (register path) | **PARTIAL** | Register + Email OTP + SecureStore session done; **shell entry missing** |
| Authenticated app shell | **BLOCKING GAP** | No session **routing** gate, no tabs, no onboarding gate |
| Home data sections | **READY (not assembled)** | services / adds / vehicles / ViewMap built; not yet mounted on a Home screen |
| Map | **READY** | Approved UI + native Development Build verified |
| Vehicle Details | **PARTIAL** | Screen done; `POST /requests` deferred |
| Profile hub | **NOT STARTED** | Blocks all profile extensions |
| i18n (EN/AR + RTL) | **NOT STARTED** | Blocks full product parity |
| Data models | **PARTIAL** | several legacy fields `UNKNOWN` — confirm against the live backend |
| Assets / branding | **READY** | logo migrated; theme tokens in place |

### 2.1 Blocking gap analysis

**Single blocking gap: the authenticated app shell.**

Home, Map, and Vehicle Details were built **before** the shell existed, so none of them is reachable
in a normal authenticated session. Everything else can proceed **after** Phase A + Phase B.

Dependency chain:

```
A1  session gate for the (app) group          ← NEXT TASK
   → A2  Email OTP → authenticated shell
   → A3  Home tab          (sections exist; no route mounts them)
   → A4  Profile Hub tab + logout             ← ⛔ GATES A-below
       → A5  bottom-tabs layout
           → B1  wire Map app-bar Menu / Notifications
           → A6  onboarding gate (post-auth, first launch)
           → A7  drawer — ONLY if legacy parity requires it
           → C1  All Vehicles
           → B2  Favorites
           → B3  Notifications
           → D1  Edit Profile     ⛔ blocked until A4 is DONE
           → D2  My Cars          ⛔ blocked until A4 is DONE
```

## 3. UNKNOWN / MUST-CONFIRM items

1. Exact `user-cars` fields for the add-car form.
2. `user-notifications/mine` item shape.
3. Backend push-token field name (`fcmToken` vs `notificationToken`).
4. Whether `auth/login-social` needs a Facebook SDK or only Google/Apple.
5. `auth/signup` password behavior (legacy posts `{name,email,phone}` only).
6. Whether `POST /requests` stays public/unauthenticated and whether its silently-dropped `payload`
   should be persisted — backend-owner decision, front-end may only proceed as specified.
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
- [x] Task dependencies valid → `REBUILD-PLAN.md` §5.1 + `12-rebuild-order.md` §4
- [x] No secrets copied → only variable names/locations
- [x] No legacy application source code modified
- [x] No contradictory CURRENT statements about architecture (bare RN / React Navigation / Zustand /
      Axios / `react-native-config` / `YamakMobileNew`) — all confined to clearly labelled
      Historical/Legacy/Superseded sections
- [x] No stale "Edit Profile is next" claim while the App Shell / Profile Hub is incomplete

## 5. Readiness verdict

**Documentation: READY.**
**Implementation: NOT ready to continue past the authenticated app shell.**

- Startable NOW: **Phase A** — task A1, the session gate for the `(app)` group.
- Then: the rest of Phase A (Home tab → **Profile Hub + logout** → tabs layout → onboarding) →
  B (Profile Hub contents) → C (All Vehicles; `POST /requests` blocked) → D (Edit Profile, My Cars)
  → E (secondary) → F (deferred auth/integrations) → G (legacy parity audit).
- ⛔ **Edit Profile and My Cars cannot start until the Profile Hub is DONE.** There is no valid
  reading of this plan in which Edit Profile is the next screen.
- Requires user input before the relevant phase: binary assets if any are still missing; the
  `POST /requests` decision; the optional-stub decisions; the push-token field name.

## 6. Recommended next task

> **A1 — session gate for the `(app)` group** in `src/app/(app)/_layout.tsx`: branch to the
> unauthenticated area or the authenticated shell based on `useAuth().status`, keeping the existing
> splash gate intact and leaving `UserLocationProvider` mounted exactly once.
>
> Then **A2** (Email OTP → authenticated shell transition), **A3** (Home tab route) and **A4**
> (Profile Hub tab + logout).
>
> Per the STANDING rules: one small change → RUN → VERIFY → STOP → wait for explicit confirmation.