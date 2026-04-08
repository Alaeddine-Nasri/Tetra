# PROJECT_CONTEXT.md
> **Instructions for the next Claude instance:** Read this entire file before doing anything.
> After you complete work, append your progress at the bottom under a new `## Session — YYYY-MM-DD` heading.

---

## Project Overview

**Tetra** — personal developer portfolio for **Ala Eddine Nasri** (Frontend Engineer, Paris).
Dark, minimal aesthetic (deep navy/black background, purple accent `#4B3F8A` / `#6B5FBA`).
4 sections connected by 3D camera flight through a procedural architectural environment ("The Vault").
**Live URL:** ala-nasri.dev (Vercel, auto-deploys on push to `main`)

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Vue 3 Composition API + TypeScript |
| Build | Vite |
| Routing | Vue Router 4 (`createWebHistory`) |
| Animation | GSAP (no ScrollTrigger — all manual) |
| State | Pinia |
| 3D | Three.js — full scene in `TetraShard.vue` |
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
│   ├── spaceNav.ts                # ★ Section defs (cameraPos/lookAt/platformPos/shardWorld/babyWorld) + nav state (currentIndex, isFlying)
│   ├── loader.ts                  # Loader gate store (done, complete())
│   ├── navigation.ts              # workCardIndex, workDotPositions, activeAboutRow
│   ├── intro.ts                   # localStorage flag for first-visit animation
│   └── language.ts                # FR/EN locale reactive ref
├── data/content.ts                # All copy, project data, nav links (bilingual)
├── composables/
│   ├── useContent.ts              # Provides content + t() + lang to components
│   └── useMeta.ts                 # Sets <title> and <meta description> per route
├── components/
│   ├── TetraShard.vue             # ★★ The entire 3D scene (~950 lines). Loader animation,
│   │                              #    The Vault environment, GLB platforms, shard models,
│   │                              #    particle system, camera fly, RAF loop.
│   ├── AppLayout.vue              # Hides content (opacity:0) when isFlying via flush:'sync' watcher
│   ├── Navbar.vue                 # Intercepts nav clicks → spaceNav.navigateTo + router.push
│   ├── ProjectPanel.vue           # itssharl.ee-style 44vw slide panel (Teleport)
│   ├── CustomCursor.vue           # Custom cursor (cursor:none on body)
│   └── MobileGate.vue             # Blocks non-wide-screen visitors
└── views/
    ├── LandingView.vue            # Home: name reveal animation
    ├── WorkView.vue               # Horizontal card snap, timeline, dot tracking
    ├── AboutView.vue              # Two-col grid, stats, accordion rows
    └── ContactView.vue            # Headline + email + socials

