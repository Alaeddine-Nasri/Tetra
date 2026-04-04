# PROJECT_CONTEXT.md
> **Instructions for the next Claude instance:** Read this entire file before doing anything.
> After you complete work, append your progress at the bottom under a new `## Session — YYYY-MM-DD` heading.

---

## Project Overview

**Tetra** — personal developer portfolio for **Ala Eddine Nasri** (Frontend Engineer).
Dark, minimal aesthetic (deep navy/black background, purple accent `#4B3F8A` / `#6B5FBA`).
4 separate routes connected by GSAP-powered horizontal slide transitions and a persistent traveling geometry shape.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Vue 3 Composition API + TypeScript |
| Build | Vite |
| Routing | Vue Router 4 (`createWebHistory`) |
| Animation | GSAP (no ScrollTrigger — all manual) |
| State | Pinia |
| 3D (placeholder) | Three.js WebGL canvas in LandingView |
| Fonts | Syne (headings) · DM Sans (body) |
| i18n | Custom bilingual system (FR/EN toggle, no external lib) |

---

## File Structure — Key Files Only

```
src/
├── App.vue                        # Root — mounts AppLayout + MobileGate
├── main.ts                        # App entry
├── router/index.ts                # 4 routes: / /work /about /contact
├── stores/
│   ├── navigation.ts              # workCardIndex, workDotPositions, activeAboutRow
│   ├── intro.ts                   # localStorage flag for first-visit animation
│   └── language.ts                # FR/EN locale reactive ref
├── data/content.ts                # All copy, project data, nav links (bilingual)
├── composables/
│   ├── useContent.ts              # Provides content + t() + lang to components
│   └── useMeta.ts                 # Sets <title> and <meta description> per route
├── components/
│   ├── AppLayout.vue              # ★ Core: wheel nav, GSAP transitions, edge glow
│   ├── TravelingShape.vue         # ★ Fixed-position SVG geometry, route-aware GSAP
│   ├── Navbar.vue                 # RouterLink nav + lang toggle
│   ├── ProjectPanel.vue           # ★ itssharl.ee-style 44vw slide panel (Teleport)
│   ├── CustomCursor.vue           # Custom cursor (cursor:none on body)
│   ├── ThreeCanvas.vue            # Three.js WebGL canvas (placeholder)
│   └── MobileGate.vue            # Blocks non-wide-screen visitors
└── views/
    ├── LandingView.vue            # Home: name reveal animation, Three.js bg
    ├── WorkView.vue               # ★ Horizontal card snap, timeline, dot tracking
    ├── AboutView.vue              # ★ Two-col grid, stats, accordion rows
    └── ContactView.vue            # ★ Headline + email + socials
```

---

## Architecture — Critical Concepts

### 1. Page Navigation (AppLayout.vue)
- `routeOrder = ['/', '/work', '/about', '/contact']`
- Wheel scroll uses a **delta accumulator** (threshold `SECTION_THRESHOLD = 200`)
- Visual **edge glow** indicators (left/right 2px bars) build up as delta accumulates
- Idle reset after 600ms drains accumulator back to zero
- Navigation locked for 1100ms after triggering to prevent double-fires
- GSAP transition: **only `x` (translateX)** — NO opacity on root elements. This is critical.

### 2. The Blank Page / Invisible Content Bug (SOLVED — DO NOT REGRESS)
This was the hardest recurring bug. Three root causes were found and fixed:

**Cause A:** `onBeforeEnter` sets `opacity:0` via GSAP inline style. Fast navigation interrupts `onEnter` before it completes. `opacity:0` stays permanently → blank page.
**Fix A:** Remove opacity entirely from all root page transitions. Only use `x` (translateX).

