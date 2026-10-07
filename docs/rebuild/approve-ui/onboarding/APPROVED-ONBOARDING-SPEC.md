# APPROVED ONBOARDING DESIGN SPEC — A6.3 (backend-managed onboarding)

Status: APPROVED (design review A6.3). Functional behavior UNCHANGED (A6.2E contract intact).
Visual authority: the approved Yamak UI (`approve-ui/home`, `approve-ui/map`, `approve-ui/VehiclesDetails`,
`approve-ui/register`, `src/theme/*`) plus this spec's own layout decisions. The existing `new-ui/`
onboarding prototype is PROPOSED only and is NOT an authority.

Companion reference mock: `docs/rebuild/approve-ui/onboarding/code.html` (design sample — NOT app content).

---

## 1. Purpose

Restyle the existing `/onboarding` screen (inside the authenticated `(app)` group, outside Tabs) so it
matches the approved Yamak visual language and is **structurally resilient to backend-driven content**.
The screen currently works functionally (A6.2E verified) but is visually generic Expo-default, has no
safe-area handling, and has two untested content-resilience gaps (null description crash, unbounded
description overflow, many-slide dots). This spec fixes the presentation and those structural risks
**without changing any onboarding behavior** (versioning, seen-version storage, gate, fail-open,
Skip/Get Started completion path, backend-authoritative slides).

## 2. Functional constraints (MUST NOT change — A6.2E contract)

- Route: `/onboarding` at `src/app/(app)/onboarding.tsx`, rendered by `(app)/_layout.tsx` gate only
  when `status === 'required'`. Gate behavior, seen-version rules, fail-open rules, and deep-link
  redirects are **untouchable**.
- Slides come ONLY from `GET /api/mobile/v1/onboarding` (`data.slides[]`):
  `{ id, order, title, description, imageUrl }`. No local slide content, no caching, no fallback copy.
- `Skip` (only when `data.skippable === true` and not on the final slide) and `Get Started` (final slide)
  share the single `completeOnboarding()` path: persist `yamak_onboarding_seen_version` FIRST, then
  `router.replace('/home')`; a write failure keeps the user on onboarding.
- Backend is authoritative for content. Mobile owns ONLY: the static button labels ("Skip" / "Next" /
  "Get Started"), the placeholder branding, and the layout.
- No new dependencies. No AsyncStorage, no persistent remote-config cache, no image library, no
  localization system, no motion library.

## 3. Screen anatomy (top → bottom)

1. **Status/safe area** — top inset (status bar/notch clearance).
2. **Brand mark** — small, subtle YAMAK wordmark (option A, see §9 of the review). Not a hero.
3. **Image plate** — one fixed-height framed area per slide (remote artwork, `contain`).
4. **Text region** — vertically scrollable: title, then description.
5. **Footer (always visible, fixed)** — progress dots row, then the action row (Skip + Next, or
   Get Started), then the bottom safe-area inset.

The footer never moves; text never pushes actions off-screen. The screen is focused and uncluttered.

## 4. Layout

- Full-bleed screen, `flex: 1`, background `colors.phonePrefix` (`#F8FAFC`, the approved `yamakBg` used
  by Vehicle Details / approved screens) — NOT pure white.
- Horizontal pager keeps current behavior: `ScrollView horizontal pagingEnabled` (one `View` per slide,
  `width` = window width). No pager library.
- Each slide column: Image plate (fixed height, computed) → text region (`flex: 1`, vertical `ScrollView`,
  `keyboardShouldPersistTaps="handled"` — buttons are outside it, so taps inside never misfire).
- Footer fixed below the pager (`paddingHorizontal: spacing.lg`), never overlapping content.
- Small screens: image plate height is **ratio-based** — `min(300, round(screenHeight * 0.34))` — so a
  short device shrinks artwork instead of squeezing text. Tablet: cap plate width at 400.

## 5. Colors (existing theme tokens only — no new hexes, no hardcoded brand values)

| Element | Token | Value |
|---|---|---|
| Screen background | `colors.phonePrefix` | `#F8FAFC` (approved `yamakBg`) |
| Title | `colors.title` | `#0F172A` |
| Description | `colors.subtitle` | `#64748B` (approved `yamakMuted`) |
| Image plate frame | `colors.surface` + `colors.border` hairline | white on `#E2E8F0` hairline |
| Idle dot | `colors.border` | `#E2E8F0` |
| Active dot | `colors.navyDeep` | `#0B2A4A` (approved `yamakDarkBlue`) |
| Skip label | `colors.subtitle` | `#64748B` |
| Next / Get Started | `colors.navyDeep`, pressed `colors.navyDeepDark` | `#0B2A4A` / `#071B30` |
| CTA label | `colors.brandText` | `#FFFFFF` |
| Wordmark | `colors.navyDeep`, gold accent `colors.wordmark` | `#0B2A4A` / `#E9A319` |
| Image fallback plate | `colors.navyDeep` bg, `colors.brandText` wordmark | branded, understated |
| Loading text | `colors.subtitle` | `#64748B` |
| Pressed feedback | opacity (see §9) | `interaction` convention |

