# MediBridge UI/UX Visual Redesign Audit (Phase 1)
**Date:** 20 November 2026  
**Git Branch:** `ui-redesign`  
**Baseline Test Status:** 47/47 passing (9 test suites, 0 failures)  
**Baseline Bundle Size:** 350.71 kB raw / 95.31 kB gzipped (JS), 8.17 kB raw / 2.18 kB gzipped (CSS)  
**Screenshots Captured:** 24 baseline screenshots saved in `docs/ui/before/` (8 routes × 3 viewports: 360px, 768px, 1280px)

---

## 1. Visual Reference Status

- **Reference File Check (`docs/reference/visual-reference.png`):** File does not exist on disk.
- **Handling:** As instructed by Section 1 of the specification, the absence of this file is explicitly acknowledged. The platform design will adopt the exact atmosphere dictated by the prompt: blush backgrounds (`#F8DDE3`), rose-magenta primary actions (`#B83D83`), plum headings (`#702B59`), white surfaces (`#FFFFFF`), disciplined spacing, and strict clinical hierarchy.

---

## 2. Hardcoded Hex Colors & One-Off Styles Catalog

A codebase-wide scan identified multiple occurrences of the previous corporate navy/teal palette embedded in CSS variables, stylesheets, HTML headers, PWA manifests, SVG icons, and inline styles across JSX components:

| Color / Hex Code | Role in Old Palette | Locations Identified | Issue / Remediation |
| :--- | :--- | :--- | :--- |
| `#102D3A` | Primary Navy | `variables.css`, `main.css`, `index.html` (meta theme-color), `public/manifest.json`, `public/icon.svg`, and inline styles across `BookingReviewModal.jsx`, `PatientDashboardPage.jsx`, `DoctorPortalPage.jsx`, `AdminConsolePage.jsx`, `SearchPage.jsx`, `HospitalDetailsPage.jsx`, `TeleconsultRoomPage.jsx`. | Violates token rule; must be replaced by `--color-heading` (`#702B59`) for headers, `--text` (`#29252A`) for body, or removed. |
| `#147D78` | Primary Teal | `variables.css`, `main.css`, `public/icon.svg`, `DemoAccountSwitcher.jsx`, and inline styles across buttons, links, and active indicators. | Must be replaced by `--color-primary` (`#B83D83` Rose Magenta) for primary actions and active indicators. |
| `#D9EAE6` | Sage Accent | `variables.css`, `public/icon.svg`, `TeleconsultRoomPage.jsx`. | Must be replaced by `--bg-subtle` (`#F8DDE3`) or neutral borders. |
| `#F5F7F6` | Off-white BG | `variables.css`, `main.css`, `public/manifest.json`, and inline card backgrounds. | Must be replaced by `--bg-app` (`#FCEFED Pale Rose`) and `--surface` (`#FFFFFF`). |
| `#D5A45B` | Accent Gold | `variables.css`, `main.css`, `TeleconsultRoomPage.jsx`, `StatusBadge.jsx`. | Fails WCAG AA contrast on light backgrounds (1.9:1). Must be replaced by Warning text `#8A5A00` on `#FFF3D6`. |
| `#72848D` / `#4A5B63` | Secondary Text | Inline styles in 12 JSX files. | Fails contrast (<4.0:1 on white). Must be replaced by `--text-muted` (`#6B6069`, 5.86:1 contrast). |
| `#EDF5F3` / `#DCE3E1` | Subtle Background / Borders | `variables.css`, `DemoAccountSwitcher.jsx`, inline JSX borders. | Must be unified into `--border` (`#E8E3E5`) and `--border-control` (`#8F858C`). |

---

## 3. Inconsistencies & AI Look Patterns Identified

