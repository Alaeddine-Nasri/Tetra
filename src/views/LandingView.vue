<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import gsap from 'gsap'
import { useContent } from '@/composables/useContent'

const { content, t } = useContent()

const rootEl    = ref<HTMLElement | null>(null)
const nameWords = computed(() => content.home.name.split(' '))

let introTl: gsap.core.Timeline | null = null

onMounted(() => {
  if (!rootEl.value) return
  const scope = rootEl.value

  // Always animate — every visit to landing replays the name reveal
  gsap.set('[data-nav-item]', { opacity: 0, y: -8 })

  introTl = gsap.timeline({ delay: 0.3 })

  introTl
    .from(scope.querySelectorAll('.landing-word'), {
      y: '108%',
      duration: 1.35,
      ease: 'power4.out',
      stagger: 0.18,
    })
    .from(scope.querySelector('.landing-role'), {
      y: 12,
      duration: 0.75,
      ease: 'power2.out',
    }, '-=0.6')
    .to('[data-nav-item]', {
      opacity: 1,
      y: 0,
      duration: 0.55,
      ease: 'power2.out',
      stagger: 0.1,
    }, '-=0.3')
})

onUnmounted(() => {
  if (introTl) {
    introTl.kill()
    introTl = null
  }
  // Always restore nav items to fully visible — they must show on all other pages
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
  font-size: clamp(3.8rem, 8.5vw, 9.5rem);
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
