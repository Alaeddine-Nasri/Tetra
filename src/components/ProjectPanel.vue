<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import gsap from 'gsap'
import { useContent } from '@/composables/useContent'
import type { Project } from '@/data/content'

const props = defineProps<{ project: Project | null }>()
const emit  = defineEmits<{ (e: 'close'): void }>()

const { t, lang } = useContent()

const panelRef   = ref<HTMLElement | null>(null)
const overlayRef = ref<HTMLElement | null>(null)

watch(() => props.project, async (val) => {
  if (!val) return
  await nextTick()
  if (!panelRef.value || !overlayRef.value) return

  gsap.fromTo(overlayRef.value,
    { opacity: 0 },
    { opacity: 1, duration: 0.35, ease: 'power2.out' }
  )
  gsap.fromTo(panelRef.value,
    { x: '100%' },
    { x: '0%', duration: 0.45, ease: 'power3.out' }
  )
  gsap.fromTo('.panel-stagger',
    { opacity: 0, y: 16 },
    { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.07, delay: 0.3 }
  )
})

function close() {
  if (!panelRef.value || !overlayRef.value) { emit('close'); return }
  const tl = gsap.timeline({ onComplete: () => emit('close') })
  tl.to(panelRef.value,  { x: '100%', duration: 0.35, ease: 'power2.in' })
    .to(overlayRef.value, { opacity: 0, duration: 0.2, ease: 'power1.in' }, '-=0.1')
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
}

onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <Teleport to="body">
    <div v-if="project" ref="overlayRef" class="overlay" @click.self="close">
      <div ref="panelRef" class="panel">

        <button class="close-btn" @click.stop="close" aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
          </svg>
        </button>

        <div class="panel-scroll">

          <!-- Hero image -->
          <div class="panel-hero panel-stagger">
            <img :src="project.image" :alt="project.title" class="hero-img" loading="lazy" />
          </div>

          <!-- Meta block -->
          <div class="panel-meta panel-stagger">

            <div class="meta-title-row">
              <h2 class="meta-title">{{ project.title }}</h2>
              <div class="meta-separator" />
            </div>

            <div class="meta-row">
              <span class="meta-label">{{ lang.locale === 'fr' ? 'Client' : 'Client' }}</span>
              <span class="meta-value">{{ project.company }}</span>
            </div>

            <div class="meta-row">
              <span class="meta-label">{{ lang.locale === 'fr' ? 'Rôle' : 'Role' }}</span>
              <span class="meta-value">{{ t(project.role) }}</span>
            </div>

            <div class="meta-row">
              <span class="meta-label">{{ lang.locale === 'fr' ? 'Année' : 'Year' }}</span>
              <span class="meta-value">{{ project.year }}</span>
            </div>

            <div class="meta-row meta-row--stack">
              <span class="meta-label">Stack</span>
              <div class="meta-tags">
                <span v-for="tag in project.tags" :key="tag" class="pill">{{ tag }}</span>
              </div>
            </div>

            <!-- Impact line -->
            <div class="meta-impact">
              <span class="impact-dot" />
              {{ t(project.impact) }}
            </div>

          </div>

          <!-- Full description -->
          <div class="panel-desc panel-stagger">
            <p v-for="(para, i) in t(project.fullDescription).split('\n\n')" :key="i">{{ para }}</p>
          </div>

          <!-- Live link -->
          <a
            v-if="project.url"
            :href="project.url"
            target="_blank"
            rel="noopener noreferrer"
            class="panel-link panel-stagger"
          >
            <span>{{ lang.locale === 'fr' ? 'Voir le projet' : 'View project' }}</span>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </a>

          <!-- Screenshots -->
          <div v-if="project.screenshots?.length" class="panel-screenshots panel-stagger">
            <div
              v-for="(shot, i) in project.screenshots"
              :key="i"
              class="screenshot-item"
            >
              <div class="screenshot-img-wrap">
                <img :src="shot.src" :alt="t(shot.title)" class="screenshot-img" loading="lazy" />
              </div>
              <div class="screenshot-caption">
                <span class="caption-title">{{ t(shot.title) }}</span>
                <p class="caption-desc">{{ t(shot.description) }}</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 500;
  background: rgba(4, 5, 10, 0.72);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: stretch;
  justify-content: flex-end;
}

.panel {
  position: relative;
  width: 44vw;
  height: 100%;
  background: #060810;
  border-left: 1px solid rgba(245, 244, 242, 0.06);
  display: flex;
  flex-direction: column;
}

