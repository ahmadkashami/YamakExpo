# YAMAK MOBILE — PROJECT STRUCTURE LEARNING GUIDE

> Purpose: teach the learner the project's folder layout and WHY it exists, so that during
> the rebuild each new folder is introduced with understanding (JUST-IN-TIME).
> Written for a senior backend dev who is NEW to React Native.

---

## 1. The big picture

A React Native app is a JavaScript application running inside a native shell. The
`screens` = pages, `components` = reusable UI parts, `navigations` = route wiring,
`store` = shared state, `apis` = network layer, `helpers` = storage/utilities,
`hooks` = reusable logic, `constants` = design tokens + config, `translation` = i18n.

```
yamak-mobile/
├─ App.tsx               ← native entry: registers the app root
├─ index.js              ← bootstrap (register component)
├─ src/                  ← ALL our JS lives here
├─ android/  ios/        ← native shells (touched only for native config/features)
├─ .env*                 ← environment values injected at build
└─ assets/  (app icons, fonts)
```

## 2. Folder-by-folder (what each teaches)

### `src/navigations/` — ROUTING
React Navigation organizes screens into Stack (push/back), Drawer (side menu),
Tabs (bottom bar). Nested = screens appear inside screens.

Learning point: you NEVER render screens manually — you register them in a navigator
and call `navigation.navigate('Name')`. Names come from `constants/ScreenNames.ts`.

### `src/screens/` — PAGES
One file = one screen = one full-page UI. Auth screens live in `authScreens/` subfolder.
Each screen composes components, calls hooks/apis, and handles navigation.

### `src/components/` — REUSABLE UI
- `ui/` → design-system primitives (AppText, AppIcon, buttons, inputs, loaders).
- `home/`, `map/`, `Profile/`, `vehicleDetails/`, `favorites/`, `auth/` → screen-specific blocks.
- `placeHolders/` → skeleton/loading states.
- `Models/` → custom modal components (`CodeAuthModel`, `LaguageModel`).
Learning point: if you use a block twice, move it here.

### `src/store/` — SHARED STATE (Zustand)
Global state without prop-drilling:
- Persisted (`persist` + AsyncStorage): `auth` (token+user), `favorites`.
- In-memory: `services`, `vehicles`, `adds`, `userLocation`, `appReady`, `appError`.
Learning point: store only what MANY screens share (token, favorites); screen-local UI state
stays in the component (`useState`).

### `src/apis/` — NETWORK LAYER
- `axios.config.ts` → single client + interceptors (attach Bearer token, language, offline guard).
- `<feature>.api.ts` → one function per endpoint (`login()`, `getAllVehicles()`).
Learning point: screens never call axios directly; they call feature functions.

### `src/helpers/` — PLUMBING
- `AppAsyncStoreage.ts` → typed AsyncStorage get/set helpers.
- `AuthedReadyApp.tsx` → authenticated shell init (notifications, location, SDKs).
- `LnguageDetector`, `Scalling`, `AppHelpers`.

### `src/hooks/` — REUSABLE LOGIC
Custom hooks bundle state + effects: `useFetch.hook.ts` (fetch wrapper),
`useSocialAuth.ts` (Google/Apple), `userCurrentLocation` (geolocation),
`useLanguage`, `useAppReady`, `useCounter`.

### `src/constants/` — TOKENS & CONFIG
Colors, Sizes, Fonts, ScreenNames, AsyncStorage key names, limits, links, local mock data.
Learning point: never hardcode magic values in screens — reference constants.

### `src/translation/` + `src/translation/languages` + `localization/` — I18N
i18next with `en.json`/`ar.json`; language picked at runtime and persisted to `lang`.

### `src/notification/` — PUSH
`useNotification.ts` wraps FCM: foreground/background/quit open handlers, topic subscribe.

### `src/services/` — SDK SHELLS
`freshchat/` and `sentry/` config functions imported at app start (kept isolated so
screens stay clean).

### `src/validationSchemas/` — FORM RULES
Yup schemas reused by Formik forms (login, register, reset).

### `src/context/` — REACT CONTEXT
`modelContext.tsx` → promise-based global modal system (showModal(content) returns a Promise).

## 3. What we will NOT rebuild (dead weight)

- `src/constants/data.ts` mock Locations/ServicesDummy (replaced by real API).
- `AppColors` and `AppColorsTheme3` palettes (keep only Theme2).
- Duplicate favorites store; `FormAuthScreen`/`FormScreen`; custom-IP modal.
- `store/auth-context` import (legacy Firebase auth path).

## 4. Introduction order during rebuild (JUST-IN-TIME)

| Folder | Introduced at |
|---|---|
| `constants/` (tokens) | SETUP-003 |
| `translation/` | SETUP-005 |
| `apis/` | SETUP-006 (axios) + first screen API |
| `store/` (auth) | SETUP-007 |
| `navigations/` | SETUP-008 (AuthStack), then per screen |
| `components/ui/*` | YAMAK-UI-001..008 |
| `hooks/` | when first screen needs reusable logic |
| `helpers/` | storage helpers with auth persist |
| `notification/` | NATIVE-004 |
| `services/` | NATIVE-006/007 |
| `validationSchemas/` | Login/Register validation steps |

## 5. Mental model (one-paragraph summary)

Build the app screen by screen. Before each screen, ask: "What constants, components,
APIs, stores, and navigator entries does THIS screen need that do not exist yet?"
Create exactly those, learn what they are, then STOP. Never create structure speculatively —
that is how you learn why each piece exists.