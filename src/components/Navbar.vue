<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useContent } from '@/composables/useContent'
import { useSpaceNav, SECTIONS } from '@/stores/spaceNav'

const { content, lang } = useContent()
const router   = useRouter()
const route    = useRoute()
const spaceNav = useSpaceNav()

const activeKey = computed(() => SECTIONS[spaceNav.currentIndex]?.key ?? 'home')

function fly(idx: number, path: string) {
  if (spaceNav.currentIndex === idx && !spaceNav.isFlying) return
  spaceNav.navigateTo(idx)
  setTimeout(() => router.push(path), 300)
  //console.log('',idx,'path',path)
}

function onLogoClick(e: MouseEvent) {
  e.preventDefault()
  fly(0, '/')
}

function onLinkClick(e: MouseEvent, path: string) {
  e.preventDefault()
  const idx = SECTIONS.findIndex(s => s.path === path)
  if (idx >= 0) fly(idx, path)
}

// Keep section index in sync when navigating via URL bar / back-forward
watch(() => route.path, (p) => {
  const idx = spaceNav.indexForPath(p)
  if (idx !== spaceNav.currentIndex) spaceNav.navigateTo(idx)
}, { immediate: true })
</script>

<template>
  <!--Navbar componet-->
  <nav class="navbar">
    <a href="/" class="logo" data-nav-item @click="onLogoClick">
      {{ content.nav.logo }}
    </a>

    <div class="nav-right">
      <a
        v-for="link in content.nav.links"
        :key="link.key"
        :href="link.path"
        class="nav-link"
        :class="{ active: activeKey === link.key }"
        data-nav-item
        @click="onLinkClick($event, link.path)"
      >
        {{ link.label[lang.locale] }}
      </a>

      <button class="lang-btn" data-nav-item @click="lang.toggle()">
        {{ lang.locale === 'fr' ? 'EN' : 'FR' }}
      </button>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.6rem 5%;
  pointer-events: none;
}

.logo {
  font-family: 'Syne', sans-serif;
  font-weight: 400;
  font-size: 0.82rem;
  letter-spacing: 0.06em;
  color: rgba(245, 244, 242, 0.6);
  pointer-events: all;
  transition: color 0.25s ease;
  text-decoration: none;
}
.logo:hover { color: var(--ink); }

.nav-right {
  display: flex;
  align-items: center;
  gap: 2.5rem;
  pointer-events: all;
}
/* Nav links and language toggle share similar styles, so we can define them together */
.nav-link {
  font-family: 'DM Sans', sans-serif;
  font-weight: 200;
  font-size: 0.72rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(245, 244, 242, 0.45);
  transition: color 0.25s ease;
  text-decoration: none;
  cursor: none;
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
