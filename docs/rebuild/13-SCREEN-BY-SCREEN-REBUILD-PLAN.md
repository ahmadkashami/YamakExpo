# YAMAK MOBILE — 13. SCREEN-BY-SCREEN REBUILD PLAN

> **Current platform context:** `YamakExpoNew` is the active rebuild target, using Expo + React Native + Expo Router. The React Native CLI sections below are historical context and are superseded by this note. `YamakMobileNew` is superseded and is not the active target.
>
> THE MASTER REBUILD DOCUMENT.
> Strategy: **ONE SCREEN AT A TIME** and **ONE SMALL STEP AT A TIME**.
> A step = one small, testable change. After each step there is a **STOP** gate.
> At every STOP: save, run the app, confirm the step works, then optionally `git commit`.
> NEVER auto-continue beyond a STOP. Wait for explicit confirmation.
>
> The existing backend (base `https://yamak-kw.com/api/mobile/v1/`) is READY. Do NOT redesign it.
> We build OUR OWN app front-end against those contracts, learning while we build.
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
Check current React Native approach
    ↓
Implement cleanly in NEW YamakMobile
    ↓
Run
    ↓
Compare with legacy expected behavior
    ↓
Verify
    ↓
STOP
```

### 📖 OFFICIAL REACT NATIVE DOCUMENTATION RULE

For the NEW project's technical foundation, React Native's CURRENT official documentation is the
primary authority — especially for: creating the project, environment setup, Android requirements,
React Native CLI, project structure, native configuration, and current supported practices.
Use `https://reactnative.dev/docs/environment-setup` and the relevant current official docs.

Therefore:
- **LEGACY PROJECT** = source of truth for Yamak **functionality and requirements**.
- **CURRENT OFFICIAL REACT NATIVE DOCUMENTATION** = source of truth for how the new React Native
  application is **technically created and configured**.

### 🔬 NO LARGE CHANGES

Keep every implementation step intentionally small.

- **BAD:** "Create authentication module" (then move on).
- **GOOD:** Step 1: Create LoginScreen → RUN → VERIFY → STOP. Step 2: Add logo → RUN → VERIFY → STOP.
  Step 3: Add email input → RUN → VERIFY → STOP. Step 4: Add password input → RUN → VERIFY → STOP.
  Step 5: Add Login button → RUN → VERIFY → STOP. And so on.

### ✅ PROJECT MUST ALWAYS REMAIN RUNNABLE

After every completed step, the new YamakMobile project should be in a runnable state. Avoid
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

1. Start with **PHASE 0** (see below) — the clean React Native application MUST exist and run
   BEFORE any Yamak screen work (`YAMAK-SCREEN-001`, `YAMAK-SCREEN-002`, or any other).
2. Read each task's "Goal + evidence". The legacy Yamak project is ONLY a functional/design/API
   reference — never a template for the new project structure.
3. Follow the **GLOBAL MANDATORY RULES** (Section 0) for every step:
   **REFERENCE LEGACY → UNDERSTAND → EXPLAIN → IMPLEMENT ONE SMALL CHANGE → RUN → VERIFY → STOP**
   → wait for my explicit confirmation → then the next step.
4. Never auto-continue past a STOP. One small step per execution unless I ask for more.

## 2. First task directive (user rule)

- The rebuild starts with **YAMAK-SETUP-001 → 005 (PHASE 0)**. NO screen (Login, Register,
  Forgot Password, Onboarding, or any other) is started before Phase 0 is complete and understood.
- Login and About Yamak App are **documented in this plan but NOT to be implemented in this pass**.
- We are rebuilding Yamak with **React Native WITHOUT a framework**, using the CURRENT official
  React Native documentation (`https://reactnative.dev/docs/environment-setup`) as the authority.

## 3. Global conventions (applied to every screen)

- Colors: ONLY the **approved Yamak New design tokens** (Section 4 — PHASE 1). Legacy `AppColorsTheme2`
  (`primary #002F6C`, `secondary #F7B123`, `offWhite #f4f1f6`, `gray #ABB0B8`) is a REFERENCE ONLY and was
  rejected as the authority (gold-on-white ≈1.9:1 contrast fails AA). Nothing is used until **approval gate
  YAMAK-DESIGN-001** is passed and the approved token file is put in the new `src/theme/`.
