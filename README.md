# Tetra — Developer Portfolio

> A first-person flight through an underground vault. Four sections, zero page reloads, one continuous 3D world.

---

<!-- HERO IMAGE / SCREEN RECORDING -->
<!-- ![Tetra overview](docs/hero.gif) -->

---

## Concept

The idea was simple: instead of a portfolio that *shows* projects, build one that feels like a *place*. You fly through a procedural stone vault, land on platforms, and interact with work directly in 3D space. Every section is a physical location in the world — navigation is spatial, not hierarchical.

The name **Tetra** comes from the crystal shard at the center of the experience. It's the first thing you see on load, and it follows you between every destination.

---

## Sections

| Section | What you'll find |
|---|---|
| **Landing** | Name reveal, ambient glow, the shard materialises from a loading cross |
| **Projects** | 3D gallery — project images rendered as planes in the vault, hoverable, clickable |
| **About** | Two-column layout, stats, accordion rows (engineering, skills, education, languages) |
| **Contact** | Headline, email, socials |

---

<!-- SECTION SCREENSHOTS -->
<!-- ![Landing](docs/landing.png) -->
<!-- ![Projects gallery](docs/projects.png) -->
<!-- ![About](docs/about.png) -->
<!-- ![Contact](docs/contact.png) -->

---

## Architecture

### The Vault

Everything you see is a single `<canvas>` fixed behind the UI. A `BoxGeometry(160, 110, 190)` shell rendered `BackSide` forms the room — its texture is drawn procedurally on a `CanvasTexture`: stone base, hand-placed crack networks drawn with `shadowBlur` glow to look like embedded purple LEDs.

Four GLB platforms (modelled in **Blender**) sit at specific world coordinates. Each gets its own `PointLight` pair — a warm-white main light that ramps up as the camera approaches, and a purple rim from below that stays at a low constant intensity. Eighteen floating debris fragments slowly rotate between them.

```
World Z axis (depth)
     0        -44       -87       -130
     │         │         │         │
  [Home]   [Work]    [About]  [Contact]
  altar    gallery   archive  monolith
```

### Camera Flight

Each section defines a full camera pose (`cameraPos`, `lookAt`). Navigation triggers a **quadratic Bézier arc** — the control point is offset perpendicular to the path and upward, so the camera sweeps around rather than cutting straight through geometry. Duration scales with arc length, clamped between 1 and 2 seconds.

The crystal shard rides along the camera's forward vector during flight, lifted by `sin(t·π)` at the midpoint so it clears the platforms. It spins up to 8× faster mid-arc, then settles at the destination's idle speed.

```js
// quadratic bezier — P0 (start), P1 (control), P2 (end)
const mt = 1 - t
out.x = mt*mt*p0.x + 2*mt*t*p1.x + t*t*p2.x
```

### Projects Gallery

In the Work section the card track is entirely in 3D. Each project gets a `PlaneGeometry` loaded with its cover image via `TextureLoader`. A `Raycaster` handles hover detection every frame and click-to-open. A second canvas overlay (HTML `<div>`) is projected from 3D world coords to screen space and positioned exactly over the hovered plane — title, company, description, tags.

### Scroll System

Three separate accumulators run in parallel:

- **Card scroll** (WorkView, threshold 120) — left/right between project cards
- **Section escape** (WorkView boundary, threshold 250) — sustained scroll at the first/last card triggers section navigation
- **Section scroll** (other sections, threshold 250) — window-level accumulator, only active when not on the Work section

A 2-second post-arrival lock prevents chaining sections accidentally after a flight lands.

### Shard System

The main shard goes through a phase machine on first load:

```
waiting → phase1 → phase2 → phase3 → done
          (cross    (diamond   (flies    (idle
           draws)   morphs)    in)       loop)
```

The 2D canvas overlay draws the loading cross — four lines grow from center, morph to a diamond, then the 3D shard fades in and the overlay clears. A burst of 2D particles fires at the reveal moment.

In the idle loop, 112 particles orbit the main shard in 3D spherical paths — each has its own axis defined by a uniformly distributed `theta/phi` pair, so they fill a full sphere rather than clustering in rings.

---

<!-- LOADER ANIMATION RECORDING -->
<!-- ![Loader](docs/loader.gif) -->

---

## 3D Assets

All platforms were built and exported from **Blender**. Materials are stripped on load and replaced with a unified dark-stone palette so everything reads consistently under the vault lighting.

| File | Purpose |
|---|---|
| `Shard.glb` | Main crystal — normalized to 2.2 units, drives the loading animation |
| `BabyShard.glb` | Smaller companion crystal |
| `thealter.glb` | Home platform — stone altar |
| `The_Gallery_Ruins.glb` | Work section backdrop wall |
| `GaleryPlatform.glb` | Project pedestals — cloned once per project |
| `thearchive.glb` | About platform |
| `Themonolith.glb` | Contact platform |

---

## Tech Stack

```
Vue 3 + TypeScript    — composition API throughout, no options API
Vite                  — dev server + build
Three.js              — full 3D scene, WebGLRenderer, ACESFILMIC tone mapping
GSAP                  — UI animations (name reveal, page transitions, entrance stagger)
Pinia                 — three stores: spaceNav, navigation, loader
Vue Router 4          — history mode, four routes
```

No CSS frameworks. All styles are scoped per-component, custom properties for the colour system.

---

## Colour System

```css
--ink:          #F5F4F2   /* near-white text */
--accent:       #4B3F8A   /* deep purple */
--accent-light: #6B5FBA   /* lighter purple for labels */
```

Fonts: **Syne** (headings, 700/800) and **DM Sans** (body, 200/300). Both loaded via Google Fonts.

---

## Running Locally

```bash
npm install
npm run dev
```

```bash
npm run build   # production build → dist/
```

The site is desktop-only by design. A `MobileGate` component blocks viewports under 900px.

---

## Project Structure

```
src/
├── components/
│   ├── TetraShard.vue      # entire 3D scene — ~1350 lines
│   ├── AppLayout.vue       # root shell, hides content during flight
│   ├── Navbar.vue          # intercepts clicks → spaceNav + router
│   ├── ProjectPanel.vue    # 44vw slide panel (Teleport to body)
│   ├── CustomCursor.vue    # dot + trailing ring, cursor:none on body
│   └── MobileGate.vue
├── views/
│   ├── LandingView.vue
│   ├── WorkView.vue        # 3D card raycasting, hover overlay, scroll
│   ├── AboutView.vue
│   └── ContactView.vue
├── stores/
│   ├── spaceNav.ts         # section definitions + flight state
│   ├── navigation.ts       # active card index, dot positions
│   └── loader.ts           # gates UI until shard animation finishes
├── utils/
│   └── galleryBridge.ts    # plain shared object between 3D and UI
└── data/
    └── content.ts          # all copy, bilingual (FR/EN)

public/3d/                  # GLB files (Blender exports)
```

---

## Deployment

Hosted on **Vercel**, auto-deploys on push to `main`. `vercel.json` rewrites all routes to `index.html` for Vue Router history mode.

---

<!-- MOBILE GATE SCREENSHOT -->
<!-- ![Mobile gate](docs/mobile-gate.png) -->

---

## License

Personal portfolio — not open for reuse. Models and copy are proprietary.
