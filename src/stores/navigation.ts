import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useNavigationStore = defineStore('navigation', () => {
  const workCardIndex = ref(0)

  // Screen x-coords (px) of each card's dot — populated by WorkView after layout is measured.
  // TravelingShape reads these directly so positions are always pixel-accurate.
  const workDotPositions = ref<number[]>([])

  const activeAboutRow = ref<string | null>(null)

  function setWorkCard(idx: number, dotPositions: number[]) {
    workCardIndex.value   = idx
    workDotPositions.value = dotPositions
  }

  function setActiveAboutRow(key: string | null) {
    activeAboutRow.value = key
  }

  return { workCardIndex, workDotPositions, activeAboutRow, setWorkCard, setActiveAboutRow }
})
