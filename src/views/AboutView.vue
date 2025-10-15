<script setup lang="ts">
import { ref, onMounted } from 'vue'
import gsap from 'gsap'
import { useContent } from '@/composables/useContent'

const { content, t } = useContent()

function resolveItem(item: string | { fr: string; en: string }): string {
  return typeof item === 'string' ? item : t(item)
}

const headingRef = ref<HTMLElement | null>(null)
const dividerRef = ref<HTMLElement | null>(null)
const cvRef      = ref<HTMLElement | null>(null)

onMounted(() => {
  const tl = gsap.timeline()

  // heading rises up
  tl.from(headingRef.value, {
    opacity: 0, y: 24,
    duration: 0.7, ease: 'power3.out'
  })

  // divider draws left → right
  .from(dividerRef.value, {
    scaleX: 0,
    duration: 0.65, ease: 'power2.out', transformOrigin: 'left center'
  }, '-=0.3')

  // bio fades
  .from('.about-bio', {
    opacity: 0, y: 10,
    duration: 0.5, ease: 'power2.out'
  }, '-=0.2')

  // rows assemble one by one
  .from('.about-row', {
    opacity: 0, y: 16,
    duration: 0.5, ease: 'power2.out',
    stagger: 0.14
  }, '-=0.2')

  // after rows land, skill pills pop in individually
  .from('.skill-pill', {
    opacity: 0, y: 6, scale: 0.9,
    duration: 0.3, ease: 'power2.out',
    stagger: 0.055
  }, '-=0.35')

  // CV button pulses in last
  .fromTo(cvRef.value,
    { opacity: 0, y: 8 },
    {
      opacity: 1, y: 0,
      duration: 0.55, ease: 'power2.out',
      onComplete: () => {
        // subtle purple glow pulse, runs once
        gsap.to(cvRef.value, {
          boxShadow: '0 0 18px rgba(75, 63, 138, 0.45)',
          duration: 0.7, ease: 'power2.out',
          yoyo: true, repeat: 1
        })
      }
    }, '-=0.1'
  )
})
</script>

<template>
  <main class="about-view">

    <!-- Left column: heading + bio + CV -->
    <div class="left-col">
      <div ref="headingRef" class="heading-wrap">
        <h1 class="heading">{{ t(content.about.heading) }}</h1>
      </div>

      <p class="about-bio">{{ t(content.about.bio) }}</p>

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

    <!-- Full-width divider after heading -->
    <div ref="dividerRef" class="divider" />

    <!-- Right column: rows -->
    <div class="right-col">
      <div
        v-for="row in content.about.rows"
        :key="row.key"
        class="about-row"
      >
        <span class="row-label">{{ t(row.label) }}</span>

        <!-- skill pills get individual stagger -->
        <div v-if="row.type === 'pills'" class="row-pills">
          <span
            v-for="item in row.items"
            :key="typeof item === 'string' ? item : item.fr"
            class="skill-pill"
          >
            {{ resolveItem(item) }}
          </span>
        </div>

        <!-- regular tags -->
        <div v-else class="row-tags">
          <span
            v-for="item in row.items"
            :key="typeof item === 'string' ? item : item.fr"
            class="tag"
          >
            {{ resolveItem(item) }}
          </span>
        </div>
      </div>
    </div>

  </main>
</template>

<style scoped>
/* ── layout ─────────────────────────────────────────────── */
.about-view {
  height: 100vh;
  display: grid;
  /*
    Left col: heading + bio + CV (40% width)
    Right col: rows (55% width), offset by the divider
  */
  grid-template-columns: 40% 1fr;
  grid-template-rows: auto 1px 1fr;
  grid-template-areas:
    "left  left"
    "div   div"
    ".     right";
  align-items: start;
  padding: 0 5%;
  padding-top: 18vh;
}

/* ── left col ────────────────────────────────────────────── */
.left-col {
  grid-area: left;
  display: flex;
  flex-direction: column;
  gap: 1.8rem;
  padding-right: 6%;
  padding-bottom: 2.5rem;
}

.heading-wrap {
  overflow: hidden;
}

.heading {
  font-family: 'Syne', sans-serif;
  font-weight: 700;
  font-size: clamp(2.8rem, 5vw, 5rem);
  color: var(--ink);
  line-height: 1;
}

.about-bio {
  font-family: 'DM Sans', sans-serif;
  font-weight: 300;
  font-size: 0.85rem;
  line-height: 1.75;
  color: rgba(245, 244, 242, 0.5);
  max-width: 340px;
}

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
  opacity: 0;   /* GSAP animates this in */
}

.cv-btn:hover {
  color: var(--ink);
  border-color: rgba(107, 95, 186, 0.7);
  box-shadow: 0 0 16px rgba(75, 63, 138, 0.3);
}

/* ── full-width divider ──────────────────────────────────── */
.divider {
  grid-area: div;
  background: var(--ink-faint);
  width: 100%;
  margin: 0 -5%;
  width: calc(100% + 10%);
  height: 1px;
}

/* ── right col ───────────────────────────────────────────── */
.right-col {
  grid-area: right;
  display: flex;
  flex-direction: column;
  padding-top: 2rem;
  padding-bottom: 2rem;
  overflow-y: auto;
  scrollbar-width: none;
}

/* ── rows ────────────────────────────────────────────────── */
.about-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 2rem;
  padding: 1.1rem 0;
  border-bottom: 1px solid var(--ink-faint);
}

.about-row:first-child {
  border-top: 1px solid var(--ink-faint);
}

.row-label {
  font-family: 'Syne', sans-serif;
  font-weight: 600;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent-light);
  min-width: 120px;
  padding-top: 0.15rem;
}

/* ── regular tags ────────────────────────────────────────── */
.row-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  justify-content: flex-end;
}

.tag {
  font-family: 'DM Sans', sans-serif;
  font-weight: 300;
  font-size: 0.7rem;
  letter-spacing: 0.04em;
  color: rgba(245, 244, 242, 0.55);
  border: 1px solid rgba(245, 244, 242, 0.1);
  border-radius: 999px;
  padding: 0.22rem 0.75rem;
}

/* ── skill pills ─────────────────────────────────────────── */
.row-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  justify-content: flex-end;
}

.skill-pill {
  font-family: 'DM Sans', sans-serif;
  font-weight: 300;
  font-size: 0.68rem;
  letter-spacing: 0.05em;
  color: rgba(107, 95, 186, 0.85);
  border: 1px solid rgba(75, 63, 138, 0.38);
  border-radius: 999px;
  padding: 0.22rem 0.75rem;
  background: rgba(75, 63, 138, 0.06);
}
</style>
