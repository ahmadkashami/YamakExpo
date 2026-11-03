# YAMAK MOBILE — PROJECT STRUCTURE LEARNING GUIDE

> ⚠️ **This guide now teaches the CURRENT `YamakExpoNew` (Expo) structure.**
> The React Native CLI structure is preserved in §7 as **Historical CLI structure — NON-CURRENT**.
> Purpose: teach the learner the project's folder layout and WHY it exists, so that during the
> rebuild each new folder is introduced with understanding (JUST-IN-TIME).
> Written for a senior backend dev who is NEW to React Native.

---

## 1. The big picture

`YamakExpoNew` is an **Expo** application. Expo ships a React Native app inside a native shell and
adds a managed toolchain: config plugins, `.env` handling, EAS builds, and — in this project —
**Expo Router**, where the filesystem *is* the router.

```
YamakExpoNew/
├─ app.json              ← static Expo configuration (source of truth for static values)
├─ app.config.ts         ← dynamic configuration layer (env-driven native config)
├─ .env  .env.example    ← environment values (EXPO_PUBLIC_* and build-time keys)
├─ assets/               ← images, icons, fonts (static assets)
├─ android/  ios/        ← GENERATED native projects (prebuild / run:android) — gitignored
└─ src/
   ├─ app/               ← FILE-BASED ROUTES (every file is a screen; _layout.tsx = navigator)
   ├─ api/               ← network contracts + shared fetch client
   ├─ auth/              ← session / authentication logic (React Context + SecureStore)
   ├─ components/        ← reusable UI
   ├─ hooks/             ← reusable feature logic
   ├─ location/          ← the single shared location owner (React Context)
   ├─ theme/             ← design tokens
   ├─ utils/             ← pure helpers
   └─ data/  constants/  ← static data / template constants
```

## 2. Folder-by-folder (what each teaches)

### `src/app/` — FILE-BASED ROUTES ⭐

Expo Router reads this directory as the route tree. **Every file here is a screen.**
There is no navigator registration file and no route-name constant file.

Current tree:

```
src/app/
├─ _layout.tsx                    ← ROOT NAVIGATOR (Stack) + AuthProvider + splash gate
├─ index.tsx                      ← "/" — startup gate: loading → neutral; authenticated → (app); else → /register
├─ register.tsx                   ← "/register" (redirects away when authenticated)
├─ email-otp.tsx                  ← "/email-otp" (ungated on purpose — A2 owns its success transition)
└─ (app)/                         ← route group: authenticated area (no "/(app)" in the URL)
   ├─ _layout.tsx                 ← A1 gate + UserLocationProvider + drawer
   ├─ onboarding.tsx              ← "/onboarding" — first-launch gate (A6, backend-managed)
   ├─ vehicles.tsx                ← "/vehicles" — All Vehicles list (B1)
   ├─ (drawer)/_layout.tsx        ← drawer navigator (A7)
   │  └─ (tabs)/_layout.tsx       ← bottom tabs (A5): Home · Map · Profile
   │     ├─ home.tsx              ← "/home" — Home dashboard (A3)
   │     ├─ map.tsx               ← "/map"
   │     └─ profile.tsx           ← "/profile" — Profile Hub + logout (A4)
   └─ vehicle/[id].tsx            ← "/vehicle/:id" — dynamic segment, above the tabs
```

> Historical note: the tabs originally sat directly at `(app)/(tabs)/`; the drawer was added above
> them in A7, so the current tree is `(app)/(drawer)/(tabs)/`. Both are route groups, so URLs are
> unchanged.

**Key Expo Router concepts:**

| Concept | Meaning |
|---|---|
| `_layout.tsx` | A navigator. Wraps all child routes. Stack = push/back; `Tabs` = bottom bar. |
| `index.tsx` | The `/` index of its folder. |
| `(group)/` | **Route group** — groups files for organization WITHOUT changing the URL. `(app)/(tabs)/map.tsx` is `/map`. |
| `[id].tsx` | **Dynamic segment** — read with `useLocalSearchParams<{ id: string }>()`; guard against NaN. |
| `[...slug].tsx` | Catch-all segment. |
| `+not-found.tsx` | Fallback for unmatched URLs. |
| `router.push/replace/back` | Navigation. `<Redirect>` / `<Link>` for declarative navigation. |
| `experiments.typedRoutes` | Enabled — `href` values are type-checked. |

**Learning point:** you never register a screen manually and never import another screen. A screen
exists because its file exists; navigating to it means navigating to its URL.

### `src/components/` — REUSERABLE UI

- `auth/` → auth-screen blocks (`AuthBrandHeader`, `AuthGateLoading`, `CountrySelectorModal`)
- `home/` → `ServicesList`, `AddsCarousel`, `VehiclesList`, `ViewMap`, `ApiErrorRow`, …
- `map/` → `MapMarkers`, `MapServiceChips`, `MapControls`, `MicroBanner`, `EnableLocationCard`
- `vehicle-details/` → `ContactBar`, `DriverAvatar`, `SafetyCard`, `VehicleStatusPill`, `icons`
- `navigation/` → `AppDrawerContent`, `TabIcons`

