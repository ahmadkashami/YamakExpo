# YAMAK MOBILE - 02. SCREEN INVENTORY

> # ⚠️ LEGACY FUNCTIONAL REFERENCE — NON-CURRENT FOR ARCHITECTURE
>
> This screen list was reverse-engineered from the legacy **`yamak-mobile`** project, which is
> **SUPERSEDED**. It is retained ONLY as the source of truth for **which screens exist, what each
> one does, its entry/exit points, and its business behaviour**.
>
> The active project is **`YamakExpoNew` (Expo + Expo Router)** — see `REBUILD-PLAN.md` §0–§2.
>
> **Do not copy the legacy architecture described below.** `ScreenNames.ts`, `NavigationContainer`,
> `createStackNavigator`, `createDrawerNavigator`, `createBottomTabNavigator` and the 4-deep nested
> navigator stack are **legacy history**, not the rebuild's architecture. In the rebuild a screen is
> a **file under `src/app/`** and a navigator is a **`_layout.tsx`** — there is no screen-registry
> file and nothing is "registered" anywhere.
>
> Reading rule: every *screen + behaviour* entry is authoritative; every *navigation
> implementation* note is historical. Current build order and statuses live in
> `13-SCREEN-BY-SCREEN-REBUILD-PLAN.md` §12 and `11-rebuild-backlog.md`.

> Reverse-engineered from the legacy `yamak-mobile` codebase. Evidence classification:
> `CONFIRMED` (code seen) | `INFERRED` (deduced from usage) | `UNKNOWN` (not located) | `UNUSED?` (likely dead code)
>
> This file lists every screen discovered. Use it as the master list; every screen below
> MUST get a task in `11-rebuild-backlog.md` and step-by-step instructions in `13-SCREEN-BY-SCREEN-REBUILD-PLAN.md`.

---

## Evidence map

| Source directory | Purpose |
|---|---|
| `src/screens/*.tsx` | Main app screens (tab, stack, drawer, modal) |
| `src/screens/authScreens/*.tsx` | Authentication-flow screens |
| `src/navigations/*.tsx` | Which screens are registered and where |
| `src/constants/ScreenNames.ts` | Canonical route-name constants |

---

## A. AUTHENTICATION SCREENS (`src/screens/authScreens/`)

### A1. `loginScreen.tsx` — Login
- Route name: `LOGIN` (CONFIRMED via `ScreenNames.ts`)
- Accessibility: shown inside `AuthStackNavigator` when not authenticated
- UI: welcome area (`WelcomeArea`), email + password inputs (`AppTextInput`), login button, "forgot password" link, footer with signup/social links
- Behavior:
  - Email/password validation via `src/validationSchemas/loginSchema.ts` (Formik/Yup)
  - Calls `Auth.login()` (POST `auth/login`)
  - On success: persists token via `useAuthStore.authenticate(...)` then navigates to the main app
  - Social login entry points (via `useSocialAuth`)
- API: `auth/login` (see `04-api-catalog.md`)

### A2. `registerScreen.tsx` — Register / Sign Up
- Route name: `REGISTER` (CONFIRMED)
- Accessibility: from Login footer
- UI: full-name, email, password fields, country picker (`CountryPicker`), submit button; sign-in link back
- Behavior:
  - Form validation (Formik/Yup)
  - Calls `Auth.signup()` (POST `auth/signup`)
  - On success moves to email OTP verification step
- API: `auth/signup`

### A3. `authScreen.tsx` — Phone / Digital Number Login
- Route name: `AUTH` (CONFIRMED)
- Accessibility: from Login footer (alternative sign-in)
- UI: phone number entry, country code picker, OTP request button
- Behavior:
  - Calls `auth/sendCode` to request a verification code
  - On success navigates to `otpVerificationScreen`
- API: `auth/sendCode`

