# YAMAK NEW — UI/UX DESIGN PHASE (YAMAK-DESIGN-001)

> **DESIGN STATUS: PROPOSED — REQUIRES USER REVIEW AND APPROVAL.**
> Nothing in this folder is approved production design. Nothing here is React Native code (CSS tokens here are prototype/documentation artifacts, **not** the RN theme).
> No screens in this workspace were/will be committed as production code during the design phase.

## Goal

Design the **complete visual language of the new Yamak** once — screen inventory, flows, brand study, design system, three visual directions, and a provisional full-app prototype — so later screen-by-screen RN implementation happens against an approved system instead of re-doing design analysis per screen.

## How to review (entry point)

Open in a browser: **`docs/rebuild/new-ui/index.html`** — it links the design system, the three directions, every screen prototype, and the states showcase.

Legacy logo copy kept at `assets/appLogo.png` (fuelled by `yamak-mobile/src/assets/images/appLogo.png`); used only inside these prototypes.

## Workflow encoded in the rebuild plan

```
LEGACY APP ANALYSIS → COMPLETE SCREEN/FLOW INVENTORY → BRAND ANALYSIS →
EXTERNAL UI/UX RESEARCH → YAMAK NEW DESIGN SYSTEM → COMPLETE APP UI PROTOTYPES →
USER REVIEW → REFINEMENT → USER APPROVAL → SCREEN-BY-SCREEN RN IMPLEMENTATION
```

**Design is app-wide now. Implementation stays one small verified step at a time.** Producing complete prototypes does NOT change the incremental build workflow.

## Folder map

- `screen-inventory.md` — all 28 real legacy screens (source, route, navigator, purpose, reach, actions, states, related).
- `app-flow.md` — actual legacy navigation tree + primary flows.
- `UI-CATALOG.md` — every screen ↔ prototype path ↔ status (all PROPOSED / NEEDS REVIEW).
- `design-system/` — brand-analysis, colors, typography, spacing, components, navigation, states, rtl-ltr, accessibility.
- `prototype-shared/` — `tokens.css` (single source for the palette/type/spacing/radius tokens), `base.css`, `components.css`, plus `direction-0N.css` for the three visual directions.
- `directions/01-clean · 02-brand · 03-premium` — the three complete visual directions (register, home, vehicles list, vehicle details).
- `auth/… · onboarding/ · main/…` — provisional-baseline prototypes for every real screen, linked into coherent flows.
- `main/drawer/index.html` — the drawer-overlay demonstration.
- `showcase/states.html` — the shared state catalogue (loading, empty, error, disabled, selected, validation, success, offline, toast, skeleton).

## Status rules

- All designs start **PROPOSED / NEEDS REVIEW**.
- Noting **APPROVED** happens only after explicit user approval of the Yamak New direction.
- After approval: continue screen-by-screen RN implementation per `docs/rebuild/13-SCREEN-BY-SCREEN-REBUILD-PLAN.md`; the review entry point is used to compare each built screen against the approved design.