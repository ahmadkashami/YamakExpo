# Yamak New — Application Flow (Information Architecture)

**DESIGN STATUS: PROPOSED — REQUIRES USER REVIEW AND APPROVAL.**
Faithful to legacy navigators: `AuthStackNavigator` (initial Login), `StackNAvigaator` (`MainNavigaator`), `DrawerNavigator` + `CustomDrawerContent`, `TabNavigator`, `HomeStackNAvigator`, `ProfileStack`.

```
App (token gate: no auth → AuthStack · auth → Main)
│
├── AUTHENTICATION ────────── AuthStackNavigator (initial: Login)
│   ├── Login  ──────────────► Forgot password (A08 component)
│   │                         └─► Register ──► Email OTP (A05)
│   ├── Phone login (A03) ──► Phone OTP (A04)
│   ├── Forgot password ────► Reset OTP (A06) ──► New password (A07) ──► Login ✓
│   └── (Email OTP target from Register)
│   ▲ success + token persisted → Main
│
├── ONBOARDING ────────────── first-launch gate (carousel + language picker)
│
└── AUTHENTICATED ─────────── MainNavigaator (stack)
    ├── DrawerNavigator
    │    ├─ Home  (TabNavigator)┐
    │    │     ├─ Home   tab → HomeStackNavigator
    │    │     │      Home (C01)  ──► Vehicle Details (C03)
    │    │     │      Home ──► All Vehicles (C02) ──► Vehicle Details (C03)
    │    │     │      Home ─► Search (C05, modal ─► Vehicle Details)
    │    │     ├─ Map    tab → C04 (marker ──► Vehicle Details)
    │    │     └─ Profile tab → ProfileStack────────────────────┐
    │    ├─ Profile            (drawer screen ──► ProfileScreen)│
    │    ├─ Favorites (C06, drawer screen ──► Vehicle Details)  │
    │    └─ Messages/Notifications (C07, drawer screen)         │
    │                                                           │
    └─ ProfileStack (reachable from Profile tab AND shared screens)
         ├─ Profile (C08)
         ├─ Edit Profile (C09) · My Cars (C10) ─► car form
         ├─ Notifications (C07) · Favorites (C06)
         ├─ Contact Us (C11) · Join Us (C13, transparentModal)
         ├─ About Yamak (C14) · FreshChat (C15) · Settings (C17)
         └─ Privacy & Policy (C12, modal)
```

## Global cross-cutting screens

- **No Network (C16):** reached globally when NetInfo is down; offline banner preview; full screen when an unreachable route is attempted.
- **Modals / sheets (proposed treatment):** Privacy & Policy, Join Us, Search — presented from bottom, cover tab bar, labelled actions (HIG).
- **Drawer:** brand header (avatar + name + online), items Home · Profile · Favorites · Messages/Notifications, footer Share · Sign out · Version.

## Primary user flows (from `10-user-flows.md`, consolidated)

1. **Sign up:** Login → Register → Email OTP → (main).
2. **Phone auth:** Login → Phone login → Phone OTP → (main).
3. **Reset password:** Login → Forgot password → Reset OTP → New password → Login.
4. **Browse:** Home → (Services | Adds | Vehicles) → /All vehicles → Vehicle details.
5. **Search:** Home → Search(modal) → filters → Vehicle details.
6. **Profile & settings:** Profile → Edit profile / My cars / Notifications / Favorites / Contact / Join / About / FreshChat / Settings.
7. **Offline:** any flow → No Network banner/screen → retry.