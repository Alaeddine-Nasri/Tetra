<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import gsap from 'gsap'
import { useContent } from '@/composables/useContent'

const { content, t } = useContent()

const emailRef   = ref<HTMLElement | null>(null)
const socialsRef = ref<HTMLElement | null>(null)

// Split headline into individual word spans for the stagger reveal
const words = computed(() => t(content.contact.headline).split(' '))

onMounted(() => {
  const tl = gsap.timeline()

  // Words rise and fade in one by one
  tl.from('.contact-word', {
    opacity: 0,
    y: 14,
    duration: 0.65,
    ease: 'power3.out',
    stagger: 0.13
  })

  // Email slides up after the last word lands
  .from(emailRef.value, {
    opacity: 0,
    y: 16,
    duration: 0.55,
    ease: 'power2.out'
  }, '-=0.2')

  // Social icons stagger in last
  .from(socialsRef.value!.children, {
    opacity: 0,
    y: 8,
    duration: 0.4,
    ease: 'power2.out',
    stagger: 0.1
  }, '-=0.15')
})
</script>

<template>
  <main class="contact-view">

    <!-- Ambient glow behind the headline -->
    <div class="ambient" />

    <div class="contact-inner">

      <!-- Cinematic headline — word by word -->
      <h1 class="headline" :aria-label="t(content.contact.headline)">
        <span
          v-for="(word, i) in words"
          :key="i"
          class="contact-word"
        >{{ word }}<template v-if="i < words.length - 1">&nbsp;</template></span>
      </h1>

      <!-- Email -->
      <a
        ref="emailRef"
        :href="`mailto:${content.contact.email}`"
        class="email-link"
      >
        {{ content.contact.email }}
        <span class="email-underline" />
      </a>

      <!-- Social links with inline SVGs -->
      <div ref="socialsRef" class="socials">

        <a
          :href="content.contact.links[0].url"
          target="_blank"
          rel="noopener noreferrer"
          class="social-link"
          :aria-label="content.contact.links[0].label"
        >
          <!-- GitHub mark -->
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
          </svg>
          <span class="social-label">{{ content.contact.links[0].label }}</span>
        </a>

        <a
          :href="content.contact.links[1].url"
          target="_blank"
          rel="noopener noreferrer"
          class="social-link"
          :aria-label="content.contact.links[1].label"
        >
          <!-- LinkedIn mark -->
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
          <span class="social-label">{{ content.contact.links[1].label }}</span>
        </a>

      </div>
    </div>
  </main>
</template>

<style scoped>
.contact-view {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: none;
}

/* Barely perceptible glow behind the text — more felt than seen */
.ambient {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse 60% 50% at 50% 48%, rgba(75, 63, 138, 0.09) 0%, transparent 70%);
}

.contact-inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3rem;
  text-align: center;
  width: 90%;
  max-width: 820px;
}

/* ── headline ───────────────────────────────────────────── */
.headline {
  font-family: 'Syne', sans-serif;
  font-weight: 700;
  font-size: clamp(2.4rem, 5.5vw, 5.2rem);
  line-height: 1.12;
  color: var(--ink);
  /* inline-flex so words wrap naturally */
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  column-gap: 0;
  row-gap: 0.1em;
}

/* each word is its own animatable node */
.contact-word {
  display: inline-block;
  white-space: pre;
}

/* ── email ──────────────────────────────────────────────── */
.email-link {
  position: relative;
  display: inline-block;
  font-family: 'Syne', sans-serif;
  font-weight: 400;
  font-size: clamp(1rem, 2vw, 1.55rem);
  letter-spacing: 0.02em;
  color: rgba(245, 244, 242, 0.75);
  padding-bottom: 0.3rem;
}

/* animated underline glow on hover */
.email-link::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 100%;
  height: 1px;
  background: var(--accent-light);
  box-shadow: 0 0 8px rgba(107, 95, 186, 0.7);
  transition: right 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}

.email-link:hover {
  color: var(--ink);
}

.email-link:hover::after {
  right: 0;
}

/* ── socials ────────────────────────────────────────────── */
.socials {
  display: flex;
  align-items: center;
  gap: 2.5rem;
}

.social-link {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  color: rgba(245, 244, 242, 0.28);
  transition: color 0.25s ease;
  font-family: 'DM Sans', sans-serif;
  font-weight: 200;
  font-size: 0.72rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.social-link:hover {
  color: rgba(107, 95, 186, 0.85);
}

.social-label {
  /* hide text visually but keep it for screen readers */
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* focus rings for keyboard nav */
.email-link:focus-visible,
.social-link:focus-visible {
  outline: 1px solid var(--accent-light);
  outline-offset: 4px;
  border-radius: 2px;
}
</style>
