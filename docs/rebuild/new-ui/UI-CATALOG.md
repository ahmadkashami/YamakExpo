# Yamak New — UI Catalog

**DESIGN STATUS: all entries PROPOSED / NEEDS REVIEW. Nothing is APPROVED until the user approves the Yamak New direction.**
Status scale: `PROPOSED` (designed, unapproved) → `NEEDS REVIEW` (flagged, unapproved) → `APPROVED` (user approved). All prototypes below are initially PROPOSED / NEEDS REVIEW.

Every prototype: self-contained HTML/CSS, browser-open, no JS/npm/build. Screen prototypes (provisional baseline) link `../../prototype-shared/{tokens,base,components}.css`; directions additionally link their `direction-NN.css`.

## A. Authentication (provisional baseline)

| Screen | Legacy source | Prototype | Flow | Status | States covered |
|---|---|---|---|---|---|
| Login | `authScreens/loginScreen.tsx` | `auth/login/index.html` | Auth | PROPOSED | default, validation, API error box, button loading, links |
| Register | `authScreens/registerScreen.tsx` | `auth/register/index.html` | Auth | PROPOSED | default, validation, terms gate, error box, success→OTP link |
| Phone login | `authScreens/authScreen.tsx` | `auth/phone-login/index.html` | Auth | PROPOSED | default, country picker, validation, send-code loading |
| Phone OTP | `authScreens/otpVerificationScreen.tsx` | `auth/phone-otp/index.html` | Auth | PROPOSED | otp boxes, filled/ok, error, resend countdown |
| Email OTP | `authScreens/otpEmailVerificationScreen.tsx` | `auth/email-otp/index.html` | Auth | PROPOSED | otp filled/ok, error, resend countdown |
| Reset OTP | `authScreens/otpResetPasswordScreen.tsx` | `auth/reset-otp/index.html` | Auth | PROPOSED | otp filled/ok, error, resend countdown |
| New password | `authScreens/NewPasswordScreen.tsx` | `auth/new-password/index.html` | Auth | PROPOSED | validation, match rule, success modal → login |
| Forgot password | `components/auth/EmailForgotPassword.tsx` | `auth/forgot-password/index.html` | Auth | PROPOSED | default, validation, error box, success→OTP link |

## B. Onboarding

| Screen | Legacy source | Prototype | Flow | Status | States covered |
|---|---|---|---|---|---|
| Onboarding | `mainScreens/OnBoardingScreen.tsx` | `onboarding/index.html` | First-launch | PROPOSED | carousel, language select, start |

## C. Authenticated area (provisional baseline)

| Screen | Legacy source | Prototype | Flow | Status | States covered |
|---|---|---|---|---|---|
| Home | `HomeScreen.tsx` | `main/home/index.html` | Home | PROPOSED | feed populated, skeleton on-load, section error, offline banner |
| All vehicles | `AllVicelessScreen.tsx` | `main/all-vehicles/index.html` | Browse | PROPOSED | grid+list, filter chips, skeleton, empty, error+retry |
| Vehicle details | `VehiclesDetailsScreen.tsx` | `main/vehicle-details/index.html` | Detail | PROPOSED | hero skeleton (note), populated, favourite toast, offline |
| Map | `MapScreen.tsx` | `main/map/index.html` | Map | PROPOSED | map frame, permission card (location off), marker→detail link |
| Search | `SearchScreen.tsx` | `main/search/index.html` | Search (modal) | PROPOSED | typing, results, no-results, filters |
| Favorites | `FavotiesScreen.tsx` | `main/favorites/index.html` | Saved | PROPOSED | populated, empty state, remove action |
| Notifications | `NotificationsScreen.tsx` | `main/notifications/index.html` | Inbox | PROPOSED | populated, unread badge, empty |
| Profile hub | `ProfileScreen.tsx` | `main/profile/index.html` | Account | PROPOSED | identity card, menu, logout confirm modal |
| Edit profile | `EditProfileScreen.tsx` | `main/edit-profile/index.html` | Account | PROPOSED | form, validation, save success, avatar |
| My cars | `MyCarScreen.tsx` | `main/my-cars/index.html` | Account | PROPOSED | empty add-first, list, add/edit form (sheet) |
| Contact us | `ContactUsScreen.tsx` | `main/contact-us/index.html` | Support | PROPOSED | channels + form, validation, success |
| Privacy & policy | `PrivacyAndPolicyScreen.tsx` | `main/privacy-policy/index.html` | Modal | PROPOSED | static text modal |
| Join us | `JoinUsScreen.tsx` | `main/join-us/index.html` | Modal | PROPOSED | form modal, validation, success |
| About Yamak | `AboutYamakAppScreen.tsx` | `main/about/index.html` | Info | PROPOSED | static |
| FreshChat | `FreshCharScreen.tsx` | `main/fresh-chat/index.html` | Support | PROPOSED | chat panel (demo), offline hint |
| No network | `NoNetworkScreen.tsx` | `main/no-network/index.html` | Global | PROPOSED | full-screen offline + retry |
| Settings | `SettingScreen.tsx` (stub) | `main/settings/index.html` | Account | PROPOSED | menu pattern |
| Messages | `MessagesScreen.tsx` (stub) | `main/messages/index.html` | Inbox | PROPOSED | list pattern (demo content) |
| Email validations | `EmailValidationsScreen.tsx` (stub) | `main/email-validations/index.html` | Info | PROPOSED | info panel (demo) |
| Drawer shell | `DrawerNavigator`+`CustomDrawerContent` | `main/drawer/index.html` | Global | PROPOSED | open drawer over Home, active item |

## D. States showcase

| Page | Maps to | Status |
|---|---|---|
| `showcase/states.html` | all screens (loading/skeleton, empty, error, disabled, selected, validation, success, offline, toast) | PROPOSED |

## E. Visual directions (Phase 1 evaluation set)

| Direction | CSS | Screens (representative) |
|---|---|---|
| 01 Clean / Minimal | `prototype-shared/direction-01.css` | `directions/01-clean/{register,home,vehicles,vehicle-details}.html` |
| 02 Brand-Focused | `prototype-shared/direction-02.css` | `directions/02-brand/{register,home,vehicles,vehicle-details}.html` |
| 03 Premium / Modern | `prototype-shared/direction-03.css` | `directions/03-premium/{register,home,vehicles,vehicle-details}.html` |

Reference (not user-facing): `docs/rebuild/new-ui/prototype-shared/`, `docs/rebuild/new-ui/assets/appLogo.png`.