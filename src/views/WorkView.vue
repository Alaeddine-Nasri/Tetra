<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import gsap from 'gsap'
import { useContent } from '@/composables/useContent'
import type { Project } from '@/data/content'

const { content, t, lang } = useContent()

const trackRef   = ref<HTMLElement | null>(null)
const wrapRef    = ref<HTMLElement | null>(null)

// detail overlay
const activeProject = ref<Project | null>(null)
const detailRef      = ref<HTMLElement | null>(null)
const panelRef       = ref<HTMLElement | null>(null)

let currentX     = 0
let targetX      = 0
let rafId        = 0

// drag state
let isDragging   = false
let dragStartX   = 0
let dragStartScroll = 0

// ─── smooth scroll loop ───────────────────────────────────────────────────
function tick() {
  currentX += (targetX - currentX) * 0.072
  if (trackRef.value) {
    trackRef.value.style.transform = `translateX(${-currentX}px)`
  }
  rafId = requestAnimationFrame(tick)
}

function clamp(val: number, min: number, max: number) {
  return Math.min(Math.max(val, min), max)
}

function maxScroll() {
  if (!trackRef.value || !wrapRef.value) return 0
  return trackRef.value.scrollWidth - wrapRef.value.clientWidth
}

// wheel → horizontal
function onWheel(e: WheelEvent) {
  e.preventDefault()
  targetX = clamp(targetX + e.deltaY * 1.2, 0, maxScroll())
}

// drag
function onMouseDown(e: MouseEvent) {
  isDragging   = true
  dragStartX   = e.clientX
  dragStartScroll = targetX
  document.body.style.userSelect = 'none'
}

function onMouseMove(e: MouseEvent) {
  if (!isDragging) return
  const delta = dragStartX - e.clientX
  targetX = clamp(dragStartScroll + delta, 0, maxScroll())
}

function onMouseUp() {
  isDragging = false
  document.body.style.userSelect = ''
}

// ─── card click → detail overlay ─────────────────────────────────────────
function openProject(project: Project, evt: MouseEvent) {
  if (Math.abs(targetX - dragStartScroll) > 6) return   // was a drag, not a click

  activeProject.value = project

  // animate after next tick so DOM renders first
  requestAnimationFrame(() => {
    if (!detailRef.value || !panelRef.value) return

    // backdrop fades in
    gsap.fromTo(detailRef.value,
      { opacity: 0 },
      { opacity: 1, duration: 0.35, ease: 'power2.out' }
    )
    // panel slides in from right
    gsap.fromTo(panelRef.value,
      { x: '100%' },
      { x: '0%', duration: 0.55, ease: 'power3.out' }
    )
  })
}

function closeProject() {
  if (!detailRef.value || !panelRef.value) return

  const tl = gsap.timeline({
    onComplete: () => { activeProject.value = null }
  })

  // panel slides out right, then backdrop fades
  tl.to(panelRef.value, { x: '100%', duration: 0.4, ease: 'power2.in' })
    .to(detailRef.value, { opacity: 0, duration: 0.2, ease: 'power1.in' }, '-=0.1')
}

// keyboard close
function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') closeProject()
}

// ─── enter animation ──────────────────────────────────────────────────────
onMounted(() => {
  rafId = requestAnimationFrame(tick)

  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)

  // stagger cards in from the right
  gsap.fromTo('.project-card',
    { opacity: 0, x: 60 },
    { opacity: 1, x: 0, duration: 0.7, ease: 'power3.out', stagger: 0.12, delay: 0.1 }
  )
})

onUnmounted(() => {
  cancelAnimationFrame(rafId)
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
})
</script>

