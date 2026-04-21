import { defineStore } from 'pinia'
import { ref } from 'vue'

// just a flag — set to true once the 3d intro finishes
export const useLoaderStore = defineStore('loader', () => {
  const done = ref(false)
  function complete() { done.value = true }
  return { done, complete }
})
