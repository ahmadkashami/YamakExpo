# YAMAK MOBILE — 13. SCREEN-BY-SCREEN REBUILD PLAN

> # ⚠️ READ THIS FIRST — CURRENT ARCHITECTURE
>
> **ACTIVE PROJECT:** `YamakExpoNew` — **Expo + React Native + TypeScript + Expo Router**.
>
> **SUPERSEDED PROJECT:** `YamakMobileNew` (React Native CLI). Retained for rollback/migration
> review only. **Not** the active target.
>
> **LEGACY REFERENCE:** `yamak-mobile` — functional/business reference **only**. It is the source of
> truth for functionality, screens, flows, API contracts, validation, assets/content, and required
> native capabilities. It is **NOT** the source of truth for package versions, navigation
> implementation, state-management library, old RN architecture, deprecated native configuration, or
> obsolete workarounds.
>
> **TECHNICAL AUTHORITY:** current Expo / React Native official documentation.
>
> **Any statement in this document that contradicts the architecture above is HISTORICAL /
> SUPERSEDED and must not be implemented.** Those statements are confined to the sections explicitly
> labelled `HISTORICAL CLI PLAN` / `Legacy implementation` / `Superseded decision`.
>
> **Source-of-truth hierarchy:** see `REBUILD-PLAN.md` §0. **Current execution order:**
> `REBUILD-PLAN.md` §5. **The single next step:** `REBUILD-PLAN.md` §6. **Verified current state:**
> `PROJECT_CONTEXT.md`.
>
> ## ⚠️ WHAT IS CURRENT IN THIS FILE, AND WHAT IS NOT
>
> - **CURRENT:** each screen's *requirements* — legacy evidence, target behavior, per-step
>   implementation detail, dependencies, business rules, and design references. Those remain valid
>   unless a later approved decision supersedes them (notably the B2 request-tracking decisions,
>   `REQ-DEC-001…012`).
> - **HISTORICAL / SUPERSEDED:** every phase letter (`Phase A/B/C/D/E/F/G`), every
>   `⏭ NOT STARTED — Phase X` label, every `NEXT` / `CURRENT PHASE` marker, and the §12 "final order"
>   table. Execution status is **not** maintained here. **Phase A is CLOSED; B1 (All Vehicles) is
>   CLOSED; B2 is in progress.** The current feature numbering is B1…B11 in `REBUILD-PLAN.md` §5.2.
> - **Superseded details to know before reading any step list:** Home, All Vehicles, Profile Hub,
>   bottom tabs, onboarding, and the drawer are **built**; the Vehicle Details request flow is
>   **built** but its coordinate/channel/lifecycle extension is **not** (B2.5B–D).
>
> The master rule for this plan: the goal is FUNCTIONAL PARITY with legacy Yamak — not identical
> architecture.
>
> THE SCREEN-LEVEL REFERENCE DOCUMENT.
> Strategy: **ONE SCREEN AT A TIME** and **ONE SMALL STEP AT A TIME**.
> (Execution order and current status are NOT maintained here — see `REBUILD-PLAN.md` §5–§6.)
> A step = one small, testable change. After each step there is a **STOP** gate.
> At every STOP: save, run the app, confirm the step works, then optionally `git commit`.
> NEVER auto-continue beyond a STOP. Wait for explicit confirmation.
>
> The existing Yamak backend is READY. Do NOT redesign it. Its base URL is supplied at runtime
> via the `EXPO_PUBLIC_API_URL` env var (`src/api/config.ts`) — e.g. a LAN dev host during
> development. We build OUR OWN app front-end against those contracts, learning while we build.
>
> JUST-IN-TIME ARCHITECTURE: folders, navigation, services, stores, and storage are created
> ONLY when the screen you are working on needs them. No upfront architecture dump.

---

## 0. GLOBAL MANDATORY RULES (REBUILD-WIDE)

These rules apply to the ENTIRE Yamak Mobile rebuild — setup, architecture, configuration,
native changes, APIs, and screens. They override any other instruction in this document.

### ⛔ MANDATORY BUILD → RUN → VERIFY → STOP RULE

The rebuild must ALWAYS follow this cycle:

```
Understand
    ↓
Explain
    ↓
Make ONE small change
    ↓
Build / Run the application
    ↓
Verify the application works
    ↓
STOP
    ↓
Wait for my explicit confirmation
    ↓
Only then continue to the next step
```

This rule applies to EVERY task and EVERY step. Examples:

```
Create clean React Native project      Add src folder
    ↓                                      ↓
RUN                                       RUN
    ↓                                      ↓
VERIFY                                    VERIFY
    ↓                                      ↓
STOP                                      STOP

Add Yamak logo                          Add navigation dependency
    ↓                                      ↓
RUN                                       RUN
    ↓                                      ↓
VERIFY                                    VERIFY
    ↓                                      ↓
STOP                                      STOP

Create LoginScreen                      Add Email TextInput
    ↓                                      ↓
RUN                                       RUN
    ↓                                      ↓
VERIFY                                    VERIFY
    ↓                                      ↓
STOP                                      STOP

Add API service                         Connect Login API
    ↓                                      ↓
RUN                                       RUN
    ↓                                      ↓
VERIFY                                    VERIFY
    ↓                                      ↓
STOP                                      STOP

Configure Firebase                      Configure Maps
    ↓                                      ↓
RUN                                       RUN
    ↓                                      ↓
VERIFY                                    VERIFY
    ↓                                      ↓
STOP                                      STOP
```

### 🛑 ABSOLUTE NO-AUTO-CONTINUE RULE

- NEVER perform two implementation steps in the same execution unless I explicitly request both.
- If I say: `"Start YAMAK-SETUP-002 Step 1"` — implement ONLY that step.
- After the step, tell me:
  1. What changed
  2. Why it changed
  3. Files changed
  4. Command(s) I must run
  5. What I should expect to see
  6. How I verify the step succeeded
- Then **STOP**. Do NOT start Step 2. Wait until I explicitly confirm Step 1 works.
- My confirmation may be: `"Done"`, `"Working"`, `"Success"`, `"تم"`, `"انتقل"`, or similar.
- Only after my confirmation may you proceed.

### ❌ FAILURE RULE

If the application fails to: build, install, start, render correctly, call the expected API, or
navigate correctly — DO NOT proceed. The current step becomes **FAILED / BLOCKED**.

- Investigate ONLY the current problem.
- Fix ONLY what is necessary for the current step.
- Then: RUN → VERIFY → STOP.
- Do not introduce future functionality while fixing the current step.

### 🧭 LEGACY YAMAK IS ALWAYS THE REFERENCE

The existing legacy Yamak Mobile project must remain available throughout the ENTIRE rebuild.
It is NEVER discarded as a reference. For every implementation step, BEFORE writing new Yamak code:

1. Inspect the relevant legacy implementation.
2. Identify the existing behavior.
3. Identify the relevant UI/design.
4. Identify relevant assets.
5. Identify relevant API contracts.
6. Identify relevant validation/business rules.
7. Identify relevant native configuration if applicable.
8. Then design the clean implementation in the new application.

The legacy project is the reference for: functional behavior, screens, user flows, navigation
behavior, API contracts, request/response models, validation rules, business rules, logo, colors,
fonts, images, icons, text/content, environment variable names, native integrations, Firebase
configuration requirements, Maps requirements, notifications, permissions, deep links, and
Android-specific requirements.

IMPORTANT: **REFERENCE does NOT mean COPY EVERYTHING.** Do NOT blindly copy: old architecture,
obsolete packages, old React Native configuration, old Gradle configuration, `node_modules`,
`package.json`, deprecated code, unnecessary workarounds, or dead code.

```
LEGACY YAMAK
    ↓
Understand existing requirement
    ↓
Check current Expo / React Native approach
    ↓
Implement cleanly in NEW YamakExpoNew (Expo Router route file)
    ↓
Run
    ↓
Compare with legacy expected behavior
    ↓
Verify
    ↓
STOP
```

### 📖 OFFICIAL EXPO / REACT NATIVE DOCUMENTATION RULE

