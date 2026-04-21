import { defineStore } from 'pinia'
import { ref } from 'vue'

export type Locale = 'fr' | 'en'

export const useLanguageStore = defineStore('language', () => {
  const locale = ref<Locale>('en')

  function toggle() {
    locale.value = locale.value === 'fr' ? 'en' : 'fr'
  }

  function set(lang: Locale) {
    locale.value = lang
  }

  return { locale, toggle, set }
})
