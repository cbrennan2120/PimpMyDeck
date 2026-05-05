# Binder Table Visual Redesign Spec

## Goal
Restyle Pimp My Deck into a dense, practical MTG trade-binder workspace using 4th Edition white-border card language and WUBRG accents.

## Direction
Use the selected **Binder Table** direction. The card gallery is the primary surface, with controls compressed into practical trays and side panels. The app should feel like sorting a trade binder at a game table, not a marketing page or fantasy illustration.

## Visual System
- Base background: warm parchment/off-white, not gray SaaS.
- Primary frames: white-border card frames with thin black rules and subtle beveled inner borders.
- Text: keep current readable sans-serif for UI controls; use a restrained serif only for major brand/display moments if it improves the MTG feel.
- Accent palette:
  - White: `#f6eed7`
  - Blue: `#1769a6`
  - Black: `#25211d`
  - Red: `#b43a2f`
  - Green: `#28724d`
  - Parchment: `#f7f3e7`
  - Ink: `#17130f`
- WUBRG appears as small pips, segmented controls, badges, and section indicators. Do not let it become a rainbow background.

## Layout Changes
- Keep the first screen as the actual optimizer.
- Convert the main results area into a dense binder grid/list hybrid:
  - Larger selected card image than today, but not oversized.
  - Candidate prints remain expandable.
  - Quantity, section, set, treatment, lock state, warnings, and buy action must remain visible or one click away.
- Convert side panels into “binder notes” cards:
  - Account
  - Deck Format
  - Format Warnings
  - Deck Value
  - Quick Actions
  - Saved Decks
  - Data Status
- Replace generic black/emerald button emphasis with MTG-style button states:
  - primary actions use ink/white-border treatment
  - save/auth success uses green
  - warnings use red/amber sparingly
  - vibe/filter buttons use WUBRG pip accents

## Constraints
- Preserve all existing functionality.
- Preserve dense workflow for 60-100 card decks.
- Do not add a landing page.
- Do not add large decorative fantasy art, gradient blobs, or card-in-card nesting.
- Keep mobile usable with stacked trays and compact card tiles.

## Acceptance Criteria
- The app visually reads as white-border MTG/4th Edition inspired.
- The main card gallery is more prominent than side panels.
- WUBRG accents are visible but controlled.
- Text remains readable and controls remain scan-friendly.
- Existing tests, lint, and build pass.
- Netlify deploy remains manual only.
