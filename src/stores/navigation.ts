import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useNavigationStore = defineStore('navigation', () => {
  // Current active card index in Work section
  const workCardIndex = ref(0)

  // Actual screen x-coordinates (px) of each card's dot when that card is snapped.
  // Populated by WorkView after layout is measured. TravelingShape uses these
  // directly instead of a mathematical formula so positions are always accurate.
  const workDotPositions = ref<number[]>([])

  // Currently open accordion row key in About (null = all closed)
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
