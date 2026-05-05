# Binder Table Visual Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle Pimp My Deck into a dense MTG trade-binder workspace using white-border 4th Edition visual language and WUBRG accents.

**Architecture:** Keep app behavior unchanged. Add a small theme layer in global CSS, then refactor repeated visual class strings in `DeckOptimizer` into named helper constants/components where useful. The redesign is presentational and should not change APIs, saved data, auth, resolver behavior, or deploy workflow.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS v4, lucide-react.

---

### Task 1: Theme Tokens And Base Surface

**Files:**
- Modify: `C:\Users\BCPets\PimpMyDeck\src\app\globals.css`
- Modify: `C:\Users\BCPets\PimpMyDeck\src\components\deck-optimizer.tsx`

- [ ] Add CSS custom properties for MTG palette:
  - `--pmd-paper: #f7f3e7`
  - `--pmd-card: #fffaf0`
  - `--pmd-frame: #d7cec0`
  - `--pmd-ink: #17130f`
  - `--pmd-white: #f6eed7`
  - `--pmd-blue: #1769a6`
  - `--pmd-black: #25211d`
  - `--pmd-red: #b43a2f`
  - `--pmd-green: #28724d`
- [ ] Update `body` background from flat gray/off-white to parchment radial/linear treatment using those variables.
- [ ] Add reusable CSS classes:
  - `.pmd-card-frame`
  - `.pmd-panel`
  - `.pmd-rule-box`
  - `.pmd-mana-pip`
  - `.pmd-binder-grid`
- [ ] Replace top-level `<main>` background classes with the new parchment theme.
- [ ] Run `npm run lint` and `npm run build`.
- [ ] Commit with message `Add Binder Table theme tokens`.

### Task 2: WUBRG Vibe Controls

**Files:**
- Modify: `C:\Users\BCPets\PimpMyDeck\src\components\deck-optimizer.tsx`
- Optional test: no unit test required; presentational only.

- [ ] Add a helper map in `deck-optimizer.tsx` assigning vibe IDs to WUBRG accent classes:
  - `retro`: white
  - `showcase`: blue
  - `secret-lair`: black
  - `foil`: red
  - `cheap-foil`: green
  - `max-flex`: five-color
- [ ] Add a compact `ManaPip` component that renders one or more `.pmd-mana-pip` spans with accessible labels.
- [ ] Update vibe buttons to show pips before labels and use ink/white-border styling.
- [ ] Keep all existing `onClick`, disabled, active-vibe, and title behavior unchanged.
- [ ] Run `npm run lint` and `npm run build`.
- [ ] Commit with message `Restyle vibe controls with WUBRG pips`.

### Task 3: Dense Binder Card Tiles

**Files:**
- Modify: `C:\Users\BCPets\PimpMyDeck\src\components\deck-optimizer.tsx`
- Modify: `C:\Users\BCPets\PimpMyDeck\src\app\globals.css`

- [ ] Restyle `DeckCard` as a dense binder tile:
  - white-border outer frame
  - selected print image on the left for desktop
  - rules-text style metadata panel on the right
  - action buttons kept compact
- [ ] Preserve unresolved correction input and candidate picker.
- [ ] Update selected print badges to use set/treatment/price rows with high contrast.
- [ ] Keep mobile layout stacked with image above metadata.
- [ ] Ensure text does not overflow in card names, set names, buttons, or badges.
- [ ] Run `npm run lint` and `npm run build`.
- [ ] Commit with message `Restyle deck cards as binder tiles`.

### Task 4: Binder Notes Sidebar

**Files:**
- Modify: `C:\Users\BCPets\PimpMyDeck\src\components\deck-optimizer.tsx`

- [ ] Restyle sidebar sections as binder notes using `.pmd-panel`.
- [ ] Keep these sections and order:
  - Account
  - Deck Format
  - Format Warnings
  - Swipe Review
  - Deck Value
  - Quick Actions
  - Affiliate disclosure
  - Saved Decks
  - Data Status
  - Export Preview
- [ ] Make side panels denser by reducing excessive padding while preserving tap targets.
- [ ] Use WUBRG accents sparingly for status: green for signed in/save, red/amber for warnings, blue for data/cache.
- [ ] Run `npm run lint` and `npm run build`.
- [ ] Commit with message `Restyle sidebar as binder notes`.

### Task 5: Final Verification And Manual Deploy Gate

**Files:**
- Modify only if verification reveals a visual or build issue.

- [ ] Run `npm test`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Start/check local app at `http://localhost:3000`.
- [ ] Verify manually:
  - homepage loads
  - deck paste/resolve still works
  - guest auth state still visible
  - save buttons remain disabled for guests
  - format warnings still show after deck resolve
  - card tiles remain readable on desktop and mobile widths
- [ ] Push to GitHub.
- [ ] Do not deploy Netlify unless user explicitly approves a manual deploy.
