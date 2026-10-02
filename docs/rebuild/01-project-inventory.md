# Yamak Mobile - Phase 1: Project Inventory

> # ⚠️ LEGACY FUNCTIONAL REFERENCE — NON-CURRENT FOR ARCHITECTURE
>
> This document inventories the legacy **`yamak-mobile`** project, which is **SUPERSEDED**. It is
> retained ONLY as the source of truth for **functionality, business behavior, screens, flows, API
> contracts, validation rules, assets/content, and required native capabilities**.
>
> The active project is **`YamakExpoNew` (Expo + Expo Router)** — see `REBUILD-PLAN.md` §0–§2.
> The inventory below therefore records what legacy **is**, not what the rebuild **should be**.
>
> **Do not copy the legacy architecture described below.** React Navigation, Zustand, axios and
> `react-native-config` appear throughout because that is what legacy *did* — they are historical
> facts, **not** the rebuild's architecture. The rebuild uses **Expo Router file-based routes**,
> **React Context** where shared state is genuinely needed, **SecureStore**, a **fetch**-based HTTP
> client, and **`.env` / `EXPO_PUBLIC_*` / `app.config.ts`**.
>
> Reading rule: every *behaviour* statement below is authoritative; every *implementation*
> statement is historical. Non-current file/folder paths (`src/screens`, `src/apis`, `src/store`,
> `android/`, `ios/`) do **not** exist in the rebuild and must not be recreated.

**Generated:** 2026-09-20  
**Source Repository:** `yamak-mobile`  
**Classification:** CONFIRMED (directly from repository)

---

## 1.1 Project Overview

| Property | Value |
|----------|-------|
| **Project Name** | Yamak Mobile |
| **Package Name** | `yamak-mobile` |
| **Version** | 0.0.1 (package.json) / 2.8 (Android) |
| **React Native Version** | 0.87.1 |
| **React Version** | 19.2.8 |
| **TypeScript Version** | 5.9.3 |
| **Node Engine** | >=18 |
| **Primary Language** | TypeScript/TSX |
| **State Management** | Zustand (v5.0.15) + React Context |
| **Navigation** | React Navigation v7 (Stack, Tabs, Drawer) |
| **API Client** | Axios v1.20.0 with custom interceptors |
| **Internationalization** | i18next v23.16.8 + react-i18next v15.7.4 |
| **UI Components** | Custom + react-native-vector-icons, Lottie |
| **Testing** | Jest + React Test Renderer |

---

## 1.2 Repository Structure

```
yamak-mobile/
├── android/                    # Android native project
│   ├── app/
│   │   ├── build.gradle       # Module-level Gradle config
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml
│   │   │   ├── res/           # Resources (icons, drawables, layouts)
│   │   │   └── java/com/yamak/  # Native Java/Kotlin code
│   ├── build.gradle           # Project-level Gradle config
│   ├── gradle.properties      # Gradle settings
│   ├── settings.gradle
│   └── gradlew / gradlew.bat
├── ios/                       # iOS native project (Xcode workspace)
│   ├── Yamak.xcworkspace/
│   ├── Yamak/
│   │   ├── Info.plist
│   │   ├── AppDelegate.mm
│   │   ├── main.m
│   │   └── LaunchScreen.storyboard
│   └── Podfile (inferred)
├── src/                       # React Native source code
│   ├── apis/                  # API layer (Axios + endpoints)
│   ├── components/            # Reusable UI components
│   │   ├── auth/             # Auth-related components
│   │   ├── home/             # Home screen components
│   │   ├── map/              # Map-related components
│   │   ├── Profile/          # Profile screen components
│   │   ├── ui/               # Generic UI components
│   │   └── vehicleDetails/   # Vehicle detail components
│   ├── constants/             # App constants (colors, sizes, fonts, screens)
│   ├── context/              # React Context providers
│   ├── helpers/              # Utility functions
│   ├── hooks/                # Custom React hooks
│   ├── navigations/          # Navigation configuration
│   ├── notification/         # Push notification handling
│   ├── screens/              # Screen components
│   │   └── authScreens/      # Authentication screens
│   ├── services/             # Third-party service configs
│   │   ├── freshchat/
│   │   └── sentry/
│   ├── store/                # Zustand stores
│   ├── translation/          # i18n configuration
│   ├── types/                # TypeScript types
│   ├── validationSchemas/    # Yup validation schemas
│   └── firebase/             # Firebase config
├── assets/                    # Static assets (referenced in code)
├── __tests__/                 # Test files (if any)
├── .env / .env.development / .env.staging / .env.production
├── app.json                   # Expo/React Native app config
├── babel.config.js
├── package.json
├── tsconfig.json
├── jest.config.js
└── index.js                   # Entry point
```