No color-only semantics anywhere: active/progress state is carried by shape + text as well as color.

## 6. Typography

| Element | Spec | Token / values |
|---|---|---|
| Wordmark | `fontSize 16`, black weight, letterSpacing 1, centered | `fontWeight.black`, keyed to brand |
| Title | `24 / 32`, **bold**, centered, multi-line | `colors.title`, `lineHeight 32` |
| Description | `15 / 22`, regular, centered, multi-line | `colors.subtitle`, `lineHeight 22` |
| Skip | `15 / 20`, medium | `colors.subtitle` |
| Next / Get Started | `typography.buttonLabel` (`14 / 20 bold`, letterSpacing 0.6) | same button-label style as Vehicle Details CTA |
| Page counter (a11y) | visually hidden text, see §16 | "Slide n of N" |

Title will stay a title (24/32) rather than a new scale — it matches the current shipped app range and
the proposed `title-lg`/`title-xl` (22–26). Description drops to the approved body scale. Never below
12px. Font scaling is allowed (system default) and made safe by the scrollable text region.

## 7. Image area

- **Container:** rounded plate, `borderRadius: radius.lg` (24), `colors.surface` background, 1px
  `colors.border` hairline. Height ratio-based (§4), full text-flow width (minus `spacing.lg` side
  padding, max 400 on tablets), `alignSelf: 'stretch'` inside the slide.
- **Resize mode:** `resizeMode="contain"` — never crop unknown uploaded art; portrait and landscape
  files both display fully centered inside the plate.
- **Loading state:** the empty plate shows during download (surface + hairline, optionally a subtle
  1-line "YAMAK" watermark at low opacity). No blank flash, no layout jump.
- **Error / missing state:** `imageUrl == null`, empty string, or `onError` → branded fallback plate
  (`colors.navyDeep` background, white `YAMAK` wordmark, black weight, ~28px, letterSpacing 4, centered).
  Branded but understated; carries no claim, no fake illustration.
- No requirement on asset dimensions. The backend URL is absolute Cloudinary (or null); the app never
  rewrites or proxies it.

## 8. Progress indicator

- Dot: 8dp circle, `colors.border` idle; active = **pill** `24 × 8`, `borderRadius 999`, `colors.navyDeep`.
- Row centered, `marginHorizontal: 3` between dots, above the action row. Dot row never grows with
  content — it is separate from text.
- **Many slides (>9):** dots become a horizontal `ScrollView` (no indicator) that auto-scrolls the active
  dot into view (`ref.scrollTo`). Simple, no pager dep, no new library. Single-slide → one dot.

## 9. Buttons / actions (ONE button system — the approved navy CTA)

- Shared primary style = the existing shipped CTA language (Vehicle Details `primaryButton`, Home
  "Explore Map", Map controls): `colors.navyDeep` background, pressed `colors.navyDeepDark`,
  `borderRadius: radius.md` (12), `alignItems/justifyContent center`, label `typography.buttonLabel`,
  `colors.brandText`. Side padding `spacing.xl`, `minHeight 52` (comfortable ≥48dp target).
- Pressed feedback: background swap to `navyDeepDark` (+ optional opacity) — matching `primaryButton`.
- Disabled/completing: button disabled, label becomes "Loading…", `accessibilityState.busy/disabled`.
- Next and Get Started are the SAME button component with different width: row-constrained (Next) vs
  `flex: 1` full width (Get Started). Skip is never a filled button — it is a subdued text action so it
  never dominates Next.
- No second button system, no outline variant, no new radius.

## 10. Skippable behavior

- `data.skippable === true`: **Skip** is visible on every non-final slide. Placement LTR: left, before
  Next. It is a text Pressable (`colors.subtitle`, medium, generous padding so it stays ≥48dp tall) —
  subordinate to Next by weight and color.
- `data.skippable === false` OR on the final slide: **Skip is not rendered at all** — DELETED, not
  padded. Do NOT keep a spacer; Next expands to fill the row (`flex: 1`) so there is no empty gap.
- Skip and Get Started still share the identical `completeOnboarding()` path (A6.2E rule) — Skip never
  behaves differently from the final CTA.

## 11. Final-slide behavior

