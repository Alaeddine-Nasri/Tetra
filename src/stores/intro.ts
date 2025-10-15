import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useIntroStore = defineStore('intro', () => {
  const played = ref(false)

  function markPlayed() {
    played.value = true
  }

  return { played, markPlayed }
})
