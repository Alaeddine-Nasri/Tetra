<script setup lang="ts">
import Navbar from './Navbar.vue'
import CustomCursor from './CustomCursor.vue'
import { useMeta } from '@/composables/useMeta'
import { ref, watch } from 'vue'
import { useSpaceNav } from '@/stores/spaceNav'

useMeta()

const spaceNav = useSpaceNav()
const visible  = ref(true)

watch(() => spaceNav.isFlying, (flying) => {
  if (flying) {
    visible.value = false
  } else {
    // tiny delay before fade-in so the new view has a frame to render first
    setTimeout(() => { visible.value = true }, 80)
  }
}, { flush: 'sync' })
</script>

<template>
  <div class="layout">
    <CustomCursor />
    <Navbar />
    <div class="content-wrap" :style="{ opacity: visible ? 1 : 0, transition: visible ? 'opacity 0.35s ease' : 'none' }">
      <RouterView />
    </div>
  </div>
</template>

<style scoped>
.layout {
  height: 100vh;
  overflow: hidden;
  position: relative;
  background-color: transparent;
  cursor: none;
}

.content-wrap {
  opacity: 1;
}
</style>
