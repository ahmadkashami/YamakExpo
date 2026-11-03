# Yamak rebuild plan

## 0. MASTER SOURCE OF TRUTH HIERARCHY

> ⚠️ **Read this section first. When any two documents disagree, apply this order.**

| Rank | Source | Authoritative for |
|---|---|---|
| 0 | **Explicit user decision in the current task** | Outranks every document, including this one. |
| 1 | `PROJECT_CONTEXT.md` | **Verified current implementation state** of `YamakExpoNew` — what exists, what is verified, what is TODO, and every recorded decision. |
| 2 | `REBUILD-PLAN.md` (this file) | **Current execution strategy** — what gets built next, in which order, and under which rules. |
| 3 | Legacy `yamak-mobile` repository | **Functional / business reference** — screens, flows, API contracts, validation, rules, assets/content, required native capabilities. |
| 4 | `docs/rebuild/01`–`11` legacy analysis | **Supporting reference** — reverse-engineered evidence about legacy behavior. Describes the OLD app; not a build instruction. |
| 5 | Current Expo / React Native official documentation | **Technical implementation authority** — how to build/configure on the current platform. |

**Conflict rule:** when documents conflict, **explicit user decisions plus current verified `PROJECT_CONTEXT.md` win.**

**`docs/rebuild/12-rebuild-order.md` is HISTORICAL / SUPERSEDED, not an execution authority.** It has
now been cleaned: it carries a strong `HISTORICAL / SUPERSEDED EXECUTION ORDER — NON-CURRENT` banner,
its old phase tables are relabeled as historical snapshots, and its stale `NEXT TASK` / `CURRENT
NEXT PHASE` / `C2 blocked` markers have been corrected. Its `CURRENT ORDER` block and its §3/§4
rules are also relabeled historical. **Read it as history only — never sequence work from it.** The
current plan lives in this file (§5–§6) and in `PROJECT_CONTEXT.md`.

### 0.2 Documentation role index (authority)

> Every root file under `docs/rebuild/` plus `PROJECT_CONTEXT.md` has one role. When two files
> disagree, the source-of-truth hierarchy in §0 wins.

| File | Role | Authority |
|---|---|---|
| `PROJECT_CONTEXT.md` (repo root) | Living record of verified implementation state + decisions | **Rank 1** — current state |
| `REBUILD-PLAN.md` (this file) | Current execution strategy + roadmap + next step | **Rank 2** — plan |
| `docs/rebuild/01-project-inventory.md` … `10-user-flows.md` | Legacy functional reference (endpoints, models, rules, flows) | Legacy reference only — never architecture |
| `docs/rebuild/11-rebuild-backlog.md` | Supporting task ledger (status snapshot) | **Not** a sequencing authority |
| `docs/rebuild/12-rebuild-order.md` | Historical execution order (A–G letters) | **Historical / superseded** — non-current |
| `docs/rebuild/13-SCREEN-BY-SCREEN-REBUILD-PLAN.md` | Per-screen requirements + step detail | Screen requirements current; phase/status/order markers historical |
| `docs/rebuild/14-REBUILD-READINESS-REPORT.md` | Point-in-time readiness snapshot (2026-10) | Historical snapshot — non-current |
| `docs/rebuild/EXPO-MIGRATION.md` | One-time migration record (CLI → Expo) | Historical record — migration complete |
| `docs/rebuild/PROJECT-STRUCTURE-LEARNING.md` | Educational folder-layout guide | Current structure reference |
| `docs/rebuild/SECRETS-MIGRATION-CHECKLIST.md` | Secret/key location inventory | Operational — security rules binding |
| `docs/rebuild/YAMAK-MOBILE-REBUILD-SPEC.md` | Product spec + feature list | Current product requirements |
| `docs/rebuild/yamak-rebuild-notion-import.csv` | Notion import snapshot (format-sensitive) | Non-authoritative snapshot — do not rewrite |
| `docs/rebuild/approve-ui/**`, `docs/rebuild/new-ui/**` | Design references / prototypes | Protected — do not modify |

### 0.3 Current execution plan (single source of truth)

- **Current roadmap:** `REBUILD-PLAN.md` §5 (Phase B feature numbering B1…B11).
- **Single next step:** `REBUILD-PLAN.md` §6 (**B2.5A — Request Lifecycle + Channel Analysis,
  analysis only**).
- **Verified state:** `PROJECT_CONTEXT.md` (CURRENT MASTER STATUS).
- **Task ledger:** `11-rebuild-backlog.md` (supporting).
- **Historical order:** `12-rebuild-order.md` (non-current).

