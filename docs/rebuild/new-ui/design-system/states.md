# Yamak New — States & Feedback

**DESIGN STATUS: PROPOSED — REQUIRES USER REVIEW AND APPROVAL.**
Defines every major UI state *before* production coding. Prototype reference: `showcase/states.html` (one page demonstrates all states; no duplicated files per trivial state).

## 1. State inventory by screen type

| Screen type | default | loading | empty | error | success |
|---|---|---|---|---|---|
| Auth form (login/register…) | fields + CTA | button spinner on submit | — | `.form-error-box` for API errors + field hints | toast → navigate |
| OTP | 6 boxes + resend countdown | verifying spinner | — | wrong-code alert + `.otp` shake | auto-advance |
| Home | services grid + adds + vehicles + map card | skeleton sections | empty sections hide | per-API inline retry card | toast |
| Lists (vehicles, favorites) | `.v-card` rows | skeleton cards | `.empty` with CTA | inline error + Retry | — |
| Details (vehicle) | media + facts + actions | skeleton hero | n/a | offline banner | add-to-favorites toast |
| Profile/account | profile card + menu rows | sv-cheap avatars | n/a | API error box | save-success toast |
| Settings/edit forms | fields | fetch skeleton | n/a | validation + save error | success panel + disabled Save |
| Modal/sheets (privacy, search, join) | sheet content | thin loader row | `.empty` (search no results) | inline error | sheet closes |
| Notifications | list | skeletons | `.empty` | retry card | read/clear toasts |
| No-network | — | — | — | full-screen offline retry | recovery |

## 2. Global state primitives (shared components)

- **Loading:** skeleton shimmer (`.skeleton`) for first paint; `ActivityIndicator` inside CTAs for actions; keep the last-good data visible on refresh.
- **Empty (`.empty`):** circle icon in `--surface-2`, title, caption, optional action. Never a bare "no data".
- **Error (`.alert.err`, `.form-error-box`):** message + Retry where recoverable; preserve input values on validation error.
- **Success (`.modal-msg-ic.ok`, toast):** confirmation modal template for destructive/committed actions; toasts for ephemeral feedback.
- **Disabled (`.btn[disabled]`):** visual 45% opacity; primary stays recognizable.
- **Selected (`.chip.on`, `.seg on`, `.tab on`):** fill + color + weight change; never color-only (colour-blind safe).
- **Validation error (`.input.err` + `.hint-err`):** field-level, inline, on submit or blur; scrolls first error into view.

## 3. When to use what

| Situation | Use |
|---|---|
| Loading fresh screen content | skeletons (never spinners full-screen) |
| Short action (submit, resend) | spinner inside button label |
| Persistent network loss | offline banner (global) → full no-network screen when unreachable route |
| List fetch failure | inline error card + Retry |
| No results from search/filter | empty state with "Clear filters" |
| Record deleted / confirmation | confirmation modal (destructive styled) |
| Short confirmation (added to favourites) | success toast |
| Mandatory context shift | bottom sheet / modal (search, privacy, join) |

## 4. Permission / location (Map feature)

- Location disabled → Map shows persistent inline prompt card with **"Enable location"** (settings deep-link), not a silent blank map.
- Permission-granted → normal map; loading skeleton on map frame until tiles ready.