- Fonts: only the approved Yamak New type scale. Legacy `Roboto-Medium`/`Roboto-MedItalic` + `AppSizes`
  (12/14/16/18/20/24/32) are reference only.
- Text: i18n-wrapper of the approved Typography components (Arabic-aware, proper RTL layout — legacy `AppText`
  mis-set `textAlign:"left"` for Arabic); never hardcode strings — always i18n keys.
- Icons: `AppIcon` wrapper (Ionicons/AntDesign/Material/MaterialCommunityIcons/Entypo/FontAwesome/Fontisto/FontAwesome5).
- API: central `makeApiCall({method,url,data,params})`; Bearer token auto-attached; NetInfo offline guard built-in.
- Errors: global `AppFlashMessage` via `useErrorStore`.
- Routes: constants in `ScreenNames.ts`; register each new screen in the relevant navigator file.

## 4. Just-in-time rules

- Create `src/apis/<feature>.api.ts` only when the first screen needs that endpoint.
- Create a Zustand store only when the first screen needs shared state.
- Create a navigator only when the first screen that lives in it is built.
- Create UI components only when a screen reuses them twice or more.
- Never port dead code (Form/FormAuth, custom-IP modal, duplicate favorites store, Themes 1&3).

---

# PHASE 0 — CREATE AND UNDERSTAND THE CLEAN REACT NATIVE APPLICATION

> This phase MUST happen before `YAMAK-SCREEN-001`, `YAMAK-SCREEN-002`, or any other Yamak screen.
> Authority = the CURRENT official React Native documentation (`https://reactnative.dev/docs/environment-setup`),
> NOT versions copied from the legacy Yamak project.
>
> We rebuild Yamak with React Native WITHOUT a framework. The legacy project is ONLY a
> functional/design/API reference. Do NOT use its old project structure (or its `package.json`,
> `android/`, Gradle, RN configs, `node_modules`) as the template for the new application.

---

## YAMAK-SETUP-001 — Verify Development Environment

**Purpose:** Before creating Yamak, verify that this Windows machine satisfies the CURRENT
official React Native requirements. Consultation only — nothing is installed or modified here.

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

## YAMAK-SETUP-002 — Create Clean React Native Project

**This will be the FIRST actual implementation task later** (per user directive, implementation
does not start in the documentation phase).

- Use the CURRENT official React Native CLI command for creating a React Native project
  WITHOUT a framework. Determine the exact command from the official documentation
  at implementation time.
- Project name: **`YamakMobile`** (use exactly this).
- Do NOT copy `package.json` from the legacy project.
- Do NOT copy `node_modules`.
- Do NOT copy `android/`.
- Do NOT copy old Gradle configuration.
- Do NOT copy old React Native configuration.
- The new application MUST start from the clean official React Native template.

When the project is generated, learn what each top-level item is:

