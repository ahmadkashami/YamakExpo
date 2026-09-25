# Yamak New — Typography

**DESIGN STATUS: PROPOSED — REQUIRES USER REVIEW AND APPROVAL.**

## 1. Legacy audit

- `src/constants/fonts.ts` defines **only two families**: `Roboto-Medium` and `Roboto-MedItalic`.
- `src/constants/Sizes.ts` scale: 12 / 14 / 16 / 18 / 20 / 24 / 32.
- `AppText` wraps everything; forces `Roboto-Medium`, and for `isArabic` forces `textAlign: "left"` (inconsistent with RTL need).
- Legacy buttons letter-spaced + capitalized; font-weight driven per-style.

**Conclusion:** the two weights, the medium-only set, inline sizes, and the hard-coded English alignment do not scale. Replace with a token-based type scale. (Direction 03 experiments with a heavier, more editorial display look; the provisional baseline stays on the system font for zero-asset cost and max legibility — Arabic shaping works best with the platform's system font anyway.)

## 2. Proposed type ramp (provisional baseline)

Tokens map cleanly to both CSS prototypes (`--text-*`) and a future RN `theme.typography`.

| Token | Size / Line | Weight | Use |
|---|---|---|---|
| `display` | 34 / 40 | 800 | hero numerals, welcome display, big empty-state numbers |
| `title-xl` | 26 / 32 | 800 | screen-level hero titles |
| `title-lg` | 22 / 28 | 700 | screen titles, section headers |
| `title-sm` | 18 / 24 | 600–700 | card titles, list row titles |
| `body-lg` | 16 / 24 | 400 | buttons (700), primary body copy |
| `body` | 15 / 22 | 400 | default text |
| `body-sm` | 14 / 20 | 400 | secondary copy, list metadata |
| `label` | 13 / 18 | 500–600 | field labels, chips |
| `caption` | 12 / 16 | 400 | timestamps, footnotes, helper text |

**Never go below 12px.** All sizes are rem/`sp`-like so system text scaling works.

## 3. Fonts / families (proposed)

- **Provisional baseline:** platform system font stack — Segoe UI / Roboto / SF Pro Text + system-ui — because the app is RN (Roboto on Android, SF on iOS) and Arabic needs proper system shaping. No download cost, crisp at all weights.
- **Direction 03 (Premium):** allow an editorial display font for display/headline roles (e.g. geometric/condensed serif or a high-contrast sans), body stays system.
- If a brand font is desired later, it must ship with both Latin and Arabic coverage and be registered as a single token swap.

## 4. Rules

1. Text uses `Text` with `allowFontScaling` on (system accessibility).
2. Font *weight* > font *size* for hierarchy first; color next; size last (M3/HIG-aligned).
3. Arabic: use native system `fontWeight` (Roboto/SF render Arabic weight via system); do **not** hard-code `textAlign: left` — use correct RTL alignment.
4. Buttons: `body-lg` weight 700, single line, optional icon; keep letter-spacing ≤ 0.5px.
5. Numerals (prices, distances): same family; consider `fontVariant: tabular-nums` for price columns.

## 5. Remaps (legacy → new)

| Legend build | New |
|---|---|
| `AppSizes.small` 12 | `caption` 12 |
| `AppSizes.xSmall` 14 | `body-sm` 14 |
| `AppSizes.medium` 16 | `body` 15 / `body-lg` 16 |
| `AppSizes.xMedium` 18 | `title-sm` 18 |
| `AppSizes.large` 20 | `title-sm/lg` 18–22 |
| `AppSizes.xLarge` 24 | `title-lg` 22 / `title-xl` 26 |
| `AppSizes.xxLarge` 32 | `title-xl`/`display` 26–34 |
| `Roboto_Med` everywhere | role-based weights (400/600/700/800) |