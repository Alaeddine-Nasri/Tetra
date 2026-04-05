import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useLoaderStore = defineStore('loader', () => {
  const done = ref(false)
  function complete() { done.value = true }
  return { done, complete }
})
