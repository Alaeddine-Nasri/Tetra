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
    setTimeout(() => { visible.value = true }, 80)
  }
}, { flush: 'sync' })
</script>

<template>
  <div class="layout">
    <CustomCursor />
    <Navbar />
    <div class="content-wrap" :class="{ 'content-wrap--hidden': !visible }">
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
  transition: opacity 0.35s ease;
}

.content-wrap--hidden {
  opacity: 0;
  transition: opacity 0.15s ease;
}
</style>
