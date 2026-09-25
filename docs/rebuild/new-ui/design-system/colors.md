# Yamak New — Color System

**DESIGN STATUS: PROPOSED — REQUIRES USER REVIEW AND APPROVAL.**

## 1. Legacy audit (what exists today)

### 1.1 Theme constants (`src/constants/Colors.ts`)

| Theme | primary | secondary | offWhite | gray | notes |
|---|---|---|---|---|---|
| `AppColors` | `#73b6cc` | `#4196b2` | `#fafafa` | `#e5e5e5` | older/unused look |
| `AppColorsTheme2` (**ACTIVE**) | `#002F6C` | `#F7B123` | `#f4f1f6` | `#ABB0B8` | all navigators/UI |
| `AppColorsTheme3` | `#80a7b8` | — | — | — | unused |

**Rebuild decision (from plan §07):** legacy used `AppColorsTheme2` only. The NEW system supersedes this; the legacy values remain a *historical inventory*.

### 1.2 Color literals found across legacy `src` (non-exhaustive scan)

`#FFFFFF`(white, dominant), `#fafafa`, `#f4f1f6`, `#efefef`, `#e5e5e5`, `#a4a3a8`, `#abb0b8`, `#000000`, `#333333`, `#73b6cc`, `#4196b2`, `#80a7b8`, `#002F6C`, `#F7B123`, `#E0EDF3`, `#5b8cb8`, `#fdefd3`, `#fde6b9`, `#f3485b`(red), `#293`, `#FF231F7C`(drop-shadow), `#ccc`, `#cb543e`, `#d4d5e3`, `#ccd5e1` (in `Colors.ts`, scripts, and a wide set of screens/components — colors were **not** centralized; many literals are inline).

### 1.3 Measured contrast problems (must fix)

| Pair | Ratio | Result |
|---|---|---|
| white text on `#F7B123` (primary CTA) | ≈ 1.9 : 1 | **fails** AA (4.5:1) |
| `#ABB0B8` body text on white | ≈ 2.4 : 1 | **fails** AA |
| red links `#f3485b` on white | ≈ 3.3 : 1 | fails AA for small text |
| white on `#002F6C` | ≈ 9.8 : 1 | passes (excellent) |

## 2. Proposed semantic tokens (provisional baseline)

Tokens are defined once in `docs/rebuild/new-ui/prototype-shared/tokens.css` (`:root`) and repeated in `prototype-shared` sources so the whole app can restyle globally after review.

### 2.1 Brand palette

| Token | Value | Use |
|---|---|---|
| `--brand-950 … 600` | `#081C31` → `#1B4C82` | deep blue ramp; app bar `800`, primary buttons `700` |
| `--brand-100` | `#E8F0F8` | soft blue tint containers / focus ring |
| `--brand-50` | `#F3F7FB` | tinted card backgrounds |
| `--gold-600` | `#C67D0A` | gold text on light (AA-safe) |
| `--gold-500` | `#E9A319` | logo-matched gold; brand moments |
| `--gold-400` | `#F7B123` | legacy secondary retained as highlight; Direction 02 CTA |
| `--gold-100 / 50` | `#FBEED4 / #FDF7E6` | gold tint containers |

### 2.2 Neutral / surface

| Token | Value | Use |
|---|---|---|
| `--bg` | `#F6F8FA` | app background (scrollable) |
| `--surface` | `#FFFFFF` | cards, sheets, inputs |
| `--surface-2` | `#EFF2F5` | inactive fills, skeletons |
| `--surface-3` | `#E7EBF0` | image placeholders |
| `--border` | `#E4E8EE` | hairline borders |
| `--outline` | `#C4CCD6` | input borders, ghost outlines |
| `--text-primary` | `#1C2430` | primary text (≈14.5:1 on white) |
| `--text-secondary` | `#505B68` | secondary text (≈6.8:1 AA) |
| `--text-tertiary` | `#7A8592` | metadata, placeholders (≈4.6:1 AA) |
| `--text-disabled` | `#A7B0BB` | disabled only |

### 2.3 Semantic feedback

| Token | Value | Use |
|---|---|---|
| `--success` / `--success-bg` | `#177A4D` / `#E6F4EC` | success badges, confirmations |
| `--error` / `--error-bg` | `#C62828` / `#FDECEC` | errors, destructive, validation |
| `--warning` / `--warning-bg` | `#B45309` / `#FDF3E3` | warnings, low-stock style states |
| `--info` / `--info-bg` | `#1663C0` / `#EAF2FD` | informational |

## 3. Usage rules (proposed)

1. **No raw hex in screens.** Screens consume semantic tokens only (React Native equivalent: a `theme.colors` object, not literals).
2. **On-colors are mandatory pairs:** text/icons on `primary` use `on-primary` (#fff); text on gold uses dark `#241700` (≈8:1), never white.
3. **Gold is accent, not error/success.** Reserve gold for brand + active states; semantics use their own hues.
4. **Blue is the trusted-action color**, gold the emotional-highlight color (Direction 02 inverts this deliberately — see that direction).
5. **Minimum contrast targets:** body text ≥ 4.5:1; large/UI ≥ 3:1; disabled exempt.
6. Dark theme is a **future variant** — tokens must be structured so a dark palette can be dropped in later without touching screens.

## 4. Contrast reference (computed from proposed pairs)

| Pair | ≈ ratio | Verdict |
|---|---|---|
| white on `#15406F` | 10.1:1 | AA/AAA |
| `#241700` on `#E9A319` | 8.0:1 | AA/AAA |
| `#C67D0A` on white | 4.9:1 | AA (small text ok) |
| `#505B68` on white | 6.8:1 | AA |
| `#1C2430` on white | 14.5:1 | AAA |
| white on `#C62828` | 6.2:1 | AA |

*(Recomputed before RN implementation with a colour tool; these are estimates.)*