# YAMAK MOBILE — REBUILD SPECIFICATION

> One-page reference of WHAT the rebuilt app must be. Applies to every task in the backlog.
> Canonical Mobile namespace: `/api/mobile/v1/`. The approved B2.5B–F request extension spans
> Backend → contract → Mobile → Dashboard → runtime verification; no implementation in this closure.
>
> ⚠️ **Architecture in this file is CURRENT.** React Navigation / Zustand / Axios /
> `react-native-config` / bare React Native are **NOT** requirements. See §4 and `REBUILD-PLAN.md` §2.

---

## 1. Product summary

Yamak is a **Kuwait road-assistance connection app**. Users find nearby independent service
providers (winch/tow, tyre, battery, unlock, wash, oil change, computer check), view their details,
contact them directly, and request assistance. Bilingual (EN/AR + RTL), location-aware, with push
notifications.

### 1.1 YAMAK business model (authoritative — governs all product copy)

**YAMAK is a non-profit facilitator / connector.** It connects users with **independent providers.**

YAMAK **does NOT**:

- ❌ set service prices
- ❌ collect service payments
- ❌ issue provider invoices
- ❌ guarantee provider service quality
- ❌ guarantee response times
- ❌ perform the roadside service itself

YAMAK **does**:

- ✅ provide a free facilitator with **no commission / no platform surcharges / no middleman fees**
- ✅ let the user agree rates and terms **directly with the driver/provider**
- ✅ frame the product as **Kuwait-wide road assistance support**

**Consequence for implementation:** never render price, KWD amount, "Fixed Price", "Direct Provider
Rate", commission pricing, rating/transaction counts, response-time or membership-tenure claims,
"Verified"/"Dealer Certified" badges, or ETA promises. The approved facilitator banner wording is:
**"Yamak: 100% Free Facilitator • No Commission • Pay Driver Directly"**, and the safety copy must
retain **"never pay anything in advance"**.

---

## 2. Non-negotiable requirements (product)

1. **Bilingual EN/AR.** All user-facing strings via i18n; Arabic renders RTL correctly.
2. **Authentication** via backend token; persisted **securely** across restarts; all flows
   (register + email OTP, login, phone OTP, password reset, social).
3. **Location-aware.** Device location drives nearby-provider queries (finite
   `latitude`+`longitude` pair with `vehicles`; never a lone/invalid value; never `limit=0`).
4. **Real backend contracts.** Reuse every endpoint in `04-api-catalog.md` exactly. No invented
   endpoints, params, or fields.
5. **Maps.** Real `react-native-maps` + Google basemap, custom user marker, custom vehicle markers,
   Recenter/Layers/Traffic controls.
6. **Notifications** — a required capability (FCM), currently **not yet migrated**.
7. **Security.** Tokens only in secure storage; no secrets in code/docs/logs; never sign release with
   the debug keystore.
8. **Functional parity with legacy Yamak** — not identical architecture.

> ⛔ **Removed:** the former requirement "brown project (bare React Native, not Expo) with 3 Android
> flavors (dev/staging/prod)". `YamakExpoNew` is an **Expo** app with a single application id
> (`com.yamak.assist`); Gradle flavors are a legacy artifact and are not a current requirement.

---

## 3. Feature list (status snapshot 2026-11-03 — sequencing lives in `REBUILD-PLAN.md` §5)

> This table describes **what** exists and what remains. It is **not** the execution order.

| Priority | Features |
|---|---|
| **DONE** | Authenticated app shell (session gate, Email OTP → shell, onboarding, layout, Home/Map/Profile tabs, drawer), Home assembly, **All Vehicles**, Vehicle Details, tracked **request flow** (`POST /api/mobile/v1/requests`), **Profile Hub + logout**, Register |
| **IN PROGRESS** | **B2** tracked-request extension — B2.5A ✅ COMPLETE / DECISIONS APPROVED; **B2.5B next**, then B2.5C–F → B2.6–B2.8, then **B3 My Requests** |
| **NEXT (P1)** | Edit Profile (B4), My Cars (B5), Favorites (B6), Notifications (B7) |
| **P2** | Privacy & policy / Contact Us / Join Us (B8), No Network (B9) |
| **P3 / deferred** | Login, phone auth, password reset, social auth, Freshchat, Sentry, alternate icons, deep links (B10) |
| **P3 / optional stubs** | Search, Settings, Messages, Email validations (legacy stubs — decide later) |
| **PLANNED ONLY** | About Yamak app (user directive: do not implement) |

