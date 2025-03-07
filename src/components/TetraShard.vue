<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { useLoaderStore } from '@/stores/loader'
import { useSpaceNav, SECTIONS } from '@/stores/spaceNav'
import { useNavigationStore } from '@/stores/navigation'
import { content } from '@/data/content'
import { galleryBridge } from '@/utils/galleryBridge'
import { useRouter } from 'vue-router'

const loaderStore = useLoaderStore()
const spaceNav    = useSpaceNav()
const navStore    = useNavigationStore()
const router      = useRouter()
const canvasRef   = ref<HTMLCanvasElement | null>(null)
const overlayRef  = ref<HTMLCanvasElement | null>(null)

let renderer: THREE.WebGLRenderer | null = null
let rafId = 0

onMounted(() => {
  const canvas  = canvasRef.value
  const overlay = overlayRef.value
  if (!canvas || !overlay) return
  const ov = overlay as HTMLCanvasElement

  const ctx = overlay.getContext('2d')!
  ov.width  = window.innerWidth
  ov.height = window.innerHeight

  const scene  = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 600)
  camera.position.set(0, 0, 6)

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.2
  renderer.setClearColor(0x232330, 1)

  scene.add(new THREE.AmbientLight(0xccccdd, 1.8))

  const fill = new THREE.DirectionalLight(0xffffff, 1.5)
  fill.position.set(0, 12, -20)
  scene.add(fill)

  const fill2 = new THREE.DirectionalLight(0xaaaacc, 0.8)
  fill2.position.set(10, -4, 5)
  scene.add(fill2)

  scene.fog = new THREE.FogExp2(0x232330, 0.0048)

  // Cave rock texture — layered cracks on dark stone, drawn to a canvas so we avoid a texture file
  function makeCaveTexture(): THREE.Texture {
    const S = 512
    const gc = document.createElement('canvas')
    gc.width = S; gc.height = S
    const gx = gc.getContext('2d')!

    // slightly warm grey base — enough contrast for the purple cracks to pop
    gx.fillStyle = '#2e2e36'
    gx.fillRect(0, 0, S, S)

    const mainCracks = [
      [[0.08,0.12],[0.22,0.31],[0.18,0.55],[0.35,0.72],[0.42,0.90]],
      [[0.55,0.05],[0.48,0.28],[0.62,0.44],[0.70,0.68],[0.60,0.88]],
      [[0.75,0.15],[0.88,0.30],[0.80,0.50],[0.92,0.70],[0.85,0.95]],
      [[0.0, 0.60],[0.15,0.65],[0.30,0.58],[0.50,0.63],[0.65,0.55],[1.0,0.60]],
      [[0.20,0.02],[0.32,0.18],[0.45,0.12],[0.55,0.25],[0.68,0.10]],
    ] as [number,number][][]

    // fat glow pass first, then tight bright core — gives the LED effect
    gx.shadowColor = '#9b3fff'
    gx.shadowBlur  = 28
    gx.strokeStyle = 'rgba(160, 90, 255, 0.7)'
    gx.lineWidth   = 5
    for (const path of mainCracks) {
      gx.beginPath()
      gx.moveTo(path[0][0]*S, path[0][1]*S)
      for (let k = 1; k < path.length; k++) gx.lineTo(path[k][0]*S, path[k][1]*S)
      gx.stroke()
    }

    gx.shadowBlur  = 4
    gx.strokeStyle = 'rgba(220, 170, 255, 0.95)'
    gx.lineWidth   = 1.0
    for (const path of mainCracks) {
      gx.beginPath()
      gx.moveTo(path[0][0]*S, path[0][1]*S)
      for (let k = 1; k < path.length; k++) gx.lineTo(path[k][0]*S, path[k][1]*S)
      gx.stroke()
    }

    // smaller secondary cracks — kept dim so they don't compete with the main ones
    const hairCracks = [
      [[0.12,0.40],[0.28,0.47],[0.38,0.35]],
      [[0.60,0.30],[0.72,0.22],[0.80,0.38]],
      [[0.40,0.70],[0.52,0.78],[0.58,0.65]],
      [[0.85,0.55],[0.90,0.68],[0.78,0.75]],
    ] as [number,number][][]

    gx.shadowColor = '#6b2fa8'
    gx.shadowBlur  = 10
    gx.strokeStyle = 'rgba(160, 100, 230, 0.45)'
    gx.lineWidth   = 2
    for (const path of hairCracks) {
      gx.beginPath()
      gx.moveTo(path[0][0]*S, path[0][1]*S)
      for (let k = 1; k < path.length; k++) gx.lineTo(path[k][0]*S, path[k][1]*S)
      gx.stroke()
    }

    gx.shadowBlur  = 0
    gx.strokeStyle = 'rgba(200, 155, 255, 0.60)'
    gx.lineWidth   = 0.7
    for (const path of hairCracks) {
      gx.beginPath()
      gx.moveTo(path[0][0]*S, path[0][1]*S)
      for (let k = 1; k < path.length; k++) gx.lineTo(path[k][0]*S, path[k][1]*S)
      gx.stroke()
    }

    gx.shadowBlur = 0

    // random ellipses to break the flat base — gives it a rough stone feel
    for (let i = 0; i < 180; i++) {
      const px = Math.random() * S
      const py = Math.random() * S
      const pr = 6 + Math.random() * 28
      const dark = Math.random() > 0.5
      const alpha = 0.06 + Math.random() * 0.14
      gx.beginPath()
      gx.ellipse(px, py, pr, pr * (0.4 + Math.random() * 0.8), Math.random() * Math.PI, 0, Math.PI*2)
      gx.fillStyle = dark
        ? `rgba(12, 8, 18, ${alpha})`
        : `rgba(44, 32, 58, ${alpha})`
      gx.fill()
    }

    // darken the edges so the tile seams aren't obvious
    const vignette = gx.createRadialGradient(S/2, S/2, S*0.15, S/2, S/2, S*0.75)
    vignette.addColorStop(0,   'rgba(30, 22, 40, 0.0)')
    vignette.addColorStop(0.6, 'rgba(15, 8, 25, 0.3)')
    vignette.addColorStop(1,   'rgba(5,  2, 10, 0.75)')
    gx.fillStyle = vignette
    gx.fillRect(0, 0, S, S)

    const tex = new THREE.CanvasTexture(gc)
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(1.5, 1.5)
    return tex
  }

  const caveTex = makeCaveTexture()

  // has to be MeshStandard, MeshBasic ignores point lights so the cave would look flat
  const wallMat = new THREE.MeshStandardMaterial({
    map:        caveTex,
    side:       THREE.BackSide,
    color:      new THREE.Color(0x2e2e36),
    roughness:  0.97,
    metalness:  0.0,
    envMapIntensity: 0,
  })
  const vaultShell = new THREE.Mesh(new THREE.BoxGeometry(160, 110, 190), wallMat)
  vaultShell.position.set(0, 0, -65)
  scene.add(vaultShell)


  // empty groups — the GLBs drop into these once they load
  const platformHome = new THREE.Group()
  platformHome.position.set(0, -2, -6)
  scene.add(platformHome)

  const galleryMain = new THREE.Group()
  galleryMain.position.set(-17, -4, -60)
  galleryMain.visible = false
  scene.add(galleryMain)

  const SLAB_SPACING = 3.5
  const SLAB_BASE_X  = -17
  let   slabScrollX  = SLAB_BASE_X

  const slabGroup = new THREE.Group()
  slabGroup.position.set(SLAB_BASE_X, -9, -44)
  slabGroup.visible = false
  scene.add(slabGroup)

  // PlaneGeometry faces +Z by default, which is toward the camera — no rotation needed
  const CARD_W = 2.0
  const CARD_H = 2.9
  const cardPlanes: THREE.Mesh[] = []
  const texLoader = new THREE.TextureLoader()

  for (let i = 0; i < content.work.projects.length; i++) {
    const proj = content.work.projects[i]
    const geo  = new THREE.PlaneGeometry(CARD_W, CARD_H)
    const mat  = new THREE.MeshBasicMaterial({ color: 0xffffff })   // white so the texture shows at its real colour
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(i * SLAB_SPACING, 2.2, 0.0)
    slabGroup.add(mesh)
    cardPlanes.push(mesh)

    texLoader.load(proj.image, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace
      ;(mesh.material as THREE.MeshBasicMaterial).map = tex
      ;(mesh.material as THREE.MeshBasicMaterial).needsUpdate = true
    })
  }

  const raycaster  = new THREE.Raycaster()
  const rayMouse   = new THREE.Vector2()
  galleryBridge.raycast = (mx: number, my: number) => {
    rayMouse.set((mx / window.innerWidth) * 2 - 1, -(my / window.innerHeight) * 2 + 1)
    raycaster.setFromCamera(rayMouse, camera)
    const hits = raycaster.intersectObjects(cardPlanes)
    if (!hits.length) return -1
    return cardPlanes.indexOf(hits[0].object as THREE.Mesh)
  }

  galleryBridge.getCardScreenPos = (idx: number) => {
    if (idx < 0 || idx >= cardPlanes.length) return null
    const wp = new THREE.Vector3()
    cardPlanes[idx].getWorldPosition(wp)
    wp.project(camera)
    const cx = (wp.x + 1) / 2 * window.innerWidth
    // project top and bottom edges to derive screen height (simpler than using FOV math)
    const top = new THREE.Vector3(0,  CARD_H / 2, 0).applyMatrix4(cardPlanes[idx].matrixWorld).project(camera)
    const bot = new THREE.Vector3(0, -CARD_H / 2, 0).applyMatrix4(cardPlanes[idx].matrixWorld).project(camera)
    const screenTop = (-top.y + 1) / 2 * window.innerHeight
    const screenBot = (-bot.y + 1) / 2 * window.innerHeight
    const height = screenBot - screenTop
    const width  = height * (CARD_W / CARD_H)
    return { left: cx - width / 2, top: screenTop, width, height }
  }

  const platformAbout = new THREE.Group()
  platformAbout.position.set(8, 3, -87)
  platformAbout.rotation.y = -0.5
  scene.add(platformAbout)

  const platformContact = new THREE.Group()
  platformContact.position.set(-2, -1, -130)
  scene.add(platformContact)

  // two lights per platform: a warm one that fades in as the camera approaches, plus a dim purple rim that's always on
  const platLightPos: [number,number,number][] = [
    [  0,   2,   -6 ],
    [-17,  -6,  -44 ],   // centred on slab group
    [  8,   7,  -87 ],
    [ -2,   2, -130 ],
  ]
  const platformLights: THREE.PointLight[] = []
  const platformRimLights: THREE.PointLight[] = []

  for (let i = 0; i < 4; i++) {
    const [px, py, pz] = platLightPos[i]

    // home is lit from the start, the rest fade in as you fly toward them
    const initIntensity = i === 0 ? 7.0 : 0.0
    const main = new THREE.PointLight(0xe8e0ff, initIntensity, 55)
    main.position.set(px, py + 4, pz)   // +4 keeps it tight to the model — +8 was too far and lost intensity
    scene.add(main)
    platformLights.push(main)

    const rim = new THREE.PointLight(0x8840d0, 0.5, 30)
    rim.position.set(px, py - 1, pz + 2)
    scene.add(rim)
    platformRimLights.push(rim)
  }

  const debrisMat = new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.97, metalness: 0.02 })
  type DebrisPiece = { mesh: THREE.Mesh; rv: THREE.Vector3 }
  const debrisPieces: DebrisPiece[] = []

  for (const [x, y, z, w, h, d] of [
    [ -6,   1,  -15,  1.2, 0.15, 0.6  ],
    [  4,  -3,  -21,  0.4, 0.4,  0.4  ],
    [-10,  -2,  -23,  1.8, 0.08, 0.9  ],
    [  8,   3,  -30,  0.2, 1.0,  0.18 ],
    [ -2,   5,  -17,  0.9, 0.12, 0.5  ],
    [  6,  -4,  -48,  1.4, 0.1,  0.7  ],
    [ -8,   6,  -55,  0.5, 0.5,  0.5  ],
    [ 14,  -1,  -51,  2.0, 0.08, 1.0  ],
    [ -4,   3,  -59,  0.18,0.9,  0.18 ],
    [  2,   4,  -65,  0.7, 0.1,  0.35 ],
    [  8,  -3,  -92,  1.1, 0.12, 0.6  ],
    [-13,   7,  -89,  0.45,0.45, 0.45 ],
    [  2,   6,  -98,  1.6, 0.08, 0.8  ],
    [ -7,  -5,  -95,  0.2, 0.8,  0.2  ],
    [ 10,   2, -102,  0.9, 0.1,  0.5  ],
    [  4,  -6,  -36,  1.0, 0.14, 0.55 ],
    [-10,   2,  -77,  0.35,0.35, 0.35 ],
    [ 15,   4, -110,  0.6, 0.1,  0.3  ],
  ] as [number,number,number,number,number,number][]) {
    const geo  = new THREE.BoxGeometry(w, h, d)
    const mesh = new THREE.Mesh(geo, debrisMat.clone())
    mesh.position.set(x, y, z)
    mesh.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI)
    const edgeOpacity = 0.12 + Math.random() * 0.10
    const edgeColor   = [0x2a2a2e, 0x222224, 0x1e1e20][Math.floor(Math.random() * 3)]
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({ color: edgeColor, transparent: true, opacity: edgeOpacity }),
    )
    mesh.add(edges)
    const rv = new THREE.Vector3(
      (Math.random()-0.5)*0.25,
      (Math.random()-0.5)*0.2,
      (Math.random()-0.5)*0.15,
    )
    scene.add(mesh)
    debrisPieces.push({ mesh, rv })
  }

  let camPos    = new THREE.Vector3(0, 0, 6)
  let camTarget = new THREE.Vector3(0, 0, -2)
  let camBank   = 0   // smoothed roll during flight

  let flyFromPos    = new THREE.Vector3()
  let flyFromTarget = new THREE.Vector3()
  let flyToPos      = new THREE.Vector3()
  let flyToTarget   = new THREE.Vector3()
  let flyCtrlPos    = new THREE.Vector3()   // quadratic bezier control point
  let flyStartTime  = -1
  let flyDuration   = 0

  let shardTargetPos   = new THREE.Vector3(...SECTIONS[0].shardWorld)
  let shardTargetScale = SECTIONS[0].shardScale
  let babyTargetPos    = new THREE.Vector3(...SECTIONS[0].babyWorld)
  let shardCurrentPos  = new THREE.Vector3(...SECTIONS[0].shardWorld)
  let shardCurrentScale = 1.0
  let babyCurrentPos   = new THREE.Vector3(...SECTIONS[0].babyWorld)

  // quadratic bezier — used for camera path so it arcs rather than cutting straight through geometry
  function quadBezier(
    t: number,
    p0: THREE.Vector3, p1: THREE.Vector3, p2: THREE.Vector3,
    out: THREE.Vector3,
  ) {
    const mt = 1 - t
    out.set(
      mt*mt*p0.x + 2*mt*t*p1.x + t*t*p2.x,
      mt*mt*p0.y + 2*mt*t*p1.y + t*t*p2.y,
      mt*mt*p0.z + 2*mt*t*p1.z + t*t*p2.z,
    )
  }

  function startFly(toIdx: number) {
    const to = SECTIONS[toIdx]
    flyFromPos.copy(camPos)
    flyFromTarget.copy(camTarget)
    flyToPos.set(...to.cameraPos)
    flyToTarget.set(...to.lookAt)

    // push the bezier control point sideways + slightly up so the camera arcs
    // instead of cutting a straight line through the geometry
    const mid  = flyFromPos.clone().add(flyToPos).multiplyScalar(0.5)
    const dir  = flyToPos.clone().sub(flyFromPos).normalize()
    const up   = new THREE.Vector3(0, 1, 0)
    const perp = new THREE.Vector3().crossVectors(dir, up).normalize()
    const arcLen = flyFromPos.distanceTo(flyToPos)
    flyCtrlPos.copy(mid)
      .addScaledVector(perp, arcLen * 0.18)
      .addScaledVector(up,   arcLen * 0.10)

    // longer distance = longer flight, capped so it never feels sluggish
    flyDuration  = Math.min(2.0, Math.max(1.0, arcLen / 55))
    flyStartTime = clock

    // console.log('[fly] to', to.key, 'duration', flyDuration.toFixed(2), 'arcLen', arcLen.toFixed(1))

    shardTargetPos.set(...to.shardWorld)
    shardTargetScale = to.shardScale
    babyTargetPos.set(...to.babyWorld)
  }

  let watchedIdx = spaceNav.currentIndex

  let scrollLock     = false
  let postArrivalTimer = 0

  function doNavigate(dir: 1 | -1, force = false) {
    if (scrollLock && !force) return
    const next = Math.max(0, Math.min(SECTIONS.length - 1, spaceNav.currentIndex + dir))
    if (next === spaceNav.currentIndex) return  // already at the edge, nothing to do

    // console.log('[nav] going', dir > 0 ? 'forward' : 'back', '→', SECTIONS[next].key)

    scrollLock = true
    clearTimeout(postArrivalTimer)
    spaceNav.navigateTo(next)
    router.push(SECTIONS[next].path)
  }

  // WorkView pushes navigation from here when the user scrolls past the last/first card
  // force=true so the scroll lock doesn't block it — the user earned that swipe
  galleryBridge.navigateSection = (dir) => doNavigate(dir, true)

  // this accumulator is separate from WorkView's so they don't step on each other
  let sectionDelta    = 0
  let sectionIdleTimer = 0

  const onWheel = (e: WheelEvent) => {
    if (spaceNav.currentIndex === 1) return  // work section owns its own scroll
    if (scrollLock) return

    sectionDelta += e.deltaY
    clearTimeout(sectionIdleTimer)
    // reset if the user pauses — prevents a stale delta from firing on the next touch
    sectionIdleTimer = window.setTimeout(() => { sectionDelta = 0 }, 900)

    // console.log('[wheel] sectionDelta', sectionDelta.toFixed(0))

    if (Math.abs(sectionDelta) < 250) return
    const dir = sectionDelta > 0 ? 1 : -1
    sectionDelta = 0
    doNavigate(dir)
  }
  window.addEventListener('wheel', onWheel, { passive: true })

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

  type Phase = 'waiting' | 'phase1' | 'phase2' | 'phase3' | 'done'
  let phase: Phase = 'waiting'   // stays here until the main shard GLB loads

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
  let phase1Start = 0

  function toScreen(wx: number, wy: number, wz: number) {
    const v = new THREE.Vector3(wx, wy, wz).project(camera)
    return {
      x: (v.x  + 1) / 2 * window.innerWidth,
      y: (-v.y + 1) / 2 * window.innerHeight,
    }
  }

  // the shard isn't square so the loading diamond uses separate x/y radii
  let crossRX  = 0.75
  let crossRY  = 0.75
  let flashT   = -1      // -1 means idle
  let flashDelay = -1    // armed clock time, -1 = not yet

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

  let mainBaseScale = 1.0   // captured from normalizeModel so we can apply section scale on top

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

  const FINAL_MAIN_POS = new THREE.Vector3(0.0, 0.4, -5)
  const FINAL_MAIN_ROT = { x: 0.1, y: 0, z: 0.15 }
  const FINAL_BABY_POS = new THREE.Vector3(2.8, -0.3, -4.5)
  const FINAL_BABY_ROT = { x: -0.1, y: 0.3, z: 0.2 }

  const gltfLoader = new GLTFLoader()

  // console.log('[3d] starting model loads')

  gltfLoader.load('/3d/thealter.glb', (gltf) => {
    const altar = gltf.scene

    const box  = new THREE.Box3().setFromObject(altar)
    const size = new THREE.Vector3()
    box.getSize(size)
    const ctr  = new THREE.Vector3()
    box.getCenter(ctr)
    const s = 14 / Math.max(size.x, size.y, size.z)
    altar.scale.setScalar(s)
    altar.position.sub(ctr.multiplyScalar(s))
    altar.position.y = 0

    // override Blender materials so everything fits the vault colour palette
    altar.traverse(child => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        const replace = new THREE.MeshStandardMaterial({
          color:              0x28282c,
          roughness:          0.94,
          metalness:          0.06,
          emissive:           new THREE.Color(0x100818),
          emissiveIntensity:  0.08,
        })
        mesh.material = Array.isArray(mesh.material)
          ? mesh.material.map(() => replace.clone())
          : replace
      }
    })

    platformHome.add(altar)
  })

  gltfLoader.load('/3d/GaleryMain.glb', (gltf) => {
    const wall = gltf.scene

    const box = new THREE.Box3().setFromObject(wall)
    const ctr = new THREE.Vector3()
    box.getCenter(ctr)
    const size = new THREE.Vector3()
    box.getSize(size)
    const s = 26 / Math.max(size.x, size.y, size.z)
    wall.scale.setScalar(s)
    wall.position.sub(ctr.multiplyScalar(s))

    wall.traverse(child => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        const mat = new THREE.MeshStandardMaterial({
          color:             0x484650,
          roughness:         0.92,
          metalness:         0.04,
          emissive:          new THREE.Color(0x0e0820),
          emissiveIntensity: 0.10,
        })
        mesh.material = Array.isArray(mesh.material)
          ? mesh.material.map(() => mat.clone())
          : mat
      }
    })

    galleryMain.add(wall)
  })

  gltfLoader.load('/3d/GaleryPlatform.glb', (gltf) => {
    const template = gltf.scene

    const box = new THREE.Box3().setFromObject(template)
    const size = new THREE.Vector3()
    box.getSize(size)
    const ctr = new THREE.Vector3()
    box.getCenter(ctr)
    const s = 2.8 / Math.max(size.x, size.y, size.z)
    template.scale.setScalar(s)
    template.position.sub(ctr.multiplyScalar(s))
    template.position.y = 0

    const N = content.work.projects.length
    for (let i = 0; i < N; i++) {
      const slab = template.clone(true)
      slab.position.set(i * SLAB_SPACING, 0, 0)

      slab.traverse(child => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh
          const mat = new THREE.MeshStandardMaterial({
            color:             0x303038,
            roughness:         0.93,
            metalness:         0.04,
            emissive:          new THREE.Color(0x0c0820),
            emissiveIntensity: 0.10,
          })
          mesh.material = Array.isArray(mesh.material)
            ? mesh.material.map(() => mat.clone())
            : mat
        }
      })

      slabGroup.add(slab)
    }
  })

  gltfLoader.load('/3d/thearchive.glb', (gltf) => {
    const archive = gltf.scene

    const box  = new THREE.Box3().setFromObject(archive)
    const size = new THREE.Vector3()
    box.getSize(size)
    const ctr  = new THREE.Vector3()
    box.getCenter(ctr)
    const s = 14 / Math.max(size.x, size.y, size.z)
    archive.scale.setScalar(s)
    archive.position.sub(ctr.multiplyScalar(s))
    archive.position.y = 0

    archive.traverse(child => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        const replace = new THREE.MeshStandardMaterial({
          color:             0x1a1a1c,
          roughness:         0.95,
          metalness:         0.02,
          emissive:          new THREE.Color(0x000000),
          emissiveIntensity: 0.0,
        })
        mesh.material = Array.isArray(mesh.material)
          ? mesh.material.map(() => replace.clone())
          : replace
      }
    })

    platformAbout.add(archive)
  })

  gltfLoader.load('/3d/Themonolith.glb', (gltf) => {
    const monolith = gltf.scene

    const box  = new THREE.Box3().setFromObject(monolith)
    const size = new THREE.Vector3()
    box.getSize(size)
    const ctr  = new THREE.Vector3()
    box.getCenter(ctr)
    const s = 14 / Math.max(size.x, size.y, size.z)
    monolith.scale.setScalar(s)
    monolith.position.sub(ctr.multiplyScalar(s))
    monolith.position.y = 0

    monolith.traverse(child => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        const replace = new THREE.MeshStandardMaterial({
          color:             0x1a1a1c,
          roughness:         0.95,
          metalness:         0.02,
          emissive:          new THREE.Color(0x000000),
          emissiveIntensity: 0.0,
        })
        mesh.material = Array.isArray(mesh.material)
          ? mesh.material.map(() => replace.clone())
          : replace
      }
    })

    platformContact.add(monolith)
  })

  function onProgress(e: ProgressEvent) {
    if (e.total > 0) {
      loadFraction = Math.min(0.95, assetsLoaded * 0.5 + (e.loaded / e.total) * 0.5)
    }
  }

  gltfLoader.load('/3d/Shard.glb', (gltf) => {
    mainShard = gltf.scene
    mainBaseScale = normalizeModel(mainShard, 2.2)

    // read the actual mesh bounds so the loading cross fits the shard perfectly
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
    // console.log('[3d] main shard loaded, crossRX:', crossRX.toFixed(2), 'crossRY:', crossRY.toFixed(2))

    // start the intro only after the mesh is loaded — we need the real size for the cross animation
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

  const COUNT   = 112
  // each particle has its own tilted orbit — theta/phi pick the tilt axis randomly
  // using acos(2r-1) instead of just random() gives a uniform spread across the sphere
  const pAngles = new Float32Array(COUNT)   // where on its orbit ring
  const pRadii  = new Float32Array(COUNT)   // how far from center
  const pSpeed  = new Float32Array(COUNT)   // how fast it spins
  const pTheta  = new Float32Array(COUNT)   // orbit tilt (0..π)
  const pPhi    = new Float32Array(COUNT)   // orbit azimuth (0..2π)
  const pPos    = new Float32Array(COUNT * 3)
  const pCol    = new Float32Array(COUNT * 3)
  const colA    = new THREE.Color(0x7b2fbe)
  const colB    = new THREE.Color(0xb44fff)

  for (let i = 0; i < COUNT; i++) {
    pAngles[i] = Math.random() * Math.PI * 2
    pRadii[i]  = 0.45 + Math.random() * 0.65
    pSpeed[i]  = 0.06 + Math.random() * 0.16
    pTheta[i]  = Math.acos(2 * Math.random() - 1)  // acos trick for uniform sphere distribution
    pPhi[i]    = Math.random() * Math.PI * 2
    const c    = colA.clone().lerp(colB, Math.random())
    pCol[i*3]  = c.r; pCol[i*3+1] = c.g; pCol[i*3+2] = c.b
  }

  const pGeo = new THREE.BufferGeometry()
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3))
  pGeo.setAttribute('color',    new THREE.BufferAttribute(pCol, 3))
  const pMat = new THREE.PointsMaterial({
    size: 0.022, vertexColors: true, transparent: true, opacity: 0,
    sizeAttenuation: true, blending: THREE.AdditiveBlending,
    depthWrite: false, depthTest: false,  // skip depth so particles always render on top of the shard
  })
  scene.add(new THREE.Points(pGeo, pMat))
  const posAttr = pGeo.attributes.position as THREE.BufferAttribute

  // fillProgress 0→1 drives how far each line extends; morphT shifts the shape from cross to diamond
  function drawCross(fillProgress: number, morphT: number, alpha: number) {
    ctx.clearRect(0, 0, ov.width, ov.height)

    const cx = window.innerWidth  / 2
    const cy = window.innerHeight / 2

    if (alpha > 0.01) {
      ctx.fillStyle = `rgba(2, 3, 8, ${alpha * 0.96})`
      ctx.fillRect(0, 0, ov.width, ov.height)
    }

    if (flashT >= 0 && flashT < 1) {
      const r    = flashT * Math.max(window.innerWidth, window.innerHeight) * 0.75
      const fa   = Math.pow(1 - flashT, 1.8) * 0.7
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
      grad.addColorStop(0,   `rgba(200, 100, 255, ${fa})`)
      grad.addColorStop(0.3, `rgba(120, 60, 220, ${fa * 0.5})`)
      grad.addColorStop(1,   'rgba(0,0,0,0)')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, ov.width, ov.height)
    }

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

      // three layers: fat glow → coloured line → thin bright thread on top
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(ex, ey)
      ctx.strokeStyle = 'rgba(120, 40, 210, 0.22)'
      ctx.lineWidth   = 4
      ctx.shadowColor = '#7B2FBE'
      ctx.shadowBlur  = 14
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(ex, ey)
      ctx.strokeStyle = '#a855f7'
      ctx.lineWidth   = 0.5
      ctx.shadowBlur  = 6
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(ex, ey)
      ctx.strokeStyle = 'rgba(230, 195, 255, 0.45)'
      ctx.lineWidth   = 0.2
      ctx.shadowBlur  = 0
      ctx.stroke()
    }

    // tiny glow dots at each tip — only appear when the lines are fully drawn
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

  let rawMX = 0, rawMY = 0, smMX = 0, smMY = 0
  const mouseNDC = new THREE.Vector2(9999, 9999)

  const onMove = (e: MouseEvent) => {
    rawMX =  (e.clientX / window.innerWidth  - 0.5) * 2
    rawMY = -(e.clientY / window.innerHeight - 0.5) * 2
    mouseNDC.set((e.clientX / window.innerWidth) * 2 - 1,
                 -(e.clientY / window.innerHeight) * 2 + 1)
  }
  window.addEventListener('mousemove', onMove)

  function skipToEnd() {
    if (phase === 'done') return
    phase = 'done'
    ctx.clearRect(0, 0, ov.width, ov.height)
    if (mainShard) {
      mainShard.position.copy(FINAL_MAIN_POS)
      mainShard.rotation.set(FINAL_MAIN_ROT.x, FINAL_MAIN_ROT.y, FINAL_MAIN_ROT.z)
      setOpacity(mainMats, 1)
    }
    if (babyShard) setOpacity(babyMats, 1)
    pMat.opacity = 0   // done phase will lerp this in
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

  const onResize = () => {
    if (!renderer) return
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    ov.width  = window.innerWidth
    ov.height = window.innerHeight
  }
  window.addEventListener('resize', onResize)

  let mainRotY = 0
  let babyRotY = FINAL_BABY_ROT.y

  const BABY_PERIOD = 16
  const FLOAT_AMP   = 0.03
  const FLOAT_CYCLE = 4
  const MAX_TILT    = Math.PI / 36

  const tick = () => {
    rafId = requestAnimationFrame(tick)

    const now   = performance.now()
    const delta = (now - lastMs) / 1000
    lastMs = now
    clock += delta

    smMX += (rawMX - smMX) * 0.06
    smMY += (rawMY - smMY) * 0.06

    // flash is armed first, then fires after a short delay so it lands mid-reveal
    if (flashDelay >= 0 && flashT < 0 && clock - flashDelay >= 0.5) {
      flashT = 0
      spawnExplosion()
    }
    if (flashT >= 0) {
      flashT = Math.min(1, flashT + delta / 0.9)
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

    if (phase === 'waiting') {
      // pulsing dot while the GLB loads
      ctx.clearRect(0, 0, ov.width, ov.height)
      ctx.fillStyle = `rgba(4, 5, 12, 0.82)`
      ctx.fillRect(0, 0, ov.width, ov.height)
      const pulse = 0.4 + 0.6 * Math.sin(clock * 3)
      ctx.beginPath()
      ctx.arc(window.innerWidth / 2, window.innerHeight / 2, 3, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(168, 85, 247, ${pulse})`
      ctx.shadowColor = '#a855f7'
      ctx.shadowBlur  = 16
      ctx.fill()
    }

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

    else if (phase === 'phase2') {
      const t     = Math.min(1, (clock - phaseStart) / DUR_PHASE2)
      const eased = t < 0.5 ? 2*t*t : -1 + (4 - 2*t) * t

      // cross fades out over the last 0.5s while the shard is already fading in
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

    else if (phase === 'phase3') {
      const t     = Math.min(1, (clock - phaseStart) / DUR_PHASE3)
      const eased = 1 - Math.pow(1 - t, 3)

      // alpha=0 so no background or lines, but explosion particles still render
      drawCross(1, 1, 0)

      if (mainShard) {
        mainShard.position.lerpVectors(new THREE.Vector3(0, 0, 0), FINAL_MAIN_POS, eased)
        mainShard.rotation.x = FINAL_MAIN_ROT.x * eased
        mainShard.rotation.y = Math.PI * 0.6 * eased   // spins in during travel so it arrives facing forward
        mainShard.rotation.z = FINAL_MAIN_ROT.z * eased
        setOpacity(mainMats, 1)
      }

      const babyT = Math.max(0, (t - 0.55) / 0.45)
      if (babyShard) setOpacity(babyMats, babyT)
      // hold particles at 0 — letting them fade in during travel looks wrong
      pMat.opacity = 0

      if (t >= 1) {
        phase = 'done'
        doneStart = clock
        mainRotY  = mainShard?.rotation.y ?? 0
        babyRotY  = FINAL_BABY_ROT.y
        shardCurrentPos.copy(FINAL_MAIN_POS)
        babyCurrentPos.copy(FINAL_BABY_POS)
        shardTargetPos.copy(FINAL_MAIN_POS)
        babyTargetPos.copy(FINAL_BABY_POS)
        shardCurrentScale = 1.0
        shardTargetScale  = 1.0
        ctx.clearRect(0, 0, ov.width, ov.height)
        window.removeEventListener('click', skipToEnd)
        loaderStore.complete()
      }
    }

    else {
      if (spaceNav.currentIndex !== watchedIdx) {
        startFly(spaceNav.currentIndex)
        watchedIdx = spaceNav.currentIndex
      }

      let flyT = 1
      const isFlying3D = flyStartTime >= 0

      if (isFlying3D && clock - flyStartTime < flyDuration) {
        const raw = (clock - flyStartTime) / flyDuration
        flyT = raw < 0.5 ? 2*raw*raw : -1+(4-2*raw)*raw  // smoothstep-ish ease in-out
      } else if (isFlying3D) {
        flyT = 1
        flyStartTime = -1
        camPos.copy(flyToPos)
        camTarget.copy(flyToTarget)
        spaceNav.onArrived()
        sectionDelta = 0
        // console.log('[fly] arrived at', SECTIONS[spaceNav.currentIndex]?.key)
        clearTimeout(postArrivalTimer)
        // brief cooldown so a fast scroll doesn't immediately fire another section jump
        postArrivalTimer = window.setTimeout(() => { scrollLock = false }, 700)
      }

      if (flyStartTime >= 0) {
        quadBezier(flyT, flyFromPos, flyCtrlPos, flyToPos, camPos)
        camTarget.lerpVectors(flyFromTarget, flyToTarget, flyT)

        // keep shard floating in front of the camera during flight so it doesn't clip behind walls
        const fwd = camTarget.clone().sub(camPos).normalize()
        const shardFront = camPos.clone().addScaledVector(fwd, 6)
        shardCurrentPos.lerp(shardFront, 0.04)
        babyCurrentPos.lerp(shardFront, 0.04)
        shardCurrentScale += (shardTargetScale - shardCurrentScale) * 0.012
      } else {
        const sec = SECTIONS[spaceNav.currentIndex]
        shardTargetPos.set(...sec.shardWorld)
        shardTargetScale = sec.shardScale
        // in the work section the baby shard follows the scroll instead of sitting still
        if (spaceNav.currentIndex !== 1) {
          babyTargetPos.set(...sec.babyWorld)
        }
        shardCurrentPos.lerp(shardTargetPos, 0.06)
        babyCurrentPos.lerp(babyTargetPos, 0.06)
        shardCurrentScale += (shardTargetScale - shardCurrentScale) * 0.05
      }

      const bobX = Math.sin(clock * 0.47) * 0.004
      const bobY = Math.sin(clock * 0.31) * 0.006
      camera.position.copy(camPos)
      camera.position.x += bobX
      camera.position.y += bobY
      camera.lookAt(camTarget)

      // subtle roll during flight — applied after lookAt so it's in camera-local space
      const bankTarget = flyStartTime >= 0 ? Math.sin(flyT * Math.PI) * 0.04 : 0
      camBank += (bankTarget - camBank) * 0.08
      if (Math.abs(camBank) > 0.0001) camera.rotateZ(camBank)

      for (let pi = 0; pi < platformLights.length; pi++) {
        const pl  = platLightPos[pi]
        const dx  = camPos.x - pl[0], dy = camPos.y - pl[1], dz = camPos.z - pl[2]
        const d   = Math.sqrt(dx*dx + dy*dy + dz*dz)
        // floor at 0.8 so they're never completely dark, max ~8.0 when you're right on top
        const tgt = 0.8 + Math.max(0, 1 - d / 50) * 7.2
        platformLights[pi].intensity += (tgt - platformLights[pi].intensity) * 0.06
      }

      const atWork = spaceNav.currentIndex === 1
      galleryMain.visible = atWork
      slabGroup.visible   = atWork
      if (atWork) {
        const slabTargetX = SLAB_BASE_X - navStore.workCardIndex * SLAB_SPACING
        slabScrollX += (slabTargetX - slabScrollX) * 0.08
        slabGroup.position.x = slabScrollX


        raycaster.setFromCamera(mouseNDC, camera)
        const hoverHits = raycaster.intersectObjects(cardPlanes)
        galleryBridge.hoveredIndex = hoverHits.length
          ? cardPlanes.indexOf(hoverHits[0].object as THREE.Mesh)
          : -1

        const activeIdx = navStore.workCardIndex
        for (let ci = 0; ci < cardPlanes.length; ci++) {
          const plane     = cardPlanes[ci]
          const isActive  = ci === activeIdx
          const isHovered = ci === galleryBridge.hoveredIndex
          const tgtZ = isActive ? 0.35 : 0.0
          const tgtS = isActive ? 1.0 : isHovered ? 0.88 : 0.82
          plane.position.z += (tgtZ - plane.position.z) * 0.1
          plane.rotation.y += (0    - plane.rotation.y) * 0.1
          plane.scale.x    += (tgtS - plane.scale.x)    * 0.1
          plane.scale.y     = plane.scale.x
        }
      }

      const curSection = SECTIONS[spaceNav.currentIndex]
      const rotPeriod  = curSection.rotPeriod

      const isContact     = curSection.key === 'contact'
      const targetOpacity = phase === 'done' ? (isContact ? 0.95 : 0.7) : 0
      pMat.opacity += (targetOpacity - pMat.opacity) * 0.04

      // shard spins faster and scales up a bit while flying — settles back on arrival
      const flyBlend  = flyStartTime >= 0 ? Math.sin(flyT * Math.PI) : 0
      const spinBoost = 1 + flyBlend * 7
      const scalePulse = 1 + flyBlend * 0.12

      mainRotY += delta * (Math.PI * 2 / rotPeriod) * spinBoost
      // baby shard spins slower on the work platform — like it's just idling
      const babySpeed = atWork ? 0.25 : (Math.PI * 2 / BABY_PERIOD) * (1 + flyBlend * 4)
      babyRotY -= delta * babySpeed

      const floatT = (clock - doneStart) / FLOAT_CYCLE * Math.PI * 2

      if (mainShard) {
        mainShard.position.x = shardCurrentPos.x
        mainShard.position.y = shardCurrentPos.y + Math.sin(floatT) * FLOAT_AMP
        mainShard.position.z = shardCurrentPos.z
        mainShard.scale.setScalar(mainBaseScale * shardCurrentScale * scalePulse)
        mainShard.rotation.x = FINAL_MAIN_ROT.x + tiltX + flyBlend * 0.4
        mainShard.rotation.y = mainRotY
        mainShard.rotation.z = FINAL_MAIN_ROT.z + tiltZ + flyBlend * 0.25
      }

      if (babyShard) {
        babyShard.position.x = babyCurrentPos.x
        // no float at work — looks better sitting still on the platform
        babyShard.position.y = atWork
          ? babyCurrentPos.y
          : babyCurrentPos.y + Math.sin(floatT + Math.PI) * FLOAT_AMP * 0.8
        babyShard.position.z = babyCurrentPos.z
        babyShard.rotation.x = atWork ? FINAL_BABY_ROT.x : FINAL_BABY_ROT.x + tiltX * 0.7
        babyShard.rotation.y = babyRotY
        babyShard.rotation.z = atWork ? FINAL_BABY_ROT.z : FINAL_BABY_ROT.z + tiltZ * 0.7
      }

      for (let i = 0; i < COUNT; i++) {
        pAngles[i] += pSpeed[i] * delta
        const a  = pAngles[i]
        const th = pTheta[i], ph = pPhi[i]
        const r  = pRadii[i]

        // orbit in local XY, then tilt that circle by rotating around Z (phi) then X (theta)
        const lx = r * Math.cos(a)
        const ly = r * Math.sin(a)

        const x1 = lx * Math.cos(ph) - ly * Math.sin(ph)
        const y1 = lx * Math.sin(ph) + ly * Math.cos(ph)
        const z1 = 0
        const x2 = x1
        const y2 = y1 * Math.cos(th) - z1 * Math.sin(th)
        const z2 = y1 * Math.sin(th) + z1 * Math.cos(th)

        let x = shardCurrentPos.x + x2
        let y = shardCurrentPos.y + y2
        const z = shardCurrentPos.z + z2

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

      for (const { mesh, rv } of debrisPieces) {
        mesh.rotation.x += rv.x * delta
        mesh.rotation.y += rv.y * delta
        mesh.rotation.z += rv.z * delta
      }
    }

    renderer!.render(scene, camera)
  }
  tick()

  // on hard reload, snap camera to whatever section the URL points to.
  // The loader animation still plays — the camera is just pre-positioned so we don't always land on Home.
  const initialPath = router.currentRoute.value.path
  const initialIdx  = Math.max(0, SECTIONS.findIndex(s => s.path === initialPath))
  if (initialIdx !== 0) {
    const sec = SECTIONS[initialIdx]
    camPos.set(...sec.cameraPos)
    camTarget.set(...sec.lookAt)
    camera.position.copy(camPos)
    camera.lookAt(camTarget)
    shardTargetPos.set(...sec.shardWorld)
    shardTargetScale = sec.shardScale
    babyTargetPos.set(...sec.babyWorld)
    shardCurrentPos.set(...sec.shardWorld)
    shardCurrentScale = sec.shardScale
    babyCurrentPos.set(...sec.babyWorld)
    watchedIdx = initialIdx
    spaceNav.navigateTo(initialIdx)
    spaceNav.onArrived()   // clear isFlying immediately
  }

  ;(canvas as any)._cleanup = () => {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('resize', onResize)
    window.removeEventListener('click', skipToEnd)
    window.removeEventListener('wheel', onWheel)
    window.removeEventListener('keydown', onKey)
    clearTimeout(sectionIdleTimer)
    clearTimeout(postArrivalTimer)
    galleryBridge.raycast = null
    galleryBridge.getCardScreenPos = null
    galleryBridge.navigateSection = null
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
  background: #030008;
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
