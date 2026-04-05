<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import MobileGate from '@/components/MobileGate.vue'
import TetraShard from '@/components/TetraShard.vue'
import { useLoaderStore } from '@/stores/loader'

const loaderStore = useLoaderStore()
const isMobile = ref(false)

function checkViewport() {
  isMobile.value = window.innerWidth < 1024
}

onMounted(() => {
  checkViewport()
  window.addEventListener('resize', checkViewport)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkViewport)
})
</script>

<template>
  <MobileGate v-if="isMobile" />
  <template v-else>
    <TetraShard />
    <!-- Global veil hides all page content until loader completes -->
    <div class="global-veil" :class="{ 'global-veil--hidden': loaderStore.done }" />
    <AppLayout />
  </template>
</template>

<style scoped>
.global-veil {
  position: fixed;
  inset: 0;
  z-index: 10;
  background: transparent;
  pointer-events: none;
  transition: none;
}

/* Blocks mouse on other pages while loading, then fades out */
.global-veil:not(.global-veil--hidden) {
  pointer-events: all;
}

.global-veil--hidden {
  animation: veil-fade 0.5s ease forwards;
}

@keyframes veil-fade {
  from { opacity: 1; }
  to   { opacity: 0; pointer-events: none; }
}
</style>
