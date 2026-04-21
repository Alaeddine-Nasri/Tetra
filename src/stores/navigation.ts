import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useNavigationStore = defineStore('navigation', () => {
  const workCardIndex = ref(0)

  // x positions of the nav dots — WorkView fills these after measuring the DOM
  // TravelingShape reads from here so it always stays pixel-accurate
  const workDotPositions = ref<number[]>([])

  const activeAboutRow = ref<string | null>(null)

  function setWorkCard(idx: number, dotPositions: number[]) {
    workCardIndex.value    = idx
    workDotPositions.value = dotPositions
  }

  function setActiveAboutRow(key: string | null) {
    activeAboutRow.value = key
  }

  return { workCardIndex, workDotPositions, activeAboutRow, setWorkCard, setActiveAboutRow }
})
