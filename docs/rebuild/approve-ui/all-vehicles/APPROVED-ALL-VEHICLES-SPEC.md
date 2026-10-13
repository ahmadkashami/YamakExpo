# APPROVED ALL-VEHICLES DESIGN SPEC — B1.6

Status: **APPROVED (design review B1.6).** Functional behavior UNCHANGED — the B1.3 / B1.4
functional contract stays intact; this spec changes presentation only, and only as executed in B1.7.

Visual authority: the approved Yamak UI (`approve-ui/home`, `approve-ui/map`,
`approve-ui/VehiclesDetails`, `approve-ui/drawer`, `approve-ui/onboarding`,
`approve-ui/profile`) plus `src/theme/*`. The provisional
`docs/rebuild/new-ui/main/all-vehicles/index.html` is **PROPOSED only** and is NOT an authority.
The legacy `yamak-mobile` All Vehicles screen is a content/structure reference ONLY — its visuals
are explicitly rejected.

Companion reference mock: `docs/rebuild/approve-ui/all-vehicles/code.html`
(**DESIGN SAMPLE — not app content**).

---

## 1. Purpose

Give the already-functional, runtime-verified All-Vehicles screen (`/vehicles`, B1.3 + B1.4) an
approved visual language so it reads as **Home's vehicle section, expanded into a full screen**:
a clean, light browse list of nearby online providers that visually belongs to Home and
Vehicle Details, and that does not look like a separate marketplace/catalog product.

Target file for B1.7: `src/app/(app)/vehicles.tsx` (+ the minimal, backwards-compatible
`VehicleItem` / `VehiclesListSkeleton` polish it reuses).

## 2. Functional constraints (MUST NOT change)

- Route stays a **pushed authenticated** `(app)/vehicles.tsx`, OUTSIDE `(drawer)`/`(tabs)`
  (own app bar, no bottom tabs, no drawer). Entered from Home "View All".
- `FlatList` + pagination + pull-to-refresh + load-more + skeleton/error/empty stay.
- Card press → `/vehicle/{id}`; back → `router.back()` (fallback `/home`).
- `VehicleItem` reuse; client Haversine distance only (never the backend Euclidean `distance`).
- NO search, NO filters, NO service filter, NO favorites, NO request/contact/pricing/payment.
- Data comes only from `usePaginatedVehicles`; the screen owns no pagination state.
- No new dependency, no new theme token, no Backend/Dashboard/Legacy change.

## 3. Final direction

**"Home list, expanded."** One direction only, chosen over three alternatives (a) a new-ui
grid+chips catalog (rejected: catalog/marketplace feel + dead filter chips), (b) a bare legacy
list (rejected: square white blocks, no card language), (c) a dark/navy hero header (rejected:
`/vehicles` is a utility browse screen, not a brand moment). The screen uses:

- the approved **light page** (`colors.phonePrefix` `#F8FAFC`, the approved `yamakBg`);
- a **white single-surface app bar** (the approved pushed-screen bar already used by
  `Vehicle details`: back / centered title / hairline bottom edge);
- **white full-width cards** on the light page: `radius.md`, 1px `colors.border` hairline,
  a very subtle shadow — the exact card language the shipped Vehicle Details surfaces use;
- the **gold `View`** affordance already on the Home card.

No navy header, no gradient, no chips row, no price/badge/rating.

## 4. Page anatomy (top → bottom)

1. **App bar** — white surface; back button, centered title `All Vehicles`, muted result count.
2. **List** — `FlatList` of full-width vehicle cards on `colors.phonePrefix`.
3. **List footer** — load-more spinner or a small load-more retry row.
4. **Bottom safe-area inset** — consumed inside the list content padding.

The app bar is the only fixed chrome (the empty/error states keep it visible).

## 5. Background

- Screen background: `colors.phonePrefix` (`#F8FAFC`) — the approved surface already used by
  Vehicle Details / Onboarding. NOT pure white (cards must separate from the page).