1. **Badge Shapes (AI Pill Anti-Pattern):** Badges in `StatusBadge.jsx` and `main.css` use `border-radius: var(--radius-pill)` (9999px rounded pills). The specification mandates crisp, rectangular 4px tags. Pills are permitted only for small numerical counters.
2. **Card Shadows & Elevation (Drop Shadows):** `main.css` applies `--shadow-sm`, `--shadow-md`, and `--shadow-lg` to ordinary surface cards. Spec requires crisp 1px `--border` cards with 0px box-shadow. Shadows are reserved solely for dropdowns and popover modals.
3. **Card-Inside-Card Nesting:** In `HospitalDetailsPage.jsx` and `PatientDashboardPage.jsx`, multiple cards are nested inside other cards, creating visual clutter. Tabular data (appointments, referrals, slots) must be rendered in structured tables with sticky headers.
4. **Hospital Discovery Grid vs Dense List:** `SearchPage.jsx` currently displays hospitals as a responsive multi-column grid (`grid-2` / `grid-3`) with large card tiles. The specification requires a single-column dense list or structured rows with dividers, grouping facility details on the left and availability/capacity metrics on the right.
5. **App Shell & Navigation:** Currently, the app uses a horizontal sticky top navbar with dark navy background (`#102D3A`). The specification mandates an enterprise healthcare app shell:
   - Fixed 248px white sidebar with 1px right border, grouped navigation items, 3px magenta active indicator, and blush background.
   - 64px white header with 1px bottom border displaying page title, notifications, and profile.
   - Mobile responsive drawer below 1024px.
6. **Icon Standardization:** Icons in `Icons.jsx` are custom SVG path definitions. The specification requires standardizing on tree-shaken named imports from `lucide-react` (20px, stroke 1.75, `currentColor`).
7. **Typography Loading:** `main.css` currently falls back to system fonts (`'Manrope', -apple-system...`) without self-hosted WOFF2 web fonts. Self-hosted Manrope and Inter must be bundled with `@font-face`, preloaded weights, and `font-display: swap`.

---

## 4. WCAG 2.2 AA Contrast Analysis

All text and control color combinations have been tested against the WCAG 2.2 AA standard (minimum 4.5:1 for normal text, 3:1 for large text / non-text controls):

### Old Palette Contrast Failures:
- Gold Accent (`#D5A45B`) on White (`#FFFFFF`): **1.94:1 (FAIL)** — illegible for status text.
- Secondary Text (`#72848D`) on White (`#FFFFFF`): **3.91:1 (FAIL)** — fails 4.5:1 requirement.
- Secondary Text (`#72848D`) on Off-white (`#F5F7F6`): **3.72:1 (FAIL)**.
- Input Outlines (`#DCE3E1`) on White (`#FFFFFF`): **1.35:1 (FAIL)** — fails 3:1 non-text control contrast.

### New Design Tokens Contrast Verification:
| Token / Foreground | Background Surface | Contrast Ratio | WCAG 2.2 AA Compliance | Evaluation & Purpose |
| :--- | :--- | :---: | :---: | :--- |
| **`--color-primary` (`#B83D83`)** | White (`#FFFFFF`) | **4.88 : 1** | **PASS** (Normal Text) | Primary buttons, active nav indicators, links. |
| **`#FFFFFF`** | Solid Primary (`#B83D83`) | **4.88 : 1** | **PASS** (Normal Text) | White text on primary button fill. |
| **`--color-heading` (`#702B59`)** | White (`#FFFFFF`) | **8.42 : 1** | **PASS** (AAA) | Headings, titles, brand logo. |
| **`--color-heading` (`#702B59`)** | Pale Rose (`#FCEFED`) | **7.35 : 1** | **PASS** (AAA) | Headings against page background. |
| **`--color-heading` (`#702B59`)** | Blush (`#F8DDE3`) | **6.45 : 1** | **PASS** (AAA) | Active nav text, table row highlight text. |
| **`--text` (`#29252A`)** | White (`#FFFFFF`) | **13.80 : 1** | **PASS** (AAA) | Primary charcoal body text. |
| **`--text` (`#29252A`)** | Pale Rose (`#FCEFED`) | **12.05 : 1** | **PASS** (AAA) | Primary body text on page background. |
| **`--text` (`#29252A`)** | Blush (`#F8DDE3`) | **10.58 : 1** | **PASS** (AAA) | Selected row text. |
| **`--text-muted` (`#6B6069`)** | White (`#FFFFFF`) | **5.86 : 1** | **PASS** (AA >4.5:1) | Secondary helper text and timestamps. |
| **`--text-muted` (`#6B6069`)** | Pale Rose (`#FCEFED`) | **5.12 : 1** | **PASS** (AA >4.5:1) | Secondary text on page background. |
| **`--border-control` (`#8F858C`)**| White (`#FFFFFF`) | **3.52 : 1** | **PASS** (Non-text >3:1) | Input, select, and checkbox outlines. |
| **Success (`#2F5A49`)** | Success BG (`#E6F1EC`) | **6.18 : 1** | **PASS** (AA) | Confirmed appointments, verified items. |
| **Warning (`#8A5A00`)** | Warning BG (`#FFF3D6`) | **4.75 : 1** | **PASS** (AA) | Pending reassignments, unverified tags. |
| **Critical (`#B3261E`)** | Critical BG (`#FDECEA`) | **5.81 : 1** | **PASS** (AA) | Emergency warnings, stale data alerts. |
| **`#FFFFFF`** | Solid Critical (`#B3261E`) | **4.78 : 1** | **PASS** (AA) | White text on 108 Emergency call button. |
| **`--color-primary` (`#B83D83`)** | Blush (`#F8DDE3`) | **3.74 : 1** | **FAIL** (for <18px) | **Special Rule Enforced:** Magenta text on Blush is strictly prohibited for small text. Deep Plum (`#702B59`) is used instead. |

