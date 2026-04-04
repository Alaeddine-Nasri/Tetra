<script setup lang="ts">
import { useContent } from '@/composables/useContent'

const { content, lang } = useContent()
</script>

<template>
  <nav class="navbar">
    <RouterLink to="/" class="logo" data-nav-item>
      {{ content.nav.logo }}
    </RouterLink>

    <div class="nav-right">
      <RouterLink
        v-for="link in content.nav.links"
        :key="link.key"
        :to="link.path"
        class="nav-link"
        active-class="active"
        data-nav-item
      >
        {{ link.label[lang.locale] }}
      </RouterLink>

      <button class="lang-btn" data-nav-item @click="lang.toggle()">
        {{ lang.locale === 'fr' ? 'EN' : 'FR' }}
      </button>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2rem 5%;
  pointer-events: none;
}

.logo {
  font-family: 'Syne', sans-serif;
  font-weight: 400;
  font-size: 0.82rem;
  letter-spacing: 0.06em;
  color: rgba(245, 244, 242, 0.5);
  pointer-events: all;
  transition: color 0.25s ease;
}

.logo:hover { color: var(--ink); }

.nav-right {
  display: flex;
  align-items: center;
  gap: 2.5rem;
  pointer-events: all;
}

.nav-link {
  font-family: 'DM Sans', sans-serif;
  font-weight: 200;
  font-size: 0.72rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(245, 244, 242, 0.45);
  transition: color 0.25s ease;
}

.nav-link:hover  { color: rgba(245, 244, 242, 0.8); }
.nav-link.active { color: var(--accent-light); }

.lang-btn {
  font-family: 'DM Sans', sans-serif;
  font-weight: 200;
  font-size: 0.72rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(245, 244, 242, 0.28);
  background: none;
  border: none;
  cursor: none;
  padding: 0;
  transition: color 0.25s ease;
}

.lang-btn:hover { color: rgba(245, 244, 242, 0.6); }
</style>
