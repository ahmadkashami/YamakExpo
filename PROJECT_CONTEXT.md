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

## Constraints
- `docs/rebuild/EXPO-MIGRATION.md` (in this repo) decides Expo Router replaces `NavigationContainer`/`AuthStackNavigator`/`ScreenNames`; no second React Navigation tree.
- No authenticated Home destination exists yet. Do not invent one.
- Onboarding is not built and is out of scope until an authenticated destination exists.
- Copy, never invent: endpoints and screen behavior come from `docs/rebuild/*` and the legacy source.
- Per Expo SDK 52+ docs, Expo Go does **not** faithfully reproduce the native splash (it shows its own icon window). Splash appearance must be validated on a release build; in Expo Go the gate can only be validated as "no premature render, no crash, no deadlock".
- `src/components/app-tabs.web.tsx` carries a known pre-existing `/explore` typed-route TS error. Report it separately; do not fix it as a side effect of unrelated work.

## Verification
- Step A verified with `npx tsc --noEmit`: exactly one error, the pre-existing `src/components/app-tabs.web.tsx` `/explore` error. No errors in `_layout.tsx`. `git diff --check` clean.
- Step A verified at runtime on Android emulator `emulator-5554` (Android 17) with Expo Go 57.0.9 against Metro 8081, using `uiautomator` view-hierarchy dumps (screenshots are not readable by the agent): 3 cold starts and 3 dev-menu reloads each reached the Register screen with exactly one `Running "main"`, 0 FATAL exceptions, 0 invariant violations, 0 unhandled promise rejections, 0 splash errors. A controlled A/B (change stashed vs restored) showed identical reload behaviour, confirming no regression.
- Known intermittent: one blank-screen dev-menu reload occurred on the first reload after a source edit that forced a Metro rebuild, and did not reproduce across 3 later reloads. Attributed to Expo Go dev-reload flakiness, not the gate.

## Next Approved Step
Awaiting approval, and blocked on two decisions: (1) which route an authenticated user lands on, (2) whether `/register` or a future `/login` is the correct unauthenticated landing target. Candidate next step (Step B): make `src/app/index.tsx` redirect on `status` once an approved authenticated destination exists, then wire `signOut()`. Do not create Home, route groups, onboarding, tabs or drawer before those decisions.