- Final slide: full-width **Get Started** (same navy CTA). It is the most prominent element, full width.
- Wording: keep **"Get Started"**. The user is already authenticated; this is an explicit, backend-neutral
  wording and does not imply account creation. (Alternative "Continue" was reviewed; NOT adopted — no
  functional content change per the A6.3 brief.)
- Pending state during `isCompleting`: label "Loading…", both actions disabled, write-before-navigate
  preserved.

## 12. RTL behavior

- All text is centered horizontally — title, description, wordmark, dots — so nothing depends on a
  physical left/right anchor.
- Action row order is **declarative** (Skip then Next in markup); a locale flip mirrors the row
  automatically (same principle as A5.2 tabs) without changing route mapping or button semantics.
- No directional icon is required (Next has no arrow). If a chevron is ever added it must be a
  logical/flipping glyph per the new-ui RTL contract — out of scope now.
- Arabic slide text (already localized by the backend `?lang`/`Accept-Language`) renders correctly via
  system fonts; we do NOT force `textAlign`, do not set `writingDirection` on slide copy (the Arabic
  wordmark may use `writingDirection: 'rtl'` exactly like `AuthBrandHeader`).
- "Skip"/"Next"/"Get Started" stay English in A6.4 (no localization system — separate decision).

## 13. Long-content behavior

- Title: backend allows up to **255 chars** (verified Laravel rule `title_en max:255`) → renders many
  lines. Multi-line wrap is supported; the text region scrolls vertically.
- Description: backend column is `text` with **no max rule** (verified migration + dashboard
  validation) → treat as unbounded. Long / multi-paragraph descriptions scroll inside the text region;
  the footer (dots + actions) stays pinned. Do NOT rely on clipping or ellipsis for content.
- **Null description (VERIFIED GAP):** the backend maps `description` from nullable `description_en`, so
  a published slide without a description returns `description: null`. Current code
  (`slide.description.length > 0`) throws on null → **screen crash**. The A6.4 layout guards with
  `description` null/empty → description simply not rendered (`String(desc ?? '').length > 0`).
- Empty description → omit the description line, title remains vertically centered in the text region.
- A single-slide config → dots show one dot, no Skip, full-width Get Started immediately.

## 14. Missing-image behavior

- `imageUrl === null | '' | fails to load` → navy YAMAK fallback plate (§7). No crash, no broken glyph,
  no local legacy asset, no hardcoded Cloudinary URL.

## 15. Loading / completion behavior

- Loading (config guard): neutral surface + centered subtle text/`ActivityIndicator` (transient — the
  gate redirects as soon as the decision resolves). No Tab/Home flash (guaranteed by the gate, unchanged).
- Image loading: see §7.
- Completion: Skip/Get Started → `completeOnboarding()` (write FIRST) → `router.replace('/home')`.
  Write failure → stay, reset `isCompleting`, re-enable actions (unchanged, verified A6.2E case 14).
- No success animation, no confetti, no fake celebratory copy.

## 16. Accessibility

- Buttons: `accessibilityRole="button"`, `minHeight 52` target, `accessibilityState={{ disabled, busy }}`
  while completing, label text visible (never icon-only).
- Dot row: hidden from the screen reader (`importantForAccessibility="no-hide-descendants"` +
  `accessibilityElementsHidden`) to avoid per-dot noise; expose a single visually hidden
  `accessibilityLiveRegion="polite"`/`accessibilityLabel` **"Slide n of N"** that updates with
  `currentIndex`.
- Image: `accessibilityLabel` = the slide title (meaningful alt); placeholder/fallback plates are
  `accessible={false}` decorative branding.
- Text contrast: title `#0F172A` and description `#64748B` on `#F8FAFC` pass; CTA white on navyDeep
  passes. Skip `#64748B` on `#F8FAFC` passes for ~15px medium.
- Font scaling: default `allowFontScaling` (system); the scrollable text region keeps the CTA usable at
  large scales. Optionally cap `maxFontSizeMultiplier` at 1.4 on title/description in A6.4 if measured
  problems appear — cap is a last resort, not a default.
- Touch targets for dots are intentionally small (dots are not tappable; no tap affordance claimed).

## 17. Exact KEEP / POLISH / CHANGE decisions (CURRENT vs TARGET)

