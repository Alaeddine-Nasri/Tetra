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
  const tl = gsap.timeline({ delay: 0.5 })

  // Words rise from behind their overflow-hidden mask, one by one
  tl.from('.landing-word', {
    y: '108%',
    duration: 1.35,
    ease: 'power4.out',
    stagger: 0.18
  })

  // Title line fades in just as last word lands
  .from('.landing-role', {
    opacity: 0,
    y: 12,
    duration: 0.75,
    ease: 'power2.out'
  }, '-=0.6')

  // Nav items cascade in from top — targets the data attribute set by Navbar
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

    <!-- Barely perceptible atmospheric glow, bottom-left where the name lives -->
    <div class="ambient-glow" />

    <div class="landing-content">
      <div class="name-block">

        <!-- Name: each word has an overflow-hidden mask so the rise-up is clipped -->
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

/* A very faint purple presence — just enough to feel intentional */
.ambient-glow {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background:
    radial-gradient(ellipse 55% 40% at 20% 85%, rgba(75, 63, 138, 0.07) 0%, transparent 70%),
    radial-gradient(ellipse 30% 25% at 75% 15%, rgba(75, 63, 138, 0.04) 0%, transparent 70%);
}

/* Content sits above the canvas, bottom-left anchored */
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

/* The name itself — large, Syne heavy */
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

/*
  The mask clips anything below its bottom edge.
  GSAP starts the .landing-word at y:108% (below the clip)
  and eases it up to y:0 (fully visible).
*/
.word-mask {
  display: inline-block;
  overflow: hidden;
  line-height: 1.08;
  vertical-align: top;
  /* tiny padding so descenders aren't clipped */
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
