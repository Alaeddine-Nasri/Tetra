<script setup lang="ts">
import Navbar from './Navbar.vue'
import CustomCursor from './CustomCursor.vue'
import { useMeta } from '@/composables/useMeta'

useMeta()
</script>

<template>
  <div class="layout">
    <CustomCursor />
    <Navbar />
    <RouterView />
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
</style>
