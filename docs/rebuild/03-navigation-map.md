# YAMAK MOBILE — 03. NAVIGATION MAP

> Reverse-engineered from `src/navigations/`, `App.tsx`, `RootFun.tsx`, `src/helpers/AuthedReadyApp.tsx`.
> Evidence: `CONFIRMED` (code seen) | `INFERRED` | `UNKNOWN`.
> Library: React Navigation v7 — stack + drawer + bottom-tabs.

---

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
- `AuthedReadyApp.tsx`: authenticated shell — it initializes Firestore? **No** —
  it: registers FCM notifications, subscribes topic, pushes `fcmToken` to profile,
  initializes Freshchat + Sentry, and captures device location into
  `userLocation` store + AsyncStorage key `userLocation`. CONFIRMED

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

> Rebuild decision: the rebuild should keep a single clear root stack and NOT
> reproduce this overlapping drawer/profile duplication unless needed. See `12-rebuild-order.md`.

## 4. Route-name constants (`src/constants/ScreenNames.ts`)

Canonical names used across screens (CONFIRMED): `Home_Screen`, `Map_Screen`,
`Vehicle_Details_Screen`, `ALL_VEHICLES_SCREEN`, `Search_Screen`, `Profile_Screen`,
`Notification_Screen`, `Edit_Profile_Screen`, `Privacy_And_Policy_Screen`,
`Favorites_Screen`, `ContactUs_Screen`, `MY_CAR_SCREEN`, `JOIN_US_SCREEN`,
`ABOUT_YAMAK_APP`, `FRESHCHAT_SCREEN`, `Login_Screen`, `Register_Screen`,
`Auth_Screen`, `OTP_VERIFICATION_SCREEN`, `Email_OTP_Screen`, `Reset_OTP_Screen`,
`NewPassword_Screen`, `No_Network_Screen`, plus `StackNames.Home_Stack`,
`StackNames.Profile_Stack`.

> IMPORTANT: The rebuild should name navigators/keys consistently. Legacy uses a
> mix of `ScreenNames` and hard-coded strings (`"drawerNav"`, `"drawer"`, `"Home"`, `"messages"`).

## 5. Drawer icons (reused assets)

| Drawer item | Icon family | Icon name |
|---|---|---|
| Home | Ionicons | home-outline |
| Profile | Ionicons | person-outline |
| Favorites | MaterialIcons | favorite-outline |
| messages (notifications) | Ionicons | chatbox-ellipses-outline |
| Map header button | MaterialCommunityIcons | map-marker-radius-outline |

## 6. Rebuild design (JUST-IN-TIME)

Do NOT create navigation infrastructure upfront. Order of introduction (matches
`13-SCREEN-BY-SCREEN-REBUILD-PLAN.md`):
1. AuthStack (Login → Register → OTP flows) — first
2. Root token gate + AuthedReadyApp shell
3. DrawerStackNavigator + onboarding flag
4. DrawerNavigator
5. TabNavigator (Home/Map/Profile)
6. HomeStack + ProfileStack (added only when their screens are built)
7. Modal screens (Search, PrivacyAndPolicy, JoinUs) as needed

Each navigator is added ONLY when the first screen that needs it is implemented.