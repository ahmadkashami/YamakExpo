# YAMAK MOBILE - 06. AUTHENTICATION

> # ⚠️ LEGACY FUNCTIONAL REFERENCE — NON-CURRENT FOR ARCHITECTURE
>
> This document describes the legacy **`yamak-mobile`** authentication implementation, which is
> **SUPERSEDED**. It is retained ONLY as the source of truth for **auth endpoints, request/response
> bodies, validation schemas, error messages, and the expected sign-in / sign-out behaviour**.
>
> The active project is **`YamakExpoNew` (Expo + Expo Router)** — see `REBUILD-PLAN.md` §0–§2.
>
> **Do not copy the legacy auth architecture described below.** `RootFun.tsx`,
> `NavigationContainer`, `AuthStackNavigator`, the persisted Zustand `auth` store in AsyncStorage,
> `useSocialAuth.ts` and `react-native-google-signin` are **legacy history**. The rebuild uses
> **Expo Router** routes (`src/app/login.tsx`, `register.tsx`, `email-otp.tsx`, …), a **React
> Context** session (`src/auth/auth-context.tsx` → `status` / `user` / `accessToken` /
> `authenticate` / `signOut`), and **SecureStore** persistence (`src/auth/auth-storage.ts`, keys
> `yamak_access_token` + `yamak_auth_user`).
>
> **Current status (snapshot):** Register is **✅ DONE**; Email OTP is **🟡 PARTIAL** (resend +
> countdown remain — its **successful transition into the authenticated shell is ✅ DONE in A2**);
> Login, phone login, forgot/reset password are **⏭ deferred to B10 (Remaining Auth &
> Integrations)**; Google Sign-In / Firebase are **⛔ PLANNED / NOT YET MIGRATED (B10)**.
>
> Reading rule: every *endpoint / payload / validation / error* entry is authoritative; every
> *module path and state mechanism* is historical.

> Reverse-engineered from legacy `RootFun.tsx`, `src/store/auth.store.ts`, `src/apis/Auth.api.ts`,
> `src/apis/axios.config.ts`, `src/validationSchemas/loginSchema.ts`, `src/hooks/useSocialAuth.ts`.
> Evidence: `CONFIRMED` (code seen) | `INFERRED` | `UNKNOWN`.

---

## 1. Auth model summary

- Backend issues a `token` (JWT-style Bearer) + a `user` object on successful login/verify.
- Token + user live in the persisted Zustand store `useAuthenticationStoreAsync` under AsyncStorage key **`auth`** (JSON: `{ state: { token, user }, version }`).
- Every API request attaches `Authorization: Bearer <token>` plus headers `device` (Platform.OS), `language`, `request-startTime`.
- Root routing gate: `RootFun` reads `token` → authenticated → `AuthedReadyApp`; otherwise → `AuthStackNavigator`.

## 2. Login flows

### 2.1 Email + password (`auth/login`)
- Screen: Login
- Validation (`loginValidationSchema`): valid email; password min 8.
- Call: `POST auth/login` `{ email, password }`.
- On success: `authenticate(token, user)` → token gate flips → app navigates to main area.

### 2.2 Phone + OTP (`auth/sendCode` → `auth/checkCode`)
- Screen: Auth (phone) → OTP Verification
- Step 1 `POST auth/sendCode` `{ phone }` (phone may include country code).
- Step 2 `POST auth/checkCode` `{ phone, code }`.
- On success: load profile (`app-users/profile`) and call `authenticate(...)`.

### 2.3 Email signup + email OTP (`auth/signup` → `auth/verify-email`)
- Screen: Register → Email OTP
- `register(name, email, phone)` posts `{ name, email, phone }` (no password — backend generates/sends code; CONFIRMED body shape).
- `registerUser({...})` posts `{ phone: callingCode+phone, email, password, name }`.
- Verify: `POST auth/verify-email` `{ email, code }`.

