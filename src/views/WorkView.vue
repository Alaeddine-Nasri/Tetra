<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import gsap from 'gsap'
import { useContent } from '@/composables/useContent'
import { useNavigationStore } from '@/stores/navigation'
import type { Project } from '@/data/content'
import ProjectPanel from '@/components/ProjectPanel.vue'

const { content, t } = useContent()
const navStore = useNavigationStore()

const trackRef = ref<HTMLElement | null>(null)
const wrapRef  = ref<HTMLElement | null>(null)

// ─── snap scroll state ───────────────────────────────────────────────────────
let currentX        = 0
let targetX         = 0
let rafId           = 0
let snapPositions: number[] = []   // one per card, computed after mount
let currentCardIdx  = 0
let isDragging      = false
let dragStartX      = 0
let dragStartScroll = 0

const activeProject = ref<Project | null>(null)

// ─── lerp loop ───────────────────────────────────────────────────────────────
function tick() {
  currentX += (targetX - currentX) * 0.12
  if (trackRef.value) {
    trackRef.value.style.transform = `translateX(${-currentX}px)`
  }
  rafId = requestAnimationFrame(tick)
}

// ─── snap positions ──────────────────────────────────────────────────────────
// For N cards, desired marker positions are (i+1)/(N+1) * vw evenly spaced.
// snapPositions[i] = how many px to translateX the track so card i's center
// lands on its marker. Clamped to 0 (can't scroll negatively).
// dotScreenX[i] = actual screen x of the dot after that snap — this can differ
// from the ideal marker when the card is already to the left of it (snap=0).
function computeSnaps() {
  if (!trackRef.value) return
  const cards = Array.from(
    trackRef.value.querySelectorAll<HTMLElement>('.project-card')
  )
  const N  = cards.length
  const vw = window.innerWidth

  const dotScreenX: number[] = []

  snapPositions = cards.map((card, i) => {
    const markerX   = ((i + 1) / (N + 1)) * vw
    const cardCentX = card.offsetLeft + card.offsetWidth / 2
    // Card 0 always snaps to 0 — full left, headline fully visible
    const snap      = i === 0 ? 0 : Math.max(0, cardCentX - markerX)
    dotScreenX.push(cardCentX - snap)
    return snap
  })

  // Publish card index 0 + actual dot positions to the store
  navStore.setWorkCard(0, dotScreenX)
}

// ─── scroll to card ──────────────────────────────────────────────────────────
function goToCard(idx: number) {
  if (!snapPositions.length) return
  currentCardIdx = Math.max(0, Math.min(idx, snapPositions.length - 1))
  targetX = snapPositions[currentCardIdx]
  // Re-publish current index; dot positions array stays the same
  navStore.setWorkCard(currentCardIdx, navStore.workDotPositions)
}

// ─── card delta accumulator ───────────────────────────────────────────────────
// Lighter than AppLayout's section threshold — requires ~200 delta to snap.
// Distinct feel: quick intentional flick advances a card, slow scroll advances
// a section. At the card boundaries, let the event bubble to AppLayout so the
// section-level accumulator can build up naturally.
const CARD_THRESHOLD = 120
let cardDelta   = 0
let cardLocked  = false
let cardIdleTimer = 0

function onWheel(e: WheelEvent) {
  const atEnd   = currentCardIdx >= snapPositions.length - 1
  const atStart = currentCardIdx <= 0

  // At boundaries: stop handling → event bubbles to AppLayout's onWheel
  if (e.deltaY > 0 && atEnd)   return
  if (e.deltaY < 0 && atStart) return

  // Within card range: consume the event
  e.preventDefault()
  e.stopPropagation()

  if (cardLocked) return

  cardDelta += e.deltaY

  // Idle reset — if user pauses, drain accumulator
  clearTimeout(cardIdleTimer)
  cardIdleTimer = window.setTimeout(() => { cardDelta = 0 }, 800)

  if (Math.abs(cardDelta) >= CARD_THRESHOLD) {
    const next = cardDelta > 0 ? currentCardIdx + 1 : currentCardIdx - 1
    cardDelta  = 0
    cardLocked = true
    goToCard(next)
    // Lock briefly — card lerp takes ~250ms to settle at 0.12 factor
    setTimeout(() => { cardLocked = false }, 280)
  }
}

// ─── drag ────────────────────────────────────────────────────────────────────
function onMouseDown(e: MouseEvent) {
  isDragging      = true
  dragStartX      = e.clientX
  dragStartScroll = targetX
  document.body.style.userSelect = 'none'
}

function onMouseMove(e: MouseEvent) {
  if (!isDragging) return
  const delta = dragStartX - e.clientX
  // Snap to nearest card based on drag distance
  const draggedSnap = dragStartScroll + delta
  let nearest = 0
  let nearestDist = Infinity
  snapPositions.forEach((pos, i) => {
    const d = Math.abs(pos - draggedSnap)
    if (d < nearestDist) { nearestDist = d; nearest = i }
  })
  if (nearest !== currentCardIdx) goToCard(nearest)
}