---

### 3.1 Approved request product requirements — target, not implemented (2026-11-04)

- Track app/whatsapp/phone, independent of status; retain technical platform (e.g. mobile).
  Persist selected vehicle; no MVP name snapshots. ServiceRequest.id is the MVP request number.
- Every new request requires fresh customer latitude/longitude via the existing UserLocationProvider,
  stored as immutable request-time snapshots (recommended decimal(10,7)). Failure blocks creation.
  No stale-memory reuse or fake location; both-zero pair rejected, individual zeros may be valid.
- App initially pending; WhatsApp/phone initially contact_initiated. Both → accepted → completed;
  initial states may cancel; accepted → not_completed/cancelled. No normal contact_initiated → pending.
  completed/not_completed/cancelled terminal, no normal reopening. Later corrections require history.
- Select services → refresh location → create/persist → open WhatsApp/dialer. Creation failure blocks
  tracked handoff; external failure retains request/contact_initiated, shows future error, causes no
  automatic duplicate, handoff status or history entry. Fingerprint adds channel, excludes coordinates.
- Both not_completed/cancelled require fixed multi-select reasonCodes, minimum one distinct approved
  value. other requires reasonNote; otherwise optional/normally null. Free text cannot replace codes.
  Ten stable codes/Arabic meanings in PROJECT_CONTEXT.md §B2.5A DECISION CLOSURE. Relational catalog +
  history-reason pivot supports deterministic reporting by reason/provider/company/channel.
- Create transaction covers request, services, idempotency claim and initial history. History actors
  system/app_user/admin/provider, nullable actor_id, simple fields. External effects cannot control atomicity.
- Historical backfill: active → pending, channel → app, coordinates NULL, vehicle NULL unless known.
  No fabricated provider actions/reasons/lifecycle; synthetic history choice left to B2.5B, clearly
  marked as system migration if used. No migration created in this closure.
- Future My Requests canonical v1 list/detail must use authenticated app_user_id ownership and
  foreign-detail 404; no mixed v1-create/v2-read final architecture. **KNOWN SECURITY GAP — NOT
  EXPOSED AS B3 YET:** current v1 index can return all requests; fix before shipment. B3 stays later.
- Dedicated Mobile Request Resource separate from Dashboard. Customer sees own coordinates; Admin
  needs admin authorization. Provider sees none before acceptance, thereafter needs per-request
  authorization AND eligible state. Driver is provider identity, Company/Branch organizational;
  no provider account exists. Provider auth/actions/location access remain future.
- B2.5E Admin list/detail covers customer, driver, vehicle, company/branch, services, channel, status,
  coordinates, history, selected reasons and timestamps; controlled domain/service transitions enforce
  allowed state, fixed reasons and history together. No arbitrary status update architecture.
- No lifecycle notifications/email in B2.5B–F; defer to Notifications/FCM. No new pricing, payments,
  ratings, SLA, assignment, statuses/channels or formatted request numbers. B2.5B scope/ownership:
  REBUILD-PLAN.md §5.2; no Mobile payload/UI, Dashboard UI or provider authentication in that step.

## 4. Technical stack — CURRENT (authoritative)

| Concern | Choice | Status |
|---|---|---|
| Platform | **Expo** (SDK 57 line) | ✅ in use |
| UI runtime | **React Native** | ✅ in use |
| Language | **TypeScript** | ✅ in use |
| **Navigation** | **Expo Router** — file-based routes in `src/app/`, typed routes | ✅ in use |
| State | **React Context** where chosen (`src/auth`, `src/location`) + hook-local state | ✅ in use |
| Session storage | **expo-secure-store** | ✅ in use |
| HTTP | **shared `fetch` client** (`src/api/http-client.ts`) + typed `ApiError` sanitizer | ✅ in use |
| Maps | **react-native-maps** (`PROVIDER_GOOGLE`) | ✅ in use |
| Location | **expo-location** behind a single shared provider | ✅ in use |
| Splash | **expo-splash-screen** (held by the auth restore gate) | ✅ in use |
| Design tokens | `src/theme/*` | ✅ in use |
| Static config | `app.json` | ✅ in use |
| Dynamic config | `app.config.ts` (env-driven native config) | ✅ in use |
| Env | `.env` (gitignored) + `EXPO_PUBLIC_*` | ✅ in use |
| Forms / i18n | **not yet built** — decide at implementation time | ⏳ |
| Push (FCM) | **planned / not yet migrated** | ⏳ |
| Social sign-in | **planned / not yet migrated** | ⏳ |
| Analytics (Sentry) | **planned / not yet migrated** | ⏳ |
| Chat (Freshchat) | **planned / not yet migrated** | ⏳ |

