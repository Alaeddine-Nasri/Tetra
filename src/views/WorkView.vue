<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useContent } from '@/composables/useContent'
import { useNavigationStore } from '@/stores/navigation'
import { galleryBridge } from '@/utils/galleryBridge'
import type { Project } from '@/data/content'
import ProjectPanel from '@/components/ProjectPanel.vue'
import { useLiquidText } from '@/composables/useLiquidText'

const { content, t } = useContent()
const navStore = useNavigationStore()

const titleRef = ref<HTMLElement | null>(null)
const { blobStyle: titleBlobStyle } = useLiquidText(titleRef)

const N = content.work.projects.length
let currentCardIdx = 0

const counter = ref(`01 / ${String(N).padStart(2, '0')}`)

function goToCard(idx: number) {
  currentCardIdx = Math.max(0, Math.min(idx, N - 1))
  navStore.setWorkCard(currentCardIdx, [])
  counter.value = `${String(currentCardIdx + 1).padStart(2, '0')} / ${String(N).padStart(2, '0')}`
}

const hoveredProject = ref<Project | null>(null)
const vignetteStyle  = ref({ left: '0px', top: '0px', width: '0px', height: '0px' })
let lastHovered = -1
let vigRafId    = 0

function trackHover() {
  vigRafId = requestAnimationFrame(trackHover)
  const idx = galleryBridge.hoveredIndex

  // only show the overlay for the active center card
  if (idx < 0 || idx !== currentCardIdx || !galleryBridge.getCardScreenPos) {
    if (lastHovered !== -1) { hoveredProject.value = null; lastHovered = -1 }
    return
  }

  const pos = galleryBridge.getCardScreenPos(idx)
  if (!pos) { hoveredProject.value = null; lastHovered = -1; return }

  vignetteStyle.value = {
    left:   `${pos.left}px`,
    top:    `${pos.top}px`,
    width:  `${pos.width}px`,
    height: `${pos.height}px`,
  }

  if (idx !== lastHovered) {
    hoveredProject.value = content.work.projects[idx]
    lastHovered = idx
  }
}

const CARD_THRESHOLD    = 120
const SECTION_THRESHOLD = 120
let cardDelta      = 0
let sectionDelta   = 0
let cardLocked     = false
let cardIdleTimer  = 0
let sectionIdleTimer = 0

function onWheel(e: WheelEvent) {
  e.preventDefault()
  e.stopPropagation()

  const atEnd   = currentCardIdx >= N - 1
  const atStart = currentCardIdx <= 0
  const goingFwd = e.deltaY > 0
  const goingBck = e.deltaY < 0

  // user is at the edge of the card list — let them "push through" to the next section
  // needs enough delta so accidental over-scrolls don't fire this
  if ((goingFwd && atEnd) || (goingBck && atStart)) {
    sectionDelta += e.deltaY
    clearTimeout(sectionIdleTimer)
    sectionIdleTimer = window.setTimeout(() => { sectionDelta = 0 }, 900)

    // console.log('[WorkView] boundary sectionDelta', sectionDelta.toFixed(0), goingFwd ? '→' : '←')

    if (Math.abs(sectionDelta) >= SECTION_THRESHOLD) {
      sectionDelta = 0
      galleryBridge.navigateSection?.(goingFwd ? 1 : -1)
    }
    return
  }

  sectionDelta = 0
  if (cardLocked) return
  cardDelta += e.deltaY
  clearTimeout(cardIdleTimer)
  cardIdleTimer = window.setTimeout(() => { cardDelta = 0 }, 800)
  if (Math.abs(cardDelta) >= CARD_THRESHOLD) {
    const next = cardDelta > 0 ? currentCardIdx + 1 : currentCardIdx - 1
    cardDelta  = 0
    cardLocked = true
    goToCard(next)
    setTimeout(() => { cardLocked = false }, 280)
  }
}

const activeProject = ref<Project | null>(null)

// drag-to-scroll — only counts as a drag if the mouse actually moved enough
let dragStartX    = 0
let dragStartCard = 0
let isDragging    = false
const DRAG_THRESHOLD = 6   // under 6px = click, over = drag

function onMouseDown(e: MouseEvent) {
  dragStartX    = e.clientX
  dragStartCard = currentCardIdx
  isDragging    = false
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup',   onMouseUp)
}

function onMouseMove(e: MouseEvent) {
  const dx = e.clientX - dragStartX
  if (!isDragging && Math.abs(dx) > DRAG_THRESHOLD) isDragging = true
  if (!isDragging) return

  // roughly 120px per card feels natural — not too twitchy, not too slow
  const steps = Math.round(-dx / 120)
  goToCard(Math.max(0, Math.min(N - 1, dragStartCard + steps)))
}