public/3d/
├── Shard.glb                      # Main crystal shard model
├── BabyShard.glb                  # Small orbiting shard
├── thealter.glb                   # Home platform (Blender model — stone altar)
├── The_Gallery_Ruins.glb          # Work platform (Blender model — ruined gallery)
├── thearchive.glb                 # About platform (Blender model — archive structure)
└── Themonolith.glb                # Contact platform (Blender model — monolith)
```

---

## Architecture — Critical Concepts

### 1. The Vault — 3D Environment

The entire background is a single `TetraShard.vue` component rendered on a `position: fixed; z-index: 0` canvas. All UI views sit above it in DOM order.

**Scene setup:**
- `renderer.setClearColor(0x030008, 1)` — near-black background
- `scene.fog = FogExp2(0x030008, 0.012)` — dense depth fog
- `AmbientLight(0x5b3a8a, 0.6)` + `DirectionalLight(0xc8b0ff, 1.8)` at `(-3, 4, 2)`

**Vault shell:**
- `BoxGeometry(160, 110, 190)` rendered BackSide, centered at `(0, 0, -65)`
- Canvas-generated texture: deep purple radial vignette gradient, no grid lines
- `opacity: 0.35` — barely visible walls, just enough for depth

**4 GLB platforms** (loaded via GLTFLoader, added to placeholder Groups):
- Each normalized to ~14 units wide, centered on Group origin
- All materials overridden: `color: 0x080809, roughness: 0.95, metalness: 0.05, emissive: 0x0f0520, emissiveIntensity: 0.06`
- Groups positioned at: Home `(0,-2,-6)`, Work `(-18,-10,-43)` rot 0.35, About `(8,3,-87)` rot -0.5, Contact `(-2,-1,-130)`

**4 per-platform PointLights** `(0x7b2fbe, range: 55)` — intensity lerps with camera proximity (max 2.8):
- Positions: `[0,2,-6]`, `[-18,-6,-43]`, `[8,7,-87]`, `[-2,2,-130]`

**18 debris pieces** — `BoxGeometry` fragments scattered between platforms:
- `debrisMat`: `color: 0x090909, roughness: 0.95, metalness: 0.05`
- Edge lines: `opacity 0.12–0.20`, colors `[0x1e0838, 0x260a44, 0x180630]`
- Slowly rotate in RAF loop

### 2. Camera System

Each section in `spaceNav.ts` defines a full 3D camera pose:

| Section | cameraPos | lookAt |
|---------|-----------|--------|
| Home | `(0, 0, 6)` | `(0, 0, -2)` |
| Work | `(-14, -6, -36)` | `(-17, -8, -42)` |
| About | `(13, 7, -80)` | `(10, 5, -86)` |
| Contact | `(-4, 3, -124)` | `(-2, 0, -129)` |

**Flight:** Quadratic Bezier arc with control point offset perpendicular to path + upward. Duration `Math.min(2.0, Math.max(1.0, arcLen / 55))`. `camera.lookAt(camTarget)` each frame + roll via `camera.rotateZ(camBank)` in local space.

**Idle bob:** `sin(t*0.47)*0.004` X + `sin(t*0.31)*0.006` Y

**Shard during flight:** locked to `camPos + fwd * 6` (always in front of camera, never clips behind)

### 3. Shard System

- `mainShard` normalized via `normalizeModel(obj, 2.2)` → returns `mainBaseScale`
- Scale always: `mainShard.scale.setScalar(mainBaseScale * shardCurrentScale)` — never `setScalar(1.0)`
- `babyShard` normalized to `0.6`
- Phase state machine: `waiting → phase1 → phase2 → phase3 → done`
- `pMat.opacity = 0` forced during phase3 — particles hidden until shard settles

### 4. Page Navigation

- `scrollLock` prevents multiple section advances. Released **only** in `spaceNav.onArrived()` — never by timer.
- `AppLayout.vue` watches `spaceNav.isFlying` with `flush: 'sync'` → sets content `opacity: 0` during flight, restores with 80ms delay on arrival.
- `Navbar.vue` intercepts clicks → `spaceNav.navigateTo(idx)` + `router.push(path)`.
- All imports in `Navbar.vue` must be at the **top** of the file — `import { watch }` after function defs breaks routing.

### 5. WorkView — Card Snap System

- Cards in horizontal flex track (`trackRef`), RAF lerp: `currentX += (targetX - currentX) * 0.072`
- `computeSnaps()` measures real DOM positions → `snapPositions[]` + `dotScreenX[]`
- Card wheel: threshold `CARD_THRESHOLD = 200`, lock 450ms. At boundaries, event bubbles to AppLayout.
- GSAP entrance scoped to component ref — no global class selectors.

### 6. ProjectPanel.vue

- `Teleport to="body"` — avoids z-index/overflow issues
- 44vw panel slides from right, `x: 100% → 0%`
- Close: button, Escape key, clicking backdrop

---

## Critical Rules — Do Not Break

1. **`AppLayout .layout` must stay `background-color: transparent`** — making it opaque covers the fixed canvas entirely (div stacks above canvas in DOM order).
2. **`normalizeModel` returns base scale** — always `mainShard.scale.setScalar(mainBaseScale * shardCurrentScale)`, never `setScalar(1.0)`.
3. **`pMat.opacity = 0` during phase3** — particles must stay hidden until the shard settles in done phase.
4. **`scrollLock` only released in `spaceNav.onArrived()`** — never by timer.
5. **AppLayout watches `spaceNav.isFlying` with `flush: 'sync'`**, not `route.path` — prevents content flash.
6. **All imports in Navbar.vue at the top** — `import { watch }` after function defs breaks routing silently.
7. **TypeScript overlay cast:** `const ov = overlay as HTMLCanvasElement` after null guard — use `ov.width/height` inside `drawCross`.
8. **Never animate opacity on root page elements** — only `x` (translateX) for transitions. Opacity on root = blank page risk.
9. **Always scope GSAP to DOM refs** — `scope.querySelector('.foo')` not `gsap.from('.foo')` — prevents cross-mount tween pollution.
10. **GLB loads must come after `const gltfLoader = new GLTFLoader()`** — `const` is not hoisted; calling `.load()` before the declaration = ReferenceError = silent dark screen.

---

## Bugs History (Resolved — Do Not Re-Introduce)

| Bug | Root cause | Fix |
|-----|-----------|-----|
| Blank page (Cause A) | `onBeforeEnter` sets `opacity:0`, fast nav interrupts enter tween | Remove opacity from all root transitions — only use `x` |
| Blank page (Cause B) | `gsap.from({opacity:0})` on children + root already `opacity:0` | Remove opacity from child `from()` calls |
| Blank page (Cause C) | GSAP class selectors fire across component remounts | Scope GSAP to `rootEl` ref, add `onUnmounted` cleanup |
| Blank page (Cause D) | `gsap.killTweensOf(el)` in onLeave killed enter tween → called `done()` → Vue out-in corrupted | Removed all `killTweensOf` in transitions; use `overwrite:true` instead |
| Cross loader glitch | phase1 triggered before GLB loaded | Start phase1 only inside GLB `onLoad` callback |
| Shard scale glitch | done phase wrote `scale.setScalar(1.0)` | Store `mainBaseScale`, always multiply |
| Particles above shard mid-animation | `depthTest: false` + opacity not zeroed | `pMat.opacity = 0` forced during phase3 |
| Content always LandingView | `import { watch }` after function defs in Navbar | Move all imports to top |
| Content flash on scroll | `route.path` watcher is async | Watch `isFlying` with `flush: 'sync'` |
| Multiple sections scrolled at once | `scrollLock` released by 1200ms timer | Release only in `onArrived()` |
| Super cube glitch (shard behind camera) | Shard Z lagged, camera overtook it | Lock shard to `camPos + fwd * 6` during flight |
| Dark screen after loader | AppLayout `background` set to opaque | Must stay `transparent` |
| Vercel TS build errors | `overlay` typed as nullable in closure | Cast to `HTMLCanvasElement` as `ov` |
| Dark screen after GLB load | `gltfLoader.load()` called before `const gltfLoader` declaration | Move all GLB loads after gltfLoader declaration |

---

## Important Constraints & Decisions

1. **Never animate opacity on root page elements** — only `x` (translateX). Hard constraint to prevent blank page bug.
2. **Always scope GSAP to DOM refs**, not CSS class strings.
3. **Always add `onUnmounted` cleanup** when using delayed GSAP timelines.
4. **Timeline/dot/shape constants must stay in sync** — if you change `top: 30vh` on `.work-timeline`, update `padding-top` on `.track`, the `card-dot` offset, and `TIMELINE_Y_FRAC` in TravelingShape.
5. **Do not add opacity to child `gsap.from()` calls** in page views.
6. **WorkView card events must call `e.preventDefault()` + `e.stopPropagation()`** within card range.
7. **`cursor: none` everywhere** — custom cursor replaces native on all interactive elements.
8. The site is **desktop-only**. MobileGate blocks at `<900px`. Do not add mobile breakpoints.

---

## Session Log

### Session 1 (pre-2026-04-02)
- Built entire portfolio from scratch: all 4 views, routing, GSAP transitions, TravelingShape, ProjectPanel, Pinia stores, bilingual system
- Fixed blank page bug (Causes A and B)
- Added edge glow scroll indicators, card snap scrolling, real dot position measurement

### Session 2 — 2026-04-02
- Fixed blank page (Cause C): scoped GSAP in AboutView and ContactView to `rootEl` ref, added `onUnmounted` cleanup
- Fixed WorkView layout: intro-card back to flex flow, timeline `26vh → 30vh`, track `35vh`, `TIMELINE_Y_FRAC = 0.30`
- Generated PROJECT_CONTEXT.md

### Session 3 — 2026-04-04
- Fixed blank page (Cause D): removed all `gsap.killTweensOf` from transitions; use `overwrite:true`
- Final resolution: stripped AppLayout to bare `<RouterView />` — no GSAP, no Transition wrapper
- Fixed WorkView: `.card-inner` wrapper, scale/vignette fixes, scoped entrance GSAP
- Fixed LandingView: `markPlayed()` on mount, `gsap.set` cleanup

### Session 4 — 2026-04-07 (The Vault + GLB Platforms)
**Work done:**
- Replaced flat space/galaxy background with fully procedural "The Vault" 3D architectural environment
- Rewrote `spaceNav.ts`: section defs now full 3D (`cameraPos`, `lookAt`, `platformPos`, `shardWorld`, `babyWorld`) instead of Z-only
- Built quadratic Bezier camera flight with perpendicular arc control point + roll (`camBank`)
- Built 4 procedural platforms (BoxGeometry + EdgesGeometry groups) — later replaced by GLBs
- Added 4 per-platform PointLights with proximity intensity lerp
- Added 18 floating debris pieces with slow rotation
- Vault shell: BoxGeometry(260×170×310) BackSide with canvas grid texture
- Added GLB platform loading (GLTFLoader): `thealter.glb` (Home), `The_Gallery_Ruins.glb` (Work), `thearchive.glb` (About), `Themonolith.glb` (Contact)
- Each GLB normalized to 14 units, materials overridden to dark purple Vault palette
- Centered main shard over altar at `(0.0, 0.6, -5)` world space
- Iterated vault wall texture: grid → stone masonry → smooth radial vignette (final)
- Fixed `gltfLoader used before declaration` bug (dark screen) — moved all GLB loads after `const gltfLoader`

**Files changed:**
- `src/stores/spaceNav.ts` — full rewrite of SectionDef type + SECTIONS array
- `src/components/TetraShard.vue` — full Vault environment, GLB loaders, 3D camera system

### Session 5 — 2026-04-07 (Material Darkening + Distance Scaling)
**Work done:**
- Fog density: `FogExp2(0x030008, 0.005)` → `0.012`
- Wall: opacity `0.6 → 0.35`, vault shell `BoxGeometry(260,170,310)` → `(160,110,190)`, centered `(0,0,-110)` → `(0,0,-65)`
- `debrisMat`: `color: 0x070010, roughness: 0.7, metalness: 0.6` → `color: 0x090909, roughness: 0.95, metalness: 0.05`
- Debris edge lines: opacity `0.45–0.75` → `0.12–0.20`, colors `[0x4a1a8a, 0x5522aa, 0x3d1577]` → `[0x1e0838, 0x260a44, 0x180630]`
- All 4 GLB platform materials: `color: 0x0a0014, roughness: 0.88, metalness: 0.25, emissive: 0x3a1060, emissiveIntensity: 0.18` → `color: 0x080809, roughness: 0.95, metalness: 0.05, emissive: 0x0f0520, emissiveIntensity: 0.06`
- Scaled all section positions ~45% Z, ~30% X/Y in `spaceNav.ts` (new values in camera table above)
- Updated platform group positions, platLightPos, and debris positions in `TetraShard.vue` to match
- Flight duration: `Math.min(2.8, Math.max(1.6, arcLen/65))` → `Math.min(2.0, Math.max(1.0, arcLen/55))`

**Status at end of session:** All material + distance changes applied. Not yet tested on live — push to `main` to deploy.

**Files changed:**
- `src/stores/spaceNav.ts` — SECTIONS positions scaled down
- `src/components/TetraShard.vue` — fog, wall, debris mat, debris edges, GLB mats, platform positions, platLightPos, debris positions, flight duration

### Session 6 — 2026-04-07 (Gallery Slabs + Dark Aesthetic Restore)
**Work done:**
- Restored dark Vault production aesthetic after diagnostic bright mode:
  - `setClearColor(0x030008, 1)`, `toneMappingExposure = 0.75`, `FogExp2(0x030008, 0.012)`
  - Ambient: `AmbientLight(0x1a1a1a, 0.8)` + single dim directional `(0x9090a0, 0.25)` — no purple global tint
  - Platform lights: `PointLight(0xd0c8f0, 4.5, 45)` main + `PointLight(0x7b2fbe, 0.55, 30)` rim per platform
  - Proximity max: `4.5` (was `8.0`), base now `0` so far platforms are dark
  - Flight duration: `Math.min(2.0, Math.max(1.0, arcLen/55))` (restored)
- Fixed About/Contact platform materials: `color: 0x1a1a1c, roughness: 0.95, metalness: 0.02, emissive: 0x000000` (were still old purple `0x0a0014 / 0x3a1060`)
- Home altar: `color: 0x28282c, emissive: 0x100818, emissiveIntensity: 0.08`
- Gallery slabs (Work section): `color: 0x303038, emissive: 0x0c0820, emissiveIntensity: 0.10`
- Gallery backdrop wall: `color: 0x28282e, emissive: 0x080610, emissiveIntensity: 0.05`

**Files changed:**
- `src/components/TetraShard.vue` — dark aesthetic restore, platform materials, flight duration

<!-- next Claude: append your session below this line -->