| Element | Current (A6.2E) | Decision | A6.4 action |
|---|---|---|---|
| Page background | `colors.surface` white | **POLISH** | `colors.phonePrefix` `#F8FAFC` (approved surface) |
| Top branding | none | **CHANGE** | Add small YAMAK wordmark (navyDeep text + gold accent), option A |
| Image container | `flex:1` square, 90%×90%, max 400, only fallback has radius | **CHANGE** | Fixed ratio-based rounded plate (`radius.lg`), hairline border, `contain`, capped width |
| Image loading state | none (blank until `onError`) | **CHANGE** | Neutral plate while loading (no flash/jump) |
| Image fallback | `colors.primary` navy block + white YAMAK | **KEEP (restyle)** | `colors.navyDeep` block + white YAMAK (same concept, approved navy) |
| Title | `24/32 bold`, title color, centered | **KEEP** | unchanged |
| Description | `15/22`, subtitle, conditional on `.length > 0` | **CHANGE (guard + region)** | null-safe render; unbounded text inside vertical scroll region |
| Dots | 15dp circles, active `primary` | **CHANGE** | 8dp dots, active navy `24×8` pill; scrollable row when >9 slides |
| Skip | text button, spacer (60px) when not skippable | **CHANGE (spacer)** | Skip visible only when skippable && !final; when absent Next = full width (no hole) |
| Next | filled `primary #15406F`, `radius.md` | **CHANGE (color)** | `navyDeep`/`navyDeepDark`, `typography.buttonLabel`, `minHeight 52` |
| Get Started | filled `primary`, `flex:1` | **CHANGE (color)** | same navy CTA, full width, "Loading…" busy state kept |
| Loading guard | "Loading…" text | **POLISH** | neutral surface + subtle spinner (transient only) |
| Safe area | NONE (top + bottom overlap on notched/gesture devices) | **CHANGE** | top inset via `useSafeAreaInsets`, bottom inset on footer |
| RTL | centered text (already neutral); order via markup | **KEEP** | verify AR slide copy at runtime (A6.4.5) |
| Accessibility | image label only; buttons lack role/state | **CHANGE** | roles/states, hidden dots + "Slide n of N" live region, busy/disabled states |
| Motion | none beyond paging | **KEEP** | no new motion; optional opacity crossfade on image load only if measured as needed |

## 18. Explicit non-goals (A6.4 MUST NOT do)

- No change to onboarding functionality, gate, versioning, seen-version key, fail-open behavior,
  deep-link redirects, or logout handling.
- No backend or Dashboard changes; no changes to `OnboardingController`, migrations, or validation.
- No new dependencies (no pager, no anim lib, no image cache lib, no icon lib).
- No localization system / language picker; button labels remain English; slide copy never hardcoded.
- No local slide assets; no copying legacy `undraw*.png`; no AsyncStorage; no persistent remote cache.
- No per-slide background tinting (legacy idea rejected: busy, not approved).
- No fake content, pricing/commission/payment claims, ETA/quality guarantees, marketplace ownership
  language, or "Yamak drivers/employees" implications anywhere in the layout, labels, placeholder, or mock.
- No tab bar, drawer, or header additions; the screen stays outside Tabs and headerless.

## 19. A6.4 implementation checklist

1. **A6.4.1 Layout / safe area / background** — `useSafeAreaInsets` (top pad on container, bottom pad on
   footer), bg `phonePrefix`, wordmark row, fixed footer, restructure slide column into plate + text
   scroll region.
2. **A6.4.2 Remote image presentation / fallback** — ratio plate (`min(300, 0.34*h)`), hairline border,
   `contain`, loading plate, `onError`/null → navy fallback, width cap.
3. **A6.4.3 Typography / content resilience** — null-safe description (`String(`desc` ?? '')`),
   255-char multi-line titles, unbounded description scroll, empty-description centering, single-slide
   and many-slide behavior, small-screen ratios.
4. **A6.4.4 Progress / actions polish** — compact dots + navy pill + scrollable row (>9), Skip hidden
   cleanly (no spacer), navy CTA (next/get-started), busy/disabled states, press colors.
5. **A6.4.5 RTL + small-screen + a11y verification** — runtime with Arabic backend copy, short/large
   font scales, screen-reader "Slide n of N", button states.
6. **A6.4.6 Final runtime verification** — targeted A6.2E matrix subset against an isolated backend
   (fresh user, Skip, Get Started, `skippable=false`, null-description slide, 1-slide config, long-title
   config, dead image → fallback), plus `npx tsc --noEmit` (only baseline error) and `git diff --check`.

---

### Business-model guardrails (applies to backend slide copy AND the mock)

Yamak is a **free non-profit facilitator / connector** between the user and independent providers.
Slide copy must never imply: marketplace/booking-platform ownership, platform pricing/commissions,
payment through Yamak, "Yamak drivers/employees", guaranteed response/arrival time, or provider-quality
guarantees. Reputable wording describes *seeking* help: "request help from nearby independent providers."
This spec does NOT ship slide copy — it is a guardrail for Dashboard/Backend content authors and for the
design-sample mock only.

### Sample-layout label

The companion `code.html` uses representative placeholder copy and art **only to visualize layout**. It
is explicitly labeled a design sample; it is NOT mobile content and the Backend remains authoritative.