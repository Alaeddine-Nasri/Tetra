<script setup lang="ts">
// Replaced by LandingView.vue — keeping this file to avoid breaking imports
import { useContent } from '@/composables/useContent'

const { content, t } = useContent()
</script>

<template>
  <main class="view">
    <div class="container">
      <h1>{{ content.home.name }}</h1>
      <p>{{ t(content.home.title) }}</p>
    </div>
  </main>
</template>

<style scoped>
.view { height: 100vh; display: flex; align-items: center; }
.container { width: 90%; margin: 0 auto; }
h1 { font-family: 'Syne', sans-serif; font-size: 4rem; color: var(--ink); }
p { color: var(--ink-muted); margin-top: 1rem; }
</style>