For the NEW project's technical foundation, the **current official Expo documentation** is the
primary authority — especially for: Expo SDK configuration, Expo Router (layouts, route groups,
dynamic segments, typed routes), config plugins, `app.json` / `app.config.ts`, `.env` handling,
Continuous Native Generation, and current supported practices.
Use `https://docs.expo.dev/` (version-matched to the installed SDK) plus the React Native docs where
relevant.

Therefore:
- **LEGACY PROJECT** = source of truth for Yamak **functionality and requirements**.
- **CURRENT OFFICIAL EXPO DOCUMENTATION** = source of truth for how the new application is
  **technically created and configured**.

### 🔬 NO LARGE CHANGES

Keep every implementation step intentionally small.

- **BAD:** "Create authentication module" (then move on).
- **GOOD:** Step 1: Create LoginScreen → RUN → VERIFY → STOP. Step 2: Add logo → RUN → VERIFY → STOP.
  Step 3: Add email input → RUN → VERIFY → STOP. Step 4: Add password input → RUN → VERIFY → STOP.
  Step 5: Add Login button → RUN → VERIFY → STOP. And so on.

### ✅ PROJECT MUST ALWAYS REMAIN RUNNABLE

After every completed step, the new `YamakExpoNew` project should be in a runnable state. Avoid
leaving half-completed architecture or broken imports meant to be fixed in a later step.

A step is NOT COMPLETE until:
- [ ] Change implemented
- [ ] Project builds
- [ ] App launches
- [ ] Current behavior verified
- [ ] No new blocking runtime error
- [ ] Result explained to me
- [ ] I explicitly confirm success

### 🌿 GIT CHECKPOINT

Only AFTER I confirm that the current step works, SUGGEST an appropriate small Git commit, e.g.:
`git add .` then `git commit -m "feat(auth): add login screen layout"`.
Do NOT execute the commit unless I explicitly request it.

### 🔄 LIFECYCLE FOR EVERY TASK

Every setup task, screen task, API task, native task, and configuration task in this document
follows the same lifecycle:

```
REFERENCE LEGACY
        ↓
UNDERSTAND
        ↓
EXPLAIN
        ↓
IMPLEMENT ONE SMALL CHANGE
        ↓
RUN
        ↓
VERIFY
        ↓
STOP
        ↓
USER CONFIRMATION
        ↓
NEXT STEP
```

---

## 1. How to use this plan

1. **The Expo foundation already exists.** `YamakExpoNew` (Expo + Expo Router) is running with
   Register, Email OTP, SecureStore session persistence, Home data sections, Map, and Vehicle Details
   implemented. The historical CLI bootstrap steps (PHASE 0 / `YAMAK-SETUP-001…005`) are **done or
   superseded** — see `REBUILD-PLAN.md` §8.
2. **Start from the CURRENT execution order:** `REBUILD-PLAN.md` §5 + §6 only. The next task is
   **B2.5A — Request Lifecycle + Channel Analysis (analysis only)** — not a CLI setup task and not a
   shell task. (`12-rebuild-order.md` §2 is HISTORICAL and must not be used.)
3. Read each task's "Goal + evidence". The legacy Yamak project is ONLY a functional/design/API
   reference — never a template for the new project structure.
4. Follow the **GLOBAL MANDATORY RULES** (Section 0) for every step:
   **REFERENCE LEGACY → UNDERSTAND → EXPLAIN → IMPLEMENT ONE SMALL CHANGE → RUN → VERIFY → STOP**
   → wait for my explicit confirmation → then the next step.
5. Never auto-continue past a STOP. One small step per execution unless I ask for more.

## 2. First task directive (user rule) — status snapshot

- ⛔ **SUPERSEDED:** "the rebuild starts with YAMAK-SETUP-001 → 005 (PHASE 0)". The Expo foundation
  is complete; Phase 0 is history.
- ⛔ **SUPERSEDED:** "next = Phase A / authenticated shell". **Phase A (A1–A7) is CLOSED.**
- ✅ **CURRENT (2026-11-03):** finish the tracked-request work — **B2.5A analysis**, then B2.5B–F,
  B2.6–B2.8, then **B3 My Requests**. See `REBUILD-PLAN.md` §5.2 and §6.
- Login and About Yamak App remain **documented but NOT to be implemented in this pass**
  (Login is deferred to **B10**).
- ✅ **The rebuild runs on Expo**, using the CURRENT official Expo documentation
  (`https://docs.expo.dev/`) as the technical authority.

## 3. Global conventions (applied to every screen) — CURRENT

- Colors: ONLY the **approved Yamak tokens** already implemented in `src/theme/` (`colors.ts`,
  `spacing.ts`, `radius.ts`, `typography.ts`, `interaction.ts`). Legacy `AppColorsTheme2`
  (`primary #002F6C`, `secondary #F7B123`, …) is a REFERENCE ONLY (gold-on-white ≈1.9:1 fails AA).
  There is exactly **one** palette — never a second design system.
- Fonts: only the approved type scale in `src/theme/typography.ts`. Legacy `Roboto-Medium` +
  `AppSizes` are reference only.
- Text: i18n wrapper (Arabic-aware, proper RTL layout — legacy `AppText` mis-set
  `textAlign:"left"` for Arabic); never hardcode strings — always i18n keys. **i18n is not built
  yet**; until then a `language` prop (`'en' | 'ar'`) is the agreed interim shape.
- Icons: `@expo/vector-icons` and/or `react-native-svg` icon components.
- API: the shared `fetch` client in `src/api/http-client.ts` + typed `ApiError`
  (`src/api/api-error.ts`). Screens call feature functions in `src/api/`, never `fetch` directly.
  Bearer token is attached by reading SecureStore directly.
- Errors: typed `ApiError` with the sanitizing message extractor; a global toast
  (`useErrorStore` equivalent) is still TODO.
- **Routes: Expo Router file-based routes.** A screen is a file in `src/app/`; a navigator is a
  `_layout.tsx`; navigation uses `router.push/replace/back`, `<Redirect>` and `<Link>`.
  ⛔ **There is no `ScreenNames.ts` and no navigator registration file.**

## 4. Just-in-time rules

- Create `src/api/<feature>.ts` only when the first screen needs that endpoint.
- Create a shared state owner (React Context) only when the first screen needs shared state. Hook-local
  state is the default. ⛔ Do not introduce Zustand.
- Create a route / `_layout.tsx` only when the first screen that lives in it is built.
- Create UI components only when a screen reuses them twice or more.
- Never port dead code (Form/FormAuth, custom-IP modal, duplicate favorites store, Themes 1&3, and the
  unused `create-expo-app` template leftovers).

---

# PHASE 0 — HISTORICAL CLI PLAN — NON-CURRENT (SUPERSEDED)

> # ⛔ SUPERSEDED — DO NOT EXECUTE
>
> This entire PHASE 0 describes creating a **React Native CLI** project **without a framework** using
> `npx react-native init`, `react-native-config`, and Gradle flavors. That architecture is **NOT** the
> current one. `YamakExpoNew` already exists on **Expo + Expo Router**.
>
> **Superseded by:** `REBUILD-PLAN.md` §8 (historical milestones) and
> `EXPO-MIGRATION.md` (the CLI→Expo migration record).
>
> Retained below only so the original CLI rationale is not lost. **Every task in this phase is
> either DONE (in its Expo equivalent) or SUPERSEDED.**

## YAMAK-SETUP-001 — Verify Development Environment — ✅ COMPLETED HISTORICALLY

**Purpose:** verify that the development machine satisfies the platform requirements.
Consultation only — nothing is installed or modified here.

> **Current note:** for `YamakExpoNew` the equivalent checks are `npx expo-doctor`,
> `npx expo config --type public`, `npx tsc --noEmit`, and `npx expo install` for dependency
> management. `npx expo install` is **always** preferred over `npm install` for Expo packages.

Verify each item below; for each, record the installed version and whether it meets the official
requirement. Commands to run (verify each, do NOT alter anything during the documentation phase):

