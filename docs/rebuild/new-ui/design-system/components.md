# Yamak New — Component System

**DESIGN STATUS: PROPOSED — REQUIRES USER REVIEW AND APPROVAL.**

Every component below maps to a legacy component (Preserve / Modernize / Replace) and a live prototype class in
`docs/rebuild/new-ui/prototype-shared/components.css`.

## 1. Buttons

| Component | Legacy (`FilledButton`, `OutLinedButton`, …) | Proposal |
|---|---|---|
| Primary (filled) | gold `#F7B123` + **white** text (1.9:1 ✗) | `btn-primary` deep blue `--brand-700`, white text (10:1 ✓); in D2 = gold with dark text |
| Secondary / brand CTA | — (legacy used gold for primary) | `btn-gold` gold `--gold-500` + dark `#241700` (8:1 ✓) for brand moments |
| Outlined | legacy outline style | `btn-outline` 2px outline, blue text |
| Ghost / text | links + footer links | `btn-ghost`, `tbtn` underline links |
| Destructive | loose red links | `btn-danger` red, only for destructive confirms |
| Icon / FAB | none | `btn-icon` 48px; no FAB unless approved |

**Rules:** min-height 48; rounded `--radius-md`; one primary per view; disabled = 45% opacity (state still visible); loading state = inline spinner + label change (`"Checking out…"` style).

## 2. Inputs / forms

| Component | Legacy | Proposal |
|---|---|---|
| Text input | ad-hoc; `AppTextInput` is a stub | `field` + `.label` + `.input` 52px, focused ring, error variant |
| Validation | Formik/Yup direct | inline `.hint-err`/`.hint-ok` under field + `.form-error-box` for API errors |
| Country picker | `CountryPicker` modal | `country-pick` row control → opens sheet |
| OTP | `CodeAuthModel` 6-digit | 6 `.otp` boxes, filled states, auto-advance (prototype shows filled/ok) |
| Terms checkbox | custom pressable | `.check` + `.checkbox-row` with rich-text terms links (FooterArea) |
| Selection | ad-hoc | `.seg` segmented control; chips for filters |

**Rules:** labels ≥ 12px weight 600; placeholder `--text-tertiary`; error state = red border + red-tinted bg + hint; never disable a required field after entry. Keyboard: onSubmitOrder chains fields; `keyboardShouldPersistTaps`.

## 3. Cards, lists, media, status

| Component | Legacy | Proposal |
|---|---|---|
| Home service grid | `ServicesList` | 2-col `.grid2` of `.service-tile` (icon in gold tint) |
| Adds / banner | `AddsList` (legacy `adds`) | full-width media card `.card` with 16:9 media |
| Vehicles list | `VehiclesList` / `AllVicelessScreen` | `.v-card` (media 16:9 thumb, title, price, location, badge) for list, `.grid2` for grid views |
| Map link card | `ViewMap` | media map frame with pin + "Open map" link |
| Standard row | Drawer/contact/list items | `.row` with leading icon, main, chevron |
| User/avatar | `profile2.png`, drawer avatar | `.avatar` (initial fallback) + optional image |
| Natural ratings | legacy varied | `.rating` gold stars |
| Image placeholders | none | `.snippet .med` neutral `surface-3` + shimmer skeleton on load |

## 4. Feedback / affordances

- **Loading:** `.skeleton` shimmer for lists; spinners for actions; never blank screens.
- **Empty:** `.empty` — icon in `surface-2` circle, title, secondary line, optional action `.tbtn`.
- **Error / offline:** `.alert.err`, `.form-error-box`, `.offline-banner`.
- **Toast:** `.toast` (ok/err) anchored above tab bar; auto-dismiss; not for persistent errors.
- **Success / confirmation:** `.modal-center` + `.modal-msg-ic.ok`, or in-flow success panel.

## 5. Legacy component disposition list

| Legacy file | Disposition |
|---|---|
| `common/FilledButton.tsx` | Replace (contrast + token-driven) |
| `common/OutLinedButton.tsx` | Modernize into `btn-outline` |
| `AppText.tsx` | Replace wrapper; keep i18n + Arabic-aware behaviour |
| `AppTextInput.tsx` | Replace (stub, unused) |
| `GoBackButton.tsx` / `GoBackButtonRelative.tsx` | Preserve behaviour (RTL-aware chevron), restyle via tokens |
| `CountryPicker.tsx` | Modernize (sheet-based) |
| `FooterArea.tsx` | Modernize: term/privacy links vs helper text hierarchy; fix red-link contrast |
| `ChangeLanguageLable.tsx` | Modernize (toggle row) |
| `LoadingLootie.tsx` | Replace with `ActivityIndicator` + skeleton strategy |
| `AppPressable.tsx`, `AppSeparator.tsx`, `AppIcon`/icons | Preserve as base primitives |