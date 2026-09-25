# YAMAK MOBILE — 06. AUTHENTICATION

> Reverse-engineered from `RootFun.tsx`, `src/store/auth.store.ts`, `src/apis/Auth.api.ts`,
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

## 6. Security notes for rebuild

- Keep token ONLY in AsyncStorage `auth` store; never log it. (`makeApiCall` has verbose logging commented out.)
- `makeApiCall` already guards offline calls with NetInfo + alert.
- Do NOT copy the commented-out hardcoded localhost IPs (dev leftovers in `axios.config.ts`).

## 7. Just-in-time rebuild order (auth-related)

1. `auth` Zustand store + AsyncStorage persist (Login step).
2. `axios.config.ts` with base URL + bearer interceptor (first API step).
3. Login screen + `auth/login` (YAMAK-SCREEN-001).
4. Register + OTP flow (subsequent screens).
5. Token gate `RootFun` (only after Login works).
6. Social auth only when requested.