<template>
  <main
    ref="wrapRef"
    class="work-view"
    :aria-label="t(content.work.heading)"
    @wheel.prevent="onWheel"
    @mousedown="onMouseDown"
  >
    <!-- scrollable track -->
    <div ref="trackRef" class="track">
      <!-- intro label card -->
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
        v-for="project in content.work.projects"
        :key="project.id"
        class="project-card"
        @mousedown="dragStartScroll = targetX"
        @click="(e) => openProject(project, e)"
      >
        <!-- background image — native lazy loading -->
        <img
          class="card-bg"
          :src="project.image"
          :alt="project.title"
          loading="lazy"
          aria-hidden="true"
        />

        <!-- always-visible top meta -->
        <div class="card-top">
          <span class="card-year">{{ project.year }}</span>
        </div>

        <!-- hover vignette rising from bottom -->
        <div class="card-vignette">
          <div class="vignette-content">
            <h2 class="card-title">{{ project.title }}</h2>
            <p class="card-company">{{ project.company }}</p>
            <p class="card-desc">{{ t(project.description) }}</p>
            <div class="card-tags">
              <span
                v-for="tag in project.tags"
                :key="tag"
                class="pill"
              >{{ tag }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- trailing space -->
      <div class="trail" />
    </div>

    <!-- scroll progress line -->
    <div class="progress-track">
      <div
        class="progress-fill"
        :style="{ transform: `scaleX(${maxScroll() > 0 ? currentX / maxScroll() : 0})` }"
      />
    </div>
  </main>

  <!-- ─── Project detail overlay ─── -->
  <Teleport to="body">
    <div
      v-if="activeProject"
      ref="detailRef"
      class="detail-overlay"
      @click.self="closeProject"
    >
      <div ref="panelRef" class="detail-panel">
        <!-- dimmed background image -->
        <img
          class="detail-bg"
          :src="activeProject.image"
          :alt="activeProject.title"
          loading="lazy"
          aria-hidden="true"
        />
        <div class="detail-scrim" />

        <!-- close -->
        <button class="detail-close" @click.stop="closeProject" aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 3l14 14M17 3L3 17" stroke="currentColor" stroke-width="1.2"/>
          </svg>
        </button>

        <!-- content -->
        <div class="detail-body">
          <p class="detail-company">{{ activeProject.company }} · {{ activeProject.year }}</p>
          <h2 class="detail-title">{{ activeProject.title }}</h2>
          <p class="detail-desc">{{ t(activeProject.fullDescription) }}</p>

          <div class="detail-tags">
            <span
              v-for="tag in activeProject.tags"
              :key="tag"
              class="pill pill--accent"
            >{{ tag }}</span>
          </div>

          <a
            v-if="activeProject.url"
            :href="activeProject.url"
            target="_blank"
            rel="noopener noreferrer"
            class="detail-link"
          >
            <span>{{ lang.locale === 'fr' ? 'Voir le projet' : 'View project' }}</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* ── wrapper ─────────────────────────────────────────────── */
.work-view {
  height: 100vh;
  overflow: hidden;
  position: relative;
  cursor: none;
  display: block;  /* reset main default margins */
}

/* ── horizontal track ────────────────────────────────────── */
.track {
  display: flex;
  align-items: center;
  height: 100%;
  will-change: transform;
  padding-left: 5vw;
  gap: 2.5vw;
}

/* ── intro label ─────────────────────────────────────────── */
.intro-card {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  min-width: 18vw;
  padding-right: 2vw;
}

.intro-label {
  font-family: 'Syne', sans-serif;
  font-weight: 700;
  font-size: clamp(2.8rem, 5vw, 5rem);
  color: var(--ink);
  line-height: 1;
}

.intro-hint {
  color: rgba(245, 244, 242, 0.2);
}

/* ── card ────────────────────────────────────────────────── */
.project-card:focus-visible {
  outline: 1px solid var(--accent-light);
  outline-offset: 3px;
}

.project-card {
  flex-shrink: 0;
  position: relative;
  width: clamp(320px, 28vw, 480px);
  height: 70vh;
  border-radius: 4px;
  overflow: hidden;
  cursor: none;
}

.project-card:hover .card-vignette {
  transform: translateY(0%);
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
}

.project-card:hover .card-bg {
  transform: scale(1.03);
}

/* year — top right */
.card-top {
  position: absolute;
  top: 1.4rem;
  right: 1.4rem;
  z-index: 2;
}

.card-year {
  font-family: 'DM Sans', sans-serif;
  font-weight: 200;
  font-size: 0.68rem;
  letter-spacing: 0.15em;
  color: rgba(245, 244, 242, 0.45);
}

/* ── vignette curtain ─────────────────────────────────────── */
.card-vignette {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  /* starts fully below the card */
  transform: translateY(100%);
  transition: transform 0.42s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 3;
  background: linear-gradient(
    to top,
    rgba(5, 5, 12, 0.97) 0%,
    rgba(5, 5, 12, 0.85) 55%,
    transparent 100%
  );
  padding: 2.5rem 1.8rem 2rem;
}

.vignette-content {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.card-title {
  font-family: 'Syne', sans-serif;
  font-weight: 700;
  font-size: 1.55rem;
  color: var(--ink);
  line-height: 1.05;
}

.card-company {
  font-family: 'DM Sans', sans-serif;
  font-weight: 200;
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--accent-light);
}

.card-desc {
  font-family: 'DM Sans', sans-serif;
  font-weight: 300;
  font-size: 0.8rem;
  color: rgba(245, 244, 242, 0.65);
  line-height: 1.6;
  margin-top: 0.25rem;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.55rem;
}

/* ── pills ───────────────────────────────────────────────── */
.pill {
  font-family: 'DM Sans', sans-serif;
  font-weight: 300;
  font-size: 0.62rem;
  letter-spacing: 0.06em;
  color: rgba(245, 244, 242, 0.55);
  border: 1px solid rgba(245, 244, 242, 0.13);
  border-radius: 999px;
  padding: 0.2rem 0.65rem;
}

.pill--accent {
  color: rgba(107, 95, 186, 0.9);
  border-color: rgba(75, 63, 138, 0.45);
}

/* ── trailing space ──────────────────────────────────────── */
.trail {
  flex-shrink: 0;
  width: 5vw;
}

/* ── scroll progress ─────────────────────────────────────── */
.progress-track {
  position: absolute;
  bottom: 2.5rem;
  left: 5%;
  right: 5%;
  height: 1px;
  background: rgba(245, 244, 242, 0.08);
}

.progress-fill {
  height: 100%;
  background: var(--accent-light);
  transform-origin: left center;
  transform: scaleX(0);
  transition: transform 0.1s linear;
  opacity: 0.7;
}

/* ── detail overlay ──────────────────────────────────────── */
.detail-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  background: rgba(7, 8, 15, 0.65);
  backdrop-filter: blur(2px);
}

