<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import MobileGate from '@/components/MobileGate.vue'

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
  <AppLayout v-else />
</template>
