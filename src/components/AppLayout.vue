<script setup lang="ts">
import { useRoute } from 'vue-router'
import gsap from 'gsap'
import Navbar from './Navbar.vue'
import CustomCursor from './CustomCursor.vue'
import { useMeta } from '@/composables/useMeta'

const route = useRoute()

// Runs once, then reactively updates on locale change
useMeta()

function onBeforeEnter(el: Element) {
  gsap.set(el, { opacity: 0, y: 28 })
}

function onEnter(el: Element, done: () => void) {
  gsap.to(el, {
    opacity: 1,
    y: 0,
    duration: 0.55,
    ease: 'power3.out',
    delay: 0.12,
    onComplete: done
  })
}

function onLeave(el: Element, done: () => void) {
  gsap.to(el, {
    opacity: 0,
    y: -18,
    duration: 0.28,
    ease: 'power2.in',
    onComplete: done
  })
}
</script>

<template>
  <div class="layout">
    <CustomCursor />
    <Navbar />
    <RouterView v-slot="{ Component }">
      <Transition
        :css="false"
        @before-enter="onBeforeEnter"
        @enter="onEnter"
        @leave="onLeave"
      >
        <component :is="Component" :key="route.path" />
      </Transition>
    </RouterView>
  </div>
</template>

<style scoped>
.layout {
  height: 100vh;
  overflow: hidden;
  position: relative;
  background-color: var(--bg-primary);
  cursor: none;
}
</style>