### A4. `otpVerificationScreen.tsx` — Phone OTP Verification
- Route name: `OTP_VERIFICATION` (CONFIRMED)
- Accessibility: after phone code is sent (`authScreen`)
- UI: code OTP input (`CodeAuthModel`), resend timer, verify button
- Behavior:
  - Calls `auth/checkCode`
  - On success calls `app-users/profile` to load user then authenticates
- API: `auth/checkCode`

### A5. `otpEmailVerificationScreen.tsx` — Email OTP Verification
- Route name: `OTP_EMAIL_VERIFICATION` (CONFIRMED)
- Accessibility: after registration (email verification step)
- UI: email OTP input, resend, verify
- Behavior:
  - Calls `auth/verify-email`
  - On success completes signup flow
- API: `auth/verify-email`

### A6. `otpResetPasswordScreen.tsx` — Reset-Password OTP
- Route name: `OTP_RESET_PASSWORD` (CONFIRMED)
- Accessibility: after requesting password reset from Login (forgot password)
- UI: OTP input + resend, next button
- Behavior:
  - Calls `auth/checkResetPassword`
  - On success navigates to `NewPasswordScreen`
- API: `auth/checkResetPassword`

### A7. `NewPasswordScreen.tsx` — Set New Password
- Route name: `NEW_PASSWORD` (CONFIRMED)
- Accessibility: after reset OTP is validated
- UI: new password + confirm password inputs, submit
- Behavior:
  - Calls `auth/resetPassword`
  - On success returns to login
- API: `auth/resetPassword`

### A8. `EmailValidationsScreen.tsx` — Email Validation (STUB)
- Route: referenced by name (CONFIRMED in `ScreenNames.ts`), component is a placeholder
- Status: STUB / minimal implementation — no business logic confirmed
- Recommendation: treat as candidate for deletion OR full design in rebuild; mark `UNUSED?` in backlog

---

## B. MAIN APP SCREENS (`src/screens/`)

### B1. `OnBoardingScreen.tsx` — Onboarding
- Route name: `ONBOARDING` (CONFIRMED)
- Accessibility: first launch only, gated by `appReady` store `isFirstLunch` flag; shown before the drawer
- UI: carousel of intro slides (`CarouselCards`, Lottie animations), language picker, "get started"
- API: none local; app settings seeded via `app-setting`

### B2. `HomeScreen.tsx` — Home (Tab: Home)
- Route name: `HOME` (CONFIRMED)
- Accessibility: first tab of `TabNavigator` via `HomeStackNAvigator`
- UI: welcome header (`Welcome`), services grid (`ServicesList`/`ServiceItem`), search bar (`Search`), ads slider (`AddsList`), vehicles strip (`VehiclesList`/`VehicleItem`), view-map CTA (`ViewMap`)
- Behavior:
  - Loads services (GET `services`), vehicles (GET `vehicles`), adds (GET `adds`)
  - Navigation to `ALL_VEHICLES`, `MAP`, vehicle details
- APIs: `services`, `adds`, `vehicles`

### B3. `MapScreen.tsx` — Map (Tab: Map)
- Route name: `MAP` (CONFIRMED via `ScreenNames.ts` used as tab key)
- Accessibility: second tab of `TabNavigator`
- UI: `react-native-maps` map (`components/map/Map.tsx`), service filter list (`servicesListMap`), provider card detail (`CardDetail`/`ServiceDetail`), user location marker
- Behavior:
  - Reads user location from `userLocation` store (set via `useUserCurrentLocation`)
  - Loads vehicles near me (GET `vehicles` with location params), allows pending-request creation
- APIs: `vehicles` (location-filtered)

### B4. `ProfileScreen.tsx` — Profile (Tab: Profile)
- Route name: `PROFILE` (CONFIRMED)
- Accessibility: third tab of `TabNavigator` via `ProfileStack`
- UI: profile header (`ProfileHeaders`), labels (`ProfileLables`), main buttons (`ProfileMainButtons`), cars list entry (`myCarList`), follow-us footer
- Behavior:
  - Loads/refreshes user profile (GET `app-users/profile`)
  - Entry points to: EDIT_PROFILE, MY_CAR, NOTIFICATIONS, FAVORITES, SETTING, CONTACT_US, PRIVACY_AND_POLICY, JOIN_US, ABOUT_YAMAK_APP, MESSAGES, FRESH_CHAT, LOGOUT