**Learning point:** if a UI block is used twice, move it here. Purely presentational blocks with no
route knowledge live here — never in `src/app/`.

### `src/api/` — NETWORK CONTRACTS + CLIENT

- `http-client.ts` → the **shared `fetch`-based client**; attaches the Bearer token by reading
  SecureStore directly via `getAccessToken()`.
- `config.ts` → base URL from `EXPO_PUBLIC_API_URL`.
- `api-error.ts` → typed `ApiError` + a message **sanitizer** (never leak raw backend/debug bodies).
- `services.ts` · `adds.ts` · `vehicles.ts` · `auth.ts` · `onboarding.ts` · `requests.ts` → one
  module per resource. `requests.ts` is the tracked-request module (`POST /api/mobile/v1/requests`).
- `index.ts` → barrel re-export.

**Learning point:** screens never call `fetch` directly; they call feature functions.

### `src/auth/` — SESSION / AUTH LOGIC

- `auth-context.tsx` → `AuthProvider` + `useAuth()`: `status: 'loading' | 'unauthenticated' | 'authenticated'`, `user`, `accessToken`, `authenticate`, `signOut`.
- `auth-storage.ts` → SecureStore read/write (`yamak_access_token`, `yamak_auth_user`).

**Learning point:** tokens live in **SecureStore**, never AsyncStorage and never in code.

### `src/location/` — SHARED LOCATION OWNER

- `location-context.tsx` → `UserLocationProvider` + `useUserLocation()`; a single owner for device
  location with an explicit state machine (`unknown | resolving | available | denied | unavailable | timed-out`).
- `index.ts` → barrel.

**Learning point:** exactly ONE location flow exists in the app. It is mounted at the
authenticated boundary so `/register` can never prompt. Screens consume the provider; they never
call `expo-location` directly.

### `src/hooks/` — REUSIBLE FEATURE LOGIC

- `use-services.ts` · `use-adds.ts` · `use-vehicles.ts` · `use-paginated-vehicles.ts` ·
  `use-map-vehicles.ts` · `use-vehicle-details.ts` · `use-create-request.ts`

**Learning point:** hooks bundle fetch + loading/error/refetch + stale-response guarding. Hook-local
state is the default; do not introduce a global store unless a decision demands one.

### `src/theme/` — DESIGN TOKENS

- `colors.ts` · `spacing.ts` · `radius.ts` · `typography.ts` · `interaction.ts`

**Learning point:** never hardcode a color/spacing in a screen — reference a token. There is exactly
one palette; adding a second design system is not allowed.

### `src/utils/` — PURE HELPERS

- `distance.ts` → Haversine km + `formatDistanceKm` (the backend's `distance` is Euclidean
  **degrees** and is NEVER rendered).
- `vehicle-marker.ts` → marker position/icon resolution from `geoLocation.coordinates`.

**Learning point:** `utils/` is pure and side-effect free — no React, no network.

### `assets/` — IMAGES / STATIC ASSETS

Icons, splash image, fonts, and any bundled imagery. Served through Expo's asset pipeline; remote
images (Cloudinary) are fetched at runtime.

### `app.json` — STATIC EXPO CONFIGURATION

`name`, `slug`, `version`, `orientation`, `icon`, `scheme`, `ios.bundleIdentifier`
(`com.yamak.assist`), `android.package` (`com.yamak.assist`), `android.permissions`,
`plugins` (`expo-router`, `expo-splash-screen`, `expo-secure-store`, `expo-location`),
`experiments.typedRoutes`.

### `app.config.ts` — DYNAMIC EXPO CONFIGURATION

A TypeScript function that receives the resolved `app.json` and returns the final config. In this
project its **only** responsibility is to add the `react-native-maps` config plugin with keys read
**from environment variables**:

```ts
export default ({ config }: ConfigContext) => ({
  ...config,                                   // the spread is load-bearing — preserves app.json
  plugins: [...(config.plugins ?? []), mapsPlugin],
});
```

**Learning point:** the dynamic config IS the resolved config — `app.json` is **not** auto-merged on
top, so the spread must re-emit everything. Native behavior is configured here, never by editing
generated native files.

### `android/` (and `ios/`) — GENERATED NATIVE PROJECTS

Created by `npx expo prebuild` / `npx expo run:android` (Continuous Native Generation) and
**gitignored**.

> ⛔ **`android/` is NOT where product architecture decisions are made.** Do not edit it by hand.
> `AGENTS.md` and Expo's docs both forbid manual native edits. Configure native behavior in
> `app.json` / `app.config.ts` and config plugins. Reading generated files for verification is fine;
> committing decisions into them is not.

## 3. What we will NOT rebuild (dead weight from legacy)

- `src/constants/data.ts` mock Locations / `ServiceDummy` (replaced by the real API)
- `AppColors` / `AppColorsTheme3` palettes (keep only the approved token set)
- Duplicate favorites store; `FormAuthScreen` / `FormScreen`; custom-IP modal
- The legacy `store/auth-context` import (legacy Firebase auth path)
- Unused `create-expo-app` template leftovers in `src/components/` and `src/hooks/`
  (`app-tabs*.tsx`, `animated-icon*`, `web-badge`, `external-link`, `hint-row`,
  `ui/collapsible`, `themed-text`, `themed-view`, `use-color-scheme*`, `constants/theme.ts`).
  These are known dead weight — they are not part of the design system.