---

## 1.3 Dependencies Analysis

### 1.3.1 Production Dependencies (package.json)

| Package | Version | Purpose | Source Files Using It | Required for Rebuild | Status |
|---------|---------|---------|----------------------|---------------------|--------|
| `@gorhom/bottom-sheet` | ^5.2.14 | Bottom sheet modals | `RootFun.tsx`, `loginScreen.tsx`, `AuthedReadyApp.tsx` | YES | Active |
| `@invertase/react-native-apple-authentication` | ^2.5.1 | Apple Sign-In | `useSocialAuth.ts`, `auth.config.ts` | YES (iOS only) | Active |
| `@react-native-async-storage/async-storage` | ^3.1.1 | Persistent local storage | `auth.store.ts`, `axios.config.ts`, `AppAsyncStoreage.ts`, `RootFun.tsx`, `CustomDrawerContent.tsx`, `useNotification.ts`, `useAppReady.tsx`, `useSocialAuth.ts` | YES | Active |
| `@react-native-clipboard/clipboard` | ^1.16.3 | Clipboard access | Not found in search | UNKNOWN | Potentially unused |
| `@react-native-community/datetimepicker` | ^9.2.0 | Date/time picker | Not found in search | UNKNOWN | Potentially unused |
| `@react-native-community/geolocation` | ^3.4.0 | Geolocation | Not found in search (uses `react-native-community/geolocation` via hooks) | UNKNOWN | Check hooks |
| `@react-native-community/netinfo` | ^12.0.1 | Network connectivity | `axios.config.ts` (NetInfo) | YES | Active |
| `@react-native-community/push-notification-ios` | ^1.12.0 | iOS push notifications | Not directly imported (uses Firebase messaging) | MAYBE | Legacy support |
| `@react-native-firebase/app` | ^26.4.0 | Firebase core | `firebase.config.tsx`, `useNotification.ts`, `RootFun.tsx` | YES | Active |
| `@react-native-firebase/auth` | ^26.4.0 | Firebase Auth | `auth.config.ts` | YES | Active |
| `@react-native-firebase/messaging` | ^26.4.0 | Firebase Cloud Messaging | `useNotification.ts` | YES | Active |
| `@react-native-google-signin/google-signin` | ^16.1.5 | Google Sign-In | `auth.config.ts`, `useSocialAuth.ts` | YES | Active |
| `@react-native-masked-view/masked-view` | ^0.3.2 | Masked view for animations | Required by react-navigation drawer | YES | Required by nav |
| `@react-navigation/bottom-tabs` | ^7.18.18 | Bottom tab navigation | `TabNavigator.tsx` | YES | Active |
| `@react-navigation/drawer` | ^7.13.10 | Drawer navigation | `DrawerNavigator.tsx`, `drawerStackNavigator.tsx` | YES | Active |
| `@react-navigation/native` | ^7.3.18 | Navigation core | All navigation files, `RootFun.tsx`, `CustomDrawerContent.tsx` | YES | Active |
| `@react-navigation/stack` | ^7.10.24 | Stack navigation | All stack navigators | YES | Active |
| `@sentry/react-native` | ^8.25.0 | Error tracking | `sentry.config.ts`, `useAppReady.tsx`, `android/app/build.gradle` | YES | Active |
| `@tanstack/react-query` | ^5.102.8 | Server state management | `App.tsx` (QueryClientProvider) | YES | Active |
| `axios` | ^1.20.0 | HTTP client | `axios.config.ts`, all API files | YES | Active |
| `firebase` | ^12.18.0 | Firebase JS SDK | `firebase.config.tsx` | YES | Active |
| `formik` | ^2.4.9 | Form handling | All auth screens, `NewPasswordScreen.tsx` | YES | Active |
| `i18next` | ^23.16.8 | Internationalization core | `Translation.config.ts`, `App.tsx` | YES | Active |
| `lottie-react-native` | ^7.5.0 | Lottie animations | `LottieAnimation.tsx`, `LoadingLootie.tsx`, various screens | YES | Active |
| `react` | 19.2.8 | React core | Everywhere | YES | Active |
| `react-content-loader` | ^7.1.2 | Skeleton loading | Not found in search | UNKNOWN | Potentially unused |
| `react-error-boundary` | ^4.1.2 | Error boundaries | `App.tsx` (ErrorHandler), `ErrorHandler.tsx` | YES | Active |
| `react-i18next` | ^15.7.4 | React i18n binding | `Translation.config.ts`, `App.tsx`, many screens | YES | Active |
| `react-native` | 0.87.1 | React Native core | Everywhere | YES | Active |
| `react-native-bouncy-checkbox` | ^4.1.4 | Animated checkbox | `registerScreen.tsx` | YES | Active |
| `react-native-change-icon` | ^5.0.0 | Dynamic app icon | `RootFun.tsx`, `HomeScreen.tsx` | YES | Active |
| `react-native-config` | ^1.7.2 | Environment config | `CommonConsstats.ts`, `axios.config.ts`, `freshchat.config.ts`, `sentry.config.ts`, Android gradle | YES | Active |
| `react-native-country-picker-modal` | ^2.0.0 | Country picker modal | `CountryPicker.tsx` | YES | Active |
| `react-native-country-picker-modal-dots` | ^2.0.9 | Country picker variant | Not directly imported | UNKNOWN | Duplicate? |
| `react-native-device-info` | ^15.0.2 | Device information | `CommonConsstats.ts` (getVersion, getBuildNumber) | YES | Active |
| `react-native-flash-message` | ^0.4.2 | Flash/toast messages | Most screens, `useNotification.ts` | YES | Active |
| `react-native-freshchat-sdk` | ^4.8.1 | Freshchat support | `freshchat.config.ts`, `AuthedReadyApp.tsx`, `ProfileStack.tsx` | YES | Active |
| `react-native-gesture-handler` | ^2.32.0 | Gesture handling | `RootFun.tsx`, `VehiclesDetailsScreen.tsx`, navigation | YES | Active |
| `react-native-keyboard-aware-scroll-view` | ^0.9.5 | Keyboard avoidance | All auth screens, `SearchScreen.tsx`, `NewPasswordScreen.tsx` | YES | Active |
| `react-native-linear-gradient` | ^2.8.3 | Linear gradients | Not found in search | UNKNOWN | Potentially unused |
| `react-native-localize` | ^3.7.0 | Device locale detection | `LnguageDetector.ts` | YES | Active |
| `react-native-maps` | ^1.29.0 | Google Maps | `Map.tsx`, `MapScreen.tsx`, `ViewMap.tsx` | YES | Active |
| `react-native-modal` | ^13.0.1 | Modal component | Not found in search (uses @gorhom/bottom-sheet) | UNKNOWN | Potentially unused |
| `react-native-onboarding-swiper` | ^1.4.0 | Onboarding flow | `OnBoardingScreen.tsx` | YES | Active |
| `react-native-otp-textinput` | ^1.1.7 | OTP input component | `otpEmailVerificationScreen.tsx`, `otpResetPasswordScreen.tsx` | YES | Active |
| `react-native-permissions` | ^5.6.1 | Runtime permissions | Not found in search | UNKNOWN | Potentially unused |
| `react-native-push-notification` | ^8.1.1 | Push notifications (legacy) | `useNotification.ts` (with Firebase) | YES | Active (hybrid) |
| `react-native-reanimated` | ^4.6.0 | Animations | `RootFun.tsx`, `babel.config.js` (plugin) | YES | Active |
| `react-native-restart` | ^0.0.29 | App restart | `loginScreen.tsx`, `OnBoardingScreen.tsx` | YES | Active |
| `react-native-safe-area-context` | ^5.9.1 | Safe area insets | Required by navigation | YES | Required by nav |
| `react-native-screens` | ^4.27.0 | Native screen optimization | Required by navigation | YES | Required by nav |
| `react-native-share` | ^11.1.0 | Share sheet | `CustomDrawerContent.tsx` | YES | Active |
| `react-native-shimmer-placeholder` | ^2.0.9 | Shimmer placeholders | Placeholder components | YES | Active |
| `react-native-splash-screen` | ^3.3.0 | Splash screen control | `useAppReady.tsx` | YES | Active |
| `react-native-svg` | ^15.15.5 | SVG support | `appIcon.tsx`, vector icons | YES | Active |
| `react-native-toast-message` | ^2.5.0 | Toast messages | `App.tsx` | YES | Active |
| `react-native-url-polyfill` | ^4.0.0 | URL polyfill | `App.tsx`, `AppHelpers.ts` | YES | Active |
| `react-native-vector-icons` | ^10.3.0 | Icon fonts | `appIcon.tsx`, `AppIcon` component, everywhere | YES | Active |
| `react-native-worklets` | ^0.12.1 | Reanimated worklets | `babel.config.js` | YES | Required by reanimated |
| `yup` | ^1.7.1 | Schema validation | `loginSchema.ts`, all Formik forms | YES | Active |
| `zustand` | ^5.0.15 | State management | All store files, many screens | YES | Active |

