import { onMounted, onUnmounted, type Ref } from 'vue'
import * as THREE from 'three'

export function useThree(canvasRef: Ref<HTMLCanvasElement | null>) {
  let renderer: THREE.WebGLRenderer | null = null
  let rafId = 0

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100)
  camera.position.z = 5

  function onResize() {
    if (!renderer) return
    const w = window.innerWidth
    const h = window.innerHeight
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
  }

  function tick() {
    rafId = requestAnimationFrame(tick)
    renderer?.render(scene, camera)
  }

  onMounted(() => {
    if (!canvasRef.value) return

    renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.value,
      antialias: false,
      powerPreference: 'low-power'
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x07080f)

    onResize()
    window.addEventListener('resize', onResize)
    tick()
  })

  onUnmounted(() => {
    cancelAnimationFrame(rafId)
    window.removeEventListener('resize', onResize)
    renderer?.dispose()
    renderer = null
  })

  return { scene, camera }
}
