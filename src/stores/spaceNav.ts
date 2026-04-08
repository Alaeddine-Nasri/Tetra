import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface SectionDef {
  key:         string
  path:        string
  cameraPos:   [number, number, number]
  lookAt:      [number, number, number]
  platformPos: [number, number, number]  // used for proximity lighting
  shardWorld:  [number, number, number]
  babyWorld:   [number, number, number]
  shardScale:  number
  rotPeriod:   number
}

export const SECTIONS: SectionDef[] = [
  {
    key: 'home',    path: '/',
    cameraPos:   [  0,   0,    6 ],
    lookAt:      [  0,   0,   -2 ],
    platformPos: [  0,  -2,   -6 ],
    shardWorld:  [  0.0,  0.6,  -5   ],  babyWorld: [  3.2,  -0.2,  -4.5 ],
    shardScale: 1.0, rotPeriod: 18,
  },
  {
    key: 'work',    path: '/work',
    cameraPos:   [-17,  -5,  -34 ],
    lookAt:      [-17,  -7.2,  -46 ],
    platformPos: [-17,  -9,  -44 ],
    shardWorld:  [-21,   -4,  -50 ],  babyWorld: [-17,  -5,  -44 ],
    shardScale: 0.65, rotPeriod: 24,
  },
  {
    key: 'about',   path: '/about',
    cameraPos:   [ 3,   5.5,  -76.5 ],
    lookAt:      [ 7,   5,  -86 ],
    platformPos: [  8,   3,  -87 ],
    shardWorld:  [  12,   4.8,  -87 ],  babyWorld: [ 12,   6,  -84.2 ],
    shardScale: 0.95, rotPeriod: 22,
  },
  {
    key: 'contact', path: '/contact',
    cameraPos:   [ -4,   4, -114.5 ],
    lookAt:      [ -2.5,   2, -144 ],
    platformPos: [ -2,  -1, -130 ],
    shardWorld:  [ 0.5,   7.5, -130 ],  babyWorld: [  0,   2, -122 ],
    shardScale: 1.3,  rotPeriod: 30,
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
