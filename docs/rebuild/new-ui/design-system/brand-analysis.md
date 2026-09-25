# Yamak New — Brand Analysis

**DESIGN STATUS: PROPOSED — REQUIRES USER REVIEW AND APPROVAL.**
Source of truth for all brand decisions below: pixel-level analysis of the legacy logo and the legacy stylesheets/constants. These are *recommendations*, not approvals.

## 1. Logo analysis (pixel-level, `src/assets/images/appLogo.png`)

| Property | Value |
|---|---|
| Canvas | 514 × 485 px, `Format32bppArgb` |
| Transparency | 84.6 % fully transparent; 12.3 % opaque; 3.1 % partially transparent |
| Opaque pixel colors | ≈ 75 % gold/amber, ≈ 20 % near-black, tiny remainder (highlights/edges) |
| Dominant gold | `#EEB247` (cluster average `#EEB349` — warm amber-gold) |
| Dark elements | practical black `#030303` (neutral, no color cast) |
| Gold : black ratio | ≈ 4.27 : 1 |
| Blue / white in artwork | essentially none |

**Key conclusion:** the "dark blue" Yamak look is NOT in the logo. It comes entirely from the legacy theme (`AppColorsTheme2.primary #002F6C`). The brand essence of the artwork is **warm gold + neutral near-black**. The design system should treat gold as the emotional brand color and blue as an accent derived from brand context (or replaced if desired), never the inverse.

## 2. Brand essence (proposed positioning)

- **Voice:** road-help and mobility assistance, trusted and approachable (a Kuwait-first roads & helping app).
- **Primary brand moment:** the gold logo on calm, light surfaces — not a heavy blue slab.
- **Logo treatment rules (proposed):** logo is a square-ish artwork with ~85% transparency. Do NOT stretch; always render with `resizeMode: contain`, generous padding, on a tonal container that makes the transparent corners quiet (e.g. `--gold-50`/`--brand-50`), never directly on noisy backgrounds.
- **Tone:** clean, premium, trustworthy. Avoid "warning-yellow" usage of gold (never for errors; errors stay red).

## 3. Brand color usage intent map (proposed)

| Element | Proposed token | Why |
|---|---|---|
| Logo, brand moments, active highlights, celebration | gold `--gold-500/#E9A319` | the figurative color in the artwork |
| Primary actions, app bars, links | deep blue `--brand-700/#15406F` | calm, trustworthy complement to gold (survives contrast: white on it ≈ 10:1) |
| Error / destructive | red `--error/#C62828` | semantics — never gold |
| Success | green `--success/#177A4D` | semantics |
| Surfaces | white + `--surface-2/#EFF2F5` | gives color room to breathe |

## 4. Legacy brand surface behavior (audit) — what changes

| Legacy element | Legacy value | Modern-Yamak proposal |
|---|---|---|
| Auth header | 28%-height `#002F6C` slab, radius 40 bottom, 150px logo | Logo-led header on light/dark tonal band; genuine safe-area handling |
| Home header | `#002F6C` bar, 60px logo right, map pin left | On-brand app bar OR clear bar + brand logo, consistent with approved direction |
| Tab bar | `#002F6C` bar, gold active icon, no labels | Reconsidered: labelled tabs, accessible contrast, active state not color-only |
| Drawer header | `#002F6C` + image bg + avatar | Brand header with user identity; consistent tokens |
| Primary CTA | gold `#F7B123` with **white** text (≈1.9:1 contrast — fails AA) | Gold or blue CTA with *accessible* on-color (dark text on gold ≈ 8:1) |

## 5. Non-negotiables carried forward

- The **logo asset must not be recolored or re-drawn** in this effort.
- Arabic (RTL) and English are first-class; direction-aware back chevron behaviour already exists in legacy and is retained.
- Kuwait-market first app; real estate images are the top content type.

## 6. Reference files

- Legacy logo: `yamak-mobile/src/assets/images/appLogo.png`
- Legacy constants: `yamak-mobile/src/constants/Colors.ts`, `fonts.ts`, `Sizes.ts`
- Legacy header usage: `yamak-mobile/src/components/auth/registerHeader.tsx`, `HomeStackNAvigator.tsx`, `TabNavigator.tsx`, `CustomDrawerContent.tsx`