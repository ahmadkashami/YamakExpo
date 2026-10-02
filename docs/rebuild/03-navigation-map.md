# YAMAK MOBILE — 03. NAVIGATION MAP

> **This file has TWO clearly separated halves.**
>
> - **§1–§5 — LEGACY NAVIGATION (reference only, NON-CURRENT ARCHITECTURE).** Reverse-engineered
>   from the legacy `yamak-mobile` project (`src/navigations/`, `App.tsx`, `RootFun.tsx`,
>   `src/helpers/AuthedReadyApp.tsx`). Evidence: `CONFIRMED` (code seen) | `INFERRED` | `UNKNOWN`.
>   Legacy library: **React Navigation v7** — stack + drawer + bottom-tabs.
> - **§6 — NEW YAMAK EXPO TARGET BEHAVIOR (AUTHORITATIVE).** What `YamakExpoNew` must do, expressed
>   as **behavior**, not as a forced library structure.
>
> ⛔ **Never copy the legacy navigator graph into the Expo app.** Legacy is the reference for
> *behavior only*. See `REBUILD-PLAN.md` §2.1 and §3.

---

# PART 1 — LEGACY NAVIGATION (reference only, NON-CURRENT)

## 1. Root routing (authentication gate)

High-level decision tree at app start:

```
App.tsx
  └─ Provider wrappers (i18n, QueryClient, ModalContext, stores)
      └─ RootFun  (reads auth token gate)
          ├─ NOT authenticated  → AuthStackNavigator
          └─ authenticated      → AuthedReadyApp
                                   └─ DrawerStackNavigator
                                       ├─ onboarding (only if isFirstLunch=true)
                                       └─ drawer → DrawerNavigator
```

- `RootFun.tsx`: decides which root navigator to render based on whether a valid
  session exists (see `06-authentication.md`). CONFIRMED
- `AuthedReadyApp.tsx`: authenticated shell — it registers FCM notifications, subscribes topic,
  pushes `fcmToken` to profile, initializes Freshchat + Sentry, and captures device location into
  the `userLocation` store + AsyncStorage key `userLocation`. CONFIRMED

## 2. Auth stack (`AuthStackNavigator`) — unauthenticated area

Initial route: `Login`. All headers hidden.

```
AuthStackNavigator (createStackNavigator)
  ├─ Login            (initial)
  ├─ Register
  ├─ Auth             (phone/code login)
  ├─ OTP_VERIFICATION (animation disabled)
  ├─ Email_OTP
  ├─ Reset_OTP
  └─ NewPassword
```

## 3. Main app tree (authenticated area)

### 3.1 DrawerStackNavigator (createStackNavigator)
```
DrawerStackNavigator
  ├─ "onboarding"  → OnBoardingScreen   (rendered only when isFirstLunch === true)
  └─ "drawer"      → DrawerNavigator    (always)
```

### 3.2 DrawerNavigator (createDrawerNavigator)