### 1.3.2 Development Dependencies

| Package | Version | Purpose | Required for Rebuild |
|---------|---------|---------|---------------------|
| `@babel/core` | ^7.29.7 | Babel core | YES |
| `@babel/preset-env` | ^7.29.7 | Babel preset | YES |
| `@babel/runtime` | ^7.29.7 | Babel runtime | YES |
| `@react-native-community/cli` | ^20.2.0 | React Native CLI | YES |
| `@react-native/babel-preset` | 0.87.1 | RN Babel preset | YES |
| `@react-native/eslint-config` | 0.87.1 | ESLint config | YES |
| `@react-native/jest-preset` | 0.87.1 | Jest preset | YES |
| `@react-native/metro-config` | 0.87.1 | Metro config | YES |
| `@tsconfig/react-native` | ^3.0.9 | TS config base | YES |
| `@types/react` | ^19.2.18 | React types | YES |
| `@types/react-native-vector-icons` | ^6.4.18 | Vector icons types | YES |
| `@types/react-test-renderer` | ^19.1.0 | Test renderer types | YES |
| `babel-jest` | ^29.7.0 | Jest Babel transform | YES |
| `eslint` | ^8.57.0 | Linting | YES |
| `jest` | ^29.7.0 | Testing | YES |
| `patch-package` | ^8.0.1 | Patching node_modules | YES (postinstall) |
| `prettier` | ^3.9.6 | Code formatting | YES |
| `react-native-svg-transformer` | ^1.5.3 | SVG import transformer | YES |
| `react-test-renderer` | 19.2.8 | Test renderer | YES |
| `typescript` | ^5.9.3 | TypeScript compiler | YES |

