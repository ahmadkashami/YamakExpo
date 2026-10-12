# APPROVED DRAWER DESIGN SPEC — A7.6

Status: **APPROVED (design review A7.6).** Functional behavior UNCHANGED — the A7.3 drawer content contract stays intact.
Visual authority: the approved Yamak UI (`approve-ui/home`, `approve-ui/map`, `approve-ui/profile`,
`src/theme/*`) plus this spec's own layout decisions. The provisional
`docs/rebuild/new-ui/main/drawer/index.html` and `new-ui/design-system/navigation.md §4` are PROPOSED only and
are NOT an authority. The legacy `yamak-mobile` drawer is a content/order reference ONLY — its visuals are
explicitly rejected.

Companion reference mock: `docs/rebuild/approve-ui/drawer/code.html` (**DESIGN SAMPLE — not app content**).

Functional content is FIXED and covered by A7.3. This spec changes ONLY presentation, and only as executed in A7.7.

---

## 1. Purpose

Give the already-functional authenticated drawer (`src/app/(app)/(drawer)/_layout.tsx` +
`src/components/navigation/AppDrawerContent.tsx`) an approved visual language that matches Home, Map and
Profile: a **light drawer body** on a **navy identity cap header** with **gold accents**, a **gold-tinted
active row** (never a full navy fill), and a truthful **version-only footer**. The drawer must never invent
content, never add a dead row, and never duplicate Profile-hub actions.

## 2. Functional contract (MUST NOT change)

- **Header:** initials + `user.name` + `user.email`, read from `AuthProvider` only. No image fetch, no fake
  avatar, no "online" status pill.
- **Rows (exact order):** `Home → /home`, `Map → /map`, `Profile → /profile`. No fourth row.
- **Footer:** `Version {Constants.expoConfig?.version}` only; the footer is **omitted entirely** when the
  version is `null`. Never "Version undefined".
- **Explicitly ABSENT** (not hidden, not disabled, not placeholdered): Favorites, Notifications, Share,
  Logout / Sign out, Language, Settings, About, Contact, "More", dead or disabled rows. Share + Sign out live
  in the Profile hub (A4) — never duplicated here.
- Navigation path is unchanged: `router.navigate(href)` (only when not already focused) + explicit
  `CLOSE_DRAWER` dispatch.
- **No new dependency.** Iconography reuses the existing `react-native-svg` glyphs already in
  `src/components/navigation/TabIcons.tsx`. No icon package, no animation library, no image library.

## 3. Design authority & references

| Reference | Role |
|---|---|
| `src/theme/colors.ts`, `spacing.ts`, `radius.ts`, `typography.ts`, `interaction.ts` | EXACT tokens — no new hexes, no hardcoded values |
| `approve-ui/home/code.html` | Approved navy gradient header language (glass controls, `#081C31`→`#0B2A4A`→`#153359`), gold `#E9A319` accent, tab active = navy + gold dot |
| `approve-ui/map/code.html` | Approved white app bar + `#0B2A4A` CTA |
| `approve-ui/profile/APPROVED-PROFILE-SPEC.md` | Identity/menu/footer structural precedent; real-data-only rule |
| `docs/rebuild/new-ui/main/drawer/index.html` | PROPOSED only — layout inspiration; its emoji icons, Share/Sign-out footer and Settings/Join-us/About/Contact rows are **rejected** |
| `yamak-mobile/src/navigations/CustomDrawerContent.tsx` | Content/order reference only — visuals rejected (fake avatar, "online" badge, navy block, gold full-row active with white text, undefined version, duplicate Share/Sign out) |

## 4. Drawer anatomy (top → bottom)

1. **Identity cap** — navy cap, full-bleed to the top edge, safe-area top inset inside it. Contains the
   circular initials avatar, the name and the email.
2. **Menu** — a white body with the three rows (Home · Map · Profile).
3. **Spacer** — `flex: 1`, pushing the footer down.
4. **Footer** — centered truthful `Version x.y.z` (omitted when unknown).
5. **Bottom safe-area inset** — inside the scroll content, below the footer.

The identity cap is the ONLY navy region. Everything below it is `colors.surface` (white). This is the
opposite of the legacy drawer (navy body) and of a full navy fill.

## 5. Surface, width, position & type

- **Drawer body background:** `colors.surface` (`#FFFFFF`) — set on the drawer container via
  `drawerStyle` / `sceneContainerStyle` only if needed; the vendored `front` drawer already defaults the
  drawer surface to `colors.card` (white). *No explicit width override.*
