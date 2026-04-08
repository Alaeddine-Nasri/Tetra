<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import gsap from 'gsap'
import { useContent } from '@/composables/useContent'
import { useLoaderStore } from '@/stores/loader'

const { content, t } = useContent()
const loaderStore = useLoaderStore()

const rootEl    = ref<HTMLElement | null>(null)
const nameWords = computed(() => content.home.name.split(' '))

let introTl: gsap.core.Timeline | null = null
let unwatchLoader: (() => void) | null = null
let fallbackTimer: ReturnType<typeof setTimeout> | null = null

function runIntroAnimation() {
  if (!rootEl.value) return
  const scope = rootEl.value

  gsap.set('[data-nav-item]', { opacity: 0, y: -8 })

  introTl = gsap.timeline({ delay: 2.5 })
  introTl
    .fromTo(scope.querySelectorAll('.landing-word'),
      { y: '108%' },
      { y: '0%', duration: 1.35, ease: 'power4.out', stagger: 0.18 }
    )
    .fromTo(scope.querySelector('.landing-role'),
      { y: 12, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.75, ease: 'power2.out' },
      '-=0.6'
    )
    .to('[data-nav-item]', {
      opacity: 1,
      y: 0,
      duration: 0.55,
      ease: 'power2.out',
      stagger: 0.1,
    }, '-=0.3')
}

onMounted(() => {
  if (!rootEl.value) return
  const scope = rootEl.value

  // Always pre-hide name + role so there's no flash before animation
  gsap.set(scope.querySelectorAll('.landing-word'), { y: '108%' })
  gsap.set(scope.querySelector('.landing-role'), { opacity: 0, y: 12 })

  function triggerAnimation() {
    if (introTl) return  // already running
    unwatchLoader?.(); unwatchLoader = null
    if (fallbackTimer) { clearTimeout(fallbackTimer); fallbackTimer = null }
    runIntroAnimation()
  }

  if (loaderStore.done) {
    triggerAnimation()
  } else {
    // Wait for 3D loader, but never block longer than 5s
    unwatchLoader = watch(() => loaderStore.done, (done) => { if (done) triggerAnimation() })
    fallbackTimer = setTimeout(triggerAnimation, 5000)
  }
})

onUnmounted(() => {
  unwatchLoader?.(); unwatchLoader = null
  if (fallbackTimer) { clearTimeout(fallbackTimer); fallbackTimer = null }
  if (introTl) { introTl.kill(); introTl = null }
  gsap.set('[data-nav-item]', { opacity: 1, y: 0 })
})
</script>

<template>
  <div ref="rootEl" class="landing">
    <div class="ambient-glow" />

    <div class="landing-content">
      <div class="name-block">
        <h1 class="landing-name" :aria-label="content.home.name">
          <span
            v-for="word in nameWords"
            :key="word"
            class="word-mask"
          >
            <span class="landing-word">{{ word }}</span>
          </span>
        </h1>

        <p class="landing-role">{{ t(content.home.title) }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.landing {
  position: relative;
  height: 100vh;
  overflow: hidden;
  cursor: none;
}

.ambient-glow {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background:
    radial-gradient(ellipse 55% 40% at 20% 85%, rgba(75, 63, 138, 0.07) 0%, transparent 70%),
    radial-gradient(ellipse 30% 25% at 75% 15%, rgba(75, 63, 138, 0.04) 0%, transparent 70%);
}

.landing-content {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: flex-end;
  padding: 0 5% 9vh;
}

.name-block {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.landing-name {
  font-family: 'Syne', sans-serif;
  font-weight: 800;
  font-size: clamp(2.6rem, 5.8vw, 8rem);
  line-height: 1;
  color: var(--ink);
  display: flex;
  flex-wrap: wrap;
  column-gap: 0.28em;
  row-gap: 0;
}

.word-mask {
  display: inline-block;
  overflow: hidden;
  line-height: 1.08;
  vertical-align: top;
  padding-bottom: 0.04em;
}

.landing-word {
  display: inline-block;
}

.landing-role {
  font-family: 'DM Sans', sans-serif;
  font-weight: 200;
  font-size: 0.75rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--ink-muted);
}
</style>