Initial route: `Home`. Custom drawer content: `CustomDrawerContent`. Active item
highlight uses `secondary` (#F7B123), inactive tint black, active tint white.
Header background `primary` (#002F6C).

```
DrawerNavigator
  ├─ Home          → TabNavigator          (header hidden)
  ├─ Profile       → ProfileScreen         (header hidden)
  ├─ Favorites     → FavotiesScreen        (header shown, menu button opens drawer)
  └─ messages      → NotificationsScreen   (header shown, menu button opens drawer)
```

> NOTE (legacy quirk): the 4th drawer item key is `"messages"` but its component is
> `NotificationsScreen`, and its label is `t("notifications")`. Rebuild should clean this up.

### 3.3 TabNavigator (createBottomTabNavigator)

3 tabs, no labels, inactive color white, active color secondary, bar background primary.

```
TabNavigator
  ├─ Home_Stack   → HomeStackNavigator   (icon: home-outline)
  ├─ Map_Screen   → MapScreen            (icon: map)
  └─ Profile_Stack → ProfileStack        (icon: person)
```

### 3.4 HomeStackNavigator (createStackNavigator)

Initial route: `Home`. Home screen has its own custom header (logo image right,
map-marker button left, header bg primary).

```
HomeStackNavigator
  ├─ Home                (headerShown: true, custom title/header)
  ├─ Vehicle_Details     → VehiclesDetailsScreen
  ├─ ALL_VEHICLES        → AllVicelessScreen
  └─ Search              → SearchScreen     (presentation: modal)
```

> `No_Network` exists in ScreenNames and is imported but commented out here — see screens B19.

### 3.5 ProfileStack (createStackNavigator)

Initial route: `Profile`.

```
ProfileStack
  ├─ Profile             (header hidden)
  ├─ Notification        → NotificationsScreen
  ├─ Edit_Profile        → EditProfileScreen    (title t("ِEditProfile"))
  ├─ Privacy_And_Policy  → PrivacyAndPolicyScreen (presentation: modal, header hidden)
  ├─ Favorites           → FavotiesScreen
  ├─ ContactUs           → ContactUsScreen      (header hidden)
  ├─ MY_CAR              → MyCarScreen          (header hidden)
  ├─ JOIN_US             → JoinUsScreen         (presentation: transparentModal, header hidden)
  ├─ ABOUT_YAMAK_APP     → AboutYamakAppScreen  (header hidden)
  └─ FRESHCHAT           → FreshCharScreen      (header hidden)
```

### 3.6 MainNavigaator (`StackNAvigaator.tsx`) — top-level main stack

Present but abstracted; mirrors the drawer/app as the outer container:

```
MainNavigaator (createStackNavigator, headers hidden)
  ├─ "drawerNav"  → DrawerNavigator     (initial)
  ├─ "profile"    → ProfileStack
  └─ PrivacyAndPolicy → PrivacyAndPolicyScreen (presentation: modal)
```

> Rebuild decision: keep a single clear authenticated tree and do **not** reproduce the legacy
> drawer/profile duplication (the legacy drawer "Profile" entry and the Profile tab render the
> same screen with different navigation stacks — an inconsistency to resolve deliberately).

### 3.7 Verified legacy authenticated landing

- Final visible screen after auth is **`HomeScreen`**, not a generic shell:
  valid token → authenticated shell → drawer `Home` → tab `Home_Stack` → stack `Home` → `HomeScreen`.
- First launch (new install, authenticated): onboarding shows first, then the shell lands on
  `HomeScreen`. Returning user: `HomeScreen` directly.
- **Onboarding lives inside the authenticated area** — a first-launch *unauthenticated* user does
  NOT see onboarding; they see it once they become authenticated.

## 4. Route-name constants (`src/constants/ScreenNames.ts`)

Canonical names used across screens (CONFIRMED): `Home_Screen`, `Map_Screen`,
`Vehicle_Details_Screen`, `ALL_VEHICLES_SCREEN`, `Search_Screen`, `Profile_Screen`,
`Notification_Screen`, `Edit_Profile_Screen`, `Privacy_And_Policy_Screen`,
`Favorites_Screen`, `ContactUs_Screen`, `MY_CAR_SCREEN`, `JOIN_US_SCREEN`,
`ABOUT_YAMAK_APP`, `FRESHCHAT_SCREEN`, `Login_Screen`, `Register_Screen`,
`Auth_Screen`, `OTP_VERIFICATION_SCREEN`, `Email_OTP_Screen`, `Reset_OTP_Screen`,
`NewPassword_Screen`, `No_Network_Screen`, plus `StackNames.Home_Stack`,
`StackNames.Profile_Stack`.

> ⛔ **NON-CURRENT for the rebuild.** `ScreenNames.ts` is a React Navigation artifact.
> **Expo Router derives routes from file paths** — do not reintroduce a route-name constant file.
> See `REBUILD-PLAN.md` §2.1.

> Legacy also mixes `ScreenNames` with hard-coded strings (`"drawerNav"`, `"drawer"`, `"Home"`,
> `"messages"`).

## 5. Drawer icons (reused assets)

| Drawer item | Icon family | Icon name |
|---|---|---|
| Home | Ionicons | home-outline |
| Profile | Ionicons | person-outline |
| Favorites | MaterialIcons | favorite-outline |
| messages (notifications) | Ionicons | chatbox-ellipses-outline |
| Map header button | MaterialCommunityIcons | map-marker-radius-outline |

---

# PART 2 — NEW YAMAK EXPO TARGET BEHAVIOR (AUTHORITATIVE)

## 6. Target functional tree

Navigation is implemented with **Expo Router** (file-based routing under `src/app/`, typed routes
enabled). What follows describes **behavior and reachability**, not a mandated library graph. The
tree below is a functional model — map it onto Expo Router layouts and route groups.

```
Session gate
├── unauthenticated routes
│   ├── Register                     (built)
│   └── Email OTP                    (built — success currently does NOT enter the shell)
└── authenticated routes
    ├── onboarding  (when required — first launch, inside the authenticated area)
    └── app shell
        ├── Home
        ├── Map
        └── Profile
```

Additional routes (all inside the authenticated area unless noted):

- `vehicle/[id]` — Vehicle Details (already exists; reachable from Home cards and Map markers)
- all vehicles
- profile extensions (Edit Profile, My Cars, Favorites, Notifications)
- notifications
- favorites
- secondary screens (Privacy, Contact Us, Join Us, No Network, Freshchat)
- deferred auth routes (Login, phone auth, password reset, social auth)

Drawer behavior may be layered on the authenticated shell **where legacy parity requires it**.

## 7. Required BEHAVIOR (from legacy — this is the contract)

| # | Behavior | Source |
|---|---|---|
| B1 | A single session gate decides unauthenticated vs authenticated at app start | legacy `RootFun` token gate |
| B2 | Session is restored before any screen renders (splash held while loading) | verified Expo equivalent |
| B3 | Unauthenticated area contains the auth flows | legacy `AuthStackNavigator` |
| B4 | **Onboarding is inside the authenticated area** and shows exactly once per install | legacy `DrawerStackNavigator` + `isLunched` |
| B5 | After authentication the app lands on **Home** (not a generic shell) | legacy verified landing |
| B6 | Bottom tabs expose **Home / Map / Profile** | legacy `TabNavigator` |
| B7 | Vehicle Details is reachable from **Home cards** and **Map markers** (one route, above the tabs) | legacy defect #3 fixed |
| B8 | The Map opens with **no service selected** as a valid state | verified Expo behavior |
| B9 | A selected service filters the map's vehicles | verified Expo behavior |
| B10 | Logout clears the persisted session and returns to the unauthenticated area | legacy `removeAuthentication()` |
| B11 | Drawer entries (Profile / Favorites / Notifications) are reachable | legacy `DrawerNavigator` |

## 8. Expo Router implementation guidance (current)

- **Routes are files.** `src/app/index.tsx`, `src/app/register.tsx`, `src/app/email-otp.tsx`,
  `src/app/(app)/_layout.tsx`, `src/app/(app)/(tabs)/map.tsx`,
  `src/app/(app)/vehicle/[id].tsx` — this is the current tree.
- **`_layout.tsx` files are navigators.** A layout wraps its children in a Stack or Tabs and is
  where shared providers belong (e.g. `UserLocationProvider` is mounted in `src/app/(app)/_layout.tsx`).
- **Route groups `(group)`** group routes without affecting the URL. `(tabs)` gives the bottom tab
  bar; `(app)` marks the authenticated area.
- **Dynamic segments `[id].tsx`** are route parameters; read them with `useLocalSearchParams`.
- **Navigation** uses `router.push/replace/back` and `<Redirect>` / `<Link>` from `expo-router`.
  There is **no** `navigation.navigate('ScreenName')` and **no** `ScreenNames.ts`.
- **The session gate** belongs in the root layout (`src/app/_layout.tsx`) and in the authenticated
  group layout (`src/app/(app)/_layout.tsx`) — currently the auth loading gate exists and the
  authenticated redirect does not. Both are part of Phase A.
- **Deep links** must keep working; `/map` and `/vehicle/{id}` are deep-linkable today.

## 9. Current-vs-target navigation status

| Area | Status |
|---|---|
| Root layout + `AuthProvider` + splash-held auth restore gate | ✅ DONE |
| Unauthenticated routes (`/`, `/register`, `/email-otp`) | ✅ DONE |
| `/` → redirect to `/register` | ✅ DONE (placeholder until the authenticated landing is approved/built) |
| `/map` route + screen | ✅ DONE (root stack; not yet inside the tabs group) |
| `/vehicle/[id]` route + screen | ✅ DONE (above the tabs) |
| Auth/session **routing** gate (redirect unauthenticated → auth, authenticated → shell) | ⏳ **TODO — Phase A1** |
| Email OTP → authenticated shell transition | ⏳ **TODO — Phase A2** |
| Onboarding gate | ⏳ **TODO — Phase A3** |
| Authenticated layout | ⏳ **TODO — Phase A4** |
| Bottom tabs (Home / Map / Profile) | ⏳ **TODO — Phase A5** |
| Drawer / side menu (only if parity requires) | ⏳ **TODO — Phase A6** |
| All vehicles route | ⏳ **TODO — Phase C1** |
| Profile extensions routes | ⏳ **TODO — Phase D** |

## 10. Do NOT reintroduce

- `NavigationContainer`, `createStackNavigator`, `createDrawerNavigator`,
  `createBottomTabNavigator` as the app's navigation architecture
- `DrawerNavigator` package architecture
- `ScreenNames.ts` / hard-coded route-name registration
- A second navigation tree alongside Expo Router
- Navigation targets that do not exist (a target must never be invented — if a route does not
  exist yet, report upward through a callback instead of navigating)