- **Width:** keep the **library default** (`getDrawerWidthNative`): `max(width − 56 <= 360 ? width − 56 : 360, 0)`.
  Representative results — 360dp device → 304dp, 390 → 334, 412 → 356, ≥416 → 360dp. Do **not** set
  `drawerStyle.width`. A fixed width would break RTL mirroring, tablet layout and the vendored corner radius
  maths.
- **Position:** library default — physical **left**, automatically **right** under RTL.
- **Type:** library default — Android `front`, iOS `slide`. Android `front` already applies a 16dp
  `DRAWER_BORDER_RADIUS` to the drawer's outer top/bottom (right side on LTR, left side on RTL). Keep it.
  iOS `slide` has no radius — acceptable and platform-native; do not fake one.
- **Radius:** none added by us beyond the vendored default. The identity cap is NOT independently rounded at
  the top — it bleeds into the drawer's own top corners so no white sliver shows.

## 6. Color tokens

| Element | Token | Value |
|---|---|---|
| Drawer body background | `colors.surface` | `#FFFFFF` |
| Identity cap background | `colors.navyDeep` | `#0B2A4A` |
| Avatar circle fill | `colors.glass` | `rgba(255,255,255,0.08)` |
| Avatar circle border | `colors.glassBorder` | `rgba(255,255,255,0.12)` |
| Avatar gold ring (accent) | `colors.wordmark` | `#E9A319` |
| Avatar initials | `colors.brandText` | `#FFFFFF` |
| Name | `colors.brandText` | `#FFFFFF` |
| Email | `colors.tagline` | `#94A9C3` |
| Cap bottom hairline (optional seam) | `colors.glassBorder` | `rgba(255,255,255,0.12)` |
| Active row background | `colors.goldTint` | `#FDF7E6` |
| Active row border | `colors.goldTintBorder` | `#FBEED4` |
| Active row leading accent bar | `colors.wordmark` | `#E9A319` |
| Active row label / icon | `colors.navyDeep` | `#0B2A4A` |
| Inactive row label | `colors.fieldText` | `#1E293B` |
| Inactive row icon | `colors.subtitle` | `#64748B` |
| Row pressed overlay | opacity (see §22) | `interactionOpacity.pressed` `0.7` |
| Footer text | `colors.subtitle` | `#64748B` |
| Backdrop / scrim | `colors.scrim` (over `overlayColor`) | `rgba(12,28,51,0.55)` |

No color-only semantics: the active row is carried by **background + leading bar + weight**, not colour alone.

## 7. Typography

| Element | Spec | Token / values |
|---|---|---|
| Initials | `22 / 28`, bold | `fontWeight.bold`, `colors.brandText` |
| Name | `16 / 22`, semibold | `fontWeight.semibold`, `colors.brandText` |
| Email | `12 / 16`, regular | `fontWeight.regular`, `colors.tagline` |
| Row label (active) | `15 / 20`, semibold | `fontWeight.semibold`, `colors.navyDeep` |
| Row label (inactive) | `15 / 20`, medium | `fontWeight.medium`, `colors.fieldText` |
| Footer version | `12 / 16`, medium | `fontWeight.medium`, `colors.subtitle` |

Never below 12px. Font scaling uses the system default; the menu scrolls (see §17) so large scales never push
the footer off-screen.

## 8. Identity cap header

- Full-bleed navy band at the top of the drawer, background `colors.navyDeep` (`#0B2A4A`).
- Padding: top = `insets.top` (safe-area/status-bar clearance) **+** `spacing.lg`; horizontal = `spacing.xl`;
  bottom = `spacing.lg`.
- Center-aligned vertical stack: avatar → `spacing.md` → name → `2` → email.
- Optional 1px `colors.glassBorder` hairline at the cap's bottom edge to seat the transition into the white
  body (POLISH; omit if it reads as a seam artifact).
- **Bleed requirement:** the vendored `DrawerContentScrollView` adds `paddingTop: 12 + insets.top` by default.
  To let the cap reach the top edge, the A7.7 content container sets `paddingTop: 0`, `paddingStart: 0`,
  `paddingEnd: 0` and re-applies `insets.top` **inside** the cap (and the bottom inset inside the footer
  region).
- The cap is decorative for screen readers (see §21): the name/email text is the real announcement.

## 9. Initials avatar

- Circle **64dp** (`width/height 64`, `borderRadius 32`), centered.
- Fill `colors.glass`, 1px `colors.glassBorder` border, plus a **2dp `colors.wordmark` gold ring** as the
  brand accent (`borderWidth` on an outer wrapper or a gold border layer).