- **ACTIVE rebuild:** `D:\AALYASSIN\Projects\work\YamakProject\YamakExpoNew`
- **SUPERSEDED rebuild:** `D:\AALYASSIN\Projects\work\YamakProject\YamakMobileNew`
  (React Native CLI. Retained temporarily for rollback/migration review. **Not** the active target. Do not delete without explicit approval.)
- **LEGACY functional reference:** `D:\AALYASSIN\Projects\work\YamakProject\yamak-mobile`

`YamakExpoNew` is the **only** active rebuild project.

| Repository | GitHub | Role |
|---|---|---|
| Mobile | `ahmadkashami/YamakExpo` | ACTIVE rebuild (`YamakExpoNew`) |
| Backend | `ahmadkashami/yamak-backend` | API — mobile v1 namespace + dashboard |
| Dashboard | `ahmadkashami/yamak-dashboard` | Admin dashboard |
| Legacy | `ahmadkashami/yamak-mobile` | **READ-ONLY** functional reference |

---

## 2. CURRENT ARCHITECTURE — AUTHORITATIVE

This is what is implemented **today**. Nothing below is optional or "recommended" — it is the
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
| Requests | `src/api/requests.ts` + `src/hooks/use-create-request.ts` → `POST /api/mobile/v1/requests` (Bearer + `Idempotency-Key`) |
| Maps | **`react-native-maps` (`1.28.2`)** via `PROVIDER_GOOGLE`, driven by the `react-native-maps` config plugin (intentional controlled override; Expo Go cannot render marker/basemap layers — recorded, not a code defect) |
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

## 4. CURRENT IMPLEMENTATION STATUS — VERIFIED 2026-11-03

> Only what is proven is recorded. Anything not listed here is NOT implemented.
> Mobile baseline: branch `main`, HEAD **`91cf051`** (`docs: align Yamak roadmap with request tracking`).
> (Previous recorded baseline `253dc04` — `feat(requests): add mobile service request workflow` — is
> superseded by the roadmap-alignment commit; the feature commits `50e9c67` (B1) and `253dc04`
> (B2.3) remain part of HEAD.)

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

### 4.2 AUTH + AUTHENTICATED SHELL — DONE, PHASE A CLOSED

| Item | Status |
|---|---|
| Register screen | ✅ DONE |
| Email OTP UI + verification | ✅ DONE |
| Session persistence | ✅ DONE (SecureStore) |
| Session / auth gate for `(app)` + startup + `/register` | ✅ DONE (A1) |
| Email OTP → authenticated app transition (no dead end) | ✅ DONE (A2) |
| Home route inside the authenticated shell | ✅ DONE (A3) |
| Profile Hub tab (`SCREEN-016`) + logout | ✅ DONE (A4) |
| Bottom-tabs layout | ✅ DONE (A5) |
| First-launch onboarding gate (backend-managed) | ✅ DONE (A6) |
| Drawer / side menu | ✅ DONE (A7) |
| **Phase A (A1–A7)** | ✅ **CLOSED** |

### 4.3 HOME — DONE (mounted)

| Item | Status |
|---|---|
| Services section implemented (`GET /services`) | ✅ DONE |
| Adds carousel implemented (`GET /adds`) | ✅ DONE |
| Location-aware vehicles implemented (`GET /vehicles` + shared location provider) | ✅ DONE |
| Approved Home design work exists | ✅ DONE — `docs/rebuild/approve-ui/home/`, `ViewMap.tsx` radar card implemented |
| Mounted by the authenticated Home screen | ✅ DONE (Phase A / A3) |

### 4.4 MAP — COMPLETE

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

### 4.5 ALL VEHICLES — DONE (B1 CLOSED)

| Item | Status |
|---|---|
| Route `/vehicles` + list screen + pagination | ✅ DONE (B1.1–B1.8) |
| Home → All Vehicles → Vehicle Details navigation | ✅ DONE |
| Runtime + small-screen verification | ✅ DONE |
| Commit | `50e9c67 feat(vehicles): apply approved all vehicles UI` |
| Known non-blocking caveat | On the load-more **failure** path a single fling can emit two identical `page=2` GETs (no duplicate rows, no user-visible effect). Unchanged pre-existing guard behaviour. |

### 4.6 VEHICLE DETAILS + REQUEST WORKFLOW — PARTIAL (Phase B2, IN PROGRESS)

