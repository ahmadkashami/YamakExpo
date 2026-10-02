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