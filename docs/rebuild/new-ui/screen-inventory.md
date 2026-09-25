# Yamak New — Screen Inventory (legacy-derived)

**DESIGN STATUS: PROPOSED — REQUIRES USER REVIEW AND APPROVAL.**
Every entry below maps to a **real legacy screen/flow** found in `D:\AALYASSIN\Projects\work\YamakProject\yamak-mobile`. Nothing is invented. Sources: `src/screens/**`, `src/navigations/**`, `docs/rebuild/02-screen-inventory.md`, `docs/rebuild/03-navigation-map.md`, `docs/rebuild/13-SCREEN-BY-SCREEN-REBUILD-PLAN.md`.

**Total discovered: 28 real screens** (8 auth + 1 onboarding + 19 authenticated area, of which 3 are legacy stubs). Dead code discovered but NEVER rebuilt: `FormScreen`/`FormAuthScreen`, Themes 1&3, duplicate favorites store, custom-IP modal, commented `No_Network_Screen` registration (screen itself is real).

---

## A. AUTHENTICATION — `AuthStackNavigator` (initial = Login)

### A01 — Login
- **Route:** `Login` (`ScreenNames.Login_Screen`) · **Source:** `src/screens/authScreens/loginScreen.tsx`
- **Purpose:** email + password sign-in. **Reach:** app start (gate). 
- **Actions:** submit login; "Forgot password?" link; "Sign up" → Register; (planned) social buttons.
- **States:** form validation, API error (`"user not registered"` special-case), success → main.
- **Related:** Register, Forgot-password, Phone login.

### A02 — Register
- **Route:** `Register` (`Register_Screen`) · **Source:** `registerScreen.tsx`, `registerHeader.tsx`, `registerValidationSchema`
- **Purpose:** create account via `auth/signup`. **Reach:** Login → "Sign up".
- **Actions:** Name / Email / Phone(+country picker) / Password / Terms checkbox; submit → Email OTP.
- **States:** multi-field validation, terms gate, API error, network offline.
- **Related:** Email OTP, Login.

### A03 — Phone / digital login
- **Route:** `Auth` (`Auth_Screen`) · **Source:** `authScreen.tsx`
- **Purpose:** request SMS code via `auth/sendCode` (phone entry + country code). **Reach:** from Login/auth toggle.
- **Actions:** submit phone → OTP; mode toggle (phone/digital login variants).
- **States:** validation, resend flow, API error.
- **Related:** Phone OTP, Login.

### A04 — Phone OTP
- **Route:** `OtpVerification` (`OTP_VERIFICATION_SCREEN`, animation disabled) · **Source:** `otpVerificationScreen.tsx`
- **Purpose:** verify 6-digit SMS code (`auth/checkCode`) → complete phone auth.
- **Actions:** enter code, resend + countdown, verify. **States:** wrong-code error, expired code, success → main.
- **Related:** Phone login, Profile fetch.

### A05 — Email OTP
- **Route:** `EmailOtp` (`Email_OTP_Screen`) · **Source:** `otpEmailVerificationScreen.tsx`
- **Purpose:** verify email after signup (`auth/verify-email`). 
- **Actions:** enter code, resend. **States:** wrong code, success → main/login.
- **Related:** Register, Login.

### A06 — Reset OTP
- **Route:** `ResetOtp` (`Reset_OTP_Screen`) · **Source:** `otpResetPasswordScreen.tsx`
- **Purpose:** validate reset code (`auth/check-reset-password`). 
- **Actions:** enter 6-digit code, resend (+countdown). **States:** wrong code, expired.
- **Related:** Forgot password, New password.

### A07 — New Password
- **Route:** `NewPassword` (`NewPassword_Screen`) · **Source:** `NewPasswordScreen.tsx`
- **Purpose:** set new password (`auth/reset-password`). 
- **Actions:** new + confirm fields, submit → Login with success.
- **States:** match validation, min-8 rule, API error.
- **Related:** Reset OTP, Login.

### A08 — Forgot password
- **Route:** part of Login flow (component) · **Source:** `components/auth/EmailForgotPassword.tsx`
- **Purpose:** reset-code request by email (`auth/send-reset-password`). **Reach:** Login → "Forgot password?".
- **Actions:** email → Reset OTP. **States:** validation, API error, success → Reset OTP.
- **Related:** Reset OTP, Login.

## B. ONBOARDING

### B01 — Onboarding
- **Route:** app-level first-launch gate · **Source:** `src/screens/mainScreens/OnBoardingScreen.tsx`
- **Purpose:** carousel + language picker (first launch per plan §2/UF docs). 
- **Actions:** swipe, select language, "start". **States:** first-launch only; skip state.
- **Related:** Auth gate.

## C. AUTHENTICATED AREA — `MainNavigaator` → Drawer → Tabs/Stacks

### C01 — Home (tab root)** · `Home_Screen` · `HomeScreen.tsx` · HomeStack (custom header: logo right, map pin left)
- Purpose: discovery feed. Sections: **Services grid** (`ServicesList`), **Adds/banner** (`AddsList`), **Vehicles** (`VehiclesList`), **map shortcut card** (`ViewMap`).
- Actions: pull-to-refresh (3 APIs in parallel: services, adds, vehicles), tap service/vehicle → details, open map.
- States: per-section skeleton load, section empty-hide, API retry, offline banner.

