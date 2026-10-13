# Project Context

## Project Name
YamakExpoNew

## DOCUMENTATION EXPO ALIGNMENT (recorded decisions — this section is authoritative)

Recorded as DOCS-EXPO-001. Ten decisions, in the user's own terms:

1. **Project history was corrected.** The earlier rebuild documentation described a bare React
   Native CLI project (`YamakMobileNew`) as the active target. That was wrong and is now
   superseded throughout the documentation.
2. **`YamakExpoNew` (Expo + Expo Router) is the single ACTIVE implementation.**
3. **`YamakMobileNew` (React Native CLI) is SUPERSEDED** — retained for migration/rollback review
   only. It is not the build target and must not be referenced as current.
4. **`yamak-mobile` (legacy) is a LEGACY FUNCTIONAL REFERENCE only.** It remains the source of
   truth for functionality, business behaviour, screens, flows, API contracts, validation rules,
   assets/content, and required native capabilities. It is **NOT** the source of truth for package
   versions, navigation implementation, state-management library, old RN architecture, deprecated
   native configuration, or obsolete workarounds.
5. **The authoritative stack is:** Expo · React Native · TypeScript · Expo Router · React Context
   (only where chosen deliberately) · SecureStore · a fetch-based HTTP client · `react-native-maps`
   · `app.config.ts` · `.env` / `EXPO_PUBLIC_*`. RN CLI, `NavigationContainer`,
   `createStackNavigator` as required architecture, the DrawerNavigator package, Zustand, Axios,
   `react-native-config` and bare-RN are **NOT** to be forced.
6. **The next phase is the Authenticated App Shell (Phase A).** The app shell must be completed
   before Edit Profile — "Edit Profile is next" is no longer a valid statement.
7. **The Profile Hub (SCREEN-016) must precede Edit Profile (SCREEN-017) and My Cars (SCREEN-018)**
   and any profile-side navigation, because those screens are reached through the hub and the hub
   holds the only logout path.
8. **The final objective is functional parity with legacy Yamak**, not architectural identity.
   Where legacy and current best practice disagree, current best practice wins — but only after
   explicitly recording that legacy behaviour is intentionally not being copied.
9. **This work was documentation-only.** No product code, no backend, no package installs, no
   builds, no Expo prebuild, and no commits were performed or changed. Git HEAD remains `143bc8d`
   with the documentation edits uncommitted.
10. **Commit status for this documentation pass: NOT YET.**

### Source-of-truth hierarchy (highest wins)

1. `PROJECT_CONTEXT.md` — verified implementation facts, recorded decisions, this section.
2. `docs/rebuild/REBUILD-PLAN.md` — phases A–G, next tasks, architecture authority.
3. Legacy `yamak-mobile` — functional/business truth only (see item 4 above).
4. `docs/rebuild/01–11` legacy-analysis documents — historical legacy evidence, NON-CURRENT for
   architecture.
5. Current Expo / React Native official documentation — technical authority for how to build it
   (`https://docs.expo.dev/`, version-matched to the installed SDK).

An explicit user decision outranks any document, including this one.

## Tech Stack
- Expo
- React Native
- TypeScript
- Expo Router
- SecureStore (session persistence)
- React Context (`src/auth`, `src/location`) — no Zustand
- `fetch`-based HTTP client (`src/api/http-client.ts`) — no Axios
- `react-native-maps`
- Configuration via `app.json` + `app.config.ts`, secrets via `.env` / `EXPO_PUBLIC_*`
  — no `react-native-config`, no Gradle flavors

## Project Structure
- `src/app`: Expo Router screens and layouts.
- `src/components`: Reusable UI components.
- `src/theme`: Shared YAMAK theme values.

## Setup Commands
- `npx expo start`: Start the development server.
- `npx expo lint`: Run linting.
- `npx tsc --noEmit`: Run TypeScript validation.

## Current Implementation Position
- Route tree: `src/app/_layout.tsx` (root Stack, `headerShown: false`, wraps `AuthProvider`), `index.tsx` (the startup gate), `register.tsx` (guarded), `email-otp.tsx` (ungated by design — it must be reachable while unauthenticated, and now completes signup itself) + the Step-4B group `(app)/(tabs)/map.tsx` with a gated `(app)/_layout.tsx` (route `/map`). No tab bar, drawer, `+not-found`, onboarding, or authenticated Home shell yet.
- **Root startup gate (Step A1, done):** `src/app/index.tsx` reads `useAuth().status` and returns `<Redirect href="/map" />` when `authenticated`, `<Redirect href="/register" />` when `unauthenticated`, and the neutral `AuthGateLoading` surface while `loading`. It replaces the former unconditional `<Redirect href="/register" />`, which sent authenticated users to Register. The `/map` destination is only the entry route that already exists inside `(app)` — A1 does not decide the final post-OTP screen and does not create a Home route.
- `(app)/_layout.tsx` is now protected: it renders `<Redirect href="/register" />` unless `status === 'authenticated'`, while still mounting the single shared `UserLocationProvider` around its `<Slot />` for authenticated users.
- **Post-OTP completion (Step A2, done, NOT YET committed):** `src/app/email-otp.tsx` now, after `await authenticate(...)` succeeds, calls `router.replace(AUTHENTICATED_ENTRY_ROUTE)` — reusing A1's central constant rather than introducing a second destination or a second auth mechanism. The success card was kept as a transient confirmation instead of a permanent hold, and a duplicate `authenticate`/`replace` is blocked by `hasAuthenticatedRef`. It deliberately stays **ungated** so it remains reachable while unauthenticated.
- `AuthProvider` (`src/auth/auth-context.tsx`) exposes `status: 'loading' | 'unauthenticated' | 'authenticated'`, `user`, `accessToken`, `authenticate`, `signOut`. Session is read from SecureStore keys `yamak_access_token` + `yamak_auth_user` (`src/auth/auth-storage.ts`). Restoration is fire-and-forget in a `useEffect`.
- **Auth restore loading gate (Step A, done):** `src/app/_layout.tsx` holds the native splash with module-scope `void SplashScreen.preventAutoHideAsync()` and renders an internal `AuthReadyLayout` inside `AuthProvider`. `AuthReadyLayout` reads `useAuth().status`; while `loading` it returns `null` so no Stack renders, and a `useEffect` keyed on `status` calls `SplashScreen.hideAsync()` once status leaves `loading`, guarded by a `hasHiddenSplash` ref so later status flips cannot re-hide. `RootLayout`, `ThemeProvider`, `StatusBar` and the Stack options are otherwise unchanged.
- `signOut()` is exported but still has no call site.
- **Home slice 1 (done): Services API + ServicesList.** `src/api/services.ts` (`getServices`, `Service`, `ServicesResponse`, re-exported from `src/api/index.ts`), `src/hooks/use-services.ts` (`useServices()` returns `services`, `isLoading`, `error`, `refetch`; local state only, no global store), `src/components/home/ServicesList.tsx` and `ServiceItem.tsx`. Service press reports upward through `onServicePress(service)` and does not navigate; the Map route does not exist.
- **Home slice 2 (done): Adds API + AddsList.** `src/api/adds.ts` (`getAdds`, `Add`, `AddsResponse`, re-exported from `src/api/index.ts`), `src/hooks/use-adds.ts` (`useAdds()` returns `adds`, `isLoading`, `error`, `refetch`), `src/components/home/AddsList.tsx`, `AddsCarousel.tsx`, `AddCard.tsx`. Carousel is a plain horizontal `FlatList` with `snapToInterval`, `decelerationRate="fast"`, `disableIntervalMomentum` and `getItemLayout`; no carousel dependency. Still not mounted by any screen.
- **Home slice 3B (done): location foundation + Vehicles API + VehiclesList.** Files: `src/location/location-context.tsx` + `src/location/index.ts` (`UserLocationProvider`, `useUserLocation`), `src/api/vehicles.ts` (`getVehicles`, `Vehicle` + nested resources, exported via `src/api/index.ts`), `src/utils/distance.ts` (Haversine km + vehicle-geo guard), `src/hooks/use-vehicles.ts` (`useVehicles()` → `vehicles`, `isLoading`, `error`, `refetch`, `coordsUsed`), `src/components/home/VehiclesList.tsx`, `src/components/home/VehicleItem.tsx`, and the extracted shared `src/components/home/ApiErrorRow.tsx` (now also used by `ServicesList` and `AddsList` — both refactored minimally, styles byte-identical). `app.json` gained the `expo-location` plugin (`locationWhenInUsePermission` iOS string) + Android `ACCESS_COARSE_LOCATION`/`ACCESS_FINE_LOCATION`; `expo-location@~57.0.20` installed. Still not mounted by any screen (belongs to the future authenticated shell boundary).
- **Home slice 4B (done): the Map tab (`/map`).** `src/app/(app)/_layout.tsx` mounts the SINGLE shared `UserLocationProvider` around a `<Slot />`; `src/app/(app)/(tabs)/map.tsx` is the Map screen (route param `serviceId` canonical → local state; no global selected-service store). New files: `src/components/map/{MapServiceChips,EnableLocationCard,MapMarkers}.tsx`, `src/hooks/use-map-vehicles.ts`, `src/utils/vehicle-marker.ts`; `src/api/vehicles.ts` gained `getVehiclesByService` + `VehiclesByServiceResponse` (bare-array `data`); `src/theme/colors.ts` gained `primary`/`goldTint`/`goldTintBorder`; `react-native-maps@1.27.2` installed via `npx expo install` (Expo Go SDK 57 bundles it). See the dedicated section below.
- **Home slice 4C (done): the ViewMap CTA.** `src/components/home/ViewMap.tsx` — the approved "Live Radar Map Preview" card from `docs/rebuild/approve-ui/home/code.html` (the approved-UI reference the user dropped mid-slice; governs over `new-ui`), static promotional copy with the prototype's demo statistics neutralized (decorative examples, not product data), whose navy "Explore Map" button is the ONLY interactive element and navigates to `/map` with NO serviceId. No API, location, global state, MapView, skeleton, or fake loading; no new dependency (`Animated` + `react-native-svg` already present); gradient approximated flat `#EFF6FF`. Not mounted by any production screen (belongs to the future authenticated Home shell). See the dedicated section below.
- `http-client.ts` attaches the Bearer token by reading SecureStore directly via `getAccessToken()` (not from context).
- `email-otp.tsx` calls `authenticate(...)` on success and renders a success state but never navigates — still a dead end. **Step A2 owns that transition**; A1 deliberately did not guard `/email-otp`, because an authenticated guard there would have made the gate perform A2's navigation as soon as `authenticate()` resolved.
- Unused `create-expo-app` template leftovers remain (`components/app-tabs.tsx`, `animated-icon.tsx`, `web-badge.tsx`, `external-link.tsx`, `hint-row.tsx`, `ui/collapsible.tsx`, `themed-text.tsx`, `themed-view.tsx`, `hooks/use-color-scheme*.ts`, `constants/theme.ts`).

## Verified Legacy Startup Facts (reference: yamak-mobile)
- `index.js` → `App.tsx` → `RootFun`. `RootFun` returns `null` while `useAppReady().appIsReady === false`; splash is hidden via `react-native-splash-screen` 3s after ready.
- Auth gate is a **single** token check in `Navigation`: `token ? <AuthedReadyApp/> : <AuthStackNavigator/>`. Token comes from Zustand `persist` (AsyncStorage key `auth`). There is **no boot-time token validation** and **no 401 auto-logout interceptor** — logout is manual (`removeAuthentication()`).
- `AuthedReadyApp` is a side-effect shell (FCM, Freshchat, Sentry, device location) that renders `DrawerStackNavigator`.
- First-launch: `RootFun.getStorageItem()` reads AsyncStorage key `isLunched`; if missing it sets in-memory `useAppReadyStore.isFirstLunch = true` **and immediately writes `isLunched = "true"`**. `isFirstLunch` lives only in a non-persisted store, so onboarding shows exactly once per install.
- **Onboarding is inside the authenticated area**, not before auth: `DrawerStackNavigator` conditionally registers the `"onboarding"` screen above the always-present `"drawer"` screen. `OnBoardingScreen` exits via `navigation.replace("drawer")` on both Skip and Done. So a first-launch unauthenticated user does NOT see onboarding; they see it only once they become authenticated in that same session.
- `StackNAvigaator.tsx` (`MainNavigaator`) is dead/broken code — never imported, and it imports a non-existent `./ProfieStack`.

## Verified Legacy Authenticated Landing (reference: yamak-mobile)
- Real authenticated tree, 4 nested navigators deep: `NavigationContainer` → `AuthedReadyApp` → `DrawerStackNavigator` (stack, `headerShown: false`) → `DrawerNavigator` (drawer, `initialRouteName="Home"`) → `TabNavigator` (bottom tabs, no `initialRouteName` so it defaults to the first screen) → `HomeStackNAvigator` (stack, `initialRouteName=ScreenNames.Home_Screen`) → `HomeScreen`.
- Drawer siblings: `Home` (→ `TabNavigator`), `Profile` (**bare `ProfileScreen`, not `ProfileStack`**), `Favorites` (`FavotiesScreen`), `messages` (`NotificationsScreen`). `ProfileStack` is reachable **only** via the Profile tab, so the drawer's Profile entry and the Profile tab render the same screen with different navigation stacks — a legacy inconsistency to resolve deliberately, not copy blindly.
- Tab siblings: `Home_Stack` (`HomeStackNAvigator`), `Map` (`MapScreen`, no nested stack), `Profile_Stack` (`ProfileStack`).
- **Final visible screen after auth is `HomeScreen`**, not a generic Home shell. Path: valid token → `AuthedReadyApp` → drawer `Home` → tab `Home_Stack` → stack `Home` → `HomeScreen`.
- First launch (new install, authenticated): `isFirstLunch=true` registers the `"onboarding"` screen *above* `"drawer"` in `DrawerStackNavigator`, so onboarding shows first, then `replace("drawer")` lands on `HomeScreen`. Returning user: no `onboarding` screen registered → `HomeScreen` directly.
- Pre-navigation gate `useAppReady` sits **outside** `Navigation` in `RootFun`: it depends on `getAppSetting()` completing, compares backend `androidVersionCode`/`iosVersion` against the installed version, can raise a force-update modal, and only then sets `appIsReady` and hides the legacy splash after a 3s timer. It is not auth-gated.
- `AuthedReadyApp` mount side effects that run **before/alongside** Home rendering: FCM permission + topic subscription + foreground/background listeners, `initFreshChat()`, `initSentry()`, and a location-permission request via `userCurrentLocation()`.
- Legacy defects worth knowing before copying: (a) `AuthedReadyApp` **writes** `userLocation` to AsyncStorage but never reads it back, so `userLocation.store` is always `null` at startup; (b) `useFetchV2` keys its request effect on `[method, url]` only, so `VehiclesList` never refetches when its `latitude`/`longitude` params arrive after the location resolves; (c) `HomeScreen` only calls `callHomeScreenApi()` on pull-to-refresh, and its `handlePress` references an unimported `changeIcon`.
- Home data endpoints (legacy `apisPath.ts`): `GET /services`, `GET /adds`, `GET /vehicles` (location params from AsyncStorage `userLocation` in `getAllVehicles`). Each home section self-fetches through `useFetchV2` and writes to Zustand; `ViewMap` is a 1s fake-loading section that links to the Map tab.

## Verified `GET /services` Contract (backend + live response)
- Path `GET /api/mobile/v1/services`, registered in `routes/api_mobile.php:48` **outside** the `auth:sanctum` group, so it is public. Confirmed by `MobileParityTest` (no auth headers) and by a live 200 with no `Authorization` header.
- Envelope from the `Response::success` macro in `AppServiceProvider`: `{ success: true, message, data, errors: null }`.
- `data` is `{ list: Service[], metaData }`. `metaData` on mobile uses `totalCount`, `currentCount`, `currentPage`, `itemsPerPage`, `lastPage` (the dashboard variant uses `total`/`page`/`limit` instead).
- `Service` fields: `id` (number), `_id` (string mirror), `name: { en, ar }`, `status`, `createdAt`, `logo`. `logo`, `status` and `createdAt` are nullable; `logo` is a full Cloudinary HTTPS URL.
- Server behaviour: only `status = 'active'`, soft-deleted excluded, ordered **`oldest('id')` (ascending)**, paginated with `limit` defaulting to **10**. No `limit` is sent by the client on purpose, because legacy sent none and the backend default is what legacy actually got.
- `createdAt` is `optional($model->created_at)->toJSON()`, which emits `Y-m-d\TH:i:s.u\Z` (microseconds), **not** strict ISO-8601. Typed as an opaque string; do not parse without normalising.
- Legacy read only `_id`, `name`, `logo`; selection was keyed on `_id`. The rebuild keys selection on `id` and keeps `_id` only for parity.
- Live data at time of verification: 7 services, ascending — Wench, Flat Tires, Flat Battery, Unlock Key, Car Wash, Oil Change, Computer Check.

## Verified `GET /adds` Contract (backend + live response)
- Path `GET /api/mobile/v1/adds`, registered in `routes/api_mobile.php:36` **before** the `auth:sanctum` group (line 53), so it is public. Confirmed by `MobileParityTest` (no auth headers) and by a live 200 with no `Authorization` header. `GET /adds/{ad}` is the `show` sibling.
- Same `{ success, message, data, errors: null }` envelope and same five `metaData` keys as `/services`.
- `Add` fields: `id` (number), `_id` (string mirror), `title` (**plain scalar string, NOT a localised `{ en, ar }` object**), `link`, `photo`, `startedAt`, `expiredAt`, `status`, `createdAt`, `updatedAt`. Nullability comes from `2026_05_20_060000_create_ads_and_app_settings_tables.php`: `title` and `photo` are NOT NULL, **`link` is nullable** (and the backend's own parity fixture omits it), dates go through `optional()->toJSON()` so they are typed `string | null` with microsecond precision.
- Server behaviour: only ads with `started_at <= now <= expired_at` **and** `status = 'active'`, soft-deleted excluded, ordered **`latest('id')` (DESCENDING — the opposite of `/services`)**, `limit` defaulting to 10. No `limit` is sent, matching legacy.
- Legacy `CarouselCardItem` displayed **only the image**; its `title` render was commented out, so no text is shown. Adds are therefore not localised and need no language handling, unlike `Service.name`.
- Legacy `isValidHttpUrl` guard is preserved (http/https only) but the legacy bug where `Linking.canOpenURL` was never awaited — making its `if (!canOpen) return` check a always-truthy Promise — is fixed. `new URL()` was confirmed working in Hermes at runtime.
- Live data at time of verification: 3 adds, ids 5, 4, 3 — `car-service` -> `https://ayman-car-service.yamak-kw.com/`, `https://wesamgulf.yamak-kw.com/`, `https://yamak-kw.com/`, all Cloudinary photos.
- Carousel geometry preserved verbatim: `SLIDER_WIDTH = window.width + 80` measured once at module load, `ITEM_WIDTH = round(SLIDER_WIDTH * 0.7)`, content padding `(SLIDER_WIDTH - ITEM_WIDTH) / 2`, outer `marginLeft: -80`, card 200pt tall with `paddingBottom: 40` and `resizeMode="stretch"`. Autoplay 5000ms delay then 3000ms interval, only when there are 2+ adds. There is **no** pagination dot in legacy, so none was invented.

## Verified `GET /vehicles` Contract (backend + live response)
- Path `GET /api/mobile/v1/vehicles`, registered in `routes/api_mobile.php:49` **before** the `auth:sanctum` group (line 53), so it is **public** — verified live with both no `Authorization` header and a bogus Bearer token (both 200). `GET /vehicles/{vehicle}` (`show`) is the sibling at line 50. `getVehicleById` reads `/vehicles/{id}`.
- Controller `Api\Mobile\VehicleController::index` adds `distance` and delegates the field shape to `Api\Dashboard\VehicleController::vehicleResource`.
- Query params — all optional, **no validation**: `latitude`, `longitude`, `sort` (`'desc'` → descending, anything else ascending; default ascending), `page` (default 1), `limit` (default 10), `query` (`label_number` LIKE `%q%`).
- Filters hardcoded: `work_status = 'online'` AND `current_driver_id` NOT NULL. Eager loads: `branch`, `company`, `services`, `drivers`, `currentDriver`. **No `orderBy`** on the base query.
- **`distance` is added only when `latitude && longitude && $vehicle->latitude && $vehicle->longitude` (PHP truthiness, so the string `"0"` is falsy)** — value is `sqrt(dLat² + dLng²)`, raw **Euclidean degrees** (not km, not haversine). Without effective coords no item carries a `distance` key and `sortBy('distance')` is a no-op → DB-dependent order.
- Pagination is manual: `->get()` loads every match, then `forPage($page, $limit)`. Out-of-range `page` → HTTP 200 with an empty list (`currentCount: 0`, `lastPage` still correct). **`limit=0` → HTTP 500** (integer cast → 0 → division by zero); a non-numeric `limit` casts to 0 the same way. The client must never send `limit=0` or garbage.
- Envelope and `metaData` same as `/services` and `/adds`: `{ success, message, data: { list, metaData }, errors: null }`.
- `Vehicle` resource fields: `id`, `_id`, `status`, `companyId`, `company` (resource|`null`), `branchId`, `branch` (resource|`null`), `drivers[]`, `services[]` (standard `serviceResource`), `createdAt`, `workStatus`, `lastActiveDate`, `currentDriver` (resource|`null`), `iconMap`, `labelNumber`, `modelName`, `geoLocation: { latitude, longitude, coordinates: [lon, lat] }`. Migration (`2026_05_20_030000_...`): `latitude`/`longitude` are `decimal(10,7)` **nullable**; `logo`, `type`, `icon_map`, `label_number`, `model_name`, `last_active_date`, `current_driver_id` nullable.
- Live results (2 online vehicles, ids 3 and 6):
  - **A. no coordinates** → 200; no item has `distance`; order 3,6 (DB order); `totalCount: 2`.
  - **B. valid `29.3759,47.9774`** → 200; every item has `distance` (0.1582, 0.5853); ascending order 3,6; `sort=desc` → 6,3.
  - **C. invalid `abc`,`xyz`** → **200, no error**: `(float)"abc"` = `0.0`, so `distance` is computed against (0,0) and the sort flips to 6,3 with garbage values (≈56). Invalid coords silently corrupt distances and ordering.
  - **D. `0`,`0`** → 200; no `distance` (string `"0"` is falsy) — a legitimate zero coordinate behaves like "absent".
  - partial coords (latitude only, or empty longitude) → 200; no `distance`.
- Consequence: the backend has a **verified fallback** — a coordinate-less `GET /vehicles` is fully supported and returns the list (minus `distance`/deterministic order). This makes a "wait for location" strategy safe to bound.

## Verified Vehicles Location Flow (reference: yamak-mobile)
- Trigger chain: `RootFun.tsx:100` → authenticated → `AuthedReadyApp` mounts and `userCurrentLocation()` immediately requests `PermissionsAndroid.request(ACCESS_FINE_LOCATION)` (Android; iOS calls `requestAuthorization()` then `getCurrentPosition()` without waiting for the result) **in parallel with** `DrawerStackNavigator` → HomeScreen. On grant → `Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 })` → success sets `{ latitude, longitude }`, which `AuthedReadyApp` writes to the store **and** AsyncStorage key `userLocation` (`setStorageValues(...JSON.stringify(location))`). On denial → `console.log` only; `currentLocation` stays `null` for the session; `NEVER_ASK_AGAIN` falls into the same branch; the returned `error` value is never read.
- Home `VehiclesList` mounts with `useState({ latitude: userLocation?.latitude, longitude: userLocation?.longitude })` — read **once** at mount, when the store is still `null` — and calls `useFetchV2({ url: "/vehicles", method: "get", params })`, whose effect deps are `[method, url]` (**`params` is not a dependency**). When the location later resolves, `VehiclesList` runs `setParams({lat,lng})` but **`useFetchV2` does not refetch**: the Home `/vehicles` request permanently carries **no coordinates**. This is the exact race flagged at line 50(b), confirmed in code. (Detail: a late remount of Home after location resolved would seed params correctly — the defect is specific to the first authenticated Home mount.)
- The **only** legacy path that ever sends coordinates is pull-to-refresh: `HomeScreen.callHomeScreenApi` → `getAllVehicles()` (`src/apis/vehicles.api.ts`) reads coords back from **AsyncStorage** and merges `{...location, page: 1, limit: 10}` (`AppLimitList = 10`). `JSON.parse(null)` is `null` (safe by accident: spreading `null` is a no-op) so a never-persisted location degrades to no coords; a corrupt stored value would throw and silently fail the whole 3-way `Promise.all` refresh. Stored coords are **stale** (never refreshed) and boot-time restore does **not** happen (the store always starts `null`).
- `makeApiCall` returns the **envelope body** (`response.data` in `axios.config.ts:100`), so both `getAllVehicles`' `response?.data?.list` and `VehiclesList`'s `vehiclesList?.list` correctly reach `data.list` — there is **no envelope-shape bug** in the vehicles flow.
- `VehicleItem` renders `{fixNumbers(item?.distance)} {t("KM")}`; `fixNumbers(undefined)` defaults to `0.0`, so a coordinate-less list shows "0.0 KM" on every card, and the number shown is actually **degrees, not km** (≈100× wrong at Kuwait latitude). Recorded as legacy presentational bugs — not to be silently "fixed" in the rebuild without a product decision.
- `ViewMap` is a **static promo banner** (1s fake skeleton, three icon/text rows, "Browse Map" button → Map tab) — performs no fetch, needs no location. The Map screen (`MapScreen`) loads markers from `GET services/{id}/vehicles` with **no user coordinates**; `AppMap` (`components/map/Map.tsx`) uses the location store only for a `Marker` "you" pin. Verified location-store consumers in legacy (7): Home `VehiclesList`, `AllVicelessScreen`, `AllVehiclesList` pull-refresh, Home pull-refresh (`getAllVehicles`), `VehiclesDetailsScreen` (WhatsApp/call **order-request payload**), `ProfileMapView` (marker), `AppMap` (user marker).

## Vehicles Location Architecture — decided & implemented (slice 3B)
- **Strategy A (implemented): wait for location, bounded.** `src/location/location-context.tsx` exposes `requestLocation()`; callers never fetch while the state is `unknown`/`resolving`. `useVehicles` waits for a fetchable state (`available` | `denied` | `unavailable` | `timed-out`) before issuing the FIRST `GET /vehicles`.
- **Grace period:** `LOCATION_GRACE_PERIOD_MS = 10_000` (10s). Foreground `Balanced` accuracy. If the position promise does not settle within the window → `status: 'timed-out'` (explicitly NOT a permission denial). Timeout wins via `Promise.race`; the still-pending position result is **ignored entirely** (never applied to state), so a late GPS fix cannot flip a fallback cycle. Runtime note: on this emulator the GPS provider doesn't produce a fix within 10s after app cold start, so the timed-out branch fired authentically and the coordinate-less fallback rendered correctly every time.
- **Ownership C (implemented):** `UserLocationProvider` + `useUserLocation()` — React Context, app scope, memory-only, mounted at the future authenticated-app boundary. No auto-request on mount (mounting must never prompt on `/register`). During this slice it was mounted only inside the temporary `preview-vehicles.tsx` route, which has been deleted.
- **Persistence (none, implemented):** coordinates are never written to AsyncStorage/SecureStore; fresh OS fix per authenticated session.
- **State model (implemented):** `status: 'unknown' | 'resolving' | 'available' | 'denied' | 'unavailable' | 'timed-out'`; `coords: { latitude: number; longitude: number } | null` (**non-null iff `status === 'available'`**); `canAskAgain: boolean` (from the Expo permission response, so "never ask again" is visible); `error: string | null` (safe message only on the `unavailable` failure path); `requestLocation(): Promise<void>`.
- **Request rules (implemented):** `getVehicles` accepts `{ latitude?, longitude? }` and only ever sends **both as finite numbers or neither** (a lone/invalid value is dropped at the API boundary). `limit` is never sent (`limit=0`/garbage → HTTP 500). `useVehicles` freezes the fetch decision per cycle (`decisionLockedRef`): a later location change after a fallback fetch does **NOT** auto-issue a second request (verified at runtime: after `denied` fallback, when location later became `available`, the list stayed km-free until an explicit refresh). Manual `refetch()` re-reads the CURRENT location state (available → with coords, otherwise without) and is guarded by a `requestIdRef`.
- **Distance display (decided: client-side Haversine, never legacy "KM"):** the backend `distance` is Euclidean degrees and is NOT rendered. `src/utils/distance.ts` computes true km (Haversine, `EARTH_RADIUS_KM = 6371`, null on non-finite inputs). `VehicleItem` shows `X.X km` only when the fetch used user coords AND `isUsableVehicleGeo(vehicle.geoLocation)` (the resource coerces missing vehicle coords to `(0,0)`, treated as "no usable location"); otherwise the distance area is blank — no "0.0 KM". Distances are derived from `coordsUsed` (the frozen per-cycle coordinates), never the live context. Legacy reproduction notes: `Name :` row guards nullable `branch.name` (legacy crashed); card keeps legacy geometry (350×120, radius 20, gold 60×30 "View" button); the legacy black 1pt divider is recast as `colors.border`.
- **Service filter (verified — none on Home):** legacy Home `VehiclesList` never filters by service (`selectedId` excludes a vehicle only in the non-existent All-Vehicles screen); `services/{id}/vehicles` (service-filtered) is the Map screen's endpoint. No `serviceId` prop was invented. "View All" only renders when a consumer supplies `onViewAllPress` (legacy target route does not exist).
- **Shared `ApiErrorRow` (decided: extracted):** the third identical error row justified one component (`src/components/home/ApiErrorRow.tsx`); `ServicesList` + `AddsList` adopted it with byte-identical JSX/styles and dead local styles removed. `VehiclesList` uses the same row.
- Expo gaps closed by 3B: `expo-location@~57.0.20` installed; `app.json` now has the `expo-location` plugin (iOS `locationWhenInUsePermission`: "YAMAK uses your location to find nearby roadside service providers…"), Android `permissions` `["ACCESS_COARSE_LOCATION","ACCESS_FINE_LOCATION"]` (the plugin also injects both). No background location, no geofencing, no always-on access. Expo Go bundles the module + broad permissions so runtime testing worked there; the app.json permission/plugin changes only take effect in a dev/prod native build (`expo run:android` / EAS), where a rebuild will be required — in Expo Go the API already works because Expo Go ships the native module and `ACCESS_FINE/COARSE_LOCATION`.

## Verified Map & ViewMap Analysis (Step 4A — read-only, decisions recorded)
- **ViewMap (legacy `components/home/ViewMap.tsx`) is a static promo CTA, not a map.** A fake 1s mount timer shows the `NearByVehiclePH` skeleton, then a white radius-10 card: 3 icon/text rows (`map-outline`+`ViewOurMap`, `location-outline`+`PickAService`, `time-outline`+`SaveYourTime`), a gold `FillledButton` (height 32) `BrowseMap`, and the `Paper map-cuate.svg` image (150×150). Button → `navigation.navigate("Map")` with **no params**. No fetch, no location, no service dependency. Dead code: unused `useFetch` import, unused `renderItem`/`VehicleItem`, unused `Dimensions`/`windowWidth`.
- **Map is a bottom TAB in legacy, not a stack screen** (`TabNavigator`: `Home_Stack`, `Map`, `Profile_Stack`, inside drawer `Home`). All entry points: Home `ServiceItem` press (`setSelectServiceId(_id)` + `navigate("Map", { id: _id })`), Home header `map-marker-radius-outline` icon (no params), and `ViewMap` (no params).
- **`MapScreen` (legacy) startup/data flow:** local `selectedServiceId` state (NOT the store); `useFetchV2({ url: selectedServiceId ? "services/{id}/vehicles" : "", method: "get" })` (empty URL ⇒ **no request** when nothing is selected); `vehicles = vehicelsList?.list`; `useEffect([params?.id])` copies the route param into local state; chip press `handleSelectedService(id)` refetches. Renders `AppMap` (data, `isfetchingVehicles`), an absolute `ActivityIndicator` while loading, and a bottom footer with `ServicesListMap` (horizontal 80×80 circles).
- **`components/map/Map.tsx` (AppMap) behavior:** `react-native-maps` `MapView provider={PROVIDER_GOOGLE}`; hardcoded `initialRegion`/`region` = Kuwait (29.3748/47.9820 …, 29.3809/47.9902 …); user marker from the `userLocation` store (`title=" you"`) plus `showsUserLocation`; vehicle markers = `PinLocation.png` 70×70 with an `iconMap` URI overlay (50×30, `isArabic`-based offset), `key={index}`, press → `navigate("VehicleDetail", { _id })`.
- **Verified legacy Map defects (do NOT port):**
  1. **Envelope mismatch**: `services/{service}/vehicles` returns `data` as a **bare array** (`response()->success($vehicles)`; `MobileParityTest:242` asserts `data.0.*`), but `MapScreen` reads `vehicelsList?.list` ⇒ `undefined` ⇒ **vehicle markers never render in the legacy Map**.
  2. **`geoMetry` typo**: `AppMap` reads `item.geoMetry.coordinates` (and `data[0]?.geoMetry?.coordinates` in the animate effect). The resource field is `geoLocation.coordinates = [lon, lat]`; if markers ever had data, `const [long, lat] = undefined` throws.
  3. **Marker press navigation is dead**: `VehicleDetail` is registered only inside `HomeStack` (the Home tab); the Map tab is a sibling, so `navigate("VehicleDetail", {_id})` from the Map tab is an unhandled action even if markers existed (bubbles tabs → drawer → root stack, never found).
  4. **Hardcoded map region + controlled `region`** with no `onRegionChange*` handler pins the viewport (user panning overridden).
  5. **Global `selectedServiceId` store is redundant for Map**: `ServiceItem` writes it only to underline the Home chip; `MapScreen` consumes only the route param + local state (duplicate state).
  6. **Map never sends coordinates** to `services/{id}/vehicles` (its `useFetchV2` call has no `params`) ⇒ the endpoint's `distance`-sort feature is never exercised by legacy Map and no distances are shown on the map.
  7. **Services chips depend on Home having loaded `services.store`**: `ServicesListMap` does not self-fetch — opening the Map tab directly shows the `ServiceListPH` skeleton forever. `MapServiceListPH.tsx` is fully commented out; the `ServiceDummy` fallback is unreachable (early return).
  8. Dead state/props: `activeMarker` (AppMap), `isfetchingVehicles` (AppMap), `currentLocationIconContainer` style + empty `drawerIconContainer` (MapScreen), unused imports in `ViewMap`, `key={index}` markers, `interfaces/map.interface.ts` (MapProps redefined inline).
  - Intentional (keep): Map as a bottom tab; route param `{id}` canonical on entry; local selection; chips share services data; user location consumed from the shared owner.
- **`GET /api/mobile/v1/services/{service}/vehicles` contract (verified — backend source + `MobileParityTest`; live DB was down during 4A):**
  - Public (line 47, outside the `auth:sanctum` group at line 53), name `services.vehicles`. Route-model-bound `Service $service` ⇒ unknown id → **404** (default Laravel JSON, not the success envelope).
  - Controller `Api\Mobile\ServiceController::vehicles`: filters `work_status='online'`, `current_driver_id NOT NULL`, `whereHas('services', services.id = service.id)`; eager loads `branch, company, services, drivers, currentDriver`; `distance` = `sqrt(dLat² + dLng²)` **Euclidean degrees**, appended only when query coords AND vehicle coords are both truthy (string `"0"` falsy); `sortBy('distance')` ascending (no coords ⇒ no `distance` key ⇒ DB order); **no pagination** (`->get()`, bare-array response).
  - Envelope: `{ success, message, data: [Vehicle…], errors: null }` — **NOT** `{ list, metaData }`.
  - Vehicle resource identical to `/vehicles` (shares `Dashboard\VehicleController::vehicleResource`): `id`, `_id`, `status`, `companyId`, `company|null`, `branchId`, `branch|null`, `drivers[]`, `services[]`, `createdAt`, `workStatus`, `lastActiveDate`, `currentDriver|null`, `iconMap`, `labelNumber`, `modelName`, `geoLocation: { latitude, longitude, coordinates: [lon, lat] }`. **No `geoMetry` anywhere in the current backend.**
- **Marker data fields:** position → `geoLocation.coordinates` `[lon, lat]` (legacy misread `geoMetry`); icon → `iconMap` URI (+ local `PinLocation.png` pin); press → `_id` → `VehiclesDetailsScreen` (`getVehicleById` → public `GET /vehicles/{id}`; WhatsApp/Call POST `/requests` with `{ driverId, services, userId, platform, payload: { userLocation, mobileType, button } }`). `distance`, `company`, `branch`, `services`, `currentDriver`, `labelNumber`, `modelName`, `workStatus` are unused on the legacy map.
- **Map library (Expo SDK 57 docs, fetched during 4A):** legacy uses `react-native-maps ^1.29.0` with `PROVIDER_GOOGLE`. Per the SDK 57 `map-view` reference, `react-native-maps` supports `['android','ios','expo-go']` and is **Included in Expo Go** (no setup, no API key in Expo Go); standalone builds additionally need the Maps SDK enabled + SHA-1 fingerprint + a Google API key via the `react-native-maps` config plugin (`androidGoogleMapsApiKey` / `iosGoogleMapsApiKey`). `expo-maps` is **alpha** on SDK 57 and **not available in Expo Go** (dev build required). ⇒ **rebuild choice: `react-native-maps` via `npx expo install react-native-maps`; the "no new deps beyond expo-location" rule must be waived before the Map slice starts.**
- **User-location relationship (decided):** legacy Map consumes the shared `userLocation` store (written by `AuthedReadyApp` at app start) and never requests location itself. The rebuild consumes `useUserLocation()` from `UserLocationProvider` the same way — the provider stays the single owner; no second location flow on the Map.
- **Distance (decided):** legacy Map shows no distances and never sends coords to the Map endpoint; the rebuild MAY send coords (finite-pair guard, per 3B rules) for nearest-first server ordering, but backend `distance` is Euclidean degrees and is never rendered. `src/utils/distance.ts` (Haversine km) stays the only km source and is used only where legacy displayed km — the Map displays none.
- **Selected-service architecture (decided):** route param is the canonical entry (`/map?serviceId=`); the Map screen keeps a local selection state seeded/synced from the param (mirrors legacy local state); chips select locally and refetch. **No global selected-service store** — legacy's `selectedServiceId` Zustand pair is dead weight for Map.
- **Routing model (decided):** final shape mirrors legacy tabs: `(app)/(tabs)/home`, `(app)/(tabs)/map`, `(app)/(tabs)/profile` (+ drawer later), with `VehicleDetail` as a screen pushed from the Home stack and from Map markers (registered above the tabs). Direct deep link to `/map` = legacy opening the Map tab with no service selected (a valid state).
- **ViewMap timing (decided):** ViewMap is independently buildable as a UI block, but its button must target a real `/map` route — build ViewMap only once the Map tab exists, or mount it with an `onBrowseMapPress` callback to be wired when `/map` lands. Recommended order: Map slice before ViewMap.
- **Implementation BLOCKERS (4A):** (1) the authenticated Home-shell decision — no `/home`, `/map`, or tabs may be created until it is resolved (standing constraint); (2) `react-native-maps` install approval (standing "no new deps" rule). Live DB-backed API tests were not possible during 4A: `192.168.8.125:8000` returned `root=200`, but MySQL `Yamakdb_prod_test` on 127.0.0.1:3306 refused the connection.

## Google Maps Native Config Audit (read-only — legacy yamak-mobile)
- **Library:** `react-native-maps ^1.29.0` (package.json:61). `ios/Podfile.lock` pins the installed pods at `react-native-maps (1.8.4)` + `react-native-google-maps (1.8.4)` + `GoogleMaps 7.4.0` — **stale skew** vs the npm range; legacy `node_modules` is absent so the actually-installed JS version cannot be confirmed. `MapView provider={PROVIDER_GOOGLE}` appears in exactly two legacy components: `src/components/map/Map.tsx:5,63` (AppMap) and `src/components/EditProfile/ProfileMapView.tsx:3,15`.
- **Android Maps key — PRESENT, hardcoded, committed.** A real `com.google.android.geo.API_KEY` meta-data value is an inline literal in BOTH `android/app/src/main/AndroidManifest.xml:16-18` and `android/app/src/development/AndroidManifest.xml:14-16` (same key on both; masked `AIzaSyDp…bcbIo`; full value never logged). All flavors/build types share it — production + staging use the main manifest (no `staging` manifest exists), no `release` manifest exists, and `debug` adds only `SYSTEM_ALERT_WINDOW` + cleartext. It is NOT in `res/values/strings.xml` (only `app_name` in main/staging/development), NOT in any `.env*` (gitignored; masked scan shows no map key inside), NOT via `react-native-config`, NOT in gradle. Both files are git-tracked ⇒ **the Android key is committed to source control.**
- **Android Maps config files:** `android/app/src/{main,development}/AndroidManifest.xml` (key + permissions), `android/app/src/debug/AndroidManifest.xml`, `android/app/build.gradle` (flavors `production com.yamak.mobapp` / `staging com.yamak.mobstaging` / `development com.yamak.mobdev`; release signs with the **debug keystore**; proguard off), root `android/build.gradle` (buildTools 37.0.0, minSdk 24, compileSdk 37, targetSdk 36), `android/settings.gradle` (autolink). **No explicit `play-services-maps` dependency** — react-native-maps brings it transitively via autolink.
- **Android permissions:** `INTERNET`, `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION` (main + development); `POST_NOTIFICATIONS` (main only). No background/always-location permission.
- **Android Play Services:** `com.google.gms.google-services` plugin + `com.google.gms:google-services:4.5.0` classpath and `googlePlayServicesAuthVersion 21.0.0` are **Firebase / Google Sign-In**, not Maps. No maps-specific Play Services setup exists.
- **iOS Maps config:** Google provider via `pod 'react-native-google-maps', :path => '../node_modules/react-native-maps'` (`ios/Podfile:43-44`) — AirGoogleMaps (Google, NOT Apple Maps). A **second, different** API key is hardcoded in `ios/Yamak/AppDelegate.mm:21` `[GMSServices provideAPIKey:@"AIzaSyBS…8pU"]` (masked; tracked ⇒ committed). No key in any Info.plist.
- **iOS permission descriptions:** `NSLocationAlwaysAndWhenInUseUsageDescription` + `NSLocationWhenInUseUsageDescription` in all three Info.plists (`Yamak`, `Yamak dev`, `Yamak Stage`) with the same wording ("…use your location to find the nearest available vehicles…"). **No** `NSLocationAlwaysUsageDescription` key. iOS target 15.1. `react-native-permissions` setup configures only `Notifications` — the location strings are hand-written plist entries.
- **Secret management:** `react-native-config ^1.7.2` exists and drives API/backend config per flavor (`.env.production` / `.env.development` / `.env.staging`, dotenv.gradle mapping; all `.env*` gitignored) — but the Maps keys are **plain hardcoded secrets** entirely outside the env chain. (Side finding, non-Maps: Firebase keys are also hardcoded in tracked files — `android/app/google-services.json`, `ios/Google_Service/{prod,dev}/GoogleService-Info.plist`, `src/firebase/firebase.config.tsx:9`, and generated build res; also leaked into tracked log files `final_cold1.log` / `final_cold2.log`.)
- **Debug/release differences:** none for Maps — one single key serves every flavor/build type; only applicationId + env file differ per flavor, and the debug build type adds dev conveniences (cleartext, overlay window). Legacy `release` additionally signs with the **debug keystore** (do not copy).
- **Rebuild impact (verified facts only — NOT applied):** Expo Go (SDK 57) ships `react-native-maps` with its own Google key → no config needed for dev. A future standalone build of the Map slice will need the `react-native-maps` config plugin — `app.json` plugins entry `["react-native-maps", { "androidGoogleMapsApiKey": "<new>", "iosGoogleMapsApiKey": "<new>" }]` — plus Android: Maps SDK enabled + SHA-1-restricted new key + a real release signing keystore; iOS: Maps SDK enabled + bundle-id-restricted new key. **Never reuse the legacy keys.** `provider={PROVIDER_GOOGLE}` carries over as-is.
- **Security note (deferred, not acted on):** both Maps keys are committed in tracked legacy files. Recommendation: rotate/restrict them under Google Cloud and strip them from the legacy manifests/AppDelegate once the rebuild supersedes them.

## Home Step 4B (Map tab) — implemented & runtime-verified
- **Approved sources of truth:** visual = the new-ui map prototype `docs/rebuild/new-ui/main/map/index.html` + `prototype-shared/{tokens,base,components}.css`; runtime behaviour = legacy `MapScreen`/`AppMap` minus the recorded defects (bare-array envelope misread, `geoMetry` typo, dead marker navigation, pinned controlled region, redundant store, Home-bound chips). No fake data, no invented routes, no ViewMap (that slice is still next).
- **Routes (approved shape):** `src/app/(app)/_layout.tsx` mounts the SINGLE shared `UserLocationProvider` around a `<Slot />` (the Map consumes `useUserLocation()` — never a second location flow; mounting the provider here means `/register` can never prompt). `src/app/(app)/(tabs)/map.tsx` = the Map screen. `/map` (no param) is a **valid** no-selection state; `/map?serviceId=N` selects canonically; the route param mirrors local state via a param effect — **no global selected-service store**. Registered in the root Stack as `/map` (generated typed routes confirm).
- **Map camera (approved):** `MapView provider={PROVIDER_GOOGLE}`, UNcontrolled. `initialRegion` Kuwait (29.3759/47.9774, Δ0.30/0.25); a one-time `animateToRegion` (Δ0.05) recenters on the user's position when the first `coords` arrive; no controlled region, no `onRegionChange*` lock (legacy defect 4 not ported). `showsUserLocation={false}` + a custom navy user badge (prevents the legacy double-pin).
- **Markers (approved):** gold circular badges (40dp, 48dp while selected) with `iconMap` image + label, anchored centre, `key={vehicle.id}`; position ALWAYS from `geoLocation.coordinates [lon,lat]` via `src/utils/vehicle-marker.ts` (null/invalid/`(0,0)`-sentinel geo ⇒ skipped, no marker, no crash — verified with both a null `geoLocation` and a `[0,0]` vehicle in the mock). Press sets a local `selectedVehicleId` ONLY — Vehicle Details has no route and is never invented. `tracksViewChanges={isActive}` (Android re-snapshots markers only while tracked, so the selected size change re-renders; idle markers snapshot once).
- **Data (approved hook rules):** `useMapVehicles(serviceId)`: `serviceId === null` ⇒ NO request (valid Map state); a selection arms a fresh cycle, waits for a fetchable location state (`available` | `denied` | `unavailable` | `timed-out`), then starts **exactly once per selection** (`cycleRef.started` frozen decision, `requestIdRef` stale-guard); manual `refetch()` re-reads the CURRENT location state. Endpoint `GET /services/{serviceId}/vehicles` — bare-array `data` (`VehiclesByServiceResponse`), `limit` never sent; coords are sent only as a finite `latitude`+`longitude` pair when `available`. **Runtime-found bug fixed in-slice:** the original effect armed a new selection and returned early, so when the location had already settled nothing re-fired it (spinner forever, no request). The arming path now falls through and starts the request in the same pass when the location is ready.
- **UI (visual authority = prototype):** on-light app bar (☰ Menu | “Map” title | 🔔 Notifications — all inert, no fake badge); gold `EnableLocationCard` (prototype `card.gold`: 📍 title / body copy / primary button) shown whenever `status !== 'available'`, button wired to `requestLocation()` (the map also triggers a single explicit `requestLocation()` on first mount when status is `unknown`); safe `ApiErrorRow` overlays — vehicles error as a floating card over the map, chips error as a row in the footer; footer chips (`MapServiceChips`) self-fetch through the shared `useServices()` (legacy Home-dependence defect 7 not ported); caption “Marker/tap → vehicle details.” under the permission card (prototype copy).
- **Theme additions:** `colors.primary #15406F`, `goldTint #FDF7E6`, `goldTintBorder #FBEED4`.
- **Maps dependency:** `react-native-maps@1.27.2` via `npx expo install` (SDK-57 compatible; bundled in Expo Go — no key needed there). Standalone builds later need the `react-native-maps` config plugin with NEW SHA-1/bundle-restricted keys (see the Google Maps config audit; never the legacy committed keys) — documented only, not configured.
- **Shared fix (real shared bug, flagged in-slice and fixed):** `src/api/api-error.ts` `extractBackendMessage` surfaced ANY JSON `message` verbatim. With the live backend down (`APP_DEBUG`-style 500 body: `SQLSTATE[HY000] … mysql 127.0.0.1:3306 …`), the Map (and every `ApiErrorRow` consumer in Home slices 1–3B) rendered the raw SQL/exception text — a “raw response body” leak. A sanitizer now admits only short, single-line, framework-safe phrases (`Not Found`, `These credentials do not match our records.`, …) and rejects debug artifacts (SQLSTATE, connection-refused, exception/stack-frame markers, multi-line, HTML, >160 chars), so `ApiError.http` falls back to the generic `Request failed with status N`. Proven by a standalone execution test of the compiled function (`debug-500 → undefined`, `not-found → "Not Found"`, credentials → pass-through, multi-line/HTML → undefined). This changes no success-path behaviour.

## Home Step 4C (ViewMap CTA) — implemented & runtime-verified
- **Visual source of truth changed mid-slice (user decision, not a port):** this slice opened against the `new-ui` prototype (`docs/rebuild/new-ui/main/home/index.html` — "Nearby on map" card). During the slice the user dropped `docs/rebuild/approve-ui/home/` (`code.html` + `screen.png`, authored 4:50 PM, copied in ~7:50 PM) — the same approved-reference pattern already used for register (`docs/rebuild/approve-ui/register/`). Asked inline, the user chose the **`approve-ui/home` "Nearby on radar" card** as governing. It supersedes the already-implemented-and-runtime-verified new-ui card; `src/components/home/ViewMap.tsx` was rewritten to the radar design. A sibling `docs/rebuild/approve-ui/map/` (authored 4:59 PM, copied 8:00 PM) also appeared during the slice — the approved MAP reference for a future slice; NO work was taken on it in 4C.
- **Component:** `src/components/home/ViewMap.tsx` is the only product file. Sibling-convention-scoped (like `ServicesList`/`ApiErrorRow`), a plain exported function component.
- **Approved radar-card VISUAL anatomy (top→bottom, per `approve-ui/home/code.html` lines 244-307):** white rounded-16 bordered (`slate-200`) card → header: pulsing emerald dot + **"Nearby on radar"** (`#0B2A4A` navy 12px) + 10px caption + blue badge top-right → h-36 map display: light backdrop, SVG road vectors + Gulf waterline circle, pulsing **rose 📍 pin + "Your location" pill**, two decorative chips (top-left / bottom-right) → footer: copy line + navy **"Explore Map"** button (white chevron). ONLY the button is interactive — the rest is decorative, faithful to the HTML structure.
- **Demo statistics are decorative examples, NOT product data — neutralized in the implementation (latest approved rules):** the approved HTML contains illustrative values (`Kuwait City & Salmiya zone`, `~14 min avg`, `Winch · 1.2 km`, `Battery · 800m`, `12 active recovery units ready`) backed by NO verified product data. STEP 4C stays static and adds no API/location fetching, so the implementation replaces them with non-quantified labels while preserving the approved visual composition: caption → **"Kuwait"**, badge → **"Map preview"**, chips → **"🛻 Tow"** / **"🔋 Battery"** (no distances), footer → **"Recovery units ready"**. No replacement statistics were invented.
- **Animation (no new dep):** built-in `Animated.loop` (native driver): pin ping per the approved keyframes (scale .95→2.2 / opacity .8→0 / 2.2s) and header dot ping (1s). Runtime-confirmed by two pink halo shades caught in one static screenshot (the fading ping ring over the pin).
- **SVG (no new dep):** `react-native-svg` (already installed for the Map slice) renders the approved inline road vectors (3 paths + dashed lane + open waterline ring, opacity 40%) and the button chevron (`m8.25 4.5 7.5 7.5-7.5 7.5`).
- **Gradient approximation:** the approved map backdrop is a CSS diagonal gradient (`from-sky-100 via-blue-50 to-slate-200`); `expo-linear-gradient` is NOT a dependency and the standing no-new-dependency rule forbids it, so the backdrop is its flat midtone **`#EFF6FF`** (pixel-verified at runtime: exactly R239 G246 B255). Same policy as the earlier new-ui frame approximation.
- **Palette kept component-local (`RADAR` const with approve-ui class mappings in comments).** Theme tokens reused only where already exact: `surface`, `border` (slate-200), `subtitle` (slate-500), `title` (slate-900), `fieldLabel` (slate-700), `fieldText` (slate-800), `brandText` (button label), `radius.md` (rounded-xl = 12), `spacing.lg/md/sm` for margins/gaps, `fontWeight`. No theme additions.
- **CTA:** `router.push('/map')` with NO serviceId → the verified `/map` no-selection state (app bar + map + chips, zero `/services/{id}/vehicles` requests). Runtime-verified end to end this slice.
- **No API, no location, no global state, no MapView, no skeleton, no fake 1s loading** — the card is static promotional copy with no data backing; the prototype's illustrative numbers ("12 active" count, "~14 min avg", km distances) are DEMO EXAMPLE VALUES, not product data (see the neutralization bullet above).
- **`approve-ui/map` = Map visual authority + consistency reference (latest approved rules):** the user-approved `docs/rebuild/approve-ui/map/` (home's sibling, copied in 8:00 PM) supersedes the `new-ui` map prototype as the Map screen's visual authority and is the consistency reference for map-related visuals. A 4C consistency check of the Home radar preview against `approve-ui/map/code.html` (marker style, map surface treatment, badges/chips, navy/gold/green hierarchy, border/radius, typography) concluded **compatible — no ViewMap change required**: each surface follows its own authority (radar = home HTML: flat light-blue backdrop, rose user pin, blue road vectors; map = approve-ui/map: warm grid surface, gold provider pins, blue user-dot), while both share navy brand text/surfaces, emerald live-dot language, white/95 floating pills with slate-200 borders, rounded-xl buttons/controls and 9-12px bold typography. ViewMap remains a static illustration, NOT a MapView, and gains no new functionality.
- **Legacy not ported:** the legacy ViewMap (fake-1s skeleton, 3 icon rows, gold BrowseMap button, `Paper map-cuate.svg`) is superseded by the radar card. No asset copy — emoji glyphs (📍🛻🔋) + inline SVG only.
- **Accessibility:** CTA `accessibilityRole="button"` + label "Open the road services map" + hitSlop boosting the visually-compact 11px-text button towards a usable touch target; the decorative map display is hidden from screen readers (`accessibilityElementsHidden` + `importantForAccessibility="no-hide-descendants"` on the map frame, chips, pin, header dot). Footer copy stays readable.
- **Runtime-method notes (kept for future slices):** (1) `uiautomator dump` became unreliable once the component runs infinite `Animated` loops — it reports "could not get idle state" and returns STALE/WRONG hierarchies (it showed the launcher while Expo Go was verifiably top-resumed). Ground truth became **screenshots + Windows OCR** (`D:\OpenCodeTemp\opencode\yamak-map-mock\ocr.ps1`, WinRT `Windows.Media.Ocr` from pwsh) + System.Drawing pixel probes. (2) Expo Go's cached bundle only refreshes via `pm clear`; after that the intro→Continue→dev-menu Close (or Reload) dance is needed once. (3) `exp://` deep links are honored only on that first post-clear load, not on later cold starts; a TEMP `src/app/index.tsx` redirect to `/preview-viewmap` was used as a reload hook and **REVERTED** (back to `<Redirect href="/register" />`), and the preview route `src/app/preview-viewmap.tsx` was **DELETED** — the final tree is clean.
- **Verification artifacts:** `shot-radar.png` (radar card on the preview), `shot-explored.png`/`shot-map2.png`/`shot-map3.png` (map after the CTA), `shot-back.png` (back on preview) in `D:\OpenCodeTemp\opencode\yamak-map-mock\`; plus `shot-delta-*.png` / `crop-mapband.png` (neutralized-copy runtime pass).

## Final Home — REQUIRED business-information content (RECORDED ONLY — not implemented in 4C)
These product/business requirements were explicitly instructed as REQUIRED for final Home composition and MUST survive it. They are NOT implemented inside ViewMap (out of 4C scope) and require no API/location/data architecture.
- **A. Non-Profit Facilitator Platform:** direct connection with independent providers; users agree on rates and terms directly with the driver — **no middleman, no platform fees**. (The approved Map reference already carries the matching micro-banner: "Yamak: 100% Free Facilitator • No Commission • Pay Driver Directly".)
- **B. Kuwait Road Assistance Support:** Kuwait-wide road assistance support framing.
- **What YAMAK is / is not (approved framing):** YAMAK is a non-profit facilitator / connector. YAMAK does **NOT**: set service prices; collect service payments; issue provider invoices; guarantee service quality; guarantee response times; perform the roadside service itself.
- Implementation status: NOT built (deliberately, per scope rules — no banner/UI now, nothing invented, no new endpoints).

## Constraints
- `docs/rebuild/EXPO-MIGRATION.md` (in this repo) decides Expo Router replaces `NavigationContainer`/`AuthStackNavigator`/`ScreenNames`; no second React Navigation tree.
- No authenticated Home destination **route** exists yet. The legacy target is now known and verified (`HomeScreen` behind drawer → tabs → Home stack), so it may be rebuilt, but it must be a faithful port, not an invented Home.
- Onboarding is not built and is out of scope until an authenticated destination exists.
- Copy, never invent: endpoints and screen behavior come from `docs/rebuild/*` and the legacy source.
- No global store for Home data yet. Legacy used Zustand only so sibling sections and the Map screen could share services; those consumers do not exist, so `useServices` keeps local state.
- Service press is reported upward through `onServicePress(service)`; it must not navigate until a Map route exists. The Map screen does not exist, so any navigation target would be invented.
- Add press is different on purpose: it opens `add.link`, an **external http/https URL** that already exists, so it is implemented directly rather than deferred behind a callback. Only `http`/`https` links are ever handed to the OS.
- i18n is not built. `ServicesList` takes a `language` prop (`'en' | 'ar'`, default `'en'`) instead of reading a language store, matching the verified `name: { en, ar }` contract without inventing a language system.
- Per Expo SDK 52+ docs, Expo Go does **not** faithfully reproduce the native splash (it shows its own icon window). Splash appearance must be validated on a release build; in Expo Go the gate can only be validated as "no premature render, no crash, no deadlock".
- `src/components/app-tabs.web.tsx` carries a known pre-existing `/explore` typed-route TS error. Report it separately; do not fix it as a side effect of unrelated work.

## Verification
- Step A verified with `npx tsc --noEmit`: exactly one error, the pre-existing `src/components/app-tabs.web.tsx` `/explore` error. No errors in `_layout.tsx`. `git diff --check` clean.
- Step A verified at runtime on Android emulator `emulator-5554` (Android 17) with Expo Go 57.0.9 against Metro 8081, using `uiautomator` view-hierarchy dumps (screenshots are not readable by the agent): 3 cold starts and 3 dev-menu reloads each reached the Register screen with exactly one `Running "main"`, 0 FATAL exceptions, 0 invariant violations, 0 unhandled promise rejections, 0 splash errors. A controlled A/B (change stashed vs restored) showed identical reload behaviour, confirming no regression.
- Known intermittent: one blank-screen dev-menu reload occurred on the first reload after a source edit that forced a Metro rebuild, and did not reproduce across 3 later reloads. Attributed to Expo Go dev-reload flakiness, not the gate.
- Step A was committed as `9c1ca52 feat(auth): gate startup on session restoration` (not by the agent; the agent was instructed not to commit). Working tree was clean at that commit before the current read-only analysis task.
- Current analysis task (read-only): legacy authenticated landing traced end to end. No product code changed. `npx tsc --noEmit` not re-run for this task since nothing under `src/` changed.
- Home slice 1 verified with `npx tsc --noEmit`: still exactly one error, the pre-existing `src/components/app-tabs.web.tsx` `/explore` error. No new errors in `src/api/services.ts`, `src/hooks/use-services.ts`, `src/components/home/*`. `git diff --check` clean; new files separately confirmed free of trailing whitespace, tabs and CRLF.
- Home slice 1 verified at runtime on `emulator-5554` (Android 17, Expo Go 57.0.9, Metro 8081) using `uiautomator` dumps: real backend data rendered in exact ascending order (all 7 services confirmed across two dumps, one before and one after a horizontal swipe), 5 logo `ImageView` nodes present, press set `accessibilityState.selected` with **no** navigation and no "No route matched"/Unmatched Route in logcat, forced-404 path showed a safe `ApiError` message plus a working `Retry` with no leaked response body, forced-empty path rendered the header alone with no crash. 0 FATAL, 0 invariant violations, 0 unhandled rejections in every run. After deleting the temporary preview route, a cold start on `/` still rendered Register with no Services content and no errors.
- Verification method note: the temporary mount used for the slice-1 task (`src/app/preview-services.tsx`) was deleted, and its two forced-branch tests (404 path, empty list) were reverted.
- Home slice 2 verified with `npx tsc --noEmit`: still exactly one error, the pre-existing `src/components/app-tabs.web.tsx` `/explore` error. Zero errors in `src/api/adds.ts`, `src/hooks/use-adds.ts`, `src/components/home/AddsList.tsx`, `AddsCarousel.tsx`, `AddCard.tsx`. `git diff --check` clean; new files confirmed free of trailing whitespace and tabs. No `any`, no `console.*` in any new file.
- Home slice 2 verified at runtime on `emulator-5554` (Android 17, Expo Go 57.0.9, Metro 8081) via `uiautomator` dumps against the live backend: all 3 real ads rendered in exact descending order (5, 4, 3) identified by `accessibilityLabel = add.title`; card width measured 903px = `ITEM_WIDTH` at density 2.625, confirming the 70% geometry; autoplay proven by a 4s-apart dump pair showing the carousel advance one card; press proven to fire `act=android.intent.action.VIEW dat=https://ayman-car-service.yamak-kw.com/` for the `car-service` card, i.e. exactly `adds[0].link`, handled by `com.android.*`, with no `URL is not a constructor` / `Invalid URL` errors (so `new URL()` works in Hermes); forced-404 path showed a safe `ApiError` message plus a working `Retry` with no leaked body; forced-empty path rendered no cards and no crash; skeleton measured at 933x525px, which is exactly `screenDp - 2*20 - 2*8` wide and `200dp` tall, matching legacy `AddsListPh`. 0 FATAL, 0 invariant violations, 0 unhandled rejections in every run.
- Verification method note (slice 2): the temporary route `src/app/preview-adds.tsx` was deleted, the forced-404 path, the forced-empty list, a temporary autoplay-delay change and a temporary skeleton accessibility label were all reverted. Route tree is back to exactly 4 files, and a cold start on `/` still renders Register with no adds content and no errors.
- Slice 3A (vehicles location-flow analysis) was read-only: no product code changed, `npx tsc --noEmit` not re-run (nothing under `src/` changed), only `PROJECT_CONTEXT.md` updated with the verified `/vehicles` contract, the confirmed legacy race, and the recommended decision (approved before slice 3B began).
- Home slice 3B verified with `npx tsc --noEmit`: still exactly one error, the pre-existing `src/components/app-tabs.web.tsx` `/explore` error. Zero errors in `src/location/*`, `src/api/vehicles.ts`, `src/utils/distance.ts`, `src/hooks/use-vehicles.ts`, `src/components/home/VehicleItem.tsx`, `src/components/home/VehiclesList.tsx`, `src/components/home/ApiErrorRow.tsx`, or the two refactored lists. `git diff --check` clean; `.env` restored to the real LAN URL after an error-branch experiment.
- Home slice 3B verified at runtime on `emulator-5554` (Android 17, Expo Go 57.0.9, Metro 8081) via `uiautomator` dumps against the live backend, exercising the approved matrix:
  - **granted/available** → `status: available`, coords non-null, populated list, real client Haversine km rendered (`12580.6 km` from the SDK's Googleplex fix), and the backend's Euclidean ordering flipped (vehicle 6 before 3) — evidence the request carried `latitude`/`longitude` (coordinate-less order is 3,6).
  - **denied** → permission dialog dismissed with "Don't allow" → `status: denied`, `canAskAgain: yes`, `coords: none`, coordinate-less fallback fetch still populated the list with NO km rows.
  - **frozen decision / no auto-refetch** → after the denied fallback, location later became `available` but the list stayed km-free (no second request fired); only the explicit "Refresh vehicles" re-fetched, then km appeared and order flipped — proving `refetch()` re-reads the current location state.
  - **unavailable** → `location_mode 0` (all providers off) → system dialogs dismissed → `status: unavailable`, `coords: none`, real expo-location error surfaced, no auto-refetch on the frozen cycle.
  - **timed-out** → cold app starts on this emulator never got a GPS fix within the 10s grace → `status: timed-out`, `coords: none`, coordinate-less fallback fetch succeeded against the live backend every time (grace period works exactly as designed; emulator GPS is wedged post-location experiments, so the available path is evidenced by the granted runs earlier in the session).
  - **loading skeleton** → preview-only 2.5s delay (since removed) held `status: unknown`; dump showed the skeleton block with zero vehicle rows.
  - **populated** → horizontal swipe revealed both cards (Yamak-B1 and the Arabic branch), each with correct `Services : N` (vehicle-level services, e.g. 1 vs the branch's 7) and the gold "View" button.
  - **error + Retry** → Metro temporarily restarted with a dead `EXPO_PUBLIC_API_URL` (port 7999, connection-refused): `status` fell back and the list rendered `ApiErrorRow` ("Network request failed" + Retry); tapping Retry re-fired the request (error persisted against the dead URL). Env restored afterwards.
  - **empty list** → not reliably testable: the live backend is seeded with exactly 2 online vehicles and no supported param can empty the list without temporary API surgery, so it is reported rather than fabricated.
  - **/register guard** → after the preview route was deleted and permissions revoked, a cold start on `/` landed on Register with **no location prompt, no dialog**, no vehicles content, no errors.
- Verification method note (slice 3B): temporary artifacts all removed — `src/app/preview-vehicles.tsx` deleted; the preview-only request delay removed; the temporary skeleton `accessibilityLabel` removed from `VehiclesList`; `.env` restored; location permissions and `location_mode 3` restored; port 8081 Metro listeners cleaned up.
- Step 4A (Map + ViewMap analysis) was read-only: no product code changed, no dependency installed, no build, no commit. `npx tsc --noEmit` not re-run (nothing under `src/` changed). Only `PROJECT_CONTEXT.md` updated with the verified Map/ViewMap behavior, the `services/{service}/vehicles` contract, legacy defects, map-library analysis, and this slice's decisions. Live DB-backed API tests were attempted but blocked (backend `root=200`; MySQL `Yamakdb_prod_test` connection refused); the contract was verified from `routes/api_mobile.php`, `Api\Mobile\ServiceController::vehicles`, the shared `vehicleResource`, the `success` macro, and `MobileParityTest`. Git state at delivery: `YamakExpoNew` HEAD `51248ec` (slice 3B committed), working tree clean before the 4A context update.
- Google Maps native config audit (read-only) of legacy `yamak-mobile` completed: this `PROJECT_CONTEXT.md` gained a verified-config section (above). No product code changed, no dependency installed, no build, no commit; no key values printed anywhere (masked `AIza…` fragments only, per the audit's masking rule). Legacy git status clean apart from an untracked `docs/`; `YamakExpoNew` working tree = only `M PROJECT_CONTEXT.md` (this edit), HEAD still `51248ec`, no commit made.
- Home slice 4B (Map tab) verified with `npx tsc --noEmit`: still exactly one error, the pre-existing `src/components/app-tabs.web.tsx` `/explore` error. Zero errors in the new/edited 4B set: `src/app/(app)/*`, `src/components/map/*`, `src/hooks/use-map-vehicles.ts`, `src/utils/vehicle-marker.ts`, `src/api/{vehicles.ts,index.ts,api-error.ts}`, `src/theme/colors.ts`. `git diff --check` clean. `.env` restored to `http://192.168.8.125:8000/api/mobile/v1/`.
- Home slice 4B verified at runtime on `emulator-5554` (Android 16, Expo Go SDK 57.0, Metro 8081) via `uiautomator` dumps + logcat (screenshots saved to `D:\OpenCodeTemp\opencode\yamak-map-mock\` for human reference — the agent model cannot view images):
  - **Route entry:** `/map` direct and `/map?serviceId=N` both reach the Map in the root Stack (typed routes generated `/map`). Expo Go caches bundles by manifest — after restarting Metro a `pm clear host.exp.exponent` was required to force a fresh (env-correct) bundle; recorded as a runtime-method note.
  - **No-selection state:** `/map` with no param renders app bar + Google Map (`TextureView` "Google Map") + 7 service chips + (granted) user marker; **zero** `/services/{id}/vehicles` requests (mock request log + real-backend session both confirm).
  - **Happy path — chips:** chips self-fetch `GET /services` independently of Home (mock log + real backend live). Real backend returned the live 7 services (Wench, Flat Tires, Flat Battery, Unlock Key, Car Wash, Oil Change, Computer Check).
  - **Selection → vehicles:** chip tap / param entry issues `GET /services/{id}/vehicles`; once location is `available` the request carries a finite `latitude` + `longitude` pair (both, never one); markers mount without error. Real live check: `GET /services/1/vehicles` returned 1 online vehicle (`labelNumber "123"`, suzuki, coords `[48.0327835, 28.7932593]`, **no `geoMetry`** — contract re-confirmed live).
  - **Invalid-geo skip:** against a contract-accurate mock, a service with a valid vehicle + a `(0,0)`-sentinel vehicle + a `geoLocation: null` vehicle mounted exactly one marker with 0 JS errors — null/invalid/sentinel geos are skipped safely, no crash.
  - **Empty service:** service 5 (mock `[]`) and live service 2 (Flat Tires, 0 vehicles) both render the map + chips with no error and no crash.
  - **API error (safe UI):** unknown service (mock 404) showed the safe `ApiError` card `Not Found` + working Retry (no raw body). Live-backend-down 500 path leaked Laravel's raw SQLSTATE via the shared message extractor — **fixed** by the `api-error.ts` sanitizer (execution-tested). After MySQL returned, the same session showed the happy path live (real chips + real vehicle fetch, zero errors).
  - **Permission flow (approved single-prompt design):** map open with unknown status triggers exactly ONE explicit `requestLocation()`; the OS dialog appeared once per revoke cycle (never twice); "Don't allow" ⇒ the prototype-matching gold card (📍 Enable location / "Allow location access to see road services near you." / primary "Enable location" button / "Marker/tap → vehicle details." caption) with map + chips intact; granting clears the card (available ⇒ user marker + one-time camera recenter). The card's button is wired to `requestLocation()` (code + crash-free runtime; the OS suppressed a repeat dialog after a single denial on this emulator — noted, not a product defect).
  - **Marker press:** tapping at the marker area stays on `/map`, no navigation (Vehicle Details still has no route — local `selectedVehicleId` only).
  - **Emulator environment facts:** GPS is wedged to the default Googleplex fix (37.4219983, −122.084), so the user marker/recenter use that position and requested coords pairs carry it; mocked vehicles were clustered near it so markers share the viewport; the live vehicle markers (Kuwait) mount off-viewport — still verified via request/response and clean logcat.
  - 0 FATAL, 0 invariant violations, 0 unhandled rejections across every run this slice.
- Home slice 4C (ViewMap CTA) verified with `npx tsc --noEmit`: still exactly one error, the pre-existing `src/components/app-tabs.web.tsx` `/explore` error. Zero errors in `src/components/home/ViewMap.tsx` (and, while it existed, the temporary preview route — deleted before delivery). `git diff --check` clean.
- Home slice 4C verified at runtime on `emulator-5554` (Expo Go SDK 57, Metro 8081). uiautomator dumps were UNRELIABLE once the radar card's infinite `Animated` loops ran (stale hierarchies), so verification used **screenshots + Windows OCR + pixel probes**:
  - **Initial render (PRE-neutralization — superseded):** OCR read "PREVIEW — Home ViewMap (STEP 4C)", "Nearby on radar", "Kuwait City & Salmiya zone", "~14 min avg" (badge), "Winch · 1.2 km", "Your location", "Battery · 800m", "12 active recovery units ready", "Explore Map >". Pixel probes: button `#0B2A4A` (R11 G42 B74 — exact), map frame `#EFF6FF` (R239 G246 B255 — exact flat approximation), emerald dot `#11BA82` ≈ `bg-emerald-500`, rose ping halo (two fading shades ~R238 G125 B150 / R245 G176 B191) around the center pin — the pulsing animation is live.
  - **After neutralization (latest approved rules — re-verified on a fresh bundle):** OCR "Nearby on radar", caption "Kuwait" (was "Kuwait City & Salmiya zone"), badge "Map preview" (was "~14 min avg"), chips "Tow" / "Battery" (were "Winch · 1.2 km" / "Battery · 800m"; map-zoom OCR read exactly "Tow Your location Battery"), footer "Recovery units ready" (was "12 active recovery units ready"), "Explore Map >". A full-frame OCR audit for `14 min`, `1.2 km`, `800m`, `12 active`, `Kuwait City`, `Salmiya` returned ZERO matches.
  - **CTA:** tapping the navy "Explore Map" button navigated to `/map`: app bar "Map" + Google map + the chips panel (white ratio confirmed pixel-wise), NO vehicles loading/error/permission text, no `/services/{id}/vehicles` fetch (no serviceId). Verified on both the pre- and post-neutralization bundles.
  - **BACK:** returned to the preview with the radar card fully re-rendered.
  - 0 ReactNativeJS errors, 0 FATAL/AndroidRuntime/TypeError/Invariant lines in logcat across every run. (A dev-only "SafeAreaView is deprecated" WARNING came from the temporary preview surface's `SafeAreaView`; it disappeared with the preview route and is not a product issue.)

## Vehicle Details — STEP 5A ANALYSIS (read-only, verified 2026-09-29)
No product code changed; only this file. Legacy screen, data flow, backend contract (live-verified), design status, business-model check, defects, and the recommended architecture are recorded here.

### Legacy screen + navigation
- **Screen:** `yamak-mobile/src/screens/VehiclesDetailsScreen.tsx` (263 lines). Registered name `ScreenNames.Vehicle_Details_Screen = "VehicleDetail"`. Registered **only** in `HomeStackNAvigator` (the Home tab's stack, `headerShown:false`) — NOT in the Map tab or drawer.
- **Route param:** `{ _id }` — the string vehicle id ONLY. The legacy screen NEVER receives a full vehicle object; it fetches by id (option B, not A).
- **All entry points (grep across legacy `src` — exactly 2 call sites):**
  1. Home `VehicleItem` card/"View" press → `navigator.push("VehicleDetail", { _id: item._id })` (Home stack — works; the bottom "other vehicles" `VehiclesList selectedId={_id}` renders the SAME `VehicleItem`, so those cards also push details).
  2. Map marker press (`components/map/Map.tsx:95`) → `navigation.navigate("VehicleDetail", { _id: item._id })` from the **Map tab** — but `VehicleDetail` exists only in the Home stack ⇒ **unhandled action / dead entry in legacy** (recorded as 4A defect #3; the rebuild must register the route above the tabs).
  - No Search/All-Vehicles/Favorites entry point exists (grep confirms no other call sites).

### Screen section breakdown (what is ACTUALLY present, top→bottom)
1. `VehicelsDetailsPh` — `react-content-loader/native` skeleton (extra legacy dep), 4 blocks (250 image, 150, 150×5 horizontal cards, 100, 200 List) while `isFetchingData`.
2. GoBackButton (top-left).
3. Image header: `vehicle.iconMap` 250×250 `resizeMode="contain"` on white, thin bottom border.
4. Company name: `vehicle.company.name[currentLanguage]`, centered, primary colour, capitalized.
5. **"Driver"** section: white card — 80px circled avatar (`currentDriver.photo` with a hardcoded Cloudinary fallback URL `https://res.cloudinary.com/db9nm5unr/…/pngwing.com_blkll6.png`), `Name : {currentDriver.name}`, `Status : {t("Online")}` — **hardcoded Online, `workStatus` is commented out**; legacy phone row is commented out.
6. **"AvailableServices"** + `AvailableServiceList`: horizontal 150×150 white cards (service logo 80×80 + localised name); tap toggles pick (secondary-colour border/text); `pickedServices` state feeds the order POST.
7. **"ShareWithUS"** (`ShareWithus.tsx`): 6 icon buttons — X/twitter, Messenger, WhatsApp, SMS, mail, copy — that share the **YAMAK app link** (`yamak.page.link/app`), NOT the vehicle (vehicle-independent branding share).
8. `YourSaftyMatter.tsx`: 4 safety bullets — meet in public, check/inspect, **never pay anything in advance**, never go alone.
9. `VehiclesList selectedId={_id}` — the shared Home vehicles list rendered beneath.
10. Fixed bottom bar (60px, border-top): **WhatsApp "Order Now"** + **Call** buttons (both `minWidth:160`, height 40, WhatsApp-green `secondary`), each with an inline spent-loader.
- **ABSENT (verified):** no favorite, no rating, no price/rate, no gallery, no vehicle location UI, no distance, no map, no ETA, no provider/company phone row, no description, no model/year display (modelName unused by the screen).

### Legacy data flow
- Mount effect `[]` → `getVehicleById(_id)` (`src/apis/vehicles.api.ts` → `makeApiCall({url:"/vehicles/{id}", method:"get"})`) → returns the **envelope `data`** (single Vehicle resource) → local `vehicle` state; errors are `console.log` only (silent). No store, no refetch, no cache. `_id` change never refetches (stale-param weakness).
- **Order request (WhatsApp/Call handlers):** both call `sendOrderRequests({ driverId: driver?._id, services: pickedServices, userId: user?._id, platform: "mobile", payload: { userLocation, mobileType: Platform.OS, button: "whatsapp"|"call" } })` (`POST /requests`), then WhatsApp → `Linking.openURL('whatsapp://send?text=' + message + '&phone=' + driverPhone)`; Call → `await wait(1222)` then `Linking.openURL('tel:' + driverPhone)`. `driverPhone = vehicle?.currentDriver?.phoneNum`.

### Backend contract (live-verified)
- **`GET /api/mobile/v1/vehicles/{vehicle}`** — `routes/api_mobile.php:50`, **public** (before the `auth:sanctum` group at line 53). `Mobile\VehicleController::show`: route-model-bound `Vehicle $vehicle`, eager `branch, company, services, drivers, currentDriver`; same `vehicleResource` as the list → envelope `{ success, message, data: <Vehicle>, errors: null }`. **No `distance`/coords params** (index-only feature).
- **LIVE:** `/vehicles/3` and `/vehicles/6` → HTTP 200, full resource (see the existing `Vehicle` type — the show body is byte-identical to a list item). Unknown `999999` AND non-numeric `abc` → **HTTP 500** `{ success:false, message:"No query results for model [App\Models\Vehicle] …", data:null, errors:null }` — NOT 404. (This corrects the 4A static assumption that mobile route-model binding 404s: live behaviour here is 500. The `services/{service}/vehicles` sibling was still untested live in 4A and should be re-checked before it is relied on.)
- Live nullability examples: vehicle 3 — `labelNumber`/`modelName` = `""`, `iconMap` = full Cloudinary HTTPS URL, `currentDriver` = Majd (`phoneNum "+96555925404"`, `photo` + `email` present), `geoLocation` valid `[48.0555014, 29.2383392]`. Missing vehicle coords coerce to `(0,0)` (resource), so details must use `isUsableVehicleGeo`-style guarding for anything geo-related.
- **`POST /api/mobile/v1/requests`** — `apiResource('requests')` at line 51, ALSO **public/unauthenticated** (before the auth group). `Mobile\RequestController::store` validates: `driverId` required+exists:drivers, `userId` required+exists:app_users, `services` nullable array of service ids, `platform`/`status` nullable. **Any unknown field is silently dropped — the legacy `payload` (userLocation/mobileType/button) never reaches the model** (verified in `store`; it is not even reflected in `requestResource`). Creates `ServiceRequest`, syncs services, emails the driver (`UserRequestOrderMail`), responds `{ success, message, data: requestResource, errors }` (requestResource = `id,_id,platform,services[],userId,user?,driverId,driver?,status,createdAt`).
- **LIVE probe (heads-up):** a no-auth POST of `{driverId:3,userId:1,services:[1]}` returned **200 and CREATED dev row `requests id=8`** (2026-09-29 18:03:31) + emailed the driver. Everything is public; a stray dev order-request row exists — the user may want to purge it. A subsequent public `GET /requests` listed it first.
- **Favorites: ABSENT** — no favorites routes anywhere in the backend (grep of `routes/`), none in legacy Vehicle Details.

### Approved UI status
- **NO APPROVED DESIGN FOUND** — `docs/rebuild/approve-ui/` holds only `register/`, `home/`, `map/`; there is no vehicle-details approved folder.
- **NO APPROVED DESIGN — ONLY PROVISIONAL NEW-UI EXISTS:** `docs/rebuild/new-ui/main/vehicle-details/index.html` (banner "PROPOSED — requires approval"). Its numbers are DEMO ONLY (`KWD 14,900` price, `62,000 km`, Year/Model/Mileage/Engine rows, "Kuwait City · Demo", "Verified" provider, ♡ favourite demo toast, "Added to your favourites (demo)") and have NO backend counterpart. Do NOT treat as product data or build from it as-is.

### Design vs function vs backend matrix
| Provisional-new-ui element | Legacy functionality | Backend support | Verdict |
| --- | --- | --- | --- |
| Vehicle image (single placeholder) | `iconMap` 250×250 | `icon_map` (nullable, single URL) | SUPPORTED (single image; no gallery) |
| Title "Toyota Land Cruiser 2020" | `company.name[currentLanguage]` | company.name `{en,ar}`; `modelName` unused | PARTIAL (use company name; modelName exists but legacy never shows it) |
| Year / Model / Mileage / Engine rows | none | none beyond `model_name` | UNSUPPORTED |
| `KWD 14,900` price | none | none | UNSUPPORTED + BUSINESS CONFLICT (YAMAK sets no prices) |
| "● Available" pill | hardcoded `t("Online")` | `workStatus` in resource | PARTIAL (wire to `workStatus`, never hardcode) |
| "Kuwait City · Demo" location | none on screen | `geoLocation.coordinates` `[lon,lat]` | UNSUPPORTED (no detail-screen location UI in legacy) |
| Provider card + "✓ Verified" badge | Driver card (photo/name/Status) | `currentDriver` resource | Driver card SUPPORTED; **"Verified" UNSUPPORTED** (no verification field; implies a quality guarantee) |
| "📞 Call provider" | Call button `tel:` | `currentDriver.phoneNum` (nullable) | SUPPORTED |
| "🗺️ View on map" | none in details | vehicle geo + existing `/map` | UNCLEAR — design-only; needs a decision (no legacy behaviour to port) |
| ♡ Favourite | none | none | UNSUPPORTED |
| ↗ Share | ShareWithus (shares the YAMAK app link, not the vehicle) | n/a | PARTIAL (app-link share is legacy-real, vehicle-share is not) |
| — (legacy-only) Available Services picker + WhatsApp "Order Now" | AvailableServiceList + `POST /requests` + `whatsapp://` | SUPPORTED (public endpoint) | SUPPORTED — the real legacy CTA |
| — (legacy-only) Safety tips (incl. "never pay in advance") | YourSaftyMatter | n/a | SUPPORTED (static copy, business-aligned) |
| — (legacy-only) Other-vehicles row | `VehiclesList selectedId={_id}` | `GET /vehicles` | SUPPORTED (already rebuilt; press callback exists) |
- Every "UNSUPPORTED" design row must NOT become product functionality; record, do not invent.

### Business-model check (non-profit facilitator)
- Legacy details copy is **clean**: no price, no booking/payment, no platform-fee, no guarantee language; the safety block's "never pay anything in advance" matches the approved non-profit framing; contact is direct to the driver.
- Provisional UI **conflicts**: `KWD 14,900` implies a selling marketplace and YAMAK "setting prices"; "✓ Verified" implies an unsupported quality guarantee. Both must be rejected or reworded.
- Supporting fact already in the approved Map reference: "Yamak: 100% Free Facilitator • No Commission • Pay Driver Directly".
- The public/unauthenticated order POST + the silent-dropped `payload` are backend facts to raise (not fix here).

### Verified legacy defects (do NOT port)
1. `payload {userLocation, mobileType, button}` sent to `POST /requests` is **silently dropped** by the backend (not validated, not stored, absent from `requestResource`).
2. WhatsApp URL built with a raw message → **spaces/`---` never URL-encoded** (`whatsapp://send?text=${msg}&phone=${phone}`) — needs `encodeURIComponent`; may fail on Android intents.
3. **No null guard** on `driverPhone` → `tel:undefined` / `phone=undefined` (driver.phoneNum is nullable).
4. Call handler `await wait(1222)` magic sleep; both handlers ignore the POST response; the "services must be selected" guard is **commented out** → an empty-selection request + `[  ]` message is still sent.
5. Fetch effect deps `[]` — `_id` change never refetches; promise rejection is `console.log`-only.
6. `Status : Online` hardcoded (workStatus commented out).
7. Dead imports/code: `showMessage` (flash-message), the commented WhatsApp-in-Call block, commented legend rows.
8. Skeleton depends on `react-content-loader/native` (extra dep) — the rebuild uses the established block-skeleton pattern.
9. Hardcoded Cloudinary fallback avatar URL; 80px avatar renders empty if `photo` missing AND the fallback is ever unpublished.
10. Legacy Map→details navigation was dead (route above tabs fixes this — see below).

### Recommended rebuild architecture (evidence-based; NOT implemented)
- **Route: `src/app/(app)/vehicle/[id].tsx` — ABOVE the `(tabs)` group** in the `(app)` Stack so BOTH Home cards (`onVehiclePress` — the prop already exists on `VehicleItem`/`VehiclesList`) and Map markers push it. Matches the 4A routing decision ("registered above the tabs"); `/vehicle/{id}` is deep-link-safe.
- **Data: route id only → `useVehicleDetails(id)` → `getVehicleById(id)` = `apiGet('vehicles/'+id)`.** No location dependency (show takes no coords); reuse the requestId/stale-guard + `ApiError` pattern from `use-vehicles`/`use-map-vehicles` minus the location wait. Convert the string param to a number and guard NaN.
- **Files (justified):** extend `src/api/vehicles.ts` with `getVehicleById` + a `VehicleResponse` envelope type (NO new `VehicleDetails` type — the show resource is identical to the list `Vehicle`); `src/hooks/use-vehicle-details.ts`; `src/api/requests.ts` (`createOrderRequest` typed to the POST /requests contract, public); screen `src/app/(app)/vehicle/[id].tsx`; detail components under `src/components/vehicle-details/` (reuse `ApiErrorRow`, `VehicleItem`, theme tokens; the legacy WhatsApp-green buttons need a theme decision — `colors.secondary`/whatsapp-green does NOT exist yet; only `gold`, `primary`, `goldTint*`).
- **Contact:** `tel:` + `whatsapp://` via `Linking`, **with `encodeURIComponent` on the message** and a null-phone guard (disable/hide when `currentDriver?.phoneNum` is null) — ported feature, fixed defects.
- **Business content:** keep only SUPPORTED rows; no price, no verified badge, no year/mileage/engine; keep the safety copy and the app-link share (decide whether vehicle-specific share is wanted — none existed).
- **Implementation blockers (recorded):** (1) **no approved vehicle-details design** — a build cannot start on the provisional demo HTML alone; an `approve-ui`-style reference or explicit UI decision is required; (2) Home entry is gated by the missing authenticated Home shell (Map entry already exists), so details may ship from Map first; (3) `POST /requests` public + payload-drop are backend facts for product/backend, not fixable in a frontend-only slice; (4) the standing baseline tsc error is unaffected.

### New learning concepts (list only — review before implementation)
- Expo Router **dynamic route** `[id]` + typed `useLocalSearchParams` (string → number coercion, NaN guard).
- Single-resource **detail fetching by route id** (replaces "pass the full object" — legacy chose id-fetching, keep it).
- **Deep-link-safe screen** above the tabs (both Home and Map push `/vehicle/{id}`).
- External **`Linking`**: `tel:`/`whatsapp://` URL schemes + `encodeURIComponent` + Android intent failure handling.
- **Image fallback strategy** (iconMap null; driver avatar fallback must not be a hardcoded legacy URL).
- Learning review for 5A = the matrix discipline (design element ≠ product functionality) + live-verifying 4A's untested 404 assumption.

## Vehicle Details — STEP 5B APPROVED UI REVIEW (read-only, 2026-09-29)
No product code changed; only this file. The approved design (`docs/rebuild/approve-ui/VehiclesDetails`) was fully inspected and every element mapped against verified legacy behavior + the live-verified backend resource, then business-model filtered into the final implementation spec below. **Design review FINISHED; implementation NOT STARTED; learning review still NOT COMPLETE.**

### Approved files inspected
- `docs/rebuild/approve-ui/VehiclesDetails/code.html` — 354 lines, read in full (source of all element text quoted below).
- `docs/rebuild/approve-ui/VehiclesDetails/screen.png` — visual reference; renders the same structure as `code.html`.
- No other assets. The hero `<img>` is a **missing placeholder** — the file ends with `<!-- MISSING_IMAGES: Hero image of a Toyota Land Cruiser 2020 Pearl White SUV in Kuwait -->`. Even the hero photo is mock scaffolding, not a shipped asset.

### Nature of the approved design (flagged)
The approved visual is a **used-vehicle classifieds / marketplace listing** ("Toyota Land Cruiser 2020", Fixed Price `KWD 14,900`, a specifications grid, sale prose, ratings/transactions, "Verify" badges) — NOT a roadside-recovery contact screen. It conflicts with the product on nearly every content row. Per the rules (approved design controls **appearance**, not product **functionality**; price/verified/favorite rules below), the *layout* is adoptable but virtually all *content* is demo/marketplace data with no backend counterpart. Recorded prominently for the user's awareness; every element is classified individually below.

### Visual section breakdown (exact, top→bottom from code.html)
1. iOS status-bar mock (9:41 / 5G / battery) — device chrome, not a product element.
2. **Top app bar** — back button; title "Vehicle details"; ♡ "Save to favourites"; share "Share listing".
3. **Hero image showcase** — 16/10 rounded hero image; "● Available" emerald pulse pill (top-left); "1 / 6 photos" counter (bottom-right); "Verified Listing" navy/amber badge (bottom-left).
4. **Title & price card** — eyebrow "SUV · 4WD"; h2 "Toyota Land Cruiser 2020"; location line "Kuwait City · Shuwaikh Industrial" with pin; "Fixed Price" + "KWD 14,900"; emerald badge "Direct Provider Rate"; amber notice "Yamak 0% Commission: Yamak is a non-profit facilitator. No platform surcharges or broker fees apply. Negotiate & pay the independent **seller** directly."
5. **Specifications card** — "Specifications" + "GCC Specifications"; 2-col grid: Year 2020 / Model·Trim GXR V6 / Mileage 62,000 km / Engine 4.0 L V6 / Drive & Gear Automatic 4WD / Fuel Petrol / Exterior·Interior White·Beige / Inspection "Dealer Certified"; footer "Verified against Kuwait Ministry of Interior records."
6. **Vehicle Overview** — marketplace sale prose ("…Single owner, zero accident history. … Al-Sayer…") + feature chips (Sunroof, Cool Box, Rear Camera, Parking Sensors, Keyless Push Start, Cruise Control).
7. **Provider profile card** — "Y" initial avatar (gold ring) / "Yamak Provider" / "✓ Verified" / "Abu Fahad Motors · Kuwait" / "★ 4.9 (42 completed transactions)" / "Responds in < 15 mins" / "Member since 2021".
8. **Feedback toast** — "✓ Added to your favourites (demo)" / "Saved" — explicitly demo, JS-driven.
9. **Persistent bottom bar** — WhatsApp quick-inquiry icon (aria "Inquire via WhatsApp") + navy "Call provider" button (gold phone icon). JS toasts: "Initiating secure direct call..." / "Opening direct chat with Abu Fahad...".
- **ABSENT from the approved design:** services picker, services chips, safety block, other-vehicles row, map / "View on map", review list. Bottom bar has NO "Order Now" (good — "Call provider" is already neutral facilitator language).

### Final mapping matrix (A=SUPPORTED · B=SUPPORTED WITH ADAPTATION · C=UNSUPPORTED — REMOVE · D=NEEDS USER DECISION)
| Approved element | Legacy support | Backend support | Class | Exact reason |
| --- | --- | --- | --- | --- |
| Back button + app-bar | router back | n/a | A | standard stack navigation; localisable title |
| ♡ Save to favourites | none | none (no favorites routes anywhere) | C | Rule 6 — no flow/route/legacy behavior; no local-only favorite state |
| Share listing | ShareWithus shares the YAMAK app link, NOT the vehicle | n/a | B | keep action = legacy app-link share; vehicle deep-link share becomes technically possible once `[id]` exists (scope = D) |
| Hero image 16/10 | `iconMap` 250×250 | `icon_map` single nullable URL | B | single hero image from iconMap + safe local fallback; NOT a gallery |
| "● Available" pill | hardcoded "Online" (defect — don't port) | `workStatus` | B | wire truthfully to workStatus (verify its value set at build); never hardcode |
| "1 / 6 photos" counter | none | no gallery field | C | Rule 17 — gallery unsupported; single image only |
| "Verified Listing" badge | none | no verification field | C | Rule 5 — no verified mechanism; implies a quality guarantee |
| Eyebrow "SUV · 4WD" | none | none | C | no vehicle-type field; don't invent |
| Title "Toyota Land Cruiser 2020" | `company.name[currentLanguage]` | `modelName` (may be "") · company.name {en,ar} | B | modelName if non-empty else company.name; never append a year |
| Location line + pin | none on details | geoLocation `[lon,lat]` only; no address source / no reverse-geocode built | D | Rule 13 — needs user decision (drop, or add geocoding / map CTA later); never render degree coords as an address or "km" |
| "Fixed Price" label | none | none | C | Rule 4 — no price field |
| "KWD 14,900" | none | none | C | Rule 4 — invented price + business conflict (YAMAK sets no prices) |
| "Direct Provider Rate" badge | none | none | C | price-/rate-implying; no rate field |
| "Yamak 0% Commission… pay the seller directly" notice | legacy "never pay anything in advance" (aligned) | n/a | B | KEEP the non-profit facilitator notice but reword to the already-approved map-audience framing "100% Free Facilitator • No Commission • Pay Driver Directly"; replace "seller"→"driver/provider"; avoid "0% commission" phrasing that implies a commission exists |
| Specifications grid (Year/Trim/Mileage/Engine/Drive/Fuel/Color/Inspection) | none | none beyond `model_name` | C | Rule 7 — no vehicle fields; do not invent year/mileage/engine etc. |
| "Verified against Kuwait Ministry of Interior records." | none | none | C | Rule 5 — no verification mechanism; implies an official records guarantee |
| Vehicle Overview prose + feature chips | none | no description field | C | fictional inventory/sale copy; no backend counterpart |
| Provider avatar "Y" | driver photo + hardcoded Cloudinary fallback (defect, don't port) | `currentDriver.photo` nullable | B | initials-based avatar fallback (the approved design itself is the fallback pattern); photo when present |
| Provider name "Yamak Provider" | Driver name row | `currentDriver.name` nullable | B | driver name; null-guard all driver fields |
| "✓ Verified" provider badge | none | none | C | Rule 5 — no verified mechanism |
| "Abu Fahad Motors · Kuwait" | company name only | company.name · branch.name | B | company.name + branch.name when present; drop "· Kuwait" (no region field) |
| "★ 4.9 (42 completed transactions)" | none | none | C | no rating field; YAMAK brokers no transactions (non-profit facilitator) |
| "Responds in < 15 mins" | none | no response-time field | C | Rule 3 — guaranteed response time conflicts |
| "Member since 2021" | none (driver has createdAt) | driver.createdAt exists | C | a "member since" tenure badge implies a platform membership YAMAK does not run — drop (don't repurpose createdAt) |
| Favorite toast "(demo)" | none | none | C | demo-only + favorite unsupported |
| WhatsApp quick-inquiry (bottom bar) | WhatsApp "Order Now" → `POST /requests` → `whatsapp://` | `currentDriver.phoneNum` nullable; `POST /requests` public (payload silently dropped) | B | keep icon CTA; build on `whatsapp://` via Linking with `encodeURIComponent` + null-phone guard; POST wiring = D (rule 12) |
| "Call provider" (bottom bar) | Call → `POST /requests` → `tel:` | `phoneNum` nullable | B | approve wording "Call provider" (neutral, facilitator-aligned); null-guard; POST wiring = D |
| Services picker — ABSENT in approved UI | AvailableServiceList → pickedServices → POST | `vehicle.services[]` exists | D | Rule 10/12 — read-only chips from services[] are displayable (B), but the picker + POST wiring defer to the backend/security decision |
| Safety block — ABSENT in approved UI | YourSaftyMatter (4 bullets incl. "never pay anything in advance") | n/a | D/keep | legacy-supported, business-aligned; approved design omits it — don't force into the approved appearance |
| Other-vehicles row — ABSENT in approved UI | `VehiclesList selectedId={_id}` | `GET /vehicles` | D/keep | Rule 16 — not in approved design; don't force (already rebuilt on Home) |
| Palette: navy #0B2A4A / gold #E9A319 / emerald #128C7E | legacy WhatsApp-green `secondary` | theme: primary #15406F · gold #FBBF24 · no secondary | D | 5C token decision: approved navy is darker than theme primary and approved gold darker than theme gold; needs a mapping decision (5A already flagged missing secondary) |

### Request API concern (rule 12 — DO NOT implement yet)
`POST /requests` remains **functionally available but public/unauthenticated**, creates a real DB row, and emails the driver; `payload` is silently dropped (5A live-verified). Classification: **FUNCTIONALLY AVAILABLE BUT REQUIRES BACKEND/SECURITY DECISION.** Open questions (backend-owner, not fixable here): (a) should the order POST stay part of the Vehicle Details rebuild at all; (b) should contact initially work WITHOUT the POST (recommended: yes — `tel:`/`whatsapp://` only, so the first build creates no order rows and sends no driver emails, with the endpoint added back once auth/payload is decided); (c) should the endpoint require auth; (d) should `payload`/button/`userLocation` be persisted. Pending: purge stray dev row `requests id=8`.

### Route / architecture confirmation (rule 18)
Unchanged by the approved design: **`src/app/(app)/vehicle/[id].tsx` above `(tabs)`** in the `(app)` Stack (deep-link-safe; Home `VehicleItem` cards and Map markers both push it). The approved screen is a plain pushed detail page (back button top-left, bottom action bar) — no modal/tab requirement, so nothing about the 5A recommendation changes.

### Final approved implementation spec (source for step 5C)
- **KEEP EXACTLY:** app-bar structure (back + "Vehicle details" title); hero image slot (rounded, ~16/10, full-width); white rounded-card language on `#F8FAFC` with the persistent bottom bar (WhatsApp icon + navy "Call provider"); provider-card layout skeleton (avatar + name + subtitle) and its initials-avatar fallback pattern; neutral CTA wording — "Call provider", "Inquire via WhatsApp"; **NO "Order Now"**.
- **KEEP WITH ADAPTATION:** availability pill ← vehicle.workStatus (verify value set; never hardcode); title ← `modelName` ‖ `company.name[currentLanguage]` (no year); provider card ← currentDriver (photo→initials fallback, name, company+branch name; all null-safe); WhatsApp/Call CTAs ← `Linking` `whatsapp://`/`tel:` with `encodeURIComponent` + null-phone guard (POST wiring deferred); non-profit notice ← approved "100% Free Facilitator • No Commission • Pay Driver Directly" wording (no "seller"/"0% commission"); share ← legacy app-link share (deep-link scope = decision); optional read-only `vehicle.services[]` chips.
- **REMOVE:** entire price/rate UI (Fixed Price, KWD 14,900, Direct Provider Rate); specifications grid + "GCC Specifications"; "Verified Listing", "✓ Verified", "Dealer Certified", "Verified against Kuwait Ministry of Interior records"; ★ 4.9 / "(42 completed transactions)"; "Responds in < 15 mins"; "Member since 2021"; ♡ favourite + demo toast + its JS; gallery "1 / 6 photos"; eyebrow "SUV · 4WD"; Vehicle Overview prose + feature chips; location line (no data source — see D).
- **DEFER / NEEDS DECISION:** location line display (D — no address/geocode source today); POST /requests wiring + auth + payload persistence (rule 12; recommend no-POST contact initially); services chips vs picker (D); share payload scope — app link vs vehicle deep link (D); theme-token mapping for approved navy/gold/emerald (D); safety block + other-vehicles row (legacy-supported, absent from approved design — include in 5C only if the screen keeps legacy sections).

### Learning review status (still NOT complete — mandatory gate before implementation)
Covered so far: dynamic route `[id]` (5A). Remaining NEW concepts for the mandatory review (list only, NOT taught yet): route-param string→number coercion + NaN guard; external `Linking` safety (`tel:`/`whatsapp://` + Android intent failure); `encodeURIComponent` of the WhatsApp message; nullable contact handling (phoneNum/photo/name/currentDriver); image fallback strategy (iconMap null, initials avatar, no hardcoded legacy URLs); API 500-vs-404 behavior (live: missing model → 500, not 404); plus 5B additions — element-level data-provenance discipline (design numbers are never product data) and availability-status value mapping (workStatus → display string). 4C's review (demo-claims removal, approve-ui home/map authorities, consistency check, verification method) also still pending.

## Vehicle Details — STEP 5C IMPLEMENTATION (delivered & runtime-verified, 2026-09-29)

### Verdict
**VEHICLE DETAILS STEP 5C PASS** — implemented per the approved 5C plan, `npx tsc --noEmit` reports ONLY the pre-existing baseline error, `git diff --check` clean (exit 0), and live Android-emulator runtime verification passed all executable checks. Commit: **NOT YET** (standing rule). Learning review: **COMPLETE**. No new native dependencies, no full Android build, no commit.

### What shipped
- **Route:** `src/app/(app)/vehicle/[id].tsx` — the approved details screen in the `(app)` Stack above `(tabs)` (no auth gate in `(app)/_layout.tsx`); strict `parseVehicleId` (`Number`/`Number.isInteger`/`>0`) — `/vehicle/abc` never becomes `/vehicles/NaN`.
- **API:** `src/api/vehicles.ts` → `VehicleResponse` + `getVehicleById(id)` (public `GET /vehicles/{id}`; route-model-bound; live 500-on-missing documented); exported via `src/api/index.ts`.
- **Hook:** `src/hooks/use-vehicle-details.ts` — fetch-one with stale-response guard + loading/error/refetch; NO location logic (the screen primes the shared provider once, Map-style, when `status==='unknown'` — proven on cold deep-link entry by the permission prompt + Other-Vehicles distances).
- **Components:** `src/components/vehicle-details/` → `icons.tsx` (approved vector paths traced 1:1 from `approve-ui/VehiclesDetails/code.html`, no asset copies), `VehicleStatusPill.tsx`, `DriverAvatar.tsx` (photo→initials fallback), `SafetyCard.tsx`, `ContactBar.tsx` (persistent footer).
- **Shared util:** `src/components/home/VehiclesList.tsx` — new `excludeId?: number` prop (legacy `selectedId` filter semantics).
- **Wiring:** `src/app/(app)/(tabs)/map.tsx` marker press now `router.push({ pathname: '/vehicle/[id]', params: { id } })` (typed-routes-safe object form).
- **Theme:** `src/theme/colors.ts` += `navyDeep #0B2A4A`, `navyDeepDark #071B30`, `success #10B981`, `successText #047857`, `successTint #ECFDF5`. Approved gold `#E9A319` reuses the existing `wordmark`; screen bg `#F8FAFC` reuses `phonePrefix`; no second design system.
- **Sanitizer:** `src/api/api-error.ts` reject-regex += `No query results for model` — the Laravel model-binding 500 text can never leak to a user.

### Approved design mapped (business-aligned — no marketplace elements)
- Title = `modelName` → `company.name.en` → neutral "Vehicle" (verified live: vehicle 3 empty `modelName` → "Yamak"; vehicle 6 `modelName="suzuki"` → "suzuki"). Subtitle = `company.name · branch.name`.
- Availability = `vehicle.workStatus`; verified backend enum is `online|offline` only → `online` = "Available" (emerald dot), everything else = neutral slate "Unavailable". No invented enum cases.
- Hero = single `iconMap` remote image → local emoji placeholder (🛻 on slate). No legacy hardcoded Cloudinary fallback.
- Provider card = `currentDriver` (nullable): name, photo→initials avatar, phone, company+branch line. CTA wording "Call provider" / "Inquire via WhatsApp" — never "Order Now".
- Services = READ-ONLY chips (omitted when empty) + `TODO(VehicleDetails)` for the selectable picker once POST/auth is decided.
- Safety = business-aligned card (communicate directly, confirm details before work, don't pay in advance, YAMAK is a free facilitator/connector) — legacy buyer/seller bullets replaced.
- Share = legacy app-link share via the native share sheet (`yamak.page.link/app`) + `TODO(VehicleDetails)` for a vehicle deep link.
- Other Vehicles = shared `VehiclesList` with `excludeId={currentId}` (proven live: exactly ONE card — vehicle 3 excluded, vehicle 6 shown).
- Non-profit notice retained, facilitator wording (free, no middleman/platform fees, agree directly with provider).
- Location line: NOT deleted from the plan — deferred behind `TODO(VehicleDetails)` (no backend address; reverse geocoding pending); no fake text, no raw lat/lng.
- REMOVED (unsupported): price/KWD, verified/dealer/MOI claims, rating/transactions, response-time/member-since, year/engine/mileage specs, ♥ favorite+toast, gallery counter, demo eyebrow/sale prose.

### Contact (tel + WhatsApp ONLY; no POST /requests)
Whitespace-stripped phone; `tel:<phone>`; `whatsapp://send?phone=<digits>&text=<encoded>` with `https://wa.me/<digits>?text=<encoded>` fallback — `Linking.canOpenURL` + try/catch, graceful app-not-installed path. Null phone → both actions disabled (`disabled`, never `tel:undefined`, never a bad URL). `TODO(VehicleDetails)` marks where `POST /requests` returns after auth/payload is finalized. Grep confirms zero `POST /requests` usage; live `GET /requests` still shows count 8 (no new rows; `id=8` untouched).

### Navigation (both back paths runtime-verified)
- `canGoBack() ? back() : replace('/map')` — deep-link entry (no history) → `/map`; pushed from Other-Vehicles → returns to the previous details screen.
- Map markers + Other-Vehicles cards push the strict object form (typed-routes-safe).

### Runtime verification (Android emulator + Expo Go + live backend, 2026-09-29)
Method: TEMP `src/app/index.tsx` redirect hook (documented 4C technique — **REVERTED**, `git diff --quiet src/app/index.tsx` exit 0) + `pm clear` + exp:// launch; screenshots + OCR + pixel probes.
- `/vehicle/3` (200 OK): hero renders the MiniVan image (band/pixel proof), emerald "Available" pill (`#10B981` exact-match probe: 169 px at the pill), title "Yamak", subtitle "Yamak-b1", notice, provider card (Majd / Yamak-b1 / +96555925404), Services chip "Car Wash", 4 safety bullets, Other Vehicles row with ONE card (vehicle 3 excluded), navy "Call provider" + WhatsApp-tint footer.
- Call → Android dialer opened with +965 559 25404. WhatsApp → `canOpenURL('whatsapp://')` false (app not installed) → wa.me fallback opened with the exact encoded message ("Hello from the YAMAK app. I need your help with: Car Wash.").
- Share → native share sheet, message "Download the YAMAK app now: yamak.page.link/app".
- Back (deep-link) → `/map`; Other-Vehicles card → push `/vehicle/6` (suzuki / Wensh AlMajed · صباح الاحمد / +96550338090 / Wench) → back → `/vehicle/3`.
- `/vehicle/abc` → invalid-link state, no request, no location prompt (prime skips invalid ids), "Go back" → `/map`.
- `/vehicle/999999` → HTTP 500 → generic "Request failed with status 500" + Retry — `No query results for model [App\Models\Vehicle]` sanitized (verified on screen); Retry re-fetches and stays generic.
- No price / Verified / favourite / KWD text in any state (OCR sweep).
- Environment note: Expo Go's dev-mode floating "Tools" button overlapped the app-bar Share control (dragged aside to verify); dev-only artifact, absent in a production build. Hero-image fallback + avatar-initials fallback are code-verified only (all online vehicles currently carry `iconMap` + reachable photos).

### Static verification
- `npx tsc --noEmit`: exactly ONE error — pre-existing baseline `src/components/app-tabs.web.tsx(27,38)` `/explore` TS2322 (reported separately, NOT introduced, NOT fixed). Zero errors across the new route/components/hook/API edits.
- `git diff --check` clean; `git status --short`: modified = PROJECT_CONTEXT.md, api-error.ts, api/index.ts, api/vehicles.ts, map.tsx, home/VehiclesList.tsx, theme/colors.ts; untracked = docs/rebuild/approve-ui/VehiclesDetails/ (user), src/app/(app)/vehicle/, src/components/vehicle-details/, src/hooks/use-vehicle-details.ts. `src/app/index.tsx` back at the committed `/register` redirect.
- No `console.*`, no `any`, no new native deps (react-native-svg already present), no bulk asset copies.

### Commit & cleanup status
- Commit: **NOT YET** (standing rule — working tree only).
- Learning review: **COMPLETE** (all 4C/5A/5B concepts applied in shipped code — see below).
- `requests id=8` (5A no-auth probe stray row): left ON the backend, UNCHANGED, no new rows created by 5C; the user's purge decision remains pending.

### Learning review status (COMPLETE)
route-param string→number coercion + NaN guard (parseVehicleId); external `Linking` safety (`tel:`/`whatsapp://`, intent failure, wa.me fallback); `encodeURIComponent` of the WhatsApp message; nullable contact handling (phoneNum/photo/name/currentDriver); image fallback strategy (iconMap → emoji placeholder, photo → initials, no hardcoded legacy URLs); API 500-vs-404 reality (frontend-only generic sanitized state); 5B element-level data-provenance (design numbers are never product data — enforced by removal); availability value mapping (`workStatus` → display); 4C demo-claims neutralization + approve-ui authority honored for the details screen; theme-token mapping decision applied (minimal justified additions on existing semantic tokens).

## Next Approved Step
- **PHASE A / STEP A1 (session + auth gate) delivered, runtime-verified and committed** as `e5ec96b` — see the dedicated section above. The root startup gate, the `(app)` group gate and the `/register` gate are in place in both directions, `AuthProvider` is still the single session owner, and SecureStore is unchanged. `/email-otp` was deliberately left unguarded and unchanged by A1.
- **PHASE A / STEP A2 (Email OTP → Authenticated App) delivered and runtime-verified, NOT YET committed** — see `PHASE A — STEP A2` at the end of this document. One file changed (`src/app/email-otp.tsx`): `authenticate()` is still the only session writer, then `router.replace(AUTHENTICATED_ENTRY_ROUTE)`. The old permanent success hold is now a transient confirmation; Back cannot re-enter Email OTP; invalid-OTP and network-failure behaviour is unchanged.
- **NEXT APPROVED STEP = A3 — Home Route.** A3 owns the authenticated landing screen inside `(app)` and, with it, finally settles the destination question: create the Home route and repoint `AUTHENTICATED_ENTRY_ROUTE` at it (`/map` is still only the placeholder that A1/A2 had to use because it was the one entry route already inside `(app)`). Do not build tabs, the Profile Hub, onboarding or the drawer inside A3 — tabs are A5.
- Slice 3B (location foundation + Vehicles) delivered and runtime-verified (see the architecture section above and the Verification entries). Nothing from 3B is mounted by any production screen yet (the Map consumes `useUserLocation()` via the shared provider).
- **Step 4A (Map + ViewMap analysis) + Google Maps native config audit (both read-only) delivered** — verified facts and decisions recorded above. Step 4A's two original blockers were resolved for this slice: the `/map` route (deep-linkable, no Home shell) was explicitly approved, and `react-native-maps@1.27.2` was approved via `npx expo install` (bundled in Expo Go — no key needed there).
- **Home slice 4B (Map tab) delivered and runtime-verified** — see the dedicated section and Verification entries above. `/map` now exists as a real screen; marker press remains local-selection-only by design (Vehicle Details still has no route). A real shared bug surfaced by live-verification (raw Laravel SQLSTATE leaked through `ApiError.message`) was fixed in `src/api/api-error.ts` (sanitizer) — see the section above.
- **Home slice 4C (ViewMap CTA) reconciled to the latest approved rules and delivered** — the radar card per the user-dropped `approve-ui/home` reference; prototype demo statistics neutralized (decorative examples, not product data); `approve-ui/map` recorded as the Map visual authority + consistency reference; final-Home business-information requirements recorded (NOT implemented). `ViewMap.tsx` is the only product file; its navy "Explore Map" button targets the real `/map` route with no serviceId, verified live before and after neutralization.
- **Vehicle Details STEP 5A (read-only analysis) delivered** — see the dedicated section above: legacy screen + all entry points, section breakdown, data flow, backend contract (live-verified `GET /vehicles/{id}` public; live-verified public `POST /requests` — plus a live-found 500-on-missing-model and a stray dev `requests` row id 8 from the no-auth probe), NO approved vehicle-details design (provisional new-ui is demo-only), design↔function↔backend matrix, business-model conflicts, verified legacy defects not to port, recommended `(app)/vehicle/[id]` architecture, and the new learning concepts. **Analysis only — implementation NOT started.**
- **Vehicle Details STEP 5B (approved-UI review) delivered** — see the dedicated section above: approved files inspected (`approve-ui/VehiclesDetails/code.html` + `screen.png`, hero image is a missing placeholder), the approved design identified as a **used-car marketplace listing** (business-model/topic mismatch flagged), full element mapping matrix (A/B/C/D), business-model filtering (price/verified/favorite rules applied), request/contact API concern (rule 12), route architecture confirmed unchanged (`(app)/vehicle/[id]` above tabs), final implementation spec (KEEP EXACTLY / WITH ADAPTATION / REMOVE / DEFER), and the remaining learning concepts, incl. the element-level data-provenance rule and the theme-token decision (approved navy/gold/emerald vs current theme primary/gold, no secondary). The user-supplied `docs/rebuild/approve-ui/VehiclesDetails/` folder is untracked. **Design review FINISHED — implementation NOT started.**
- **MANDATORY LEARNING REVIEW — COMPLETE:** all 4C/5A/5B concepts were applied in shipped 5C code and verified (see the 5C section above) — route-param coercion + NaN guard, external `Linking` safety + wa.me fallback, `encodeURIComponent`, nullable-contact handling, image-fallback strategy, the live 500-vs-404 sanitization, element-level data-provenance (design numbers are never product data), availability value mapping, and the approved-UI/theme-token discipline. No review gate remains.
- **Vehicle Details STEP 5C (implementation) delivered and runtime-verified** — see the dedicated section above. Route, API, hook, components, theme tokens, sanitizer update, Map marker wiring, and `VehiclesList.excludeId` all shipped. Live emulator verification covered the happy path, invalid id, missing vehicle (500 sanitized), both back paths, Call dialer, wa.me fallback, Share sheet, Other-Vehicles exclusion + cross-push, and the zero-`POST /requests` guarantee. Commit: **NOT YET**.
- **STEP 6A (Map approved-UI consistency review, read-only) delivered** — see the dedicated section above. Approved files inspected, full section breakdown, consistency matrix, design-only elements rejected, business-model/ETA/distance filtering, and the implementation spec (KEEP AS-IS / RESTYLE / ADD / DO NOT ADD / DEFER / NEEDS USER DECISION) recorded. Verdict: **MAP APPROVED UI CONSISTENCY REVIEW COMPLETE**. Implementation NOT STARTED, no commit.
- **Recommended subsequent order:** the **Map-UI alignment implementation slice** (restyle the existing `/map` screen per the 6A spec: chips, pins, user marker, micro-banner, recenter control) → then the authenticated Home shell with tabs when the landing decision lands (the finished sections + 4B's shared `UserLocationProvider` all mount there). Any future vehicle-details additions (services picker, location line via reverse geocoding, vehicle deep-link share, and the `POST /requests` restoration behind auth/payload decisions) are tracked by `TODO(VehicleDetails)` markers — do NOT restore `POST /requests` until auth + payload persistence are decided.
- Blocked separately (unchanged): the unauthenticated landing decision (`/register` vs a future `/login`) gates the `/home` route and the authenticated tree. Never send `limit: 0`; send `limit` only if a future decision calls for it (default 10 matches legacy).
- Deferred: none outstanding from 3B/4B — the `ApiErrorRow` extraction (3B) and the `api-error.ts` sanitizer (4B) are both complete.
- Baseline (unchanged, reported separately, deliberately not fixed): `src/components/app-tabs.web.tsx(27,38)` `Type '"/explore"'` TS2322 under `npx tsc --noEmit`. Git state at 6A review (2026-09-29): HEAD `f87aa1a feat(vehicle): implement vehicle details screen` — the user committed the 5C tree; `git status --short` CLEAN at pre-flight (the 5C modified/untracked list above is the historical 5C-delivery record). `src/app/index.tsx` remains byte-identical to the committed `/register` redirect. Commit status: 5C was committed as `f87aa1a`; STEP 6A is analysis-only and adds nothing. Learning review status: **COMPLETE**. `npx tsc --noEmit` = ONLY the baseline error; `git diff --check` clean; no dependency installed, no build, no commit (standing rule). NOTE: the live no-auth `POST /requests` probe (STEP 5A) created dev row `requests id=8` on the backend — STILL PRESENT, untouched by 5C (contact-only design created no request rows; count still 8), flagged for the user to purge.

## Map — Approved UI Consistency Review (STEP 6A, read-only)

**Verdict: MAP APPROVED UI CONSISTENCY REVIEW COMPLETE.** Implementation NOT STARTED. Only `PROJECT_CONTEXT.md` modified; no commit, no build, no dependency change.

### Files inspected
- Approved: `docs/rebuild/approve-ui/map/code.html` (371 lines) + `screen.png` (no assets folder). Mock palette: `yamakNavy #081C31`, `yamakDarkBlue #0B2A4A`, `yamakGold #E9A319`, `yamakLightGold #FFF6E5`, `yamakGoldHover #D39113`, `yamakMuted #64748B`, `yamakBg #F8FAFC`; shadows `card/pin/floating` = rgba(8,28,49,…).
- Current implementation: `src/app/(app)/(tabs)/map.tsx` (full), `src/components/map/{MapMarkers,MapServiceChips,EnableLocationCard}.tsx` (full), `src/hooks/use-map-vehicles.ts`, `src/utils/vehicle-marker.ts`, `src/theme/*`, `src/api/services.ts`.
- Legacy reference (functional only): `yamak-mobile/src/components/map/Map.tsx` — broken region lock, `geoMetry` typo, dead marker navigation; nothing real left to port beyond what 4B already covered.
- Continuity: `docs/rebuild/approve-ui/VehiclesDetails/code.html` + `src/components/vehicle-details/*`.

### Approved map section breakdown (code.html)
1. Device status bar (9:41 / 5G / battery) — chrome, not app UI.
2. App bar: hamburger · "Map" (bold slate-800) · bell with RED dot badge; `border-b slate-100` + soft shadow.
3. Map surface: warm grid `#f1ede3` + decorative SVG (bay water, coastline, 4th/5th/6th Ring + Route 30/40 strokes, area-text badges KUWAIT CITY/SALMIYA/HAWALLY/SHUWAIKH IND./6TH RING RD).
4. Micro-banner (top-center pill, `bg-white/95`, amber border): emerald pulse dot + "**Yamak:** 100% Free Facilitator • No Commission • Pay Driver Directly" (gold "Yamak:", navy text).
5. Map-controls column (top-right, 3× white rounded-xl cards): Recenter (navy), Layers (slate-700), Traffic (emerald-600).
6. User marker: blue-600 dot (w-6, white ring) + inner white dot + blue-500/25 pulse ring (2.2 s) + navy "You are here" tooltip.
7. One ACTIVE pin: navy callout card (gold hairline) — gold "★ 4.9 • GMC Winch", emerald "ETA 8m" badge, "Abu Fahad Recovery", "6th Ring Rd" + gold "1.4 km"; below it a gold pin `w-10 rounded-2xl ring-4 gold/30 white border` + navy winch icon + white triangle tail.
8. Four SECONDARY pins: white `w-8 rounded-xl` + service-colored 2 px border (gold winch / sky tire / amber battery / red fuel / emerald lock) + colored icons; white/95 availability pill above (emerald dot + "14m/6m/4m/12m"); tiny white label below ("Nissan Patrol / Tire Fix / Jumpstart / Fuel Run / Key Unlock").
9. Google attribution (native watermark).
10. Service chips (bottom scroll row, `hide-scrollbar`): 5 × `w-16 h-16` (64 px) circles, white bg, `border-3 amber-500`, gold/amber 20 px SVG icon, 9 px extrabold EN label + 8 px amber AR label (Wench/سطحة · Flat Tires/بنشر · Flat Battery/شحن · Unlock/أقفال · Fuel Run/بنزين). No distinct selected state in the mock.
11. Selected-provider bottom sheet: drag handle; navy avatar w/ gold winch icon + emerald online dot; "Abu Fahad Recovery" + amber "★ 4.9"; subtitle "سطحة الفهد • GMC Sierra • 1.4 km away"; round slate-100 Call + emerald-600 WhatsApp pill.
12. Bottom nav: Home / Map (active, gold dot) / Services / Profile (+ iOS home-indicator pill — chrome).

### Current implementation baseline (verified in code)
Route param `serviceId` (strict integer parser; route param canonical, local mirror, NO global store); app bar ☰ · "Map" · 🔔 (emoji glyphs, no badge); real Google MapView (PROVIDER_GOOGLE, uncontrolled Kuwait `initialRegion`, one-time `animateToRegion` on the first user fix, `loadingEnabled`, `toolbarEnabled=false`, `showsUserLocation=false`, map tap clears selection); user marker = `primary` circle + white dot (no pulse/label); vehicle markers = gold circular badge (40 px / 48 px active, real `iconMap` image, `tracksViewChanges` while active), marker press → `setSelectedVehicleId` + push `/vehicle/[id]`; `EnableLocationCard` gold-tint permission card + "Marker/tap → vehicle details." caption; gold loading badge; `ApiErrorRow` error card (top) + Retry; chips footer 80 px circle / 4 px gold border / text-only EN / gold-fill selected; load/error states for both services and vehicles. No banner, controls, sheet, or tabs.

### Final consistency matrix
Classified A=match, B=present+restyle, C=add, D=unsupported/do-not-add, E=legacy-missing (none found), F=needs user decision.
| # | Approved element | Current | Backend | Class | Reason |
|---|---|---|---|---|---|
| 1 | App-bar layout (menu/title/bell) | matches (emoji glyphs) | n/a | A (cosmetic B) | Geometry matches; swap emoji → SVG icons is cosmetic |
| 2 | Bell red-dot badge | absent (intentional) | none | D | No notifications system; badge would be fake data |
| 3 | Map canvas (grid+SVG mock) | real Google MapView | real geo | A | Real map is superior; grid pattern + area-text badges are decorative mock only |
| 4 | Free-facilitator micro-banner | absent | business copy | C | Approved + truthful ("100% Free Facilitator • No Commission • Pay Driver Directly") |
| 5 | Recenter / Layers / Traffic controls | one-time auto-recenter only | props exist | C (recenter) / DEFER (layers/traffic) | `animateToRegion`, `mapType`, `trafficEnabled` all supported RNM |
| 6 | User marker blue-600 + pulse + "You are here" | primary circle, none | user coords | B | Restyle; single representation kept (`showsUserLocation=false`) |
| 7 | Active gold pin + white ring | gold circle (48 px) | — | B | Round → rounded-square + ring; cosmetic |
| 8 | Secondary white pins + service-color border | all-gold badges | `iconMap` | B | Restyle; icon = real `iconMap` or service glyph fallback |
| 9 | Marker availability pill (emerald dot) | none | `workStatus` online | C (dot only) | Emerald dot truthful when `online`; TIME text is design-only |
| 10 | Marker ETA (14m/6m/ETA 8m) | none | none | D | Unsupported data — never derive from degree `distance` |
| 11 | Marker distance (1.4 km/900m) | none | Euclidean only | D (now) / supportable (Haversine) later | Truthful only via user-location Haversine; defer + user decision |
| 12 | Rating "★ 4.9" | none | none | D | Unsupported + business-model conflict (no rating system) |
| 13 | Fake provider labels (Nissan Patrol…) | none | driver names exists | DEFER | Real labels would be driver names; not needed now |
| 14 | Callout card (name/road/km) | none (→ details) | partial | DEFER | Details screen already covers; no canvas duplicate |
| 15 | Chip shape (64 px, amber border, icon, EN+AR) | 80 px, 4 px gold border, EN only | `Service.name.{en,ar}` + nullable `logo` | B | Restyle geometry + bilingual; icon from real `logo` or glyph |
| 16 | Chip selected state | gold-fill (distinct) | — | A | Mock has no selected state; current distinct state is correct |
| 17 | Bottom sheet | direct nav to details | `currentDriver` | F/DEFER | Details screen supersedes it; optional preview = user decision |
| 18 | Bottom tabs (Home/Map/Services/Profile) | none (route tree = (tabs)/map only) | — | FUTURE | Home shell not assembled; deferred |
| 19 | Loading/error/empty + permission states | badge / errorCard / gold card | real | KEEP | No approved counterpart (mock pre-grants); states are real functionality |
| 20 | Location-card wording/placement | gold card bottom | — | KEEP | Truthful; matches 4B prototype; optional restyle later |

### Unsupported design-only elements (DO NOT implement as real data)
Rating "★ 4.9"; ETAs ("14m/6m/4m/12m/ETA 8m"); distances ("1.4 km/900m"); demo provider names ("Abu Fahad Recovery / Nissan Patrol / Tire Fix / Jumpstart / Fuel Run / Key Unlock"); subtitle "سطحة الفهد • GMC Sierra • … away"; bell red-dot badge; decorative SVG map backdrop + area-text badges (the real MapView replaces the mock canvas); mock `tel/wa.me` numbers.

### Business-model filtering
No pricing, no ETA/completion guarantees, no rating claims, no commission-pricing language anywhere. The banner copy is allowed and truthful ("100% Free Facilitator • No Commission • Pay Driver Directly"). All fake demo values above were rejected at the design level.

### Key decisions
- **ETA — UNSUPPORTED, DO NOT ADD as live data.** Backend has no ETA field; never derive from Euclidean degree `distance`. A neutral non-quantified pill is possible later ONLY after user approval.
- **Distance — never show backend `distance`.** Haversine from user coords + `geoLocation.coordinates` IS technically supportable for a future slice (`distance.ts` geo helpers already exist); NOT implemented here; user decision.
- **Provider marker visual** — idle: white rounded-square pin + service-color border + `iconMap` icon; active: gold rounded-square + white ring. Emerald availability dot ONLY when `workStatus === 'online'`. No time/distance/rating. Callout deferred (details screen).
- **Marker press / details** — KEEP direct navigation to `/vehicle/{id}` (approved + works). Bottom sheet = an optional pre-navigation preview; NOT needed because details already provides Call/WhatsApp; user decision to add later.
- **Service chips** — KEEP behavior (selected → fetch vehicles; no selection → no request; no global store). RESTYLE to approved 64 px circle / amber-500 3 px border / icon (real `Service.logo`, nullable, or glyph fallback) + EN + AR.
- **Location / permission card** — KEEP `EnableLocationCard` unchanged (mock pre-grants everything, so there is no approved counterpart). No duplicate location flow; the Map never calls expo-location directly.
- **User marker** — RESTYLE to blue-600 dot + white inner + pulse ring + "You are here" tooltip; `showsUserLocation=false` retained (one representation only).
- **Camera / controls** — KEEP uncontrolled camera + one-time auto-recenter; ADD a recenter button in the alignment slice; layers (`mapType`) and traffic (`trafficEnabled`) optional. No controlled-region lock ever.
- **Error / empty states** — KEEP behavior (loading badge, `ApiErrorRow` + Retry, chip footer load/error handling); optional restyle to the approved white/95 pill language; behavior unchanged.

### Map ↔ Vehicle Details visual continuity
Shared tokens already: `navyDeep #0B2A4A` ≈ map `yamakDarkBlue` (details CTA/avatar and map dark blue); `wordmark #E9A319` = both golds; `success #10B981`/`successText #047857` = emerald dots/texts. Divergences to note: the map mock uses a distinct `#081C31` navy (banner text/callout/user tooltip) — a 3rd navy; recommend reusing `navyDeep` to single-source. WhatsApp/emerald CTA color differs across mocks (map `emerald-600 #059669`, details mock `#128C7E`, shipped details uses the `success` family) — standardise one emerald CTA semantic. Chip amber `#F59E0B` and user blue `#2563EB` are not tokens yet. Pin radius (rounded-xl ≈ `radius.md`; sheet rounded-t-2xl ≈ `radius.lg`) and the navy-avatar-with-gold-emblem + emerald-dot pattern already align between the Map sheet and the details `DriverAvatar`.

### Theme-token audit
- Already present: `wordmark #E9A319` (= approved gold), `navyDeep #0B2A4A` (= approved dark blue/details navy), `navyDeepDark #071B30`, `success / successText / successTint` (emerald family — added by 5C), `gold #FBBF24`, `goldTint #FDF7E6`, `goldTintBorder #FBEED4`, `primary #15406F`, slate scale (title/subtitle/fieldText/border/placeholder).
- Added by 5C: `navyDeep`, `navyDeepDark`, `success`, `successText`, `successTint`.
- Not yet tokens (candidates for the alignment slice): amber-500 `#F59E0B` (chip borders/secondary text), blue-600 `#2563EB` + pulse `rgba(59,130,246,0.25)` (user marker), emerald-600 `#059669` (if a single emerald CTA is standardised), and a shared shadow color (hardcoded `#0C1E34` repeats in map/vehicle-details styles).
- No duplicates: colours live in the single `theme/colors.ts`; only shadow hexes repeat in styles.

### Legacy / current functions that MUST remain (all already present, verified)
No-selected-service valid state; selected → `GET /services/{id}/vehicles`; self-fetching chips; permission/off states; one-time user recenter; invalid-coordinate filtering; marker press → details; single user marker; `ApiErrorRow` sanitisation. **No legacy/current function is missing from the approved design** → no E rows, nothing to resurrect.

### Final implementation spec (drives the NEXT map-UI alignment slice)
- **KEEP AS-IS:** route-param `serviceId` + local state + no global store; uncontrolled camera + one-time recenter; loading badge; error card + Retry; permission card + caption; marker press → `/vehicle/[id]`; `iconMap` pins; single user marker; chip-footer load/error states; `ApiErrorRow` sanitisation.
- **RESTYLE:** service chips → 64 px circle, amber-500 3 px border, icon (real logo or glyph) + EN + AR; vehicle pins → white rounded-square + service-color border (idle) / gold rounded-square + white ring (active); user marker → blue-600 + pulse + "You are here"; app-bar glyphs → SVG icons (cosmetic).
- **ADD:** free-facilitator micro-banner (approved copy); recenter control button (layers/traffic optional).
- **DO NOT ADD:** rating, ETA/times, km distances, fake marker labels, red notification badge, decorative area-text overlays, fake callout values.
- **KEEP LEGACY FUNCTION + REDESIGN:** none outstanding (verified — all real functions already live on the current Map).
- **DEFER:** bottom sheet (unless user decides), marker name/availability sublabels, true Haversine distance, traffic/layers toggles, SVG-in-app-bar.
- **NEEDS USER DECISION:** bottom sheet vs direct navigation; neutral non-quantified pill instead of ETA (if any wanted); app-bar icon source; the exact navy for callout surfaces (`#081C31` vs `navyDeep`); when Haversine distance may be introduced.

### Learning review status
**COMPLETE for this review (analysis only).** Genuinely NEW concepts for the alignment slice: absolute-positioned overlay composition over MapView (banner/control column) incl. `pointerEvents` so overlays never swallow map gestures; marker visual-state animation (pulse ring, layered ring, callout anchoring) + `tracksViewChanges` implications for animated marker content; bilingual EN/AR chip content inside a 64 px circular container; `mapType` / `trafficEnabled` layer props (react-native-maps) if the controls land; semantic token single-sourcing across the Map and Vehicle Details screens. NOT new (already learned in 3B/4B): MapView, Marker, route param/local state, stale-request protection, `initialRegion`, PROVIDER_GOOGLE, the location state machine.

### Implementation status
**NOT STARTED** — this step was analysis-only; no product code changed.

### Verification
- Pre-flight: `git status --short` = CLEAN; `git log -3 --oneline` = `f87aa1a feat(vehicle): implement vehicle details screen`, `e86929e`, `66d933d` (expected commit matched).
- Post-record: `git diff --check` clean; `git diff --stat` = `PROJECT_CONTEXT.md` only; `git status --short` = ` M PROJECT_CONTEXT.md`.
- `npx tsc --noEmit` NOT run (no product code changed in this review). No build, no dependency install, no commit (standing rule).

## Map - STEP 6B APPROVED UI ALIGNMENT (implemented, runtime-verified in Expo Go, 2026-09-29)

### Verdict
**MAP STEP 6B = CODE COMPLETE + STATICALLY CLEAN; RUNTIME VERIFICATION = PARTIALLY BLOCKED BY AN UPSTREAM ENVIRONMENT BUG** (react-native-maps in Expo Go SDK 57 / Android new architecture renders NO MapView children and ignores `mapType`/`showsTraffic` prop updates — see "Environment blocker" below). All state/UX that does not depend on native map children was runtime-verified. No commit (standing rule). Next slice must go through the learning review.

### What shipped (all per the 6A final implementation spec)
- `src/components/map/MicroBanner.tsx` (NEW): static approved pill — emerald dot + EXACT copy `Yamak: 100% Free Facilitator • No Commission • Pay Driver Directly`; `pointerEvents="none"` so it never blocks map gestures.
- `src/components/map/MapControls.tsx` (NEW): Recenter · Layers · Traffic column (local state only, `pointerEvents="box-none"`). Recenter re-animates only, disabled without coords, NEVER re-prompts. Layers cycles standard→satellite→hybrid with `STD/SAT/HYB` label chip. Traffic toggles `showsTraffic` with emerald-on/grey-off traffic-light glyph + emerald border when ON. Pure `react-native-svg` icons (already installed).
- `src/components/map/MapServiceChips.tsx` (RESTYLED): 64 pt circular chips, 3 px amber-500 border, real service `logo` image (🛠️ fallback), EN + AR bilingual labels; gold-fill + white ring selection.
- `src/components/map/MapMarkers.tsx` (RESTYLED): vehicle pin → white rounded-square + wordmark border, gold pin + white ring when selected; emerald **online dot ONLY when `workStatus === 'online'`**; distance pill shows real **Haversine** km (`haversineDistanceKm`, never the backend Euclidean `distance`), omitted when the user has no coordinates, `formatDistanceKm` guarantees `<0.1 km` or `N.N km`, never `0/NaN/unknown`. User marker → blue-600 dot + white core + infinite pulse ring (`Animated.loop`, native driver, stopped on unmount) + navy "You are here" tooltip; `showsUserLocation=false` kept (single user representation).
- `src/theme/colors.ts` (ADDED ONLY): `amber #F59E0B`, `userMarker #2563EB`, `userMarkerPulse rgba(59,130,246,0.25)`. No other tokens changed.
- `src/utils/distance.ts` (ADDED): `formatDistanceKm` (Haversine-only formatting policy).
- `src/app/(app)/(tabs)/map.tsx`: wires micro-banner, controls, `mapType`/`showsTraffic` local state, `vehicleDistances` (Haversine from the frozen user position), error card dropped below the banner (`top: 104`).
- NOT ported (per spec): ETA, ratings, demo km/names/availability, red notification badge, bottom sheet, fake SVG map canvas, callout sublabels.

### Runtime verification matrix (Expo Go 57.0.9 / SDK 57 / Android emulator-5554 / live backend; emulator GPS 29.238298,48.055500)
- PASS — Micro-banner exact copy: a11y tree string `Yamak: 100% Free Facilitator • No Commission • Pay Driver Directly` (char-for-char).
- PASS — 7 services render, EN + AR split text (Wench/سطحه … Oil Change/غيار زيت; 7th chip scrolls off-screen horizontally as designed); accessibility labels `Car Wash — غسيل سيارة` etc.
- PASS — Chip selection gold-fill: tap Wench → gold `#FBBF24` cluster at that chip; tap Car Wash → gold moved to chip 5; works in granted AND denied location states.
- PASS — App bar: Menu ☰ | title "Map" | bell 🔔 (content-desc "Open menu"/"Notifications"/"Map").
- PASS — `GET /services/5/vehicles` returned 1 vehicle (service state debug: `vehicles=1 loading=false err=none`) and empty services (Flat Battery) surface NO error card.
- PASS — Permission grant path (dialog → "While using the app" → card disappears) and deny path (dialog → "Don't allow" → card shows with exact approved copy `📍 Enable location` / `Allow location access to see road services near you.` / `Enable location` + caption `Marker/tap → vehicle details.`).
- PASS — Controls a11y: "Recenter map", `Map layers. Current: standard|satellite`, "Traffic layer". Traffic tap: local state verified via pixel probe (grey dots → amber/green/red dots; 492 emerald px emerald border; 0 grey) AND a11y one `checkable=true checked=true` node. Layers tap: `SAT`→`HYB`→`STD` label chip + a11y current-mapType label (local state works).
- PASS — `index.tsx` reverted to `<Redirect href="/register" />`, byte-identical to HEAD (boots the register screen).

### Environment blocker (upstream, NOT a 6B code defect) — marker & basemap-layer visuals NOT verifiable in Expo Go
react-native-maps on **Expo Go SDK 57 (RN 0.86 / New Architecture / Fabric)** on Android renders only the Google basemap: **no MapView children paint** and **`mapType`/`showsTraffic` prop updates never reach the native map**.
- Evidence: a bare SDK default `<Marker>` (no custom child) produces zero pixels; temporarily-added `<Circle>`/`<Polyline>` also produce zero pixels (basemap tiles, Google attribution, RN overlays outside the map all render fine); basemap average brightness is identical (235.3) across standard/satellite/hybrid while the `SAT/HYB` labels prove local state flips; `tracksViewChanges` on/off changes nothing; React Compiler experiment ruled out (same result with `reactCompiler` temporarily disabled and restored).
- Known upstream: react-native-maps marker-regression family on Android New Architecture (e.g. react-native-maps#5836 — RN 0.81 + maps 1.26.x: "Map itself renders fine — only markers fail", even default markers; #5909 — Expo 57 pairing: custom markers visible again only on **1.28.2 in a DEV BUILD**). Expo Go bundles its own native maps binary, so the node_modules JS version (1.27.2) can NOT change the native renderer in Expo Go.
- Consequence: user marker + pulse, vehicle pins, online dots, distance pills, marker→`/vehicle/[id]` tap, and the satellite/traffic basemap themselves could NOT be visually confirmed in Expo Go. Their CODE is complete, tsc-clean, and wired exactly per the approved spec; the Haversine math was independently recomputed (user@emulatorGPS → v3 = 0.0046 km ⇒ `<0.1 km`; v6 = 49.54 km ⇒ `49.5 km`).
- Recommended options for the user (NOT taken — outside slice rules): (a) approve a one-off `expo run:android` dev-build verification with `react-native-maps@1.28.2` (matches the #5909 "Expo 57 works" report), or (b) accept the visual items as code-verified-only and proceed.
- NOTE: Expo Go's floating dev "Tools" button overlaps the top-of-column Recenter control on screen (~(1002,470)) — dev-only overlay, not a product defect; the emerald/grey traffic state shows the same control works when tapped below it.

### tracksViewChanges approach (trade-off recorded)
Vehicle markers: `tracksViewChanges={isActive}` (unchanged baseline policy). User marker: `tracksViewChanges` (true) because its child animates every frame; it is ONE marker, so the re-snapshot cost is acceptable; if marker rendering is ever fixed in a dev build this setting should be re-validated for battery/scroll cost.

### Static verification
- `npx tsc --noEmit` → ONLY the acknowledged baseline error `src/components/app-tabs.web.tsx(27,38)` TS2322 `"/explore"` (untouched, per rule).
- `git diff --check` clean; `git status --short` = `M PROJECT_CONTEXT.md`, `M src/app/(app)/(tabs)/map.tsx`, `M src/components/map/MapMarkers.tsx`, `M src/components/map/MapServiceChips.tsx`, `M src/theme/colors.ts`, `M src/utils/distance.ts`, `?? src/components/map/MapControls.tsx`, `?? src/components/map/MicroBanner.tsx`. `src/app/index.tsx` NOT in the diff (byte-identical to HEAD).
- No backend changes; no dependency installs; no `expo run:android`; no commit.

### Learning review status
**NOT COMPLETE** — the mandatory learning-review gate before the next step. Candidate items to review: upstream react-native-maps New-Architecture marker/overlay regression and the Expo-Go-bundled-native constraint; `mapType`/`showsTraffic` Fabric prop-delivery limits; the dev-build-vs-Expo-Go verification boundary; `tracksViewChanges` re-snapshot cost vs an always-animating single marker; when/how to propose the 1.28.2 + `expo run:android` verification path.

## DEV BUILD PREPARATION — APPLICATION IDENTIFIERS (configured, verified & revised 2026-09-30)

### Verdict
**IDENTIFIERS UPDATE PASS** — permanent application identifiers set in `app.json` and confirmed resolved by `npx expo config --type public` exactly as configured: `android.package = com.yamak.assist`, `ios.bundleIdentifier = com.yamak.assist`. The earlier `com.yamak.app` decision is **SUPERSEDED**. No Maps config, no `react-native-maps` plugin, no Google Maps keys created, no dependency/build/prebuild/commit (standing rules). Google Maps configuration is the NEXT step, not started.

### Facts (verified only)
- **Yamak Expo is a NEW standalone app** destined for Google Play and the Apple App Store — distinct from the legacy `com.yamak.mobapp` / `com.yamak.mobstaging` / `com.yamak.mobdev` flavors. **Legacy identifiers must NOT be reused.**
- **FINAL application identifiers** (supersede the earlier `com.yamak.app` values; minimal structural edit, all other Expo config byte-preserved):
  - `android.package = "com.yamak.assist"`
  - `ios.bundleIdentifier = "com.yamak.assist"`
- Resolved config check: `npx expo config --type public` → `android.package = com.yamak.assist`, `ios.bundleIdentifier = com.yamak.assist` (exact match). Effective `sdkVersion` remains 57.0.0.
- Plugins unchanged (expo-router, expo-splash-screen, expo-secure-store, expo-location) — **no `react-native-maps` plugin**, no `android.googleMapsApiKey`, no Google Maps configuration, **no Google Maps API keys created/configured anywhere** (verified again in the credentials audit last step: plugin deps are absent, `.env`/`.env.example` carry no map-key references).
- `package.json` NOT touched by this task. NOTE: it carries a PRE-EXISTING uncommitted `name` edit (`yamakexponew` → `Yamak`, mtime 2026-09-30 18:23) whose origin is unknown; it is the npm package name only (not the Android applicationId) and was flagged separately in the dev-build readiness audit.
- `react-native-maps` **1.28.2 version decision = STILL PENDING** (SDK 57 pins 1.27.2; 1.28.2 is the externally-reported Fabric marker fix, needs the external/controlled verification).
- build / prebuild / `expo run:android` = **NOT RUN**.
- `git diff --check` clean (exit 0); `git diff -- app.json` = only the two identifier values changed (`com.yamak.app` → `com.yamak.assist`); commit = **NOT YET**.

### Next step (COMPLETED below — see the section that follows)
Google Maps native configuration (env-driven `react-native-maps` config plugin) is now DONE — see **GOOGLE MAPS NATIVE CONFIGURATION** below. The pending decision remains the `react-native-maps` 1.28.2 dev-build verification experiment (separate slice).

## GOOGLE MAPS NATIVE CONFIGURATION (configured & verified, 2026-09-30)

### Verdict
**GOOGLE MAPS CONFIG PASS** — smallest safe dynamic Expo config in place: `app.config.ts` re-emits `app.json` wholesale (spread) and adds the `react-native-maps` config plugin with both keys read **from environment variables only**. Resolved by `npx expo config --type public --json`: `android.package = com.yamak.assist`, `ios.bundleIdentifier = com.yamak.assist`, all existing app.json fields preserved, and the plugin carries **both** `androidGoogleMapsApiKey` and `iosGoogleMapsApiKey` options (values PRESENT at config time — verified masked, never printed). No key hardcoded anywhere; no build/prebuild; no commit; `react-native-maps` unchanged at 1.27.2.

### Config strategy (decided — verified from installed `@expo/config`, no guessing)
- **app.json REMAINS the static source of truth and is NOT deleted.** Fact from `@expo/config` source (`build/Config.js` `getConfig` + `build/getConfig.js`/`evalConfig.js`): when a dynamic config exists, the dynamic export **IS** the resolved config — app.json is only handed to it via the function's `config` argument; app.json is NOT auto-merged on top. That is exactly why `app.config.ts` spreads `config`: the spread is what preserves every app.json field.
- `app.config.ts` = the smallest safe dynamic layer: `export default ({ config }: ConfigContext) => ({ ...config, plugins: [...(config.plugins ?? []), mapsPlugin] })`. Both flat and `{ expo: {...} }` returns are accepted by `reduceExpoObject`; fields omitted by the dynamic config are lost, so the full spread is load-bearing (kept).
- No `newArchEnabled` key exists in `app.json` (SDK 57 new architecture default ON — unchanged and unimplemented by config).

### Facts (verified only)
- **Android key env var configured**: `androidGoogleMapsApiKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY`.
- **iOS key env var configured**: `iosGoogleMapsApiKey = process.env.GOOGLE_MAPS_IOS_API_KEY`.
- **Environment availability (names verified, values NEVER read or printed — masked PRESENT):** both `GOOGLE_MAPS_ANDROID_API_KEY` and `GOOGLE_MAPS_IOS_API_KEY` are PRESENT in the gitignored `.env` file (machine-local). They are NOT present in the shell/system environment; Expo CLI's env loader reads `.env` at config-evaluation time — proven by the resolved config showing both plugin options non-empty.
- **No secrets committed**: keys live only in `.env` (`.gitignore` → `.env`, `.env*.local`); `.env.example` still holds only `EXPO_PUBLIC_API_URL`; no key characters appear in any tracked file, this report, or logs (masked-only policy).
- **Identifiers (unchanged, re-verified)**: `android.package = com.yamak.assist`; `ios.bundleIdentifier = com.yamak.assist`.
- **`react-native-maps` config plugin configured** as the 5th plugin (after expo-router, expo-splash-screen, expo-secure-store, expo-location).
- **Plugin option → native mapping (keys verified from installed 1.27.2 source `plugin/build/{android,ios}.js`)**: `androidGoogleMapsApiKey` → `com.google.android.geo.API_KEY` meta-data on `<application>`; `iosGoogleMapsApiKey` → Info.plist `GMSApiKey` + Google pod + Swift AppDelegate init. Falsy/undefined options are guarded → safe no-op per platform (no key yet = no Maps SDK injection).
- **Android application restriction temporarily not FINALIZED** — the API-key Android app restriction (package `com.yamak.assist` + SHA-1) cannot be completed yet because the **debug SHA-1 is unavailable until the first native build** (no `~/.android/debug.keystore` exists; auto-generated per machine on first Gradle debug build, alias `androiddebugkey`; prod = Google Play App Signing SHA-1, distinct from the upload key). Recorded from the credentials audit; keys in `.env` are currently unrestricted/unfinalized on the Android side.
- **iOS key restriction**: per the credentials audit, the iOS key should be restricted to bundle ID `com.yamak.assist` (no SHA-1/Apple cert needed) — **if the user already configured that restriction in Google Cloud**; locally unverifiable → NEEDS EXTERNAL VERIFICATION in the Google Cloud console.
- **Maps SDK for Android / Maps SDK for iOS enabled** — required per the credentials audit checklists; Google-Cloud-console state is NOT locally provable → NEEDS EXTERNAL VERIFICATION in the Google Cloud console (keys presumably created by the user already, hence present in `.env`).
- `react-native-maps` **remains 1.27.2** (package.json untouched by that slice) — the 1.28.2 upgrade experiment has since been completed, see **REACT-NATIVE-MAPS 1.28.2 CONTROLLED OVERRIDE** below.
- build / prebuild / `expo run:android` = **NOT RUN** (no `android/`/`ios/` folders generated).
- `npx tsc --noEmit` = exactly the known baseline error (`src/components/app-tabs.web.tsx(27,38)` `/explore`); `app.config.ts` clean. `git diff --check` clean. commit = **NOT YET**.

### Files touched by this slice
- `app.config.ts` = **created** (only new file).
- `app.json` = **untouched** this slice (still the identifiers-updated version).
- `PROJECT_CONTEXT.md` = this section.
- `package.json` = untouched (still carries the pre-existing uncommitted `name` edit, unrelated).

## REACT-NATIVE-MAPS 1.28.2 CONTROLLED OVERRIDE (upgrade-only, 2026-09-30)

### Verdict
**REACT-NATIVE-MAPS 1.28.2 UPGRADE PASS** — `react-native-maps` upgraded **1.27.2 → 1.28.2 ONLY**, via npm directly (NOT `expo install`, which SDK 57 would pin back to 1.27.2). `package.json` + `package-lock.json` updated; `node_modules` installed 1.28.2; `npm ls` shows exactly one effective version; lock canonical (`npm ci --dry-run` exit 0). No other dependency changed. Intentional temporary override for the NEXT dev-build verification of the Fabric marker / MapView-children issue (upstream #5909 line). No prebuild/build/native folders; no commit.

### Facts (verified only)
- **Previous version = 1.27.2** — pre-flight confirmed declared/locked/installed all 1.27.2 (`package.json`, `package-lock.json`, `node_modules/react-native-maps/package.json`).
- **New version = 1.28.2** — declared `"react-native-maps": "1.28.2"` (exact pin, project convention; npm's default caret `^1.28.2` was normalized to exact); locked (root range + `node_modules/react-native-maps` block: version, `resolved …react-native-maps-1.28.2.tgz`, new integrity hash); installed (`node_modules` `version` = 1.28.2).
- **npm used intentionally instead of `expo install`**: command = `npm install react-native-maps@1.28.2`; `changed 1 package`; the install also sync'd the lock `name` metadata to the pre-existing "Yamak" package.json edit (cosmetic only). The 14 moderate `npm audit` advisories are the standard pre-existing SDK-toolchain set — NOT introduced by this upgrade, untouched.
- **Expo SDK 57 recommended/pinned version REMAINS 1.27.2** — `node_modules/expo/bundledNativeModules.json` still maps `"react-native-maps": "1.27.2"` (confirmed post-upgrade).
- **1.28.2 = INTENTIONAL TEMPORARY / NATIVE-VERIFICATION OVERRIDE** — recorded as `INTENTIONAL VERSION OVERRIDE FOR DEV-BUILD VERIFICATION`; scoped to the dev-build verification only; not part of the long-term Expo-managed version policy.
- **`app.config.ts` unchanged and still resolves both Maps env vars** — plugin options `androidGoogleMapsApiKey` / `iosGoogleMapsApiKey` still read from `process.env.GOOGLE_MAPS_ANDROID_API_KEY` / `GOOGLE_MAPS_IOS_API_KEY`. Post-upgrade resolved config (`npx expo config --type public --json`): **Android package = com.yamak.assist**, **iOS bundleIdentifier = com.yamak.assist**, react-native-maps plugin resolved, **both key options PRESENT (masked — no key characters printed)**. 1.28.2 plugin source still uses exactly those two keys (`com.google.android.geo.API_KEY` meta-data; Info.plist `GMSApiKey` + `useGoogleMaps`), falsy-guarded same as 1.27.2.
- **No API keys hardcoded** anywhere; `.env` remains the only key holder (gitignored).
- **No prebuild, no build, no `expo run:android`, no `pod install`/`gradlew`, no `android/` or `ios/` folders generated** (git status shows none).
- **TypeScript**: `npx tsc --noEmit` → only the known baseline `src/components/app-tabs.web.tsx(27,38)` `/explore` TS2322 — **zero new errors from 1.28.2**.
- **expo-doctor**: 20/21 checks passed; the single failing check = Expo-SDK package-version match where **react-native-maps expected 1.27.2 / found 1.28.2** — the known intentional override (recorded, NOT downgraded). The same check also lists 4 PRE-EXISTING Expo patch-drift rows (@expo/ui ~57.0.21 vs 57.0.20, expo ~57.0.26 vs 57.0.25, expo-constants ~57.0.20 vs 57.0.19, expo-router ~57.0.24 vs 57.0.23) — pre-existing, untouched per the no-SDK-change rule; no unrelated warnings fixed.
- **package.json diff = only the maps line (+ the pre-existing `name` edit)**; **package-lock.json diff = only the maps root range + node block (+ the pre-existing `name` metadata insertions)** — dependency change limited to what npm legitimately changes for react-native-maps 1.28.2.
- **Commit = NOT YET** (standing rule — working tree only). Everything else in the tree (6B map files, identifiers, app.config.ts, Maps keys) preserved untouched.
- **Next approved step = Development Build verification ONLY** (this slice performs NO build): `expo run:android` (or EAS) with maps 1.28.2 to verify the Expo-Go-blocked marker / `mapType` / `showsTraffic` visuals per the 6B environment-blocker record (#5836/#5909); re-validate `tracksViewChanges` cost in the dev build. Rollback path if verification fails: `npm install react-native-maps@1.27.2`.

## ANDROID DEVELOPMENT BUILD — MAP STEP 6B VERIFICATION (attempted 2026-09-30)

### Verdict
**ANDROID DEV BUILD + MAP STEP 6B = BLOCKED — EXACT REASON: the native Android debug build cannot be produced on this Windows host.** Two consecutive `npx expo run:android` runs (attempt 1: background, 18m04s; attempt 2: retry, cache-warm, 3m46s) both failed identically during the C++ (CMake/Ninja) build of the transitive native module `react-native-worklets`:
`> Task :react-native-worklets:buildCMakeDebug[x86_64][worklets] FAILED` → `C/C++: CreateProcess failed. Command attempted:` → `C/C++: ninja: fatal: CreateProcess: Access is denied.`
The failure is a **Windows process-spawn denial of the NDK toolchain** (`clang++.exe` from `ndk/27.1.12297006`, NDK stated by the build: `ndk 27.1.12297006`), NOT a code defect and NOT a maps/marker issue. Because the app was never built/installed/launched, NONE of the 6B map items could be verified in a dev build; every item below is **UNVERIFIED (app never launched)**. Per the standing rule, no alternative upgrade/downgrade or native-source patch was invented; the blocker is recorded for a human-environment decision (AV/EDR exclusion or build-host change — both outside this slice's mandate). **Commit = NOT YET.**

### Facts (verified only)
- **Prebuild PASSED**: `android/` native directory generated (`✔ Created native directory`, `✔ Finished prebuild`). Generated `android/` is **gitignored** (`git check-ignore android` → matched).
- **Generated native identifiers**: `android/app/build.gradle` → `namespace 'com.yamak.assist'`, `applicationId 'com.yamak.assist'` (both confirmed from generated file).
- **Maps key wired into native manifest**: generated `android/app/src/main/AndroidManifest.xml` contains `<meta-data android:name="com.google.android.geo.API_KEY" …/>` (value masked; sourced from the react-native-maps config plugin reading `.env` — PROVES the `.env` → plugin → manifest chain works in a real native build). `ACCESS_FINE_LOCATION` + `ACCESS_COARSE_LOCATION` also present in the generated manifest.
- **Prebuild side-effect on package.json (documented, kept)**: prebuild rewrote scripts — `"android": "expo start --android"` → `"expo run:android"`, `"ios": "expo start --ios"` → `"expo run:ios"`. Recorded as expected prebuild behavior; not reverted (state now matches an android-native workflow).
- **Blocker evidence (deterministic, 2/2 attempts)**: same task, same `ninja: fatal: CreateProcess: Access is denied` on both runs. The failing command spawns the NDK `clang++.exe` with the worklets PCH flags (`-Xclang -include-pch …`, `--target=x86_64-none-linux-android24`, long `-I`/`-isystem` set); command length measured = **3474 chars** (far below the 32,767 CreateProcess limit).
- **Toolchain itself is healthy** (excludes toolchain corruption): `clang++.exe --version` runs (direct AND via ninja); a direct `clang++.exe --target=x86_64-none-linux-android24 -c` trivial compile succeeds; the long worklets-style command executed fine via `cmd.exe` (process spawned — only a missing `-isystem` include surfaced, expected).
- **Spawn failure isolated to ninja→NDK-clang in the worklets `.cxx` dir**: plain `ninja -C …\react-native-worklets\android\.cxx\Debug\6a6a563a\x86_64 worklets` OUTSIDE Gradle reproduces `CreateProcess: Access is denied` on the same target; ninja can spawn clang with `--version` (short command) from an unrelated dir. Environment block ≈ 4664 chars, PATH = 2141 chars (no over-large-environment trigger).
- **Host security software present (candidate root cause, unproven)**: **Reason Cybersecurity AV active** (SecurityCenter2 productState 266240) alongside **Windows Defender (real-time protection OFF, tamper-protected ON, DefenderSessionHelper running)**. Signature consistent with an AV/EDR policy denying NDK toolchain process spawn under Ninja within `node_modules\…\.cxx`. No attempt was made to disable/alter host security software (outside scope, requires user action).
- **`signingReport` (user-requested, run)**: `cd android; .\gradlew.bat signingReport` → every module reports `Store: C:\Users\AAlYassin\.android\debug.keystore` → **`Error: Missing keystore`** → **debug SHA-1 NOT obtainable** (debug keystore is only auto-generated on first successful debug build's signing/packaging phase; the build dies in `react-native-worklets` CMake BEFORE reaching `:app:` packaging). The Android Maps key restriction (package `com.yamak.assist` + debug SHA-1) remains **PENDING / NEEDS EXTERNAL VERIFICATION** — will first need a working dev/CI build on some host.
- **Emulator state**: emulator-5554 (Pixel_7) online throughout; GPS re-set to the documented wedged test position (29.238298, 48.0555) so the user-marker / `<0.1 km` distance checks were ready; app **never installed** (no `com.yamak.assist` package; foreground remained `host.exp.exponent` — Expo Go). Port 8081 stayed FREE (no Metro started; `expo run:android` exited before launch phase).
- **Route hook NOT needed**: `src/app/index.tsx` is **untouched** (no `/map` redirect was made this slice — the app never launched, so no navigation was possible; verified `git diff --stat src/app/index.tsx` = empty).
- **Integrity of the 6B slice preserved**: `react-native-maps` **still 1.28.2** (declared + locked + installed); `app.config.ts` + identifiers `com.yamak.assist` + all 6B map components/map.tsx/colors/distance untouched; no backend change; no iOS work; no API-key characters printed (masked-only policy — the key value appeared once in a raw manifest grep tool output and was NOT reproduced anywhere).
- **Hygiene (re-run post-attempts)**: `npx tsc --noEmit` → exactly the one known baseline error (`src/components/app-tabs.web.tsx(27,38)`; forbidden to fix) — **zero new errors**. `git diff --check` → clean (CRLF warnings only; exit 0). `git status --short` → identical known dirty tree (PROJECT_CONTEXT.md, app.json, package-lock.json, package.json, map.tsx, MapMarkers.tsx, MapServiceChips.tsx, colors.ts, distance.ts modified; app.config.ts, MapControls.tsx, MicroBanner.tsx untracked) — `android/` absent because gitignored.
- **Cleanup/state after this slice**: the two failed builds leave a warm Gradle daemon + `android/app/build` intermediates (all inside gitignored `android/`) — harmless; `react-native-worklets` `.cxx` PCH state is transient build output. **NO migrations, NO commits, NO native-source patches, NO dependency changes** were made this slice.
- **What unblocks**: (a) user adds an AV/EDR exclusion (Reason Cybersecurity / Defender) for `%LOCALAPPDATA%\Android\Sdk\ndk\*` + the project `node_modules` path and re-runs `expo run:android`; or (b) run the same dev build on a host/CI without the blocking security policy; then re-run this full 6B verification checklist. No code change is implicated by the current evidence.

## LOCATION REQUEST LOOP — ROOT CAUSE + FIX (diagnosed, fixed & runtime-verified 2026-09-30)

### Verdict
**LOCATION REQUEST LOOP FIX PASS.** A working Android Development Build (`com.yamak.assist`) is installed and running on emulator-5554 against Metro on port 8081 (`adb reverse` configured) with the live backend. **JS-only fix — no native rebuild, no dependency change, no backend change.** **Commit = NOT YET.**

### Root cause (proven from runtime, not guessed)
`requestLocation` had **no admission control**: `requestIdRef` decides only which result *wins*, so N overlapping calls still start N native `getCurrentPositionAsync` requests **and** N 10s grace timers. Any burst of invocations therefore produced a request storm whose superseded attempts all logged `stale` exits, while the surviving attempt could still lose the grace race and land on `timed-out`.

`requestLocation` itself was **already** `useCallback(..., [])` (stable identity) and **both** callers already had one-shot refs (`requestedLocationRef` in `map.tsx`, `primedLocationRef` in `vehicle/[id].tsx`) — so the storm was **not** caused by unstable callback identity and **not** by an unguarded `useEffect([locationStatus, requestLocation])`. Verified by source inspection of `src/location/location-context.tsx`, `src/app/(app)/(tabs)/map.tsx`, `src/app/(app)/vehicle/[id].tsx`, `src/app/(app)/_layout.tsx` and `src/app/_layout.tsx`.

The `id=1..12` burst reproduced in one earlier logcat was produced by **dev-time Fast Refresh remounts** while files were being edited under the running app (stack trace showed `reconnectPassiveEffects` → re-running passive mount effects), not by an application-code loop. Recorded so the same false signal is not re-diagnosed as a product loop.

### Fix applied (smallest change)
- **`src/location/location-context.tsx`** — split the pipeline out of `requestLocation` into `resolveLocation` (unchanged body) and made `requestLocation` a thin gate: `if (resolvingRef.current) return;` → `resolvingRef.current = true` → `try { await resolveLocation(); } finally { resolvingRef.current = false; }`. One resolution is admitted at a time **by construction**, regardless of trigger. `requestIdRef` is deliberately untouched on the early return, so the in-flight request keeps its id and can still apply its result. `requestIdRef` stale-result protection is **fully retained** (all four `requestId !== requestIdRef.current` guards untouched).
- **`src/app/(app)/(tabs)/map.tsx`** — passes the already-declared-but-unused `busy={locationStatus === 'resolving'}` prop to `EnableLocationCard`, so a burst of presses cannot even reach the provider during a request.
- No timers, no intervals, no `setTimeout` changes, no change to `LOCATION_GRACE_PERIOD_MS = 10_000`, no accuracy-policy change, no last-known-position policy change, no new `expo-location` calls outside `UserLocationProvider`.

### Verified facts (runtime, Development Build + Metro)
- **Initial auto-request count after fix = exactly 1.** `adb logcat` on a cold launch + `yamakexponew://map` deep link logged `request entry id=1` once, with **no `id=2…` while resolving**. Repeated across 3 clean runs.
- **Manual retry still works, one press = one request.** With device location services off (`cmd location set-location-enabled false` → `unavailable`), one press on the card produced `request entry id=2` — exactly one.
- **Spam burst = still one request.** 8 presses at ~220 ms intervals inside the resolving window produced exactly **one** new request (`id=3`), not 8.
- **Stale-result guard preserved and still correct** — the early return never touches `requestIdRef`, so an in-flight request keeps its id and applies its own result.
- **No duplicate permission prompt.** `getForegroundPermissionsAsync()` returns `{status:"granted", granted:true, canAskAgain:true, expires:"never", accuracy:"fine"}` (verified from both the pre-check and the request call); with permission already granted the OS prompt does not fire.
- **Android permission state (dumpsys `com.yamak.assist`)**: `ACCESS_FINE_LOCATION: granted=true`, `ACCESS_COARSE_LOCATION: granted=true`, flags `USER_SET|SELECTED_LOCATION_ACCURACY`.
- **Fresh GPS fix result**: `getCurrentPositionAsync({accuracy: Balanced})` resolved → `status = available`, coords `{"latitude":29.2382967,"longitude":48.0555}`. **Card disappeared.**
- **User marker**: blue `#2563EB` dot + navy "You are here" tooltip rendered on-screen (verified by pixel scan of `screencap`; 1228 px of `#2563EB`).
- **Recenter works**: panning moved the user marker fully off-screen; one press on `Recenter map` (`accessibilityState.disabled=false`, so it is enabled whenever coords exist) restored it to the exact map centre (identical 46×46 px bbox).
- **Haversine — Car Wash**: vehicle `#3` (online) at `29.2383392,48.0555014` → `0.00 km` → renders **`<0.1 km`**. Matches the required value.
- **Haversine — Wench**: vehicle `#6` (online) at `28.7932593,48.0327835` → `49.54 km` → renders **`49.5 km`**. Matches the required value. No backend `distance` field is read (`geoLocation.coordinates` + local `haversineDistanceKm` only).
- **Card copy is now status-truthful** (fix carried from the previous slice): `unavailable` → "📍 Location services are off / Location access is on, but your device location services are off. Turn them on, then try again. / Try again"; `timed-out` → "📍 Location not found / … we could not get your position. Try again. / Try again".
- **Debug logs removed.** All temporary `[LOCDBG]` / `[MAPDBG]` instrumentation was deleted; a repo-wide scan of `src/**/*.ts(x)` for `LOCDBG|MAPDBG|TEMP DIAGNOSTIC|console.log|console.warn|console.debug` returns **zero matches**. `npx tsc --noEmit` clean apart from baseline.

### Emulator note (environment, NOT a code defect — recorded so it is not re-diagnosed)
Early runs timed out because the emulator's **network provider has never produced a fix** (`dumpsys location` → `network provider: last location=null`) and `Accuracy.Balanced` maps to `PRIORITY_BALANCED_POWER_ACCURACY`, which does **not** engage the GPS provider. `adb emu geo fix` feeds the GPS provider, so it could not satisfy a Balanced request; `getLastKnownPositionAsync` did return a fix but with `age ≈ 982565 ms` (~16 min), far older than the `maxUpdateAgeMillis = 3000` Balanced imposes. Once the fused cache was warmed by repeated `adb emu geo fix` injection, **Balanced resolved normally** — confirming the `timed-out` outcome was an emulator state, not app logic. Device location services were restored afterwards (`location_mode = 3`, `Location Setting: true`).

### Out-of-scope observation (pre-existing, NOT changed by this slice)
The mount-time one-shot auto-recenter (`recenteredOnUserRef` + `animateToRegion` in `map.tsx`) did **not** move the map to the user on first load — `git show HEAD` confirms the effect is byte-identical to the committed STEP 6B code. Manual Recenter works. Left untouched deliberately; flagged for a separate decision.

### Hygiene (re-run after the fix)
- `npx tsc --noEmit` → exactly the one known baseline error `src/components/app-tabs.web.tsx(27,38)` (`"/explore"` TS2322) — **forbidden to fix, untouched**.
- `git diff --check` → **clean, exit 0** (CRLF line-ending warnings only).
- **NO migrations, NO commits, NO native rebuild, NO dependency change, NO backend change, NO iOS work.** `react-native-maps` stays 1.28.2; `app.config.ts` + Google Maps native config untouched.
- **Next approved step**: user review of the 3-file diff, then commit.

## PHASE A — STEP A1: SESSION / AUTH GATE (implemented & runtime-verified, 2026-10-02)

**Verdict: A1 SESSION/AUTH GATE PASS.** Routing only. Commit: `e5ec96b`
`feat(auth): add authenticated session routing gate`. Next approved step was
**A2 — Email OTP → Authenticated App**, which is now **DONE** — see
`PHASE A — STEP A2` at the end of this document.

### Startup routing BEFORE this change (verified, read-only)
1. `src/app/_layout.tsx` ran module-scope `void SplashScreen.preventAutoHideAsync()` and rendered
   `AuthProvider` → `AuthReadyLayout`, which returned `null` while `loading` and called
   `SplashScreen.hideAsync()` once status left `loading`.
2. Route `/` resolved to `src/app/index.tsx`, which **unconditionally** rendered
   `<Redirect href="/register" />` — it never read `useAuth()`.
3. Consequence (both verified against the pre-change code): a user with a **valid persisted
   session** cold-launched and was sent to **Register**, not into `(app)`; and `(app)/_layout.tsx`
   had **no gate**, so an **unauthenticated** user could open `/map` or `/vehicle/[id]` directly.

### Where the gate now lives (three scoped guards — no route was moved or created)
- **Startup gate** — `src/app/index.tsx`. `loading` → neutral surface; `authenticated` →
  `AUTHENTICATED_ENTRY_ROUTE` (`/map`); else → `UNAUTHENTICATED_ENTRY_ROUTE` (`/register`).
- **Protected group** — `src/app/(app)/_layout.tsx`. `loading` → neutral surface;
  not `authenticated` → `<Redirect href="/register" />`; `authenticated` → the **unchanged**
  `<UserLocationProvider><Slot /></UserLocationProvider>`.
- **Unauthenticated area** — `src/app/register.tsx`. `authenticated` →
  `<Redirect href="/map" />`, placed after every hook so hook order stays unconditional.

### Auth ownership (unchanged by A1)
- `AuthProvider` (`src/auth/auth-context.tsx`) remains the **single auth/session owner**. No second
  auth store, **no Zustand**, and no duplicate SecureStore read inside any route — the gate only
  consumes `useAuth()`.
- SecureStore keys, token format and `auth-storage.ts` were **not touched**. Confirmed on-device:
  the emulator's `SecureStore.xml` still holds exactly `key_v1-yamak_access_token` and
  `key_v1-yamak_auth_user`.
- **No API call was added to validate a restored token.** A1 routes on the existing persisted
  session only; there is still no boot-time token validation (same as legacy).

### Destination tables
- New `src/auth/app-routes.ts` — `UNAUTHENTICATED_ENTRY_ROUTE = '/register'` (unchanged default)
  and `AUTHENTICATED_ENTRY_ROUTE = '/map'`. Kept **outside `src/app/`** on purpose, because Expo
  Router treats every file in the app directory as a potential route.
- `/map` is chosen **only** because it is the one entry route that already exists inside `(app)`.
  When A3 adds Home and A5 adds the tab layout, this constant is repointed; no other A1 file
  changes. A1 added **no Home route, no tabs, no onboarding, no drawer**.

### Redirect-loop control (why these three placements and not one root-level gate)
A single root-layout gate using `useSegments()` was **rejected on purpose**: it would have had to
treat every non-`(app)` route as blocked once authenticated, which would have made `/email-otp`
navigate away the instant `authenticate()` resolved — i.e. it would have silently implemented A2.
The three guards above are scoped so that `/email-otp` is untouched. `<Redirect>` performs a
`router.replace`, so a blocked protected route is never left on the back stack for a back gesture
to re-enter; verified on-device (BACK after the `/map` block did not return to `/map`).

### Runtime verification (Android emulator-5554, `com.yamak.assist` Development Build + Metro, live backend)
Screen identity was read from the on-device UI/accessibility hierarchy dump (text nodes), not guessed.

| Case | Action | Observed | Result |
|---|---|---|---|
| 1 | No stored session, cold launch | blank splash → **Register** | PASS |
| 2 | Valid stored session, cold launch (force-stop + relaunch) | **Map** inside `(app)`; Register never mounted | PASS |
| 3 | Unauthenticated deep link `/map` | redirected to **Register** | PASS |
| 3 | Unauthenticated deep link `/vehicle/1` | redirected to **Register** | PASS |
| 4 | Authenticated deep link `/register` | redirected to **Map**; Register never shown | PASS |
| 5 | Rapid UI sampling across a cold launch | blank(splash) → Register only; no wrong-screen flash | PASS |
| I | BACK after the `/map` block | never returned to `/map` (no loop) | PASS |

- The emulator held a valid session, so Cases 2, 4 and I ran against it directly. To exercise
  Cases 1, 3 and 5 the emulator's `shared_prefs/SecureStore.xml` was **backed up and removed**, the
  dev-client server URL in `settings_preference.xml` was left intact, and the file was then
  **restored byte-for-byte** (1355 bytes, `rw-rw----`) and re-verified: the app again cold-launched
  straight into `(app)`. The emulator is back in its original authenticated state.
- `logcat` across the whole session: the **only** `ReactNativeJS` line was the normal
  `Running "main" with {...}` startup line — **zero JS errors, zero JS warnings**, and zero
  `Attempted to navigate before mounting the Root Layout` / unmatched-route warnings.
- No destination UI beyond what already existed in `(app)` was implemented. The Map's
  "Enable location" permission card appearing after a fresh cold start is pre-existing Map
  behaviour (fresh process ⇒ no granted permission yet), not gate behaviour.

### Hygiene for this slice
- `npx tsc --noEmit` → **exactly the one known baseline error**,
  `src/components/app-tabs.web.tsx(27,38)` `"/explore"` TS2322 — **forbidden to fix, untouched**.
  No new type errors were introduced.
- `git diff --check` → **clean, exit 0** (CRLF line-ending warnings only, pre-existing repo mix).
- `git status --short` at delivery → `M src/app/(app)/_layout.tsx`, `M src/app/index.tsx`,
  `M src/app/register.tsx`, `M src/auth/index.ts`, `?? src/auth/app-routes.ts`,
  `?? src/components/auth/AuthGateLoading.tsx`.
- **NO migrations, NO commits, NO native rebuild, NO Expo prebuild, NO dependency change, NO
  backend change, NO iOS work.** `react-native-maps` stays `1.28.2`; `app.config.ts`, `app.json`
  and the Google Maps native config are untouched.
- `src/app/email-otp.tsx` is **byte-identical** — A2's navigation was NOT added.
- Metro (`npx expo start --dev-client --port 8081`) was left running against the emulator; it can
  be stopped at any time without a rebuild.

## PHASE A — STEP A2: EMAIL OTP → AUTHENTICATED APP (implemented & runtime-verified, 2026-10-02)

**Verdict: A2 EMAIL OTP → AUTHENTICATED APP PASS.** One file changed: `src/app/email-otp.tsx`
(43 insertions, 4 deletions). Commit: **NOT YET**. Next approved step:
**A3 — Home Route.**

### Old Email OTP success behaviour (verified before changing anything)
`src/app/email-otp.tsx` ended a successful verification **on the same screen, permanently**:
1. `handleVerifyPress()` called `verifyEmailOtp({ email, code })`.
2. On `success` + `data.user !== undefined` + `data.accessToken !== undefined` it did
   `await authenticate(accessToken, user)`, then `setIsVerified(true)`.
3. `isVerified` swapped the OTP form for a static success card (checkmark +
   `SUCCESS_MESSAGE`) and ran a scale/opacity animation + accessibility announcement.
4. **There was no navigation at all** — the file imported only `useLocalSearchParams`, had no
   `useRouter`, no `Redirect`. Success was a dead end.
Legacy Yamak differs: it set the auth-store token and the root navigator re-evaluated
`token ? <AuthedReadyApp/> : <AuthStackNavigator/>`, so the whole tree swapped implicitly. In Expo
Router there is no such implicit swap, so an explicit replace is required — A2 adds exactly that.

### API success contract (verified live; **no backend change**)
- TS type `VerifyEmailOtpResponse` (`src/api/auth.ts`): `data.user?`, `data.accessToken?` — unchanged.
- Confirmed against the running backend source (read-only):
  `AuthController::verifyEmail()` returns `response()->success(['user' => <resource>, 'accessToken' => <plainTextToken>])`.
- Confirmed live on the LAN dev backend: `POST auth/signup` → `{ user, accessToken }`;
  `POST auth/verify-email` with a valid code → HTTP 200,
  `user.email = a2probe@yamak-mobile.test`, `isEmailVerified = true`, `accessToken` present;
  a wrong code → HTTP 400 `{"success":false,"message":"invalid code","data":null,"errors":null}`.
- Field names were **not** invented and the endpoint was **not** modified.

### `authenticate()` integration (single session owner reused)
- The screen still calls **only** `authenticate(accessToken, user)` from `useAuth()`. It does not
  write SecureStore, does not duplicate persistence, and no new store was created.
- Navigation happens **after** `await authenticate(...)` resolves, so `(app)` always mounts with the
  session already persisted. Persisted state verified on-device: `key_v1-yamak_access_token` +
  `key_v1-yamak_auth_user` (AES/keystore-encrypted values, as in A1).
- The `authenticate` call was moved out of the shared `catch` so a navigation failure can never be
  reported as `SESSION_SAVE_ERROR_MESSAGE`; a persistence failure still returns early and stays put.

### Authenticated destination and replace-navigation
- Reused the existing central constant, **no second destination**:
  `import { AUTHENTICATED_ENTRY_ROUTE } from '@/auth'` → `router.replace(AUTHENTICATED_ENTRY_ROUTE)`
  (`'/map'`, the same entry A1's gate uses). This is a **reuse of A1**, not a new mechanism.
- `replace`, not `push` — `/email-otp` is removed from the stack, so a completed signup is not
  re-enterable. Verified on-device: BACK after success does **not** return to Email OTP and does not
  exit the app. The underlying `/register` entry is caught by A1's own register guard, so the
  observable result is that Back leaves the user in the authenticated area. No loop back to Register.

### Duplicate-submit / navigation safety
- The existing guard (`isVerifyingRef` set **synchronously** on entry, plus
  `disabled={!isCodeComplete || isVerifying}`) already blocks a double tap while in flight — verified
  by inspection, no duplicate API call observed at runtime.
- One added ref, `hasAuthenticatedRef`, closes the only remaining window (after `finally` clears
  `isVerifyingRef` but before the success card has unmounted the Verify button), making
  **one submit → one `authenticate` → one `replace`** explicit.
- **No timeout, no delay, no navigation hack.** The screen simply leaves on its own.

### Success-hold state
- `isVerified` and the success card were **kept** — useful transient confirmation, not dead code.
- Smallest clean change: the old permanent hold became a transient frame; no redesign, no removed UI.

### Runtime verification (Android emulator-5554, `com.yamak.assist` Development Build + Metro + live dev backend)
| Case | Result |
|---|---|
| 1 — valid OTP `5313` | Left `/email-otp` automatically; `/map` rendered; **no Register flash**; no duplicate navigation; session persisted |
| 2 — Back after success | Did **not** return to Email OTP; app stayed in the authenticated area |
| 3 — cold start after success | Neutral loading surface only, then `/map`; **Register never appeared** (sampled at +5/+7/+10/+13s) |
| 4 — invalid OTP `0000` | Stayed on Email OTP; `That code is not correct. Please try again.`; **no session created**; no navigation |
| 5 — network/API failure | Stayed on Email OTP; `Unable to connect to the server. Please try again.`; **no session created**; no navigation |

- A1 still intact throughout: no session → Register; session → `/map`; `/email-otp` still reachable
  while unauthenticated (its ungating was preserved).
- `logcat` clean on the final cold start: only `Running "main"`, zero JS errors/warnings, zero Expo
  Router navigation/mount warnings. (A "Cannot connect to Expo CLI" warning appears only while device
  connectivity is deliberately cut for Case 5; it is dev-client noise, not app code.)
- Method note for Case 5: `svc wifi disable` does **not** block this emulator (connectivity is `eth0`
  `10.0.2.15`; only ICMP was blocked), and a global HTTP proxy blackhole also kills the dev-client
  bundle load. The working method was to boot the app normally, then `cmd connectivity airplane-mode
  enable` so the API became `Network is unreachable` while the already-loaded bundle kept working.
  Connectivity was fully restored afterwards (`airplane_mode_on=0`, `http_proxy=:0`, API HTTP 200).
- Emulator left as found: `SecureStore.xml` restored byte-for-byte (1355 bytes, `rw-rw----`).

### Scope discipline
- **No A3/Home work.** No `home.tsx`, no `(tabs)/_layout.tsx`, no `(app)/index.tsx`, no onboarding,
  no drawer. Route tree is byte-identical to post-A1:
  `_layout.tsx`, `index.tsx`, `register.tsx`, `email-otp.tsx`, `(app)/_layout.tsx`,
  `(app)/(tabs)/map.tsx`, `(app)/vehicle/[id].tsx`.
- **No backend change, no dependency change, no native build, no Expo prebuild, no migration, no iOS
  work.** `react-native-maps` stays `1.28.2`; `app.config.ts` / `app.json` untouched.
- Only `AUTHENTICATED_ENTRY_ROUTE` is used from `src/auth/app-routes.ts`; it was **not** repointed.

### Hygiene for this slice
- `npx tsc --noEmit` → **exactly the one known baseline error**,
  `src/components/app-tabs.web.tsx(27,38)` `"/explore"` TS2322 — **forbidden to fix, untouched**.
  No new type errors.
- `git diff --check` → **clean, exit 0**.
- `git diff --stat` → `src/app/email-otp.tsx | 47 ++++---`, 1 file changed, 43 insertions(+), 4 deletions(-).
- `git status --short` → `M src/app/email-otp.tsx` (only).
- Metro (`npx expo start --dev-client --port 8081`) left running against the emulator.

## PHASE A — A3 HOME ROUTE

- Home route = /home
- file = src/app/(app)/(tabs)/home.tsx
- ServicesList, AddsList, VehiclesList, ViewMap reused
- service  /map?serviceId=...
- vehicle  /vehicle/[id]
- Explore Map  /map
- AUTHENTICATED_ENTRY_ROUTE changed /map  /home
- A1 authenticated cold start  Home verified previously
- A2 navigation now resolves to Home through the shared constant
- runtime OTPHome was not re-run in the closure session because Metro was unstable; do not claim a new runtime test
- Home API safe-state behavior was verified previously; not re-run in the closure session
- no tabs/Profile/Onboarding/Drawer
- no backend/dependency/native product changes
- TypeScript only known baseline error
- commit = NOT YET
- next approved step = A4 Profile Hub

## PHASE A — A4.1 PROFILE HUB ANALYSIS (analysis only, 2026-10-03)

**Verdict: A4.1 PROFILE HUB ANALYSIS PASS. No product code changed; no backend changed; no legacy
change. Commit: NOT YET. Next approved step: A4.2 Profile Hub Implementation.**

### Current authenticated Expo route tree (verified)
- `src/app/_layout.tsx` root; `src/app/index.tsx` A1 gate → `AUTHENTICATED_ENTRY_ROUTE` = `/home`.
- `src/app/register.tsx`, `src/app/email-otp.tsx` (unauthenticated).
- `src/app/(app)/_layout.tsx` = A1 session gate + `UserLocationProvider`; **no tabs, no drawer**.
- `src/app/(app)/(tabs)/home.tsx` → `/home` (A3).
- `src/app/(app)/(tabs)/map.tsx` → `/map`.
- `src/app/(app)/vehicle/[id].tsx` → `/vehicle/[id]`.
- No `(tabs)/_layout.tsx` (A5 owns it). No Profile route or Profile components exist in `src/` yet.

### Current auth user model (verified)
- `RegisteredUser` (`src/api/auth.ts`): `id: number`, `_id: string`, `name: string`,
  `email: string`, `phone: string`, `isEmailVerified: boolean`. No avatar/photo/language field.
- `AuthProvider` (`src/auth/auth-context.tsx`) exposes `status`, `user`, `accessToken`,
  `authenticate(token, user)`, `signOut()`.
- Persistence (`src/auth/auth-storage.ts`): SecureStore keys `yamak_access_token` and
  `yamak_auth_user` (JSON of `RegisteredUser`). `signOut()` = `clearSession()` (deletes both) plus
  sets `unauthenticated`; the A1 gate then redirects to `/register`.

### Legacy Profile Hub source files (read-only reference)
- `yamak-mobile/src/screens/ProfileScreen.tsx` (composition)
- `yamak-mobile/src/components/Profile/ProfileHeaders.tsx` (identity: avatar `person1.png`, name, email)
- `yamak-mobile/src/components/Profile/ProfileMainButtons.tsx` (icon grid)
- `yamak-mobile/src/components/Profile/ButtonSection.tsx` (list + logout/delete/language)
- `yamak-mobile/src/components/Profile/ProfileLables.tsx` (row)
- `yamak-mobile/src/navigations/ProfileStack.tsx` (stack destinations)
- `yamak-mobile/src/navigations/TabNavigator.tsx` (registers Profile as the 3rd bottom tab)
- `yamak-mobile/src/apis/users.api.ts` (profile get/update/delete)

### Legacy Profile menu inventory (top → bottom, verified from source)
1. Identity header — avatar + `user.name` + `user.email`; reads auth store, **no fetch on mount**.
2. MyCar → `MyCar` screen (API: `user-cars` GET/POST/DELETE).
3. Share → native `Share` sheet (external).
4. Favorites → `Favorites` screen (no mobile favorites route found in `api_mobile.php` — dependency unverified).
5. EditProfile → `EditProfile` screen (API: GET/PATCH `app-users/profile`; the only screen that fetches fresh profile).
6. ContactUs → `ContactUs` screen.
7. AboutUs → external `https://yamak-kw.com`.
8. environment → **DEV ONLY**, hidden when `!isDev`.
9. notifications → **commented out / dead** in legacy.
10. AboutYamakApp → `AboutYamak` static screen.
11. language → in-app language picker modal (local).
12. JoinUs → `JoinUs` modal.
13. DeleteAccount → `DELETE app-users/account`, confirm modal, then local sign-out.
14. Logout → **confirm Alert → local sign-out only; no backend call**.
15. "Powered By Yamak" → external `yamakWebsite`.
- `PrivacyAndPolicy` is registered in `ProfileStack` but has **no menu button** in the verified source.

### Logout behavior (verified)
- Legacy: `Alert.alert("are you sure you want logout", …)` → `removeAuthentication()`, which only
  clears the zustand/AsyncStorage auth store. No backend call, no token revoke.
- Expo: `signOut()` already exists and clears SecureStore; A4 should reuse it. Minimum behavior =
  confirm dialog → `signOut()` → A1 gate → `/register`.

### Backend profile-related routes (READ ONLY, `routes/api_mobile.php`, `auth:sanctum`)
- `GET  mobile/v1/app-users/profile` → `UserController::profile`
- `PATCH mobile/v1/app-users/profile` → `UserController::updateProfile`
- `DELETE mobile/v1/app-users/account` → `UserController::deleteAccount`
- `GET/POST mobile/v1/user-cars`, `DELETE mobile/v1/user-cars/{userCar}`
- `GET mobile/v1/user-notifications/mine`
- **No logout endpoint.** `appUserResource` returns: `id, _id, name, phone, username, email, photo,
  lastLogin, birthDay, gender, language, status, fcmToken, notificationToken, notificationsEnabled,
  isEmailVerified, location{latitude,longitude}, createdAt`.

### Recommended data ownership
- **A. Render immediately from `AuthProvider.user`** (matches legacy; no fetch on the hub).
- No Zustand, no duplicate auth store, no speculative caching. The existing `GET app-users/profile`
  is the endpoint for the later Edit Profile (A4.x), where a fresh fetch belongs.

### Proposed Expo route
- `src/app/(app)/(tabs)/profile.tsx` → `/profile` (sibling of `home.tsx` / `map.tsx`). Fits the
  current structure; `(tabs)/_layout.tsx` stays absent because **A5 owns the tab bar**.

### Design source status
- **C. NO APPROVED PROFILE DESIGN EXISTS.** `docs/rebuild/approve-ui/` contains only home, map,
  register, VehiclesDetails. A provisional prototype exists at
  `docs/rebuild/new-ui/main/profile/index.html`, but `new-ui/README.md` marks it
  **PROPOSED / NEEDS REVIEW** and `UI-CATALOG.md` lists Profile hub as PROPOSED.
- A4.2 must use the existing Yamak visual language + verified legacy content, then a dedicated UI
  review; do not claim design parity.

### A4 implementation boundaries + menu classification
- IMPLEMENT NOW: identity header (name/email + static avatar), Logout.
- ROUTE LATER: My Cars, Favorites, Edit Profile, Contact Us, Join Us, About Yamak, Language.
- HIDE UNTIL IMPLEMENTED: Notifications (dead in legacy), Delete Account (sensitive, out of the
  minimum), dev-only environment row.
- EXTERNAL ACTION: Share, About Us (`https://yamak-kw.com`), Powered By Yamak.
- Avoid dead buttons: show only destinations that exist or are external; do not create fake screens.
- **A4 must NOT implement** Edit Profile, My Cars, Favorites, or Notifications screens.
- Non-profit facilitator model preserved: no payment/provider-quality claims in Profile copy.

### Blockers / unknowns
- Favorites and Contact Us backend dependencies not confirmed in the mobile routes inspected.
- `RegisteredUser` has no `photo` field, so an avatar cannot come from the session; legacy uses a
  static `person1.png`.
- No approved Profile design → A4.2 output needs a UI review.

### Status
- No `src/` product code changed; no backend changed; no `yamak-mobile` change.
- Next approved step = A4.2 Profile Hub Implementation. Commit = NOT YET.

## PHASE A — A4.2 PROFILE HUB IMPLEMENTATION (implementation, 2026-10-03)

**Functional scope only (no approved design).** Route `/profile` created at
`src/app/(app)/(tabs)/profile.tsx`. Renders identity from `useAuth().user` (`name`, `email`) with
initials fallback; no profile API fetch. Functional items: Share, About Us (external), Powered By
Yamak (external), Logout (Alert confirm → `signOut()`, A1 gate redirects to `/register`). Deferred
all future feature rows (no dead buttons). No backend/dependency/native changes. TypeScript: no
new errors introduced by A4.2 (only existing baseline `src/components/app-tabs.web.tsx(27,38)`).
Design status: provisional, not approved yet; requires approve-ui review. Commit = NOT YET.
Next after functional acceptance: Profile Code Review + Design Review; A5 must NOT begin until A4
accepted.

## PHASE A — A4.3 PROFILE HUB DESIGN REVIEW (design review only, 2026-10-03)

Design review completed. Current A4.2 UI structure reviewed against
`docs/rebuild/new-ui/main/profile/index.html` (PROVISIONAL/PROPOSED) and legacy
`yamak-mobile/src/screens/ProfileScreen.tsx` and Profile components. Fake/demo elements identified
and rejected (no photo, no stats/badges/membership/provider status). Approved structure: centered
identity (initials + name + email; phone optional), single menu surface card for functional rows
only (no dead buttons), Logout as menu row with destructive confirmation (behavior unchanged),
Powered By Yamak as footer branding (external also available). RTL-safe rules noted; real-data
only. Approved spec created at
`docs/rebuild/approve-ui/profile/APPROVED-PROFILE-SPEC.md`. Profile design = APPROVED (structure);
Profile UI code still needs A4.4 implementation. No product code changed; no backend; yamak-mobile
untouched. Next approved step = A4.4 Profile UI Implementation. Commit = NOT YET.

## PHASE A — A4.4 PROFILE HUB UI IMPLEMENTATION (implementation, 2026-10-03)

Approved spec applied: `docs/rebuild/approve-ui/profile/APPROVED-PROFILE-SPEC.md`. Visual polish
applied to `src/app/(app)/(tabs)/profile.tsx` (header spacing, avatar initials alignment, menu
surface/card subtle border/shadow, chevron spacing, identity typography) while preserving all
functional behavior (useAuth().user, signOut(), Share, Linking, Alert). No profile API fetch; no
dead buttons; no future features; no backend/dependency/native changes. RTL-safe layout preserved.
TypeScript: no new errors introduced by A4.4 (only existing baseline
`src/components/app-tabs.web.tsx(27,38)`). Design matches approved structure with no intentional
deviations. Functional behavior verified conceptually. Commit = NOT YET. Next step = A4 final
acceptance / commit. A5 not started.

## PHASE A - A5.1 BOTTOM TABS ANALYSIS (analysis only, 2026-10-03)

**No product code changed. Analysis only: no `(tabs)/_layout.tsx` was created, no `src/` file was
touched, no package was installed, no native build / Expo / Metro / tsc run, nothing committed.**
Only this file changed. Read-only evidence was taken from the installed `node_modules`
(`expo-router@57.0.23`, bundled `@react-navigation/bottom-tabs`) and from `src/`.

### Current authenticated route tree (verified, 9 files)
- `src/app/_layout.tsx` - root `Stack`, `headerShown: false`, wraps `AuthProvider` + `AuthReadyLayout`.
- `src/app/index.tsx` - A1 cold-start gate -> `AUTHENTICATED_ENTRY_ROUTE`.
- `src/app/register.tsx`, `src/app/email-otp.tsx` - unauthenticated area.
- `src/app/(app)/_layout.tsx` - A1 session gate + `UserLocationProvider` + `<Slot />`. Its comment
  already states: "Deliberately still no tabs and no drawer: A5 owns the navigator."
- `src/app/(app)/(tabs)/home.tsx` -> `/home`
- `src/app/(app)/(tabs)/map.tsx` -> `/map`
- `src/app/(app)/(tabs)/profile.tsx` -> `/profile`
- `src/app/(app)/vehicle/[id].tsx` -> `/vehicle/[id]`

**`(tabs)/_layout.tsx` does NOT exist.** Today `(tabs)` has no layout, so in
`expo-router/build/getRoutesCore.js` `flattenDirectoryTreeToRoutes` (a directory only becomes a route
node when it holds a `_layout`, line 462) the three `(tabs)` files are hoisted into `(app)`'s `<Slot>`
as ordinary siblings -> `(app)` currently has 4 flat screens and NO tab bar at all.

### A1 gate destination stays `/home`
`src/auth/app-routes.ts`: `AUTHENTICATED_ENTRY_ROUTE = '/home'`, and its own doc comment already
anticipates A5: "A5 will add the `(tabs)` layout that turns `/home` and `/map` into tabs without
moving either file; this constant does not need to change again." **A5 must not change this
constant.** Typed routes in `.expo/types/router.d.ts` already contain `/home`, `/map`, `/profile`,
`/vehicle/[id]` - the URLs are stable and correct today.

### Navigator decision: Expo Router `Tabs` (NOT manual React Navigation)
Use `Tabs` from `expo-router`. Do NOT reintroduce `NavigationContainer` /
`createBottomTabNavigator` / a manual React Navigation root. This is already the written project
rule: `docs/rebuild/EXPO-MIGRATION.md:37` ("Expo Router replaces `NavigationContainer`") and
`docs/rebuild/03-navigation-map.md:265-273` ("Do NOT reintroduce").

Import-path nuance to decide in A5.2: `expo-router/build/exports.d.ts:44` exports
`export { Tabs } from './layouts/Tabs'`, but line 42 marks it
`@deprecated Use 'import { Tabs } from 'expo-router/js-tabs' instead.`
`node_modules/expo-router/js-tabs.d.ts` exists (`export * from './build/layouts/Tabs'`). Both point
at the same module. The root import works and matches the A5 brief; the subpath is the
non-deprecated spelling. Decide once in A5.2 - it is a one-line difference, not a blocker.

### CRITICAL - tab order is NOT alphabetical
`expo-router/build/sortRoutes.js` ends with the default comparator
`return a.route.length - b.route.length;` - ordering is by **string length**, not alphabetically.
With no explicit `<Tabs.Screen>` declarations the three files would auto-append in the order
`map` (3) -> `home` (4) -> `profile` (7), i.e. **Map first and Home in the middle - wrong.**
`build/layouts/withLayoutContext.js` passes `useOnlyUserDefinedScreens = false`, so undeclared files
are still auto-appended after the declared ones.
=> A5.2 MUST declare the screens explicitly in the desired order:
`<Tabs.Screen name="home" />` then `name="map"` then `name="profile"`.
Visible order = **Home | Map | Profile**. Initial tab = **Home** (first declared); also set
`initialRouteName="home"` explicitly so it does not depend on declaration order, and so deep links
and history restores stay predictable.

### Tab bar on `/vehicle/[id]`: correctly hidden, no config needed
`vehicle/[id]` lives in `(app)`, NOT inside `(tabs)`, so it can never appear as a tab.
Once `(tabs)/_layout.tsx` exists, `(app)`'s `<Slot />` has exactly 2 children: `(tabs)` (a group,
sorts first) and `vehicle/[id]` (dynamic, sorts last). `views/Navigator.js` `SlotNavigator` renders
only `descriptors[state.routes[state.index].key].render()` - one child at a time - so the tab bar is
structurally absent on `/vehicle/[id]`. **No `href: null` / `tabBarStyle: display:none` required.**
`push('/vehicle/[id]')` appends to the `(app)` Stack history, so Back returns to `(tabs)` on the
last active tab.
Legacy divergence, recorded not replicated: in `yamak-mobile` the Vehicle Details screen was
registered inside `HomeStackNAvigator`, so legacy kept the tab bar visible there.

### State preservation across tab switches - sufficient
`BottomTabView.js`: `lazy = true` by default (a tab mounts on first visit, not before),
`detachInactiveScreens = true` on native, and `routes.map(...)` keeps every visited tab mounted.
There is a `freezeOnBlur` option but no `unmountOnBlur`. Consequence: Home/Map/Profile local state,
fetched data, and Map camera / selection / mapType / traffic settings all survive tab switches with
no remount and no refetch. **No caching or state-hoisting changes are needed for A5.**

### Android hardware Back (verified from installed source)
`expo-router/build/fork/useBackButton.native.js` -> `navigation.canGoBack() ? goBack() : false`,
recursing through parent navigators (`useNavigationHelpers.js:75-84`); otherwise the OS default runs
(app backgrounds). `react-navigation/routers/TabRouter.js` `GO_BACK` consumes `state.history` with
default `backBehavior: 'firstRoute'` (line 96, `getRouteHistory` line 34-41). So:
- Back on **Home** -> nothing to pop -> app backgrounds (expected).
- Back on **Map** or **Profile** -> returns to the **Home** tab.
Legacy used `@react-navigation/bottom-tabs ^7.18.18` (same major, same default behaviour), so parity
is expected - but legacy `node_modules` is absent, so this is a high-confidence inference to confirm
at runtime in A5.2, not a verified fact.

### Safe area: do NOT set a numeric `height`
`expo-router/build/react-navigation/bottom-tabs/views/BottomTabBar.js:100-113` `getTabBarHeight`:
if the flattened `tabBarStyle` contains a `height` and it is a number, that number is returned as-is
and the bottom safe-area inset is NOT added. If no height is set, the bar is
`TABBAR_HEIGHT_UIKIT + insets.bottom`. => **Leave `height` out of `tabBarStyle` and let
`react-native-safe-area-context` (~5.7.0, already installed) handle the inset automatically.**
Related cosmetic note (no action in A5.1, do not "fix" blindly in A5.2): `home.tsx:89` and
`map.tsx:289` already add their own `insets.bottom` padding, so once a tab bar exists the bottom
padding will effectively be counted twice. Flagged for the A5.2 visual pass.

### Design source status: (B) indirectly approved via Home / Map - NOT a dedicated tabs design
There is **no `docs/rebuild/approve-ui/tabs/` folder** (approve-ui contains only `home/`, `map/`,
`profile/`, `register/`, `VehiclesDetails/`). But two already-approved screens contain a fully
specified bottom tab bar, so the visual authority for the bar exists:
- `docs/rebuild/approve-ui/home/code.html:409-444`
  (`<!-- BEGIN: Bottom Tab Navigation (Faithful to Yamak Prototype) -->`,
  `data-purpose="bottom-tab-navigation"`):
  `absolute bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-6 py-2 pb-6
  flex justify-around items-center shadow-nav z-40`;
  ACTIVE = gold dot `w-1.5 h-1.5 bg-[#E9A319] rounded-full mb-1` ABOVE the icon, solid house icon
  `w-5 h-5 fill-[#0B2A4A]` (`M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z`), label
  `text-[11px] font-bold text-[#0B2A4A]`;
  INACTIVE = `text-slate-400` icon + `text-[11px] font-medium` label, `pt-2.5`;
  icons 20x20, `viewBox 0 0 24 24`.
- `docs/rebuild/approve-ui/map/code.html:334-362` (`data-purpose="bottom-nav"`): same system -
  `relative z-30 bg-white border-t border-slate-200 px-6 py-2`, inactive `text-slate-400`, ACTIVE
  `text-yamakNavy font-bold` + tiny gold dot, Map icon as a filled/outlined folded-map polygon.
- The iOS home-indicator pill in `home/code.html:445-449` (`w-32 h-1 bg-slate-900/30`) is **device
  chrome, not UI** - do not implement it; the real OS inset comes from safe-area-context.

**WARNING - approved mocks show 4 tabs (Home | Map | Services | Profile) but the A5 target is 3 tabs
(Home | Map | Profile).** The "Services" quick-grid tab has **no route and must NOT be invented.**
A5.2 implements exactly Home / Map / Profile and does not add a Services placeholder.

Provisional corroboration: `docs/rebuild/new-ui/design-system/navigation.md` section 3 proposes
3 tabs Home/Map/Profile, icon+label, "active = deep blue + gold indicator dot, inactive muted", an
explicit accessibility rule "do not use color-only active state: icon+label+dot", and height
56-64 + bottom safe inset. **The gold dot is therefore required, not decorative.**

### Icons: use `react-native-svg`, traced 1:1 from the approved HTML
- `@expo/vector-icons` is **NOT installed** (`node_modules/@expo/vector-icons` is absent; SDK 57 `expo`
  does not pull it in) and `@expo/ui` exposes no `./icons` subpath - so Ionicons / MaterialIcons are
  unavailable without a package install, which A5.1 forbids and A5.2 should also avoid.
- `expo-symbols` `SymbolView` is **iOS-only** (already used in `register.tsx`, `email-otp.tsx`,
  `AuthBrandHeader.tsx`, `CountrySelectorModal.tsx`, `ui/collapsible.tsx`) so it must not be the only
  icon source; Android needs real vectors.
- The established project pattern is `react-native-svg` (15.15.4, installed), e.g.
  `src/components/vehicle-details/icons.tsx` - whose own header says the icons are "traced 1:1 from
  the approved `approve-ui/VehiclesDetails/code.html` SVGs" - plus `components/map/MapControls.tsx`,
  `components/home/ViewMap.tsx`, `components/auth/AuthBrandHeader.tsx`.
=> In A5.2, trace the three tab icons 1:1 from `approve-ui/home/code.html:416-441`:
Home = solid house path, Map = Heroicons folded-map stroke-2 path, Profile = Material solid person
path (`M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z`).
Do NOT copy legacy's `react-native-vector-icons ^10.3.0`.

### Colours: theme tokens only, no hardcoded brand hexes
`src/theme/colors.ts` already carries every value the approved mocks use, so no new tokens are
needed and no hex may be hardcoded in the layout:
| Approved mock | Existing token |
|---|---|
| bar background `bg-white/95` | `colors.surface` `#FFFFFF` |
| top border `border-slate-200` | `colors.border` `#E2E8F0` |
| active icon + label `yamakNavy` `#0B2A4A` | `colors.navyDeep` `#0B2A4A` |
| active gold dot `#E9A319` | `colors.wordmark` `#E9A319` |
| inactive `text-slate-400` | `colors.subtitle` `#64748B` (closest existing token) |
Reported mismatch to be aware of: the A5.1 brief mentioned brand gold `#EEB247` and near-black
`#030303`; neither appears in any approved design file or in `src/theme/colors.ts`. Use the existing
tokens above rather than introducing the brief's hexes.

### Legacy bottom tabs (`yamak-mobile`, read-only reference)
`src/navigations/TabNavigator.tsx`: `createBottomTabNavigator`, three screens in order
`Home_Stack` (`HomeStackNAvigator`), `Map` (`MapScreen`, no nested stack), `Profile_Stack`
(`ProfileStack`). `headerShown: false`, **`tabBarShowLabel: false`** (labels hidden),
`tabBarInactiveTintColor: white (#fff)`,
`tabBarActiveTintColor: AppColorsTheme2.secondary (#F7B123)`,
`tabBarStyle.backgroundColor: AppColorsTheme2.primary (#002F6C)`. Icons are plain
`AppIcon type='Ionicons'`: `home-outline`, `map`, `person`. There is **no custom `tabBarIcon`
component, no custom `tabBar`, and no raised centre button** - Map is simply the 2nd of 3 (the centre
position). No `initialRouteName`, so Home is the default first screen.
Legacy drawer (`DrawerNavigator.tsx`) siblings were `Home` (-> TabNavigator), `Profile` (bare
`ProfileScreen`), `Favorites`, `messages`.
**Intended divergence:** the new bar follows the APPROVED white/label design, not legacy's navy/no-label
design. The approved design outranks legacy here.

### Special routes / future hidden tabs
`Tabs.Screen options={{ href: null }}` (mapped by `TabsClient.js` to
`tabBarItemStyle: { display: 'none' }` plus a null `tabBarButton`) is only needed for a FUTURE file
added inside `(tabs)` that must stay hidden. It is **not** needed for `vehicle/[id]`, which is
outside the group. Do not add it now.

### Dead `create-expo-app` scaffold - NOT part of A5, do not fix here
`src/components/app-tabs.web.tsx` and `src/components/app-tabs.tsx` are unused starter leftovers.
A repo-wide grep shows `AppTabs` / `app-tabs` is imported by **nothing**; the only other references
are documentation: `PROJECT_CONTEXT.md:88` (listed as a `create-expo-app` leftover) and
`docs/rebuild/11-rebuild-backlog.md:184-185` (HS-001 remove `app-tabs*` scaffold leftovers; HS-002
remove the pre-existing `app-tabs.web.tsx(27,38)` `"/explore"` TS2322 error, deliberately not fixed).
`app-tabs.web.tsx` is a plain `create-expo-app` demo (`expo-router/ui` `Tabs/TabList/TabTrigger/
TabSlot`, `SymbolView`, literal "Expo Starter" text, `href="/explore"` on line 27, `href="/"` on
line 24); `app-tabs.tsx` is an `unstable-native-tabs` `NativeTabs` demo with only `index`/`explore`
triggers and `assets/images/tabIcons/` starter PNGs (only `home` and `explore` exist).
**`(tabs)/_layout.tsx` is completely independent of both files.** Baseline TS error to re-report
verbatim and NOT fix in A5:
`src/components/app-tabs.web.tsx(27,38) - error TS2322: Type '"/explore"' is not assignable...`

### Dependencies - nothing to install
Verified present in `package.json` / `app.json` / `app.config.ts`: `expo-router ~57.0.23`,
`react-native-screens ~4.26.0`, `react-native-safe-area-context ~5.7.0`,
`react-native-gesture-handler`, `react-native-reanimated 4.5.1`, `react-native-svg 15.15.4`,
`react-native-maps 1.28.2`, `expo-symbols`, `@expo/ui ~57.0.20`;
`experiments.typedRoutes: true`, `reactCompiler: true`. `@react-navigation/bottom-tabs` is bundled
inside `expo-router/build/react-navigation/bottom-tabs/`, so it needs no separate install either.
**A5.2 requires zero new packages.**

### Scope boundaries (A5 vs A6 vs A7)
- A5 = SHELL-009 = bottom tabs ONLY: create `src/app/(app)/(tabs)/_layout.tsx`, wire the existing
  three screens, apply the approved bar. Confirmed by
  `docs/rebuild/REBUILD-PLAN.md:181-183, 247-254`, `docs/rebuild/12-rebuild-order.md:51-53`,
  `docs/rebuild/13-SCREEN-BY-SCREEN-REBUILD-PLAN.md:944-946`,
  `docs/rebuild/11-rebuild-backlog.md:74-78` (SHELL-009 A5 tabs, SHELL-004 A6 onboarding,
  SHELL-008 A7 conditional drawer).
- A6 = onboarding. A7 = drawer, conditional on a Profile entry point existing later.
  **Both explicitly EXCLUDED from A5 - no Onboarding, no Drawer, no future Profile screens.**
- A5 must not change Home / Map / Profile behaviour, must not touch the backend, and must not add
  nested stacks inside tabs (legacy's `Home_Stack` / `Profile_Stack` are NOT to be reproduced - the
  approved design shows 3 flat tabs).
- `docs/rebuild/approve-ui/profile/APPROVED-PROFILE-SPEC.md:7` records "no tabs/_layout (A5 owns)" -
  A5 owns the navigator but must not change Profile's approved behaviour.
- Do NOT add `(tabs)/index.tsx`: A3 already rejected it because it would collide with
  `src/app/index.tsx` on `/`.

### Risks / unknowns carried into A5.2
- Tab ORDER is the single highest-risk item: it depends on explicit `<Tabs.Screen>` declarations
  because of the length-based `sortRoutes` comparator. Missing them silently yields Map-first order.
- Android Back behaviour and tab state retention are inferred from installed library source, not yet
  observed on a device; confirm in the A5.2 runtime pass.
- The double `insets.bottom` on `home.tsx` / `map.tsx` is a cosmetic risk that will only be visible
  once the bar exists.
- The approved mocks' 4th "Services" tab is an unresolved design/source-of-truth conflict; A5 must
  implement 3 tabs and the discrepancy is recorded, not silently resolved.

### Status
- Analysis only. No `src/` file created or modified, no package installed, no native build / Expo /
  Metro / tsc run, no backend change, no `yamak-mobile` change, nothing committed.
- Only `PROJECT_CONTEXT.md` changed.
- Commit = NOT YET. Next approved step = **A5.2 Bottom Tabs Implementation**.

## PHASE A - A5.2 BOTTOM TABS IMPLEMENTATION (implementation, 2026-10-03)

**Verdict: A5.2 BOTTOM TABS PASS.** Exactly two files created, both new:
`src/app/(app)/(tabs)/_layout.tsx` and `src/components/navigation/TabIcons.tsx`.
No existing file was modified, no package was installed, no backend change, no native
rebuild, nothing committed.

### Layout file + Tabs import path
- File = `src/app/(app)/(tabs)/_layout.tsx`.
- Import = `import { Tabs } from 'expo-router/js-tabs'` (the non-deprecated spelling for the
  installed `expo-router@57.0.23`; `exports.d.ts:42` marks the root `expo-router` `Tabs`
  export `@deprecated Use 'import { Tabs } from 'expo-router/js-tabs' instead.`). This resolves
  the open A5.1 import-path question.
- **No `NavigationContainer`, no `createBottomTabNavigator`, no manual React Navigation root.**
  The file is navigator configuration only, consistent with `docs/rebuild/EXPO-MIGRATION.md:37`
  and `docs/rebuild/03-navigation-map.md:265-273`.
- `src/app/(app)/_layout.tsx` was **not** touched: its `<Slot />` now has exactly two children
  (`(tabs)` and `vehicle/[id]`).

### Visible order and initial route
- Explicit `<Tabs.Screen>` declarations, in order: `home`, `map`, `profile`.
- `initialRouteName="home"` set explicitly.
- `headerShown: false` kept.
- **This is what defeats the `sortRoutes` length comparator** recorded in A5.1
  (`return a.route.length - b.route.length;`, which would otherwise yield Map -> Home ->
  Profile). Runtime confirmed Home | Map | Profile.
- `AUTHENTICATED_ENTRY_ROUTE` **unchanged** = `/home`. No file moved or renamed, so `/home`,
  `/map`, `/profile` kept their existing hrefs.
- No `index.tsx`, no Services tab, no placeholder/hidden tabs.

### Icons implementation
- `src/components/navigation/TabIcons.tsx` (new, `react-native-svg`, the established project
  pattern - mirrors `src/components/vehicle-details/icons.tsx`). **Zero packages installed**;
  `@expo/vector-icons` remains absent and was not needed.
- Three glyphs traced 1:1 from `docs/rebuild/approve-ui/home/code.html:416-441`:
  Home = solid house `M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z`; Map = Heroicons folded-map
  `fill="none" stroke-width="2"` round-cap/join outline; Profile = Material solid person
  `M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z`.
- All three 20x20 (`w-5 h-5`), `viewBox 0 0 24 24`, tinted from the navigator so icon and label
  can never disagree.
- The icon column is `accessibilityElementsHidden` + `importantForAccessibility="no-hide-descendants"`,
  so the glyph and the dot never pollute the tab's accessible name.

### Active-state treatment
- Active: `colors.navyDeep` (#0B2A4A) icon + navy **bold** label + a 6px `colors.wordmark`
  (#E9A319) gold dot above the icon. Inactive: `colors.subtitle` (#64748B) icon + slate
  **medium** label, no dot.
- Only `colors.*` tokens are used; no hardcoded brand hex. The single colour source is
  `tabBarActiveTintColor` / `tabBarInactiveTintColor`, which feeds icon, dot slot and label.
- Label rendered through a `tabBarLabel` **function** (11px) because a static `tabBarLabelStyle`
  cannot vary font weight with focus.
- **Alignment is structural, not padded**: the dot slot is always 6px tall and only its *content*
  is conditional, so active and inactive tabs sit on identical baselines. The approved mock instead
  pads inactive tabs with `pt-2.5` (`home/code.html:423,430,437`), which visibly shifts inactive
  icons and labels out of line; that padding was deliberately not copied.
- Verified by pixel probe: active dot `#E9A319`, active icon/label `#0B2A4A`, inactive `#64748B`,
  inactive slots pure `#FFFFFF`.
- **Not colour-only.** On-device accessibility dump: each tab is `clickable="true"`,
  `focusable="true"`, `content-desc="Home"/"Map"/"Profile"`, and `selected="true"` on the focused
  tab only. Touch targets 360x128px = 137x49dp each, well over the 48dp minimum.

### Safe-area behaviour
- **No numeric `height` in `tabBarStyle`** - `minHeight: 58` is used instead, so
  `getTabBarHeight` still returns `TABBAR_HEIGHT_UIKIT + insets.bottom` and the bottom inset is
  never suppressed. 58 sits inside the 56-64 range of
  `docs/rebuild/new-ui/design-system/navigation.md` section 3.
- Measured on a 1080x2400 @ 420dpi emulator: bar top border at y=2207, bar spans 2209-2400 =
  191px = **58dp content + ~15dp bottom inset**. Label line box bottom + 5dp item padding + 15dp
  inset lands exactly on 2400. No clipping, no double-counted inset.
- `tabBarLabelPosition: 'below-icon'` pinned so a landscape phone cannot silently switch to
  side-by-side labels and break the approved vertical layout.
- Shadow uses the app-wide idiom already present in `map.tsx` / `vehicle/[id]` styles
  (`elevation 4`, offset 0/2, opacity 0.15, radius 4) with `colors.navy` as the shadow colour
  instead of introducing another hardcoded `#0C1E34`.

### Vehicle Details behaviour (structural, no hacks)
- `src/app/(app)/vehicle/[id].tsx` **stayed in `(app)`, outside `(tabs)`**. No `href: null`, no
  `display: 'none'`, no conditional `tabBarStyle`.
- Runtime: Home -> vehicle -> `/vehicle/[id]` shows **no tab bar at all** (the details screen owns
  the full height; the tab slot positions show the details screen's own emerald/navy content, not
  a white bar). Back returns to **Home** with the tab bar and Home's gold dot restored. No auth loop.

### Android Back result (device-verified)
- Back on **Profile** -> **Home** tab.
- Back on **Map** -> **Home** tab.
- Back on **Home** -> app **backgrounds** (`topResumedActivity` returned to the previous app;
  `com.yamak.assist` process still alive, pid 5555).
- Default `backBehavior: 'firstRoute'` was **kept**; `backBehavior` was not customised.

### State preservation result
- Home -> Map -> Home: **exact** retention. Home's scroll offset was identical before and after the
  round-trip (marker chip y=234, "Vehicles Nearby" y=1001, "Nearby on radar" y=1504, "Recovery units
  ready" y=2029). No remount, no refetch, no skeleton flash.
- `lazy`, `detachInactiveScreens`, `freezeOnBlur`, `backBehavior` were all left at library
  defaults. **No caching or state hoisting was added.**
- Deviation recorded, not fixed: Home's `ScrollView` offset **does** reset after a push to
  `/vehicle/[id]` and Back (react-native-screens detaches/reattaches the native view). This is
  **not** a remount - data is intact and tab-switch retention is exact - so, per the brief
  ("do not change screens to force state retention unless actual remount is observed"), nothing
  was changed.

### BOTTOM INSET ADJUSTMENT: NOT REQUIRED
- Measured rather than guessed. Home has **no** bottom gap at all (content runs flush to the bar).
- Map's footer (`map.tsx:391` `minHeight: 120`, approved 6B design) shows a white band, but the
  duplicate `insets.bottom` contributes only a ~20px (7.6dp) upward shift of the chip row, not
  excessive whitespace; the band itself is the pre-existing approved footer `minHeight`, which is
  out of A5.2 scope.
- **`home.tsx` and `map.tsx` were therefore left completely untouched.**

### Scaffold app-tabs status
- `src/components/app-tabs.tsx` and `src/components/app-tabs.web.tsx` were **not touched**
  (`git diff --stat` on both = empty). They are independent of the real `(tabs)/_layout.tsx` and
  nothing in A5.2 proved they interfere. **The known baseline error remains, unfixed and verbatim:**
  `src/components/app-tabs.web.tsx(27,38): error TS2322: Type '"/explore"' is not assignable...`
  (HS-002 in `docs/rebuild/11-rebuild-backlog.md`).

### TypeScript result
- `npx tsc --noEmit` -> **exactly one** error, the known baseline above.
  **New errors from A5.2 = 0.**

### Runtime result (Android emulator-5554, `com.yamak.assist` Development Build + Metro, no native rebuild)
- CASE 1 cold authenticated launch -> **Home** selected, tab bar visible: PASS (re-confirmed at the
  end of the session).
- CASE 2 visible order Home | Map | Profile: PASS - a11y bounds Home `[0,2209][360,2337]`,
  Map `[360,2209][720,2337]`, Profile `[720,2209][1080,2337]`.
- CASE 3/4/5 active states on Home / Map / Profile: PASS (gold dot + navy on the focused tab;
  slate on the other two; all three screens functioned).
- CASE 6 Home -> Map -> Home state preserved: PASS.
- CASE 7 Map local state: **PARTIAL** - tab-switch retention is proven by CASE 6, but the
  `mapType` / `traffic` controls could not be exercised: Map's own `useServices()` stayed in its
  loading skeleton throughout the session, so no service was selectable and no map control state
  existed to retain.
- CASE 8 Home -> vehicle -> Details -> Back: PASS (tab bar absent, then restored on Home).
- CASE 9 Map marker -> Details: **NOT EXERCISED** - same cause as CASE 7 (no service selected, no
  vehicle markers rendered, so there was no marker to tap). A gold blob near (984,216) was probed
  and proved to be a Google POI icon, not a vehicle marker. The tab-bar-absence mechanism itself is
  structural and was verified from Home in CASE 8.
- CASE 10 Android Back: PASS (all three behaviours above).
- CASE 11 Logout -> Register, tabs disappear: PASS (Register navy `#0C1C33` at all three tab slots,
  no labels).
- CASE 12 cold restart after logout: PASS - sampled at ~4s (Expo splash `#208AEF`), ~10s (black
  transition), ~18s (Register). **No tab bar and no tab flash at any stage.**
- CASE 13 unauthenticated deep links `yamakexponew://home`, `://map`, `://profile`: PASS - all three
  stayed on Register via the A1 gate, no tab bar, no auth loop.
- CASE 14 exactly three tabs, no Services/Explore/duplicate: PASS.
- CASE 15 bottom safe area, no clipping, no excessive gap: PASS.
- `logcat` across the session: no JS errors, no invariant violations, no unhandled rejections. The
  only LogBox item was dev-client noise ("Cannot connect to Expo CLI", `10.0.2.2:8081`) from a
  relaunch, not application code.
- Method note: `uiautomator dump` could not reach idle on Home (the Adds carousel animates), so
  screen identity came from `screencap` + Windows OCR + pixel probes; the a11y dump succeeded on
  Profile, which has no carousel, and that is where the tab semantics above were verified.
- The emulator's `SecureStore.xml` was backed up before the logout cases and **restored
  byte-for-byte** afterwards, so the emulator is back in its original authenticated state.

### Design comparison against the approved references
Checked against `approve-ui/home/code.html:409-444` and `approve-ui/map/code.html:334-362`:
3 tabs only, active navy, inactive slate, gold dot, icon + label, white/surface bar,
slate-200 top border, subtle lift, safe area - **all matched**. No new Tabs design was invented.
Intentional divergences recorded:
- The mocks show a 4th **Services** tab; it has no route and was **not** implemented (current
  approved functional target is exactly Home | Map | Profile).
- Icons are the `home/code.html` set (one consistent nav block). The `map/code.html` mock draws
  different, more decorative variants of the same glyphs.
- `bg-white/95 backdrop-blur-md` is approximated with an opaque `colors.surface`; the bar sits on
  opaque content in practice, so blur is not observable.
- No iOS home-indicator pill was drawn (`home/code.html:445-449` is device chrome, not UI).
- RTL: not exercisable - the project has no i18n/RTL locale wired up. No `row-reverse` or other
  direction-specific code was added; the order is declared in markup, so a locale flip would mirror
  the row without changing the route mapping.

### Scope discipline
- **No A6 (onboarding). No A7 (drawer).** No Edit Profile, My Cars, Favorites or Notifications.
- No Home / Map / Profile redesign or behaviour change; no Vehicle Details change; no backend change.
- No dependency install; no native rebuild; no prebuild; no migration; no `yamak-mobile` change.

### Hygiene
- `git diff --check` -> clean, exit 0.
- `git status --short` -> `?? src/app/(app)/(tabs)/_layout.tsx`, `?? src/components/navigation/`
  (two new files only; no tracked file modified).
- HEAD = `e3cce21 docs: record bottom tabs analysis` (unchanged).

### Status
- **Commit = NOT YET.** Next approved step = **A5 final review / acceptance**.


### PHASE A — A6.1 FIRST-LAUNCH ONBOARDING ANALYSIS (summary)
- Analysis complete (read-only). Legacy: AsyncStorage key 'isLunched', in-memory 'isFirstLunch', onboarding in DrawerStackNavigator after auth, 4 slides (selectServiceYouNeed/ViewNearbyCars/CallUsForHelp/WeWillReachYouAnyPlace), assets undraw1-4.png. Expo: SecureStore only for auth; no general storage. Recommend gate in (app)/_layout.tsx, route /onboarding in (app), use SecureStore for flag 'yamak_onboarding_completed', both Skip/Get Started mark complete, global per install. No product code changed. Commit = NOT YET. Next = A6.2.



## PHASE A — A6.2 FIRST-LAUNCH ONBOARDING IMPLEMENTATION (summary)
- Implemented onboarding: storage src/onboarding/onboarding-storage.ts (key 'yamak_onboarding_completed', uses SecureStore, missing->false, write sets 'true'); context src/onboarding/onboarding-context.tsx with status loading/required/completed, completeOnboarding persists then sets completed; provider integrated in (app)/_layout.tsx. Route /onboarding created at src/app/(app)/onboarding.tsx (outside tabs) with 4 slides using FlatList/ScrollView paging (no new deps), verified content from legacy (selectServiceYouNeed/ViewNearbyCars/CallUsForHelp/WeWillReachYouAnyPlace), copied assets to ssets/images/onboarding/ (undraw1-4). Gate rules: auth first, then onboarding - redirects authenticated+incomplete to /onboarding (including /map,/profile,/vehicle/*), redirects completed from /onboarding to /home. Both Skip and Get Started persist completion before navigate. Intentional difference: do not write flag on view/open (only on explicit Skip/Get Started). Storage read failure → required; write failure prevents navigation. No Drawer/backend/lang picker changes. TypeScript: only pre-existing pp-tabs.web.tsx error remains (unrelated). No product code deps added. Design status: legacy-based, needs A6.3 review. Commit = NOT YET. Next = A6.3.


## PHASE A - A6.2E BACKEND-MANAGED REMOTE ONBOARDING (summary) - runtime-verified on isolated backend
- Decision contract: GET /api/mobile/v1/onboarding (public; api_mobile.php line 52; Api/Mobile/OnboardingController@show) returns envelope {success,message,data,errors:null} via Response::macro('success'); disabled = data {enabled:false} only; active keys = enabled/version/skippable/slides[] where slides = {id,order,title,description,imageUrl}.
- API layer: src/api/onboarding.ts (getOnboarding + types) exported from src/api/index.ts. No AsyncStorage; no persistent remote-config cache.
- Storage: SecureStore key 'yamak_onboarding_seen_version' via src/onboarding/onboarding-storage.ts. Read failure -> null (unseen). Write is the only write and throws on failure. Obsolete 'yamak_onboarding_completed' is never read, migrated, or deleted - documented inert.
- Gate (src/app/(app)/_layout.tsx): auth first, then onboarding decision; OnboardingProvider fetches at startup only (no polling). seen null or < backend version -> required (/onboarding); >= -> not-required; enabled=false -> not-required (seen untouched); invalid config (null/<=0/non-integer version, enabled with 0 slides, malformed body, network/timeout/HTTP error) -> fail-open not-required, never marks seen. Deep links (/map, /profile, /vehicle/*) redirect to /onboarding while unseen; direct /onboarding redirects to /home when not required.
- Screen (src/app/(app)/onboarding.tsx): renders backend slides; Skip only when skippable and not on final slide; Get Started on final slide; Skip and Get Started share completeOnboarding() (write seen FIRST, then router.replace('/home'); write failure keeps user on onboarding). Missing/null/failed imageUrl -> YAMAK placeholder fallback. Copied assets/images/onboarding/* deleted (unused).
- Runtime verification (18-case matrix; Expo Go emulator + isolated temp-SQLite backend 127.0.0.1:8127, APP_ENV=testing; app .env repointed to http://10.0.2.2:8127/api/mobile/v1/ during tests, restored afterwards):
  - Runtime PASS (screen + JS trace): fresh user + disabled -> Home; v1 active + seen missing -> Onboarding (slides/image/Skip/Next); Get Started -> seen=1 -> Home; cold restart seen=1=v1 -> Home; v2 active (1<2) -> Onboarding; Skip -> seen=2 -> Home; v2 disabled -> v1 served, seen 2>=1 -> Home; v2 re-enabled (2==2) -> Home; v3 skippable=false -> Onboarding with NO Skip (3 slides; Get Started on final) -> seen=3 -> Home; v2 older served, seen 3>=2 -> Home; backend STOPPED -> fail-open Home (network-error trace); malformed stub {enabled:true,version:null} -> fail-open Home; deep links /map, /profile, /vehicle/3 while unseen -> Onboarding; direct /onboarding while completed -> Home; dead remote image -> YAMAK fallback; logout (Profile Logout) then fresh register WITHOUT SecureStore wipe -> Home immediately (seen retained and honored).
  - Code-verified (runtime not feasible): SecureStore READ failure -> unseen (required); SecureStore WRITE failure -> stay on onboarding (write-before-navigate; rethrow -> screen stays).
  - TypeScript: only the pre-existing app-tabs.web.tsx '/explore' error remains.
- Observations (non-blocking): (1) OnboardingProvider can mount twice at startup -> duplicate idempotent GET (both navigations resolve to the same decision; candidates: email-otp replace + index redirect). (2) Expo Go SDK 57 on the emulator wedges the a11y/UI surface whenever the Home tab (location + radar preview) is foreground (uiautomator idle errors / stale dumps); decision flow still verifiable via JS trace and dev-menu Reload. (3) Expo Go experience-permission propagation dialog loops after ALLOW/DENY (Expo Go bug); worked around by temporarily disabling requestLocation at 3 call sites during tests, then fully reverted (files clean in git diff).
- Supersedes A6.2 local-flag implementation: new remote-driven flow replaces 'yamak_onboarding_completed' and the 4 copied legacy slides; obsolete key deliberately inert; assets/images/onboarding/ removed. Backend/Dashboard/Legacy untouched (isolated DB only). Commit = NOT YET. Next = A6.3 (pending approval). [NOTE: A6.2E was later committed by the user as e172eb6; tree is clean.]

## PHASE A - A6.3 ONBOARDING DESIGN REVIEW (design review only, 2026-10-07)

**Verdict: A6.3 ONBOARDING DESIGN REVIEW PASS.** Read-only review + docs only: `docs/rebuild/approve-ui/onboarding/APPROVED-ONBOARDING-SPEC.md` (spec) and `docs/rebuild/approve-ui/onboarding/code.html` (companion design-sample mock, following the approve-ui `code.html` convention). No TS/TSX product code changed; no Backend/Dashboard/Legacy change; no functional behavior change (A6.2E contract intact); no commit. Next approved step = A6.4 (pending approval).

### Verified design decisions
- **Selected direction (ONE): "Light Editorial Onboarding"** — approved app surface `#F8FAFC` (colors.phonePrefix, same as Vehicle Details), small top-center YAMAK wordmark (option A; subtle, navyDeep + gold accent, no logo hero), fixed rounded image plate (`radius.lg`, hairline border, `contain`, ratio height `min(300, 0.34*h)`), centered title (24/32 bold, colors.title) + description (15/22, colors.subtitle) inside a vertically scrollable text region, compact 8dp dots with active navy 24x8 pill (scrollable row when >9 slides), subdued text Skip + filled approved-navy CTA (`navyDeep #0B2A4A` / pressed `navyDeepDark`, `radius.md`, `minHeight 52`, `typography.buttonLabel` — the SAME button system as Vehicle Details `primaryButton` / Home "Explore Map"), full-width Get Started on final slide, bottom safe-area inset. Legacy per-slide background tinting rejected (busy, not approved).
- **CTA colour change:** current onboarding buttons use `colors.primary #15406F` (unapproved new-ui brand-700); spec moves them to the approved `navyDeep` CTA family to end the third-button-system on this screen. No other screen touched.
- **Spec file:** `docs/rebuild/approve-ui/onboarding/APPROVED-ONBOARDING-SPEC.md` (19 sections: purpose, functional constraints, anatomy, layout, colors-by-token, typography, image area, progress, buttons, skippable, final-slide, RTL, long-content, missing-image, loading/completion, accessibility, exact KEEP/POLISH/CHANGE table, non-goals, A6.4 checklist).
- **Mock:** `docs/rebuild/approve-ui/onboarding/code.html` — self-contained, two phone variants (non-final Skip+Next and final Get Started + missing-image fallback), explicitly labeled DESIGN SAMPLE; backend remains authoritative; business-model guardrails printed in the mock and spec.
- **Business-model alignment:** slide copy is backend-owned, so alignment is enforced downstream by the spec's content guardrails (no pricing/commission/payment claims, no guarantees, no "Yamak drivers", no marketplace ownership). Mobile-side static labels ("Skip"/"Next"/"Get Started" + YAMAK placeholder) contain no claims. Mock copy is sample-only and labeled.
- **RTL:** centered layout + declarative action-row order mirror automatically (A5.2 principle); no directional glyphs; Arabic slide text uses system shaping; no `textAlign` forcing; wordmark may use `writingDirection: 'rtl'` like AuthBrandHeader. Labels stay English (no localization system — non-goal).
- **Dynamic-content constraints (verified from backend read-only):** `title_en` max 255; `description_en/ar` nullable TEXT (unbounded); `image` nullable URL; `slides min:1`, no max. Spec handles 1..N slides, 255-char titles, unbounded multi-paragraph descriptions, portrait/landscape art, null description, missing/broken image, small screens.
- **Two real resilience gaps found and specced for A6.4 (not fixed now):** (1) null `description` (backend maps nullable `description_en`; dashboard validation allows omitted) crashes current render at `slide.description.length` — A6.4 guards `String(desc ?? '')`; (2) unbounded description can push CTA off-screen — A6.4 moves text into a per-slide vertical scroll region with the footer pinned; (3) >9 slides overflow the fixed dot row — A6.4 uses a scrollable dot row with auto-scroll (no pager dep).
- **Safe-area gap found:** onboarding is the only full screen without inset handling (no SafeAreaView / useSafeAreaInsets) — spec requires top inset + bottom footer inset in A6.4.
- **A6.4 plan (from spec checklist):** A6.4.1 layout/safe-area/background; A6.4.2 remote image presentation + fallback/loading; A6.4.3 typography/content resilience (null-desc guard, scroll region); A6.4.4 progress/actions polish (dots, skip removal, navy CTA); A6.4.5 RTL + small-screen + a11y verification; A6.4.6 final runtime verification (targeted A6.2E subset on an isolated backend) + tsc/git hygiene.
- **No functional behavior changed; backend content remains authoritative; A6.3 did NOT start A6.4/A7. Commit = NOT YET.**

## PHASE A - A6.4 ONBOARDING APPROVED-UI IMPLEMENTATION (runtime-verified on isolated backend, 2026-10-07)

**Verdict: A6.4 ONBOARDING APPROVED-UI IMPLEMENTATION PASS.** Single product file changed: `src/app/(app)/onboarding.tsx` (rewritten visual implementation per APPROVED-ONBOARDING-SPEC.md; 311 insertions / 136 deletions). No Backend/Dashboard/Legacy/theme change; no package install; no migration; no commit. Next = A6 Final verification. Behavior contract (A6.2E backend-managed, versioned, seen-version storage, backend skippable, fail-open, inside (app) after auth, backend authoritative) verified unchanged.

### Implementation (all spec sections, verified in file)
- Module constants: `CONTENT_WIDTH = SCREEN_WIDTH - spacing.lg*2`, `PLATE_HEIGHT = Math.min(300, round(SCREEN_HEIGHT*0.34))`, `MAX_INLINE_DOTS = 9`, `DOTS_STEP = 30`.
- Safe-area (spec §4 gap fixed): top `paddingTop = max(insets.top, spacing.md)`; footer `paddingBottom = spacing.lg + insets.bottom`; no hardcoded device padding.
- `colors.phonePrefix` background; subtle brand row `YAMAK · يمك` (navyDeep + wordmark, `writingDirection: 'rtl'` on Arabic, same pattern as AuthBrandHeader, never a hero).
- `SlideImage`: missing/empty URL or failed load -> navy `navyDeep` fallback plate with white `YAMAK`; valid URL -> white framed plate (`radius.lg`, hairline `colors.border`, `contain`, `maxWidth 400`) with `ActivityIndicator` while loading; `onLoad`/`onError` state machine.
- Null-description fix (spec §13): `slide.description?.trim() ?? ''` before render; description Text omitted when empty (no empty gap).
- Per-slide vertical ScrollView text region (`flex:1`, `nestedScrollEnabled`, content `flexGrow:1` + centered) so unbounded copy scrolls while the footer stays pinned.
- `ProgressDots`: 8dp idle dots (`colors.border`), active navy 24x8 pill (`radius 999`), row hidden from screen reader; `>9` slides -> horizontal ScrollView row with auto-scroll (`activeIndex*DOTS_STEP - (CONTENT_WIDTH-DOTS_STEP)/2`), no pager dependency.
- Actions: Skip only when `skippable && !isLastSlide` (no 60px spacer, `flex:1` fills row when Skip absent); Next rows constrained; full-width Get Started on final; Skip/Next/Get Started all go through one `handleComplete` -> `completeOnboarding()` BEFORE `router.replace('/home' as never)`; completing state disables buttons (`disabled` + `busy`), label "Loading…", and no double-complete.
- a11y: `accessibilityRole="button"` + disabled state on all actions; hidden dots row; off-screen `accessibilityLiveRegion="polite"` "Slide n of N" in the footer; `handleScroll` keeps index synced via `onMomentumScrollEnd`; defensive `sort((a,b)=>a.order-b.order)` kept.

### Bug caught by runtime verification (fixed in same step)
- `handleNext` initially only set `currentIndex` without scrolling the pager (regression vs A6.2E which scrolled). Detected on-device (tap Next did not advance the slide); fixed by adding `pagerRef` -> `scrollTo({ x: next * CONTENT_WIDTH, animated: true })`. Re-verified on-device after fix.

### Runtime verification (isolated temp-SQLite backend 127.0.0.1:8127, APP_ENV=testing, app `.env` repointed to http://10.0.2.2:8127/api/mobile/v1/ then restored from backup; Expo Go emulator; uiautomator a11y-dump + pixel probes since screenshots not viewable)
- Pass A (3 slides + skippable): brand row YAMAK·يمك centered; background #F8FAFC everywhere; slide 1 (null description + missing image) renders title only, no crash, navy fallback plate (0B2A4A) with white YAMAK glyph; long multi-paragraph description on slide 2 inside scrollable text region; slide 3 live local image loads (spinner->ready) shown contained inside the white framed plate with hairline border; Skip (text, subdued) + Next (navy, minHeight 52) on non-final slides; full-width navy Get Started on final; dots row at 8dp.
- Pass B (1 slide): single Get Started full-width [42,2159][1038,2295], no Skip/Next, no broken pager.
- Pass C (10 slides): dots stay on-screen; active pill (#0B2A4A 24x8) + grey idle dots (#E2E8F0 8dp) observed; pill tracks index across swipes; footer stays Skip+Next until final, then full-width Get Started with no Skip.
- Pass D (3 slides, skippable=false): only Next rendered, full-width navy (flex:1), Skip never appears even on slide 1.
- Dead image URL (pass A slide 2): load fails fast -> navy fallback plate, no infinite spinner.
- Buttons: Next tap scrolls pager (post-fix); Get Started tap completes -> API log shows /onboarding then /services,/adds,/vehicles fetch = Home mount (local-only SecureStore session; navigation regression PASS).
- Fail-open regression: active onboarding disabled -> app logs /onboarding then Home endpoints; no onboarding screen, no crash.
- Same-seen-version regression: seeded version 3 while app storage already had seen>=3 (from A6.2E) -> app went straight to Home (verified via API log + screen probe).
- Small screen (wm size 720x1280 @320): plate scales down (bounded, ~29% of height), brand centered, title visible, CTA above bottom inset, footer stable, safe-area intact.
- RTL/Arabic: Expo Go does not pick up emulator `system_locales` change for Accept-Language (Expo Go sends its own locale), so device-level RTL flip was NOT exercised; verified instead via (a) byte-accurate Arabic payload served by backend for `Accept-Language: ar` (titles "تجريبي عربي · عنصر N", descriptions), (b) Arabic glyph rendering on-device (يمك brand), and (c) declaratively RTL-safe layout (centered text, no directional glyphs/chevrons, row order mirrors automatically). Device-locale/animations/display settings restored afterwards.
- TypeScript: `npx tsc --noEmit` -> only the pre-existing `src/components/app-tabs.web.tsx(27,38)` `/explore` route error; no new A6.4 errors.
- `git diff --check` clean (only LF->CRLF informational warning); `git status --short` = `M src/app/(app)/onboarding.tsx` only; Backend/Dashboard/Legacy untouched (isolated DB only). `.env` restored to `http://192.168.8.125:8000/api/mobile/v1/`. Temp seed/rig under D:\OpenCodeTemp\opencode\a64 (outside repo; servers stopped). Emulator SecureStore seen-version = 99 (from test completion) remains in Expo Go sandbox only, not in code.
- Commit = NOT YET. Next = A6 Final verification (A6.5/A6.6), then commit after user approval.

## PHASE A - A6.5 FINAL CROSS-SYSTEM ONBOARDING VERIFICATION (isolated temp backend, 2026-10-07)

**Verdict: A6.5 FINAL VERIFICATION PASS.** Full re-verification of the A6 gate matrix (CASES 1-16), content/visual matrix A-H, safe-area (+ smaller viewport), RTL (partial), a11y, completion safety, backend contract, dashboard->backend->mobile E2E (API-level), Home/A5 regression, typecheck. No code touched in this step (product file `src/app/(app)/onboarding.tsx` unchanged since A6.4); Backend/Dashboard/Legacy untouched; no commit. Next = A7 Drawer/Side Menu parity (commit still NOT YET, per standing instruction).

### Rig (isolated, process-only overrides; NO prod DB ever used)
- Fresh temp SQLite `D:\OpenCodeTemp\opencode\a65\a65.sqlite`; `APP_ENV=testing DB_CONNECTION=sqlite DB_DATABASE=<temp>` + `MAIL_MAILER=log` env overrides; `php artisan migrate --force` (migrations against temp DB only); backend `php artisan serve 127.0.0.1:8127`; image server `php -S 127.0.0.1:8128`; stub `php -S 127.0.0.1:8127 stub.php` for the malformed case; Metro 8081; app `.env` pointed at `http://10.0.2.2:8127/api/mobile/v1/` (backed up + restored byte-identical); Expo Go SDK 57 emulator; unauth clean state via `pm clear host.exp.exponent`; registration driven through the real UI (signup + DB-read OTP + verify); evidence = uiautomator dumps + PHP/GD pixel probes + backend request logs + curl contract checks.

### Gate matrix (all PASS)
- C1 unauth: Register; deep links /onboarding /home /map /profile /vehicle/1 all redirect to Register. PASS
- C2 auth + disabled -> Home (services/adds/vehicles fetch = Home mount; no onboarding UI). PASS
- C3 auth + active v1 + seen missing -> Onboarding shown. PASS
- C4 complete v1 (Get Started) -> seen=1 persisted, Home mount. PASS
- C5 true cold restart (force-stop) + v1 active -> straight Home (seen retained). PASS
- C6 activate v2 (10 slides) -> cold restart -> Onboarding (no Home fetch in log). PASS
- C7 Skip v2 -> seen=2, Home mount. PASS
- C8 disable v2 -> cold restart -> Home; seen unchanged (proven by C9). PASS
- C9 re-activate SAME v2 -> cold restart -> Home (seen=2 >= 2; proves disable did not reset seen). PASS
- C10 v3 skippable=false (1 slide) -> Onboarding with NO Skip (Get Started only); complete -> seen=3, Home. PASS
- C11 backend version older than seen (v2 < seen3) -> Home. PASS
- C12 backend down (connection refused) -> fail-open -> Home (no block, no auth redirect; auth restore is local SecureStore). PASS
- C13 malformed active payload (`{"enabled":true}` no version/slides, stub 8127) -> fail-open -> Home; no seen write. PASS
- C14 direct /onboarding deep link after completion -> Home. PASS
- C15 unseen deep links (/home /map /profile /vehicle/1 with v4 active, seen3<4) -> all land on Onboarding gating first. PASS
- C16 logout (confirm dialog) -> Register; new user registered on same device -> straight Home, onboarding does NOT repeat (seen=4 retained). PASS

### Content/visual matrix A-H (all PASS, pixel + a11y verified)
- A (1 slide): single slide, Get Started full-width [42,2159][1038,2295], no Skip/Next. PASS
- B (3 slides): brand YAMAK·يمك; bg #F8FAFC; navy fallback plate/white glyph; dots row y~2100 = navy active pill (#0B2A4A 24x8) + 2 idle dots (#E2E8F0 8dp); Skip+Next -> final Get Started. PASS
- C (10 slides): dots row scrolls with auto-scroll; active pill tracks index (left -> middle positions verified after Next taps and on slide 5); final slide Get Started, no Skip. PASS
- D (null description): slide renders title only, no gap, no crash. PASS
- E (long description): inside its own scroll region (swipe-up moves copy, footer/dots stay pinned). PASS
- F (long title ~120 chars): wraps across lines in centered text region, no clipping. PASS
- G (dead image URL): fast-fail -> navy fallback plate, no infinite spinner. PASS
- H (live image): loads -> contained in white framed plate (letterbox bands), no stuck spinner. PASS

### Safe area / small viewport / RTL / a11y / completion safety
- Safe area: own insets top (paddingTop=max(insets.top, md)) + bottom (lg+insets.bottom); verified no hardcoded padding at 1080x2400; bottom inset spacer below CTA. PASS
- Smaller viewport (720x1280 @240 = 480x853 DIP): plate scales down (bounded ~ min(300, ~29%H)), title/desc region fits, CTA fully on-screen above bottom inset, no overflow. PASS
- RTL: PARTIAL (declared): Expo Go sends its own Accept-Language, so no forced device flip; verified (a) byte-level Arabic payload (262/263 \u escapes in Arabic range; decoded title "اختبر الشبكة الأكثر موثوقية..."), (b) يمك brand renders on-device, (c) layout declaratively RTL-safe (centered, flex row mirrors, no directional glyphs).
- a11y: actions expose role button (android.widget.Button, clickable/enabled/focusable); Skip/Get Started labelled; dots non-focusable empty containers (not individually noisy); "Slide n of N" live-region Text present in code (approved A6.4 pattern) BUT off-window (left:-10000) so it is pruned from the uiautomator tree -> runtime announcement NOT provable without TalkBack: code-verified, partial runtime.
- Completion safety: write-before-navigate in completeOnboarding (persists seen FIRST, flips state after; throws on failed write so screen stays); isCompleting guard + disabled/busy state prevent duplicate completion; runtime: every completion (Get Started x3, Skip x1) wrote once and navigated once across the matrix. PASS (code + runtime).

### Backend contract (read-only; temp DB only) + dashboard E2E
- Enabled payload keys: data.enabled / version / skippable / slides[] with id / order / title / description / imageUrl (null when absent). Disabled payload: data.enabled=false only. Verified via curl on the isolated backend. PASS
- Dashboard E2E (API-level; no dashboard browser automation - state verified by API responses + mobile behavior): admin login -> create draft (version auto=4, slides with en/ar + image) -> publish -> activate -> mobile v4 shown to a seen=3 device; admin disable -> mobile contract {enabled:false} -> app Home. Write/read through the real admin API on the isolated backend. PASS (level: API, clearly stated)

### Home / A5 regression
- Tabs Home/Map/Profile render + navigate (active-tab icon moves; Map shows map tiles #F0EDE5; Profile shows user info + menu rows). Home itself verified via pixel probes + API logs (radar animation wedges uiautomator idle, known). PASS
- Vehicle details outside tabs: deep link /vehicle/1 -> "Vehicle details" header with Go back, NO tab bar, no onboarding; isolated empty temp DB made the vehicles endpoint 500 -> app showed graceful Retry state (no crash). PASS
- Logout: confirmation dialog -> Register screen (app hidden). PASS

### Typecheck / hygiene / cleanup
- `npx tsc --noEmit` -> ONLY pre-existing baseline `src/components/app-tabs.web.tsx(27,38)` "/explore" error; no new errors. PASS
- `git diff --check` clean (LF->CRLF info warnings only); `git status --short` = `M PROJECT_CONTEXT.md`, `M src/app/(app)/onboarding.tsx` only (same two files as precheck); Backend/Dashboard/Legacy untouched.
- Cleanup: all temp servers stopped (8127 backend, 8128 image, 8081 Metro, stub); app `.env` restored byte-identical to `http://192.168.8.125:8000/api/mobile/v1/` (verified against backup); emulator display (1080x2400@420) + animation scales restored to 1; temp dir `D:\OpenCodeTemp\opencode\a65` removed. Pre-existing emulator APKs (com.yamak.assist / com.yamakmobilenew / com.yamak.mobdev) and legacy `yamak-mobile` untracked `docs/` observed but NOT touched/cleaned.
- Commit = NOT YET (standing instruction). Next = A7 Drawer/Side Menu parity.

## PHASE A — A7.1 DRAWER / SIDE-MENU LEGACY PARITY ANALYSIS (read-only, 2026-10-07)

**Verdict: A7.1 DRAWER PARITY ANALYSIS PASS.** Analysis only — no product code, no package, no Backend, no Legacy change, no commit. Only this file updated. Precheck: **A6 CLOSED** (latest A6 UI commit `2b60b97 feat(onboarding): apply approved onboarding UI`); `git status --short` CLEAN; HEAD `2b60b97`. Required report sections A–Z all in this section.

### Legacy Drawer route tree (yamak-mobile, verified in source)
- `AuthedReadyApp` → `DrawerStackNavigator` (`src/navigations/drawerStackNavigator.tsx`, stack, headerShown:false; screens: `onboarding` when store `isFirstLunch` else none, always `drawer` = `DrawerNavigator`).
- `DrawerNavigator` (`src/navigations/DrawerNavigator.tsx`) = `createDrawerNavigator`, `initialRouteName="Home"`, custom `drawerContent` = `CustomDrawerContent`; style: label font 600/15/marginLeft −20, inactive black, **active gold block (secondary #F7B123) + white text**, header bg primary #002F6C. Registered routes:
  - `Home` (headerShown:false, title t("Home"), icon home-outline) → `TabNavigator` (3 tabs: `Home_Stack`=HomeStackNavigator, `Map`=MapScreen, `Profile_Stack`=ProfileStack — all tabs live under drawer Home).
  - `Profile` (headerShown:false, icon person-outline) → **bare `ProfileScreen`** (same component as the Profile tab inside `ProfileStack`, DIFFERENT stack — legacy duplicate-entry inconsistency; its sub-screen buttons MyCar/EditProfile/Favorites/ContactUs/AboutYamakApp/JoinUs are **dead no-ops** from the drawer: `navigate()` bubbles drawer→stack→root where none of those names exist).
  - `Favorites` (header SHOWN, title `t("Favorties")` — **EN label typo "Favorties"**, headerLeft md-menu→`openDrawer`, icon favorite-outline MaterialIcons) → `FavotiesScreen` (reads local `Favorites.store`; **no favorites API exists backend-wide**).
  - `messages` (route KEY "messages", header SHOWN, title `t("notifications")`="Notifications", headerLeft md-menu→`openDrawer`, icon chatbox-ellipses-outline) → `NotificationsScreen`.
- Nothing hidden/conditional/dev/modal: all 4 registered drawer routes are visible; no dev-only item, no modal, no commented drawer screen.

### Exact legacy visible drawer content (`CustomDrawerContent`, top→bottom)
- HEADER: `ImageBackground bg3.png` (primary navy); static `profile2.png` avatar 80×80 (**not the user's photo**); `user?.name` (auth store); green `ellipse` + literal `"online"` (**hardcoded, not a real status**). No email, phone, close button, YAMAK wordmark text, or language control.
- MENU (DrawerItemList, exact order): **Home · Profile · Favorites · Notifications** (labels/icons above).
- FOOTER: **Share** → native `Share.share` "Try Yamak the first application in Kuwait for roads helping and more" + **WRONG store URLs** (`play.google.com/store/games` Android / `apple.com/kw/app-store/` iOS — generic landing pages; Profile's share uses the correct app links — legacy inconsistency); **Sign Out** → Alert(t("Logout"), t("DoYouWantToLogout"), Cancel/Logout) → `removeAuthentication()`; centered `t("Version") {appCurrentVersion}` — `appCurrentVersion` is imported from `CommonConsstats` but **never exported** (only `appVersion` exists) ⇒ `undefined` ⇒ **legacy drawer shows no real version number** (defect pre-flagged at 01-project-inventory.md:316).

### Entry points / gestures (legacy, verified — no assumptions)
- `openDrawer` appears exactly 3× in all of legacy src: Favorites header hamburger, messages header hamburger, and **MapScreen's "md-menu" (COMMENTED OUT — dead)**. Home header (`HomeStackNAvigator`) has **NO hamburger** — headerLeft = map-marker-radius-outline → Map tab, headerRight = app logo. **From Home the legacy drawer opened ONLY by edge-swipe.**
- No `swipe/width/position/type/edge/overlay/backBehavior` override anywhere ⇒ library defaults, verified from the installed source family the rebuild will use: swipe edge **32dp** (min distance 60, min velocity 500); position **left, right under RTL** (legacy Arabic Flips via `I18nManager.forceRTL`); width `max(screenW−56, 360)` capped 360dp; **backdrop tap closes**; **Android hardware Back closes an open drawer** (listener added only while open); per-screen lazy mount, mounted screens stay mounted.

### Current Expo route shell (`YamakExpoNew` @ `2b60b97`)
- Root: splash + AuthProvider + Stack(headerShown:false) + `index.tsx` startup gate + `register` (guarded) + `email-otp` (ungated) + `(app)`.
- `(app)/_layout.tsx`: **gate = auth first, then remote onboarding** (Redirects), wraps `<UserLocationProvider><Slot/></UserLocationProvider>`. Children: `onboarding.tsx`, `(tabs)/` (home·map·profile, `expo-router/js-tabs`, explicit order, initialRouteName home), `vehicle/[id].tsx` (above tabs → no tab bar).
- Trigger surfaces TODAY: **Home has no header** (approved header/ hamburger deferred — "step 2 of YAMAK-SCREEN-010"); **Map app bar has an inert ☰** (`accessibilityLabel "Open menu"`, `onPress={() => {}}` — 4B placeholder explicitly awaiting a drawer); Profile is a self-contained hub (no app bar).

### Installed drawer capability — ZERO new packages required
- `expo-router ~57.0.23` **VENDORS the drawer stack**: subpath `expo-router/drawer` (= `build/layouts/Drawer`, a file-based `<Drawer>`) re-exports the vendored `@react-navigation/drawer` v7 API (`createDrawerNavigator`, `DrawerContentScrollView`, `DrawerItem`, `DrawerItemList`, `useDrawerStatus`, `DrawerToggleButton`) from `expo-router/build/react-navigation/drawer/`.
- `react-native-drawer-layout@4.2.10` INSTALLED (transitive of expo-router; the gesture engine). `react-native-gesture-handler ~2.32.0` + `react-native-reanimated 4.5.1` are **direct deps**. `@react-navigation/drawer` is NOT (and need not be) a direct dependency. Caveat: `react-native-drawer-layout` is transitive-only — if A7 ever imported it directly it must be promoted to package.json; **Option A below needs nothing** (imports `expo-router/drawer` only).

### Architecture options (evaluated, NOT implemented)
- **OPTION A (RECOMMENDED) — file-`<Drawer>` around tabs**: keep `(app)/_layout.tsx` gate byte-identical (auth→onboarding→`<Slot/>`); add `(app)/(drawer)/_layout.tsx` = `<Drawer>` with custom `drawerContent`; move `(tabs)/` into `(app)/(drawer)/(tabs)/` and `vehicle/[id].tsx` into `(app)/(drawer)/vehicle/[id].tsx` (**route groups are URL-transparent: `/home /map /profile /vehicle/{id}` unchanged**); `onboarding.tsx` stays a direct `(app)` child **outside** the drawer → onboarding NEVER mounts inside a drawer, gate untouched, no swipe-on-onboarding (A6 regression-free). Future `favorites.tsx`/`notifications.tsx` = new drawer children when routes land. Deep links unchanged; tab state preserved (drawer keeps mounted screens); Android Back = drawer-open→close else A5 semantics; gestures/backdrop/RTL free from `react-native-drawer-layout`; complexity LOW–MED (one layout + one drawerContent component + folder moves); **dependency impact ZERO**. Matches the intended shape pre-recorded at `13-SCREEN-BY-SCREEN-REBUILD-PLAN.md:667-668,706` (`<Drawer>` from `expo-router/drawer` inside `(app)`), refined so onboarding stays structurally outside.
- **OPTION B — custom side-sheet/context overlay**: full visual control but hand-rolls swipe, scrim, Android Back, RTL mirroring, focus/a11y trapping, transitions; more code to verify; diverges from recorded plan. NOT recommended.
- **OPTION C — raw `react-native-drawer-layout` view around `<Slot/>`**: free gestures/back/RTL without a navigator, but no drawer-route semantics, promotes a transitive dep, duplicates `expo-router/drawer`. NOT recommended.

### Route ownership / placement decisions (recommendation for A7.2)
- **Onboarding: outside drawer entirely** (unchanged gate).
- **Vehicle Details: INSIDE the drawer shell but OUTSIDE tabs** — legacy had the drawer as VehicleDetail's ancestor (parity: edge-swipe/hamburger/backdrop available on details); tab bar stays absent (5C design). Caveat recorded: as a drawer route, a no-history deep-link hardware Back on `/vehicle/{id}` will reach the drawer's backBehavior `firstRoute` → **Home tab**, not 5C's verified in-screen `→/map` (the in-screen "Go back" button logic is screen-owned and unchanged); flag for A7.4 verification + user decision.
- First-release drawer menu = **all-real-routes**: **Home · Map · Profile** (same entries the tabs provide — the legacy drawer was exactly this shell) + auth-identity header + truthful Version footer (via `expo-constants`; fixes the legacy undefined-version defect). **NO dead buttons** (project rule): no Favorites/Notifications placeholders until routes exist.
- **Share + Sign out: omitted from drawer** (already in Profile hub — "represent once" parity rule; legacy duplicated them; document as decision Q). **Version: drawer-footer-only** (no other home). **Language: NOT added** (legacy never had it in the drawer — Profile-only `LanguagePicker`; do not invent).
- Business model: drawer adds nothing commercial (no payments/booking/commission/Driver/marketplace) — matches legacy drawer exactly.

### Parity classification (legacy drawer function → class → new app home)
| Legacy drawer function | Class | Lives in new app |
| --- | --- | --- |
| Home entry | A — exists | Tab Home; drawer item → tabs |
| Profile / identity entry | A — exists | Tab Profile; drawer item → tabs |
| Favorites entry | B — roadmap | drawer → future `/favorites` (ONE place; legacy double-placed it) |
| Notifications ("messages") entry | B — roadmap | drawer → future `/notifications` (ONE place) |
| Share (footer) | A — exists | Profile hub Share (native share) |
| Sign out (footer) | A — exists | Profile hub Logout |
| Version (footer) | C — drawer-only | drawer footer, truthful value |
| Header identity (avatar/name/"online") | A — exists, restyled | drawer header from `AuthProvider.user`; **no fake "online" pill** (legacy hardcoded) |

### State-preservation / regression notes
- Drawer open/close is an overlay — never unmounts Home/Map/Profile (A5 tab retention preserved). Map `mapType`/`trafficEnabled`/selected-marker are `map.tsx` local state and survive drawer navigation; runtime check scheduled for A7.4.
- A7.2 folder moves are build-time only; URLs + behavior must be re-verified at runtime (A7.4). `onboarding.tsx` and `(app)/_layout.tsx` gate NOT touched.
- Onboarding gate not duplicated inside drawer (Step 28 satisfied by Option A structure).

### Design-reference status
- **Approved Home ALREADY designs the hamburger**: `approve-ui/home/code.html` `data-purpose="top-navigation-header"` = ☰ Menu (left) · brand pill (center) · bell (right) ⇒ the approved Home-header implementation (deferred "step 2") and the drawer trigger can land together. **Approved Map** `approve-ui/map/code.html` app bar also has ☰ — the current inert Map ☰ becomes the real trigger.
- **NO approved drawer design exists** (`approve-ui/` has no drawer folder). Only the PROPOSED `docs/rebuild/new-ui/main/drawer/index.html` (header avatar/name/demo phone; nav Home·Profile·Favorites + "More": Settings·Join us·About·Contact; footer Share/Sign out/Version 1.0.0 demo) and `design-system/navigation.md` §4 (avatar/name/status header, gold-tinted active item, footer Share/Sign out/Version; doc says "5 drawer entries" then lists 4 — **actual legacy = 4**). Legacy visual is NOT the final authority. **⇒ A7 requires its own Drawer Design Review (A7.6) before final acceptance.**

### Revised A7 micro-plan (proposal)
- **A7.1** — THIS STEP (legacy parity analysis). DONE.
- **A7.2** — Drawer architecture + route-shell: `(app)/(drawer)/_layout.tsx` file-`<Drawer>` + custom drawerContent skeleton; folder moves (tabs + vehicle into (drawer)); onboarding + gate untouched; zero deps.
- **A7.3** — Functional drawer content: Home·Map·Profile menu, AuthProvider identity header, truthful Version footer.
- **A7.4** — Runtime navigation/state verification: gates matrix (unauth / onboarding-required / completed), deep links, Android Back (drawer-open→close, tabs root background, vehicle deep-link back→home-tab caveat), edge-swipe + RTL, tab + Map state retention (mapType/traffic/selection), A6 gate regression subset, `tsc` + `git diff --check`.
- **A7.5** — Code review / learning (expo-router Drawer layout, vendored drawer API, drawer-layout gesture defaults, back interoperability with tabs).
- **A7.6** — **Drawer Design Review (REQUIRED — no approved drawer design)**: adopt `new-ui/main/drawer` + `navigation.md` §4 as base, or request an `approve-ui/drawer` reference; decide Share/Sign-out duplication + header email.
- **A7.7** — Approved-UI implementation (visual).
- **A7.8** — Final runtime + commit (after user approval; standing rule).

### Open user decisions
1. Drawer footer: omit Share + Sign out (Profile-only — recommended) vs duplicate legacy footer.
2. Drawer header: name + initials (+ email, already on AuthProvider) vs name/initials only.
3. Vehicle Details placement: inside drawer shell (recommended; deep-link back lands Home-tab) vs outside drawer (keeps 5C →/map deep-link back) — A7.4 decides after user choice.
4. Future Favorites/Notifications: one place (drawer) when routes exist — confirm no Profile-side duplicate later.
5. A7.6 Drawer Design Review scope: `new-ui` drawer as base vs new `approve-ui/drawer` reference.

### Status
- Analysis only. No `src/` file created or modified, no package installed, no build / Metro / tsc run, no backend change, no `yamak-mobile` change (its untracked `docs/` pre-existing, untouched), nothing committed.
- Commit = **NOT YET.** Next approved step = **A7.2 Drawer architecture + route-shell implementation** (after the user decisions above).

## PHASE A — A7.2 DRAWER ROUTE SHELL (implemented & runtime-verified, 2026-10-07)

**Verdict: A7.2 DRAWER ROUTE SHELL PASS.** Drawer architecture + route shell delivered and runtime-verified. No drawer *visual* design (A7.6/7.7), no A7.3-only content beyond the functional shell, no commit. Precheck: A6 CLOSED, A7.1 committed `05b65a1`, tree clean. Post-slice: 4 file renames + 2 new files + edits to `home.tsx`/`map.tsx` only; Backend/Dashboard/Legacy untouched; `git status --short` shows ONLY the intended changes; nothing committed.

### User decisions applied (settles A7.1 "Open user decisions" 1–3)
1. **Footer = Version only** (no duplicate Share/Sign out — those stay Profile-only). Applied.
2. **Identity header = initials + name + email from AuthProvider** (no image fetch, no fake avatar). Applied.
3. **Vehicle Details stays OUTSIDE the drawer AND OUTSIDE the tabs** (the user's A7.2 requirement overrides A7.1's "inside drawer shell" recommendation; deep-link back therefore keeps the screen-owned `→/map`/in-screen flow of 5C). Applied — `vehicle/[id].tsx` is a direct `(app)` child.
4. Favorites/Notifications: NOT implemented (no dead buttons). Applied.
5. A7.6 Drawer Design Review still required before final acceptance.

### What shipped (architecture only)
- `src/app/(app)/(drawer)/_layout.tsx` — file-`<Drawer>` from `expo-router/drawer` (vendored, zero new deps; `react-native-drawer-layout@4.2.10` transitive engine uses GestureHandlerRootView self-wrapping, no app setup), `drawerContent={<AppDrawerContent/>}`, `screenOptions={{headerShown:false}}`. All other drawer options are library defaults (edge 32dp, min distance 60dp, velocity 500, width ≈360dp max, front type, left / right-in-RTL, backBehavior `firstRoute`, per-screen lazy mount).
- `src/app/(app)/(drawer)/(tabs)/*` — the four A5 files `git mv`'d under `(drawer)` (build-time only; groups URL-transparent → `/home /map /profile` unchanged).
- `src/components/navigation/AppDrawerContent.tsx` — functional shell: AuthProvider identity header (initials logic replicated from Profile A4), Home·Map·Profile `DrawerItem`s with true focus highlight (navyDeep active), `CLOSE_DRAWER` dispatch after `router.navigate` (single-route drawer never auto-closes via its own route state), Version footer from `Constants.expoConfig?.version` (no footer when null — never invented data).
- Triggers: Home app bar gains a minimal ☰ (`OPEN_DRAWER` action); Map's previously-inert ☰ wired to the same; Profile untouched (no redesign — recorded as A7.3/A7.7 decision). Raw typed action `{type:'OPEN_DRAWER'|'CLOSE_DRAWER'}` bubbles to the drawer navigator (DrawerActions is not exported publicly by expo-router; the raw action typechecks against the vendored `NavigationAction`).
- `onboarding.tsx` + `(app)/_layout.tsx` gate + UserLocationProvider: untouched.

### Runtime verification matrix (Expo Go 57.0.9 / SDK 57 / Android emulator-5554 / Metro :8081 / persisted session `a66tester@yamak.test`)
- C3 authenticated+completed → drawer shell present on Home/Map/Profile (tabs nested in drawer): PASS.
- C4 Home hamburger ☰ → drawer opens (identity header, Home·Map·Profile, Version 1.0.0): PASS.
- C5 backdrop tap (outside drawer) → closes: PASS.
- C6 Android back with drawer open → closes, stays in-app: PASS.
- C7 drawer → Home: PASS (drawer closes via explicit CLOSE_DRAWER).
- C8 drawer → Map: PASS. C9 drawer → Profile: PASS.
- Tapping the already-focused Home row: closes drawer, stays on Home (no navigation loop): PASS.
- C10 tab bar Home↔Map↔Profile cycle under `(drawer)` root: PASS.
- C12/C14 deep link `/vehicle/1`: renders full-screen vehicle details with its own app bar — NO bottom tabs, NO drawer content (vehicle outside drawer+tabs); app back returns to Home tab: PASS.
- C13 cold start (force-stop + relaunch to `/`): persisted session restored → lands on /home, no onboarding, no register, drawer closed: PASS.
- Edge-swipe from left edge opens drawer: PASS. Map ☰ trigger: PASS.
- Focus highlight only on active route (navy #0B2A4A band pixel-verified on active row only): PASS.
- C1 (unauthenticated → no drawer) / C2 (onboarding-required → no drawer): NOT re-run this slice (needs session destroy + register+OTP). Structurally guaranteed — `(drawer)` mounts only inside `(app)`'s gate after onboarding; onboarding/auth are `(app)` siblings outside the group. Gate behavior previously runtime-verified under A6.5.
- C11 Map state retention: tab screens stay mounted under the A5 tabs navigator (instant return to Map content observed); deep state (markers/camera) not observable this slice (backend returns 500 for services/vehicles — pre-existing, unrelated).

### Environment notes
- Expo Go dev-menu floating button can overlay the app-bar ☰ and intercept taps (opens the dev sheet); moved via drag for testing. Not an app defect.
- Android gesture-nav edge swipe from the extreme edge triggers system Back before the drawer; mid-edge swipes (≈26–29dp) reach the drawer. Not an app defect.

### Hygiene
- `npx tsc --noEmit`: only the pre-existing baseline `src/components/app-tabs.web.tsx(27,38)` `/explore` error (unchanged since before A7.2) — PASS.
- `git diff --check`: clean (LF/CRLF warnings only). `git status --short`: 4 `R` renames + 2 untracked new files (`(drawer)/_layout.tsx`, `AppDrawerContent.tsx`) + modified `home.tsx`/`map.tsx` (renamed+modified). No Backend/Dashboard/Legacy change.
- Commit = **NOT YET** (standing rule). Next step = **A7.3 functional drawer content / trigger polish decisions**; **A7.6 Drawer Design Review required before visual acceptance.**

## PHASE A — A7.3 FUNCTIONAL DRAWER CONTENT (finalized & runtime-verified, 2026-10-09)

**Verdict: A7.3 FUNCTIONAL DRAWER CONTENT PASS.** A7.2 delivered the functional shell; A7.3 verified every content requirement, closed the accessibility baseline, and re-committed nothing. Precheck: tree clean at `954d686 feat(navigation): add authenticated drawer shell`; `git status --short` empty. Only product change this slice: `src/components/navigation/AppDrawerContent.tsx` (a11y baseline — see below). Backend/Dashboard/Legacy untouched; no commit.

### Final functional Drawer content (exact)
- **Header** — `AuthProvider` only: initials avatar (decorative, `accessible={false}`) + `user.name` + `user.email`. No profile API, no avatar URL, no fake image.
- **Rows (exact order)** — `Home → /home`, `Map → /map`, `Profile → /profile` via `router.navigate` (preserves Tabs ownership) + explicit `CLOSE_DRAWER`; vendored `DrawerItem` supplies `role="button"`, `aria-selected`; explicit `accessibilityLabel` added.
- **Footer** — only `Version {Constants.expoConfig?.version}`; row hidden entirely when version is `null` (never "Version undefined").

### Decisions recorded
- **Initials rule**: replicated the Profile hub (A4) rule — first letters of the first two name parts; single-word name → first letter (test user `a66tester` → `A`); empty/missing name → `'YA'` (the fallback A4 already shows), never a crash. Deliberately NOT changed to the illustrative "first+last" (`AK`) so Drawer and Profile render the SAME initials for the same session user; not over-engineered for international names.
- **Missing name/email**: renders nothing for that field (no "undefined").
- **Duplicates deliberately omitted** (not bugs): Share / Sign out stay Profile-only (A4 hub already surfaces them); Drawer footer = Version only.
- **Favorites / Notifications**: legacy-real functions whose routes do not exist — recorded as FUTURE Drawer destinations; no placeholder/dead rows.
- **Profile trigger**: no new Profile hamburger added (would require visual redesign) — Profile reachable via Bottom Tab and Drawer item; full trigger consistency deferred to A7.6 design review.

### Version source verification (Section 18 of task)
- `app.json` → `expo.version: "1.0.0"` (static source of truth). `app.config.ts` spreads the resolved config and only appends the react-native-maps plugin — does NOT override version. `expo-constants@~57.0.19` (direct dep) → `Constants.expoConfig?.version` = `"1.0.0"` at runtime. This is the **user-facing app version** (distinct from SDK 57 / JS runtime / Android build codes). Runtime OCR of the footer: "Version 1.0.0".
- A7.1/A7.2 sections untouched.

### Accessibility baseline (only functional additions)
- Avatar block `accessible={false}` (initials are a visual echo of the announced name — prevents double announcement).
- Drawer rows get explicit `accessibilityLabel={row label}` (labels already meaningful; exact-row a11y styling deferred to A7.6/7.7).

### Runtime verification matrix (Expo Go / SDK 57 / emulator-5554 / fresh Metro :8081 bundle 2177 modules)
- CASE 1 authenticated → Home: PASS (persisted session).
- CASE 2 Home hamburger ☰ → Drawer opens: PASS.
- CASE 3 header initials + `A66tester` + `a66tester@yamak.test`: PASS (OCR).
- CASE 4 Version truthful "Version 1.0.0" (not undefined, not hardcoded elsewhere): PASS.
- CASE 5 Home row → Home + closes: PASS (from Map tab).
- CASE 6 Map row → Map + closes: PASS. CASE 7 Profile row → Profile + closes: PASS.
- CASE 8 active-route tap (Home while on Home) → closes, no remount/loop: PASS.
- CASE 9 bottom tabs Home↔Map↔Profile still work: PASS.
- CASE 10 Map state retained after drawer open/close + tab round-trip (content instant, no reload; tab screens remain mounted — deep marker state not observable, backend 500s pre-existing): PASS (modest claim).
- CASE 11 Vehicle Details deep link `/vehicle/1` → full screen with own app bar, NO tabs, NO drawer; back → Home: PASS.
- CASE 12 Profile → Logout → confirm → REGISTER (auth stack); left-edge swipe produces no drawer (screen byte-identical pre/post): PASS.
- Env notes carried forward: Expo Go dev-menu FAB can overlay rows (moved via drag — not an app defect); extreme-edge swipe = system Back on gesture nav (not an app defect).

### Hygiene
- `npx tsc --noEmit`: ONLY the pre-existing baseline `src/components/app-tabs.web.tsx(27,38)` `/explore` error — PASS.
- `git diff --check`: clean. `git status --short` (below). No Backend/Dashboard/Legacy change.
- Emulator state note: the runtime session was logged out by CASE 12 — a future runtime slice needs re-registration (register + OTP) before authenticated cases.
- Commit = **NOT YET** (standing rule). Next step = **A7.4 runtime navigation/state verification gate**; **A7.6 Drawer Design Review required before visual acceptance.**

## PHASE A — A7.6 DRAWER DESIGN REVIEW (design/docs only, 2026-10-12)

**Verdict: A7.6 DRAWER DESIGN REVIEW PASS.** Documentation only. No product TS/TSX change, no Backend/Dashboard/Legacy change, no package installed, no build/Metro/tsc, A7.7 NOT implemented, nothing committed. Precheck: tree clean at HEAD `d7a98bd`; `git status --short` empty.

### Deliverables
- `docs/rebuild/approve-ui/drawer/APPROVED-DRAWER-SPEC.md` — approved drawer design spec, 24 numbered sections (purpose, fixed functional contract, authority, anatomy, surface/width/position/type, color tokens, typography, identity cap, avatar, identity text, row anatomy, active row, inactive row + icons, footer, scrim, gestures/triggers/auto-close, device fit, RTL, safe areas, empty/long data, a11y, motion, KEEP/POLISH/CHANGE table, A7.7 checklist), plus non-goals + DESIGN-SAMPLE label. **No approved drawer design existed before this** (`approve-ui/` had no drawer folder) — this is the first drawer authority.
- `docs/rebuild/approve-ui/drawer/code.html` — visual reference mock, explicitly labelled **DESIGN SAMPLE** (placeholder identity/version only).

### Approved design direction (A7.6)
- **Light drawer body** `colors.surface` white + **navy identity cap header** `colors.navyDeep` (#0B2A4A) full-bleed to the top (trusted from the approved Home header language) + **gold accents** (`colors.wordmark` #E9A319 avatar ring + active leading bar).
- **Active row = gold tint, not a navy/gold fill:** background `colors.goldTint` (#FDF7E6) + border `colors.goldTintBorder` (#FBEED4) + 3dp gold leading accent bar + navy content (`colors.navyDeep`, semibold). Explicitly rejects the legacy "full gold block + white text" contrast defect and the A7.3 temporary "full navy fill + white text".
- **Inactive rows:** white body, `colors.fieldText` label, `colors.subtitle` icon, 20pt SVG glyphs reused from `TabIcons.tsx` (Home/Map/Profile) — **zero new dependencies** (no icon package).
- **Footer:** version-only (`colors.subtitle`), hidden when `Constants.expoConfig?.version` is null (never "Version undefined").
- **Scrim:** `overlayColor: colors.scrim` (rgba(12,28,51,0.55)); tap-to-close kept.
- **Width/position/type/radius:** keep all library defaults (no `drawerStyle.width` override) so RTL mirroring + the vendored 16dp `front` corner come for free.

### Decisions recorded
- **Profile trigger:** no Profile hamburger (option A) — drawer triggers stay Home ☰ + Map ☰; Profile reached via bottom tab + drawer row and by edge-swipe. (Consistent with legacy Home having no hamburger; adding a Profile ☰ would need a screen redesign, out of scope.)
- **Safe-area bleed:** zero `DrawerContentScrollView` top/side padding; consume `insets.top` inside the navy cap and `insets.bottom` inside the footer/horizontal inset inside the body (A7.7).
- **Functional contract UNCHANGED:** header initials+name+email (AuthProvider), rows Home/Map/Profile, version footer; no Favorites/Notifications/Share/Logout/Language/dead rows (Profile hub keeps Share/Logout).
- Open question for implementation: A7.7 may either restyle `DrawerItem` or use an equivalent Pressable row — row semantics (`role`/`aria-selected`) + navigation/`CLOSE_DRAWER` behavior stay identical either way.

### Hygiene
- Files changed: `PROJECT_CONTEXT.md` (append only; A7.1–A7.5 untouched) + new `docs/rebuild/approve-ui/drawer/APPROVED-DRAWER-SPEC.md` + `docs/rebuild/approve-ui/drawer/code.html`. No `src/` change.
- Commit = **NOT YET** (standing rule). Next step = **A7.7 Approved-UI drawer implementation** (visual only), then **A7.8** runtime + commit after user approval.

## PHASE A — A7.7 APPROVED DRAWER UI IMPLEMENTATION (product UI only, 2026-10-12)

**Verdict: A7.7 APPROVED DRAWER UI PASS.** Visual implementation of the A7.6 approved design. No functional change (same rows/triggers/navigation/auto-close), no menu item added/removed, no Backend/Dashboard/Legacy change, no package installed, A7.8 NOT started, nothing committed. Precheck: tree clean at HEAD `47907b0 docs(drawer): approve drawer design`.

### Files changed (product only)
- `src/components/navigation/AppDrawerContent.tsx` — visuals rewritten to the approved design (identity cap, avatar, rows, footer).
- `src/app/(app)/(drawer)/_layout.tsx` — added `colors` import + `screenOptions={{ headerShown:false, overlayColor: colors.scrim }}`. Width/position/type/corner radius remain library defaults (no `drawerStyle.width`).
- `src/components/navigation/TabIcons.tsx` — exported the bare `TabGlyph` (+JSDoc) so the drawer reuses the exact bottom-tab Home/Map/Profile glyphs; `TabIcon`/dot unchanged.

### Applied design (existing tokens only — no invented hex)
- **Identity cap:** full-bleed `colors.navyDeep` (#0B2A4A), `paddingTop = insets.top + spacing.lg`, `paddingHorizontal = spacing.xl`, centred.
- **Avatar:** 72 outer ring (`borderWidth 2` `colors.wordmark` #E9A319 + `padding 2`) around a 64 avatar (`radius 32`, `colors.glass` fill, hairline `colors.glassBorder`); initials 22/28 bold `colors.brandText`.
- **Identity text:** name 16/22 semibold `colors.brandText`; email 12/16 regular `colors.tagline` (#94A9C3); centred; conditional render preserved.
- **Rows:** `DrawerItem` kept (role button + `aria-selected` + label semantics). Active = `activeBackgroundColor colors.goldTint` (#FDF7E6) + container `borderWidth 1 borderColor colors.goldTintBorder` (#FBEED4) + logical `borderStartWidth 3 borderStartColor colors.wordmark` + `activeTintColor colors.navyDeep`; inactive label `colors.fieldText`, icon `colors.subtitle`. Rows `minHeight 52`, `radius.md`, `gap spacing.xs`; menu `flex:1`.
- **Footer:** `Version {Constants.expoConfig?.version}` 12/16 medium `colors.subtitle`, `paddingTop spacing.lg`, `paddingBottom spacing.md + insets.bottom`; hidden when version is null. Truthful `Version 1.0.0`.
- **Pressed:** `pressOpacity = interactionOpacity.pressed` (no animation dependency).
- **Scrim:** `colors.scrim` (rgba(12,28,51,0.55)) via `_layout` `overlayColor`.
- **Safe area:** zeroed all `DrawerContentScrollView` injected top/side/bottom padding (`flexGrow:1`) and re-applied `insets.top` inside the cap and `insets.bottom` inside the footer — no global SafeAreaView, so the navy cap bleeds to the screen top.

### Functional contract (unchanged)
Header initials/name/email (AuthProvider session); rows Home/Map/Profile only; version footer. No Favorites/Notifications/Share/Logout/Language/dead rows (Profile hub keeps Share/Logout). Triggers: Home ☰ + Map ☰ only; **Profile has no hamburger**. Navigation `router.navigate` + explicit `CLOSE_DRAWER`; **same-route tap closes only**; scrim tap closes.

### Runtime verification (Expo Go + Metro; no native build)
Authenticated session obtained via a temporary **local stub API** (scratch, outside the repo) so register→OTP→Home worked without touching the shared backend/SMTP/DB; `.env` restored byte-identical afterwards (SHA256 verified). The emulator's a11y tree wedges over the map `TextureView` and the display lags, so the **drawer was verified by pixel-sampling `adb exec-out screencap`** against exact tokens:
- Opened from **Home ☰** and **Map ☰**; stable across repeated captures.
- Cap `#0B2A4A` full-bleed; gold ring `#E9A319` + `#1E3B58` glass fill (= rgba(255,255,255,0.08) over navyDeep) + white initials; name white (`#FFFFFF` brandText), email `#94A9C3` (tagline). Session identity `AA77 Tester` / `a77tester@yamak.test` / initials `AT` also confirmed via Profile a11y text.
- Active row `#FDF7E6` + `#FBEED4` border + 3dp `#E9A319` **leading** bar; exactly **3** rows; active row tracked the route (Home→row1, Map→row2).
- Scrim `#78808D` (= rgba(12,28,51,0.55) over #FAFAFA) right of the drawer; width ≈ library default (`max(W−56,…)`).
- Footer `Version 1.0.0` in `subtitle` colour, centred above the bottom inset.
- Same-route tap closed the drawer and stayed on the route; Profile confirmed hamburger-free.
- **Verification level (honest):** strong pixel evidence for cap/avatar/name/email/active row/leading bar/3 rows/scrim/footer + both triggers + Profile no-hamburger. Pressed-state and RTL mirroring were not captured as screenshots (emulator instability) — guaranteed by `interactionOpacity.pressed` and the logical `borderStart*` edge. A small viewport (`wm size 720x1280`) rendered Home with its ☰ + tabs, but the drawer capture there did not stabilise, so small-screen fit rests on the design (flex menu + insets cap/footer), not a captured screenshot.

### Hygiene
- `npx tsc --noEmit`: only the pre-existing baseline `src/components/app-tabs.web.tsx(27,38)` `/explore` error — PASS.
- `git diff --check`: clean (line-ending warnings only). `git diff --stat`: 3 files, +111/−46. `git status --short`: only the 3 files above. `.env` not in the final diff (stub URL reverted). Backend/Dashboard/Legacy untouched; no package installed.
- Commit = **NOT YET** (standing rule). Next step = **A7.8** runtime + commit after user approval.

## PHASE A - A7.8 DRAWER FINAL VERIFICATION + A7 CLOSURE (verification only, 2026-10-12)

**Verdict: A7 FINAL VERIFICATION PASS.** Verification only - no redesign, no feature, no Drawer row added/removed, no Backend/Dashboard/Legacy change, no package installed, no native build (no native change occurred), All Vehicles NOT started, nothing committed (standing rule). Only a proven regression would have been fixed; none was found.

Precheck: repo `YamakExpoNew`; HEAD `47907b0 docs(drawer): approve drawer design`; `git status --short` = the 4 expected files (`PROJECT_CONTEXT.md`, `(drawer)/_layout.tsx`, `AppDrawerContent.tsx`, `TabIcons.tsx`); `git diff --check` exit 0 (LF→CRLF warnings only); `git diff --stat` = 4 files, +148/-46.

### 1. Route ownership (final)
- `(drawer)` group's ONLY screen is `(tabs)` - `src/app/(app)/(drawer)/(tabs)/{_layout,home,map,profile}.tsx`; hrefs unchanged `/home` `/map` `/profile`.
- `(app)/_layout.tsx` gate: `onboarding.tsx` and `vehicle/[id].tsx` are direct `(app)` children, physically OUTSIDE `(drawer)`. `<Slot/>` renders the drawer's `(tabs)` OR vehicle OR onboarding - never both. So `/vehicle/{id}` has NO drawer and NO bottom tabs.

### 2. Functional Drawer contract (fixed, unchanged)
- Rows: exactly Home `/home`, Map `/map`, Profile `/profile` (`DRAWER_ROUTES`). No Favorites/Notifications/Share/Logout/Language/dead rows.
- Header: initials (`initialsOf(user.name)`, fallback `YA`) + `user.name` + `user.email` from `AuthProvider` - no profile API, no image fetch, no fake avatar, no "online" pill.
- Footer: `Version {Constants.expoConfig?.version}`; footer omitted entirely when version is null (never "Version undefined").

### 3. Triggers
- Home ☰ and Map ☰ ONLY (`openDrawer` → `navigation.dispatch({type:'OPEN_DRAWER'})` in `home.tsx` / `map.tsx`).
- Profile: no hamburger (`profile.tsx` has no `openDrawer` / no "Open menu"). Edge-swipe + scrim tap still work (library defaults).

### 4. Identity cap / rows / states
- Cap: full-bleed `colors.navyDeep`, `paddingTop: insets.top + spacing.lg`; 72 ring (`colors.wordmark`, 2dp) + 64 glass avatar (`colors.glass`/`colors.glassBorder`); initials 22/28 bold `brandText`; name 16/22 semibold `brandText`; email 12/16 regular `tagline`; name/email conditional.
- Rows: `minHeight: 52`, `radius.md`, `gap spacing.xs`, bare `TabGlyph` (20pt, exact bottom-tab glyphs).
- Inactive: white, `inactiveTintColor colors.fieldText`, icon `colors.subtitle`. Active: `activeBackgroundColor colors.goldTint` (#FDF7E6) + `borderWidth 1 colors.goldTintBorder` (#FBEED4) + logical `borderStartWidth 3 borderStartColor colors.wordmark` (#E9A319 leading bar) + `activeTintColor colors.navyDeep` + semibold.
- Pressed: `pressOpacity = interactionOpacity.pressed` (0.7).

### 5. RTL / small-screen / safe area / scrim / version / a11y
- RTL-safe: leading accent uses LOGICAL `borderStart*`; width/position/type/corner stay library defaults → automatic mirroring; logical `paddingStart/End` zeroed.
- Safe area: all `DrawerContentScrollView` injected paddings zeroed (`flexGrow:1`); `insets.top` re-applied in cap, `insets.bottom` in footer; no global SafeAreaView → cap bleeds to screen top.
- Small screen: no fixed drawer width; `menu {flex:1}` + insets pin cap/footer.
- Scrim: `_layout` `screenOptions.overlayColor = colors.scrim` (rgba(12,28,51,0.55)); tap-to-close.
- Version: truthful from `expo-constants` (`1.0.0`).
- a11y: rows are `DrawerItem` (role button + `aria-selected`) with `accessibilityLabel`; avatar `accessible={false}` (name/email not double-announced); tab glyphs `accessibilityElementsHidden`.
- Same-route: `handleNavigate` navigates only when NOT focused, then always `CLOSE_DRAWER` → same-route tap closes only (no reset).

### 6. Regression surfaces (structurally verified)
- Bottom tabs `(tabs)/_layout.tsx` unchanged (3 tabs, same glyphs); drawer wraps it without re-URL-ing. Home/Map stay mounted under the tabs navigator - drawer only opens/closes over them. Auth/onboarding gate unchanged; `(drawer)` mounts only after onboarding. Deep links `/home` `/map` `/profile` `/vehicle/{id}` (and `/`, `/register`, `/email-otp`) unchanged.

### Runtime verification (Expo Go + Metro; no native build)
- Fresh cold start (force-stop → `exp://127.0.0.1:8081`) reached the **authenticated Home** against the real dev backend (`Services` Wench/Flat Tires/Flat Battery/Unlock Key; ads; Explore Map) - auth restore + onboarding gate both passed. No stub API was served in A7.8.
- **Home ☰ opens the drawer** (pixel: navy cap `[0,0]-[932,..]`, glass `#1E3B58`, gold ring `#E9A319`, active row 1 `#FDF7E6`+`#FBEED4` at y≈588-724, scrim `#78808D` right of x≈933). **Backdrop tap closes**; **Android Back closes**.
- On the **Map** route the drawer's active row is **row 2 (Map)** (`#FDF7E6` at y≈736-870) - active row tracks the route. **Profile has no hamburger** (a11y); Map app bar ☰ at (94,209).
- **Honest verification level:** the emulator degraded badly this session (Expo Go cold start hung on its loader for minutes; `uiautomator` returned `null root node` while the drawer was open; stray input jumped to Calendar / GMS `PreAddAccountActivity` / launcher; multi-second input lag). A7.8 therefore RE-OBSERVED only: cold-start→Home, Home ☰ open, backdrop close, Back close, Map active row, Profile no hamburger. **Pressed state, RTL mirroring, small-screen, version text, bottom-tab taps, state retention, vehicle-details and deep-link navigation were NOT re-observed at runtime in A7.8** - they rest on the code above and/or A7.7 runtime. No PASS is claimed for a runtime item that was not actually observed.

### Hygiene
- `npx tsc --noEmit`: only the pre-existing baseline `src/components/app-tabs.web.tsx(27,38)` `/explore` error - PASS.
- `git diff --check`: clean (line-ending warnings only). `git status --short`: the same 4 files, no untracked artifacts. `.env` byte-identical (SHA256 `226F50A6…3A45D85`). Backend/Dashboard/Legacy untouched.
- Cleanup: temp Metro (port 8081) stopped; no PHP stub served; emulator size/density/RTL unchanged; scratch only under `D:\OpenCodeTemp\opencode\a78` (outside the repo). Emulator-only side effect: onboarding "seen" was marked by tapping Skip against the real backend (device app-data, not a repo artifact); location permission was pre-granted as in A7.7.
- Commit = **NOT YET** (standing rule).

## PHASE A - A7 CLOSURE
A7 (Drawer) is functionally and visually complete and verified: A7.1 architecture, A7.3 functional content, A7.4 navigation/state, A7.6 design approval, A7.7 approved-UI implementation, A7.8 final verification. **A7 = CLOSED (pending user approval to commit).** No further A7 work; All Vehicles NOT started.

## PHASE B - B1.1 ALL VEHICLES ANALYSIS (read-only, 2026-10-12)

**Verdict: B1.1 ALL VEHICLES ANALYSIS PASS.** Analysis only: no product/Backend/Dashboard/Legacy code changed, no package installed, no All Vehicles UI built, no commit (standing rule). Precheck: repo `YamakExpoNew`; HEAD `faf9ac2 feat(navigation): apply approved drawer UI`; `git status --short` empty (tree CLEAN). This section records verified findings only; no Phase A history is rewritten.

### Starting state
- Phase A (drawer) CLOSED. Phase B / Feature B1 = "All Vehicles". No route, hook, or screen for All Vehicles exists in `YamakExpoNew`.
- `YAMAK-SCREEN-011` (All Vehicles) = **NOT STARTED**, Phase C1 per `13-SCREEN-BY-SCREEN-REBUILD-PLAN.md:744`; backlog `11-rebuild-backlog.md:113`. Navigation map marks the route **TODO — Phase C1** (`03-navigation-map.md:262`).

### Legacy implementation (evidence: `yamak-mobile`)
- Route: `ALL_VEHICLES_SCREEN="ALL_VEHICLES"` (`constants/ScreenNames.ts`), registered **only** in `HomeStackNAvigator`. Entry point: legacy Home `VehiclesList.tsx` "View All" → `navigation.navigate(ScreenNames.ALL_VEHICLES_SCREEN)` (line 70). No other call sites.
- Screen `screens/AllVicelessScreen.tsx`: `Screen` + `HeaderList showSearch={false}` + `AllVehiclesList`; `ActivityIndicator` while loading. State: `totalCount`, `currentPage`, `allVehicles`, `sortType`.
- List `components/AllVeiclesList/AllVehiclesList.tsx`: `FlatList` (react-native-gesture-handler) with `RefreshControl`; `onEndReached` guarded by a momentum ref; pull-to-refresh calls `getAllVehicles({page:1,limit:10})` (merges AsyncStorage-stale location) after a 1500ms `setTimeout`; the infinite-scroll `handleEndReach` block is **commented out**.
- Header `components/HeaderList.tsx`: sort icon toggles `asc`↔`desc` (label A/Z); count `t("YouHaveNREsult",{count})`; notification bell → Notifications; filter button is **dead** (`console.log("filters")`); `showSearch={false}` hides search + filter row.
- Legacy defects (do NOT replicate): (1) pagination is **broken** — `useFetchV2` effect deps are `[method,url]` only, so `page`/`sort`/`latitude`/`longitude` changes do **not** refetch; the `[currentPage]` effect re-appends **page 1**; only sort works (explicit `refetch()` on `[sortType]`), so infinite scroll never advances. (2) distance cell renders the backend Euclidean **degrees** value as "KM" (`fixNumbers(item?.distance)` + `t("KM")`). (3) `item.branch.name` / `item.services.length` are **unguarded** and crash on a null branch/services. (4) filter is dead. No search, no real filters, no favorites, no contact actions on the list.
- Card `components/home/VehicleItem.tsx` (legacy): `iconMap` image, `Name : branch.name`, `Services : services.length`, distance+KM row, gold `FillledButton` "View"; press pushes `Vehicle_Details_Screen` with `{_id: item._id}`.

### Current implementation (evidence: `YamakExpoNew`)
- No All Vehicles route. `components/home/VehiclesList.tsx` is the reusable list: props `title`, `horizontal`, `excludeId`, `onVehiclePress`, `onViewAllPress`, `onRefetchReady`; **`onViewAllPress` is optional and only renders "View All" when supplied** (line 75). Home (`(app)/(drawer)/(tabs)/home.tsx`) mounts `<VehiclesList onVehiclePress={handleVehiclePress} />` — **no `onViewAllPress`**, so "View All" is currently hidden. Vehicle press → `router.push('/vehicle/[id]')` with `String(vehicle.id)`.
- Data: `hooks/use-vehicles.ts` → `GET /vehicles`; Strategy A location wait (don't fetch while `unknown`/`resolving`; freeze decision per cycle; `available`→with coords else coordinate-less fallback). `api/vehicles.ts` `getVehicles(params)` sends **only** `latitude`/`longitude` as a finite PAIR — **never `page`/`limit`/`sort`/`query`**; parses envelope `data.{list,metaData}`.
- Card `components/home/VehicleItem.tsx`: guarded `branch?.name` (row hidden if null), `services?.length ?? 0`, distance = client **Haversine km** only when `userCoords !== null` AND `isUsableVehicleGeo(geoLocation)`; otherwise blank (no fake 0 km); whole card is the press target with a static gold "View". `excludeId` uses `vehicle.id` (number).
- Home entry point: legacy "View All" affordance is **currently absent**; enabling B1 requires passing an `onViewAllPress` from Home.

### Backend contract (evidence: `yamak-backend`, inspection only)
- `GET /vehicles` → `Api\Mobile\VehicleController@index`, route `routes/api_mobile.php:50`, **public** (registered before the `auth:sanctum` group at line 56).
- Hardcoded filters: `work_status='online'` AND `current_driver_id IS NOT NULL`. Eager loads `branch,company,services,drivers,currentDriver`.
- Query params (all optional, **no validation**): `latitude`, `longitude`, `sort` (`'desc'` else `'asc'`), `page` (default 1), `limit` (default 10), `query` (`label_number LIKE %q%`).
- Ordering: **no `orderBy`** — DB default order, unless lat+lng present, in which case `distance = sqrt((v.lat-lat)²+(v.lng-lng)²)` (**Euclidean degrees**, not km) is added and it `sortBy('distance')` asc/desc.
- Pagination: manual `forPage($page,$limit)`. `limit=0` or non-numeric → **HTTP 500**.
- Envelope: `{success,message,data:{list,metaData},errors:null}`; `metaData = totalCount,currentCount,currentPage,itemsPerPage,lastPage`.
- `GET /vehicles/{id}` → `show`, route line 51, public; unknown id → **HTTP 500** (ModelNotFound text), not 404 (already handled by the app's `extractBackendMessage`).
- `vehicleResource` fields: `id,_id,status,companyId,company|null,branchId,branch|null,drivers[],services[],createdAt,workStatus,lastActiveDate,currentDriver|null,iconMap,labelNumber,modelName,geoLocation{latitude,longitude,coordinates:[lon,lat]}` (missing coords coerce to 0).

### Identifier consistency
- Current app navigates with **`id` (number)** to `/vehicle/[id]`; backend resource also mirrors string `_id`; legacy used `_id`. B1 must keep using `vehicle.id` for consistency with the existing `VehiclesList`/`VehicleItem` and Vehicle Details.

### Services / filters / search / favorites / contact actions (business-model check)
- Services list exists (`ServicesList`, `useServices`) and Home already routes a service press to `/map?serviceId=`. All Vehicles has **no** service filter in current code.
- Search: backend supports `query` (label_number LIKE), but the app's `getVehicles` does not send it; there is no client search UI for vehicles. Legacy All Vehicles had search **hidden** (`showSearch={false}`).
- Favorites: **no backend routes at all** (`13-...:780`); no favorites in current code or legacy All Vehicles. Not part of a faithful B1.
- Contact actions: belong to Vehicle Details (already built), not the list.

### Design status
- `approve-ui/` has **no All Vehicles folder** (only drawer, home, map, onboarding, profile, register, VehiclesDetails) ⇒ **no approved All Vehicles design exists**.
- `docs/rebuild/new-ui/main/all-vehicles/index.html` exists but `new-ui/UI-CATALOG.md:32` classifies it **PROPOSED** (grid+list, filter chips, skeleton, empty, error+retry). ⇒ **B1.6 Design Review is required before any visual acceptance** (mirrors the A7.6 gate).

### Route placement (decision pending, must be recorded in B1.2)
- `13-...:749` offers two options: `(app)/(tabs)/vehicles.tsx` **or** a pushed route (legacy reached it from a "see more" affordance). Current route tree: `(app)/(drawer)/(tabs)/{home,map,profile}`; direct `(app)` children `vehicle/[id].tsx` and `onboarding.tsx` sit **outside** drawer/tabs. Drawer rows (`DRAWER_ROUTES`) are Home/Map/Profile only.
- Legacy semantics ("see more" pushed screen with back) argue for a **pushed `(app)` route** (e.g. `(app)/vehicles.tsx`) so it has its own app bar and **no bottom tabs/drawer** — consistent with how `/vehicle/[id]` is placed. A bottom tab route would change the tab contract, which no approved design covers. Recommendation recorded; **final choice belongs to B1.2.**

### Recommended B1 scope + micro-plan (proposal only — not executed)
- Recommended B1 scope for a first verified slice: route + full list of `GET /vehicles` with real, working pagination (page/limit), sort, honest distance, pull-to-refresh, loading skeleton, empty + error/retry, vehicle tap → `/vehicle/[id]`; service filter only if chosen (local state, mirroring Map — **no** global store); **no** search, **no** favorites, **no** contact actions unless separately approved.
- Micro-plan (each step RUN → VERIFY → STOP): (1) record route decision + enable Home "View All" via `onViewAllPress`; (2) extend `api/vehicles.ts` to send `page`/`limit`(/`sort`) safely and expose `metaData`; (3) list hook with append-on-page + refresh; (4) screen with header (back + count), list, states; (5) vehicle tap → Vehicle Details; (6) filter step only if in scope; (7) B1.6 design review gate where a visual design is applied.
- Backend change requirement: **none strictly required** for step 1–5 (params already exist). Gaps to note, not fix: no `orderBy` (unstable default order), Euclidean-degrees `distance`, `limit=0`/non-numeric → 500, `query` unvalidated. Any backend change needs separate explicit approval.

### Hygiene
- Read-only: no file changed except this `PROJECT_CONTEXT.md` append. No `src/`, Backend, Dashboard, or Legacy change; no package installed; no build/Metro/tsc.
- Baseline TypeScript error unchanged (reported, not fixed): `src/components/app-tabs.web.tsx(27,38)` `Type '"/explore"'` TS2322.
- Commit = **NOT YET** (standing rule). Next step = **B1.2 route decision + basic All Vehicles route** (RUN → VERIFY → STOP) only after user approval; B1.2 not started here.

## PHASE B - B1.2 ALL VEHICLES DATA/API ARCHITECTURE (data layer only, 2026-10-12)

**Verdict: B1.2 ALL VEHICLES DATA ARCHITECTURE PASS.** Data/API layer only: no screen, no route, no visual UI, no Home wiring, no Backend/Dashboard/Legacy change, no package installed, B1.3 not started, nothing committed. Precheck: HEAD `f4994cb docs(vehicles): record all vehicles analysis`; `git status --short` empty (tree CLEAN). Approved B1 decisions applied: pushed authenticated route (B1.3), Home "View All" entry later (B1.3), existing `GET /vehicles` sufficient, client Haversine is the only display distance, B1 excludes search/favorites/contact/`POST /requests`/pricing/payment, FlatList + pagination + refresh, **no Backend change**.

### API contract finalized (`src/api/vehicles.ts`)
- New `VehicleListParams = VehiclesQueryParams & { sort?: VehicleSort; page?: number; limit?: number; query?: string }` — only backend-supported params. `VehiclesQueryParams` (`latitude?`,`longitude?`) kept and still used by `getVehiclesByService`. No `serviceId` (backend has no such filter).
- `VehicleSort = 'asc' | 'desc'`.
- `VehiclesMetaData` confirmed (unchanged): `totalCount,currentCount,currentPage,itemsPerPage,lastPage`.
- Extracted `VehiclesListData { list: Vehicle[]; metaData: VehiclesMetaData }`; `VehiclesResponse.data` is now `VehiclesListData | null` (envelope `{success,message,data,errors}` unchanged). No new fields invented.
- Envelope `data.list` + `data.metaData` confirmed by source re-check of `Mobile\VehicleController@index` and `routes/api_mobile.php:50`.

### Param validation + defaults
- `getVehicles` now builds the query via a private `buildVehiclesQuery` that emits ONLY defined+valid params: coords as a finite PAIR; `sort` only `'asc'|'desc'`; `page`/`limit` only integers `>= 1` (so it can never emit the `limit=0`/non-numeric values that make the backend 500); `query` only when a non-empty trimmed string. The function never invents a page or page size.
- `DEFAULT_VEHICLE_PAGE_SIZE = 10` exported from the hook (matches legacy `AppLimitList` and the backend default); invalid `options.pageSize` falls back to 10. No new global constants system.

### New hook: `src/hooks/use-paginated-vehicles.ts`
- Decision: **keep `useVehicles` for Home unchanged; add a separate paginated hook** (minimal regression risk to verified Home).
- Exposes: `vehicles`, `metaData`, `isLoading`, `isRefreshing`, `isLoadingMore`, `error`, `loadMoreError`, `isEmpty`, `hasMore`, `sort`, `refresh`, `loadMore`, `setSort`, `refetch` (=`refresh`).
- Location: same Strategy A as `useVehicles` — hold while `unknown`/`resolving`; first fetchable state → `available` with coords, else coordinate-less. **One frozen location decision per cycle** (`decisionRef`), so page 1 and later pages never mix coordinate modes (backend nearest-first ordering cannot shift mid-cycle). `refresh`/`setSort` start a new cycle and re-read current location state.
- Refresh: new cycle, page 1, **replaces** accumulated rows, refreshes the location decision, preserves `sort`, never blanks the existing list while running (`isRefreshing` separate from `isLoading`).
- Load-more: ignored when already loading/refreshing, when the cycle errored, or when `currentPage >= lastPage`; appends, **dedupes by `vehicle.id`** (`mergeVehiclesById`, pure/exported); a later-page failure sets `loadMoreError` and **keeps** the existing rows.
- Sort: no-op if unchanged; otherwise resets to page 1 and replaces the list (never appends a new order onto old rows). Sort UI is deferred to B1.3.
- Stale-request safety: `cycleIdRef` invalidates any older cycle, so a slow page-1 or load-more response can never corrupt a newer cycle (no AbortController — smallest mechanism matching project style).
- Error model: `error` = initial/blocking (list cleared); `loadMoreError` = later page (list preserved). Empty = successful page 1 with `list.length === 0`, exposed via `isEmpty` (never an error).

### Compatibility / scope
- Home compatibility: `useVehicles` and `components/home/*` untouched. `getVehicles({latitude,longitude})` and `getVehicles()` still behave identically (same envelope, same finite-pair rule); `VehiclesResponse`/`VehiclesMetaData`/`VehiclesQueryParams` remain exported.
- Identifier: `vehicle.id` (number) stays canonical for keys/dedupe/details. `Vehicle` type unchanged; the backend's Euclidean-degree `distance` is not mapped into the model.
- Null safety: no assumptions about `branch`/`services`/`geoLocation`/`image`; the raw nullable fields are preserved and presentation fallbacks stay in the UI (B1.3).
- Query: backend `query` supported and typed, but **not sent** by the B1 hook (search UI out of scope). Service filter: **not implemented** — no backend contract for it; local filtering of paginated data would be misleading. No route/`vehicles.tsx` created; no UI change.

### Hygiene
- Files changed: `src/api/vehicles.ts`, `src/api/index.ts`, new `src/hooks/use-paginated-vehicles.ts`, and this `PROJECT_CONTEXT.md` append.
- `npx tsc --noEmit`: ONLY the pre-existing baseline `src/components/app-tabs.web.tsx(27,38)` `/explore` error — PASS.
- Optional live HTTP contract check: **not performed** — the `.env` base URL is an unverifiable LAN dev server while the compiled default is the Production domain, so the backend's DB environment could not be confidently confirmed; the contract was already verified by source inspection in B1.1. No DB access attempted.
- Backend/Dashboard/Legacy untouched. Commit = **NOT YET**. Next step = **B1.3** (pushed All-Vehicles route + screen + Home "View All" wiring), RUN → VERIFY → STOP, after user approval.

## PHASE B - B1.3 ALL VEHICLES SCREEN — FUNCTIONAL IMPLEMENTATION (2026-10-12)

**Verdict: B1.3 FUNCTIONAL ALL VEHICLES PASS.** Pushed authenticated `/vehicles` screen implemented, Home "View All" wired, runtime-verified in Expo Go on the Android emulator against the safe LAN dev backend. No Backend/Dashboard/Legacy change, no package installed, no migration, no native build (`run:android`/Gradle untouched), nothing committed. Precheck: HEAD `c3fa2e7 feat(vehicles): add paginated vehicles data layer` (B1.2 committed), tree CLEAN.

### Route & screen (`src/app/(app)/vehicles.tsx`, NEW)
- Pushed authenticated route **outside** `(drawer)`/`(tabs)` exactly like `/vehicle/[id]` — its own app bar, so **no bottom tabs and no drawer** (legacy "see more" semantics; confirmed by runtime dump — no tab labels present).
- App bar: `BackIcon` ("Go back", `accessibilityLabel`) → `router.canGoBack() ? router.back() : router.replace('/home')`; centered title "All Vehicles"; right slot shows `<totalCount> vehicle(s)` ONLY when `metaData.totalCount` is present (verified live: "2 vehicles").
- `FlatList` + `keyExtractor={String(item.id)}` (canonical `id`), refresh via native `RefreshControl` (`refreshing`/`onRefresh`), load-more via `onEndReached` → `loadMore` (threshold 0.5).
- Single-screen **momentum guard** (`onMomentumScrollBegin`/ref) limits `onEndReached` to once per gesture; the hook remains sole authority for concurrency/page advancement (no duplicate concurrency logic).
- States in one shared slot (mutually exclusive): loading+empty → `VehiclesListSkeleton` ×3 (now exported from `VehiclesList.tsx`); blocking error → `ApiErrorRow` + retry; empty success → "No vehicles available right now." Footer: load-more `ActivityIndicator`, or `ApiErrorRow`+retry for a later-page failure (existing rows retained). `ListEmptyComponent`/`ListFooterComponent` both memoized.
- Card press → `router.push({ pathname: '/vehicle/[id]', params: { id: String(vehicle.id) } })`; passes frozen `coordsUsed` from the hook as `userCoords` and `orientation="vertical"`.

### Home wiring (`src/app/(app)/(drawer)/(tabs)/home.tsx`)
- `handleViewAllVehicles` → `router.push('/vehicles')`; passed as `onViewAllPress` to the existing `VehiclesList` (previously-hidden affordance made functional; no Home redesign; `tsc`-verified typed route). Runtime-verified end-to-end: View All tap on Home → `/vehicles`.

### Hook exposure (`src/hooks/use-paginated-vehicles.ts`)
- Now also returns **`coordsUsed: UserCoords | null`** — the frozen per-cycle coordinates (set on page-1 success from the decision, cleared to `null` on error). Mirrors `useVehicles`/`useMapVehicles` so `VehicleItem` shows Haversine km ONLY for the cycle actually fetched with coords (a late location change can never make distances appear/shift on rendered rows).

### Component reuse (minimal, backwards-compatible)
- `VehicleItem`: new optional `orientation?: 'horizontal' | 'vertical'` prop; default `'horizontal'` is byte-identical (Home unaffected); `'vertical'` = full-width card (`width: '100%'`, no right carousel gap). No other change.
- `VehiclesListSkeleton` exported. `ApiErrorRow` reused for initial + load-more errors.

### Sort — DEFERRED/EXCLUDED from B1.3 (recorded decision)
- Backend `sort=asc|desc` ordering is only meaningful when a `distance` sort can run (coords present on every item) — without coords the backend order is DB-dependent, so a sort toggle on this screen would show an arbitrary order. Hook `sort`/`setSort` stays ready but **no sort UI is exposed**. Recorded here so B1.4/B1.6 does not assume sort shipped.

### Runtime verification (Expo Go 57.0.9 on emulator-5554, Metro local, dev backend confirmed SAFE)
- **Dev backend confirmed safe + reachable:** `.env` `EXPO_PUBLIC_API_URL=http://192.168.8.125:8000/api/mobile/v1/` is the host machine's own Wi-Fi IP (a LAN dev service; cloudinary `dev/` path, not the Production `yamak-kw.com` domain). Only **read-only GET** requests made (incl. `/vehicles?page=1&limit=10`, `page=2`, and coords+sort probes). No DB access attempted. B1.2's "live check not performed" note is now superseded by this live confirmation.
- Live data: `totalCount: 2`, `lastPage: 1` — vehicles ids **3, 6**, both with valid `geoLocation`, `branch`, `services` (no missing-geo/branch/empty-services fixtures exist in dev).
- Verified live (automation-driven, uiautomator dumps + coordinate navigation):
  1. **View All on Home** → `/vehicles` (gold "View All" located by pixel scan; tap landed on the screen) — Home→route entry works with no tabs/drawer.
  2. `/vehicles` renders page-1 cards — "All Vehicles", "Go back", "2 vehicles" count, two full-width cards (VehicleItem vertical).
  3. Card tap → **Vehicle Details** (`/vehicle/[id]`, Yamak-b1 etc.) — confirmed.
  4. Back (app-bar "Go back") → returns to `/vehicles` with list intact — confirmed.
  5. No bottom tabs / no drawer on `/vehicles` — confirmed (dump shows no tab labels).
  6. Pull-to-refresh issued — list retained, no crash; replacement not visually distinguishable (same 2 records).
  7. **No fake distance:** with the emulator's location provider unresolved (10s grace `timed-out`; emulator GPS never produces a fix), the coordinate-less cycle ran and cards showed **no "0.0 KM"** — the legacy defect is deliberately absent.
- NOT runtime-exercisable here (recorded, not code failures): page-2 append, dedupe across pages, end-of-list (dev DB has 2 rows, `lastPage=1` → `hasMore=false` and no repeated fetch observed across repeated dumps), empty-list, missing-geo/Haversine-distance card (emulator provides no GPS fix even with `adb emu geo fix`; distance logic is the same guard already verified in Phase A and is `tsc`-closed here via `coordsUsed`). Initial skeleton state was too fast to capture (code-inspected: `ListEmptyComponent` skeleton stack).
- Baseline web note (unchanged, out of scope): web bundle fails on the pre-existing `codegenNativeComponent is not a function`; Android bundle builds cleanly (2176 modules).

### Hygiene
- Files changed: `M src/app/(app)/(drawer)/(tabs)/home.tsx`, `M src/components/home/VehicleItem.tsx`, `M src/components/home/VehiclesList.tsx`, `M src/hooks/use-paginated-vehicles.ts`, `?? src/app/(app)/vehicles.tsx`. No tracked config churn (`expo-env.d.ts`/`tsconfig` untouched; `.expo/types/router.d.ts` regenerated — gitignored).
- `npx tsc --noEmit`: ONLY the pre-existing baseline `src/components/app-tabs.web.tsx(27,38)` `/explore` error (now with `/vehicles` in the union) — PASS.
- `git diff --check`: clean. Backend/Dashboard/Legacy untouched. No DB access, no migrations.
- Commit = **NOT YET** (standing rule - waiting on user approval). Next = the user's follow-on B1.4 step (not started); **B1.6 Design Review remains the mandatory gate before any visual acceptance** (`new-ui/main/all-vehicles` is only PROPOSED).

## PHASE B - B1.4 ALL VEHICLES PAGINATION + STATE RUNTIME VERIFICATION (2026-10-13)

**Verdict: B1.4 ALL VEHICLES RUNTIME VERIFICATION PASS.** Verification-first; ONE small B1.3 frontend defect found and fixed. No Backend/Dashboard/Legacy change, no package, no migration, no native build, nothing committed. Precheck: HEAD `c3fa2e7` (B1.2); dirty tree = intended B1.3 files + `PROJECT_CONTEXT.md` only.

### Test environment (isolated stub, OUTSIDE the repo)
- Temporary Node stub `D:\OpenCodeTemp\opencode\stub-server.js` (port 8099) mimicking the real envelope `{success,message,data:{list,metaData:{totalCount,currentCount,currentPage,itemsPerPage,lastPage}},errors}` on `GET /api/mobile/v1/vehicles` (plus `/onboarding`,`/services`,`/adds`). 23 fixtures, pages 10/10/3; edge rows: id5 `iconMap:null`, id7 broken-image URL, id8 `geoLocation(0,0)`+`services:[]`, id12 `branch:null`, id15 `services:null`, id18 `services:[]`. Control `/__control?mode=&delay1=&delay2=&reset=` + `/__log`. Modes: `normal|empty|fail1|fail2|malformed|dedupe`.
- `.env` temporarily -> `http://10.0.2.2:8099/api/mobile/v1/` (backup + **byte-identical restore**, SHA256 `226F50A6...A45D85` verified). Metro `--clear`; Expo Go on `emulator-5554`. No Production DB, no writes, no migrations, no repo artifacts.

### Smallest B1.4 fix (genuine defect)
- `src/app/(app)/vehicles.tsx`: the screen-level once-per-gesture guard was armed ONLY by `onMomentumScrollBegin`, but RN fires `onEndReached` DURING the drag (before any momentum) - so a normal drag-to-bottom swallowed the trigger and load-more never ran (reproduced: 3 drags to bottom -> 0 page-2 requests). Fix: also arm on `onScrollBeginDrag` (`handleScrollGestureBegin` bound to both props). After the fix + a clean bundle the identical drag gesture loads page 2. Once-per-gesture semantics and hook-owned concurrency are unchanged.

### Runtime results
- **Page sequence:** `1 -> 2 -> 3` exactly once each (no `2->2`, no `3->3`, no parallel duplicates); end-of-list -> no page-4 across repeated drags; 23 unique rows (last = Branch 23). Page 1 request: `GET /vehicles?sort=asc&page=1&limit=10` -> 200; header "All Vehicles" + "23 vehicles".
- **Dedupe (runtime-verified):** stub `dedupe` mode returned a page-2 overlap (id 10 repeated across pages; 24 rows over 10/10/4) - the rendered list kept 23 unique rows, Branch 10 appeared exactly once (immediately followed by Branch 11), the list ended at Branch 23, and Metro showed no duplicate-key warning. `mergeVehiclesById` keys on canonical `vehicle.id`, preserving first-occurrence order.
- **Refresh:** one pull -> exactly one `page=1` (delayed 6s proved a real in-flight/indicator window); existing rows kept during refresh; on success the accumulated pages are REPLACED by the new page 1; next end-reached loads page 2 of the NEW cycle.
- **Stale request:** page-2 delayed 20s then superseded by two newer page-1 cycles; the late page-2 was **IGNORED** (list still ended at Branch 10, no stale append) - verifies `cycleIdRef`.
- **Initial error (`fail1`):** skeleton ends -> blocking "Vehicles are temporarily unavailable" + Retry, no rows/count; Retry -> page 1 loads.
- **Load-more error (`fail2`):** page-1 rows remain, list NOT replaced, footer "Page two failed to load" + Retry; footer Retry -> page 2 appends.
- **Empty (`empty`):** "No vehicles available right now.", header "0 vehicles", no error, no load-more.
- **Malformed 200 (bad JSON):** graceful empty state, no crash (app alive) - API error safety.
- **Null/missing data:** `services:null` and `services:[]` -> "Services : 0" (no invented count); `branch:null` -> "Name :" row omitted, card renders; missing-image (null) and broken-image URL cards render without crashing (existing no-image fallback, unchanged).
- **Distance verification level - CODE-LEVEL only:** emulator location never yields a fix (`unknown` -> `timed-out` -> coordinate-less cycle; `adb emu geo fix` did not help). `isUsableVehicleGeo` rejects null/non-finite/`(0,0)`; `haversineDistanceKm` (client, km) + `formatDistanceKm` (never `0`/`NaN`; `<0.1 km`). Runtime negative confirmed: no distance label, no `0 KM`/`NaN`/`Infinity`. Backend Euclidean `distance` is never displayed (not mapped into the model).
- **Location-cycle consistency:** every cycle logged coordinate-less requests (no `latitude`/`longitude`) -> one frozen decision per cycle; code freezes `{withCoords,coords}` in `decisionRef` reused by `loadMore`.
- **Sort:** no UI (deferred); code-verified `setSort` -> new cycle -> page-1 replace when locked + fetchable.
- **Home regression:** `VehicleItem` default `orientation='horizontal'`, Home passes none -> horizontal. Runtime contrast: Home = single gold "View" row; `/vehicles` = 6 stacked gold rows (vertical) - B1.3 did not turn Home vertical.
- **View All / back:** Home gold "View All" tap -> `/vehicles`; Back -> Home. **Details/back:** card tap -> `/vehicle/1` (fetch `/vehicles/1`) "Vehicle details"; Back -> `/vehicles`; Back -> Home (no forced Home, no custom BackHandler).
- **Route shell:** `/vehicles` is under the `(app)` auth+onboarding gate; no bottom tabs / no drawer (no tab labels, no "Open menu").
- **Network audit:** `page`/`limit` always integers >= 1; no `limit=0`/NaN/undefined; no `query` param. **Rendering:** FlatList only; no nested-`ScrollView`/`VirtualizedLists`/duplicate-key/`Warning:` in Metro logs; no render loop.

### Hygiene
- `npx tsc --noEmit`: ONLY the baseline `src/components/app-tabs.web.tsx(27,38)` `/explore` error - PASS.
- Dirty tree = the B1.3 files + `PROJECT_CONTEXT.md`; `src/app/(app)/vehicles.tsx` now also carries the B1.4 guard fix. `git diff --check` clean. `.env` restored byte-identical; stub/temp files removed. Backend/Dashboard/Legacy untouched.
- Commit = **NOT YET**. Next = **B1.5** only after explicit approval; **B1.6 Design Review** remains the mandatory visual gate.
