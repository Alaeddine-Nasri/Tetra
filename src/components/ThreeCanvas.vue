<script setup lang="ts">
import { ref } from 'vue'
import { useThree } from '@/composables/useThree'

const canvasRef = ref<HTMLCanvasElement | null>(null)

const { scene, camera } = useThree(canvasRef)

// scene and camera are exposed so future steps can add geometry
defineExpose({ scene, camera })
</script>

<template>
  <canvas ref="canvasRef" class="three-canvas" />
</template>

<style scoped>
.three-canvas {
  position: absolute;
  inset: 0;
  z-index: 0;
  display: block;
  width: 100%;
  height: 100%;
}
</style>