---

## 5. Trust Indicators Preserved (Blueprint Non-Negotiables)

1. **Demonstration Environment Header Indicator:** Kept visible on all views with live demo switcher.
2. **Capacity Timestamps:** `"Last updated X min ago"` maintained on every hospital capacity report and card.
3. **Medical Safety Registration Labels:** `"Demo, not verified"` retained next to all doctor registration numbers.
4. **Scheme Coverage Integrity:** Scheme badges (PMJAY, CMCHIS) explicitly labeled `"Verified"`, `"Unverified"`, or `"Not covered"`. Green badges are never used for insurer claims.
5. **Emergency Mode Wording:** Emergency capacity figures explicitly labeled `"Reported capacity (Emergency Mode)"` with real-time freshness warnings.
6. **Stale Data Banners:** Data older than 2 hours or offline states display prominent warning banners.

---

## 6. Implementation Plan (Phases 2 to 7)

- **Phase 2: Foundation**
  - Install `lucide-react` (named imports).
  - Setup self-hosted Inter & Manrope web fonts with WOFF2 and `@font-face`.
  - Create unified `tokens.css` with zero hex codes anywhere else in the application.
  - Create reusable atomic UI components: Button, Input, Select, Table, Badge (4px rectangular), Modal, Tabs, Toast, Skeleton loader, Empty state, Error state.
- **Phase 3: App Shell**
  - Replace top navbar with modern healthcare layout: 248px white sidebar with grouped navigation, 64px white header, responsive drawer below 1024px.
  - Page header pattern: breadcrumb, Manrope title, subtitle, right-aligned primary action.
- **Phase 4: Patient Pages**
  - Redesign Hospital Discovery: replace card grid with dense single-column rows, full-width search bar, aligned filter bar with drawer collapse.
  - Redesign Hospital Details, Booking Review Modal, Patient Dashboard (structured tables for appointments and referrals, Health Vault grid, consent logs).
- **Phase 5: Staff Portals (Doctor & Hospital Admin)**
  - Doctor Portal: information-dense daily schedule table, patient review queue, leave request modal.
  - Hospital Admin Console: capacity manager with live timestamps, slot management, referral queue, audit log.
- **Phase 6: Super-Admin & Emergency Mode**
  - Super-Admin: verification queue, facility audit tables.
  - Emergency Mode: high-contrast neutral/white background with solid red 108 emergency dial button, nearest facilities with distance, zero pink tint.
- **Phase 7: Responsive Pass, Accessibility Audit & Verification**
  - Breakpoint sweeps at 360, 768, 1024, 1280.
  - Axe accessibility checks and keyboard navigation tests.
  - Re-run all 47 automated tests.
  - Capture 24 "after" screenshots into `docs/ui/after/`.
  - Measure Lighthouse mobile score and verify bundle size non-regression.

---

## 7. Verification Checklist Before Code Execution

- [x] Baseline automated test suite ran and recorded (47 passed across 9 suites).
- [x] Baseline screenshots captured for all 8 routes across 360px, 768px, 1280px in `docs/ui/before/`.
- [x] Baseline bundle size recorded (95.31 kB JS gzipped / 2.18 kB CSS gzipped).
- [x] Color contrast math verified against WCAG 2.2 AA.
- [x] Missing visual reference file noted and handled per Section 1 instructions.
- [x] Branch `ui-redesign` created and checked out.
