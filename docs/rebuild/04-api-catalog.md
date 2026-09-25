# YAMAK MOBILE — 04. API CATALOG

> Reverse-engineered from `src/apis/*.ts`. Evidence: `CONFIRMED` (in code) | `INFERRED` | `UNKNOWN`.
> Base URL (production): `https://yamak-kw.com/api/mobile/v1/` (see `08-environment-and-config.md`).
> All calls go through `src/apis/axios.config.ts`. Auth: Bearer token + `device`, `language` headers.

---

## 1. HTTP client (`axios.config.ts`)

Behavior (CONFIRMED):
- Axios instance with base URL derived from env (`API_URL` react-native-config) or
  a custom IP override stored in AsyncStorage key `env` (`{ name: "customIp", url: "http://<ip>:5001/api/mobile/v1/" }`).
- Request interceptor reads auth token from AsyncStorage `auth` (Zustand persist) and sets
  `Authorization: Bearer <token>`; also sets headers `device` = `Platform.OS`, `language`.
- Response/error handling maps into `useErrorStore` flash messages.
- `makeApiCall({ method, url, data, params })` is the central wrapper.

Conventions used by endpoints:
- `params` for GET query strings.
- `data` for POST/PATCH JSON body.
- Some GET calls carry pagination params: `page`, `limit` (`AppLimitList`).

## 2. Endpoint inventory

### AUTH (`Auth.api.ts`)

| # | Method | Path | Function | Request body | Notes |
|---|---|---|---|---|---|
| 1 | POST | `auth/login` | `login` / `emailLogin` | `{ email, password }` | email+password login |
| 2 | POST | `auth/signup` | `register` / `registerUser` | `{ name, email, phone }` or `{ name, email, password, phone }` | phone strips leading `+` for `register`; `registerUser` prefixes `callingCode` |
| 3 | POST | `auth/sendCode` | `sendCode` | `{ phone }` | requests OTP for phone flow |
| 4 | POST | `auth/checkCode` | `checkCode` | `{ phone, code }` | verifies phone OTP |
| 5 | POST | `auth/verify-email` | `emailVerify` | `{ email, code }` | verifies email OTP after signup |
| 6 | POST | `auth/send-reset-password` | `sendResetPassword` | `{ email }` | request reset code (used by `EmailForgotPassword`) |
| 7 | POST | `auth/check-reset-password` | `checkResetPassword` | `{ email, code }` | validates reset code |
| 8 | POST | `auth/reset-password` | `resetPassword` | `{ email, password }` | sets new password |
| 9 | POST | `auth/login-social` | `loginUserWithSocial` | `{ googleAccessToken?, facebookAccessToken?, appleAccessToken? }` | empty strings when absent |
| 10 | POST | `auth/signup-social` | `registerUserWithSocial` | same + `{ appleInfo? }` | |

> NOTE: `register` sends only `{name,email,phone}` (no password) — implies backend sends a
> verification code / temporary password. Confirm exact contract when rebuilding.

### SERVICES (`services.api.ts`)

| # | Method | Path | Function | Notes |
|---|---|---|---|---|
| 11 | GET | `services` | `getAllServices` | list of service categories (bansher/wench/fix/cleaning/...) |

### VEHICLES (`vehicles.api.ts`)

| # | Method | Path | Function | Query/params | Notes |
|---|---|---|---|---|---|
| 12 | GET | `/vehicles/:id` | `getVehicleById` | path id | single vehicle detail |
| 13 | GET | `vehicles` | `getAllVehicles` | default `{ page: 1, limit: AppLimitList }` merged with user `latitude`/`longitude` from AsyncStorage `userLocation` | returns `response.data.list`; location params (INFERRED keys `latitude`/`longitude`) |

### COMMON (`common.api.ts`)

| # | Method | Path | Function | Notes |
|---|---|---|---|---|
| 14 | GET | `app-setting` | `getAppSetting` | app config; used for onboarding, privacy content source |
| 15 | GET | `adds` | `getAllAdds` | banner/carousel adds |

### USER PROFILE (`users.api.ts`)