| Tool | Verify with | What it does in React Native development |
|---|---|---|
| Node.js | `node --version` | Runs the JavaScript toolchain (Metro, CLI, bundler). |
| npm | `npm --version` | Installs/manages project packages (`react`, `react-native`, libs). |
| JDK (+ version) | `java -version` | Compiles the Android (Kotlin/Java) part of the app. |
| JAVA_HOME | `echo $env:JAVA_HOME` | Tells Gradle where to find the JDK during Android builds. |
| Android SDK | SDK manager / `sdkmanager --list` | Provides the platform, build-tools and libraries for Android builds. |
| ANDROID_HOME | `echo $env:ANDROID_HOME` | Tells tooling where the Android SDK is installed. |
| adb | `adb --version` | Bridges the computer to a device/emulator (install, log, run). |
| Android Studio / emulator | `emulator -list-avds` | Runs the Android emulator (AVD) to launch the app. |

**RUN → VERIFY → STOP.**  
Do NOT install or modify anything during the documentation phase.

---

## YAMAK-SETUP-002 — Create Clean React Native Project — ⏭ SUPERSEDED

> ⛔ **SUPERSEDED — do not execute.** This task described creating a React Native CLI project named
> `Yamak` **WITHOUT a framework**. It was performed historically in the superseded project
> `YamakMobileNew` (commit `8f24f51`) and then **migrated to Expo**.
>
> **Current equivalent:** `YamakExpoNew` created with `create-expo-app`, Expo Router file-based
> routes, `app.json` + `app.config.ts`. See `EXPO-MIGRATION.md` and
> `PROJECT-STRUCTURE-LEARNING.md`.

Historical instructions (kept for the record only):

- Use the official React Native CLI command for creating a project WITHOUT a framework.
- Project name: **`YamakMobile`** (this is what was actually used, in `YamakMobileNew`).
- Do NOT copy `package.json`, `node_modules`, `android/`, Gradle configuration, or old React Native
  configuration from the legacy project.

### Historical generated structure (NOT current)

| Path | What it is | Current equivalent in `YamakExpoNew` |
|---|---|---|
| `android/` | Native Android project (Gradle + Kotlin/Java). | **Generated** by prebuild/`run:android` — gitignored, never hand-edited |
| `ios/` | Native iOS project (Xcode + Swift/Obj-C). | **Generated** — gitignored, never hand-edited |
| `src/` | Did not exist in the clean template. | ✅ exists — `src/app`, `src/api`, `src/auth`, `src/components`, `src/hooks`, `src/location`, `src/theme`, `src/utils` |
| `App.tsx` | Root React component — the app's UI entry. | ❌ replaced by Expo Router: `src/app/_layout.tsx` is the root navigator |
| `index.js` | JS entry that registers `App`. | ❌ replaced by `expo-router/entry` (`package.json` `main`) |
| `package.json` | JS dependency manifest + scripts. | ✅ exists |
| `metro.config.js` | Metro (JS bundler) configuration. | ❌ Expo manages Metro defaults |
| `babel.config.js` | Babel configuration. | ❌ Expo manages Babel defaults |
| `tsconfig.json` | TypeScript compiler configuration. | ✅ exists |
| `.gitignore` · eslint config | Generated tooling defaults. | ✅ exists |

**RUN → VERIFY → STOP after project creation.**

---

## YAMAK-SETUP-003 / 004 / 005 — RUN, UNDERSTAND, AND SEED THE PROJECT — ✅ COMPLETED HISTORICALLY

> ⛔ **SUPERSEDED CLI STEPS — do not execute `npx react-native start` / `npx react-native run-android`.**
> `YamakExpoNew` runs with `npx expo start` and `npx expo run:android`.
>
> These tasks were completed historically in `YamakMobileNew` and their outcomes are realized in
> `YamakExpoNew`. The **current** structure to learn is `PROJECT-STRUCTURE-LEARNING.md`.

The concepts below remain valid background knowledge and are **not** architecture instructions:

- **Metro** = the bundler that serves the JS bundle; it watches files and rebuilds on change
  (fast refresh / live reload). Expo starts it via `npx expo start`.
- **Gradle** = the Android build system; it resolves dependencies, compiles Java/Kotlin, packages the
  APK, and wires React Native native libraries. In Expo it runs inside the **generated** `android/`.
- **adb** = the Android Debug Bridge; it installs/launches the APK and streams logs (`adb logcat`).
- **How JavaScript reaches the Android app:** Metro builds the bundle → the installed APK loads it
  from the dev server (debug) or the packaged bundle (release) → Hermes executes it → it renders the
  root component. **In Expo the root component is the Expo Router root layout `src/app/_layout.tsx`**,
  not `App.tsx`.
- **Native project files** (`AndroidManifest.xml`, `build.gradle`, `MainActivity`,
  `MainApplication`, `Info.plist`) are **generated** in Expo and must never be hand-edited. Native
  behavior is declared in `app.json` / `app.config.ts` and config plugins.

**Current equivalents (already done):**

| Historical task | Current equivalent | Status |
|---|---|---|
| SETUP-003 — run the clean app | `npx expo start` + a verified Android **Development Build** | ✅ DONE |
| SETUP-004 — understand the project | `PROJECT-STRUCTURE-LEARNING.md` (Expo edition) | ✅ DONE |
| SETUP-005 — minimum `src` structure | `src/app`, `src/api`, `src/auth`, `src/components`, `src/hooks`, `src/location`, `src/theme`, `src/utils` | ✅ DONE |

> ### ⛔ HARD GATE (historical)
> If the app does NOT build and launch, **STOP.** Do NOT install Yamak dependencies. Do NOT create
> screens. Do NOT copy assets. Do NOT configure Firebase. Do NOT configure Maps. Do NOT continue.
> The clean application must work FIRST.

---

## IMPORTANT ORDER CHANGE — ⏭ SUPERSEDED (Historical CLI plan)

> ⛔ **SUPERSEDED.** The CLI bootstrap order below has been **executed and superseded**. Do not follow
> it as the current order.

<details>
<summary>Historical CLI bootstrap order (already completed)</summary>

```
YAMAK-SETUP-001 — Verify environment                    ✅ done historically
        ↓
YAMAK-SETUP-002 — Create clean React Native application ⏭ superseded by Expo (YamakMobileNew 8f24f51)
        ↓
YAMAK-SETUP-003 — Run clean Android application        ✅ done historically
        ↓
        ⛔ HARD GATE
        ↓
YAMAK-SETUP-004 — Understand generated project structure✅ done historically
        ↓
YAMAK-SETUP-005 — Add minimum Yamak structure           ✅ done (YamakMobileNew c2d5252)
        ↓
MIGRATION to YamakExpoNew (Expo)                        ✅ done
        ↓
Register → Email OTP → Home slices → Map → Vehicle Details  ✅ done
        ↓
**Phase A — Authenticated App Shell**                   ✅ CLOSED (historical)
```

</details>

### ⛔ HISTORICAL ORDER (A–G letters — SUPERSEDED, do not execute)

> This A–G block was the plan before Phase A closed. It is retained as history only.
> **The current order is the Phase B feature numbering B1…B11 in `REBUILD-PLAN.md` §5.2**, and the
> single next step is `REBUILD-PLAN.md` §6 (currently **B2.5A**).

```
Phase A — Authenticated App Shell Completion   ✅ CLOSED (A1–A7)
Phase B — Profile Hub contents                 → superseded by B4–B8
Phase C — All Vehicles + request flow          → B1 delivered; B2.3/B2.4C delivered
Phase D — Profile Features                     → B4/B5/B6/B7
Phase E — Secondary screens                    → B8/B9
Phase F — Deferred auth / integrations         → B10
Phase G — Final legacy parity audit            → B11
```

---

## LEGACY PROJECT RULE

After the clean project is running, we will gradually migrate FROM the legacy Yamak project —
but ONLY when needed by the current screen:

- logo · colors · fonts · assets · API contracts · environment configuration ·
  required native configuration · business rules

Do NOT bulk-copy the legacy project.

---

## FINAL RULE (this request is documentation-only)

- Update the rebuild plan only. Do NOT create `YamakMobile`, run `npx`, install packages,
  modify Android, implement Login, or implement any screen.
- After updating this document, STOP.

# PHASE 1 — DESIGN (approved before any screen work)

> ✅ **GATE STATUS:** passed for the screens already built. Register, the Home data sections, the
> Map, and Vehicle Details each shipped against a user-approved reference under
> `docs/rebuild/approve-ui/` (which supersedes the provisional `new-ui` prototypes where both exist).
> The gate still applies to **every unbuilt screen**: no screen may take legacy colors/fonts.
> Any new screen must present its reference for approval the same way those four did.