---

## 1.4 Native Configuration

### 1.4.1 Android

| File | Key Configuration |
|------|-------------------|
| `android/build.gradle` | compileSdk=37, targetSdk=36, minSdk=24, NDK=28.2.13676358, Kotlin=2.2.0, Google Services=4.5.0 |
| `android/app/build.gradle` | 3 flavors: production (com.yamak.mobapp), staging (com.yamak.mobstaging), development (com.yamak.mobdev); versionCode=15, versionName=2.8; react-native-config integration; Sentry gradle plugin; Google Services plugin |
| `android/app/src/main/AndroidManifest.xml` | Permissions: INTERNET, ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION, POST_NOTIFICATIONS; Deep links: `yamak://`, `https://yamak-kw.com`, `https://yamak.page.link.com`; Google Maps API key; Activity aliases for dynamic icons |
| `android/gradle.properties` | newArchEnabled=true, hermesEnabled=true, edgeToEdgeEnabled=true, gradle.jvmargs=-Xmx4096m |

### 1.4.2 iOS

| File | Key Configuration |
|------|-------------------|
| `ios/Yamak/Info.plist` | CFBundleDisplayName=Yamak; Alternate icons (Ramadan_AppIcon, defualt_AppIcon); Google Sign-In URL scheme; Deep links: `yamak://`, `https://yamak-kw.com`; Permissions: Camera, Location (always/when in use), Photo Library; UIAppFonts (28 font files); Background modes: fetch, remote-notification; NSAppTransportSecurity exception for localhost |

---

## 1.5 Environment Configuration

