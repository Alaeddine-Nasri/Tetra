<script setup lang="ts">
/**
 * TravelingShape — fixed-position geometry that travels between pages.
 *
 * Swap strategy: this component owns positioning logic (GSAP, route watching,
 * scroll watching). Only the SVG markup needs replacing for a Three.js upgrade.
 */
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import gsap from 'gsap'
import { useNavigationStore } from '@/stores/navigation'

const route   = useRoute()
const navStore = useNavigationStore()

const shapeRef   = ref<HTMLElement | null>(null)
// Reference to the SVG vertex dot elements for color reaction
const vertexRefs = ref<SVGCircleElement[]>([])

// ─── Per-route waypoints ─────────────────────────────────────────────────────
// x/y are viewport fractions; the element is centered on these coords via CSS.
const waypoints = {
  home: {
    x: 0.68, y: 0.40,
    scale: 1, rot: 0,
    dur: 1.1
  },
  work: {
    // x will be overridden immediately by the workCardIndex watcher with the
    // real measured dot position. y: 0.30 = timeline. Scale tiny to sit on line.
    x: 0.15, y: 0.30,
    scale: 0.20, rot: 0,
    dur: 1.0
  },
  about: {
    x: 0.80, y: 0.46,
    scale: 0.80, rot: -12,
    dur: 1.1
  },
  contact: {
    x: 0.22, y: 0.44,
    scale: 0.72, rot: 10,
    dur: 1.1
  },
}

type RouteKey = keyof typeof waypoints

function vw() { return window.innerWidth }
function vh() { return window.innerHeight }

// Move to a named route's waypoint
function moveToRoute(name: RouteKey, immediate = false) {
  const wp = waypoints[name] ?? waypoints.home
  const x  = wp.x * vw()
  const y  = wp.y * vh()

  if (!shapeRef.value) return

  if (immediate) {
    gsap.set(shapeRef.value, { x, y, scale: wp.scale, rotation: wp.rot })
  } else {
    gsap.to(shapeRef.value, {
      x, y,
      scale: wp.scale,
      rotation: wp.rot,
      duration: wp.dur,
      ease: 'power3.inOut',
      overwrite: 'auto',
    })
  }
}

// ─── Watch route changes ─────────────────────────────────────────────────────
watch(() => route.name, (name) => {
  moveToRoute((name as RouteKey) ?? 'home')
})

// ─── Work section: shape tracks to each card's actual dot screen position ────
// workDotPositions contains the real measured screen x for every card dot.
// workCardIndex is the currently active card. We use these instead of a formula
// so the shape lands exactly on the dot regardless of card layout.
const TIMELINE_Y_FRAC = 0.30   // must match CSS .work-timeline top value

watch([() => navStore.workCardIndex, () => navStore.workDotPositions], () => {
  if (route.name !== 'work' || !shapeRef.value) return
  const positions = navStore.workDotPositions
  const idx       = navStore.workCardIndex
  if (!positions.length || idx >= positions.length) return

  const x = positions[idx]
  const y = TIMELINE_Y_FRAC * vh()

  gsap.to(shapeRef.value, {
    x, y,
    duration: 0.55,
    ease: 'power3.out',
    overwrite: 'auto',
  })
})

// ─── About: react to accordion row opens ──────────────────────────────────────
watch(() => navStore.activeAboutRow, (newRow) => {
  if (route.name !== 'about' || !shapeRef.value) return

  if (newRow) {
    // Scale pulse
    const wp = waypoints.about
    gsap.timeline()
      .to(shapeRef.value, {
        scale: wp.scale * 1.18,
        duration: 0.22,
        ease: 'back.out(1.5)',
      })
      .to(shapeRef.value, {
        scale: wp.scale,
        duration: 0.35,
        ease: 'power2.out',
      })

    // Vertex dots flash to a lighter colour
    if (vertexRefs.value.length) {
      gsap.timeline()
        .to(vertexRefs.value, {
          attr: { fill: '#C4B5FD' },   // lavender-200
          duration: 0.18,
          ease: 'power2.out',
          stagger: 0.04,
        })
        .to(vertexRefs.value, {
          attr: { fill: '#6B5FBA' },   // back to normal
          duration: 0.4,
          ease: 'power2.in',
          stagger: 0.04,
        })
    }
  }
})