### C02 — All Vehicles
- **Route:** `ALL_VEHICLES_SCREEN` · `AllVicelessScreen.tsx` (HomeStack push)
- Purpose: browse/searchable vehicle catalogue (full-screen list/grid).
- Actions: filter chips, sort, tap → details. **States:** loaded list, skeleton, empty, error+retry, search no-results.
- Related: Home, Vehicle Details, Search.

### C03 — Vehicle Details
- **Route:** `Vehicle_Details_Screen` · `VehiclesDetailsScreen.tsx` (HomeStack push)
- Purpose: single vehicle spec + provider + actions.
- Actions: media gallery, specs, location/call provider, favourite toggle, share.
- States: loading hero skeleton, offline banner, favourite toggle success toast, modal confirmations.
- Related: All Vehicles, Favorites, Map.

### C04 — Map
- **Route:** `Map_Screen` (tab) · `MapScreen.tsx`
- Purpose: map with points of interest / vehicles.
- Actions: pan/zoom, tap marker → detail, location permission.
- States: permission prompt card, map loading, empty area, offline.
- Related: Home, Vehicle Details.

### C05 — Search
- **Route:** `Search_Screen` (modal presentation) · `SearchScreen.tsx` (HomeStack)
- Purpose: modal search + filters over vehicles.
- Actions: text query, filter chips, results → details. 
- States: typing, results, no-results, filters active/inactive.
- Related: All Vehicles, Vehicle Details.

### C06 — Favorites
- **Route:** `Favorites` / `Favorites_Screen` (drawer entry + ProfileStack) · `FavotiesScreen.tsx`
- Purpose: saved vehicles list.
- Actions: remove favourite, open details. **States:** empty (strong candidate), list, error, offline.
- Related: Vehicle Details, Profile.

### C07 — Notifications / Messages
- **Route:** drawer `messages` & `Notification_Screen` (ProfileStack) · `NotificationsScreen.tsx`
- Purpose: notifications chat-style list.
- Actions: mark read (planned), open notification target, clear.
- States: empty, unread badge, error, offline.
- Related: Profile, Favorites.

### C08 — Profile hub
- **Route:** `Profile` (tab root + drawer) · `ProfileScreen.tsx`
- Purpose: user identity + menu (edit profile, my cars, notifications, favorites, contact us, join us, about, freshchat, settings, privacy, logout, share app, version).
- States: avatar/name, menu list, logout confirm modal.
- Related: everything in ProfileStack.

### C09 — Edit Profile
- **Route:** `Edit_Profile_Screen` (ProfileStack) · `EditProfileScreen.tsx`
- Purpose: update name/phone/photo.
- Actions: save; validation; avatar pick.
- States: fetch skeleton, save success, validation, API error.
- Related: Profile.

### C10 — My Cars
- **Route:** `MY_CAR_SCREEN` (ProfileStack) · `MyCarScreen.tsx`
- Purpose: user's registered cars.
- Actions: add/edit/remove car (form), open details.
- States: empty (add-first), list, loading, form validation.
- Related: Profile.

### C11 — Contact Us
- **Route:** `ContactUs_Screen` (ProfileStack) · `ContactUsScreen.tsx`
- Purpose: contact channels / support form.
- Actions: phone/email/WhatsApp links, submit message.
- States: form validation, success, offline.
- Related: Profile, Join us.

### C12 — Privacy & Policy
- **Route:** `Privacy_And_Policy_Screen` (modal, top-level + ProfileStack) · `PrivacyAndPolicyScreen.tsx`
- Purpose: privacy/terms text.
- Actions: scroll, external links, close. **States:** static text layering.
- Related: auth footer links, Profile.

### C13 — Join Us
- **Route:** `JOIN_US_SCREEN` (transparentModal) · `JoinUsScreen.tsx`
- Purpose: become-a-provider / business inquiry form.
- Actions: form, submit, close modal. **States:** validation, success, offline.
- Related: Profile, About, Contact.

### C14 — About Yamak App
- **Route:** `ABOUT_YAMAK_APP` (ProfileStack) · `AboutYamakAppScreen.tsx`
- Purpose: brand story / info (planned-only screen).
- Actions: scroll; links. **States:** static.
- Related: Profile.

### C15 — FreshChat
- **Route:** `FRESHCHAT_SCREEN` (ProfileStack) · `FreshCharScreen.tsx`
- Purpose: embedded Freshchat customer-support chat.
- Actions: chat UI events. **States:** loading widget, offline.
- Related: Profile, Contact.

### C16 — No Network
- **Route:** `No_Network_Screen` (registered but commented in HomeStack) · `NoNetworkScreen.tsx`
- Purpose: full-screen offline recovery.
- Actions: retry → go back / re-sync. **States:** offline detection live.
- Related: all screens (global).

### C17 — Settings (legacy stub)
- `SettingScreen.tsx` · stub (menu shell). Prototype: settings-menu pattern (notifications, language, privacy, about, logout).

### C18 — Messages (legacy stub)
- `MessagesScreen.tsx` · stub. Prototype: messages list pattern (clearly demo content).

### C19 — Email Validations (legacy stub)
- `EmailValidationsScreen.tsx` · legacy-info stub. Prototype: validation/info panel (clearly demo content).

## D. DELIBERATELY NOT REBUILT (dead legacy)

`FormScreen.tsx`, `FormAuthScreen.tsx`, `AppColorsTheme1/3`, duplicate favorites store, custom-IP modal, `No_Network` commented-registration (screen kept).