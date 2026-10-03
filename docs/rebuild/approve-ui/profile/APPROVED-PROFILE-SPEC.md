# APPROVED PROFILE DESIGN SPEC — A4.3
Status: APPROVED (functional basis). Design status: not final UI polish, but approved structure.

## A. Screen Structure
- Route: /profile (src/app/(app)/(tabs)/profile.tsx)
- Protected by (app)/_layout.tsx
- ScrollView with content padding, no tabs/_layout (A5 owns)
- Sections: Header (identity), Menu (functional only), Footer (branding)

## B. Header
- Centered, vertical stack
- Avatar: circular, primary background, white border, initials from name (max 2 chars)
- Identity: name (primary/title), email (subtitle). Show conditionally if present.

## C. Identity Card
- Minimal: no photo (real data unavailable), no stats/badges/membership/provider status
- Real data only: name, email. Phone optional if non-empty (not shown in A4.2 baseline).

## D. Sections
- Menu section is a single surface card (rounded, subtle elevation/shadow) containing rows.
- No artificial "Account/Support/General" dividers required today; structure supports adding future sections without redesign.

## E. Menu Row Anatomy
- Height: comfortable touch target (>=48dp)
- Flex row: label left, chevron right
- Divider: hairline bottom border between items (last item may omit)
- Press state: opacity
- External actions: chevron indicates navigation/action; no separate external icon required for minimal spec (can revisit in A4.4 polish)

## F. Logout Treatment
- Standard menu row, labeled "Logout", destructive semantics on confirmation (Alert destructive). Visual destructive styling may be applied in A4.4 if approved; behavior unchanged.

## G. Footer
- "Powered By Yamak" text centered (branding/footer). May be non-tappable branding; external tap exists via menu row as well.

## H. Spacing/Radius/Token Guidance
- Use src/theme tokens: colors, spacing, fontWeight/typography
- Surface background, card radius ~20, padding consistent with spacing.xl/lg
- Hairline borders using colors.border

## I. RTL Rules
- Chevron direction must respect layout (existing approach). Text alignment follows system; identity centered. Avoid hardcoded LTR assumptions.

## J. Real-Data Rules
- Only render fields present in AuthProvider.user (name, email, phone). No fake/demo content.
- Initials fallback only. No remote photo.

## K. Deferred-Feature Rules
- Do not render dead buttons. Future rows (My Cars, Favorites, Edit Profile, Contact Us, Join Us, Language, About Yamak, Notifications, Delete Account, Environment) only when route/feature exists.

## Comparison Summary
- Current A4.2 matches minimal functional parity; provisional new-ui adds visual polish + potential fake/demo elements (avoid). Legacy gives content/ordering reference.

## Recommendation
- Approve structure as above. Implement visual polish in A4.4 without adding dead buttons or fake data.