| File | Variables |
|------|-----------|
| `.env` | (base - likely empty or shared) |
| `.env.development` | NODE_ENV=development, IOS_CLIENT_ID, ANDROID_CLIENT_ID, WEB_CLIENT_ID, API_URL=http://localhost:8000/api/mobile/v1/ |
| `.env.staging` | NODE_ENV=staging, same Google Client IDs, API_URL=https://yamak-kw.com/api/mobile/v1/ |
| `.env.production` | NODE_ENV=production, same Google Client IDs, API_URL=https://yamak-kw.com/api/mobile/v1/ |

**Note:** Google Client IDs are identical across environments (CONFIRMED). Freshchat and Sentry configs also use `react-native-config` (Config.FRESHCHAT_APPI_ID, Config.FRESHCHAT_APP_KEY, Config.SENTRY_DSN).

---

## 1.6 Key Source Files Map

| Category | Files |
|----------|-------|
| **Entry Point** | `index.js` → `App.tsx` → `RootFun.tsx` |
| **Root Navigation** | `RootFun.tsx`, `AuthedReadyApp.tsx` |
| **Auth Navigation** | `AuthStackNavigator.tsx` |
| **Main App Navigation** | `drawerStackNavigator.tsx`, `DrawerNavigator.tsx`, `TabNavigator.tsx`, `HomeStackNAvigator.tsx`, `ProfileStack.tsx`, `StackNAvigaator.tsx` |
| **Auth Screens** | `loginScreen.tsx`, `registerScreen.tsx`, `authScreen.tsx`, `otpVerificationScreen.tsx`, `otpEmailVerificationScreen.tsx`, `otpResetPasswordScreen.tsx`, `NewPasswordScreen.tsx`, `EmailValidationsScreen.tsx` |
| **Main Screens** | `HomeScreen.tsx`, `MapScreen.tsx`, `ProfileScreen.tsx`, `VehiclesDetailsScreen.tsx`, `SearchScreen.tsx`, `OnBoardingScreen.tsx`, `NotificationsScreen.tsx`, `FavotiesScreen.tsx`, `MyCarScreen.tsx`, `EditProfileScreen.tsx`, `ContactUsScreen.tsx`, `PrivacyAndPolicyScreen.tsx`, `JoinUsScreen.tsx`, `AboutYamakAppScreen.tsx`, `FreshCharScreen.tsx`, `AllVicelessScreen.tsx`, `SettingScreen.tsx`, `FormScreen.tsx`, `FormAuthScreen.tsx`, `MessagesScreen.tsx`, `NoNetworkScreen.tsx` |
| **API Layer** | `axios.config.ts`, `Auth.api.ts`, `services.api.ts`, `vehicles.api.ts`, `common.api.ts`, `users.api.ts`, `userCars.api.ts`, `requests.api.ts`, `apisPath.ts` |
| **State Stores** | `auth.store.ts`, `appReady.store.ts`, `services.store.ts`, `vehicles.store.ts`, `adds.store.ts`, `userLocation.store.ts`, `Favorites.store.ts`, `AppError.store.ts` |
| **Constants** | `Colors.ts`, `ScreenNames.ts`, `CommonConsstats.ts`, `Sizes.ts`, `fonts.ts`, `data.ts`, `languages.ts`, `messages.ts`, `AppImgs.ts`, `queryClient.constants.ts` |
| **Hooks** | `useNotification.ts`, `useSocialAuth.ts`, `useAppReady.tsx`, `useFetch.hook.ts`, `useFetchV2.ts`, `useFetchById.hook.ts`, `userCurrentLocation.ts`, `UseCurrentLocation.ts`, `useLanguage.hook.ts`, `useEnvAndSetting.tsx`, `useCounter.ts` |
| **Services** | `freshchat.config.ts`, `sentry.config.ts`, `auth.config.ts` |
| **Components** | 50+ component files across ui/, auth/, home/, Profile/, map/, vehicleDetails/, placeHolders/ |

---

## 1.7 External Integrations

