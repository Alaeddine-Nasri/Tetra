<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import gsap from 'gsap'
import { useContent } from '@/composables/useContent'
import { useNavigationStore } from '@/stores/navigation'

const { content, t } = useContent()
const navStore = useNavigationStore()

const rootEl  = ref<HTMLElement | null>(null)
const cvRef   = ref<HTMLElement | null>(null)
const activeRow = ref<string | null>(null)

function resolveItem(item: string | { fr: string; en: string }): string {
  return typeof item === 'string' ? item : t(item)
}

function toggleRow(key: string) {
  activeRow.value = activeRow.value === key ? null : key
  navStore.setActiveAboutRow(activeRow.value)
}

onMounted(() => {
  if (!rootEl.value) return
  const scope = rootEl.value

  const tl = gsap.timeline({ delay: 0.55 })

  tl.from(scope.querySelector('.about-heading'), {
    y: 28, duration: 0.75, ease: 'power3.out'
  })
  .from(scope.querySelector('.about-bio'), {
    y: 12, duration: 0.55, ease: 'power2.out'
  }, '-=0.3')
  .from(scope.querySelectorAll('.stat-card'), {
    y: 20, duration: 0.55, ease: 'power2.out', stagger: 0.1
  }, '-=0.2')
  .from(scope.querySelectorAll('.info-row'), {
    x: -12, duration: 0.45, ease: 'power2.out', stagger: 0.1
  }, '-=0.2')
  .from(cvRef.value, {
    y: 8, duration: 0.5, ease: 'power2.out',
    onComplete: () => {
      gsap.to(cvRef.value, {
        boxShadow: '0 0 20px rgba(75, 63, 138, 0.5)',
        duration: 0.7, ease: 'power2.out',
        yoyo: true, repeat: 1
      })
    }
  }, '-=0.1')
})

onUnmounted(() => {
  if (rootEl.value) gsap.killTweensOf(rootEl.value.querySelectorAll('*'))
})
</script>

<template>
  <main ref="rootEl" class="about-view">

    <!-- ── Left column ──────────────────────────────────── -->
    <div class="left-col">
      <h1 class="about-heading">{{ t(content.about.heading) }}</h1>
      <p class="about-bio">{{ t(content.about.bio) }}</p>

      <!-- Stat cards -->
      <div class="stats">
        <div
          v-for="stat in content.about.stats"
          :key="stat.key"
          class="stat-card"
        >
          <div class="stat-value">
            {{ stat.value }}<span class="stat-unit">{{ t(stat.unit) }}</span>
          </div>
          <div class="stat-label">{{ t(stat.label) }}</div>
          <div class="stat-detail">{{ t(stat.detail) }}</div>
        </div>
      </div>

      <a
        ref="cvRef"
        :href="content.about.cv.path"
        target="_blank"
        rel="noopener noreferrer"
        class="cv-btn"
      >
        {{ t(content.about.cv.label) }}
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" stroke-width="1"/>
        </svg>
      </a>
    </div>

    <!-- ── Right column: expandable info rows ──────────── -->
    <div class="right-col">
      <div
        v-for="row in content.about.rows"
        :key="row.key"
        class="info-row"
        :class="{ 'is-open': activeRow === row.key }"
        @click="toggleRow(row.key)"
      >
        <!-- Row header -->
        <div class="row-header">
          <span class="row-label">{{ t(row.label) }}</span>
          <span class="row-detail-text" v-if="row.detail">{{ t(row.detail) }}</span>
          <span class="row-toggle">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                :d="activeRow === row.key ? 'M2 6h8' : 'M6 2v8M2 6h8'"
                stroke="currentColor" stroke-width="1" stroke-linecap="round"
              />
            </svg>
          </span>
        </div>

        <!-- Expandable items -->
        <Transition name="expand">
          <div v-if="activeRow === row.key" class="row-body">
            <div v-if="row.type === 'pills'" class="row-pills">
              <span
                v-for="item in row.items"
                :key="resolveItem(item)"
                class="skill-pill"
              >{{ resolveItem(item) }}</span>
            </div>
            <div v-else class="row-tags">
              <span
                v-for="item in row.items"
                :key="resolveItem(item)"
                class="tag"
              >{{ resolveItem(item) }}</span>
            </div>
          </div>
        </Transition>
      </div>
    </div>

  </main>
</template>

<style scoped>
/* ── layout ─────────────────────────────────────────────── */
.about-view {
  height: 100vh;
  display: grid;
  grid-template-columns: 42% 1fr;
  gap: 0 4%;
  align-items: center;
  padding: 0 5%;
}