## 4. Introduction order during rebuild (JUST-IN-TIME, current)

| Folder | Introduced at |
|---|---|
| `src/theme/` | Expo migration (already done) |
| `src/app/` | Expo migration (already done) |
| `src/api/` | Expo migration (already done) |
| `src/auth/` | Auth persistence (already done) |
| `src/components/auth/` | Register screen (already done) |
| `src/hooks/` + `src/components/home/` | Home data slices (already done) |
| `src/location/` + `src/utils/distance.ts` | Location-aware vehicles (already done) |
| `src/components/map/` | Map slice (already done) |
| `src/components/vehicle-details/` | Vehicle Details (already done) |
| `src/components/navigation/` | Drawer + tab icons (A7, already done) |
| `src/api/requests.ts` + `src/hooks/use-create-request.ts` | Tracked request flow (B2.3, already done) |
| `src/data/` | Country list for Register (already done) |
| i18n / language system | **not yet built** — required for EN/AR parity |
| notifications / services folders | Native integrations, as dependencies require |

## 5. Mental model (one-paragraph summary)

Build the app screen by screen. A "screen" is a file in `src/app/`; a "navigator" is a
`_layout.tsx`; shared UI lives in `src/components/`; network contracts live in `src/api/`; session
logic lives in `src/auth/`; device location has exactly one owner in `src/location/`; fetch logic
lives in `src/hooks/`; design tokens live in `src/theme/`; pure math/formatting lives in
`src/utils/`. Before each screen ask: "what does THIS screen need that does not exist yet?" Create
exactly those, then STOP. Never create structure speculatively.

---

## 6. Verification commands (current)

```bash
npx expo start          # development server
npx expo lint           # lint
npx tsc --noEmit        # typecheck
npx expo-doctor         # dependency / config diagnosis
npx expo install <pkg>  # ALWAYS use instead of npm/yarn/pnpm install for Expo packages
```

Baseline known error (pre-existing, reported separately, deliberately not fixed):
`src/components/app-tabs.web.tsx(27,38)` `"/explore"` TS2322.

---

## 7. Historical CLI structure — NON-CURRENT

> ⛔ **SUPERSEDED. Retained for history only. Do not create these folders.**
> The structure below describes the legacy `yamak-mobile` React Native CLI project, plus the
> superseded `YamakMobileNew` CLI rebuild. It is **not** the current `YamakExpoNew` layout.

```
yamak-mobile/            ← LEGACY (functional reference only)
├─ App.tsx               ← native entry: registers the app root
├─ index.js              ← bootstrap (register component)
├─ src/
│  ├─ screens/           ← one file = one page
│  ├─ components/        ← ui/ home/ map/ Profile/ vehicleDetails/ favorites/ auth/ placeHolders/ Models/
│  ├─ navigations/       ← React Navigation stacks/drawer/tabs
│  ├─ store/             ← Zustand stores (auth, favorites, services, vehicles, adds, userLocation, …)
│  ├─ apis/              ← axios.config.ts + <feature>.api.ts
│  ├─ helpers/           ← AppAsyncStoreage, AuthedReadyApp, LnguageDetector, Scalling
│  ├─ hooks/             ← useFetch.hook, useSocialAuth, userCurrentLocation, useLanguage, …
│  ├─ constants/         ← Colors, Sizes, fonts, ScreenNames, AsyncStorage keys, limits, links
│  ├─ translation/       ← i18next en/ar (+ localization/)
│  ├─ notification/      ← useNotification (FCM)
│  ├─ services/          ← freshchat/ sentry/
│  ├─ validationSchemas/ ← Yup schemas
│  └─ context/           ← modelContext (promise-based global modal)
├─ android/  ios/        ← native shells
└─ .env*  assets/
```

Legacy-specific lessons worth keeping (behavior), versus what must **not** be copied (architecture):

| Legacy item | Keep the behavior? | Copy the implementation? |
|---|---|---|
| `screens/` one-file-per-page | ✅ yes | ⛔ no — use `src/app/` routes |
| `navigations/` React Navigation | ✅ the routing behavior | ⛔ no — Expo Router |
| `store/` Zustand | ❌ | ⛔ no — React Context / hook-local state |
| `apis/` axios | ❌ | ⛔ no — `fetch` client |
| `translation/` i18next | ✅ EN/AR + RTL requirement | decide at build time |
| `helpers/AppAsyncStoreage` | ✅ the need for typed storage | ⛔ not AsyncStorage for tokens — SecureStore |
| `notification/`, `services/` | ✅ required capabilities | ⛔ not yet migrated |
| `validationSchemas/` | ✅ validation rules | decision at build time |
| `constants/` tokens | ✅ brand tokens | ⛔ already realized in `src/theme/` |
| `context/modelContext` | only if a modal promise system is really needed | decide at build time |