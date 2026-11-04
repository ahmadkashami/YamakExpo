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

- **BR-030** Current canonical create is authenticated `POST /api/mobile/v1/requests`. B2.5A
  decisions approved; extension is NOT IMPLEMENTED. All channels app/whatsapp/phone create tracked
  requests; channel is separate from status and from platform (technical client, retained).
- **BR-030A — Approved target:** every new request persists selected vehicle and fresh customer
  latitude/longitude, request-time snapshots (recommended decimal(10,7)). Refresh via the existing
  UserLocationProvider; denied/unavailable/timed-out/invalid blocks creation. No stale-memory reuse.
  Never fabricate location; reject both-zero pair, do not reject an individual zero merely for being zero.
- **BR-030B — Lifecycle:** app pending → accepted → completed; WhatsApp/phone contact_initiated →
  accepted → completed. pending/contact_initiated → cancelled; accepted → not_completed/cancelled.
  No contact_initiated → pending normal flow. completed/not_completed/cancelled terminal, no normal
  reopening; later correction requires controlled transitions and history. No additional statuses.
- **BR-030C — Fixed reasons:** both not_completed/cancelled require reasonCodes array, minimum one,
  distinct, all approved catalog values; multi-select. other requires reasonNote; otherwise note
  optional/normally null. Fixed codes replace free-text-only reasons and attach to history via a
  relational catalog/pivot, enabling deterministic reporting by provider/company/channel. Full ten-code
  catalog/Arabic meanings: PROJECT_CONTEXT.md §B2.5A DECISION CLOSURE; no silent code renaming.
- **BR-030D — Tracking:** create transaction includes request, services pivot, idempotency claim,
  initial history. Fingerprint v2 = user + vehicle + driver + sorted services + channel, excluding GPS.
  External opening only after persistence; failure keeps contact_initiated, shows future UI error,
  no automatic duplicate, handoff status or history event. External effects do not control DB atomicity.
- **BR-030E — Privacy:** provider sees no coordinates before acceptance; afterwards requires BOTH
  per-request authorization and eligible state. Authentication alone insufficient. Admin needs admin
  authorization; customer sees own request. Dedicated Mobile and Dashboard resources; no shared leakage.
  Provider actions/auth remain future, excluded from B2.5B–F. Admin transitions require one controlled
  domain/service path validating transitions/reasons and persisting history.
- **BR-030F — Compatibility/read safety:** future historical active → pending, channel → app,
  coordinates NULL, vehicle_id NULL unless reliably known. Never fabricate historical lifecycle/reasons.
  Canonical future v1 list/detail owner-scoped to authenticated app_user_id, foreign detail 404.
  **KNOWN SECURITY GAP — NOT EXPOSED AS B3 YET:** current v1 index can return all requests; correct
  before My Requests. B3 later. MVP uses ServiceRequest.id; lifecycle notifications deferred to FCM work.
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