| Item | Status |
|---|---|
| Detail screen `/vehicle/[id]` (approved UI) | ✅ DONE |
| Services + contact (Call / WhatsApp) + Share + Other Vehicles | ✅ DONE |
| Multi-service selection on Vehicle Details | ✅ DONE (B2.3) |
| Authenticated create request — `POST /api/mobile/v1/requests` | ✅ DONE (B2.3, commit `253dc04`) |
| Idempotency: UUID v4 key, payload fingerprint, replay, 409 on same-key/different-payload | ✅ DONE (B2.3 + B2.4C backend `86cab6e`) |
| Runtime verification (submission, DB proof, rapid-tap, retry, replay, 409) | ✅ DONE (B2.4 / B2.4C) |
| **Customer coordinates in the request** | ❌ **NOT IMPLEMENTED** — now mandatory (REQ-DEC-003) → B2.5B–D |
| **Channel (`app` / `whatsapp` / `phone`)** | ❌ **NOT IMPLEMENTED** → B2.5B–D |
| **Tracked lifecycle statuses** | ❌ **NOT IMPLEMENTED** (today the server sets `active`) → B2.5A–D |
| **Status history** | ❌ **NOT IMPLEMENTED** → B2.5B–D |
| **WhatsApp / phone → tracked request** | ❌ **NOT IMPLEMENTED** (today they only hand off externally) → B2.5A–D |
| **My Requests (list + details)** | ❌ **NOT STARTED** → B3 |
| **Dashboard request tracking** | ❌ **NOT IMPLEMENTED** → B2.5E |
| **Provider lifecycle actions** | ❌ **FUTURE** (deliberately out of the MVP queue) |

### 4.7 Everything else

Not listed above is **not implemented**. Do not infer features from the legacy app, from
`docs/rebuild/new-ui/`, or from screenshots.

---

## 5. CURRENT EXECUTION PLAN

### 5.0 At a glance

| Phase | Status |
|---|---|
| **A** — Authenticated app shell (A1–A7) | ✅ **CLOSED** |
| **B** — Core features | 🔄 **IN PROGRESS** — **B1 CLOSED**, **B2 IN PROGRESS** |
| **C–G** (old phase letters) | **SUPERSEDED** — replaced by the Phase B feature numbering in §5.2 (see §5.6) |

### 5.1 PHASE A — AUTHENTICATED APP SHELL — **CLOSED** (historical, do not re-open)

| # | Task | State |
|---|---|---|
| A1 | Session gate for the `(app)` group | ✅ DONE |
| A2 | Email OTP → authenticated app transition | ✅ DONE |
| A3 | Home tab | ✅ DONE |
| A4 | Profile Hub tab (`SCREEN-016`) + logout | ✅ DONE |
| A5 | Bottom-tabs layout | ✅ DONE |
| A6 | First-launch onboarding gate (backend-managed) | ✅ DONE |
| A7 | Drawer / side-menu (approved UI) | ✅ DONE |

> Retained only as the closure record. Phase A work must not be re-scoped or rebuilt.

### 5.2 PHASE B — FEATURE WORK — **CURRENT**

#### B1 — All Vehicles — ✅ **CLOSED**
Commit `50e9c67`. See §4.5.

#### B2 — Vehicle Details + **tracked request workflow** — 🔄 **IN PROGRESS**

| Step | Scope | State |
|---|---|---|
| B2.1–B2.2 | Security / eligibility / idempotency foundation, v2 contract work | ✅ DONE |
| B2.3 | Mobile multi-service selection + authenticated create request | ✅ DONE (`253dc04`) |
| B2.4 | Actual mobile runtime verification | ✅ DONE (PASS with recorded scope limits) |
| B2.4C | Idempotency conflict → HTTP 409 repair + re-verification | ✅ DONE (backend `86cab6e`) |
| **B2.5** | Code review / learning gate | ✅ **COMPLETE (review only — triggered the requirements loop below)** |
| **B2.5A** | **Request lifecycle + channel analysis** | ⬅️ **CURRENT NEXT STEP** |
| B2.5B | Backend model extension (channel, coordinates, lifecycle, status history) | ⏳ Blocked on B2.5A |
| B2.5C | Canonical contract update | ⏳ Blocked on B2.5B |
| B2.5D | Mobile integration update (location-gated create for all channels) | ⏳ Blocked on B2.5C |
| B2.5E | Dashboard request tracking | ⏳ Blocked on B2.5C |
| B2.5F | Request-tracking runtime verification | ⏳ Blocked on B2.5D + B2.5E |
| B2.6 | Design review | ⏳ Blocked on B2.5F |
| B2.7 | Approved UI implementation | ⏳ Blocked on B2.6 |
| B2.8 | Final verification + commit | ⏳ Blocked on B2.7 |