function onMouseUp() {
  isDragging = false
  document.body.style.userSelect = ''
}

// ─── card click → panel ──────────────────────────────────────────────────────
function openProject(project: Project) {
  if (Math.abs(targetX - dragStartScroll) > 8) return
  activeProject.value = project
}

// ─── lifecycle ───────────────────────────────────────────────────────────────
onMounted(async () => {
  await nextTick()
  computeSnaps()
  rafId = requestAnimationFrame(tick)

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup',   onMouseUp)

  // Scoped to wrapRef — no opacity (Cause B/C prevention per PROJECT_CONTEXT.md)
  if (wrapRef.value) {
    const cards = wrapRef.value.querySelectorAll('.project-card')
    gsap.from(cards, { x: 30, duration: 0.65, ease: 'power3.out', stagger: 0.1, delay: 2.5 })
  }
})

onUnmounted(() => {
  cancelAnimationFrame(rafId)
  navStore.setWorkCard(0, [])
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup',   onMouseUp)
  if (wrapRef.value) gsap.killTweensOf(wrapRef.value.querySelectorAll('.project-card'))
})
</script>

<template>
  <main
    ref="wrapRef"
    class="work-view"
    @wheel="onWheel"
    @mousedown="onMouseDown"
  >
    <!--
      Timeline: full-width at top: 26vh (matches TravelingShape's TIMELINE_Y_FRAC).
      Purple fill grows left→right tracking the current card position.
    -->
    <div class="work-timeline" aria-hidden="true">
      <div
        class="timeline-fill"
        :style="{
          transform: `scaleX(${
            snapPositions.length
              ? (currentCardIdx + 1) / (content.work.projects.length + 1)
              : 0
          })`
        }"
      />
    </div>

    <!-- scrollable track — cards sit below the timeline -->
    <div ref="trackRef" class="track">

      <!-- intro label -->
      <div class="intro-card">
        <span class="intro-label">{{ t(content.work.heading) }}</span>
        <span class="intro-hint">
          <svg width="24" height="10" viewBox="0 0 24 10" fill="none">
            <path d="M0 5h22M18 1l4 4-4 4" stroke="currentColor" stroke-width="1"/>
          </svg>
        </span>
      </div>

      <!-- project cards -->
      <div
        v-for="(project, idx) in content.work.projects"
        :key="project.id"
        class="project-card"
        :class="{ 'is-active': idx === currentCardIdx }"
        @mousedown="dragStartScroll = targetX"
        @click="openProject(project)"
      >
        <!-- dot and connector sit outside card-inner so they are NOT affected
             by the scale(1.03) applied to card-inner on active state -->
        <div class="card-dot" />
        <div class="card-connector" />

        <!-- scale is applied here, not on the outer card -->
        <div class="card-inner">
          <img
            class="card-bg"
            :src="project.image"
            :alt="project.title"
            loading="lazy"
            aria-hidden="true"
          />

          <div class="card-top">
            <span class="card-year">{{ project.year }}</span>
          </div>

          <div class="card-vignette">
            <div class="vignette-content">
              <h2 class="card-title">{{ project.title }}</h2>
              <p class="card-company">{{ project.company }}</p>
              <p class="card-desc">{{ t(project.description) }}</p>
              <div class="card-tags">
                <span v-for="tag in project.tags" :key="tag" class="pill">{{ tag }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="trail" />
    </div>
  </main>

  <ProjectPanel :project="activeProject" @close="activeProject = null" />
</template>

<style scoped>
/* ── wrapper ─────────────────────────────────────────────── */
.work-view {
  height: 100vh;
  overflow: hidden;
  position: relative;
  cursor: none;
  display: block;
}

/* ─────────────────────────────────────────────────────────
   TIMELINE — 100% width, at 30vh from top.
   This MUST stay in sync with TIMELINE_Y_FRAC = 0.30 in TravelingShape.
───────────────────────────────────────────────────────── */
.work-timeline {
  position: absolute;
  top: 30vh;
  left: 0;
  right: 0;
  height: 1px;
  background: rgba(245, 244, 242, 0.08);
  z-index: 2;
  pointer-events: none;
}

/* Purple fill grows left→right as cards are scrolled through */
.timeline-fill {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to right,
    rgba(75, 63, 138, 0.55) 0%,
    rgba(107, 95, 186, 0.40) 100%
  );
  transform-origin: left center;
  transform: scaleX(0);
  transition: transform 0.55s cubic-bezier(0.16, 1, 0.3, 1);
}

