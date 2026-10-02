# YAMAK MOBILE — 09. BUSINESS RULES

> Rules reverse-engineered from screens, stores, hooks, and API wrappers.
> Evidence: `CONFIRMED` (code seen) | `INFERRED` (deduced) | `UNKNOWN`.
> Numbered `BR-###` for reuse in backlog/plan tasks.

---

## A. Onboarding & app boot

- **BR-001** First launch: if AsyncStorage key `isLunched` missing → set `isFirstLunch=true` in
  `useAppReadyStore` and write `isLunched=true`. Onboarding screen shows only when
  `isFirstLunch === true`. (CONFIRMED `RootFun.getStorageItem`)
- **BR-002** On boot, `RootFun` fetches `app-setting` and stores it in the ready store. (CONFIRMED)
- **BR-003** On boot, iOS app icon is switched to `Ramadan_AppIcon` via `react-native-change-icon`. (CONFIRMED)
- **BR-004** Authenticated shell (`AuthedReadyApp`) inits Freshchat, Sentry, FCM registration, and
  subscribes topic `yamak-all`. (CONFIRMED)

## B. Authentication & session

- **BR-010** Emails must be valid format; passwords min length 8. (CONFIRMED `loginValidationSchema`)
- **BR-011** Register requires: email, name (min 3), valid phone, password (min 8), and terms
  checkbox `isAgreed=true`. (CONFIRMED `registerValidationSchema`)
- **BR-012** Basic-registration posts only `{name, email, phone}` — backend sends an email OTP. (CONFIRMED body shape)
- **BR-013** Phone OTP flow: send code by phone, then verify `{phone, code}`. (CONFIRMED)
- **BR-014** Reset password requires matching confirm password; both min 8. (CONFIRMED `resetPasswordValidationSchema`)
- **BR-015** While authenticated, `fcmToken`/`notificationToken` is pushed to `app-users/profile`
  (two field names used in legacy — confirm backend field). (CONFIRMED)
- **BR-016** Logout clears the persisted `auth` store → returns to Login automatically via token gate. (CONFIRMED)
- **BR-017** Delete account uses `DELETE /app-users/account` (direct `client.delete`). (CONFIRMED)

## C. Data & lists

> ℹ️ **Legacy mechanism vs rebuild mechanism.** The rules below describe legacy *behaviour* and are
> authoritative. Where they name a Zustand store or an AsyncStorage key, that is legacy history:
> the rebuild uses **hook-local state** (`src/hooks/use-*.ts`) and the shared owners
> (`src/location/location-context.tsx`, `src/auth/auth-context.tsx`). Behaviour is preserved; the
> mechanism is not.

- **BR-020** Vehicles are paginated: default `{ page: 1, limit: 10 }`; merged with user location
  (`latitude`, `longitude` from the shared location owner) when fetching the list. ✅ The rebuild
  sends coordinates **only** as a finite `latitude`+`longitude` pair, and sends **no** `limit`
  (server default 10). (CONFIRMED)
- **BR-021** Home screen shows services, adds, and vehicles — each loaded separately. ✅ Implemented
  in the rebuild as three independent hooks with local state; **no** per-section Zustand store.
  (CONFIRMED)
- **BR-022** Favorites are stored LOCALLY as vehicle id array in AsyncStorage key `favorites`
  (no favorites API). (CONFIRMED)
- **BR-023** Favorite actions: add by id (no duplicates de-dup bug in legacy store — rebuild should
  guard duplicates), remove by id, clear all. (CONFIRMED + improvement note)
- **BR-024** Notifications paginated via `page` param on `user-notifications/mine`. (CONFIRMED)
- **BR-025** Provider/vehicle detail loads `vehicles/:id` and available services via
  `services/:id/vehicles`. (CONFIRMED in screens/components)
- **BR-026** My cars: list, add, delete via `user-cars` endpoints. (CONFIRMED)

## D. Requests & support

- **BR-030** Service/roadside request is created via `POST requests` from the vehicle-detail/request flow. (CONFIRMED)
- **BR-031** WhatsApp share text is prefixed: EN `"Hello from yamak app . I need your help with {names}"`,
  AR equivalent; selected service names joined by ` --- `. (CONFIRMED `messages.ts`)
- **BR-032** Contact/Support surfaces: phone links, mail, WhatsApp, Freshchat widget (no backend endpoint). (CONFIRMED)

## E. Localization

- **BR-040** Languages: English (`en`) and Arabic (`ar`). Selected language persisted in AsyncStorage `lang`. (CONFIRMED)
- **BR-041** Service names are localized objects `{ ar, en }` rendered per active language. (CONFIRMED)
- **BR-042** `AppText` right-aligns Arabic text (textAlign left under RTL layout — legacy quirk). (CONFIRMED)

## F. Network & errors

- **BR-050** API calls check connectivity (NetInfo) first; offline → alert `No_internet_connection`. (CONFIRMED)
- **BR-051** Global API errors surface via `AppFlashMessage` (react-native-flash-message) driven by
  `useErrorStore`; auto-dismiss after 3s. (CONFIRMED)
- **BR-052** Special case: backend message `"user not registered"` re-thrown as string (legacy behavior). (CONFIRMED)

## G. Dev-only features

- **BR-060** Custom IP modal lets developers override the API base URL (stored in AsyncStorage `environment`
  as `{ name: "customIp", url }`); shuts off when app reloads in legacy (comment `expo-updates`). (CONFIRMED)

## H. Known legacy defects to FIX in rebuild (not replicate)

- `useFavouriteStoreAsync.addToFavotires` does not de-duplicate → duplicates possible. FIX.
- Drawer item key `"messages"` maps to Notifications screen. FIX naming.
- `register` strips `+` from phone; `registerUser` prepends callingCode — inconsistent. Standardize.
- Two push-notification field names (`fcmToken` vs `notificationToken`). Verify backend and unify.
- `AppCustomIpModal` reload not implemented (comment only). Decide whether to keep feature.
- `EmailValidationsScreen`, `SettingScreen`, `MessagesScreen`, `FormScreen`, `FormAuthScreen` are stubs/legacy — confirm desired scope.