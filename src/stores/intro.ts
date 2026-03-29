import { defineStore } from 'pinia'
import { ref } from 'vue'

const STORAGE_KEY = 'tetra_intro_played'

export const useIntroStore = defineStore('intro', () => {
  // Persist across refreshes so the nav never gets hidden on reload
  const played = ref(localStorage.getItem(STORAGE_KEY) === '1')

  function markPlayed() {
    played.value = true
    localStorage.setItem(STORAGE_KEY, '1')
  }

  return { played, markPlayed }
})
