# Project Context

## Project Name
YamakExpoNew

## Tech Stack
- Expo
- React Native
- TypeScript
- Expo Router

## Project Structure
- `src/app`: Expo Router screens and layouts.
- `src/components`: Reusable UI components.
- `src/theme`: Shared YAMAK theme values.

## Setup Commands
- `npx expo start`: Start the development server.
- `npx expo lint`: Run linting.
- `npx tsc --noEmit`: Run TypeScript validation.

## Current Implementation Position
- Route tree is only: `src/app/_layout.tsx` (root Stack, `headerShown: false`, wraps `AuthProvider`), `index.tsx`, `register.tsx`, `email-otp.tsx`. No route groups, no `+not-found`, no tabs, drawer, onboarding, or authenticated Home.
- `src/app/index.tsx` unconditionally renders `<Redirect href="/register" />` — no auth check, no loading check. This is still true for authenticated users and is intentional until an approved authenticated destination exists.
- `AuthProvider` (`src/auth/auth-context.tsx`) exposes `status: 'loading' | 'unauthenticated' | 'authenticated'`, `user`, `accessToken`, `authenticate`, `signOut`. Session is read from SecureStore keys `yamak_access_token` + `yamak_auth_user` (`src/auth/auth-storage.ts`). Restoration is fire-and-forget in a `useEffect`.
- **Auth restore loading gate (Step A, done):** `src/app/_layout.tsx` holds the native splash with module-scope `void SplashScreen.preventAutoHideAsync()` and renders an internal `AuthReadyLayout` inside `AuthProvider`. `AuthReadyLayout` reads `useAuth().status`; while `loading` it returns `null` so no Stack renders, and a `useEffect` keyed on `status` calls `SplashScreen.hideAsync()` once status leaves `loading`, guarded by a `hasHiddenSplash` ref so later status flips cannot re-hide. `RootLayout`, `ThemeProvider`, `StatusBar` and the Stack options are otherwise unchanged.
- `signOut()` is exported but still has no call site.
- **Home slice 1 (done): Services API + ServicesList.** `src/api/services.ts` (`getServices`, `Service`, `ServicesResponse`, re-exported from `src/api/index.ts`), `src/hooks/use-services.ts` (`useServices()` returns `services`, `isLoading`, `error`, `refetch`; local state only, no global store), `src/components/home/ServicesList.tsx` and `ServiceItem.tsx`. No Home route exists yet, so nothing mounts these yet.
- `http-client.ts` attaches the Bearer token by reading SecureStore directly via `getAccessToken()` (not from context).
- `email-otp.tsx` calls `authenticate(...)` on success and renders a success state but never navigates — currently a dead end.
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

## Constraints
- `docs/rebuild/EXPO-MIGRATION.md` (in this repo) decides Expo Router replaces `NavigationContainer`/`AuthStackNavigator`/`ScreenNames`; no second React Navigation tree.
- No authenticated Home destination **route** exists yet. The legacy target is now known and verified (`HomeScreen` behind drawer → tabs → Home stack), so it may be rebuilt, but it must be a faithful port, not an invented Home.
- Onboarding is not built and is out of scope until an authenticated destination exists.
- Copy, never invent: endpoints and screen behavior come from `docs/rebuild/*` and the legacy source.
- No global store for Home data yet. Legacy used Zustand only so sibling sections and the Map screen could share services; those consumers do not exist, so `useServices` keeps local state.
- Service press is reported upward through `onServicePress(service)`; it must not navigate until a Map route exists. The Map screen does not exist, so any navigation target would be invented.
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
- Verification method note: the temporary mount used for this task (`src/app/preview-services.tsx`) has been deleted, and the two forced-branch tests (404 path, empty list) were reverted. Confirmed by `git status --short` showing only intended product files.

## Next Approved Step
Recommended next slice: **AddsList**, following the same shape (`src/api/adds.ts` + `use-adds.ts` + `src/components/home/AddsList.tsx`) so the two Home sections share one established pattern. `GET /adds` must be verified against `Api\Mobile\AdController` and a live response first, exactly as `/services` was; the legacy section is a `CarouselCards` carousel, not a horizontal list, so do not assume it mirrors ServicesList. Still not approved, so nothing has been started. `VehiclesList` must wait for the location decision, and `ViewMap` must wait for the Map screen. Blocker (2) from the previous task is still open: whether the unauthenticated landing is `/register` or a future `/login`. Do not create the `/home` route, route groups, tabs, drawer or onboarding before that decision.
