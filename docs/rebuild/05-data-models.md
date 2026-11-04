# YAMAK MOBILE - 05. DATA MODELS & LOCAL STATE

> # ⚠️ LEGACY FUNCTIONAL REFERENCE — NON-CURRENT FOR ARCHITECTURE
>
> This document models the legacy **`yamak-mobile`** project's data and local state, which is
> **SUPERSEDED**. It is retained ONLY as the source of truth for **response shapes, persisted
> fields, and which values the app is expected to keep across restarts**.
>
> The active project is **`YamakExpoNew` (Expo + Expo Router)** — see `REBUILD-PLAN.md` §0–§2.
>
> **Do not copy the legacy state architecture described below.** Zustand v5 +
> `zustand/middleware/persist` + AsyncStorage are **legacy history**. The rebuild uses
> **React Context only where shared state is genuinely needed** (currently: auth session in
> `src/auth/auth-context.tsx`, location in `src/location/location-context.tsx`), **SecureStore** for
> secrets, and **hook-local state by default** (`src/hooks/use-*.ts`). There is **no Zustand store**
> and **no** global selected-service / favorites / services / vehicles store.
>
> Reading rule: every *field shape / persisted value* entry is authoritative; every *store and
> module path* (`src/store/*.ts`) is historical and must not be recreated.

> Reverse-engineered from `src/store/*.ts`, `src/constants/data.ts`, `src/helpers/AppAsyncStoreage.ts`.
> Evidence: `CONFIRMED` (code seen) | `INFERRED` | `UNKNOWN`.
> Legacy state management: Zustand v5. Legacy persistence: `zustand/middleware/persist` with AsyncStorage.
> IMPORTANT: `UNKNOWN` fields below MUST be confirmed against the running backend during rebuild.

---

## 1. Persisted stores (AsyncStorage)

### 1.1 `useAuthenticationStoreAsync` — name `"auth"` (CONFIRMED)
File: `src/store/auth.store.ts`

```
{
  user: User | null,
  token: string | null,
  authenticate: (token, user) => void,
  updateUserInfo: (user) => void,
  removeAuthentication: () => void,
}
```
- Persisted under AsyncStorage key `auth` (JSON via `createJSONStorage`).
- The axios interceptor reads `AsyncStorage.getItem("auth")` and uses `token?.state?.token`
  for the Authorization header. CONFIRMED
- This is THE source of truth for login state / the token gate.

### 1.2 `useFavouriteStoreAsync` — name `"favorites"` (CONFIRMED)
File: `src/store/Favorites.store.ts`

```
{
  favorites: number[],             // vehicle/service ids
  addToFavotires: (id: number) => void,   // (typo in legacy: "Favotires")
  removeFromFavorites: (id: number) => void,
  clearFav: () => void,
}
```
- Persisted under AsyncStorage key `favorites`.
- There is ALSO a non-persisted `useFavouriteStore` in the same file — dead/duplicate; do NOT rebuild.

### 1.3 FCM / misc keys (CONFIRMED) — `src/constants/CommonConsstats.ts`
`AsyncStorageConstants`:
- `env` → `"environment"` (custom API URL override `{ name, url }`)
- `isLunched` → `"isLunched"`
- `languageKey` → `"lang"`
- `userLocation` → `"userLocation"` (`{ latitude, longitude }`)
- `appleLoginKeys` → `"appleLoginKeys"`
- `fcmToken` → `"fcmToken"`

## 2. In-memory stores (Zustand, not persisted)

| Store | Shape (CONFIRMED) | Used by |
|---|---|---|
| `useAppReadyStore` | `{ isFirstLunch: boolean, appSetting: any, setIsFirstLunch, setAppSetting }` | Onboarding gate |
| `useServicesStore` | `{ services: IServices[], selectedServiceId: string|null, setServices, setSelectServiceId, removeAllServices }` | Home / Map filters |
| `useVehicleStore` | `{ vehicles: any[], setVehicles, removeAllVehicles }` | Home strip, Map |
| `useAddsStore` | `{ adds: [], setAdds, removeAllAdds }` | Home ads carousel |
| `useUserLocationStore` | `{ userLocation: {latitude,longitude}|null, updateUserLocation }` | Map / nearby search |
| `useErrorStore` | `{ error: string, errorCode: number|null, setError, removeError }` | AppFlashMessage global error toasts |

## 3. Entities

### 3.1 Service (`IServices`) — CONFIRMED (`src/constants/data.ts`)
```
{
  _id: string,
  name: { ar: string, en: string },
  logo?: string,
  appCode?: string,
  status?: string,
}
```
Localized name is chosen by current language.