- No gradient, no pattern, no image background.

## 6. App bar

Single-surface white app bar, matching the shipped Vehicle Details app bar exactly:

| Property | Value |
|---|---|
| Background | `colors.surface` (`#FFFFFF`) |
| Bottom edge | 1px `colors.border` hairline |
| Padding top | `insets.top + spacing.sm` (safe area inside the bar) |
| Padding bottom | `spacing.sm` |
| Padding horizontal | `spacing.lg` |
| Min height | 52 (grows to ~64 for the two-line title/count stack) |
| Leading slot | fixed 40; `BackIcon` (`Go back`, `accessibilityLabel="Go back"`, `hitSlop 8`) |
| Center column | `flex: 1`, centered: title, then optional count |
| Trailing slot | fixed 40, empty spacer (keeps the title optically centered) |
| Title | `All Vehicles`, `16 / 22`, `fontWeight: '700'`, `colors.title` |

Explicitly ABSENT (not hidden, not placeholdered): notification bell, search, filter, sort,
favorites, overflow/kebab. The app bar has exactly: back + title + (count).

## 7. Count

- Placement: a **muted subtitle line under the title**, inside the app bar (centered), NOT a
  trailing action-slot label.
- Source: `metaData?.totalCount` only. Hidden entirely while `metaData` is absent (first load /
  error), never "0" as a placeholder for "unknown".
- Type: `typography.caption` (`12 / 16`, medium), `colors.subtitle` (`#64748B`), centered.
- Copy: `"{n} vehicle"` / `"{n} vehicles"` (singular/plural safe); the number is the backend
  `totalCount` verbatim (no client recount).
- Never visually dominant: smaller than the title, muted colour, no pill/background/badge.
- Rationale for subtitle-over-trailing-slot: keeps the title exactly centered (a variable-width
  trailing label drifts the centered title on narrow screens) and reads as a list result summary,
  not an action. The pure single-line trailing-slot variant was considered and rejected for
  that reason.

## 8. Card anatomy

Reuse `VehicleItem` with `orientation="vertical"` — ONE source of vehicle presentation. B1.7
adds a vertical-only visual shell; the horizontal (Home) default stays byte-identical.

| Region | Vertical (All Vehicles) |
|---|---|
| Container | `width: 100%`, `marginRight: 0`, `colors.surface`, **`radius.md` (12)**, 1px `colors.border`, `overflow: 'hidden'`, subtle shadow (`elevation: 1`) |
| Inner | row, fixed height **120** (unchanged), `radius.heroPlate` clipped by the shell |
| Image area | `flex: 1.5`, centered; `resizeMode="contain"` |
| Divider | 1px `colors.border`, 80% height (unchanged) |
| Content | `flex: 2`, `padding: 10` (legacy literal, unchanged) |
| Name | `branch.name` → `Name : {branch.name}`, `typography.subtitle` + medium, `colors.title`, `textTransform: 'capitalize'`, `numberOfLines={1}`; row omitted when `branch?.name` is null |
| Services | `Services : {services?.length ?? 0}`, `typography.body`, `colors.title` |
| Footer divider | 1px `colors.border` |
| Footer row | row, `space-between`: optional distance + gold `View` |
| Press | whole card; `interactionOpacity.pressed` (0.7) |

Keep the card **behavior** reusable; only the vertical shell/geometry differs from Home.

## 9. Image

- Source: `vehicle.iconMap` (already-loaded URL). No new image library, no cache lib.
- Fit: `resizeMode="contain"` (never crop). Fixed to the card height (120).
- Radius: the card shell's `radius.md` clips the image block (no separate image radius).
- **Missing / null image:** keep the current graceful non-crash behaviour. Vertical POLISH only:
  the empty image area gets a neutral `colors.phonePrefix` plate so the left column reads as an
  intentional empty frame rather than a broken card. No emoji, no asset, no label. Home
  (horizontal) is unchanged (blank, as shipped/verified).
