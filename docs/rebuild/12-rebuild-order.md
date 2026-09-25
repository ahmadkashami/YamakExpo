# YAMAK MOBILE — 12. REBUILD ORDER (SEQUENCING)

> This defines the ORDER of the rebuild and WHY. Strategy: ONE SCREEN AT A TIME,
> infrastructure added ONLY when the current screen requires it (JUST-IN-TIME).
> Full detail for each screen lives in `13-SCREEN-BY-SCREEN-REBUILD-PLAN.md`.

---

## Guide to reading this section

- Phase → group of steps that together deliver a runnable milestone.
- Each phase ends with a checkpoint ("app installs/runs/builds/works").
- Do NOT start the next phase until the previous checkpoint passes.

## Phase 0 — Foundations (no UI)
| Order | Task | Rationale |
|---|---|---|
| 1 | YAMAK-SETUP-001 Create RN TS project | Everything runs on this |
| 2 | SETUP-002 env + react-native-config + flavors | Every config depends on it |
| 3 | SETUP-003 design tokens | First UI needs tokens (Login) |
| 4 | SETUP-004 assets (logo/fonts/lottie) | Branding must exist before UI |
| 5 | SETUP-005 i18n | Login text is bilingual |
| 6 | SETUP-006 axios client | First API call needs it |
| 7 | SETUP-007 auth store + token gate | Login persists token through it |
| 8 | SETUP-012 splash/branding | App polish baseline |
| 9 | NATIVE-010 linking (icons/fonts) | Icons/fonts used everywhere |

Checkpoint: `npx react-native run-android` / `run-ios` shows blank app, no crash,
env loaded, tokens render.

## Phase 1 — Authentication flow (unauthenticated area)
| Order | Task | Rationale |
|---|---|---|
| 10 | SETUP-008 NavigationContainer + AuthStack | Login needs a root |
| 11 | **YAMAK-SCREEN-001 Login** (email+password) | Primary unlock; feeds token gate |
| 12 | SCREEN-002 Register | Signup contract |
| 13 | SCREEN-008 Forgot-password form | Reset entry point |
| 14 | SCREEN-006 Reset OTP | Uses `check-reset-password` |
| 15 | SCREEN-007 New password | Final reset step |
| 16 | SCREEN-003 Phone login | Alternative auth |
| 17 | SCREEN-004 Phone OTP | Completes phone auth |
| 18 | SCREEN-005 Email OTP | Completes signup |
| 19 | SETUP-009 global error toast | All auth screens show errors |

Checkpoint: full auth cycle works against `https://yamak-kw.com/api/mobile/v1/`
(login, register+email OTP, phons OTP, reset), token persists across restart,
logout returns to auth.

> NOTE: Login is fully documented (below) but the user explicitly said DO NOT
> implement Login or About Us in this pass — so the FIRST IMPLEMENTATION may start
> with SCREEN-002 Register or SCREEN-009 Onboarding instead, per user choice.

## Phase 2 — App shell (authenticated area)
| Order | Task | Rationale |
|---|---|---|
| 20 | SETUP-010 DrawerStack + onboarding flag | First authenticated screen |
| 21 | SCREEN-009 Onboarding | First-launch gate |
| 22 | SETUP-011 TabNavigator + CustomDrawerContent | Tabs needed for Home/Map/Profile |
| 23 | SCREEN-016 Profile hub (minimal) | Third tab content; user object display |
| 24 | NATIVE-004 FCM + `AuthedReadyApp` wiring | Authenticated shell standard features |

Checkpoint: after login, app lands in drawer/tabs; onboarding shows once; FCM token registered.

## Phase 3 — Home & data (P0 features)
| Order | Task | Rationale |
|---|---|---|
| 25 | YAMAK-UI-001..008 shared UI kit | Home needs cards/buttons/loaders |
| 26 | SCREEN-010 Home | Main content screen |
| 27 | SCREEN-011 All vehicles | "See more" target |
| 28 | SCREEN-012 Vehicle details | Detail + requests |

Checkpoint: services/adds/vehicles render from backend; tapping vehicle opens details; request POST works.

## Phase 4 — Map & location
| Order | Task |
|---|---|
| 29 | NATIVE-005 Maps SDK + API key |
| 30 | userLocation capture (store + AsyncStorage) |
| 31 | SCREEN-013 Map |

Checkpoint: map shows nearby providers from real location; service filter works.

## Phase 5 — Profile extensions
| Order | Task |
|---|---|
| 32 | SCREEN-017 Edit profile |
| 33 | SCREEN-018 My cars |
| 34 | SCREEN-015 Notifications |
| 35 | SCREEN-020 Privacy & policy |

## Phase 6 — Secondary screens
| Order | Task |
|---|---|
| 36 | SCREEN-014 Favorites (UI ordering may be earlier; depends on backend emptiness) |
| 37 | SCREEN-019 Contact us |
| 38 | SCREEN-021 Join us |
| 39 | SCREEN-024 No network | 
| 40 | NATIVE-006 Freshchat → SCREEN-023 |
| 41 | SCREEN-022 About Yamak (PLANNED ONLY — not implemented per directive) |

## Phase 7 — Optional / stubs (user decision)
| Order | Task |
|---|---|
| 42 | SCREEN-027 Search (stub → full) |
| 43 | SCREEN-025 Settings |
| 44 | SCREEN-026 Messages |
| 45 | SCREEN-028 Email validations |
| 46 | NATIVE-008 alternate icons, NATIVE-009 deep links, NATIVE-007 Sentry |
| 47 | SCREEN-029 Form/FormAuth → SKIP (legacy) |

## Final validating order (SDLC-style)

1. Setup env/config/tokens/assets (Phase 0)
2. Auth done end-to-end (Phase 1)
3. Shell + onboarding (Phase 2)
4. Home→AllVehicles→Detail→Request (Phase 3)
5. Map (Phase 4)
6. Profile family (Phase 5)
7. Secondary (Phase 6)
8. Optional (Phase 7)

## Key dependency rules (validated in `14-REBUILD-READINESS-REPORT.md`)

- No screen starts before its listed `Depends` tasks.
- Auth must be complete before any authenticated screen (token gate).
- `TabNavigator` must exist before Home/Map/Profile screens.
- Native SDK tasks gate the screens that use them (Maps, Freshchat, Google/Apple Sign-In).
- Stub/legacy screens are P3 and must not block P0/P1.
- Copy, never invent: all endpoints/params shared from `04-api-catalog.md`.