**Cause D:** `gsap.killTweensOf(el)` in `onLeave` kills a still-running enter tween → fires its `onInterrupt` → calls enter's `done()` → Vue's `mode="out-in"` state machine receives "enter complete" for a component that is simultaneously being left → permanent `<!--->` placeholder (blank page) on all subsequent navigations.
**Fix D:** Remove ALL `gsap.killTweensOf()` calls. Use `overwrite: true` on every tween instead (GSAP resolves conflicts internally without firing the overwritten tween's callbacks). Never put `onInterrupt` on the enter tween — only on the leave tween.

**Cause B:** `gsap.from({opacity:0})` on children + root already at `opacity:0` = CSS multiplicative opacity = invisible.
**Fix B:** Remove `opacity` from all child `from()` animations in AboutView and ContactView.

**Cause C:** GSAP with CSS class selectors (`.about-heading`) + `delay:0.55` fires across component remounts. A tween started on mount fires 0.55s later — if the user navigated away and back, it targets the NEW mount's DOM, causing conflicts and potentially broken opacity states.
**Fix C (applied in session 2026-04-02):** Replaced all CSS class selectors in AboutView and ContactView with `scope.querySelector/querySelectorAll()` scoped to the component's `rootEl` ref. Added `onUnmounted(() => gsap.killTweensOf(rootEl.value.querySelectorAll('*')))`.

### 3. WorkView — Card Snap System
- Cards sit in a horizontal flex track (`trackRef`)
- RAF lerp loop: `currentX += (targetX - currentX) * 0.072` → smooth `translateX`
- `computeSnaps()` runs after mount: measures real DOM positions → `snapPositions[]` (px to scroll per card) and `dotScreenX[]` (real screen x of each dot)
- `navStore.setWorkCard(idx, dotScreenX)` publishes both to Pinia so TravelingShape can track
- Card wheel: threshold `CARD_THRESHOLD = 200`, lock 450ms. At boundaries, event bubbles to AppLayout.
- Also supports mouse drag to snap cards

### 4. TravelingShape.vue — The Geometry
- Fixed-position SVG: hexagon (outer, 6 vertex dots, 3 spokes) + inner triangle + dashed orbit ring
- CSS animations: `group-outer` rotates CW 60s, `group-inner` CCW 80s, `ring-orbit` CW 38s
- GSAP positions it on route change via `moveToRoute(name)`
- On `/work`: watches `workCardIndex + workDotPositions` → moves to real dot position
- `TIMELINE_Y_FRAC = 0.30` must always match CSS `.work-timeline { top: 30vh }` in WorkView
- On `/about`: watches `activeAboutRow` → scale pulse + vertex dot color flash (lavender)
- CSS `translate: -50% -50%` centers the 240px SVG on GSAP x/y coordinates

### 5. WorkView Layout Math (current values — must stay in sync)
```
.work-timeline { top: 30vh }          ← timeline horizontal bar position
.track { padding-top: 35vh }          ← cards start 5vh below the timeline
.card-dot { top: -5vh; translate: -50% -50% }  ← dot center lands exactly on line
TIMELINE_Y_FRAC = 0.30               ← in TravelingShape.vue
```
If you change one, change all four.

### 6. ProjectPanel.vue
- `Teleport to="body"` — avoids z-index/overflow issues
- 44vw panel slides from right, `x: 100% → 0%`
- `.panel-stagger` class on children for staggered entrance (delay 0.3s after panel lands)
- Close: button (`@click.stop`), Escape key, clicking backdrop
- KNOWN ISSUE: `.panel-stagger` uses a CSS class selector → same cross-mount risk as Cause C above. Low priority since panel only opens manually.

---

## Routes & Waypoints

| Route | Path | Shape position (viewport fraction) | Scale |
|---|---|---|---|
| Home | `/` | x: 0.68, y: 0.40 | 1 (full size) |
| Work | `/work` | Overridden by real dot positions | 0.20 (tiny) |
| About | `/about` | x: 0.80, y: 0.46 | 0.80 |
| Contact | `/contact` | x: 0.22, y: 0.44 | 0.72 |

---

## Current Status (as of 2026-04-02)

### ✅ Done
- All 4 routes working with Vue Router
- Horizontal GSAP slide transitions (x only, NO opacity — intentional)
- TravelingShape: SVG geometry with CSS rotation, route-aware repositioning
- LandingView: name reveal animation, Three.js WebGL canvas (placeholder)
- WorkView: horizontal card snap, RAF lerp, drag support, timeline fill, dot tracking
- ProjectPanel: itssharl.ee-style 44vw side panel with staggered entrance
- AboutView: two-column grid, stats, expandable accordion rows, geometry reaction
- ContactView: headline word split, email, socials
- Navbar: RouterLink active state, FR/EN toggle
- Bilingual system (FR/EN) across all content
- MobileGate: blocks small screens
- Custom cursor (`cursor: none` on body)
- Edge glow scroll indicators
- Blank page bug (Cause A + B): fixed — no opacity in transitions or child GSAP froms
- Blank page bug (Cause C): fixed — GSAP class selectors replaced with scoped refs + onUnmounted cleanup in AboutView and ContactView
- WorkView timeline math corrected: timeline 30vh, track 35vh, dots exactly on line
- Intro-card reverted to flex flow (not absolute positioned above timeline)
- TIMELINE_Y_FRAC updated to 0.30 in TravelingShape

### 🔴 Known Issues / Not Done
- `ProjectPanel.vue` still uses `.panel-stagger` CSS class selector in GSAP (low priority — panel only opens via user click, not navigation)
- WorkView card entrance animation (`gsap.fromTo('.project-card', ...)`) also uses a CSS class selector — could cause issues on fast navigation to/from work page. Lower risk because WorkView is scoped, but the pattern should be fixed if it surfaces.
- Three.js canvas in LandingView is a placeholder (no actual 3D scene content)
- No real project screenshots (placeholder `<img>` + `screenshot-slot` divs in panel)
- No mobile layout (MobileGate blocks entirely — intentional for now)

### 🟡 Potential Next Steps (user has not explicitly requested yet)
- Add real project content (images, descriptions, URLs) to `src/data/content.ts`
- Three.js: implement actual geometry/particle scene in ThreeCanvas
- Fix the ProjectPanel `.panel-stagger` class selector (scope to panel DOM ref)
- Fix WorkView card entrance animation class selector
- SEO / Open Graph meta tags
- Deploy (Vercel/Netlify)

---

## Important Constraints & Decisions

1. **Never animate opacity on root page elements** — only `x` (translateX). This is not a preference, it's a hard constraint to prevent the blank page bug.
2. **Always scope GSAP to DOM refs, not CSS class strings** — `scope.querySelector('.foo')` not `gsap.from('.foo')` — to prevent cross-mount tween pollution.
3. **Always add `onUnmounted` cleanup** when using delayed GSAP timelines: `gsap.killTweensOf(el)` or equivalent.
4. **Timeline/dot/shape constants must stay in sync** — if you change `top: 30vh` on `.work-timeline`, update `padding-top` on `.track`, the `card-dot` offset, and `TIMELINE_Y_FRAC` in TravelingShape.
5. **Do not add opacity to child `gsap.from()` calls** in page views — the root page element is always visible (CSS opacity: 1), child opacity animations multiply and can zero out content.
6. **WorkView card events must call `e.preventDefault()` + `e.stopPropagation()`** within card range to prevent AppLayout from consuming card scrolls.
7. **`cursor: none` everywhere** — custom cursor replaces native cursor on all interactive elements.
8. The site is desktop-only. MobileGate blocks at `<900px` width. Do not add mobile breakpoints.

---

## Session Log

### Session 1 (pre-2026-04-02 — carried over from previous context)
**Work done:**
- Built entire portfolio from scratch: all 4 views, routing, GSAP transitions, TravelingShape, ProjectPanel, Pinia stores, bilingual system
- Iterated through multiple UX revisions: first vertical scroll, then reverted to horizontal page transitions
- Fixed blank page bug (Causes A and B)
- Added edge glow scroll indicators, card-by-card snap scrolling
- Implemented real dot position measurement (`computeSnaps`) for accurate shape tracking
- Fixed timeline full-width, dot position math, scroll threshold tuning

**Bugs fixed:**
- Wheel navigation not working → added `@wheel="onWheel"` to AppLayout
- Content invisible → removed opacity from root transitions and child GSAP froms
- Work heading overflowing timeline → restructured layout
- First dot not on timeline → `computeSnaps` now measures real positions
- Scroll too hard → threshold 520 → 200

---

### Session 2 — 2026-04-02
**Work done:**
- Fixed **blank page / scroll-back bug (Cause C)**: scoped all GSAP animations in AboutView and ContactView to component `rootEl` ref using `scope.querySelector/querySelectorAll()`. Added `onUnmounted` cleanup via `gsap.killTweensOf(rootEl.value.querySelectorAll('*'))`.
- Fixed **WorkView layout**: reverted intro-card from `position: absolute; top: 8vh` back to normal flex flow item. Heading now sits naturally to the left of cards, below the timeline.
- Fixed **timeline + dot alignment math**: timeline `26vh → 30vh`, track padding `31vh → 35vh`, dot offset stays `top: -5vh; translate(-50%, -50%)` → dot center now exactly on timeline.
- Updated `TIMELINE_Y_FRAC = 0.30` and `waypoints.work.y = 0.30` in TravelingShape.
- Generated this PROJECT_CONTEXT.md file.

**Files changed this session:**
- `src/views/AboutView.vue` — scoped GSAP, added rootEl ref, added onUnmounted
- `src/views/ContactView.vue` — scoped GSAP, added rootEl ref, added onUnmounted
- `src/views/WorkView.vue` — timeline 30vh, track 35vh, intro-card back to flex flow, updated comments
- `src/components/TravelingShape.vue` — TIMELINE_Y_FRAC 0.26 → 0.30, waypoints.work.y 0.26 → 0.30

---
### Session 3 — 2026-04-04
**Work done:**
- Built and fully removed CrystalShard.vue (Three.js octahedron) twice — concept abandoned
- Fixed WorkView: dot on first card floating above timeline (scale(1.03) was on outer card, not inner). Fixed by adding `.card-inner` wrapper and scoping scale to it. Then removed active scale entirely at user request — all cards identical in size.
- Fixed WorkView: vignette always visible on active card → removed `.project-card.is-active .card-vignette` selector, hover only.
- Fixed WorkView card entrance animation: unscoped `gsap.fromTo('.project-card', { opacity: 0 })` → replaced with scoped ref + no opacity.
- Fixed LandingView blank on return: `introStore.played` was always false because `markPlayed()` was gated on `onComplete` which never fired if user navigated away mid-animation. Fixed: call `markPlayed()` immediately on mount.
- Fixed LandingView `gsap.set(y:0)` on fresh DOM elements inside `overflow:hidden` masks causing invisible words.
- Diagnosed and fixed blank page (Cause D): `gsap.killTweensOf(el)` in onLeave was killing a still-running enter tween, firing its `onInterrupt` → calling enter's `done()` → corrupting Vue's out-in state machine → permanent `<!--->` placeholder.
- Final fix for persistent blank page bug: removed ALL page transition animations from AppLayout.vue entirely. Plain `<RouterView />`, no GSAP, no Transition wrapper. Instant navigation, zero blank page risk.

**Files changed this session:**
- `src/components/AppLayout.vue` — stripped to bare RouterView, no transitions
- `src/views/WorkView.vue` — card-inner wrapper, scale/vignette fixes, GSAP scoped
- `src/views/LandingView.vue` — markPlayed() moved to mount, gsap.set cleanup fixed
- `src/components/CrystalShard.vue` — created and deleted (twice)
- `src/composables/useCrystalAnimation.ts` — created and deleted (twice)

### ✅ Current status (end of session 3)
- All 4 routes navigate correctly, no blank pages
- WorkView cards all identical size, hover vignette works, dot on timeline
- LandingView intro animation plays once, content visible on return
- No page transition animation (intentionally removed — safe baseline to rebuild from)

### 🔴 Known gaps
- Page transitions removed — can be re-added but MUST use CSS transitions or Vue's built-in `<Transition>` with `name=` prop (CSS-only), NOT GSAP hooks. GSAP hooks + `mode="out-in"` have proven too fragile with fast navigation.
- WorkView card entrance animation still uses GSAP from() with no opacity — low risk but should be watched

<!-- next Claude: append your session below this line -->