- A broken URL must not crash: the existing `Image` behaviour is preserved (no `onError` handler
  is required for the list card; B1.4 verified a broken-image URL renders without crashing).

## 10. Vehicle identity

Visual hierarchy (real data only):

1. **Provider/branch name** (`branch.name`) — primary line.
2. **Services count** (`Services : N`) — secondary line.
3. **Distance** (client Haversine km) — tertiary, optional.

No invented ratings, availability badges, prices, response times, "verified" seals, years, or
member-since lines. Only fields the `Vehicle` contract actually carries are shown.
Copy format (`Name :` / `Services :`) is kept from B1.3 — changing the wording is a content
decision out of B1.6 scope.

## 11. Services

- **Option A: count only** (`Services : N`). Chosen.
- Names exist (`services[].name.en`), but chips would add 1–3 extra rows to every card, increase
  card height and density, and re-open questions about truncation/wrapping on small screens —
  against the "scan 20+ vehicles" goal. Chips are also used on Vehicle Details (the deeper
  screen), so keeping the list to a count avoids duplicating that surface.
- No service filtering (a local filter over the loaded pages would be incomplete/misleading;
  the backend has no `serviceId` filter on `GET /vehicles`).

## 12. Distance

- Optional by design. `distanceKm` is computed only when `coordsUsed !== null` AND
  `isUsableVehicleGeo(geoLocation)`; it renders as `{X.X} km`.
- **Present:** muted/body line, `colors.title`, aligned to the leading edge of the footer row.
- **Absent:** render nothing — no "0.0 km", no "—", no reserved blank cell. The footer row must
  NOT leave an awkward empty space; the `View` affordance takes the trailing edge.
- Never the backend `distance` (Euclidean degrees).

## 13. View affordance

- The **entire card** is the single tap target (`accessibilityRole="button"`); `View` is a
  static visual, not a nested `Pressable`. Do NOT introduce two competing tap targets.
- Keep the gold `View` chip (`colors.gold`, `brandText` label, 60×30, `radius 10`) — the approved
  `FillledButton` language carried from the Home card.
- POLISH (vertical only): the `View` chip stays on the **trailing** edge whether or not a distance
  is present (adds `marginLeft: 'auto'` when vertical), so the primary action never drifts to the
  leading edge on a distance-less card. Home keeps its current layout.

## 14. List spacing

| Gap | Token |
|---|---|
| List horizontal/top inset | `spacing.lg` (16) |
| Card-to-card gap | `spacing.md` (12) — `ItemSeparatorComponent` |
| Bottom padding | `insets.bottom + spacing.xxl` |
| Footer vertical padding | `spacing.lg` |
| App-bar → first card | the app bar hairline + list top inset `spacing.lg` |

Optimized for scanning many rows: fixed 120 card height, 12 gap, 16 side inset ≈ 4+ cards visible
on a 360×780 viewport. Do not make cards taller.

## 15. Initial loading

- Reuse `VehiclesListSkeleton` with a **vertical/card variant** (B1.7 adds an optional prop; the
  default keeps the current Home look byte-identical).
- Vertical variant geometry: full-width inside the list inset, height **120**, `radius.md`, fill
  `colors.border` (or `phonePrefix` + hairline) — matching the real card so there is no layout
  jump.
- Count: repeat enough blocks to roughly cover the first viewport (≈4–6), stacked with the same
  `spacing.md` gap.
- No new skeleton package. No spinner as the primary list loading state.

## 16. Empty state

- Restrained, text-only, centered in the remaining space; **page header stays visible**.
- Copy (kept from B1.3): `No vehicles available right now.`
- Type: `typography.subtitle`, `colors.subtitle`, centered. Optional single smaller helper line
  may be added in B1.7 only if it adds real value; no icon, no illustration, no dependency.
- Must look clearly different from both the loading state and the error state.
- Reached only from a successful page 1 with zero rows (`isEmpty`), never an error.

## 17. Initial error