function onMouseUp(e: MouseEvent) {
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup',   onMouseUp)

  if (!isDragging) {
    // short press with no movement = click, open the project panel
    if (!galleryBridge.raycast) return
    const idx = galleryBridge.raycast(e.clientX, e.clientY)
    if (idx < 0) return
    goToCard(idx)
    activeProject.value = content.work.projects[idx]
  }
  isDragging = false
}

onMounted(() => {
  navStore.setWorkCard(0, [])
  trackHover()
})

onUnmounted(() => {
  navStore.setWorkCard(0, [])
  clearTimeout(cardIdleTimer)
  clearTimeout(sectionIdleTimer)
  cancelAnimationFrame(vigRafId)
  galleryBridge.hoveredIndex = -1
  galleryBridge.navigateSection = null
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup',   onMouseUp)
})
</script>

<template>
  <main class="work-view" @wheel.prevent="onWheel" @mousedown="onMouseDown">
    <div ref="titleRef" class="work-title liquid-wrap" aria-hidden="true">
      <span class="work-title-text">{{ t(content.work.heading) }}</span>
      <span class="work-title-counter">{{ counter }}</span>
      <div class="liquid-blob" :style="titleBlobStyle" />
    </div>

    <Transition name="vignette">
      <div
        v-if="hoveredProject"
        class="card-vignette"
        :style="vignetteStyle"
      >
        <div class="vignette-content">
          <h2 class="card-title">{{ hoveredProject.title }}</h2>
          <p class="card-company">{{ hoveredProject.company }}</p>
          <p class="card-desc">{{ t(hoveredProject.description) }}</p>
          <div class="card-tags">
            <span v-for="tag in hoveredProject.tags.slice(0, 3)" :key="tag" class="pill">{{ tag }}</span>
          </div>
        </div>
      </div>
    </Transition>
  </main>

  <ProjectPanel :project="activeProject" @close="activeProject = null" />
</template>

<style scoped>
.work-view {
  height: 100vh;
  overflow: hidden;
  position: relative;
  cursor: none;
}

/* ── liquid blob ───────────────────────────────────────────── */
.liquid-wrap { position: relative; }
.liquid-blob {
  position: absolute;
  width: 160px;
  height: 80px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(107, 95, 186, 0.55) 0%, rgba(75, 63, 138, 0.2) 50%, transparent 70%);
  mix-blend-mode: screen;
  pointer-events: none;
  transform: translate(-50%, -50%);
  filter: blur(14px);
  will-change: left, top, opacity;
}

/* ── section title ─────────────────────────────────────────── */
.work-title {
  position: absolute;
  top: 10vh;
  left: 0;
  right: 0;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 2rem;
  pointer-events: none;
  z-index: 4;
}

.work-title-text {
  font-family: 'Syne', sans-serif;
  font-weight: 700;
  font-size: clamp(2.4rem, 4vw, 5.2rem);
  color: var(--ink);
  letter-spacing: -0.01em;
  line-height: 1;
  opacity: 0.85;
}

.work-title-counter {
  font-family: 'DM Sans', sans-serif;
  font-weight: 200;
  font-size: 0.65rem;
  letter-spacing: 0.18em;
  color: rgba(245, 244, 242, 0.3);
  text-transform: uppercase;
}

/* ── vignette overlay ──────────────────────────────────────── */
.card-vignette {
  position: fixed;
  pointer-events: none;
  z-index: 5;
  display: flex;
  align-items: flex-end;
  will-change: transform, opacity;
  background: linear-gradient(
    to top,
    rgba(5, 5, 12, 0.97) 0%,
    rgba(5, 5, 12, 0.72) 45%,
    transparent 100%
  );
}

.vignette-content {
  padding: 1.4rem 1.2rem 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  width: 100%;
}

.card-title {
  font-family: 'Syne', sans-serif;
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--ink);
  line-height: 1.05;
}

.card-company {
  font-family: 'DM Sans', sans-serif;
  font-weight: 200;
  font-size: 0.58rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--accent-light);
}

.card-desc {
  font-family: 'DM Sans', sans-serif;
  font-weight: 300;
  font-size: 0.68rem;
  color: rgba(245, 244, 242, 0.55);
  line-height: 1.6;
  margin-top: 0.1rem;
}

.card-tags {
  display: flex;
  flex-wrap: nowrap;
  gap: 0.25rem;
  margin-top: 0.3rem;
  overflow: hidden;
}

.pill {
  font-family: 'DM Sans', sans-serif;
  font-weight: 300;
  font-size: 0.52rem;
  letter-spacing: 0.06em;
  color: rgba(245, 244, 242, 0.50);
  border: 1px solid rgba(245, 244, 242, 0.09);
  border-radius: 999px;
  padding: 0.14rem 0.46rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 85px;
  flex-shrink: 0;
}

.vignette-enter-active,
.vignette-leave-active {
  transition: opacity 0.2s ease, transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.vignette-enter-from,
.vignette-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