**Why B2 grew:** B2.5's review surfaced a genuine **requirements change** (not a past defect):
every YAMAK-initiated contact must become a **tracked request**, and every tracked request needs
customer coordinates. B2.3/B2.4 were correct **for the contract that existed then** ("location not
required"); that contract is now **SUPERSEDED**. The re-scoped sequence above is the approved way
to absorb the change without pretending the earlier work was wrong.

##### B2.5A — Request Lifecycle + Channel Analysis (analysis only)

Produces the decision-ready analysis for B2.5B–F. **No schema, no migration, no product code, no
dashboard code.** Must cover, at minimum:

1. **Channels** — enumerate `app`, `whatsapp`, `phone`; who initiates, what the customer sees, and
   what the provider/dashboard must be able to see for each.
2. **Lifecycle** — the conceptual states `contact_initiated`, `pending`, `accepted`, `completed`,
   `not_completed`, `cancelled`; legal transitions; who may perform each transition; the optional
   reason on negative outcomes.
3. **Initial status per channel** — app → `pending`; whatsapp/phone → `contact_initiated`.
4. **Reconciliation with today's data** — the current canonical create writes `active`, which is
   **not** in the target vocabulary. B2.5A must decide: map, migrate, or keep as an internal
   legacy value. Nothing is changed in B2.5A.
5. **Location capture point per channel** — where the coordinates are obtained, how an
   unavailable/denied location blocks creation, and how a stale fix is handled.
6. **Status history** — required fields (from, to, actor, optional reason, timestamp); who writes.
7. **Coordinate privacy** — see §5.4.
8. **Impact inventory** — Backend model/contract, Mobile screens/hooks, Dashboard list/details,
   tests, and the existing stray dev row `requests id=8` (still pending user purge).
9. **Open decisions** — every item that still needs explicit user approval before B2.5B.

##### B2.5B–B2.5F — delivery sequence

- **B2.5B — Backend model extension.** Schema/model changes for channel, coordinates, lifecycle,
  and status history. **A migration is created only when explicitly approved in that task** — see
  the global migration rule.
- **B2.5C — Canonical contract update.** `POST /api/mobile/v1/requests` accepts the channel and the
  mandatory coordinates, validates them, keeps atomic create/replay, and extends the fingerprint so
  a different channel/location is a different logical request.
- **B2.5D — Mobile integration update.** All three channels create a tracked request **before** any
  external handoff; location comes from the existing shared provider; no fake coordinates.
- **B2.5E — Dashboard request tracking.** Admin can list and inspect tracked requests: channel,
  status, coordinates, and lifecycle history (subject to admin authorization).
- **B2.5F — Runtime verification.** Prove each channel end-to-end, DB truth, location blocking,
  privacy, and dashboard visibility. No code review substitutes for runtime proof.

#### B3 — My Requests — **PLANNED, NOT STARTED**

New official Phase B feature: the authenticated user can see **their own** tracked requests
(app, WhatsApp, and phone), with a list and a details view. Provisional plan (titles may be
refined in B3.1 analysis; **the order is fixed**):

| Step | Scope |
|---|---|
| B3.1 | Legacy "my requests" analysis + current read-contract inventory (owner-scoped reads only) |
| B3.2 | Read-contract decision: list/detail, pagination, status vocabulary, channel field |
| B3.3 | Data layer: API module + hook (typed, owner-scoped, no global store) |
| B3.4 | Functional **My Requests list** screen + real entry point |
| B3.5 | Functional **request details** screen (status, channel, services, timestamps, location shown only as allowed) |
| B3.6 | Runtime verification (all three channels visible, correct ownership filtering) |
| B3.7 | Code review / learning gate |
| B3.8 | Design review (design source must be approved before UI work) |
| B3.9 | Approved UI implementation |
| B3.10 | Final verification + commit |

#### B4–B11 — FUTURE PHASE B ORDER (after B3)

| # | Feature |
|---|---|
| B4 | Edit Profile (`SCREEN-017`) |
| B5 | My Cars (`SCREEN-018`) |
| B6 | Favorites (`SCREEN-014`) |
| B7 | Notifications + FCM (`SCREEN-015`) |
| B8 | Privacy & policy, Contact us, Join us (`SCREEN-020`/`019`/`021`) |
| B9 | No network / offline behaviour (`SCREEN-024`) |
| B10 | Remaining auth + integrations (Login, phone auth, password reset, social, Freshchat) |
| B11 | Final legacy parity audit |

> Order rationale: B4–B7 complete the authenticated user's own data; B8–B10 finish secondary and
> deferred surfaces; B11 audits parity **last**, against a feature-complete app.

### 5.3 Request-tracking contract — recorded decisions (authoritative)

Recorded as **REQ-DEC-001…012**. These outrank any older "contact-only / no POST" guidance.

| ID | Decision |
|---|---|
| REQ-DEC-001 | **Every YAMAK-initiated interaction creates a trackable Service Request** — in-app request, WhatsApp handoff, and phone call alike. An untracked contact is not acceptable. |
| REQ-DEC-002 | **Channel is data, never status.** `channel ∈ {app, whatsapp, phone}` is an attribute of the request and never substitutes for its lifecycle state. |
| REQ-DEC-003 | **Customer latitude/longitude are mandatory at creation for every channel.** No tracked request exists without a valid location. |
| REQ-DEC-004 | **Snapshot semantics.** Coordinates are captured once at creation and stored as the historical record; later re-resolution never rewrites them. |
| REQ-DEC-005 | **Never store fake or placeholder coordinates.** `0,0`, emulator defaults, and "best guess" values are rejected. |
| REQ-DEC-006 | **No valid location ⇒ no tracked request.** The flow surfaces the location problem; it must not silently continue and must not fall back to an untracked contact. |
| REQ-DEC-007 | **Reuse the existing single `UserLocationProvider`** (`src/location`). No second location stack, no parallel permission flow. |
| REQ-DEC-008 | **Fixed WhatsApp/Phone order:** select services → obtain location → create the tracked request → **then** open the external app. Opening WhatsApp or the dialer first is wrong. |
| REQ-DEC-009 | **Lifecycle (conceptual, names not yet final as schema):** `contact_initiated`, `pending`, `accepted`, `completed`, `not_completed`, `cancelled`. Initial status: app → `pending`; whatsapp/phone → `contact_initiated`. Final mapping is validated in B2.5A. |
| REQ-DEC-010 | **Status history is required:** from-status, to-status, actor, optional reason, timestamp. No table/column names are approved yet. |
| REQ-DEC-011 | **Coordinate privacy:** a provider must **not** receive customer latitude/longitude before accepting. Post-accept visibility requires both a per-request authorization and an accepted/eligible state. Admin visibility is subject to admin authorization. |
| REQ-DEC-012 | **Requirement evolution is not a defect.** B2.3/B2.4 were correct under "location not required"; that contract is superseded, not retroactively wrong. Do not "fix history". |

**Canonical create endpoint (unchanged decision):** `POST /api/mobile/v1/requests` under the global
`/api/mobile/v1/` namespace. There is **no** separate active Request v2 creation contract.

### 5.4 Coordinate privacy, provider scope, and future work

**Privacy (authoritative).**

- Location is stored because the request must be serviceable — not because it is public.
- Provider sees **no** coordinates before accepting a request.
- After accepting, coordinates are visible only if **both** conditions hold: per-request
  authorization **and** an accepted/eligible request state.
- Admin/dashboard visibility is allowed only under admin authorization.
- Never expose raw coordinates in list payloads for other users.

**Provider lifecycle scope — FUTURE, deliberately excluded from the current MVP queue.**

| Provider action | Timing |
|---|---|
| View incoming requests for their vehicle(s) | FUTURE (after B3 + B2.6–B2.8) |
| Accept / reject a request | FUTURE |
| Complete / mark not-completed **with a reason** | FUTURE |
| View customer coordinates **after acceptance** | FUTURE |
| Open the request location in Maps | FUTURE |

Do not add provider routes, screens, or role plumbing while B2/B3 are open. Record only.

### 5.5 Mandatory feature lifecycle

```text
Analyze
  → Architecture
  → Functional implementation
  → Runtime verification (real proof, not code reading)
  → Code review / learning
  → Design review
  → Approved UI implementation
  → Final verification
  → Commit (explicit approval only)
  → Sync remote (push + verify, see §11)
```

**Approved deviation for B2:** the review gate opened a genuine requirements loop, so B2 runs
`B2.5 → user decisions → B2.5A–F → B2.6 → B2.7 → B2.8`. This is the lifecycle, applied honestly —
not a process break.

### 5.6 HISTORICAL — superseded plan content (kept for traceability)

> ⛔ **NON-CURRENT.** The phase letters and task IDs below were correct before Phase A closed.
> They are **not** an instruction. Use §5.2.

| Old item | Old intent | Current truth |
|---|---|---|
| Phase A (A1–A7) | Authenticated shell | ✅ CLOSED — see §5.1 |
| Old B1 | Wire Map app-bar ☰ Menu / 🔔 Notifications | ☰ resolved by the A7 drawer; 🔔 is still inert → folded into **B7 Notifications** |
| Old B2 | Favorites (`SCREEN-014`) | Re-numbered **B6** |
| Old B3 | Notifications (`SCREEN-015`) | Re-numbered **B7** |
| Old B4 | Profile sub-route plumbing | Absorbed into **B4–B8** |
| Old C1 | All Vehicles | ✅ Delivered as **B1** (`50e9c67`) |
| Old C2 | `POST /requests` "blocked on a backend decision" | ✅ **Delivered** as **B2.3/B2.4C**; the "blocked / contact-only interim" statement is **SUPERSEDED** |
| Old D1 | Edit Profile (`SCREEN-017`) | Re-numbered **B4** |
| Old D2 | My Cars (`SCREEN-018`) | Re-numbered **B5** |
| Old D3 | Favorites | Re-numbered **B6** |
| Old D4 | Notifications | Re-numbered **B7** |
| Old E | Secondary screens | Re-numbered **B8/B9** |
| Old F | Deferred auth / integrations | Re-numbered **B10** |
| Old G | Final legacy parity audit | Re-numbered **B11** |
| Old "NEXT 10 TASKS" | A1→B3 queue | ❌ Wholly obsolete — every entry is done or re-numbered |

> The old A/B/C/D order was also duplicated in `12-rebuild-order.md` §2. That file is superseded
> (§0); its duplicated labels are history, not authority.

### 5.7 Dependency rules (current, enforced)

- **No screen starts before its listed dependencies.**
- B2 implementation work is **gated on B2.5A decisions**. Do not start B2.5B early.
- Request-tracking changes land Backend → contract → Mobile → Dashboard, in that order.
- My Requests (B3) starts only after the tracked-request contract is stable (B2.5C, ideally B2.5F).
- **Explicit user approval is required** before: any migration, any schema change, any commit,
  any push, and any change to the approved UI references.
- Never write to a Production database. Never run migrations unless that specific task requests it.

---

## 6. CURRENT NEXT STEP — exactly one

> ## ⬅️ **NEXT = B2.5A — Request Lifecycle + Channel Analysis (ANALYSIS ONLY)**
>
> - Read-only. **No** schema change, **no** migration, **no** product code, **no** dashboard code.
> - Owner of the deliverable: the B2.5A analysis section appended to `PROJECT_CONTEXT.md`.
>
> Nothing else is queued as "next". If another document names a different next task, this file wins
> — unless the user explicitly overrides it.

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

**Rule:** a feature's functional implementation may precede its design review (as B2 did), but
approved-UI implementation always comes **after** an explicit design approval. The functional
screen must never pretend to be the approved design.

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
- **Never** connect to, query, inspect, or modify a Production database without explicit approval
  for the current task.
- **Never** create or apply a database migration unless the current task explicitly requests it.

---

## 11. Git sync policy — MANDATORY after every approved commit

A commit is not "done" until the remote matches it. After **every** approved local commit:

1. Verify the working tree state (`git status --short`) — no unexpected files.
2. Push the branch: `git push origin <branch>`.
3. Compare `git rev-parse HEAD` with `git rev-parse origin/<branch>` — **they must be equal**.
4. Report, in the task result: branch, commit hash, and the push result.

Rules:

- Never report "pushed" without the hash-equality proof.
- Never force-push, rewrite history, or amend a pushed commit without explicit approval.
- Do not commit or push at all unless the current task explicitly approves it.

---

## 12. Multi-repository rule

- **Push only the repository that received the commit.**
- For a feature spanning repositories (e.g. Backend + Mobile + Dashboard), verify each affected
  repo's `HEAD == origin/<branch>` **after** the multi-repo work is complete.
- The **Legacy** repository is **read-only**: never commit, push, or modify it unless the user
  explicitly approves that specific change.
- Record per-repo hashes in the task report so the phase can be resumed safely.