/* ── left column ─────────────────────────────────────────── */
.left-col {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding-right: 2rem;
}

.about-heading {
  font-family: 'Syne', sans-serif;
  font-weight: 700;
  font-size: clamp(2.8rem, 4.5vw, 4.8rem);
  color: var(--ink);
  line-height: 1;
}

.about-bio {
  font-family: 'DM Sans', sans-serif;
  font-weight: 300;
  font-size: 0.85rem;
  line-height: 1.8;
  color: rgba(245, 244, 242, 0.48);
  max-width: 360px;
}

/* ── stat cards ──────────────────────────────────────────── */
.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  background: var(--ink-faint);
  border: 1px solid var(--ink-faint);
  border-radius: 4px;
  overflow: hidden;
}

.stat-card {
  background: var(--bg-secondary);
  padding: 1.2rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  transition: background 0.25s ease;
}

.stat-card:hover {
  background: rgba(75, 63, 138, 0.08);
}

.stat-value {
  font-family: 'Syne', sans-serif;
  font-weight: 700;
  font-size: 1.9rem;
  color: var(--ink);
  line-height: 1;
}

.stat-unit {
  font-size: 0.9rem;
  font-weight: 400;
  color: var(--accent-light);
  margin-left: 0.15em;
}

.stat-label {
  font-family: 'DM Sans', sans-serif;
  font-weight: 300;
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-muted);
}

.stat-detail {
  font-family: 'DM Sans', sans-serif;
  font-weight: 200;
  font-size: 0.65rem;
  color: rgba(245, 244, 242, 0.28);
  line-height: 1.4;
}

/* ── CV button ───────────────────────────────────────────── */
.cv-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  font-family: 'DM Sans', sans-serif;
  font-weight: 300;
  font-size: 0.72rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(245, 244, 242, 0.45);
  border: 1px solid rgba(75, 63, 138, 0.35);
  border-radius: 2px;
  padding: 0.7rem 1.4rem;
  align-self: flex-start;
  transition: color 0.25s ease, border-color 0.25s ease, box-shadow 0.35s ease;
}

.cv-btn:hover {
  color: var(--ink);
  border-color: rgba(107, 95, 186, 0.7);
  box-shadow: 0 0 16px rgba(75, 63, 138, 0.3);
}

/* ── right column ────────────────────────────────────────── */
.right-col {
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--ink-faint);
}

/* ── info rows (accordion) ───────────────────────────────── */
.info-row {
  border-bottom: 1px solid var(--ink-faint);
  cursor: none;
  user-select: none;
}

.row-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.15rem 0;
  transition: opacity 0.2s ease;
}

.info-row:hover .row-header {
  opacity: 0.8;
}

.row-label {
  font-family: 'Syne', sans-serif;
  font-weight: 600;
  font-size: 0.8rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink);
  min-width: 130px;
}

.is-open .row-label {
  color: var(--accent-light);
}

.row-detail-text {
  font-family: 'DM Sans', sans-serif;
  font-weight: 200;
  font-size: 0.75rem;
  color: rgba(245, 244, 242, 0.32);
  flex: 1;
}

.row-toggle {
  color: rgba(245, 244, 242, 0.25);
  margin-left: auto;
  flex-shrink: 0;
  transition: color 0.2s ease;
}

.is-open .row-toggle {
  color: var(--accent-light);
}

/* ── expandable body ─────────────────────────────────────── */
.row-body {
  padding-bottom: 1.2rem;
}

.row-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.tag {
  font-family: 'DM Sans', sans-serif;
  font-weight: 300;
  font-size: 0.7rem;
  letter-spacing: 0.04em;
  color: rgba(245, 244, 242, 0.55);
  border: 1px solid rgba(245, 244, 242, 0.1);
  border-radius: 999px;
  padding: 0.25rem 0.8rem;
}

.row-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.skill-pill {
  font-family: 'DM Sans', sans-serif;
  font-weight: 300;
  font-size: 0.68rem;
  letter-spacing: 0.05em;
  color: rgba(107, 95, 186, 0.9);
  border: 1px solid rgba(75, 63, 138, 0.4);
  border-radius: 999px;
  padding: 0.25rem 0.8rem;
  background: rgba(75, 63, 138, 0.07);
  transition: background 0.2s ease, color 0.2s ease;
}

.skill-pill:hover {
  background: rgba(75, 63, 138, 0.18);
  color: var(--accent-light);
}

/* ── accordion transition ────────────────────────────────── */
.expand-enter-active,
.expand-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
  transform-origin: top;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