.close-btn {
  position: absolute;
  top: 1.8rem;
  right: 1.8rem;
  z-index: 10;
  background: none;
  border: 1px solid rgba(245, 244, 242, 0.1);
  border-radius: 50%;
  width: 2.2rem;
  height: 2.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(245, 244, 242, 0.4);
  cursor: none;
  transition: color 0.2s ease, border-color 0.2s ease, box-shadow 0.3s ease;
}

.close-btn:hover {
  color: var(--ink);
  border-color: rgba(107, 95, 186, 0.6);
  box-shadow: 0 0 14px rgba(75, 63, 138, 0.4);
}

.panel-scroll {
  flex: 1;
  overflow-y: scroll;
  overflow-x: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  padding: 0 0 4rem;
}

.panel-scroll::-webkit-scrollbar { display: none; }

/* ── hero ── */
.panel-hero {
  width: 100%;
  aspect-ratio: 16/9;
  overflow: hidden;
  background: #0D0F1C;
  flex-shrink: 0;
}

.hero-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  opacity: 0.9;
  transition: opacity 0.3s ease;
}

.hero-img:hover { opacity: 1; }

/* ── meta ── */
.panel-meta {
  padding: 0 3rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.meta-title-row {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-bottom: 0.5rem;
}

.meta-title {
  font-family: 'Syne', sans-serif;
  font-weight: 700;
  font-size: clamp(1.8rem, 3vw, 2.6rem);
  color: var(--ink);
  line-height: 1.02;
}

.meta-separator {
  height: 1px;
  background: rgba(245, 244, 242, 0.1);
}

.meta-row {
  display: grid;
  grid-template-columns: 100px 1fr;
  gap: 1rem;
  align-items: baseline;
}

.meta-row--stack { align-items: flex-start; }

.meta-label {
  font-family: 'DM Sans', sans-serif;
  font-weight: 600;
  font-size: 0.62rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(245, 244, 242, 0.28);
}

.meta-value {
  font-family: 'DM Sans', sans-serif;
  font-weight: 300;
  font-size: 0.85rem;
  color: rgba(245, 244, 242, 0.65);
}

.meta-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.pill {
  font-family: 'DM Sans', sans-serif;
  font-weight: 300;
  font-size: 0.62rem;
  letter-spacing: 0.06em;
  color: rgba(107, 95, 186, 0.9);
  border: 1px solid rgba(75, 63, 138, 0.4);
  border-radius: 999px;
  padding: 0.22rem 0.65rem;
  background: rgba(75, 63, 138, 0.08);
}

.meta-impact {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-top: 0.25rem;
  font-family: 'DM Sans', sans-serif;
  font-weight: 300;
  font-size: 0.72rem;
  color: rgba(107, 95, 186, 0.75);
  line-height: 1.5;
}

.impact-dot {
  flex-shrink: 0;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(107, 95, 186, 0.7);
}

/* ── description ── */
.panel-desc {
  padding: 0 3rem;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.panel-desc p {
  font-family: 'DM Sans', sans-serif;
  font-weight: 300;
  font-size: 0.85rem;
  line-height: 1.8;
  color: rgba(245, 244, 242, 0.52);
}

/* ── live link ── */
.panel-link {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  margin: 0 3rem;
  font-family: 'DM Sans', sans-serif;
  font-weight: 300;
  font-size: 0.72rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(245, 244, 242, 0.4);
  border: 1px solid rgba(75, 63, 138, 0.3);
  border-radius: 2px;
  padding: 0.65rem 1.2rem;
  align-self: flex-start;
  transition: color 0.25s ease, border-color 0.25s ease, box-shadow 0.3s ease;
}

.panel-link:hover {
  color: var(--ink);
  border-color: rgba(107, 95, 186, 0.6);
  box-shadow: 0 0 16px rgba(75, 63, 138, 0.3);
}

/* ── screenshots ── */
.panel-screenshots {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 0 3rem;
}

.screenshot-item {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.screenshot-img-wrap {
  width: 100%;
  aspect-ratio: 16/9;
  overflow: hidden;
  background: #0D0F1C;
  border: 1px solid rgba(245, 244, 242, 0.06);
  border-radius: 2px;
}

.screenshot-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
  opacity: 0.85;
  transition: opacity 0.3s ease;
}

.screenshot-img:hover { opacity: 1; }

.screenshot-caption {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.caption-title {
  font-family: 'DM Sans', sans-serif;
  font-weight: 400;
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  color: rgba(245, 244, 242, 0.5);
}

.caption-desc {
  font-family: 'DM Sans', sans-serif;
  font-weight: 300;
  font-size: 0.7rem;
  line-height: 1.6;
  color: rgba(245, 244, 242, 0.3);
}
</style>