> **YAMAK-DESIGN-001 — UI/UX design approval gate.**
> Legacy Yamak UI is NOT the visual authority (contrast failures, RTL bug, unused stub components).
> Design deliverables live in `docs/rebuild/new-ui/` (this repo): full screen inventory, app flow,
> design system, three visual directions, a provisional full-app prototype, and a UI catalog —
> all **PROPOSED** until you approve.
>
> ## How to review
> 1. Open `docs/rebuild/new-ui/index.html` (double-click in a browser; no build/server needed).
> 2. Read the design-system docs (colors, typography, spacing, components, navigation, states, RTL/LTR, accessibility).
> 3. Pick **one** visual direction after reviewing all of its 4 sample screens
>    (`directions/01-clean`, `02-brand`, `03-premium` — each: register, home, vehicles, vehicle details).
> 4. Review the full-app prototype (every legacy screen is represented). Neutral-but-notable
>    legibility facts guiding the default: gold `#EEB247`/`#F7B123` text on white ≈1.9:1 is invalid;
>    the blue `#002F6C` is dark and passes AA on white; brand mark (gold + near-black) is kept.
> 5. Tell me which direction + any changes → I apply the approved tokens as the "Design tokens" authority
>    in the new `src/theme/` and enable the REGISTER branding step.
>
> ## Approval gate
> - ⛔ **YAMAK-DESIGN-001** — "Design approved" → the approved token file becomes the sole color/type authority.
> - Without approval, screens only get neutral scaffolding (empty text placeholders) — NEVER legacy colors.
> - Do NOT implement any screen styling until this gate passes.

---

## 5. AUTHENTICATION SCREENS

> **Current terminology for every step in this section (Expo Router):**
> - A "screen" is a **file-based route** under `src/app/` — e.g. `src/app/login.tsx` → `/login`.
>   There is **no** `AuthStackNavigator` and **no** screen-registry file.
> - Navigation is `import { router } from 'expo-router'` → `router.push('/login')`,
>   `router.replace('/register')`, `router.back()`. The session gate is delivered (A1):
>   startup gate in `src/app/index.tsx`, protected group gate in
>   `src/app/(app)/_layout.tsx`, unauthenticated-area guard in `src/app/register.tsx`;
>   the auth loading/splash gate lives in `src/app/_layout.tsx` (Stack + `AuthProvider` +
>   `AuthReadyLayout`).
> - Auth state is **React Context**: `src/auth/auth-context.tsx` exposes
>   `status`, `user`, `accessToken`, `authenticate`, `signOut`; tokens persist in
>   **SecureStore** (`src/auth/auth-storage.ts`, keys `yamak_access_token` / `yamak_auth_user`).
>   There is **no** Zustand store and **no** AsyncStorage auth persistence.
> - API calls go through `src/api/*` built on the **fetch**-based `src/api/http-client.ts`
>   (`ApiError` from `src/api/api-error.ts`). There is **no** `makeApiCall` helper and
>   **no** axios.
>
> **Status legend:** ✅ DONE · 🟡 PARTIAL · ⏭ NOT STARTED (Login/auth set deferred to **B10**) ·
> ⛔ BLOCKED. These per-screen status labels are a snapshot; current state is `PROJECT_CONTEXT.md`.

### YAMAK-SCREEN-001 — LOGIN (exemplar; documented fully)

Goal: email+password route that authenticates against `auth/login` and unlocks the app.
Legacy evidence (functional reference only): `src/screens/authScreens/loginScreen.tsx`,
`loginSchema.ts`, `Auth.api.ts`, `auth.store.ts`.
Current evidence: `src/api/auth.ts`, `src/auth/auth-context.tsx`, `src/api/http-client.ts`.
Learning concepts: View/Text/TextInput, StyleSheet, keyboard handling, validation, fetch,
SecureStore persistence, session gating.

> ⏭ **NOT STARTED — deferred to B10 (Remaining Auth & Integrations).**
> Reason: the authenticated shell now exists (Phase A closed), so Login is no longer blocked by
> architecture — it is simply sequenced after the tracked-request work (B2/B3) and the remaining
> profile features. Building it earlier would divert from the approved roadmap.

- Step 1 — Create `src/app/login.tsx` returning a basic centered `<View>` with an empty `<Text>`. Confirm it is reachable as `/login`. **RUN → VERIFY → STOP.**
- Step 2 — Add the Yamak logo image at the top (from `assets/images/appLogo.png`). **RUN → VERIFY → STOP.**
- Step 3 — Add the first `TextInput` (email) with label "Email". **RUN → VERIFY → STOP.**
- Step 4 — Add the password `TextInput` (`secureTextEntry`) with label "Password". **RUN → VERIFY → STOP.**
- Step 5 — Add the "Login" button (`FilledButton`, primary background, secondary text). **RUN → VERIFY → STOP.**
- Step 6 — Add local state (`useState`) holding email + password; wire console.log on submit. **RUN → VERIFY → STOP.**
- Step 7 — Add validation: valid email, password min 8; show errors under inputs. **RUN → VERIFY → STOP.**
- Step 8 — Add `login({ email, password })` to `src/api/auth.ts` → `httpClient` POST `auth/login`. **RUN → VERIFY → STOP.**
- Step 9 — Call `authenticate(token, user)` from `useAuth()` on success; verify the gate flips to the authenticated area (`src/app/index.tsx` sends an authenticated session into `(app)`) and the token survives an app restart (SecureStore). **RUN → VERIFY → STOP.**
- Step 10 — Add error UI: on failure show a safe message via `ApiError` (never a raw response body); special-case `"user not registered"`. **RUN → VERIFY → STOP.**
- Step 11 — Add "Forgot password?" link → Forgot-Password form (SCREEN-008). **RUN → VERIFY → STOP.**
- Step 12 — Add "Sign up" link → Register (`router.replace('/register')`); conditional social buttons (after the deferred Google Sign-In work). **RUN → VERIFY → STOP.**
- DONE when: valid login works end-to-end; invalid shows errors; token survives restart; `signOut()` returns here.

### YAMAK-SCREEN-002 — REGISTER

> ✅ **DONE (shipped + runtime-verified).** Route `src/app/register.tsx` → `/register`.
> Components `src/components/auth/AuthBrandHeader.tsx` + `CountrySelectorModal.tsx`.
> Learn from this screen — do **not** rebuild it.

Goal: create account via `auth/signup`. Legacy evidence: `registerScreen.tsx`, `registerValidationSchema`.
Concepts: multi-field forms, terms checkbox, country code.
- Step 1 — Basic route `src/app/register.tsx`. **RUN → VERIFY → STOP.** ✅
- Step 2 — ⛔ **Apply the approved Yamak New branding foundation** (design tokens + theme components + Yamak logo) per `YAMAK-DESIGN-001`. **BLOCKED until the design approval gate passes** — do not apply legacy colors/fonts. **RUN → VERIFY → STOP.** ✅
- Step 3 — Add Name input. **RUN → VERIFY → STOP.** ✅
- Step 4 — Add Email input. **RUN → VERIFY → STOP.** ✅
- Step 5 — Add Phone input + country code picker (`CountrySelectorModal`). **RUN → VERIFY → STOP.** ✅
- Step 6 — Add Password input + Terms checkbox (`isAgreed`). **RUN → VERIFY → STOP.** ✅
- Step 7 — Validation (name min 3, email, phone regex, password min 8, `isAgreed` true). **RUN → VERIFY → STOP.** ✅
- Step 8 — `signup` API wrapper in `src/api/auth.ts` (`register` body `{name,email,phone}`). **RUN → VERIFY → STOP.** ✅
- Step 9 — On success `router.push({ pathname: '/email-otp', params: { email } })`. **RUN → VERIFY → STOP.** ✅
- Step 10 — Add "Already have account?" link → Login (once SCREEN-001 exists). **RUN → VERIFY → STOP.** ⏭ B10

### YAMAK-SCREEN-008 — FORGOT PASSWORD (email form)

> ⏭ NOT STARTED — B10 (paired with SCREEN-001).