| Path | What it is |
|---|---|
| `android/` | Native Android project (Gradle + Kotlin/Java). |
| `ios/` | Native iOS project (Xcode + Swift/Obj-C). |
| `src/` | DOES NOT EXIST in the clean template — we create it later, only when Yamak screens need it. |
| `App.tsx` | Root React component — first thing rendered (this IS the app's UI entry). |
| `index.js` | JS entry point that registers `App` with React Native. |
| `package.json` | Manifest of JS dependencies + scripts. |
| `metro.config.js` | Metro (JS bundler) configuration. |
| `babel.config.js` | Babel (JS transpiler) configuration. |
| `tsconfig.json` | TypeScript compiler configuration. |
| `.gitignore` · `.prettierrc` · `eslint` config | Generated tooling defaults. |

Clearly distinguish:

- **FILES GENERATED BY REACT NATIVE** → `package.json`, `App.tsx`, `index.js`, `metro.config.js`,
  `babel.config.js`, `tsconfig.json`, `android/`, `ios/` etc. — come from the official template.
- **FILES WE WILL CREATE FOR YAMAK** → `src/`, plus Yamak-specific config, services, stores,
  screens, and assets — added ONLY when the current screen needs them (JUST-IN-TIME).

**RUN → VERIFY → STOP after project creation.**

---

## YAMAK-SETUP-003 — Run Clean Android Application

Before adding ANY Yamak code:

1. **Start Metro** — the JavaScript bundler/dev server (typically `npx react-native start`).
2. **Start the Android emulator/device** — from Android Studio or `emulator -list-avds`/`adb devices`.
3. **Run the clean React Native Android application** — typically `npx react-native run-android`.
4. **Confirm the default React Native screen launches successfully.**

Concepts to understand at this stage:

- **Metro** = the bundler that serves the JS bundle to the app; it watches your files and
  rebuilds the bundle on change (fast reload / live reload).
- **Gradle** = the Android build system; it resolves dependencies, compiles Java/Kotlin, packages
  the APK, and wires the React Native native libraries for your emulator/device.
- **adb** = the Android Debug Bridge; it connects the build to a running emulator/device so the
  APK installs and starts, and streams logs (searchable via `adb logcat`).
- **How JavaScript reaches the Android application:** Metro builds the JS bundle → the installed
  APK (native part) loads it either from the Metro dev server (debug) or from the packaged bundle
  (release) → React Native engine (Hermes) executes it → it renders `App.tsx` on the native screen.

> ### ⛔ HARD GATE
> If the clean React Native application does NOT build and launch:
> **STOP.** Do NOT install Yamak dependencies. Do NOT create screens. Do NOT copy assets.
> Do NOT configure Firebase. Do NOT configure Maps. Do NOT continue.
> The clean application must work FIRST.

**RUN → VERIFY → STOP.**

---

## YAMAK-SETUP-004 — Understand the Clean Project

Before changing anything, study the generated project (no Yamak architecture yet):

Explain at a beginner level:

- `App.tsx`, `index.js`, `package.json`, `android/`, `ios/`, `metro.config.js`,
  `babel.config.js`, `tsconfig.json`.
- Android specifics:
  - `android/app/` — the app module: it holds your application's Android source and resources.
  - `AndroidManifest.xml` — the Android manifest: declares the app, its main activity, and
    permissions (e.g. INTERNET, location).
  - `build.gradle` — Gradle build scripts: project-level (`android/build.gradle`) and app-level
    (`android/app/build.gradle`) — versions, dependencies, signing, etc.
  - `settings.gradle` — declares which modules the build includes.
  - `MainActivity` — the Android Activity that hosts the React Native experience.
  - `MainApplication` — the Application class: initializes React Native and native modules.

The relationship:

```
index.js              ← native entry calls into React Native to start the JS app
   ↓                  (registers the root component)
App.tsx               ← React component tree the user sees
   ↓
React Native (JS)     ← executed by the JS/Hermes engine, drives UI natively
   ↓
Android native app    ← Activity/Application host that renders that UI on screen
```

**Do NOT introduce Yamak architecture yet.**

**RUN → VERIFY → STOP.**

---

## YAMAK-SETUP-005 — Create the First Yamak `src` Structure

ONLY after the clean project works and its structure is understood:

- Create ONLY the minimum structure needed for the first Yamak screen.
- Do NOT create the entire future architecture.
- Follow the JUST-IN-TIME ARCHITECTURE rule: do NOT automatically create `api/`, `store/`,
  `services/`, `navigation/`, `hooks/`, `utils/` — unless the current implementation step
  actually needs them.
- The first Yamak screen comes AFTER this task (per the IMPORTANT ORDER CHANGE below).

**RUN → VERIFY → STOP.**

---

## IMPORTANT ORDER CHANGE

The beginning of the rebuild order is now FIXED:

```
YAMAK-SETUP-001 — Verify environment
        ↓
YAMAK-SETUP-002 — Create clean React Native application
        ↓
YAMAK-SETUP-003 — Run clean Android application
        ↓
        ⛔ HARD GATE
        ↓
YAMAK-SETUP-004 — Understand generated project structure
        ↓
YAMAK-SETUP-005 — Add minimum Yamak structure
        ↓
First Yamak screen
        ↓
Next screen
        ↓
...
```

Do NOT start with Forgot Password, Register, Login, Onboarding, or any other screen before this
setup phase is complete.

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

### YAMAK-SCREEN-001 — LOGIN (exemplar; documented fully)

Goal: email+password screen that authenticates against `auth/login` and unlocks the app.
Evidence: `src/screens/authScreens/loginScreen.tsx`, `loginSchema.ts`, `Auth.api.ts`, `auth.store.ts`.
Learning concepts: View/Text/TextInput, StyleSheet, keyboard handling, Formik+Yup, axios, Zustand persist, navigation gates.

- Step 1 — Create `src/screens/LoginScreen.tsx` returning a basic centered `<View>` with an empty `<Text>`. Register it in a new `AuthStackNavigator` (`Login`). **RUN → VERIFY → STOP.**
- Step 2 — Add the Yamak logo image at the top (from `assets/images/appLogo.png`). **RUN → VERIFY → STOP.**
- Step 3 — Add the first `TextInput` (email) with label "Email". **RUN → VERIFY → STOP.**
- Step 4 — Add the password `TextInput` (secureTextEntry) with label "Password". **RUN → VERIFY → STOP.**
- Step 5 — Add the "Login" button (`FilledButton`, primary background, secondary text). **RUN → VERIFY → STOP.**
- Step 6 — Add local state (`useState`/Formik) holding email + password; wire console.log on submit. **RUN → VERIFY → STOP.**
- Step 7 — Add Yup validation (`loginValidationSchema`): valid email, password min 8; show errors under inputs. **RUN → VERIFY → STOP.**
- Step 8 — Add `src/apis/auth.api.ts` with `login({email,password})` → `makeApiCall("post","auth/login")`. **RUN → VERIFY → STOP.**
- Step 9 — Add `src/store/auth.store.ts` (Zustand persist `auth`, AsyncStorage) with `authenticate(token,user)`; call on success; verify the token gate flips to the main area and persists after restart. **RUN → VERIFY → STOP.**
- Step 10 — Add error UI: on failure show flash message; special-case `"user not registered"`. **RUN → VERIFY → STOP.**
- Step 11 — Add "Forgot password?" link → Forgot-Password form (SCREEN-008). **RUN → VERIFY → STOP.**
- Step 12 — Add "Sign up" link → Register (SCREEN-002); conditional social buttons (after NATIVE-001/002). **RUN → VERIFY → STOP.**
- DONE when: valid login works end-to-end; invalid shows errors; token survives restart; logout returns here.

### YAMAK-SCREEN-002 — REGISTER
Goal: create account via `auth/signup`. Evidence: `registerScreen.tsx`, `registerValidationSchema`.
Concepts: multi-field forms, terms checkbox, country code.
- Step 1 — Basic screen + registration in AuthStack. **RUN → VERIFY → STOP.**
- Step 2 — ⛔ **Apply the approved Yamak New branding foundation** (design tokens + theme components + Yamak logo) per `YAMAK-DESIGN-001`. **BLOCKED until the design approval gate passes** — do not apply legacy colors/fonts. **RUN → VERIFY → STOP.**
- Step 3 — Add Name input. **RUN → VERIFY → STOP.**
- Step 4 — Add Email input. **RUN → VERIFY → STOP.**
- Step 5 — Add Phone input + country code picker (`CountryPicker` style). **RUN → VERIFY → STOP.**
- Step 6 — Add Password input + Terms checkbox (`isAgreed`). **RUN → VERIFY → STOP.**
- Step 7 — Yup validation (name min 3, email, phone regex, password min 8, isAgreed true). **RUN → VERIFY → STOP.**
- Step 8 — `signup` API wrapper (`register` body `{name,email,phone}`). **RUN → VERIFY → STOP.**
- Step 9 — On success navigate to Email OTP (SCREEN-005) and pass email. **RUN → VERIFY → STOP.**
- Step 10 — Add "Already have account?" link → Login. **RUN → VERIFY → STOP.**

### YAMAK-SCREEN-008 — FORGOT PASSWORD (email form)
Goal: request reset code. Evidence: `components/auth/EmailForgotPassword.tsx`, `auth/send-reset-password`.
- Step 1 — Basic screen + route. **RUN → VERIFY → STOP.**
- Step 2 — Email field + validation. **RUN → VERIFY → STOP.**
- Step 3 — API wrapper `sendResetPassword(email)`. **RUN → VERIFY → STOP.**
- Step 4 — On success → Reset OTP (SCREEN-006). **RUN → VERIFY → STOP.**

### YAMAK-SCREEN-006 — RESET OTP
Goal: validate reset code. Evidence: `otpResetPasswordScreen.tsx`, `auth/check-reset-password`.
- Step 1 — Basic screen + route. **RUN → VERIFY → STOP.**
- Step 2 — Code input (6-digit style, `CodeAuthModel`). **RUN → VERIFY → STOP.**
- Step 3 — Resend handler (calls SCREEN-008's API again) + countdown. **RUN → VERIFY → STOP.**
- Step 4 — `checkResetPassword(email, code)`. **RUN → VERIFY → STOP.**
- Step 5 — Success → New Password screen (SCREEN-007). **RUN → VERIFY → STOP.**

### YAMAK-SCREEN-007 — NEW PASSWORD
Goal: set new password. Evidence: `NewPasswordScreen.tsx`, `resetPasswordValidationSchema`, `auth/reset-password`.
- Step 1 — Basic screen + route + two password fields. **RUN → VERIFY → STOP.**
- Step 2 — Yup: min 8 + confirm match. **RUN → VERIFY → STOP.**
- Step 3 — `resetPassword(email, password)`. **RUN → VERIFY → STOP.**
- Step 4 — Success → back to Login with success message. **RUN → VERIFY → STOP.**

### YAMAK-SCREEN-003 — PHONE LOGIN (auth)
Goal: request SMS code. Evidence: `authScreen.tsx`, `auth/sendCode`.
- Step 1 — Basic screen + route. **RUN → VERIFY → STOP.**
- Step 2 — Phone input + country code picker. **RUN → VERIFY → STOP.**
- Step 3 — `sendCode(phone)`. **RUN → VERIFY → STOP.**
- Step 4 — Success → OTP (SCREEN-004), pass phone. **RUN → VERIFY → STOP.**

### YAMAK-SCREEN-004 — PHONE OTP VERIFICATION
Goal: verify SMS code and authenticate. Evidence: `otpVerificationScreen.tsx`, `auth/checkCode`.
- Step 1 — Basic screen + route (no animation). **RUN → VERIFY → STOP.**
- Step 2 — Code input + resend + countdown. **RUN → VERIFY → STOP.**
- Step 3 — `checkCode(phone, code)`. **RUN → VERIFY → STOP.**
- Step 4 — On success load `app-users/profile` then `authenticate`. **RUN → VERIFY → STOP.**

### YAMAK-SCREEN-005 — EMAIL OTP VERIFICATION
Goal: complete signup. Evidence: `otpEmailVerificationScreen.tsx`, `auth/verify-email`.
- Step 1 — Basic screen + route. **RUN → VERIFY → STOP.**
- Step 2 — Code input + resend. **RUN → VERIFY → STOP.**
- Step 3 — `emailVerify(email, code)`. **RUN → VERIFY → STOP.**
- Step 4 — Success → proceed into app (or back to Login). **RUN → VERIFY → STOP.**

---

## 6. APP SHELL SCREENS

### YAMAK-SCREEN-009 — ONBOARDING
Goal: first-launch intro. Evidence: `OnBoardingScreen.tsx`, `CarouselCards`, `appReady.store` (`isFirstLunch`).
Concepts: FlatList/carousel, Lottie, first-launch flag.
- Step 1 — Basic screen + route inside `DrawerStackNavigator` guarded by `isFirstLunch`. **RUN → VERIFY → STOP.**
- Step 2 — Add carousel of 3 intro slides (images + titles). **RUN → VERIFY → STOP.**
- Step 3 — Add "Get started" button → clears flag, navigates to drawer. **RUN → VERIFY → STOP.**
- Step 4 — Add language picker (EN/AR) persisting to `lang`. **RUN → VERIFY → STOP.**

### YAMAK-SCREEN-016 — PROFILE HUB
Goal: display user + menu. Evidence: `ProfileScreen.tsx`, `Profile*` components, `app-users/profile`.
Concepts: fetch-on-mount, store refresh, grid of navigation buttons.
- Step 1 — Basic screen + registration in `ProfileStack` (tab 3). **RUN → VERIFY → STOP.**
- Step 2 — Show user name/email from `auth` store. **RUN → VERIFY → STOP.**
- Step 3 — Fetch `app-users/profile` and refresh store (`updateUserInfo`). **RUN → VERIFY → STOP.**
- Step 4 — Add heading row (icon + labels). **RUN → VERIFY → STOP.**
- Step 5 — Add buttons grid: Edit Profile / My Cars / Favorites / Notifications / Contact Us / Privacy / Join Us / About / Settings / Messages / FreshChat / Logout. Each navigates (or shows stub note). **RUN → VERIFY → STOP.**
- Step 6 — Logout = `removeAuthentication()`. **RUN → VERIFY → STOP.**

---

## 7. HOME & DATA SCREENS

### YAMAK-SCREEN-010 — HOME
Goal: services + adds + vehicles dashboard. Evidence: `HomeScreen.tsx`, `components/home/*`, `services`, `adds`, `vehicles`.
Concepts: parallel fetching, loading placeholders, horizontal lists, localized names.
- Step 1 — Basic screen + custom header (logo right, map button left) in `HomeStackNavigator`. **RUN → VERIFY → STOP.**
- Step 2 — Add `services` store + fetch `GET services`; render services grid (localized names). **RUN → VERIFY → STOP.**
- Step 3 — Add `adds` store + `GET adds`; render ads carousel. **RUN → VERIFY → STOP.**
- Step 4 — Add vehicles store + `GET vehicles` (page 1, limit 10, userLocation params); render vehicles strip. **RUN → VERIFY → STOP.**
- Step 5 — Add loading placeholders for all three sections. **RUN → VERIFY → STOP.**
- Step 6 — Wire taps: service→filter, vehicle→Vehicle Details, "see more"→All Vehicles, search→Search modal. **RUN → VERIFY → STOP.**

### YAMAK-SCREEN-011 — ALL VEHICLES
Goal: full list w/ pagination + filters. Evidence: `AllVicelessScreen.tsx`, `AllVehiclesList`.
- Step 1 — Basic screen + route. **RUN → VERIFY → STOP.**
- Step 2 — List from `GET vehicles` with page/limit + infinite scroll. **RUN → VERIFY → STOP.**
- Step 3 — Service filter (uses `selectedServiceId`). **RUN → VERIFY → STOP.**
- Step 4 — Tap → Vehicle Details. **RUN → VERIFY → STOP.**

### YAMAK-SCREEN-012 — VEHICLE / PROVIDER DETAILS
Goal: detail + available services + request. Evidence: `VehiclesDetailsScreen.tsx`, `components/vehicleDetails/*`.
APIs: `vehicles/:id`, `services/:id/vehicles`, `requests`.
- Step 1 — Basic screen + route + `vehicles/:id` fetch. **RUN → VERIFY → STOP.**
- Step 2 — Render info + phone/address (open maps/phone). **RUN → VERIFY → STOP.**
- Step 3 — Render available services list (`services/:id/vehicles`). **RUN → VERIFY → STOP.**
- Step 4 — Add request CTA → `POST requests`. **RUN → VERIFY → STOP.**
- Step 5 — Add WhatsApp share (`getWhatsAppMessage`) + `YourSaftyMatter`/`ShareWithus` blocks. **RUN → VERIFY → STOP.**
- Step 6 — Add placeholder loading state. **RUN → VERIFY → STOP.**

### YAMAK-SCREEN-014 — FAVORITES
Goal: locally-persisted favorites. Evidence: `FavotiesScreen.tsx`, `Favorites.store`, `components/favorites/*`.
- Step 1 — Basic screen + route. **RUN → VERIFY → STOP.**
- Step 2 — `favorites` store (persist `favorites` key) + heart toggle on cards. **RUN → VERIFY → STOP.**
- Step 3 — List ids → load/cards; fix duplicate bug (BR-023). **RUN → VERIFY → STOP.**
- Step 4 — Empty state (`NoFavorites`) + filter chips. **RUN → VERIFY → STOP.**

### YAMAK-SCREEN-015 — NOTIFICATIONS
Goal: paginated notification list. Evidence: `NotificationsScreen.tsx`, `user-notifications/mine?page=`.
- Step 1 — Basic screen + route. **RUN → VERIFY → STOP.**
- Step 2 — Fetch page 1, render list. **RUN → VERIFY → STOP.**
- Step 3 — Infinite scroll with `page` increment. **RUN → VERIFY → STOP.**
- Step 4 — Empty + pull-to-refresh states. **RUN → VERIFY → STOP.**

---

## 8. MAP & LOCATION SCREENS

### YAMAK-SCREEN-013 — MAP
Goal: nearby providers on map. Evidence: `MapScreen.tsx`, `components/map/*`, `userLocation.store`.
- Step 1 — Register `Map` tab (requires NATIVE-005 Maps SDK). **RUN → VERIFY → STOP.**
- Step 2 — Render `<MapView>` with initial region. **RUN → VERIFY → STOP.**
- Step 3 — Get device location → `userLocation` store + AsyncStorage. **RUN → VERIFY → STOP.**
- Step 4 — Fetch `GET vehicles` with lat/lng; draw markers. **RUN → VERIFY → STOP.**
- Step 5 — Service filter chips update markers. **RUN → VERIFY → STOP.**
- Step 6 — Card detail on marker tap + request CTA. **RUN → VERIFY → STOP.**

---

## 9. PROFILE EXTENSIONS

### YAMAK-SCREEN-017 — EDIT PROFILE
Goal: update profile. Evidence: `EditProfileScreen.tsx`, `ProfileMapView`, `PATCH app-users/profile`.
- Step 1 — Basic screen + route, prefill from store. **RUN → VERIFY → STOP.**
- Step 2 — Name/phone/email fields. **RUN → VERIFY → STOP.**
- Step 3 — Optional map location picker. **RUN → VERIFY → STOP.**
- Step 4 — Save → PATCH + refresh store. **RUN → VERIFY → STOP.**

### YAMAK-SCREEN-018 — MY CARS
Goal: CRUD cars. Evidence: `MyCarScreen.tsx`, `components/Profile/myCarList/*`, `user-cars`.
- Step 1 — Basic screen + route. **RUN → VERIFY → STOP.**
- Step 2 — `GET user-cars` list + car card. **RUN → VERIFY → STOP.**
- Step 3 — Add-car modal → `POST user-cars`. **RUN → VERIFY → STOP.**
- Step 4 — Delete → confirm → `DELETE user-cars/:id`. **RUN → VERIFY → STOP.**

---

## 10. SECONDARY SCREENS

### YAMAK-SCREEN-019 — CONTACT US
Goal: contact options. Evidence: `ContactUsScreen.tsx`, `messages.ts`.
- Step 1 — Static screen with phone/mail/WhatsApp buttons (Linking.openURL). **RUN → VERIFY → STOP.**

### YAMAK-SCREEN-020 — PRIVACY & POLICY
Goal: legal modal. Evidence: `PrivacyAndPolicyScreen.tsx`.
- Step 1 — Modal screen (`presentation:"modal"`) with text (from `app-setting` or static). **RUN → VERIFY → STOP.**

### YAMAK-SCREEN-021 — JOIN US
Goal: static join-us content. Evidence: `JoinUsScreen.tsx`.
- Step 1 — Static content + contact CTA. **RUN → VERIFY → STOP.**

### YAMAK-SCREEN-022 — ABOUT YAMAK APP (PLANNED ONLY)
Goal: about/branding page. Evidence: `AboutYamakAppScreen.tsx`.
- Step 1..N — Static content, app version (`device-info`), follow-us. 
- ⚠️ NOT TO BE IMPLEMENTED in this pass (user directive) — documented for completeness. **RUN → VERIFY → STOP.**

### YAMAK-SCREEN-023 — FRESHCHAT
Goal: support chat. Evidence: `FreshCharScreen.tsx`, `freshchat.config.ts` (requires NATIVE-006).
- Step 1 — SDK init at app start. **RUN → VERIFY → STOP.**
- Step 2 — Screen embedding chat widget + route. **RUN → VERIFY → STOP.**

### YAMAK-SCREEN-024 — NO NETWORK
Goal: offline state + retry. Evidence: `NoNetworkScreen.tsx`, NetInfo.
- Step 1 — Screen + route; show when offline (or on error). **RUN → VERIFY → STOP.**
- Step 2 — Retry button re-fetches. **RUN → VERIFY → STOP.**

---

## 11. STUB / OPTIONAL SCREENS (user decision ahead)

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

## 12. FINAL ORDER TABLE (build sequence)

> The sequence now starts with **PHASE 0** (see the PHASE 0 section above). No Yamak
> screen may begin before Phase 0 is complete.

| # | Task | Screen | Depends on |
|---|---|---|---|
| 1 | **YAMAK-SETUP-001** | Verify dev environment | — |
| 2 | **YAMAK-SETUP-002** | Create clean React Native application (`YamakMobile`) | SETUP-001 |
| 3 | **YAMAK-SETUP-003** | Run clean Android application | SETUP-002 |
| 4 | **⛔ HARD GATE** | Clean app builds & launches — otherwise STOP | — |
| 5 | **YAMAK-SETUP-004** | Understand generated project structure | SETUP-003 |
| 6 | **YAMAK-SETUP-005** | Add minimum Yamak `src` structure | SETUP-004 |
| 7 | First Yamak screen | First screen chosen by user (NOT Login/About this pass) | PHASE 0 complete |
| 7a | **YAMAK-DESIGN-001** | ⛔ Review & approve Yamak New UI/UX (see `docs/rebuild/new-ui/index.html`) | 7 |
| 7b | **⛔ DESIGN APPROVAL GATE** | Approved tokens become the sole style authority — otherwise STOP | 7a |
| 8 | YAMAK-SCREEN-008 | Forgot password | SETUP-007 |
| 9 | YAMAK-SCREEN-006 | Reset OTP | 008 |
| 10 | YAMAK-SCREEN-007 | New password | 006 |
| 11 | YAMAK-SCREEN-002 | Register | SETUP-008, DESIGN APPROVAL (7b) |
| 12 | YAMAK-SCREEN-005 | Email OTP | 002 |
| 13 | YAMAK-SCREEN-003 | Phone login | SETUP-008 |
| 14 | YAMAK-SCREEN-004 | Phone OTP | 003 |
| 15 | YAMAK-SCREEN-001 | Login | SETUP-007/008 (documented, planned) |
| 16 | YAMAK-SCREEN-009 | Onboarding | SETUP-010 |
| 17 | YAMAK-SCREEN-016 | Profile hub | SETUP-011 |
| 18 | YAMAK-SCREEN-010 | Home | SETUP-011, UI kit |
| 19 | YAMAK-SCREEN-011 | All vehicles | 010 |
| 20 | YAMAK-SCREEN-012 | Vehicle details | 010 |
| 21 | YAMAK-SCREEN-013 | Map | NATIVE-005, 010 |
| 22 | YAMAK-SCREEN-017 | Edit profile | 016 |
| 23 | YAMAK-SCREEN-018 | My cars | 016 |
| 24 | YAMAK-SCREEN-015 | Notifications | NATIVE-004 |
| 25 | YAMAK-SCREEN-020 | Privacy & policy | 016 |
| 26 | YAMAK-SCREEN-014 | Favorites | 010 |
| 27 | YAMAK-SCREEN-019 | Contact us | 016 |
| 28 | YAMAK-SCREEN-021 | Join us | 016 |
| 29 | YAMAK-SCREEN-024 | No network | — |
| 30 | YAMAK-SCREEN-023 | Freshchat | NATIVE-006 |
| 31 | YAMAK-SCREEN-022 | About Yamak | 016 (PLANNED ONLY) |
| 32 | Optional stubs | 025–028 | user decision |

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