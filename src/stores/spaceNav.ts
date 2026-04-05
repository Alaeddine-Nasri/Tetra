import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface SectionDef {
  key:        string
  path:       string
  cameraZ:    number
  sectionZ:   number
  shardLocal: [number, number, number]
  babyLocal:  [number, number, number]
  shardScale: number
  rotPeriod:  number
}

export const SECTIONS: SectionDef[] = [
  {
    key: 'home', path: '/',
    cameraZ:  6,   sectionZ:    0,
    shardLocal: [ 1.8,  0.1, 0], babyLocal: [ 2.8, -0.5, 0],
    shardScale: 1.0, rotPeriod: 18,
  },
  {
    // Work: main shard smaller, sits below the "Projects" headline (low Y)
    // baby shard above the first project card dot (upper right)
    key: 'work', path: '/work',
    cameraZ: -74,  sectionZ:  -80,
    shardLocal: [ 1.2, -1.4, 0], babyLocal: [ 2.4,  1.4, 0],
    shardScale: 0.65, rotPeriod: 24,
  },
  {
    // About: shard on the left, companion on the far left
    key: 'about', path: '/about',
    cameraZ: -154, sectionZ: -160,
    shardLocal: [-1.6, 0.2, 0], babyLocal: [-2.8, -0.5, 0],
    shardScale: 0.85, rotPeriod: 22,
  },
  {
    // Contact: centered, large, dramatic — keep original position
    key: 'contact', path: '/contact',
    cameraZ: -234, sectionZ: -240,
    shardLocal: [ 0.0, -0.3, 0], babyLocal: [ 0.9,  0.7, 0],
    shardScale: 1.3, rotPeriod: 30,
  },
]

export const useSpaceNav = defineStore('spaceNav', () => {
  const currentIndex = ref(0)
  const isFlying     = ref(false)

  function indexForPath(path: string) {
    return Math.max(0, SECTIONS.findIndex(s => s.path === path))
  }

  function navigateTo(index: number) {
    currentIndex.value = Math.max(0, Math.min(SECTIONS.length - 1, index))
    isFlying.value = true
  }

  function onArrived() {
    isFlying.value = false
  }

  return { currentIndex, isFlying, navigateTo, onArrived, indexForPath }
})
