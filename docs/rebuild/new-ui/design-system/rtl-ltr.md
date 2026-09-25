# Yamak New — RTL / LTR

**DESIGN STATUS: PROPOSED — REQUIRES USER REVIEW AND APPROVAL.**

Yamak is a Kuwait-first app; Arabic and English are first-class. The design must not be a lopsided mirror — it must use platform RTL correctly.

## 1. Direction platform (React Native)

- Use `I18nManager.isRTL` and RN's default LTR/RTL mirroring for layout primitives. Use logical/`start`/`end` props rather than physical `left`/`right` wherever possible.
- Arabic text with proper Arabic letter-shaping (system fonts handle this). Do **not** force `textAlign: left` for Arabic (legacy `AppText` bug: `arabicRight` used `textAlign: "left"`); instead respect runtime direction.

## 2. Everything that mirrors

| Element | LTR | RTL |
|---|---|---|
| Back chevron | `chevron-back` pointing left | `chevron-forward` pointing right (legacy `GoBackButton` already flips) |
| Push transition | slides right→left | slides left→right |
| Leading icon in input | left | right |
| Drawer | opens from left | opens from right |
| Tab order / list rows | start-to-end | mirrored |
| Price/location meta | start-aligned | mirrored |
| Ratings | star-ltr | mirrored (star order kept LTR visually is acceptable if numerals) |

## 3. Layout that must stay neutral

- **Numerals.** Prices, distances, phone numbers, OTP digits: always **LTR digit layout** (tabular). In RTL they read left-to-right inside an RTL sentence. OTP boxes keep physical order (match code entry sequence).
- **Icons.** Directive icons (phone, pin, chat) don't flip; directional icons (arrows, back, disclosure `›`) flip.
- **Logotypes.** The Yamak logo never mirrors.

## 4. Prototype handling

- Prototypes: `html[dir="rtl"]` class is available in `base.css`; screens render LTR by default; the RTL notes above are the production contract. A full RTL visual pass can be added as `?rtl` variant on the index page if desired.

## 5. Fallback text

- Mixed English/Arabic strings: use `<Text>` with nested runs (`<Text>{en}</Text><Text>{ar}</Text>`) so each runs in its own direction; don't rely on a single `dir` attribute.