- Reuse the project error component `ApiErrorRow` (`colors.error` text + bordered `Retry`).
- Centered block in the list's empty slot; the app bar stays visible.
- Copy/behaviour unchanged: `error.message` + `Retry` (re-fetch page 1).
- Must be visually distinct from Empty (uses the error colour + a Retry action).

## 18. Load-more state

- Footer only. While loading: a single centered `ActivityIndicator` (`colors.primary`) with
  `spacing.lg` vertical padding — small, not a card, not competing with rows.
- Load-more failure: a compact `ApiErrorRow` in the footer with `Retry` (`loadMoreError`), the
  existing rows preserved. NO full-screen/giant error panel — the list stays usable.
- End of list / no more pages: render **nothing**.

## 19. Pull refresh

- Native `RefreshControl` only (`refreshing={isRefreshing}` / `onRefresh={refresh}`). Platform
  default indicator and animation. No custom pull animation, no tint override.

## 20. Safe area

- Top: `insets.top` consumed INSIDE the app bar (`insets.top + spacing.sm`); no hardcoded
  device-specific values.
- Bottom: `insets.bottom` consumed inside the list content bottom padding
  (`insets.bottom + spacing.xxl`) so the last card clears the home indicator / gesture bar.
- Horizontal: list inset `spacing.lg`; the app bar uses `spacing.lg`.

## 21. Small screen

- Card width is `100%` (no fixed 350 like Home), so it fits any viewport.
- Long `branch.name`: single line, ellipsized (`numberOfLines={1}`) — never wraps/clips the card.
- Missing image: neutral plate (see §9) — layout is stable.
- No distance: the footer row keeps the trailing `View` (§13) with no hole.
- The card height stays 120 for density; at large system font scales the fixed height is the one
  residual risk — B1.7.4 verifies it and may switch the vertical card to `minHeight: 120` (Home
  unchanged) only if a real clip is observed.

## 22. RTL

- Layout is **logical**: flex rows, `paddingStart/End` semantics via `spacing` (equal insets),
  no hardcoded `left`/`right`. The card row (image → divider → content) mirrors automatically.
- App bar: back is the natural leading slot; the `BackIcon` glyph is currently drawn pointing
  left and MUST become direction-aware (mirror under RTL) — recorded for B1.7.4. No manual
  per-locale positioning.
- Count and title are centered (alignment-neutral). Distance/service rows use
  `space-between`/leading edges and mirror with the row.
- Arabic copy via system fonts; no forced `textAlign` on dynamic content. Labels stay English in
  this release (no localization system — separate decision).

## 23. Accessibility

- **Card:** `accessibilityRole="button"` + an explicit composed `accessibilityLabel`
  (e.g. `Name: Wench, Services: 3, 1.2 km`) so the row is announced once. Mark the card image
  `accessible={false}` (decorative) to prevent a second, contentless announcement.
- **Back button:** `accessibilityLabel="Go back"` (kept), ≥40dp target + `hitSlop 8`.
- **Count:** plain centered text, NOT a live region — it must not be chatty; it is announced when
  the header is reached.
- **Retry actions:** `ApiErrorRow` keeps `accessibilityRole="button"` on Retry; initial and
  load-more retries are distinct rows.
- **State is never color-only:** empty vs error vs loading differ by text/structure, not colour
  alone.
- Touch targets: back ≥40dp; card is a full-width target; `View` is decorative (no separate
  target).

## 24. Business-model constraints

Yamak is a free, non-profit facilitator/connector. The screen must NOT read as a marketplace,
booking platform, or paid provider catalog. Specifically excluded:

- No prices, fees, KWD amounts, "direct rate", "fixed price".
- No ratings (★), review counts, "verified"/"certified" seals, "responds in <15 mins",
  "member since", transaction counts, ETA/guarantee claims.
- No "0% commission" / payment-through-Yamak copy on the browse list (that language lives, if
  anywhere, on Vehicle Details). The list is neutral browse-and-connect only.
- The provisional new-ui card (price + "Available" pill + city) is rejected.

