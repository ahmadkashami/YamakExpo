# Yamak New — Navigation System

**DESIGN STATUS: PROPOSED — REQUIRES USER REVIEW AND APPROVAL.**
Derived from the real legacy navigators (`AuthStackNavigator`, `StackNAvigaator`, `DrawerNavigator`, `TabNavigator`, `HomeStackNAvigator`, `ProfileStack`, `CustomDrawerContent`).

## 1. Hierarchy (provisional baseline matches legacy flows)

```
Root gate (token) 
 ├─ AuthStack        Login · Register · Phone login · Phone OTP · Email OTP ·
 │                   Reset OTP · New Password · Forgot password
 └─ MainNavigaator (stack)
     ├─ drawerNav → Drawer
     │    ├─ Home (TabNavigator)   ← 3 tabs: Home | Map | Profile
     │    ├─ Profile
     │    ├─ Favorites
     │    └─ Messages/Notifications
     ├─ profile stack children      ← pushes from Profile tab: Notification,
     │                                Edit Profile, Privacy (modal), Favorites,
     │                                Contact us, My cars, Join us (transparentModal),
     │                                About, FreshChat
     └─ Privacy & Policy (modal, top-level)
```

## 2. App bars / headers (proposed)

| Screen | Header treatment |
|---|---|
| Auth screens | Brand-led header (logo + optional back chevron, direction-aware). *Replace* the legacy 28%-blue-slab header. |
| Home | App bar: drawer/menu left, brand logo center (or title), action right (map pin / notifications). Legacy put logo in header right + map left — proposal: single coherent app bar. |
| Tab children (Map, Profile) | App bar title + action; tab bar remains anchored (HIG: keep persistent). |
| Pushed screens (details, lists, edit) | Back‑chevron + screen title + one action max (HIG). |
| Modal screens (Privacy, Search, Join us) | Sheet/modal from bottom (HIG), grab handle, title + Cancel/action; modal covers tab bar. |

## 3. Bottom tab bar (proposed)

- 3 tabs: **Home · Map · Profile** (real legacy tabs).
- Icon + label (HIG: labels help); active = deep blue + gold indicator dot, inactive muted.
- Badge on notifications count (`.count`) — only for critical info (HIG).
- **Do not** use color-only active state: icon+label+dot.
- Height 56–64 + bottom safe inset.

## 4. Drawer (proposed)

- Legacy drawer had *5 drawer entries* (Home, Profile, Favorites, Messages) + custom header + share/logout footer + version.
- Proposal: drawer = brand header (avatar, name, online status), entries Home · Profile · Favorites · Messages, footer Share · Sign out · Version. Active item = gold tinted bar with gold left edge; **not** full gold block with white text (legacy contrast was borderline).
- Keep behaviour identical to legacy.

## 5. RTL / LTR correctness

- Back chevron reflects reading direction (already in legacy `GoBackButton`) — retain.
- Modal dismiss buttons labelled (Cancel), not bare `✕` in forms (HIG).
- Pushes transition with direction; maps must mirror properly.

## 6. Deep-link / auth gating

- Token gate: no token → AuthStack(initial Login); token → Main. Same as legacy; session persisted (`auth.store`).
- Onboarding: legacy gate lives at startup/first-launch (OnBoarding charge); keep proposed order (Auth → first-launch onboarding gate per plan §2/UF docs).