// ─── Mount ───────────────────────────────────────────────────────────────────
onMounted(() => {
  // Collect vertex dots after mount
  if (shapeRef.value) {
    vertexRefs.value = Array.from(
      shapeRef.value.querySelectorAll<SVGCircleElement>('.vertex-dot')
    )
  }
  // Set initial position without animation
  moveToRoute((route.name as RouteKey) ?? 'home', true)
})
</script>

<template>
  <!--
    CSS translate(-50%,-50%) centers the 240px SVG on the GSAP x/y coordinate.
    left:0 top:0 means all positioning is done via GSAP transforms.
  -->
  <div ref="shapeRef" class="traveling-shape" aria-hidden="true">
    <svg
      class="shape-svg"
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <!-- Dashed outer orbit — medium-speed CW rotation -->
      <circle
        cx="100" cy="100" r="90"
        stroke="#6B5FBA" stroke-width="0.4"
        stroke-dasharray="2 11"
        opacity="0.30"
        class="ring-orbit"
      />

      <!-- Outer hexagon + spokes — slow CW -->
      <g class="group-outer">
        <polygon
          points="100,18 171,59 171,141 100,182 29,141 29,59"
          stroke="#4B3F8A" stroke-width="0.9"
          opacity="0.65"
        />
        <!-- alternate spokes -->
        <line x1="100" y1="100" x2="100" y2="18"  stroke="#4B3F8A" stroke-width="0.35" opacity="0.25"/>
        <line x1="100" y1="100" x2="171" y2="141" stroke="#4B3F8A" stroke-width="0.35" opacity="0.25"/>
        <line x1="100" y1="100" x2="29"  y2="59"  stroke="#4B3F8A" stroke-width="0.35" opacity="0.25"/>
        <!-- vertex dots — these react to accordion opens -->
        <circle class="vertex-dot" cx="100" cy="18"  r="2.6" fill="#6B5FBA" opacity="0.90"/>
        <circle class="vertex-dot" cx="171" cy="59"  r="2.6" fill="#6B5FBA" opacity="0.90"/>
        <circle class="vertex-dot" cx="171" cy="141" r="2.6" fill="#6B5FBA" opacity="0.90"/>
        <circle class="vertex-dot" cx="100" cy="182" r="2.6" fill="#6B5FBA" opacity="0.90"/>
        <circle class="vertex-dot" cx="29"  cy="141" r="2.6" fill="#6B5FBA" opacity="0.90"/>
        <circle class="vertex-dot" cx="29"  cy="59"  r="2.6" fill="#6B5FBA" opacity="0.90"/>
      </g>

      <!-- Inner triangle — slow CCW -->
      <g class="group-inner">
        <polygon
          points="100,50 148,127 52,127"
          stroke="#6B5FBA" stroke-width="0.7"
          opacity="0.38"
        />
        <circle cx="100" cy="50"  r="2" fill="#6B5FBA" opacity="0.55"/>
        <circle cx="148" cy="127" r="2" fill="#6B5FBA" opacity="0.55"/>
        <circle cx="52"  cy="127" r="2" fill="#6B5FBA" opacity="0.55"/>
      </g>

      <!-- Static center -->
      <circle cx="100" cy="100" r="12" stroke="#6B5FBA" stroke-width="0.5" opacity="0.22"/>
      <circle cx="100" cy="100" r="3"  fill="#6B5FBA" opacity="0.60"/>
    </svg>
  </div>
</template>

<style scoped>
.traveling-shape {
  position: fixed;
  left: 0;
  top: 0;
  pointer-events: none;
  /* z-index sits above content but below navbar and overlays */
  z-index: 3;
  /* Center the 240px shape on the GSAP coordinate point */
  translate: -50% -50%;
}

.shape-svg {
  width: 240px;
  height: 240px;
  filter: drop-shadow(0 0 18px rgba(75, 63, 138, 0.32));
}

/* ── Independent idle animations ──────────────────────────────── */
.group-outer {
  transform-origin: 100px 100px;
  animation: rotate-cw 60s linear infinite;
}

.group-inner {
  transform-origin: 100px 100px;
  animation: rotate-ccw 80s linear infinite;
}

.ring-orbit {
  transform-origin: 100px 100px;
  animation: rotate-cw 38s linear infinite;
}

@keyframes rotate-cw {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

@keyframes rotate-ccw {
  from { transform: rotate(0deg); }
  to   { transform: rotate(-360deg); }
}
</style>
