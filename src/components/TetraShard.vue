<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { useLoaderStore } from '@/stores/loader'
import { useSpaceNav, SECTIONS } from '@/stores/spaceNav'
import { useRouter } from 'vue-router'

const loaderStore = useLoaderStore()
const spaceNav    = useSpaceNav()
const router      = useRouter()
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
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 600)
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

  // ── Space environment ─────────────────────────────────────────────────

  // Shared star vertex shader — per-vertex size + brightness
  const starVS = `
    attribute float aSize;
    attribute float aBright;
    varying float vBright;
    void main() {
      vBright = aBright;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = aSize * (120.0 / -mv.z);
      gl_Position  = projectionMatrix * mv;
    }
  `
  const starFS = `
    varying float vBright;
    void main() {
      vec2  c = gl_PointCoord - 0.5;
      float d = length(c);
      if (d > 0.5) discard;
      // Sharp pinpoint core + soft halo
      float core = pow(max(0.0, 1.0 - d * 2.6), 3.5);
      float halo = smoothstep(0.5, 0.0, d) * 0.18;
      float a = (core + halo) * vBright;
      // Slight blue-white tint variation
      vec3 col = mix(vec3(0.75, 0.82, 1.0), vec3(1.0, 0.97, 0.92), vBright * 0.6);
      gl_FragColor = vec4(col, a);
    }
  `
  const heroFS = `
    varying float vBright;
    void main() {
      vec2  c = gl_PointCoord - 0.5;
      float d = length(c);
      if (d > 0.5) discard;
      // Pinpoint core
      float core = pow(max(0.0, 1.0 - d * 2.2), 4.0);
      // Soft glow
      float glow = pow(max(0.0, 1.0 - d * 1.8), 2.2) * 0.35;
      // Diffraction cross spike (4-point star)
      float spike = max(0.0, 1.0 - abs(c.x) * 28.0) * max(0.0, 1.0 - d * 3.5) * 0.55
                  + max(0.0, 1.0 - abs(c.y) * 28.0) * max(0.0, 1.0 - d * 3.5) * 0.55;
      float a = (core + glow + spike * 0.7) * vBright;
      gl_FragColor = vec4(0.96, 0.95, 1.0, a);
    }
  `

  // ── Main starfield (700 stars — quality over quantity) ───────────────
  const STAR_COUNT    = 700
  const sPos          = new Float32Array(STAR_COUNT * 3)
  const sSizes        = new Float32Array(STAR_COUNT)
  const sBrightArr    = new Float32Array(STAR_COUNT)
  const sTwinkPhase   = new Float32Array(STAR_COUNT)
  const sTwinkSpeed   = new Float32Array(STAR_COUNT)

  for (let i = 0; i < STAR_COUNT; i++) {
    const phi   = Math.acos(2 * Math.random() - 1)
    const theta = Math.random() * Math.PI * 2
    const r     = 90 + Math.random() * 110
    sPos[i*3]     = r * Math.sin(phi) * Math.cos(theta)
    sPos[i*3+1]   = r * Math.sin(phi) * Math.sin(theta)
    sPos[i*3+2]   = r * Math.cos(phi)
    // Power-law distribution: mostly tiny, few medium, rare large
    const t       = Math.pow(Math.random(), 2.5)
    sSizes[i]     = 0.4 + t * 2.8
    sBrightArr[i] = 0.2 + Math.random() * 0.8
    sTwinkPhase[i]= Math.random() * Math.PI * 2
    sTwinkSpeed[i]= 0.2 + Math.random() * 0.9
  }

  const starGeo = new THREE.BufferGeometry()
  starGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3))
  starGeo.setAttribute('aSize',    new THREE.BufferAttribute(sSizes, 1))
  starGeo.setAttribute('aBright',  new THREE.BufferAttribute(sBrightArr, 1))
  const starMat = new THREE.ShaderMaterial({
    vertexShader: starVS, fragmentShader: starFS,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  })
  scene.add(new THREE.Points(starGeo, starMat))
  const sBrightAttr = starGeo.attributes.aBright as THREE.BufferAttribute

  // ── Hero stars (8 — prominent, diffraction-spiked) ────────────────────
  const HERO_COUNT  = 8
  const hPos        = new Float32Array(HERO_COUNT * 3)
  const hSizes      = new Float32Array(HERO_COUNT)
  const hBrightArr  = new Float32Array(HERO_COUNT)
  const hTwinkPhase = new Float32Array(HERO_COUNT)
  const hTwinkSpeed = new Float32Array(HERO_COUNT)

  for (let i = 0; i < HERO_COUNT; i++) {
    const phi   = Math.acos(2 * Math.random() - 1)
    const theta = Math.random() * Math.PI * 2
    const r     = 65 + Math.random() * 30
    hPos[i*3]     = r * Math.sin(phi) * Math.cos(theta)
    hPos[i*3+1]   = r * Math.sin(phi) * Math.sin(theta)
    hPos[i*3+2]   = r * Math.cos(phi)
    hSizes[i]     = 7.0 + Math.random() * 5.0   // bigger so spike reads clearly
    hBrightArr[i] = 0.75 + Math.random() * 0.25
    hTwinkPhase[i]= Math.random() * Math.PI * 2
    hTwinkSpeed[i]= 0.15 + Math.random() * 0.35
  }

  const heroGeo = new THREE.BufferGeometry()
  heroGeo.setAttribute('position', new THREE.BufferAttribute(hPos, 3))
  heroGeo.setAttribute('aSize',    new THREE.BufferAttribute(hSizes, 1))
  heroGeo.setAttribute('aBright',  new THREE.BufferAttribute(hBrightArr, 1))
  const heroMat = new THREE.ShaderMaterial({
    vertexShader: starVS, fragmentShader: heroFS,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  })
  scene.add(new THREE.Points(heroGeo, heroMat))
  const hBrightAttr = heroGeo.attributes.aBright as THREE.BufferAttribute

  // ── Nebula clouds (4 semi-transparent canvas planes) ──────────────────
  function makeNebulaTexture(blobs: {x:number;y:number;r:number;col:string}[]) {
    const S = 512
    const nc = document.createElement('canvas')
    nc.width = nc.height = S
    const nx = nc.getContext('2d')!
    nx.globalCompositeOperation = 'lighter'
    for (const b of blobs) {
      const g = nx.createRadialGradient(b.x*S, b.y*S, 0, b.x*S, b.y*S, b.r*S)
      g.addColorStop(0, b.col)
      g.addColorStop(1, 'rgba(0,0,0,0)')
      nx.fillStyle = g
      nx.fillRect(0, 0, S, S)
    }
    return new THREE.CanvasTexture(nc)
  }

  const nebulaDefs = [
    // Near-home: warm magenta/violet pillar
    { pos: [-10, 5, -18] as [number,number,number],
      size: [28, 18] as [number,number],
      rot: [0.06, 0.22, 0.04] as [number,number,number],
      blobs: [
        { x:0.38, y:0.50, r:0.40, col:'rgba(155, 30, 200, 0.28)' },
        { x:0.58, y:0.38, r:0.28, col:'rgba(210, 50, 180, 0.18)' },
        { x:0.28, y:0.68, r:0.22, col:'rgba(100, 15, 170, 0.14)' },
        { x:0.72, y:0.58, r:0.18, col:'rgba(240, 80, 220, 0.10)' },
      ]},
    // Mid: cool blue cloud, wide and faint
    { pos: [13, -4, -45] as [number,number,number],
      size: [38, 22] as [number,number],
      rot: [-0.05, -0.16, 0.03] as [number,number,number],
      blobs: [
        { x:0.48, y:0.50, r:0.46, col:'rgba(30, 40, 210, 0.20)' },
        { x:0.30, y:0.62, r:0.30, col:'rgba(60, 20, 180, 0.14)' },
        { x:0.68, y:0.36, r:0.24, col:'rgba(80, 100, 240, 0.12)' },
        { x:0.55, y:0.72, r:0.18, col:'rgba(20, 60, 200, 0.08)' },
      ]},
    // Deep: large purple/rose nebula spanning sections
    { pos: [-5, 8, -80] as [number,number,number],
      size: [55, 34] as [number,number],
      rot: [0.03, 0.08, -0.02] as [number,number,number],
      blobs: [
        { x:0.42, y:0.48, r:0.48, col:'rgba(180, 25, 160, 0.18)' },
        { x:0.64, y:0.35, r:0.32, col:'rgba(130, 10, 200, 0.14)' },
        { x:0.26, y:0.65, r:0.35, col:'rgba(90,  20, 175, 0.12)' },
        { x:0.76, y:0.60, r:0.20, col:'rgba(220, 60, 180, 0.09)' },
        { x:0.50, y:0.78, r:0.22, col:'rgba(100, 15, 130, 0.08)' },
      ]},
    // Far: deep indigo pillar near contact
    { pos: [9, -2, -130] as [number,number,number],
      size: [60, 38] as [number,number],
      rot: [0.01, 0.05, 0.01] as [number,number,number],
      blobs: [
        { x:0.44, y:0.50, r:0.50, col:'rgba(50, 15, 220, 0.14)' },
        { x:0.62, y:0.44, r:0.36, col:'rgba(80, 30, 200, 0.10)' },
        { x:0.28, y:0.60, r:0.30, col:'rgba(30, 10, 170, 0.09)' },
        { x:0.70, y:0.68, r:0.22, col:'rgba(110, 50, 240, 0.07)' },
      ]},
    // Extra: rose halo near contact for drama
    { pos: [-8, -4, -185] as [number,number,number],
      size: [42, 26] as [number,number],
      rot: [-0.02, -0.08, 0.02] as [number,number,number],
      blobs: [
        { x:0.50, y:0.50, r:0.45, col:'rgba(200, 40, 120, 0.16)' },
        { x:0.36, y:0.40, r:0.28, col:'rgba(240, 60, 160, 0.11)' },
        { x:0.66, y:0.62, r:0.24, col:'rgba(160, 20,  90, 0.10)' },
      ]},
  ]

  const nebulaObjects: THREE.Mesh[] = []
  for (const def of nebulaDefs) {
    const tex  = makeNebulaTexture(def.blobs)
    const mat  = new THREE.MeshBasicMaterial({
      map: tex, transparent: true, opacity: 1,
      depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    })
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(def.size[0], def.size[1]), mat)
    mesh.position.set(...def.pos)
    mesh.rotation.set(...def.rot)
    scene.add(mesh)
    nebulaObjects.push(mesh)
  }

  // ── Dust particles (200 tiny drifting specs) ──────────────────────────
  const DUST_COUNT = 200
  const dPos = new Float32Array(DUST_COUNT * 3)
  const dVel = new Float32Array(DUST_COUNT * 3)

  for (let i = 0; i < DUST_COUNT; i++) {
    dPos[i*3]   = (Math.random() - 0.5) * 14
    dPos[i*3+1] = (Math.random() - 0.5) * 9
    dPos[i*3+2] = (Math.random() - 0.5) * 8 - 2
    dVel[i*3]   = (Math.random() - 0.5) * 0.018
    dVel[i*3+1] = (Math.random() - 0.5) * 0.012
    dVel[i*3+2] = (Math.random() - 0.5) * 0.008
  }

  const dustGeo  = new THREE.BufferGeometry()
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3))
  const dustMat  = new THREE.PointsMaterial({
    size: 0.007, color: 0x99aadd, transparent: true, opacity: 0.22,
    sizeAttenuation: true, blending: THREE.AdditiveBlending, depthWrite: false,
  })
  scene.add(new THREE.Points(dustGeo, dustMat))
  const dustAttr = dustGeo.attributes.position as THREE.BufferAttribute

  // ── Debris: crystal fragments between sections ────────────────────────
  const debrisMat = new THREE.MeshStandardMaterial({
    color: 0x090610, roughness: 0.1, metalness: 0.95,
    transparent: true, opacity: 0.9,
  })
  const debrisLight1 = new THREE.PointLight(0x7b3fe8, 1.2, 8)
  debrisLight1.position.set(-4, 2, -40)
  scene.add(debrisLight1)
  const debrisLight2 = new THREE.PointLight(0x4b2fdd, 0.8, 8)
  debrisLight2.position.set(4, -2, -120)
  scene.add(debrisLight2)
  const debrisLight3 = new THREE.PointLight(0x6b3fe7, 0.8, 8)
  debrisLight3.position.set(-3, 1, -200)
  scene.add(debrisLight3)

  type DebrisPiece = { mesh: THREE.Mesh; rv: THREE.Vector3 }
  const debrisPieces: DebrisPiece[] = []

  // 12 pieces per gap, 3 gaps
  const gapZRanges = [[-15, -65], [-95, -145], [-175, -225]] as [number,number][]
  for (const [zMin, zMax] of gapZRanges) {
    for (let i = 0; i < 12; i++) {
      const size = 0.04 + Math.random() * 0.18
      const geo  = new THREE.OctahedronGeometry(size, 0)
      const mesh = new THREE.Mesh(geo, debrisMat.clone())
      mesh.position.set(
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 8,
        zMin + Math.random() * (zMax - zMin),
      )
      mesh.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI)
      const rv = new THREE.Vector3(
        (Math.random()-0.5)*0.8,
        (Math.random()-0.5)*0.8,
        (Math.random()-0.5)*0.4,
      )
      scene.add(mesh)
      debrisPieces.push({ mesh, rv })
    }
  }

  // ── Camera fly state ─────────────────────────────────────────────────
  let camZ          = 6
  let camYaw        = 0      // camera Y rotation (sweeps during flight)
  let flyFromZ      = 6
  let flyToZ        = 6
  let flyStartTime  = -1
  let flyDuration   = 0
  let prevSectionIdx = 0

  // Shard target world positions (set per section, lerped during flight)
  let shardTargetPos  = new THREE.Vector3(1.8, 0.1, 0)
  let shardTargetScale = 1.0
  let babyTargetPos   = new THREE.Vector3(2.8, -0.5, 0)
  let shardCurrentPos = new THREE.Vector3(1.8, 0.1, 0)
  let shardCurrentScale = 1.0
  let babyCurrentPos  = new THREE.Vector3(2.8, -0.5, 0)

  function sectionWorldPos(idx: number, local: [number,number,number]): THREE.Vector3 {
    const s = SECTIONS[idx]
    return new THREE.Vector3(local[0], local[1], s.sectionZ + local[2])
  }

  function startFly(toIdx: number) {
    const from = SECTIONS[prevSectionIdx]
    const to   = SECTIONS[toIdx]
    flyFromZ    = camZ
    flyToZ      = to.cameraZ
    const dist  = Math.abs(flyToZ - flyFromZ)
    flyDuration = Math.min(2.5, Math.max(1.4, dist / 60))
    flyStartTime = clock
    shardTargetPos   = sectionWorldPos(toIdx, to.shardLocal)
    shardTargetScale = to.shardScale
    babyTargetPos    = sectionWorldPos(toIdx, to.babyLocal)
    prevSectionIdx   = toIdx
  }

  // Watch spaceNav.currentIndex for fly trigger
  let watchedIdx = spaceNav.currentIndex

  // ── Scroll navigation ────────────────────────────────────────────────
  let scrollLock = false
  const onWheel = (e: WheelEvent) => {
    if (scrollLock) return
    const dir  = e.deltaY > 0 ? 1 : -1
    const next = Math.max(0, Math.min(SECTIONS.length - 1, spaceNav.currentIndex + dir))
    if (next === spaceNav.currentIndex) return
    scrollLock = true   // unlocked in onArrived → spaceNav watch below
    spaceNav.navigateTo(next)
    router.push(SECTIONS[next].path)
  }
  window.addEventListener('wheel', onWheel, { passive: true })

  // ── Keyboard navigation ───────────────────────────────────────────────
  const onKey = (e: KeyboardEvent) => {
    let next = spaceNav.currentIndex
    if      (e.key === 'ArrowDown' || e.key === 'PageDown') next = Math.min(SECTIONS.length - 1, next + 1)
    else if (e.key === 'ArrowUp'   || e.key === 'PageUp')   next = Math.max(0, next - 1)
    else return
    if (next === spaceNav.currentIndex) return
    scrollLock = true
    spaceNav.navigateTo(next)
    router.push(SECTIONS[next].path)
  }
  window.addEventListener('keydown', onKey)

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

  let mainBaseScale = 1.0   // the scale set by normalizeModel — used as multiplier baseline
  let babyBaseScale = 1.0

  function normalizeModel(obj: THREE.Object3D, targetSize: number): number {
    const box  = new THREE.Box3().setFromObject(obj)
    const ctr  = new THREE.Vector3()
    box.getCenter(ctr)
    obj.position.sub(ctr)
    const size = new THREE.Vector3()
    box.getSize(size)
    const s = targetSize / Math.max(size.x, size.y, size.z)
    obj.scale.setScalar(s)
    return s
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
    mainBaseScale = normalizeModel(mainShard, 1.6)

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
    babyBaseScale = normalizeModel(babyShard, 0.6)
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
    size: 0.022, vertexColors: true, transparent: true, opacity: 0,
    sizeAttenuation: true, blending: THREE.AdditiveBlending,
    depthWrite: false, depthTest: false,  // always render above shards
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
    pMat.opacity = 0   // let done phase lerp it in smoothly
    doneStart = clock
    shardCurrentPos.copy(FINAL_MAIN_POS)
    babyCurrentPos.copy(FINAL_BABY_POS)
    shardTargetPos.copy(FINAL_MAIN_POS)
    babyTargetPos.copy(FINAL_BABY_POS)
    shardCurrentScale = 1.0
    shardTargetScale  = 1.0
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
      // Keep particles hidden during phase3 — they appear after shard settles
      pMat.opacity = 0

      if (t >= 1) {
        phase = 'done'
        doneStart = clock
        mainRotY  = mainShard?.rotation.y ?? 0
        babyRotY  = FINAL_BABY_ROT.y
        // Sync shard current positions to home section defaults
        shardCurrentPos.copy(FINAL_MAIN_POS)
        babyCurrentPos.copy(FINAL_BABY_POS)
        shardTargetPos.copy(FINAL_MAIN_POS)
        babyTargetPos.copy(FINAL_BABY_POS)
        shardCurrentScale = 1.0
        shardTargetScale  = 1.0
        ctx.clearRect(0, 0, overlay.width, overlay.height)
        window.removeEventListener('click', skipToEnd)
        loaderStore.complete()
      }
    }

    // ── Done: normal scene loop ───────────────────────────────────────
    else {
      // Check if spaceNav triggered a new fly
      if (spaceNav.currentIndex !== watchedIdx) {
        startFly(spaceNav.currentIndex)
        watchedIdx = spaceNav.currentIndex
      }

      // ── Camera fly ─────────────────────────────────────────────────
      let flyT = 1
      if (flyStartTime >= 0 && clock - flyStartTime < flyDuration) {
        const raw  = (clock - flyStartTime) / flyDuration
        flyT = raw < 0.5 ? 2*raw*raw : -1+(4-2*raw)*raw  // ease in-out
      } else if (flyStartTime >= 0) {
        flyT = 1
        flyStartTime = -1
        camZ = flyToZ
        spaceNav.onArrived()
        scrollLock = false   // allow next scroll only after camera lands
      }

      if (flyStartTime >= 0) {
        camZ = flyFromZ + (flyToZ - flyFromZ) * flyT
        // Shard Z is locked 6 units in front of camera — never behind it
        // Only X/Y lerp for the cinematic lateral drift
        shardCurrentPos.x += (shardTargetPos.x - shardCurrentPos.x) * 0.04
        shardCurrentPos.y += (shardTargetPos.y - shardCurrentPos.y) * 0.04
        shardCurrentPos.z  = camZ - 6   // always in front of camera
        babyCurrentPos.x  += (babyTargetPos.x - babyCurrentPos.x) * 0.04
        babyCurrentPos.y  += (babyTargetPos.y - babyCurrentPos.y) * 0.04
        babyCurrentPos.z   = camZ - 6
        shardCurrentScale += (shardTargetScale - shardCurrentScale) * 0.012
      } else {
        // Landed: settle X/Y/Z and scale to section targets
        shardCurrentPos.x += (shardTargetPos.x - shardCurrentPos.x) * 0.06
        shardCurrentPos.y += (shardTargetPos.y - shardCurrentPos.y) * 0.06
        shardCurrentPos.z += (shardTargetPos.z - shardCurrentPos.z) * 0.06
        babyCurrentPos.x  += (babyTargetPos.x - babyCurrentPos.x) * 0.06
        babyCurrentPos.y  += (babyTargetPos.y - babyCurrentPos.y) * 0.06
        babyCurrentPos.z  += (babyTargetPos.z - babyCurrentPos.z) * 0.06
        shardCurrentScale += (shardTargetScale - shardCurrentScale) * 0.05
      }

      camera.position.z = camZ

      // Camera yaw — sweeps ~25° to the left mid-flight so shard stays in view
      const isFlying3D = flyStartTime >= 0
      const yawTarget  = isFlying3D ? Math.sin(flyT * Math.PI) * -0.42 : 0
      camYaw += (yawTarget - camYaw) * (isFlying3D ? 0.06 : 0.04)
      camera.rotation.y = camYaw

      // Camera Z-bank (roll) during flight
      const velocity = isFlying3D ? (flyToZ - flyFromZ) / flyDuration : 0
      const bank = isFlying3D ? Math.sin(flyT * Math.PI) * Math.sign(velocity) * 0.03 : 0
      camera.rotation.z += (bank - camera.rotation.z) * 0.08

      // Star streaking
      if (Math.abs(velocity) > 1) {
        const streak = Math.min(1, Math.abs(velocity) / 80)
        for (let i = 0; i < STAR_COUNT; i++) {
          sSizes[i] = (0.5 + Math.random() * 2.5) * (1 + streak * 4)
        }
        ;(starGeo.attributes.aSize as THREE.BufferAttribute).needsUpdate = true
      }

      const curSection = SECTIONS[spaceNav.currentIndex]
      const rotPeriod  = curSection.rotPeriod

      // Particle brightness — boosted on contact section
      const isContact     = curSection.key === 'contact'
      const targetOpacity = phase === 'done' ? (isContact ? 0.95 : 0.7) : 0
      pMat.opacity += (targetOpacity - pMat.opacity) * 0.04

      mainRotY += delta * (Math.PI * 2 / rotPeriod)
      babyRotY -= delta * (Math.PI * 2 / BABY_PERIOD)

      const floatT = (clock - doneStart) / FLOAT_CYCLE * Math.PI * 2

      if (mainShard) {
        mainShard.position.x = shardCurrentPos.x
        mainShard.position.y = shardCurrentPos.y + Math.sin(floatT) * FLOAT_AMP
        mainShard.position.z = shardCurrentPos.z
        mainShard.scale.setScalar(mainBaseScale * shardCurrentScale)
        mainShard.rotation.x = FINAL_MAIN_ROT.x + tiltX
        mainShard.rotation.y = mainRotY
        mainShard.rotation.z = FINAL_MAIN_ROT.z + tiltZ
      }

      if (babyShard) {
        babyShard.position.x = babyCurrentPos.x
        babyShard.position.y = babyCurrentPos.y + Math.sin(floatT + Math.PI) * FLOAT_AMP * 0.8
        babyShard.position.z = babyCurrentPos.z
        babyShard.rotation.x = FINAL_BABY_ROT.x + tiltX * 0.7
        babyShard.rotation.y = babyRotY
        babyShard.rotation.z = FINAL_BABY_ROT.z + tiltZ * 0.7
      }

      // Orbit particles around current shard position
      for (let i = 0; i < COUNT; i++) {
        pAngles[i] += pSpeed[i] * delta
        const r = pRadii[i], a = pAngles[i], inc = pInc[i]
        const zRaw = r * Math.sin(a)
        let x = shardCurrentPos.x + (pCX[i] < 2.0 ? 0 : babyCurrentPos.x - shardCurrentPos.x) + r * Math.cos(a)
        let y = (pCX[i] < 2.0 ? shardCurrentPos.y : babyCurrentPos.y) + zRaw * Math.sin(inc)
        const z = shardCurrentPos.z + zRaw * Math.cos(inc)

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

      // Debris rotation
      for (const { mesh, rv } of debrisPieces) {
        mesh.rotation.x += rv.x * delta
        mesh.rotation.y += rv.y * delta
        mesh.rotation.z += rv.z * delta
      }
    }

    // ── Space: twinkling stars ────────────────────────────────────────
    for (let i = 0; i < STAR_COUNT; i++) {
      sBrightAttr.array[i] = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(clock * sTwinkSpeed[i] + sTwinkPhase[i]))
    }
    sBrightAttr.needsUpdate = true

    for (let i = 0; i < HERO_COUNT; i++) {
      hBrightAttr.array[i] = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(clock * hTwinkSpeed[i] + hTwinkPhase[i]))
    }
    hBrightAttr.needsUpdate = true

    // ── Space: dust drift (wrap at bounds) ────────────────────────────
    for (let i = 0; i < DUST_COUNT; i++) {
      dustAttr.array[i*3]   += dVel[i*3]
      dustAttr.array[i*3+1] += dVel[i*3+1]
      dustAttr.array[i*3+2] += dVel[i*3+2]
      if (Math.abs(dustAttr.array[i*3])   > 7)  dVel[i*3]   *= -1
      if (Math.abs(dustAttr.array[i*3+1]) > 4.5) dVel[i*3+1] *= -1
      if (Math.abs(dustAttr.array[i*3+2]) > 4)  dVel[i*3+2] *= -1
    }
    dustAttr.needsUpdate = true

    // ── Space: nebula slow drift ──────────────────────────────────────
    for (let i = 0; i < nebulaObjects.length; i++) {
      nebulaObjects[i].position.x += Math.sin(clock * 0.028 + i * 1.3) * 0.00025
      nebulaObjects[i].position.y += Math.cos(clock * 0.022 + i * 0.9) * 0.00020
    }

    renderer!.render(scene, camera)
  }
  tick()

  ;(canvas as any)._cleanup = () => {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('resize', onResize)
    window.removeEventListener('click', skipToEnd)
    window.removeEventListener('wheel', onWheel)
    window.removeEventListener('keydown', onKey)
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