## 25. KEEP / POLISH / CHANGE / REMOVE (vs B1.3)

| Element | Current (B1.3) | Decision | B1.7 action |
|---|---|---|---|
| Route / `(app)` placement / no tabs / no drawer | pushed authenticated | **KEEP** | unchanged |
| `FlatList` + pagination + refresh + load-more | functional | **KEEP** | unchanged |
| Card reuse (`VehicleItem`) | vertical via `orientation` | **KEEP** | keep single source |
| Count data (`metaData.totalCount`) | trailing slot | **KEEP data** | re-place as subtitle (§7) |
| States (loading/empty/error/load-more) | in place | **KEEP** | keep logic |
| Page background | `phonePrefix` | **KEEP** | already approved light surface |
| App bar | white, back/title/count | **POLISH** | title+count centered stack, fixed 40 slots |
| Spacing | lg inset / md gap | **KEEP** | unchanged |
| Vertical card visual | plain white, square outer | **POLISH** | `radius.md` + border + shadow shell |
| Card missing image | blank | **POLISH** | neutral `phonePrefix` plate (vertical only) |
| `View` chip alignment | leading when no distance | **CHANGE (vertical only)** | trailing always |
| Skeleton | Home-shaped, misaligned | **POLISH** | card-shaped vertical variant |
| Count typography | caption/subtitle | **KEEP** | muted, non-dominant |
| Empty / error / footer visuals | functional | **POLISH** | restrained, distinct |
| Sort UI | absent (deferred) | **KEEP absent** | do not add |
| Search / filters / favorites / contact | absent | **KEEP absent** | do not add |
| A11y card label / decorative image | child text read | **POLISH** | explicit label + `accessible={false}` image |
| Temporary functional styling | ad-hoc | **REMOVE** | replaced by the above shell — behavior untouched |

## 26. Non-goals (B1.7 MUST NOT)

- No functional/navigation/data change; no new hook logic; no pagination change.
- No new dependency, no new theme token/hex, no localization system.
- No sort UI; no search; no filter chips; no service filter; no favorites; no call/WhatsApp/request.
- No backend `distance` display; no "0.0 km".
- No marketplace content (prices/ratings/badges/guarantees/commission copy).
- No changes to Home, Map, Vehicle Details, drawer, tabs, Backend, Dashboard, Legacy, or the
  auth/onboarding gate.
- No native build (`run:android`/Gradle); no commit.

## 27. B1.7 checklist

1. **B1.7.1 — page background + app bar + count:** `phonePrefix` screen, white app bar with
   `insets.top + spacing.sm`, centered title + muted count subtitle, fixed 40 leading/trailing
   slots, hairline bottom. No functional change.
2. **B1.7.2 — vertical `VehicleItem` polish:** vertical-only card shell (`radius.md` + border +
   subtle shadow + `overflow: hidden`), neutral missing-image plate, trailing `View`; Home
   (horizontal) byte-identical.
3. **B1.7.3 — loading / empty / error / load-more:** card-shaped skeleton variant (≈4–6),
   restrained empty copy, `ApiErrorRow` initial + footer retry, small footer spinner.
4. **B1.7.4 — small screen / RTL / a11y:** 360-wide + long-name + missing-image + no-distance
   checks; RTL mirroring of the app bar/back glyph and card row; card `accessibilityLabel` +
   decorative image; verify no clipping at large font scale.
5. **B1.7.5 — runtime visual verification:** Expo Go on the emulator against an isolated stub
   (or the safe LAN dev backend), covering normal list, distance present/absent, missing image,
   empty, initial error, load-more, refresh; `npx tsc --noEmit` (baseline error only) and
   `git diff --check`.

---

### Sample-layout label

The companion `code.html` uses representative placeholder names/counts purely to visualize the
layout. It is explicitly a **DESIGN SAMPLE**, is NOT mobile content, and the Backend remains the
only source of truth. It carries no price/rating/badge/guarantee, consistent with §24.
