<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import gsap from 'gsap'

const dotRef = ref<HTMLElement | null>(null)
const ringRef = ref<HTMLElement | null>(null)

onMounted(() => {
  const dot = dotRef.value
  const ring = ringRef.value
  if (!dot || !ring) return

  // dot follows instantly, ring trails behind
  const moveX = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3' })
  const moveY = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3' })
  const trailX = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' })
  const trailY = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' })

  let revealed = false

  function onMove(e: MouseEvent) {
    moveX(e.clientX)
    moveY(e.clientY)
    trailX(e.clientX)
    trailY(e.clientY)

    if (!revealed) {
      gsap.to([dot, ring], { opacity: 1, duration: 0.4 })
      revealed = true
    }
  }

  function onOver(e: MouseEvent) {
    if ((e.target as Element).closest('a, button')) {
      gsap.to(ring, { scale: 2, opacity: 0.35, duration: 0.35, ease: 'power2.out' })
      gsap.to(dot, { scale: 0.4, duration: 0.25, ease: 'power2.out' })
    }
  }

  function onOut(e: MouseEvent) {
    if ((e.target as Element).closest('a, button')) {
      gsap.to(ring, { scale: 1, opacity: 1, duration: 0.35, ease: 'power2.out' })
      gsap.to(dot, { scale: 1, duration: 0.25, ease: 'power2.out' })
    }
  }

  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseover', onOver)
  window.addEventListener('mouseout', onOut)

  onUnmounted(() => {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseover', onOver)
    window.removeEventListener('mouseout', onOut)
  })
})
</script>

<template>
  <div aria-hidden="true">
    <div ref="dotRef" class="cursor-dot" />
    <div ref="ringRef" class="cursor-ring" />
  </div>
</template>

<style scoped>
.cursor-dot {
  position: fixed;
  top: -3px;
  left: -3px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent-light);
  pointer-events: none;
  z-index: 9998;
  opacity: 0;
}

.cursor-ring {
  position: fixed;
  top: -13px;
  left: -13px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 1px solid rgba(107, 95, 186, 0.55);
  pointer-events: none;
  z-index: 9997;
  opacity: 0;
}
</style>
