# YAMAK MOBILE - 10. USER FLOWS

> # ⚠️ LEGACY FUNCTIONAL REFERENCE — NON-CURRENT FOR ARCHITECTURE
>
> These flows were synthesized from the legacy **`yamak-mobile`** project, which is **SUPERSEDED**.
> They are retained ONLY as the source of truth for **what the user can do, in what order, with
> what outcome, and which validation or business rules apply at each step**.
>
> The active project is **`YamakExpoNew` (Expo + Expo Router)** — see `REBUILD-PLAN.md` §0–§2.
>
> **Do not copy the legacy navigation steps.** Flows below name `RootFun`, `AuthStack`,
> `DrawerStack`, `TabNavigator` and `HomeStackNAvigator` because that is how legacy navigated. In
> the rebuild, navigation is **Expo Router**: a session gate in `src/app/_layout.tsx`, route groups
> `(app)/(tabs)`, and `router.push/replace/back`. See `03-navigation-map.md` Part 2 for the
> authoritative target behavior.
>
> Also note: flows naming `navigation.navigate("X")`, Zustand stores, or AsyncStorage keys are
> describing **behaviour**, not implementation. Preserve the behaviour; implement it with the
> current architecture.
>
> Reading rule: every *step and outcome* entry is authoritative; every *navigation/state
> mechanism* note is historical.

> Flows synthesized from screens + navigation + APIs. Evidence: `CONFIRMED` | `INFERRED` | `UNKNOWN`.
> Numbered `UF-###`. Each flow maps to screens in `02-screen-inventory.md` and tasks in `13-SCREEN-BY-SCREEN-REBUILD-PLAN.md`.

---

## UF-001 — First launch / onboarding
1. App opens → `RootFun` reads `isLunched` (ASYNC `isLunched`).
2. Missing → `isFirstLunch=true`; records `isLunched=true` (BR-001).
3. Not authenticated → AuthStack; authenticated → `AuthedReadyApp` → DrawerStack shows `onboarding` screen.
4. Onboarding carousel + language picker; user continues → main drawer.

## UF-002 — Email login
1. `AuthStackNavigator` → Login.
2. Fill email+password; validate (BR-010); Yup errors inline.
3. `POST auth/login`. Success → `authenticate(token,user)`.
4. Token flips → `NavigationContainer` re-renders to `AuthedReadyApp`. Push token register (BR-015).
5. Failure → global flash error; `user not registered` special-case (BR-052).
> STOP gate at end of YAMAK-SCREEN-001.

## UF-003 — Register (email)
1. From Login footer → Register.
2. Fill name/email/phone (BR-011) + terms agreement.
3. `POST auth/signup` (`{name,email,phone}`) → backend sends email code.
4. Navigate → Email OTP screen. Enter code → `POST auth/verify-email`.
5. On success → login flow continues (user may then log in with password set by backend).

## UF-004 — Phone login (OTP)
1. From Login → Auth (phone) screen; enter number + country code.
2. `POST auth/sendCode` → backend SMS code.
3. Navigate → OTP Verification (animation disabled); enter code.
4. `POST auth/checkCode {phone, code}`.
5. Success → load `app-users/profile` → `authenticate` → main app.

## UF-005 — Forgot / reset password
1. Login → "forgot password" → `EmailForgotPassword`.
2. `POST auth/send-reset-password {email}` → code.
3. Reset OTP screen → `POST auth/check-reset-password {email, code}`.
4. New Password screen → `POST auth/reset-password {email, password}` (BR-014).
5. Back to Login → user signs in with new password.

## UF-006 — Social login / signup
1. Login/Register → Google or Apple (social hooks).
2. Obtain platform token(s) (`useSocialAuth`, native SDKs).
3. `POST auth/login-social` or `auth/signup-social` with tokens (+`appleInfo`).
4. Success → `authenticate` → main app.

## UF-007 — Home browse
1. Home loads `services` (store), `adds` (store), `vehicles` (near me, store) in parallel.
2. UI: services grid (localized names), ads carousel, vehicles strip.
3. Tap service → filter vehicles (Map or AllVehicles).
4. Tap vehicle → `VehicleDetail`. "View map" → Map tab (BR-020/BR-021).

## UF-008 — Map / nearby providers
1. `AuthedReadyApp` captures device location → `userLocation` store + AsyncStorage (BR-004).
2. Map tab: shows markers from vehicles (location-filtered `GET vehicles`).
3. Filter by service (`servicesListMap`); card detail view; request CTA.

## UF-009 — Request roadside assistance
1. From VehicleDetail (or Map) → "request" → `POST requests` (BR-030) with selected service/car info.
2. WhatsApp share (BR-031) builds message from selected service names (Contact/Share flows).
3. Confirmation/contact steps (freshchat fallback).

## UF-010 — Favorites
1. Favorites via Profile or drawer.
2. List comes from local `favorites` id array (BR-022); provider cards loaded accordingly.
3. Tap heart on cards ⇒ add/remove id (BR-023). Empty state (`NoFavorites`).

## UF-011 — Profile hub
1. Profile tab loads `GET app-users/profile`; shows user info; menu buttons → sub screens.
2. Sub entries: Edit Profile / My Cars / Notifications / Favorites / Settings* / Contact Us /
   Privacy & Policy / Join Us / About Yamak / Messages* / FreshChat / Logout. (`*` = stub screens.)

## UF-012 — My cars (CRUD)
1. My Car from Profile → `GET user-cars` list.
2. Add new car (modal `AddNewCarContent`) → `POST user-cars`.
3. Delete car → `DELETE user-cars/:id` (BR-026).

## UF-013 — Notifications
1. Notifications from Profile or drawer → `GET user-notifications/mine?page=n` (BR-024).
2. Open app via push → screen/notification handling (`useNotification`).

## UF-014 — Edit profile
1. Edit Profile from Profile; prefill from store.
2. Update name/phone/email; optional map location picker.
3. `PATCH app-users/profile` (BR-017/BR-026). `updateUserInfo` refreshes store.

## UF-015 — Support & about
1. Contact Us → phone/mail/WhatsApp links (BR-032).
2. FreshChat → embedded chat (SDK init). About/Join Us/Privacy → static + `app-setting`.
3. Privacy & Policy presented as modal.

## UF-016 — Logout / account
1. Profile → Logout → `removeAuthentication()` (BR-016) → AuthStack.
2. Delete account → `DELETE app-users/account` (BR-017) → logout.

## UF-017 — Offline / degraded
1. `makeApiCall` checks NetInfo; offline → `No_internet_connection` alert (BR-050).
2. No-connectivity screens and error toasts via `AppFlashMessage` (BR-051).

---

## Flow → First rebuild task mapping

| Flow | First screen task |
|---|---|
| UF-002 Login | YAMAK-SCREEN-001 Login |
| UF-003 Register | YAMAK-SCREEN-Register |
| UF-004 Phone OTP | YAMAK-SCREEN-Auth + OTP |
| UF-005 Reset | YAMAK-SCREEN-Reset |
| UF-007 Home | YAMAK-SCREEN-Home |
| UF-008 Map | YAMAK-SCREEN-Map |
| UF-009 Requests | YAMAK-SCREEN-VehicleDetails |
| UF-011 Profile | YAMAK-SCREEN-Profile |
| UF-012 My cars | YAMAK-SCREEN-MyCar |
| UF-013 Notifications | YAMAK-SCREEN-Notifications |