### 4.1 Not part of the current architecture

Legacy/CLI choices that are **not** requirements and must not be introduced as such:
bare React Native / React Native CLI · `NavigationContainer` · `createStackNavigator` as the required
architecture · DrawerNavigator package architecture · Zustand · Axios · `react-native-config` ·
`ScreenNames.ts` · Android flavor plumbing · release signing with the debug keystore · manually
edited `ios/`/`android/` directories.

These may appear only under headings marked **Historical / Legacy / Superseded**.

---

## 5. Architecture rules (JUST-IN-TIME)

- One screen at a time; one small step at a time; **STOP after every step**.
- Add folders/components/hooks/providers/dependencies only when the current screen needs them.
- Keep legacy deps/patterns as **behavioral** reference only; fix known defects (see `09` §H).
- `src/app/` holds **only** routes/layouts; all non-route code lives outside it.
- Exactly ONE location owner (`UserLocationProvider`); screens never call `expo-location` directly.
- Tokens only in SecureStore; nothing secret in code, docs, or logs.
- Never invent a navigation target — if the route does not exist, report upward via a callback.

---

## 6. Delivery definition of done (per screen)

- Functions against the live backend with no invented params/fields.
- Bilingual and RTL-correct, with loading / empty / error states present.
- Business model respected (§1.1): no prices, no guarantees, no invented statistics.
- "STOP gate" verified after every step.
- No dead legacy code, no secrets, no debug leftovers, no committed keys.

---

## 7. Docs index

**Current authority (in order):** explicit user decisions → `PROJECT_CONTEXT.md` (verified state) →
`REBUILD-PLAN.md` (execution strategy, §5–§6 roadmap + next step, source-of-truth hierarchy) → this
spec → supporting docs.

**Current supporting docs:** `13-SCREEN-BY-SCREEN-REBUILD-PLAN.md` (screen requirements only — its
phase/status/order markers are historical) · `11-rebuild-backlog.md` (task ledger, not a sequencing
authority) · `EXPO-MIGRATION.md` (historical migration record) ·
`PROJECT-STRUCTURE-LEARNING.md` · `SECRETS-MIGRATION-CHECKLIST.md` · this spec.

**Historical / superseded:** `12-rebuild-order.md` (old A–G execution order) ·
`14-REBUILD-READINESS-REPORT.md` (2026-10 point-in-time snapshot) ·
`yamak-rebuild-notion-import.csv` (format-sensitive Notion import snapshot).

**Legacy reference (behavior, not architecture):** `01` inventory · `02` screens · `03` navigation ·
`04` APIs · `05` data models · `06` auth · `07` assets · `08` env/config · `09` business rules ·
`10` user flows.

**Design:** `new-ui/` (proposed) · `approve-ui/` (approved references).

---

## 8. Explicit out-of-scope

- Unrelated Backend rebuilding/redesign. Request model/contract/tracking changes are specifically
  approved for the later B2.5B–F sequence; no Backend source or migration changes in this closure.
- Unrelated backend behavior changes. The **canonical** request contract is the authenticated
  `POST /api/mobile/v1/requests` (shipped B2.3). The legacy public `POST /requests` and its
  silently-dropped `payload` are historical facts raised for the backend owner, not frontend changes.
  B2.5A decisions are approved; their implementation remains B2.5B–F, not this documentation task.
- Porting legacy stubs (Form/FormAuth, custom-IP modal, duplicate store, old themes).
- Reintroducing React Navigation / Zustand / Axios / `react-native-config` / bare-RN architecture.
- Hand-editing generated `ios/` or `android/` directories.
- Reusing legacy committed API keys or legacy application identifiers.
- Any implementation work at documentation time.