Goal: request reset code. Legacy evidence: `components/auth/EmailForgotPassword.tsx`, `auth/send-reset-password`.
- Step 1 — Basic route `src/app/forgot-password.tsx`. **RUN → VERIFY → STOP.**
- Step 2 — Email field + validation. **RUN → VERIFY → STOP.**
- Step 3 — API wrapper `sendResetPassword(email)` in `src/api/auth.ts`. **RUN → VERIFY → STOP.**
- Step 4 — On success → Reset OTP (SCREEN-006), passing `email`. **RUN → VERIFY → STOP.**

### YAMAK-SCREEN-006 — RESET OTP

> ⏭ NOT STARTED — B10.

Goal: validate reset code. Legacy evidence: `otpResetPasswordScreen.tsx`, `auth/check-reset-password`.
- Step 1 — Basic route `src/app/reset-otp.tsx`. **RUN → VERIFY → STOP.**
- Step 2 — Code input (6-digit style, `CodeAuthModel`). **RUN → VERIFY → STOP.**
- Step 3 — Resend handler (calls SCREEN-008's API again) + countdown. **RUN → VERIFY → STOP.**
- Step 4 — `checkResetPassword(email, code)`. **RUN → VERIFY → STOP.**
- Step 5 — Success → New Password screen (SCREEN-007). **RUN → VERIFY → STOP.**

### YAMAK-SCREEN-007 — NEW PASSWORD

> ⏭ NOT STARTED — B10.

Goal: set new password. Legacy evidence: `NewPasswordScreen.tsx`, `resetPasswordValidationSchema`, `auth/reset-password`.
- Step 1 — Basic route `src/app/new-password.tsx` + two password fields. **RUN → VERIFY → STOP.**
- Step 2 — Validation: min 8 + confirm match. **RUN → VERIFY → STOP.**
- Step 3 — `resetPassword(email, password)`. **RUN → VERIFY → STOP.**
- Step 4 — Success → back to Login with success message. **RUN → VERIFY → STOP.**

### YAMAK-SCREEN-003 — PHONE LOGIN (auth)

> ⏭ NOT STARTED — B10.

Goal: request SMS code. Legacy evidence: `authScreen.tsx`, `auth/sendCode`.
- Step 1 — Basic route `src/app/phone-login.tsx`. **RUN → VERIFY → STOP.**
- Step 2 — Phone input + country code picker (reuse `CountrySelectorModal`). **RUN → VERIFY → STOP.**
- Step 3 — `sendCode(phone)`. **RUN → VERIFY → STOP.**
- Step 4 — Success → OTP (SCREEN-004), pass phone. **RUN → VERIFY → STOP.**

### YAMAK-SCREEN-004 — PHONE OTP VERIFICATION

> ⏭ NOT STARTED — B10.

Goal: verify SMS code and authenticate. Legacy evidence: `otpVerificationScreen.tsx`, `auth/checkCode`.
- Step 1 — Basic route `src/app/phone-otp.tsx` (no animation). **RUN → VERIFY → STOP.**
- Step 2 — Code input + resend + countdown. **RUN → VERIFY → STOP.**
- Step 3 — `checkCode(phone, code)`. **RUN → VERIFY → STOP.**
- Step 4 — On success load `app-users/profile` then call `authenticate(token, user)`. **RUN → VERIFY → STOP.**

### YAMAK-SCREEN-005 — EMAIL OTP VERIFICATION

> 🟡 **PARTIAL.** Route `src/app/email-otp.tsx` → `/email-otp` exists and is reachable from
> Register. The **Email OTP → authenticated shell transition is DELIVERED** (Phase A2,
> runtime-verified 2026-10-02). Remaining before DONE: resend + countdown parity with legacy.

Goal: complete signup. Legacy evidence: `otpEmailVerificationScreen.tsx`, `auth/verify-email`.
- Step 1 — Basic route `src/app/email-otp.tsx`. **RUN → VERIFY → STOP.** ✅
- Step 2 — Code input. **RUN → VERIFY → STOP.** ✅
- Step 3 — Resend + countdown. **RUN → VERIFY → STOP.** ⏭
- Step 4 — `emailVerify(email, code)`. **RUN → VERIFY → STOP.** 🟡
- Step 5 — On success enter the authenticated shell. **RUN → VERIFY → STOP.** ✅ DONE (A2)

---

## 6. APP SHELL SCREENS

> ✅ **PHASE A CLOSED.** The authenticated shell is built: `src/app/(app)/_layout.tsx` hosts the
> `UserLocationProvider` + the A1 gate + **tabs and drawer**. Home, Map and Profile are all
> reachable. The notes below are retained as the historical build order for those screens.
>
> **Naming rule:** the tab group exists as the directory `src/app/(app)/(tabs)/`. Home and Profile
> are sibling route files in that same group — **do not** create `src/app/(tabs)/` at the root.
> The drawer is a `<Drawer>` from `expo-router/drawer` declared **inside the `(app)` group**,
> above the tabs.

### YAMAK-SCREEN-009 — ONBOARDING

> ✅ **DONE (Phase A6, backend-managed, runtime-verified).** Shown once inside the authenticated
> area. Steps retained as history.
> ⚠️ Placement verified from legacy: onboarding is **inside** the authenticated area, not before
> auth. Legacy's `DrawerStackNavigator` conditionally registers `"onboarding"` above an
> always-present `"drawer"` screen, and onboarding exits via `replace` in the same session.
> A first-launch *unauthenticated* user must therefore NOT see onboarding.

Goal: first-launch intro shown after authentication.
Legacy evidence: `OnBoardingScreen.tsx`, `CarouselCards`, `appReady.store` (`isFirstLunch`).
Concepts: FlatList carousel, Lottie, first-launch flag.
- Step 1 — Basic route `src/app/(app)/onboarding.tsx`, gated by a persisted first-launch flag (SecureStore or AsyncStorage — decide and record). **RUN → VERIFY → STOP.**
- Step 2 — Add carousel of 3 intro slides (images + titles). **RUN → VERIFY → STOP.**
- Step 3 — Add "Get started" / "Skip" → clears the flag, `router.replace('/(app)/(tabs)')`. **RUN → VERIFY → STOP.**
- Step 4 — Add language picker (EN/AR) persisting to `lang`. **RUN → VERIFY → STOP.**

### YAMAK-SCREEN-016 — PROFILE HUB — ✅ DONE (Phase A4)

> ✅ **DONE.** Delivered and runtime-verified in Phase A4, with logout wired to `signOut()`.
> The dependency rule below is preserved as history — it was satisfied.
> ⛔ **HISTORICAL HARD DEPENDENCY RULE:** SCREEN-017 (Edit Profile) and SCREEN-018 (My Cars) are
> reached **through** this hub, and legacy routes the drawer's `Profile` entry and the `Profile`
> tab to the **same** screen. That is why the hub shipped first.
> Also: this hub is where **logout** lives, so it was the concrete reason it was Phase A.

Goal: display user + menu. Legacy evidence: `ProfileScreen.tsx`, `Profile*` components, `app-users/profile`.
Concepts: fetch-on-mount, context refresh, grid of navigation buttons.
- Step 1 — Basic route `src/app/(app)/(tabs)/profile.tsx` (the Profile tab). **RUN → VERIFY → STOP.**
- Step 2 — Show user name/email from `useAuth()`. **RUN → VERIFY → STOP.**
- Step 3 — Fetch `app-users/profile` and refresh the auth context user. **RUN → VERIFY → STOP.**
- Step 4 — Add heading row (icon + labels). **RUN → VERIFY → STOP.**
- Step 5 — Add buttons grid: Edit Profile / My Cars / Favorites / Notifications / Contact Us / Privacy / Join Us / About / Settings / Messages / FreshChat. Each navigates to a real route or shows an explicit "not available yet" note — **never invent a route**. **RUN → VERIFY → STOP.**
- Step 6 — Logout = `signOut()` from `useAuth()`; verify the gate returns to `/register` (the `(app)/_layout.tsx` gate replaces into the unauthenticated area) and the `(app)` group is unreachable. **RUN → VERIFY → STOP.**
- Step 7 — (Only if legacy parity requires it) add a drawer `<Drawer>` in `src/app/(app)/_layout.tsx` and point its `Profile` entry at this same route — resolving legacy's duplicate-entry inconsistency deliberately rather than copying it. **RUN → VERIFY → STOP.**

---

## 7. HOME & DATA SCREENS

> **Data-slicing is the current pattern, not one-screen-at-a-time.** Home is being built as
> independent, runtime-verified slices (services → adds → location+vehicles → map → vehicle
> details), each with its own `src/api/*` + `src/hooks/use-*.ts` + `src/components/<area>/*`.
> **No `services`/`adds`/`vehicles` Zustand stores** — each hook owns local state, exactly as
> decided for slices 1–3B. Sections that need to share a selection pass it upward as a prop/callback.
>
> 🔴 **HISTORICAL GAP (resolved in Phase A3):** the components
> `ServicesList`, `AddsCarousel`, `VehiclesList`, `ViewMap` were built before a Home route
> existed. Home now lives at `src/app/(app)/(tabs)/home.tsx`.

### YAMAK-SCREEN-010 — HOME

> ✅ **DONE (Phase A3).** Route `src/app/(app)/(tabs)/home.tsx`; all four verified sections are
> mounted in legacy order with the custom header. Steps retained as history.
> ✅ `src/api/services.ts` + `src/hooks/use-services.ts` + `components/home/{ServicesList,ServiceItem}.tsx`
> ✅ `src/api/adds.ts` + `src/hooks/use-adds.ts` + `components/home/{AddsList,AddsCarousel,AddCard}.tsx`
> ✅ `src/api/vehicles.ts` + `src/location/*` + `src/hooks/use-vehicles.ts` + `components/home/{VehiclesList,VehicleItem,ApiErrorRow}.tsx`
> ✅ `src/components/home/ViewMap.tsx` (approved "Nearby on radar" CTA → `router.push('/map')`)

Goal: services + adds + vehicles dashboard, faithful port of legacy `HomeScreen`.
Legacy evidence: `HomeScreen.tsx`, `components/home/*`, `services`, `adds`, `vehicles`.
Concepts: parallel fetching, loading placeholders, horizontal lists, localized names.
- Step 1 — Create `src/app/(app)/(tabs)/home.tsx` and mount the already-built sections in legacy order (ViewMap → services → vehicles → ads). **RUN → VERIFY → STOP.** ✅
- Step 2 — Add the custom header (logo right, map button left → `router.push('/map')`). **RUN → VERIFY → STOP.**
- Step 3 — Mount `ViewMap` (`useServices`-independent, purely navigational). **RUN → VERIFY → STOP.** ✅ component exists
- Step 4 — Mount `ServicesList`; wire `onServicePress(service)` → `router.push({ pathname: '/map', params: { serviceId: service._id } })`. **RUN → VERIFY → STOP.** ✅ component exists
- Step 5 — Mount `VehiclesList`; wire a vehicle press → `router.push({ pathname: '/vehicle/[id]', params: { id } })`. **RUN → VERIFY → STOP.** ✅ component exists
- Step 6 — Mount `AddsCarousel`; wire the card press to open `add.link` via `Linking`. **RUN → VERIFY → STOP.** ✅ component exists
- Step 7 — Add loading placeholders for all sections (legacy `*ListPH` parity). **RUN → VERIFY → STOP.**
- Step 8 — Add pull-to-refresh that re-runs all section fetches (legacy `callHomeScreenApi`). **RUN → VERIFY → STOP.**
- Step 9 — Add "View All" on the vehicles section **only when a real `/vehicles` route exists** (SCREEN-011) — otherwise the affordance is omitted, never a dead route. **RUN → VERIFY → STOP.**

### YAMAK-SCREEN-011 — ALL VEHICLES

> ✅ **DONE — B1 CLOSED, commit `50e9c67`.** Route + pagination + service filter + pull-to-refresh
> shipped and runtime-verified. Steps retained as history.

Goal: full list w/ pagination + filters. Legacy evidence: `AllVicelessScreen.tsx`, `AllVehiclesList`.
- Step 1 — Basic route `src/app/(app)/(tabs)/vehicles.tsx` (or a pushed route — decide and record; legacy reached it from a "see more" affordance). **RUN → VERIFY → STOP.**
- Step 2 — List from `getVehicles` with page/limit + infinite scroll (`limit` default 10 server-side). **RUN → VERIFY → STOP.**
- Step 3 — Service filter (local selected-service state, mirroring the Map's decision — **no** global store). **RUN → VERIFY → STOP.**
- Step 4 — Tap → `router.push('/vehicle/[id]')`. **RUN → VERIFY → STOP.**
- Step 5 — Empty / error / pull-to-refresh states. **RUN → VERIFY → STOP.**

### YAMAK-SCREEN-012 — VEHICLE / PROVIDER DETAILS

> ✅ **DONE (shipped + runtime-verified, commit `f87aa1a`).** Route
> `src/app/(app)/vehicle/[id].tsx`, hook `src/hooks/use-vehicle-details.ts`,
> components `src/components/vehicle-details/{ContactBar,DriverAvatar,SafetyCard,VehicleStatusPill,icons}.tsx`.
> Map marker press now pushes this route, and `VehiclesList` excludes the current vehicle.
> Learn from this screen — do **not** rebuild it.
>
> ✅ **Request flow DELIVERED (B2.3, commit `253dc04`; idempotency + 409 in B2.4C).** The screen now
> creates a tracked request through the **canonical** `POST /api/mobile/v1/requests` (authenticated,
> mobile v1). The old "contact-only / endpoint silently drops payload" statement is **SUPERSEDED**.
> The mandatory coordinate/channel/lifecycle extension is **NOT yet implemented** — it is
> **B2.5B–D** per `REQ-DEC-001…012` in `REBUILD-PLAN.md` §4.5. B2.5A is analysis only.
> Steps 1–3, 5–6 remain accurate; Step 4 is now done.

Goal: detail + available services + contact. Legacy evidence: `VehiclesDetailsScreen.tsx`, `components/vehicleDetails/*`.
APIs: `vehicles/:id` (public), `services/:id/vehicles`.
- Step 1 — Route + `vehicles/:id` fetch. **RUN → VERIFY → STOP.** ✅
- Step 2 — Render info + phone/address (`Linking.openURL`). **RUN → VERIFY → STOP.** ✅
- Step 3 — Render available services list (`services/:id/vehicles`). **RUN → VERIFY → STOP.** ✅
- Step 4 — Add request CTA → `POST /api/mobile/v1/requests`. **RUN → VERIFY → STOP.** ✅ DONE (B2.3 / B2.4C)
- Step 5 — Add WhatsApp share + `YourSaftyMatter`/`ShareWithus` blocks. **RUN → VERIFY → STOP.** ✅ (share sheet; WhatsApp via `wa.me` fallback)
- Step 6 — Loading / error (sanitized `ApiError`) / missing-vehicle states. **RUN → VERIFY → STOP.** ✅

### YAMAK-SCREEN-014 — FAVORITES

> ⏭ NOT STARTED — **B6**. No backend favorites routes exist.
> ⚠️ Verified gap: the backend has **no favorites routes at all** (grep of `routes/`) and legacy
> Vehicle Details has no favorites. Favorites is therefore **local-only persistence** — do not
> invent a favorites endpoint.

Goal: locally-persisted favorites. Legacy evidence: `FavotiesScreen.tsx`, `Favorites.store`, `components/favorites/*`.
- Step 1 — Basic route `src/app/(app)/(tabs)/favorites.tsx`. **RUN → VERIFY → STOP.**
- Step 2 — Persisted favorites list (SecureStore or AsyncStorage — decide and record) + heart toggle on vehicle cards. **RUN → VERIFY → STOP.**
- Step 3 — List ids → load/cards; fix duplicate bug (BR-023). **RUN → VERIFY → STOP.**
- Step 4 — Empty state (`NoFavorites`) + filter chips. **RUN → VERIFY → STOP.**

### YAMAK-SCREEN-015 — NOTIFICATIONS

> ⏭ NOT STARTED — **B7**. Deps on nothing remote beyond the endpoint itself. The 🔔 app-bar button
> and FCM belong to the same feature.

Goal: paginated notification list. Legacy evidence: `NotificationsScreen.tsx`, `user-notifications/mine?page=`.
- Step 1 — Basic route `src/app/(app)/(tabs)/notifications.tsx`. **RUN → VERIFY → STOP.**
- Step 2 — Fetch page 1, render list. **RUN → VERIFY → STOP.**
- Step 3 — Infinite scroll with `page` increment. **RUN → VERIFY → STOP.**
- Step 4 — Empty + pull-to-refresh states. **RUN → VERIFY → STOP.**

---

## 8. MAP & LOCATION SCREENS

### YAMAK-SCREEN-013 — MAP

> ✅ **DONE (shipped + runtime-verified, commits `66d933d` and `143bc8d`).**
> Route `src/app/(app)/(tabs)/map.tsx` → `/map`; hook `src/hooks/use-map-vehicles.ts`;
> components `src/components/map/{MapServiceChips,EnableLocationCard,MapMarkers,MapControls,MicroBanner}.tsx`;
> util `src/utils/vehicle-marker.ts`. `react-native-maps@1.28.2` installed.
> Learn from this screen — do **not** rebuild it.
>
> ⚠️ **Known baseline deviation — do NOT "fix" as part of unrelated work:**
> the dependency is pinned to `1.28.2` (an intentional override of the SDK-57 `1.27.2` pin)
> because the approved visual needs it. Recorded in `PROJECT_CONTEXT.md`.
>
> ⚠️ The map's app-bar buttons were inert in the shipped B1 baseline. ☰ Menu was resolved by the
> A7 drawer; 🔔 Notifications remains inert and is **B7** work.

Goal: nearby providers on map. Legacy evidence: `MapScreen.tsx`, `components/map/*`, `userLocation.store`.
- Step 1 — Map route registered inside the `(app)/(tabs)` group. **RUN → VERIFY → STOP.** ✅
- Step 2 — Render `<MapView>` (`provider={PROVIDER_GOOGLE}`, uncontrolled, Kuwait `initialRegion`). **RUN → VERIFY → STOP.** ✅
- Step 3 — Consume `useUserLocation()` — **never** request location on the Map itself; the single owner is `UserLocationProvider` in `src/app/(app)/_layout.tsx`. **RUN → VERIFY → STOP.** ✅
- Step 4 — Fetch `GET /services/{serviceId}/vehicles`; draw markers from `geoLocation.coordinates`. **RUN → VERIFY → STOP.** ✅
- Step 5 — Service filter chips (`MapServiceChips`, self-fetching via the shared `useServices()`) update markers. **RUN → VERIFY → STOP.** ✅
- Step 6 — Marker press → `router.push('/vehicle/[id]')` (Vehicle Details now exists). **RUN → VERIFY → STOP.** ✅
- Step 7 — Wire the app-bar ☰ Menu and 🔔 Notifications buttons once the drawer / Notifications route exist. **RUN → VERIFY → STOP.** ☰ ✅ DONE (A7) · 🔔 ⏭ B7

---

## 9. PROFILE EXTENSIONS

> ✅ **Dependency satisfied:** YAMAK-SCREEN-016 (Profile Hub) shipped in Phase A4, so Edit Profile
> and My Cars are no longer blocked by it. Both are now sequenced as **B4** and **B5**.

### YAMAK-SCREEN-017 — EDIT PROFILE

> ⏭ NOT STARTED — **B4**. (The old "blocked on SCREEN-016 / not the next screen" gate is
> superseded — the hub exists.)

Goal: update profile. Legacy evidence: `EditProfileScreen.tsx`, `ProfileMapView`, `PATCH app-users/profile`.
- Step 1 — Basic route `src/app/(app)/profile/edit.tsx`, prefilled from `useAuth()` + `app-users/profile`. **RUN → VERIFY → STOP.**
- Step 2 — Name/phone/email fields. **RUN → VERIFY → STOP.**
- Step 3 — Optional map location picker (`ProfileMapView` equivalent — a second `MapView`, not a second location *flow*). **RUN → VERIFY → STOP.**
- Step 4 — Save → `PATCH app-users/profile` + refresh the auth context user. **RUN → VERIFY → STOP.**

### YAMAK-SCREEN-018 — MY CARS

> ⏭ NOT STARTED — **B5**. (Hub dependency satisfied in Phase A4.)

Goal: CRUD cars. Legacy evidence: `MyCarScreen.tsx`, `components/Profile/myCarList/*`, `user-cars`.
- Step 1 — Basic route `src/app/(app)/profile/cars.tsx`. **RUN → VERIFY → STOP.**
- Step 2 — `GET user-cars` list + car card. **RUN → VERIFY → STOP.**
- Step 3 — Add-car modal → `POST user-cars`. **RUN → VERIFY → STOP.**
- Step 4 — Delete → confirm → `DELETE user-cars/:id`. **RUN → VERIFY → STOP.**

---

## 10. SECONDARY SCREENS

### YAMAK-SCREEN-019 — CONTACT US

> ⏭ NOT STARTED — **B8**.

Goal: contact options. Legacy evidence: `ContactUsScreen.tsx`, `messages.ts`.
- Step 1 — Static route `src/app/(app)/profile/contact.tsx` with phone/mail/WhatsApp buttons (`Linking.openURL`). **RUN → VERIFY → STOP.**

### YAMAK-SCREEN-020 — PRIVACY & POLICY

> ⏭ NOT STARTED — **B8**.

Goal: legal content. Legacy evidence: `PrivacyAndPolicyScreen.tsx`.
- Step 1 — Modal route (`src/app/(app)/profile/privacy.tsx` + `<Stack.Screen options={{ presentation: 'modal' }} />`) with text (from `app-setting` or static). **RUN → VERIFY → STOP.**

### YAMAK-SCREEN-021 — JOIN US

> ⏭ NOT STARTED — **B8**.

Goal: static join-us content. Legacy evidence: `JoinUsScreen.tsx`.
- Step 1 — Static content + contact CTA. **RUN → VERIFY → STOP.**

### YAMAK-SCREEN-022 — ABOUT YAMAK APP (PLANNED ONLY)

> ⛔ NOT TO BE IMPLEMENTED in this pass (user directive) — documented for completeness.

Goal: about/branding page. Legacy evidence: `AboutYamakAppScreen.tsx`.
- Step 1..N — Static content, app version (from `app.json`, not a `device-info` dependency), follow-us links.

### YAMAK-SCREEN-023 — FRESHCHAT

> ⛔ **PLANNED — NOT YET MIGRATED (B10).** No Freshchat SDK is installed in YamakExpoNew. Requires the
> Freshchat Expo plugin and its API credentials, which are not present. Do not scaffold it now.

Goal: support chat. Legacy evidence: `FreshCharScreen.tsx`, `freshchat.config.ts`.
- Step 1 — SDK init at app start (add `expo-freshchat` plugin + config, once approved). **RUN → VERIFY → STOP.**
- Step 2 — Screen embedding chat widget + route. **RUN → VERIFY → STOP.**

### YAMAK-SCREEN-024 — NO NETWORK

> ⏭ NOT STARTED — **B9**.

Goal: offline state + retry. Legacy evidence: `NoNetworkScreen.tsx`, NetInfo.
- Step 1 — Route `src/app/(app)/no-network.tsx`; show when offline (or on error). **RUN → VERIFY → STOP.**
- Step 2 — Retry button re-fetches. **RUN → VERIFY → STOP.**

---

## 11. STUB / OPTIONAL SCREENS (user decision ahead)

> All four are **legacy stubs**. Rebuild only on an explicit user decision — never build them
> speculatively, and never count them toward parity.

### YAMAK-SCREEN-027 — SEARCH (optional)
- Legacy stub `SearchScreen.tsx`; plan: step 1 route, step 2 input, step 3 filter `GET vehicles` by query, step 4 results list. **RUN → VERIFY → STOP after each.**

### YAMAK-SCREEN-025 — SETTINGS (optional)
- Legacy stub; plan to be defined when user confirms scope.

### YAMAK-SCREEN-026 — MESSAGES (optional)
- Legacy stub; confirm product intent before planning.

### YAMAK-SCREEN-028 — EMAIL VALIDATIONS (optional)
- Legacy stub; confirm if needed.

### YAMAK-SCREEN-029 — FORM / FORMAUTH
- Legacy duplicate → SKIP. Do not rebuild.

---

## 12. HISTORICAL ORDER TABLE (A–G letters — SUPERSEDED)

> ⛔ **NON-CURRENT.** The A–G tables below are a 2026-10 snapshot and are **not** the build
> sequence. They are preserved to explain how the project reached its current state.
>
> **CURRENT ROADMAP:** `REBUILD-PLAN.md` §5 (Phase B feature numbering B1…B11) + §6 (single next
> step). **CURRENT STATE:** `PROJECT_CONTEXT.md`. **TASK LEDGER:**
> `11-rebuild-backlog.md` (supporting). `12-rebuild-order.md` is likewise historical.
>
> The historical CLI sequence (Phase 0 SETUP-001…005 + the old 1–32 table) is **SUPERSEDED** —
> the project already exists as an Expo app, so there is nothing to scaffold.

### Phase A — Authenticated App Shell Completion ✅ CLOSED (historically "🔴 CURRENT PHASE")

| # | Task | Screen | Route | Depends on | Status |
|---|---|---|---|---|---|
| A1 | Session gate for the `(app)` group | — | `src/app/(app)/_layout.tsx` | AuthProvider exists | ✅ **DONE** 2026-10-02 — also gated `index.tsx` + `register.tsx` |
| A2 | Email OTP → authenticated app transition | SCREEN-005 | `src/app/email-otp.tsx` | A1 | ✅ **DONE** 2026-10-02 (no dead end) |
| A3 | Home tab (mount verified components) | SCREEN-010 | `(app)/(tabs)/home.tsx` | A1 | ✅ **DONE** |
| A4 | **Profile Hub tab + logout** | SCREEN-016 | `(app)/(tabs)/profile.tsx` | A1 | ✅ **DONE** |
| A5 | Tab bar wiring (Home · Map · Profile) | — | `(app)/(tabs)/_layout.tsx` | A3, A4 | ✅ **DONE** |
| A6 | Onboarding (post-auth, first launch) | SCREEN-009 | `(app)/onboarding.tsx` | A5 | ✅ **DONE** (backend-managed) |
| A7 | Drawer | — | `(app)/_layout.tsx` | A5 | ✅ **DONE** (approved UI) |

### Phase B — Profile Hub Contents (historical → current B6/B7/B8)

| # | Task | Screen | Depends on | Status |
|---|---|---|---|---|
| B1 | Favorites (local-only persistence) | SCREEN-014 | A3 | ⏭ current: **B6** |
| B2 | Notifications | SCREEN-015 | A3 | ⏭ current: **B7** |
| B3 | Profile sub-routes reachable from the hub | — | A3 | ⏭ current: **B4/B5/B8** |

### Phase C — All Vehicles + Request (historical → B1 + B2)

| # | Task | Screen | Depends on | Status |
|---|---|---|---|---|
| C1 | All Vehicles list + filters | SCREEN-011 | A2 | ✅ **DONE** as **B1**, `50e9c67` |
| C2 | Vehicle Details ↔ list/marker cross-push polish | SCREEN-012 | C1 | ✅ **DONE** |
| C3 | `POST /api/mobile/v1/requests` | SCREEN-012 | — | ✅ **DONE** as **B2.3/B2.4C**; coordinate/channel/lifecycle extension = **B2.5B–D** (the old "BLOCKED" status is superseded) |

### Phase D — Profile Features (historical → B4/B5)

| # | Task | Screen | Depends on | Status |
|---|---|---|---|---|
| D1 | Edit Profile | SCREEN-017 | Hub ✅ (A4) | ⏭ current: **B4** |
| D2 | My Cars CRUD | SCREEN-018 | Hub ✅ (A4) | ⏭ current: **B5** |

### Phase E — Secondary Screens (historical → B8/B9/B10)

| # | Task | Screen | Depends on | Status |
|---|---|---|---|---|
| E1 | Contact Us | SCREEN-019 | Hub ✅ | ⏭ current: **B8** |
| E2 | Privacy & Policy | SCREEN-020 | Hub ✅ | ⏭ current: **B8** |
| E3 | Join Us | SCREEN-021 | Hub ✅ | ⏭ current: **B8** |
| E4 | No Network | SCREEN-024 | — | ⏭ current: **B9** |
| E5 | About Yamak | SCREEN-022 | — | ⛔ PLANNED ONLY (user directive) |
| E6 | Freshchat | SCREEN-023 | SDK not installed | ⛔ NOT YET MIGRATED — current: **B10** |

### Phase F — Deferred Auth & Integrations (historical → B10)

| # | Task | Screen | Depends on | Status |
|---|---|---|---|---|
| F1 | Login | SCREEN-001 | A1 ✅ | ⏭ current: **B10** |
| F2 | Forgot Password | SCREEN-008 | F1 | ⏭ current: **B10** |
| F3 | Reset OTP | SCREEN-006 | F2 | ⏭ current: **B10** |
| F4 | New Password | SCREEN-007 | F3 | ⏭ current: **B10** |
| F5 | Phone Login | SCREEN-003 | A1 ✅ | ⏭ current: **B10** |
| F6 | Phone OTP | SCREEN-004 | F5 | ⏭ current: **B10** |
| F7 | Email OTP — resend + countdown | SCREEN-005 | A1 ✅ | 🟡 PARTIAL (success transition ✅ A2) |
| F8 | Google Sign-In / Firebase / Sentry | — | not installed | ⛔ PLANNED — current: **B10** |

### Phase G — Legacy Parity Audit (historical → B11)

| # | Task | Depends on | Status |
|---|---|---|---|
| G1 | Screen-by-screen functional diff vs legacy | Phases A–E | ⏭ current: **B11** |
| G2 | API contract diff vs `04-api-catalog.md` | A–E | ⏭ current: **B11** |
| G3 | i18n / RTL audit (`ar`/`en`) | A–E | ⏭ current: **B11** |
| G4 | Confirm no legacy defect was ported | A–E | ⏭ current: **B11** |

### Optional / user decision (never planned speculatively)

| Task | Screen | Status |
|---|---|---|
| Search | SCREEN-027 | ⏭ user decision |
| Settings | SCREEN-025 | ⏭ user decision |
| Messages | SCREEN-026 | ⏭ user decision |
| Email validations | SCREEN-028 | ⏭ user decision |
| Form / FormAuth | SCREEN-029 | ⛔ SKIP (legacy duplicate) |

### ⛔ Ordering rules — historical (current rules live in `REBUILD-PLAN.md` §5.7)

1. **Hub before Edit Profile / My Cars.** ✅ satisfied — the hub shipped in A4.
2. **A1 precedes every route under `(app)`.** ✅ satisfied.
3. **A2/A3 precede A4, and A4 precedes A5/A6.** ✅ satisfied.
4. **~~C3 (`POST /requests`) stays blocked.~~** ✅ **SUPERSEDED** — the canonical
   `POST /api/mobile/v1/requests` shipped in B2.3 (commit `253dc04`). What remains is the
   mandatory coordinate/channel/lifecycle extension in **B2.5B–D**, not a permission block.
5. **No screen may be started before its dependencies above are ✅.** Still a general rule;
   see `REBUILD-PLAN.md` §5.7 for the current dependency set.

## 13. Completion checklist per step, then per screen

Every single step (setup, screen, API, native, config) is COMPLETE only when ALL of these pass:

- [ ] Legacy referenced before writing code (LEGACY YAMAK = the reference).
- [ ] ONE small change implemented only.
- [ ] Project builds.
- [ ] App launches.
- [ ] Current behavior verified (compare with legacy expected behavior).
- [ ] No new blocking runtime error.
- [ ] Result explained to me (what/why/files/commands/expected/verification).
- [ ] I explicitly confirm success (`Done` / `Working` / `Success` / `تم` / `انتقل`).
- [ ] Project remains in a runnable state (no half-finished architecture or broken imports).
- [ ] Git commit suggested but NOT executed without my request.

Screen-level completion additionally requires:
- [ ] All steps done, each passing its RUN → VERIFY → STOP gate.
- [ ] Screen behaves identically to legacy (per `02-screen-inventory.md`).
- [ ] APIs used match `04-api-catalog.md`; no invented endpoints.
- [ ] i18n: no hardcoded strings; ar/en keys added.
- [ ] Business rules from `09-business-rules.md` honored.
- [ ] No secrets/logs leaked in code.
- [ ] No secrets/logs leaked in code.