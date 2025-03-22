import { ref, onMounted, onUnmounted, type Ref } from 'vue'

// gives a heading the "purple heavy liquid" cursor blob effect
// the blob follows the mouse with lerp so it feels viscous, not snappy
export function useLiquidText(elRef: Ref<HTMLElement | null>) {
  let blobX = -300
  let blobY = -300
  let targetX = -300
  let targetY = -300
  let active = false
  let opacity = 0
  let rafId = 0

  const blobStyle = ref({
    left:    '-300px',
    top:     '-300px',
    opacity: '0',
  })

  function onMouseMove(e: MouseEvent) {
    if (!elRef.value) return
    const rect = elRef.value.getBoundingClientRect()
    targetX = e.clientX - rect.left
    targetY = e.clientY - rect.top
    active = true
  }

  function onMouseLeave() {
    active = false
  }

  function tick() {
    rafId = requestAnimationFrame(tick)

    // 0.07 = heavy/slow lerp — feels like the blob has mass
    blobX += (targetX - blobX) * 0.07
    blobY += (targetY - blobY) * 0.07
    opacity += ((active ? 1 : 0) - opacity) * 0.06

    blobStyle.value = {
      left:    `${blobX}px`,
      top:     `${blobY}px`,
      opacity: `${opacity.toFixed(3)}`,
    }
  }

  onMounted(() => {
    if (!elRef.value) return
    elRef.value.addEventListener('mousemove', onMouseMove)
    elRef.value.addEventListener('mouseleave', onMouseLeave)
    rafId = requestAnimationFrame(tick)
  })

  onUnmounted(() => {
    cancelAnimationFrame(rafId)
    if (!elRef.value) return
    elRef.value.removeEventListener('mousemove', onMouseMove)
    elRef.value.removeEventListener('mouseleave', onMouseLeave)
  })

  return { blobStyle }
}