- APIs: `app-users/profile`

### B5. `EditProfileScreen.tsx` — Edit Profile
- Route name: `EDIT_PROFILE` (CONFIRMED)
- Accessibility: from Profile
- UI: name/phone/email fields, location map picker (`EditProfile/ProfileMapView`), save button
- Behavior:
  - Pre-fills from user store
  - PATCH `app-users/profile`
- API: `app-users/profile` (PATCH)

### B6. `VehiclesDetailsScreen.tsx` — Vehicle / Service Details
- Route name: `VEHICLE_DETAILS` (CONFIRMED)
- Accessibility: from Home vehicles strip, Map, Favorites, All Vehicles
- UI: vehicle info, services list (`AvailableServiceList`), `YourSaftyMatter`, `ShareWithus`, request CTA, loading placeholder (`VehicelsDetailsPh`)
- Behavior:
  - Loads `vehicles/:id` and `services/:id/vehicles`
  - Create request entry point (POST `requests`)
- APIs: `vehicles/:id`, `services/:id/vehicles`, `requests`

### B7. `AllVicelessScreen.tsx` — All Vehicles
- Route name: `ALL_VEHICLES` (CONFIRMED)
- Accessibility: from Home "see more"
- UI: full vehicles list (`AllVeiclesList`), filter support
- Behavior:
  - GET `vehicles` with pagination/sort/filter params
- API: `vehicles`

### B8. `SearchScreen.tsx` — Search (STUB)
- Route name: `SEARCH` (CONFIRMED)
- Status: STUB / minimal implementation (search input; wiring inferred via `home/Search.tsx`)
- Recommendation: full design required in rebuild; mark in backlog

### B9. `FavotiesScreen.tsx` — Favorites
- Route name: `FAVORITES` (CONFIRMED)
- Accessibility: from Profile
- UI: filter chips (`FavFilterList`, `FilterItem`), favorites list (`FavoriteList`/`FavCard`), empty state (`NoFavorites`)
- Behavior:
  - Reads `favorites` array (vehicle ids) from `Favorites.store` (Zustand persist, AsyncStorage key `favorites`)
  - Falls back to mock locations (`constants/data.ts Locations`) if no favorites — legacy behavior
- API: none (local-only persistence)

### B10. `MyCarScreen.tsx` — My Cars
- Route name: `MY_CAR` (CONFIRMED)
- Accessibility: from Profile
- UI: cars list (`CarList`/`CarItem`), add-new car content (`AddNewCarContent`)
- Behavior:
  - GET user-cars, POST new car, DELETE car
- APIs: `user-cars` (GET/POST/DELETE)

### B11. `NotificationsScreen.tsx` — Notifications
- Route name: `NOTIFICATIONS` (CONFIRMED)
- Accessibility: from Profile
- UI: notifications list, empty state
- Behavior:
  - GET `user-notifications/mine` (with pagination `page` param)
- API: `user-notifications/mine`

### B12. `ContactUsScreen.tsx` — Contact Us
- Route name: `CONTACT_US` (CONFIRMED)
- Accessibility: from Profile
- UI: contact options, WhatsApp deep-link helper (`messages.ts getWhatsAppMessage`), phone links
- Behavior:
  - Passive screen: opens external apps (mail/phone/WhatsApp)
- API: none

### B13. `PrivacyAndPolicyScreen.tsx` — Privacy & Policy
- Route name: `PRIVACY_AND_POLICY` (CONFIRMED)
- Accessibility: from Profile / auth footer (modal-like top-screen)
- UI: legal text from `app-setting` or static content
- API: `app-setting` (inferred source)

### B14. `JoinUsScreen.tsx` — Join Us
- Route name: `JOIN_US` (CONFIRMED)
- Accessibility: from Profile
- UI: static content + contact CTA
- API: none (static)

