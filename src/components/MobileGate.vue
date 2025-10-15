<script setup lang="ts">
import { useContent } from '@/composables/useContent'

const { content } = useContent()
</script>

<template>
  <div class="gate">
    <div class="inner">
      <p class="msg">{{ content.mobile.fr }}</p>
      <span class="pulse-line" />
      <p class="msg faint">{{ content.mobile.en }}</p>
    </div>
  </div>
</template>

<style scoped>
.gate {
  height: 100vh;
  width: 100vw;
  background-color: var(--bg-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.8rem;
  text-align: center;
}

.msg {
  font-family: 'DM Sans', sans-serif;
  font-weight: 200;
  font-size: 0.85rem;
  letter-spacing: 0.08em;
  color: rgba(245, 244, 242, 0.55);
  max-width: 280px;
  line-height: 1.7;
}

.msg.faint {
  color: rgba(245, 244, 242, 0.28);
}

.pulse-line {
  display: block;
  width: 1px;
  height: 48px;
  background: linear-gradient(to bottom, transparent, var(--accent-light), transparent);
}
</style>