- Initials text: `22 / 28` bold, `colors.brandText`, uppercase.
- Initials rule is UNCHANGED from A7.3 (replicated from the Profile hub A4): first letters of the first two
  name parts; single-word name → first letter; empty/missing name → `'YA'`. Never a crash.
- `accessible={false}` — decorative echo of the announced name; prevents double announcement.

## 10. Identity text (name / email)

- **Name:** `colors.brandText`, `16 / 22` semibold, centered, single line preferred, wraps if long,
  `numberOfLines` NOT clamped.
- **Email:** `colors.tagline` (`#94A9C3`), `12 / 16` regular, centered, `2` top margin, full width so long
  addresses can wrap rather than clip.
- Both render **only when non-empty** — a missing name or email renders nothing (no "undefined").
- Contrast: white on `#0B2A4A` passes; `#94A9C3` on `#0B2A4A` passes for the 12px email.

## 11. Menu row anatomy & metrics

- Rows live in the white body with horizontal padding `spacing.lg`; the menu block starts `spacing.lg` below
  the cap.
- Each row: `minHeight 52` (comfortable ≥48dp target), `borderRadius: radius.md` (12), flex row,
  `alignItems: center`, icon box (20pt) → `spacing.md` gap → label (`flex: 1`).
- Row vertical gap `spacing.xs` (4) between rows; horizontal inset `spacing.md` so the row's rounded
  background never touches the drawer edge.
- Because `DrawerItem` is used today, A7.7 either (a) restyles `DrawerItem` via `labelStyle` / `style` /
  `activeBackgroundColor` + a custom `drawerLabel`/`drawerIcon`, or (b) renders an equivalent Pressable row
  keeping `role="button"` + `aria-selected` semantics. Whichever is chosen, the row semantics and the
  navigation/`CLOSE_DRAWER` behavior from §2 stay identical.

## 12. Active (focused) row treatment

- Background: `colors.goldTint` (`#FDF7E6`).
- Border: 1px `colors.goldTintBorder` (`#FBEED4`).
- **Leading accent:** a 3dp-wide `colors.wordmark` (`#E9A319`) vertical bar (fully rounded), inset at the
  row's leading edge with `radius.sm`-style rounding — the primary active signal.
- Label: `colors.navyDeep`, `fontWeight.semibold`.
- Icon: `colors.navyDeep`, solid/filled glyph.
- This is **deliberately NOT** a full navy fill and **NOT** a full gold block with white text (the legacy
  contrast defect). Navy content on a gold tint keeps the row readable in both LTR and RTL.

## 13. Inactive row treatment & icons

- Background: transparent (white body shows through). Border: none.
- Label: `colors.fieldText` (`#1E293B`), `fontWeight.medium`.
- Icon: `colors.subtitle` (`#64748B`).
- Icons reuse the approved glyphs from `TabIcons.tsx` at 20pt, `viewBox 0 0 24 24`:
  - **Home** — solid house `M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z` (as the active tab).
  - **Map** — Heroicons folded-map outline (stroke 2, round caps/joins).
  - **Profile** — Material solid person.
  - Active row renders the glyph in `colors.navyDeep`; inactive in `colors.subtitle`. No emoji, no new icon
    package, no new SVG paths.

## 14. Footer (app version)

- Pinned to the bottom by the `flex: 1` spacer, centered.
- Text: `Version {appVersion}` in `colors.subtitle`, `12 / 16` medium.
- `appVersion = Constants.expoConfig?.version`. When it is `null` the whole footer block is **not rendered**
  (no placeholder, no "Version undefined"). A trusted `1.0.0` currently resolves from `app.json`.
- Bottom safe-area inset (`insets.bottom`) is added below the text so it never sits under the home indicator.
- No Share, no Sign out, no separators, no branding — version only.

## 15. Backdrop / scrim

- Use `overlayColor: colors.scrim` (`rgba(12,28,51,0.55)`) via `screenOptions` — a navy-tinted scrim that
  matches the brand and is a superset of the library default `rgba(0,0,0,0.5)`. The vendored `DrawerView`
  accepts `overlayColor` (verified in the installed types + `overlayStyle: { backgroundColor: overlayColor }`).
- Tapping the scrim closes the drawer (library default). The scrim is **not** a dead overlay — it must keep
  the default close-on-tap behavior; do not disable it.

## 16. Gestures, triggers & auto-close

- **Gestures:** all library defaults — left-edge swipe to open (32dp edge, 60dp min distance, 500 velocity),
  swipe/backdrop to close, Android hardware Back closes an open drawer. Do not override.
