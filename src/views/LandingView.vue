<script setup lang="ts">
import { computed, onMounted } from 'vue'
import gsap from 'gsap'
import ThreeCanvas from '@/components/ThreeCanvas.vue'
import { useContent } from '@/composables/useContent'
import { useIntroStore } from '@/stores/intro'

const { content, t } = useContent()
const introStore = useIntroStore()

const nameWords = computed(() => content.home.name.split(' '))

onMounted(() => {
  // If intro was already played (persisted in localStorage), just show everything immediately
  if (introStore.played) {
    gsap.set('[data-nav-item]', { opacity: 1, y: 0 })
    gsap.set(['.landing-word', '.landing-role'], { opacity: 1, y: 0 })
    return
  }

  // First ever visit — hide nav, then orchestrate the full reveal
  gsap.set('[data-nav-item]', { opacity: 0, y: -8 })

  const tl = gsap.timeline({ delay: 0.5 })

  tl.from('.landing-word', {
    y: '108%',
    duration: 1.35,
    ease: 'power4.out',
    stagger: 0.18
  })

  .from('.landing-role', {
    opacity: 0,
    y: 12,
    duration: 0.75,
    ease: 'power2.out'
  }, '-=0.6')

  .to('[data-nav-item]', {
    opacity: 1,
    y: 0,
    duration: 0.55,
    ease: 'power2.out',
    stagger: 0.1
  }, '-=0.3')

  tl.eventCallback('onComplete', () => introStore.markPlayed())
})
</script>

<template>
  <div class="landing">
    <ThreeCanvas />

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