| # | Method | Path | Function | Body | Notes |
|---|---|---|---|---|---|
| 16 | GET | `app-users/profile` | `getUserProfile` | — | current user profile |
| 17 | PATCH | `app-users/profile` | `updateUserProfile` | `{ any }` (e.g. `fcmToken`, `notificationToken`, name/email) | partial update; payload field names INFERRED |
| 18 | DELETE | `app-users/account` | `deleteAccount` | — | used by `deleteAccount`; direct `client.delete` (not makeApiCall) |
| 19 | — | — | `updateUserPushToken` | `{ notificationToken }` | wraps updateUserProfile |

### USER CARS (`userCars.api.ts`)

| # | Method | Path | Function | Notes |
|---|---|---|---|---|
| 20 | GET | `user-cars` | `getUserCars` | list of my cars |
| 21 | POST | `user-cars` | `addUserCars` | body `{ any }` (plate/model etc., INFERRED) |
| 22 | DELETE | `user-cars/:id` | `deleteUserCars` | path id |

### REQUESTS / ORDERS (`requests.api.ts`)

| # | Method | Path | Function | Notes |
|---|---|---|---|---|
| 23 | POST | `requests` | `sendOrderRequests` | body `{ any }`; used when requesting roadside assistance from vehicle/order flow |

### NOTIFICATIONS

| # | Method | Path | Function | Source | Notes |
|---|---|---|---|---|---|
| 24 | GET | `user-notifications/mine` | (in NotificationsScreen) | CONFIRMED in screen | paginated with `page` param |

### VEHICLE → SERVICES (related)

| # | Method | Path | Function | Source | Notes |
|---|---|---|---|---|---|
| 25 | GET | `services/:id/vehicles` | (vehicle detail service list) | CONFIRMED in `AvailableServiceList` / VehicleDetails | providers for a given service |

> `services/:id/vehicles`, `user-notifications/mine` are not wrapped in `apisPath.ts`
> but are called from screens; verify exact params during rebuild.

## 3. API → Screen mapping

| API | Feature | Screens |
|---|---|---|
| `auth/login` | Email login | Login |
| `auth/signup` | Register | Register |
| `auth/sendCode` | Phone OTP request | Auth (phone) |
| `auth/checkCode` | Phone OTP verify | OTP Verification |
| `auth/verify-email` | Email OTP verify | Email OTP |
| `auth/send-reset-password` | Reset request | Login (Forgot) |
| `auth/check-reset-password` | Reset code verify | Reset OTP |
| `auth/reset-password` | Set new password | New Password |
| `auth/login-social`, `auth/signup-social` | Social auth | Login, Register |
| `services` | Service categories | Home |
| `adds` | Ads banners | Home |
| `vehicles` | Providers list (near me) | Home, Map, All Vehicles |
| `vehicles/:id` | Provider detail | Vehicle Details |
| `services/:id/vehicles` | Providers for a service | Vehicle Details |
| `app-setting` | App config | Onboarding, Privacy & Policy |
| `app-users/profile` (GET/PATCH) | Profile | Profile, Edit Profile, AuthedReadyApp (token push) |
| `user-cars` (GET/POST/DELETE) | My cars | My Car |
| `requests` (POST) | Service request | Vehicle Details / request flow |
| `user-notifications/mine` (GET) | Notifications | Notifications |

## 4. Just-in-time rebuild guidance

- Start with the 8 auth endpoints (Login/Register/OTP/reset) — those unlock the token gate.
- Add `services`, `adds`, `vehicles` when building Home.
- Add `vehicles/:id`, `services/:id/vehicles`, `requests` when building Vehicle Details.
- Add `app-users/profile` when building Profile.
- Do NOT pre-create API files for endpoints not yet needed by the current screen.

## 5. Data volumes / response shapes

Exact response shapes were partially recorded in the legacy screens. Rebuild should
treat unknown fields as `UNKNOWN` and confirm against a running backend:

- `getAllVehicles` returns `data.list` → paginated list wrapper `{ list: Vehicle[] }`.
- `getAllServices` returns `data` → array of `{ _id, name: { ar, en }, logo?, appCode?, status? }` (see `constants/data.ts` `IServices`).
- Auth responses expose `token` and user (persisted in `auth` store) — see `05-data-models.md` / `06-authentication.md`.