### B15. `AboutYamakAppScreen.tsx` — About Yamak App
- Route name: `ABOUT_YAMAK_APP` (CONFIRMED)
- Accessibility: from Profile
- UI: static branding/about content, app version, follow-us
- API: none (static) — `UNKNOWN` if any dynamic data used; treated as static in backlog

### B16. `FreshCharScreen.tsx` — FreshChat (Support Chat)
- Route name: `FRESH_CHAT` (CONFIRMED)
- Accessibility: from Profile
- UI: embeds Freshchat widget (`react-native-freshchat-sdk`)
- Behavior:
  - Init via `services/freshchat.config.ts` using `FRESHCHAT_APPI_ID` / `FRESHCHAT_APP_KEY`
- API: external SDK (Freshchat)

### B17. `SettingScreen.tsx` — Settings (STUB)
- Route name: `SETTING` (CONFIRMED)
- Status: STUB / minimal implementation
- Recommendation: full design required in rebuild; mark in backlog

### B18. `MessagesScreen.tsx` — Messages (STUB)
- Route name: `MESSAGES` (CONFIRMED)
- Status: STUB / placeholder
- Recommendation: confirm intent before rebuilding; mark `UNUSED?`

### B19. `NoNetworkScreen.tsx` — No Network
- Route name: `NO_NETWORK` (CONFIRMED)
- Accessibility: shown when connectivity lost/error (used by ErrorHandler)
- UI: offline message + retry
- API: none

### B20. `FormScreen.tsx` — Generic Form (LEGACY / replaced)
- Route name: `FORM` (CONFIRMED)
- Status: superseded by dedicated auth screens; likely legacy
- Recommendation: mark `UNUSED?`; do NOT rebuild unless needed

### B21. `FormAuthScreen.tsx` — Form Auth (LEGACY)
- Route name: `FORM_AUTH` (CONFIRMED)
- Status: legacy code — imports `store/auth-context`, `react-query`, firebase auth. Appears replaced by the current auth flow.
- Recommendation: mark `UNUSED?`; do NOT rebuild

---

## C. SCREEN TOTALS

| Group | Count | Screen files |
|---|---|---|
| Auth screens | 8 | login, register, auth, otpVerification, otpEmailVerification, otpResetPassword, NewPassword, EmailValidations* |
| Main screens | 21 | OnBoarding, Home, Map, Profile, EditProfile, VehicleDetails, AllVehicles, Search*, Favorites, MyCar, Notifications, ContactUs, PrivacyAndPolicy, JoinUs, AboutYamakApp, FreshChat, Settings*, Messages*, NoNetwork, Form*, FormAuth* |
| **Total** | **29** | 4 explicit stubs (`*`): Search, Settings, Messages, EmailValidations + 2 legacy (Form, FormAuth) |

> Stub handling rule: stubs and legacy screens are listed but flagged; rebuilding them is
> OPTIONAL per user decision in `11-rebuild-backlog.md`.

---

## D. SCREEN → API MAPPING (quick index)

| Screen | Primary APIs |
|---|---|
| Login | `auth/login` |
| Register | `auth/signup` |
| Auth (phone) | `auth/sendCode` |
| OTP Verification | `auth/checkCode` |
| Email OTP | `auth/verify-email` |
| Reset OTP | `auth/checkResetPassword` |
| New Password | `auth/resetPassword` |
| OnBoarding | — (local flag) |
| Home | `services`, `adds`, `vehicles` |
| Map | `vehicles` (location) |
| Vehicle Details | `vehicles/:id`, `services/:id/vehicles`, `requests` |
| All Vehicles | `vehicles` |
| Profile | `app-users/profile` |
| Edit Profile | `app-users/profile` (PATCH) |
| My Car | `user-cars` |
| Notifications | `user-notifications/mine` |
| Privacy & Policy | `app-setting` |

Full details: `04-api-catalog.md`, `06-authentication.md`, `13-SCREEN-BY-SCREEN-REBUILD-PLAN.md`.