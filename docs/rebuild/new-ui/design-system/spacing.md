# Yamak New — Spacing & Radius

**DESIGN STATUS: PROPOSED — REQUIRES USER REVIEW AND APPROVAL.**

## 1. Legacy audit (what we are replacing)

- No spacing scale existed. Values were mixed: `marginVertical: 20`, `8%` top margins, `marginHorizontal: 15`, header `height: "28%"`, `borderBottomLeftRadius: 40` etc.
- Buttons: `minHeight: 40`, `borderRadius: 15`.
- Cards and sections varied freely; no grid rhythm.

## 2. Proposed spacing scale

Base unit **4px**; keyed tokens used by every screen. In CSS prototypes these are `--space-1 … --space-9`; in RN they become a `SPACING` constant map.

| Token | px | Typical usage |
|---|---|---|
| `--space-1` | 4 | icon gaps, badge padding |
| `--space-2` | 8 | inner control gaps, chip gaps |
| `--space-3` | 12 | list-row padding, card inner gaps |
| `--space-4` | 16 | page body padding, card padding (default) |
| `--space-5` | 20 | section-to-section gaps (services → adds → vehicles) |
| `--space-6` | 24 | major section separation, sheet content margin |
| `--space-7` | 32 | block boundaries (top of content under headers) |
| `--space-8` | 40 | empty-state / error blocks |
| `--space-9` | 48 | large modal / confirmation spacing |

## 3. Proposed radius scale

| Token | px | Use |
|---|---|---|
| `--radius-sm` | 8 | icons inside rows, small chips |
| `--radius-md` | 12 | inputs, buttons, list rows (default control) |
| `--radius-lg` | 16 | cards, vehicle cards |
| `--radius-xl` | 24 | sheets, large modals, hero images |
| `--radius-pill` | 999 | chips, badges, segmented control |

**Direction overrides:** D1 raises radius (softer, friendlier); D2 lowers slightly (more legacy-like);
D3 raises hardest (premium, editorial). Token swap only.

## 4. Layout densities (proposed)

| Density | Horizontal padding | Control height | Use |
|---|---|---|---|
| Comfortable (default) | 16px page | 48–52px buttons/inputs | most app screens |
| Dense | 16px page, tight rows | 44px | list-heavy screens (all vehicles, favourites) |
| Generous | 16–20px page | 52px | auth forms, empty states |

## 5. Rules

1. **4px grid** always; no arbitrary numbers (exceptions only for native-safe areas).
2. **Touch targets ≥ 44×44** (HIG) and ≥ 48dp height for buttons/inputs; spacing between controls ≥ 8px.
3. **Safe areas:** respect status bar (top) and home-indicator (bottom) insets via opaque paddings; do not simulate in prototypes with magic numbers.
4. Card padding 16px consistent; card-to-card gap 12–16px.
5. Section headers: 20px above, 12px below.

## 6. Reference

- Legacy sizes: `D:\AALYASSIN\Projects\work\YamakProject\yamak-mobile\src\constants\Sizes.ts`
- Applied in: `docs/rebuild/new-ui/prototype-shared/tokens.css`