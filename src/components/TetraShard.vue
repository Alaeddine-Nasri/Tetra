<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { useLoaderStore } from '@/stores/loader'

const loaderStore = useLoaderStore()
const canvasRef   = ref<HTMLCanvasElement | null>(null)
const overlayRef  = ref<HTMLCanvasElement | null>(null)

let renderer: THREE.WebGLRenderer | null = null
let rafId = 0

onMounted(() => {
  const canvas  = canvasRef.value
  const overlay = overlayRef.value
  if (!canvas || !overlay) return

  // ── 2D overlay (cross lines) ──────────────────────────────────────────
  const ctx = overlay.getContext('2d')!
  overlay.width  = window.innerWidth
  overlay.height = window.innerHeight

  // ── Three.js ──────────────────────────────────────────────────────────
  const scene  = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100)
  camera.position.set(0, 0, 6)

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 0.9
  renderer.setClearColor(0x000000, 0)

  // ── Lights ────────────────────────────────────────────────────────────
  scene.add(new THREE.AmbientLight(0x5b3a8a, 0.6))
  const dir = new THREE.DirectionalLight(0xc8b0ff, 1.8)
  dir.position.set(-3, 4, 2)
  scene.add(dir)

  // ── Phase state ───────────────────────────────────────────────────────
  type Phase = 'waiting' | 'phase1' | 'phase2' | 'phase3' | 'done'
  let phase: Phase = 'waiting'   // waits for main GLB before cross starts

  const MIN_PHASE1 = 2.0
  const DUR_PHASE2 = 0.8
  const DUR_PHASE3 = 2.2         // slower travel

  let assetsLoaded = 0
  let loadFraction = 0
  let smoothFill   = 0

  let clock     = 0
  let lastMs    = performance.now()
  let phaseStart = 0
  let doneStart  = 0
  let phase1Start = 0            // when phase1 actually began

  // ── Project world → screen ────────────────────────────────────────────
  function toScreen(wx: number, wy: number, wz: number) {
    const v = new THREE.Vector3(wx, wy, wz).project(camera)
    return {
      x: (v.x  + 1) / 2 * window.innerWidth,
      y: (-v.y + 1) / 2 * window.innerHeight,
    }
  }

  // Separate x/y radii so diamond matches actual shard silhouette
  let crossRX  = 0.75
  let crossRY  = 0.75
  let flashT   = -1      // -1 = inactive, 0→1 = explosion playing
  let flashDelay = -1    // clock time when flash was armed; -1 = not armed

  // ── Explosion particles (2D canvas) ──────────────────────────────────────
  const EXP_COUNT = 55
  type ExpParticle = { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; r: number }
  const expParticles: ExpParticle[] = []

  function spawnExplosion() {
    expParticles.length = 0
    const cx = window.innerWidth  / 2
    const cy = window.innerHeight / 2
    for (let i = 0; i < EXP_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 180 + Math.random() * 380
      expParticles.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 0.6 + Math.random() * 0.5,
        r: 1.2 + Math.random() * 2.2,
      })
    }
  }

  // ── Shard helpers ─────────────────────────────────────────────────────
  let mainShard: THREE.Object3D | null = null
  let babyShard: THREE.Object3D | null = null
  const mainMats: THREE.Material[] = []
  const babyMats: THREE.Material[] = []

  function extractMats(obj: THREE.Object3D, out: THREE.Material[]) {
    obj.traverse(child => {
      if ((child as THREE.Mesh).isMesh) {
        const m = (child as THREE.Mesh).material
        ;(Array.isArray(m) ? m : [m]).forEach(mat => out.push(mat))
      }
    })
  }

  function setOpacity(mats: THREE.Material[], val: number) {
    mats.forEach(m => { m.transparent = true; m.opacity = val })
  }

  function normalizeModel(obj: THREE.Object3D, targetSize: number) {
    const box  = new THREE.Box3().setFromObject(obj)
    const ctr  = new THREE.Vector3()
    box.getCenter(ctr)
    obj.position.sub(ctr)
    const size = new THREE.Vector3()
    box.getSize(size)
    obj.scale.setScalar(targetSize / Math.max(size.x, size.y, size.z))
  }

  const FINAL_MAIN_POS = new THREE.Vector3(1.8, 0.1, 0)
  const FINAL_MAIN_ROT = { x: 0.1, y: 0, z: 0.15 }
  const FINAL_BABY_POS = new THREE.Vector3(2.8, -0.5, -0.3)
  const FINAL_BABY_ROT = { x: -0.1, y: 0.3, z: 0.2 }

  // ── GLB loading ───────────────────────────────────────────────────────
  const gltfLoader = new GLTFLoader()

  function onProgress(e: ProgressEvent) {
    if (e.total > 0) {
      loadFraction = Math.min(0.95, assetsLoaded * 0.5 + (e.loaded / e.total) * 0.5)
    }
  }

  gltfLoader.load('/3d/Shard.glb', (gltf) => {
    mainShard = gltf.scene
    normalizeModel(mainShard, 1.6)

    // Separate x/y so the diamond silhouette matches the actual shard
    const box  = new THREE.Box3().setFromObject(mainShard)
    const size = new THREE.Vector3()
    box.getSize(size)
    crossRX = size.x / 2
    crossRY = size.y / 2

    mainShard.position.set(0, 0, 0)
    mainShard.rotation.set(0, 0, 0)
    extractMats(mainShard, mainMats)
    setOpacity(mainMats, 0)
    scene.add(mainShard)

    assetsLoaded++
    loadFraction = assetsLoaded / 2

    // Start phase1 only now — crossRX/Y are correct, no glitch
    if (phase === 'waiting') {
      phase = 'phase1'
      phase1Start = clock
    }
  }, onProgress)

  gltfLoader.load('/3d/BabyShard.glb', (gltf) => {
    babyShard = gltf.scene
    normalizeModel(babyShard, 0.6)
    babyShard.position.copy(FINAL_BABY_POS)
    babyShard.rotation.set(FINAL_BABY_ROT.x, FINAL_BABY_ROT.y, FINAL_BABY_ROT.z)
    extractMats(babyShard, babyMats)
    setOpacity(babyMats, 0)
    scene.add(babyShard)

    assetsLoaded++
    loadFraction = assetsLoaded / 2
  }, onProgress)

  // ── Particles ─────────────────────────────────────────────────────────
  const COUNT = 80
  const pAngles = new Float32Array(COUNT)
  const pRadii  = new Float32Array(COUNT)
  const pInc    = new Float32Array(COUNT)
  const pSpeed  = new Float32Array(COUNT)
  const pCX     = new Float32Array(COUNT)
  const pCY     = new Float32Array(COUNT)
  const pPos    = new Float32Array(COUNT * 3)
  const pCol    = new Float32Array(COUNT * 3)
  const colA    = new THREE.Color(0x7b2fbe)
  const colB    = new THREE.Color(0xb44fff)

  for (let i = 0; i < COUNT; i++) {
    pAngles[i] = Math.random() * Math.PI * 2
    pRadii[i]  = 0.5 + Math.random() * 0.55
    pInc[i]    = (Math.random() - 0.5) * Math.PI
    pSpeed[i]  = 0.08 + Math.random() * 0.14
    pCX[i]     = Math.random() < 0.6 ? 1.8 : 2.8
    pCY[i]     = pCX[i] < 2.0 ? 0.1 : -0.5
    const c    = colA.clone().lerp(colB, Math.random())
    pCol[i*3]  = c.r; pCol[i*3+1] = c.g; pCol[i*3+2] = c.b
  }

  const pGeo = new THREE.BufferGeometry()
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3))
  pGeo.setAttribute('color',    new THREE.BufferAttribute(pCol, 3))
  const pMat = new THREE.PointsMaterial({
    size: 0.018, vertexColors: true, transparent: true, opacity: 0,
    sizeAttenuation: true, blending: THREE.AdditiveBlending, depthWrite: false,
  })
  scene.add(new THREE.Points(pGeo, pMat))
  const posAttr = pGeo.attributes.position as THREE.BufferAttribute

  // ── Cross drawing ─────────────────────────────────────────────────────
  // fillProgress 0→1: how far each line extends from its start
  // morphT 0→1: cross (+) → diamond (◇)
  // alpha: overall canvas opacity
  function drawCross(fillProgress: number, morphT: number, alpha: number) {
    ctx.clearRect(0, 0, overlay.width, overlay.height)

    const cx = window.innerWidth  / 2
    const cy = window.innerHeight / 2

    // ── Dark background during loading ───────────────────────────────────
    if (alpha > 0.01) {
      ctx.fillStyle = `rgba(2, 3, 8, ${alpha * 0.96})`
      ctx.fillRect(0, 0, overlay.width, overlay.height)
    }

    // ── Energy explosion when shard reveals ──────────────────────────────
    if (flashT >= 0 && flashT < 1) {
      const r    = flashT * Math.max(window.innerWidth, window.innerHeight) * 0.75
      const fa   = Math.pow(1 - flashT, 1.8) * 0.7
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
      grad.addColorStop(0,   `rgba(200, 100, 255, ${fa})`)
      grad.addColorStop(0.3, `rgba(120, 60, 220, ${fa * 0.5})`)
      grad.addColorStop(1,   'rgba(0,0,0,0)')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, overlay.width, overlay.height)
    }

    // ── Explosion particles ───────────────────────────────────────────────
    for (const p of expParticles) {
      if (p.life >= p.maxLife) continue
      const a = 1 - p.life / p.maxLife
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r * a, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(${170 + Math.round(a * 50)}, ${80 + Math.round(a * 40)}, 255, ${a * 0.85})`
      ctx.shadowColor = '#a855f7'
      ctx.shadowBlur  = 8
      ctx.fill()
    }

    if (alpha <= 0.01) return

    const top    = toScreen(0,   crossRY, 0)
    const bottom = toScreen(0,  -crossRY, 0)
    const right  = toScreen( crossRX, 0, 0)
    const left   = toScreen(-crossRX, 0, 0)

    const segs = [
      { c: { x1: cx,      y1: cy,      x2: top.x,    y2: top.y    },
        d: { x1: left.x,  y1: left.y,  x2: top.x,    y2: top.y    } },
      { c: { x1: cx,      y1: cy,      x2: right.x,  y2: right.y  },
        d: { x1: top.x,   y1: top.y,   x2: right.x,  y2: right.y  } },
      { c: { x1: cx,      y1: cy,      x2: bottom.x, y2: bottom.y },
        d: { x1: right.x, y1: right.y, x2: bottom.x, y2: bottom.y } },
      { c: { x1: cx,      y1: cy,      x2: left.x,   y2: left.y   },
        d: { x1: bottom.x,y1: bottom.y,x2: left.x,   y2: left.y   } },
    ]

    ctx.save()
    ctx.globalAlpha = alpha
    ctx.lineCap = 'round'

    for (const { c, d } of segs) {
      const x1 = c.x1 + (d.x1 - c.x1) * morphT
      const y1 = c.y1 + (d.y1 - c.y1) * morphT
      const x2 = c.x2 + (d.x2 - c.x2) * morphT
      const y2 = c.y2 + (d.y2 - c.y2) * morphT
      const ex  = x1 + (x2 - x1) * fillProgress
      const ey  = y1 + (y2 - y1) * fillProgress

      // Glow halo
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(ex, ey)
      ctx.strokeStyle = 'rgba(120, 40, 210, 0.22)'
      ctx.lineWidth   = 4
      ctx.shadowColor = '#7B2FBE'
      ctx.shadowBlur  = 14
      ctx.stroke()

      // Core thread
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(ex, ey)
      ctx.strokeStyle = '#a855f7'
      ctx.lineWidth   = 0.5
      ctx.shadowBlur  = 6
      ctx.stroke()

      // Bright centre spark
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(ex, ey)
      ctx.strokeStyle = 'rgba(230, 195, 255, 0.45)'
      ctx.lineWidth   = 0.2
      ctx.shadowBlur  = 0
      ctx.stroke()
    }

    // Tip dots when lines are full
    if (fillProgress > 0.97 && morphT < 0.25) {
      ctx.shadowColor = '#a855f7'
      ctx.shadowBlur  = 12
      ctx.fillStyle   = 'rgba(180, 120, 255, 0.85)'
      for (const pt of [top, bottom, left, right]) {
        ctx.beginPath()
        ctx.arc(pt.x, pt.y, 1.8, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // ── "LOADING" label ───────────────────────────────────────────────────
    if (morphT < 0.05) {
      const pulse = 0.45 + 0.55 * Math.sin(clock * 2.5)
      ctx.globalAlpha = alpha * pulse
      ctx.font        = '400 9px "DM Sans", sans-serif'
      ctx.letterSpacing = '0.3em'
      ctx.fillStyle   = 'rgba(170, 110, 255, 0.65)'
      ctx.shadowColor = '#a855f7'
      ctx.shadowBlur  = 10
      ctx.textAlign   = 'center'
      ctx.fillText('LOADING', cx, bottom.y + 30)
    }

    ctx.restore()
  }

  // ── Mouse ─────────────────────────────────────────────────────────────
  let rawMX = 0, rawMY = 0, smMX = 0, smMY = 0
  const mouseNDC = new THREE.Vector2(9999, 9999)

  const onMove = (e: MouseEvent) => {
    rawMX =  (e.clientX / window.innerWidth  - 0.5) * 2
    rawMY = -(e.clientY / window.innerHeight - 0.5) * 2
    mouseNDC.set((e.clientX / window.innerWidth) * 2 - 1,
                 -(e.clientY / window.innerHeight) * 2 + 1)
  }
  window.addEventListener('mousemove', onMove)

  // ── Click to skip ─────────────────────────────────────────────────────
  function skipToEnd() {
    if (phase === 'done') return
    phase = 'done'
    ctx.clearRect(0, 0, overlay.width, overlay.height)
    if (mainShard) {
      mainShard.position.copy(FINAL_MAIN_POS)
      mainShard.rotation.set(FINAL_MAIN_ROT.x, FINAL_MAIN_ROT.y, FINAL_MAIN_ROT.z)
      setOpacity(mainMats, 1)
    }
    if (babyShard) setOpacity(babyMats, 1)
    pMat.opacity = 0.7
    doneStart = clock
    window.removeEventListener('click', skipToEnd)
    loaderStore.complete()
  }
  window.addEventListener('click', skipToEnd)

  // ── Resize ────────────────────────────────────────────────────────────
  const onResize = () => {
    if (!renderer) return
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    overlay.width  = window.innerWidth
    overlay.height = window.innerHeight
  }
  window.addEventListener('resize', onResize)

  // ── Continuous rotation accumulators ─────────────────────────────────
  let mainRotY = 0
  let babyRotY = FINAL_BABY_ROT.y

  const MAIN_PERIOD = 18
  const BABY_PERIOD = 16
  const FLOAT_AMP   = 0.03
  const FLOAT_CYCLE = 4
  const MAX_TILT    = Math.PI / 36

  // ── RAF ───────────────────────────────────────────────────────────────
  const tick = () => {
    rafId = requestAnimationFrame(tick)

    const now   = performance.now()
    const delta = (now - lastMs) / 1000
    lastMs = now
    clock += delta

    smMX += (rawMX - smMX) * 0.06
    smMY += (rawMY - smMY) * 0.06

    // Arm → delay → fire explosion
    if (flashDelay >= 0 && flashT < 0 && clock - flashDelay >= 0.5) {
      flashT = 0
      spawnExplosion()
    }
    if (flashT >= 0) {
      flashT = Math.min(1, flashT + delta / 0.9)
      // Advance explosion particles
      for (const p of expParticles) {
        if (p.life >= p.maxLife) continue
        p.life += delta
        const drag = 1 - p.life / p.maxLife * 0.85
        p.x += p.vx * delta * drag
        p.y += p.vy * delta * drag
      }
    }

    const tiltX = smMY * MAX_TILT
    const tiltZ = -smMX * MAX_TILT * 0.4

    // ── Waiting: GLB not yet loaded ───────────────────────────────────
    if (phase === 'waiting') {
      // Show a pulsing center dot while waiting
      ctx.clearRect(0, 0, overlay.width, overlay.height)
      ctx.fillStyle = `rgba(4, 5, 12, 0.82)`
      ctx.fillRect(0, 0, overlay.width, overlay.height)
      const pulse = 0.4 + 0.6 * Math.sin(clock * 3)
      ctx.beginPath()
      ctx.arc(window.innerWidth / 2, window.innerHeight / 2, 3, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(168, 85, 247, ${pulse})`
      ctx.shadowColor = '#a855f7'
      ctx.shadowBlur  = 16
      ctx.fill()
    }

    // ── Phase 1: cross fills ──────────────────────────────────────────
    else if (phase === 'phase1') {
      const allLoaded  = assetsLoaded >= 2
      const elapsed    = clock - phase1Start
      const timeT      = elapsed / MIN_PHASE1

      let target: number
      if (!allLoaded) {
        target = Math.min(loadFraction * 0.88, timeT * 0.88)
      } else {
        target = Math.min(1.0, timeT)
      }

      smoothFill += (target - smoothFill) * 0.05
      drawCross(smoothFill, 0, 1)

      if (smoothFill >= 0.98 && allLoaded && elapsed >= MIN_PHASE1 - 0.05) {
        phase = 'phase2'
        phaseStart = clock
        flashDelay = clock   // explosion fires 0.5s from now
        if (mainShard) setOpacity(mainMats, 0.001)
      }
    }

    // ── Phase 2: cross morphs → diamond, shard fades in ──────────────
    else if (phase === 'phase2') {
      const t     = Math.min(1, (clock - phaseStart) / DUR_PHASE2)
      const eased = t < 0.5 ? 2*t*t : -1 + (4 - 2*t) * t

      // Cross fades fully out during last 0.5s of phase2
      const fadeStart = Math.max(0, DUR_PHASE2 - 0.5)
      const crossAlpha = (clock - phaseStart) < fadeStart
        ? 1 - eased * 0.3
        : Math.max(0, 1 - ((clock - phaseStart - fadeStart) / 0.5))
      drawCross(1, eased, crossAlpha)
      if (mainShard) setOpacity(mainMats, eased * 0.9)

      if (t >= 1) {
        phase = 'phase3'
        phaseStart = clock
      }
    }

    // ── Phase 3: shard moves to final position ────────────────────────
    else if (phase === 'phase3') {
      const t     = Math.min(1, (clock - phaseStart) / DUR_PHASE3)
      const eased = 1 - Math.pow(1 - t, 3)

      // Cross is already gone — just keep drawing explosion particles
      drawCross(1, 1, 0)

      if (mainShard) {
        mainShard.position.lerpVectors(new THREE.Vector3(0, 0, 0), FINAL_MAIN_POS, eased)
        mainShard.rotation.x = FINAL_MAIN_ROT.x * eased
        mainShard.rotation.y = Math.PI * 0.6 * eased   // rotates in as it travels
        mainShard.rotation.z = FINAL_MAIN_ROT.z * eased
        setOpacity(mainMats, 1)
      }

      const babyT = Math.max(0, (t - 0.55) / 0.45)
      if (babyShard) setOpacity(babyMats, babyT)
      pMat.opacity = babyT * 0.7

      if (pMat.opacity > 0) {
        for (let i = 0; i < COUNT; i++) {
          pAngles[i] += pSpeed[i] * delta
          const r = pRadii[i], a = pAngles[i], inc = pInc[i]
          const zRaw = r * Math.sin(a)
          posAttr.setXYZ(i, pCX[i] + r * Math.cos(a), pCY[i] + zRaw * Math.sin(inc), zRaw * Math.cos(inc))
        }
        posAttr.needsUpdate = true
      }

      if (t >= 1) {
        phase = 'done'
        doneStart = clock
        mainRotY  = mainShard?.rotation.y ?? 0
        babyRotY  = FINAL_BABY_ROT.y
        ctx.clearRect(0, 0, overlay.width, overlay.height)
        window.removeEventListener('click', skipToEnd)
        loaderStore.complete()
      }
    }

    // ── Done: normal scene loop ───────────────────────────────────────
    else {
      mainRotY += delta * (Math.PI * 2 / MAIN_PERIOD)
      babyRotY -= delta * (Math.PI * 2 / BABY_PERIOD)

      const floatT = (clock - doneStart) / FLOAT_CYCLE * Math.PI * 2

      if (mainShard) {
        mainShard.rotation.x = FINAL_MAIN_ROT.x + tiltX
        mainShard.rotation.y = mainRotY
        mainShard.rotation.z = FINAL_MAIN_ROT.z + tiltZ
        mainShard.position.y = FINAL_MAIN_POS.y + Math.sin(floatT) * FLOAT_AMP
      }

      if (babyShard) {
        babyShard.rotation.x = FINAL_BABY_ROT.x + tiltX * 0.7
        babyShard.rotation.y = babyRotY
        babyShard.rotation.z = FINAL_BABY_ROT.z + tiltZ * 0.7
        babyShard.position.y = FINAL_BABY_POS.y + Math.sin(floatT + Math.PI) * FLOAT_AMP * 0.8
      }

      // Particles
      for (let i = 0; i < COUNT; i++) {
        pAngles[i] += pSpeed[i] * delta
        const r = pRadii[i], a = pAngles[i], inc = pInc[i]
        const zRaw = r * Math.sin(a)
        let x = pCX[i] + r * Math.cos(a)
        let y = pCY[i] + zRaw * Math.sin(inc)
        const z = zRaw * Math.cos(inc)

        // Cursor repulsion
        const dx = x - mouseNDC.x * 3
        const dy = y - mouseNDC.y * 3
        const d  = Math.sqrt(dx*dx + dy*dy)
        if (d < 1.5 && d > 0.001) {
          const f = (1 - d / 1.5) * 0.3
          x += (dx / d) * f
          y += (dy / d) * f
        }
        posAttr.setXYZ(i, x, y, z)
      }
      posAttr.needsUpdate = true
    }

    renderer!.render(scene, camera)
  }
  tick()

  ;(canvas as any)._cleanup = () => {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('resize', onResize)
    window.removeEventListener('click', skipToEnd)
  }
})

onUnmounted(() => {
  cancelAnimationFrame(rafId)
  if (canvasRef.value) (canvasRef.value as any)._cleanup?.()
  renderer?.dispose()
  renderer = null
})
</script>

<template>
  <canvas ref="canvasRef" class="shard-canvas" />
  <canvas ref="overlayRef" class="loader-canvas" />
</template>

<style scoped>
.shard-canvas {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 0;
  background: transparent;
}

.loader-canvas {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 2;
  background: transparent;
}
</style>
