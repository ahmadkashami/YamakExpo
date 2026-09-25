# Yamak New — Accessibility

**DESIGN STATUS: PROPOSED — REQUIRES USER REVIEW AND APPROVAL.**

## 1. Standards consulted (2026)

- **WCAG 2.1** — SC 1.4.3 Contrast (Minimum): 4.5:1 normal text; 3:1 large text (≥18pt or 14pt bold) & UI. W3C page accessed; rationales recorded.
- **Material Design 3** — accessible colour role pairs (min 3:1 pairings), tonal scheme, dynamic/dark theme, type scale ≥10sp, elevation-tone system. M3 docs accessed.
- **Apple HIG** — 44×44 touch targets, button style-not-size hierarchy, filled = primary, destructive roles, tab bar labels+badges, nav bar back behaviour, modal from bottom + labelled actions.
- **Mobile-first** banking/app conventions (Mobbin inaccessible — see report item 7).

## 2. Non-negotiables

1. **Contrast AA minimum** everywhere; pairs are pre-computed in `colors.md`. Small text ≥ 4.5:1, large/UI ≥ 3:1. Never white-on-gold (1.9:1 legacy failure).
2. **Touch targets ≥ 44×44** (HIG), control spacing ≥ 8px; buttons min-height 48.
3. **Never colour-only** for state: active/selected/errors always combine colour + icon + label + weight.
4. **Text scaling:** all type in `sp`/scalable units with system font scaling enabled; body ≥ 12px minimum.
5. **Focus visibility:** visible focus rings in prototypes (`.input:focus`, `.btn:focus`); RN: focus state + `accessibilityState` correctly set.
6. **Screen-reader labels:** input labels, icon buttons `accessibilityLabel`, live regions for toasts/status; decorative icons hidden.

## 3. Language & semantics

- Always alternative text for media; real text instead of images-of-text.
- Form: labels associated with inputs; `autoComplete` hints (RN); errors announced.
- `prefers-reduced-motion`: disable shimmer/transitions when reduced motion is on.

## 4. Colour-blind safe dissonance

- Do NOT differentiate success/error only by hue: pair red/green with icons (`✓`/`⚠`) and text.
- Gold/blue primary hierarchy is luminance-differentiated (safe for common CVD).

## 5. RTL (cross-ref `rtl-ltr.md`)

- Correct direction, mirrored chevrons, correct numeral handling.

## 6. Verification checklist (per screen before commit)

- [ ] All text pairs ≥ AA (tool-verified, not estimated).
- [ ] Every interactive element ≥ 44px and reachable by keyboard/scroll.
- [ ] Labels announced, roles correct, disabled/selected states exposed.
- [ ] Reduced-motion respected; text scales to ≥ 200% without breakage.
- [ ] Dark theme candidate identified (tokens, not per-screen hacks).