- **Triggers (recorded A7.6 decision):** Home and Map keep their existing ☰ app-bar buttons; **Profile gets no
  hamburger** — Profile is a self-contained hub reached via the bottom tab and the drawer row, and adding a ☰
  there would require a screen redesign outside this scope. The drawer stays reachable from Profile by
  edge-swipe. (Legacy parity: legacy Home had no hamburger either; our approved Home/Map app bars already
  design the ☰.)
- **Auto-close:** the single-route `(tabs)` drawer does not change its own route state on a tab switch, so
  the explicit `CLOSE_DRAWER` dispatch after navigation stays mandatory (unchanged from A7.3). Tapping the
  already-focused row still closes without a navigation loop.

## 17. Device fit (width) & small screens

- Width is the library default (§5) → on a 360dp phone the drawer is ~304dp and the underlying screen shows
  ~56dp of dimmed context; on ≥416dp it caps at 360dp.
- Because the menu has only three rows, vertical overflow is essentially impossible at default font scale;
  nonetheless the content is inside `DrawerContentScrollView`, so with large system font scales or a very
  short viewport the menu scrolls and the footer remains reachable.
- The identity cap keeps `paddingTop = insets.top + spacing.lg`; on tall banners/notches this pushes the
  identity down rather than clipping it.

## 18. RTL behavior

- Width, position and corner radius are all library-managed → the drawer mirrors to the physical **right**
  under RTL with no per-locale code.
- The leading accent bar and the icon→label order are **logical** (`paddingStart`, `marginStart`, flex row),
  so they mirror automatically. No hardcoded `left`/`right`.
- Identity text, footer and the centered stack are alignment-neutral.
- No directional chevron/arrow is required (rows have no trailing chevron in the first release). If a chevron
  is ever added it must be a direction-aware glyph — out of scope now.
- Arabic name/email render through system fonts; do not force `textAlign` on the identity text. Button/row
  labels remain English in this release (no localization system — separate decision).

## 19. Safe areas

- Top: `insets.top` is consumed **inside** the navy cap (the content container's default top padding is
  zeroed so the cap can bleed — §8).
- Bottom: `insets.bottom` is consumed inside the footer region so the version text clears the home indicator.
- Horizontal: `DrawerContentScrollView` applies `paddingStart/End` from insets by default; because we zero the
  container padding for the full-bleed cap, A7.7 re-applies the horizontal safe inset inside the body rows and
  the footer (landscape/notch). Verify on a landscape pass.

## 20. Missing / empty / long data states

- Missing name and/or email → that line renders nothing (never "undefined").
- Empty name (and therefore no initials source) → `'YA'` fallback initials (A4 rule), still rendered.
- Missing app version → no footer at all (never "Version undefined").
- Very long name/email → wrap within the cap; nothing is clipped or ellipsised away.
- No network fetch is involved, so there is **no loading state** for the drawer — identity is already in
  memory from `AuthProvider`. Do not add a spinner.

## 21. Accessibility

- **Cap:** decorative; the avatar is `accessible={false}`. The name and email are real, readable `Text`
  (announced normally). The cap as a container must not double-announce the identity.
- **Rows:** keep the vendored `role="button"` + `aria-selected` (active) semantics; keep the explicit
  `accessibilityLabel={row label}`. Row label is visible text — never icon-only.
- **Footer:** plain readable text (not a button).
- **Contrast:** white name on `#0B2A4A` passes; `#94A9C3` email on `#0B2A4A` passes; `#0B2A4A` label on
  `#FDF7E6` active tint passes; `#1E293B` inactive label on white passes; `#64748B` version on white passes.
- **State is never color-only:** active row carries background + leading bar + font weight.
- Focus/touch targets ≥48dp (row `minHeight 52`).

## 22. Motion & performance

- **No new animation.** Drawer open/close uses the library's existing transition; rows use the project's
  pressed-opacity convention (`interactionOpacity.pressed = 0.7`) — same as the rest of the app.
- No shadows, no parallax, no spring, no gradient on the body. The only "effects" are the flat navy cap and
  the gold accent. This keeps the drawer cheap and consistent.
- Prefer the existing `DrawerItem` path (or a single lightweight Pressable) — do not add a list-render or a
  new animation dependency for three rows.

## 23. Exact KEEP / POLISH / CHANGE decisions (A7.3 current → A7.7 target)