### 2.4 Reset password (`auth/send-reset-password` → `auth/check-reset-password` → `auth/reset-password`)
- Screens: Login (EmailForgotPassword) → Reset OTP → New Password
- Request: `POST auth/send-reset-password` `{ email }`.
- Verify: `POST auth/check-reset-password` `{ email, code }`.
- New password: `POST auth/reset-password` `{ email, password }` with `resetPasswordValidationSchema`
  (password min 8; confirmPassword must match).

### 2.5 Social login/signup (`auth/login-social`, `auth/signup-social`)
- Wrapped by `useSocialAuth`; sends `googleAccessToken`, `facebookAccessToken`, `appleAccessToken`
  (empty string when not provided) and `appleInfo` for social signup.
- Platforms supported in code/deps: Google (`@react-native-google-signin`), Apple (`@invertase/react-native-apple-authentication`). Facebook token present in body shape (CONFIRMED in body, SDK usage UNKNOWN).

## 3. Session persistence & restoration

- Persist key `auth` (AsyncStorage). App start reads it in `RootFun`.
- `removeAuthentication()` clears token+user (logout) — used by Profile logout.
- No refreshed-token mechanism observed (UNKNOWN).

## 4. Push token registration

- `RootFun`: when `token` exists → `updateUserPushToken(fcmToken)` → `PATCH app-users/profile { notificationToken }`.
- `AuthedReadyApp`: when `fcmToken` (FCM) obtained → `updateUserProfile({ fcmToken })`.
- FCM token stored in AsyncStorage `fcmToken` key.
> NOTE: two field names used (`notificationToken` in users.api helper vs `fcmToken` in AuthedReadyApp). Confirm the backend's exact field during rebuild.

## 5. Backend readiness (set by backend owners — production live)

- Production base URL `https://yamak-kw.com/api/mobile/v1/` is LIVE and ready.
- Auth endpoints above are the contract to reuse as-is.

## 6. Security notes for rebuild — ⛔ SUPERSEDED (legacy mechanism)

The legacy mechanism below is **history**. The rebuild's equivalent is:

- Store the token ONLY in **SecureStore** (`src/auth/auth-storage.ts`, key `yamak_access_token`);
  never log it. ✅ implemented.
- The fetch client must surface only **sanitized** messages (`src/api/api-error.ts`) — never a raw
  response body. ✅ implemented.
- ⛔ Do NOT copy the commented-out hardcoded localhost IPs (dev leftovers in legacy `axios.config.ts`).
- ⛔ Do NOT copy the custom-IP backend override (`AppCustomIpModal`) — the rebuild resolves its base
  URL solely from `EXPO_PUBLIC_API_URL`.

## 7. Rebuild order for auth work — ⏭ SUPERSEDED

> ⛔ The legacy sequence below is **no longer valid**. Register and the session foundation are
> already built, and the auth-adjacent screens are deferred until the app shell exists.

**Current position:** The auth foundation is built — Auth Context + SecureStore session
(`EXPO-FOUND-006`), the auth-restore loading gate (`EXPO-FOUND-007`), the **(app) session gate**
(`YAMAK-SHELL-001`, Phase A1) and the **Email OTP → shell transition** (Phase A2). Login and the
rest of the auth set are **B10** — see `REBUILD-PLAN.md` §5.2/§6. Social auth is
**PLANNED / NOT YET MIGRATED (B10)**.

<details>
<summary>Historical CLI auth order (superseded — do not follow)</summary>

1. `auth` Zustand store + AsyncStorage persist (Login step). → ✅ done as Context + SecureStore.
2. `axios.config.ts` with base URL + bearer interceptor (first API step). → ✅ done as a `fetch` client.
3. Login screen + `auth/login` (YAMAK-SCREEN-001). → ⏭ B10.
4. Register + OTP flow (subsequent screens). → ✅ Register done; Email OTP partial.
5. Token gate `RootFun` (only after Login works). → ✅ done as `src/app/_layout.tsx` + `YAMAK-SHELL-001`.
6. Social auth only when requested. → ⛔ PLANNED.

</details>