| Integration | Purpose | Configuration Location |
|-------------|---------|----------------------|
| **Firebase** | Auth, Messaging, Analytics | `firebase.config.tsx`, `auth.config.ts`, `useNotification.ts`, `android/app/build.gradle`, `ios/Yamak/Info.plist` |
| **Google Sign-In** | Social authentication | `auth.config.ts`, `useSocialAuth.ts`, `.env` files |
| **Apple Sign-In** | Social authentication (iOS) | `auth.config.ts`, `useSocialAuth.ts`, `ios/Yamak/Info.plist` |
| **Google Maps** | Map display, location | `Map.tsx`, `AndroidManifest.xml` (API key), `ios/Yamak/Info.plist` |
| **Freshchat** | In-app customer support | `freshchat.config.ts`, `AuthedReadyApp.tsx` |
| **Sentry** | Error tracking | `sentry.config.ts`, `useAppReady.tsx`, `android/app/build.gradle` (Sentry gradle plugin) |
| **React Native Config** | Environment variables | `.env*` files, `android/app/build.gradle` (dotenv.gradle) |
| **React Native Change Icon** | Dynamic app icons | `RootFun.tsx`, `HomeScreen.tsx`, `AndroidManifest.xml` (activity-alias), `ios/Yamak/Info.plist` (alternate icons) |

---

## 1.8 Build Variants

| Variant | Application ID | Environment File | Use Case |
|---------|----------------|------------------|----------|
| `productionDebug` / `productionRelease` | `com.yamak.mobapp` | `.env.production` | Production builds |
| `stagingDebug` / `stagingRelease` | `com.yamak.mobstaging` | `.env.staging` | Staging/QA builds |
| `developmentDebug` / `developmentRelease` | `com.yamak.mobdev` | `.env.development` | Development builds |

---

## 1.9 Permissions

| Platform | Permissions |
|----------|-------------|
| **Android** | INTERNET, ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION, POST_NOTIFICATIONS |
| **iOS** | Camera, Location (Always + When In Use), Photo Library, Background Modes (fetch, remote-notification) |

---

## 1.10 Deep Links

| Scheme/Host | Platform | Purpose |
|-------------|----------|---------|
| `yamak://` | Android + iOS | Custom app scheme |
| `https://yamak-kw.com` | Android + iOS | Website deep links |
| `https://yamak.page.link.com` | Android + iOS | Firebase Dynamic Links |
| `com.googleusercontent.apps.899706158244-...` | iOS only | Google Sign-In callback |

---

## 1.11 Known Issues / Technical Debt

| Issue | Location | Severity |
|-------|----------|----------|
| Duplicate country picker packages | `package.json` | Low |
| `react-native-modal` may be unused | `package.json` | Low |
| `react-native-linear-gradient` may be unused | `package.json` | Low |
| `react-native-content-loader` may be unused | `package.json` | Low |
| `react-native-permissions` may be unused | `package.json` | Low |
| `react-native-community/push-notification-ios` legacy | `package.json` | Medium (Firebase used) |
| Typo in `defualt_AppIcon` (should be `default`) | `ios/Yamak/Info.plist` | Low |
| `StackNAvigaator.tsx` typo in filename | `navigations/` | Low |
| `FavotiesScreen.tsx` typo in filename | `screens/` | Low |
| `AllVicelessScreen.tsx` typo in filename | `screens/` | Low |
| `CommonConsstats.ts` typo in filename | `constants/` | Low |
| `appCurrentVersion` vs `appVersion` inconsistency | `CommonConsstats.ts` vs `CustomDrawerContent.tsx` | Low |

---

## 1.12 Required for Rebuild Summary

**MUST HAVE (Core):**
- React Native 0.87+, React 19, TypeScript 5.9
- Navigation: Stack, Tabs, Drawer (React Navigation v7)
- State: Zustand + AsyncStorage persistence
- API: Axios with interceptors, TanStack Query
- Auth: Email/password, Google, Apple, Phone OTP
- Maps: react-native-maps + Google Maps API
- Notifications: Firebase Messaging + react-native-push-notification
- i18n: i18next (English + Arabic with RTL)
- Environment: react-native-config (3 flavors)
- Sentry, Freshchat, Dynamic Icons

**SHOULD VERIFY (May Be Removed):**
- `react-native-modal`, `react-native-linear-gradient`, `react-native-content-loader`, `react-native-permissions`, `react-native-community/push-notification-ios`, `react-native-country-picker-modal-dots`, `@react-native-clipboard/clipboard`, `@react-native-community/datetimepicker`, `@react-native-community/geolocation`

**NATIVE CONFIG REQUIRED:**
- Android: 3 flavors, Google Services, Sentry Gradle, Maps API key, Dynamic icons
- iOS: Alternate icons, Google Sign-In URL scheme, Deep links, Permissions, 28 font files