.detail-panel {
  position: relative;
  width: 52vw;
  height: 100vh;
  overflow: hidden;
  background: #090B15;
}

.detail-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  opacity: 0.18;
}

.detail-scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(9, 11, 21, 0.85) 0%, transparent 100%);
}

.detail-close {
  position: absolute;
  top: 2.2rem;
  right: 2.2rem;
  z-index: 2;
  background: none;
  border: none;
  color: rgba(245, 244, 242, 0.4);
  cursor: none;
  padding: 0.5rem;
  transition: color 0.2s;
}

.detail-close:hover {
  color: var(--ink);
}

.detail-body {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  height: 100%;
  padding: 5rem 4.5rem;
  gap: 1.2rem;
}

.detail-company {
  font-family: 'DM Sans', sans-serif;
  font-weight: 200;
  font-size: 0.7rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--accent-light);
}

.detail-title {
  font-family: 'Syne', sans-serif;
  font-weight: 700;
  font-size: clamp(2.2rem, 4vw, 3.8rem);
  color: var(--ink);
  line-height: 1.02;
}

.detail-desc {
  font-family: 'DM Sans', sans-serif;
  font-weight: 300;
  font-size: 0.88rem;
  line-height: 1.75;
  color: rgba(245, 244, 242, 0.6);
  max-width: 420px;
}

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.3rem;
}

.detail-link {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  font-family: 'DM Sans', sans-serif;
  font-weight: 300;
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(245, 244, 242, 0.45);
  margin-top: 0.8rem;
  transition: color 0.25s ease;
}

.detail-link:hover {
  color: var(--ink);
}
</style>