/* ── horizontal track ────────────────────────────────────── */
.track {
  display: flex;
  /* Cards align their tops just below the timeline gap */
  align-items: flex-start;
  /* 30vh timeline + 5vh gap = 35vh from top; track height fills rest */
  padding-top: 35vh;
  height: 100%;
  will-change: transform;
  padding-left: 5vw;
  gap: 3vw;
  box-sizing: border-box;
}

/* ── intro label ─────────────────────────────────────────── */
.intro-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  pointer-events: none;
  flex-shrink: 0;
  align-self: flex-start;
}

.intro-label {
  font-family: 'Syne', sans-serif;
  font-weight: 700;
  font-size: clamp(2rem, 3.5vw, 4rem);
  color: var(--ink);
  line-height: 1;
}

.intro-hint {
  color: rgba(245, 244, 242, 0.2);
}

/* ── project cards ───────────────────────────────────────── */
.project-card {
  flex-shrink: 0;
  position: relative;
  width: clamp(240px, 19vw, 330px);
  height: 56vh;
  border-radius: 4px;
  overflow: visible; /* so dot/connector poke above the card */
  cursor: none;
}

/* Active card: scale only the inner visual, not the outer card.
   This keeps .card-dot and .card-connector unaffected by the transform
   so the dot stays exactly on the timeline regardless of active state. */
.project-card.is-active {
  z-index: 2;
}

.card-inner {
  position: absolute;
  inset: 0;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}


/* ── dot: sits ON the timeline ───────────────────────────────
   The timeline is at 30vh from the top of the viewport.
   The track has padding-top: 35vh, so relative to the card's
   top edge, the timeline is at: -(35vh - 30vh) = -5vh.
   translate(-50%, -50%) centers the dot exactly on the line.
─────────────────────────────────────────────────────────── */
.card-dot {
  position: absolute;
  top: -5vh;
  left: 50%;
  translate: -50% -50%;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 1px solid rgba(107, 95, 186, 0.85);
  background: rgba(75, 63, 138, 0.5);
  z-index: 5;
  pointer-events: none;
  transition: background 0.3s ease, box-shadow 0.3s ease;
}

.project-card.is-active .card-dot {
  background: rgba(107, 95, 186, 0.95);
  box-shadow: 0 0 10px rgba(107, 95, 186, 0.65);
}

/* ── connector: thin line from dot down to card top ──────── */
.card-connector {
  position: absolute;
  top: -5vh;
  left: 50%;
  translate: -50% 0;
  width: 1px;
  height: 5vh;
  background: linear-gradient(to bottom, rgba(75, 63, 138, 0.35), transparent);
  pointer-events: none;
}

/* Clip inner elements to card boundary */
.card-bg,
.card-top,
.card-vignette {
  border-radius: 4px;
}

.card-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  background-color: #0D0F1C;
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  border-radius: 4px;
  overflow: hidden;
}

.project-card:hover .card-bg {
  transform: scale(1.03);
}


.card-top {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 2;
}

.card-year {
  font-family: 'DM Sans', sans-serif;
  font-weight: 200;
  font-size: 0.62rem;
  letter-spacing: 0.15em;
  color: rgba(245, 244, 242, 0.45);
}

/* ── vignette — visible on hover OR when card is active ─── */
.card-vignette {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  transform: translateY(100%);
  transition: transform 0.40s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 3;
  background: linear-gradient(
    to top,
    rgba(5, 5, 12, 0.97) 0%,
    rgba(5, 5, 12, 0.82) 55%,
    transparent 100%
  );
  padding: 1.8rem 1.4rem 1.5rem;
  border-radius: 0 0 4px 4px;
  overflow: hidden;
}

.project-card:hover .card-vignette {
  transform: translateY(0%);
}

.vignette-content {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.card-title {
  font-family: 'Syne', sans-serif;
  font-weight: 700;
  font-size: 1.25rem;
  color: var(--ink);
  line-height: 1.05;
}

.card-company {
  font-family: 'DM Sans', sans-serif;
  font-weight: 200;
  font-size: 0.62rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--accent-light);
}

.card-desc {
  font-family: 'DM Sans', sans-serif;
  font-weight: 300;
  font-size: 0.73rem;
  color: rgba(245, 244, 242, 0.60);
  line-height: 1.6;
  margin-top: 0.15rem;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.28rem;
  margin-top: 0.35rem;
}

.pill {
  font-family: 'DM Sans', sans-serif;
  font-weight: 300;
  font-size: 0.55rem;
  letter-spacing: 0.06em;
  color: rgba(245, 244, 242, 0.50);
  border: 1px solid rgba(245, 244, 242, 0.11);
  border-radius: 999px;
  padding: 0.16rem 0.52rem;
}

/* ── trail ───────────────────────────────────────────────── */
.trail {
  flex-shrink: 0;
  width: 5vw;
}
</style>