### 3.2 Vehicle / provider (partial, INFERRED from screens)
Seen as `any[]` in `vehicles.store.ts`. Used fields (INFERRED):
```
{
  id?, _id?, name?, image?, services?: [{...}],
  latitude?, longitude?, phone?, address?,
  distance?, rate?, ...   // UNKNOWN
}
```
Legacy mock (`constants/data.ts` `Locations`) uses:
`{ id, name, serviceId, image, lat, lon, phone, address }` and a `serviceId`
used to link providers to services. Rebuild MUST confirm the real API shape.

### 3.3 Add (`adds`) — `any[]` (UNKNOWN fields). Confirm against backend.

### 3.4 User profile (partial, INFERRED from `app-users/profile` usage)
```
{ id?, name?, email?, phone?, avatar?, fcmToken?, notificationToken?, ... }  // UNKNOWN fields
```
- `fcmToken` is PATCHed to the profile (`AuthedReadyApp`) — field `fcmToken` CONFIRMED.
- `updateUserPushToken` posts `{ notificationToken }` — INFERRED duplicate of fcmToken; confirm which name the backend accepts.

### 3.5 User car (partial, INFERRED from `user-cars`)
```
{ id?, make?, model?, plate?, color?, year?, ... }  // UNKNOWN — confirm via backend
```

### 3.6 Notification (INFERRED)
`user-notifications/mine` returns a paginated list; fields UNKNOWN.

### 3.7 ServiceRequest — CURRENT vs APPROVED TARGET (B2.5A, 2026-11-04)

**CURRENT** (approved analysis findings): ServiceRequest persists platform, app_user_id, driver_id,
company_id, branch_id, status (`active`), services pivot and timestamps. vehicleId is validated but
the selected vehicle is not persisted. Driver is operational provider identity; Company/Branch are
organizational context; no authenticated Provider/Driver account exists.

**APPROVED TARGET — NOT IMPLEMENTED (B2.5B):**

- Keep platform (technical client, e.g. mobile). Add channel app/whatsapp/phone, separate from status.
- Add vehicle_id; require for new requests, nullable historically when not reliably reconstructable.
  No MVP request-time name snapshots; existing vehicle/driver/company/branch foreign keys suffice.
- Add latitude/longitude, recommended decimal(10,7). Nullable historically; required by validation/
  business logic for every new channel. Immutable request-time snapshot; never fabricate 0,0.
  Individual zeros may be valid; reject only the fake pair when both are zero.
- Lifecycle: contact_initiated, pending, accepted, completed, not_completed, cancelled. App initially
  pending; external initially contact_initiated. Allowed transitions in the authoritative closure.
- service_request_status_histories: id, service_request_id, from_status, to_status, actor_type,
  nullable actor_id, reason_note, created_at. Actors system/app_user/admin/provider, simple fields;
  no polymorphic actors. Initial NULL → status row in the request/services/idempotency transaction.
- request_reasons reference catalog (id/code, label/translation; active if needed later) +
  service_request_status_history_reasons pivot (status_history_id, reason_id/code). One history entry
  → many selected reasons. Never use service_requests.reason/reasonCodes as the sole history source.
  Exact migrations/relationships/indexes/constraints finalized in B2.5B; relational direction supports
  reporting/filtering/analytics; avoid JSON unless later analysis proves a material benefit without harm.
- Ten stable reason codes: too_far, service_cannot_be_provided, materials_unavailable,
  customer_unreachable, customer_cancelled, provider_unavailable, service_unavailable,
  location_inaccessible, price_not_agreed, other. Both not_completed/cancelled require at least one
  distinct catalog reason; other requires reasonNote. Otherwise note optional/normally NULL.
  Approved extensions only; never silently rename codes. Labels in PROJECT_CONTEXT.md closure.
- Future historical backfill: active → pending; channel → app; coordinates NULL; vehicle_id NULL
  unless reliably known. No fabricated provider actions/reasons/detailed lifecycle. Synthetic initial
  history remains a B2.5B choice; if used, identify clearly as a system migration event.
- MVP request number = ServiceRequest.id. No migration created/applied in this documentation closure.

## 4. Local (non-API) data
- `constants/data.ts`: helps with `ServicesDummy` + `Locations` (mock map markers).
  Legacy uses these as fallback UI data. In the rebuild this should be removed and replaced with real API data.
- `constants/languages.ts`: `languages = [{name:"en",label:"English"}, {name:"ar",label:"Arabic"}]`, `AppLanguages.ar/en`.
- `constants/messages.ts`: `getWhatsAppMessage(lang, serviceName[])` builds WhatsApp share text:
  EN `"Hello from yamak app . I need your help with {names}"`, AR `"مرحبا بك من تطبيق يمك . احتاج الى المساعده في {names}"`.

## 5. Just-in-time rebuild guidance
- Introduce `auth` store FIRST (Login requires it).
- Introduce `services` store when building Home.
- Introduce `vehicles`/`adds` stores with Home; `userLocation` with Map; `favorites` with Favorites screen.
- `useErrorStore` + `AppFlashMessage` when first API/error handling needed.
- Do not create unused stores upfront.