| Element | Current (A7.3) | Decision | A7.7 action |
|---|---|---|---|
| Identity header background | white body, hairline bottom border | **CHANGE** | full-bleed navy cap `colors.navyDeep`, bottom hairline optional |
| Avatar | 64dp solid `navyDeep` circle, white initials | **POLISH** | 64dp `colors.glass` circle + `glassBorder` + gold `wordmark` ring |
| Name | 16 semibold `colors.title` | **POLISH** | 16 semibold `colors.brandText` (white) on the navy cap |
| Email | 12 regular `colors.subtitle` | **POLISH** | 12 regular `colors.tagline` (`#94A9C3`) |
| Initials rule | Profile-hub replication (`YA` fallback) | **KEEP** | unchanged |
| Row active state | full `navyDeep` fill + white text | **CHANGE** | `goldTint` bg + `goldTintBorder` + 3dp gold leading bar + navy content (semibold) |
| Row inactive | `colors.title` label, no icon | **CHANGE** | `colors.fieldText` label, 20pt SVG icon (`colors.subtitle`) |
| Row icons | none | **CHANGE** | reuse `TabIcons.tsx` Home/Map/Profile glyphs, 20pt, no new dep |
| Row metrics | default `DrawerItem` | **POLISH** | `minHeight 52`, `radius.md`, `spacing.lg` horizontal, icon→label `spacing.md` |
| Body background | default white | **KEEP** | `colors.surface` |
| Footer | truthful "Version 1.0.0", centered | **KEEP (restyle)** | same content; `colors.subtitle` 12/16 medium; hidden when null |
| Share / Sign out rows | absent | **KEEP** | stay absent (Profile-only) |
| Favorites / Notifications | absent | **KEEP** | stay absent (no dead rows) |
| Backdrop | default black 0.5 | **POLISH** | `overlayColor: colors.scrim` (navy 55%), tap-to-close kept |
| Width / position / type / radius | library defaults | **KEEP** | no override; RTL + 16dp corner come free |
| Safe area | container default padding | **CHANGE** | zero container top/side padding; insets inside cap + footer |
| Profile ☰ trigger | none | **KEEP** | no Profile hamburger (decision §16) |
| RTL | declarative/logical | **KEEP** | verify leading bar mirrors at runtime (A7.8) |
| a11y | role/selected + explicit labels; decorative avatar | **KEEP** | unchanged semantics; verify at runtime |

## 24. A7.7 implementation checklist

1. **Cap + bleed:** restructure `AppDrawerContent` — zero `DrawerContentScrollView` top/side padding, add a
   navy `colors.navyDeep` cap with `insets.top + spacing.lg` top padding (from `useSafeAreaInsets`), avatar,
   name, email.
2. **Avatar:** 64dp `colors.glass` circle + `glassBorder` + `colors.wordmark` gold ring, white bold initials,
   `accessible={false}`.
3. **Rows:** gold-tint active treatment (bg + border + 3dp gold leading bar + navy semibold) and white
   inactive rows with the reused 20pt SVG icons; `minHeight 52`, `radius.md`.
4. **Footer:** version-only, `colors.subtitle`, hidden when `null`, bottom inset.
5. **Scrim:** `overlayColor: colors.scrim`; keep tap-to-close.
6. **No-scope guard:** no new dependency, no Share/Sign-out/Favorites/Notifications/Language rows, no Profile
   hamburger, no width override, no functional/navigation change.
7. **Verify:** Home active / Map active / Profile active states, RTL mirroring of the cap and leading bar,
   large-font + landscape safe area, `npx tsc --noEmit` (only the pre-existing baseline `app-tabs.web.tsx`
   error), `git diff --check`.

---

### Explicit non-goals (A7.7 MUST NOT)

- No functional change to the drawer content, navigation, or `CLOSE_DRAWER` behavior (A7.3 contract intact).
- No new rows, no dead/disabled placeholders, no Favorites/Notifications/Share/Logout/Language/Settings/About/
  Contact entries.
- No new icon/animation/image/UI dependency; no design-system package.
- No `drawerStyle.width` override; no change to position, `drawerType`, gestures, or backBehavior.
- No fake data, no fake avatar, no "online" status, no invented version.
- No business-model claims anywhere (no marketplace/booking/commission/payment/"Yamak drivers" language) —
  the drawer is navigation only.
- No changes to Backend, Dashboard, Legacy, tabs, Home/Map/Profile screens, the auth/onboarding gate, or the
  approved Home/Map app bars.

### Sample-layout label

`code.html` uses representative placeholder identity ("Sarah Al-Ali", a demo email) and a mock version purely
to visualize layout. It is explicitly labelled a **DESIGN SAMPLE**; it is NOT app content, and `AuthProvider` /
`Constants.expoConfig` remain the only sources of truth.
