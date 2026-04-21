/* ─────────────────────────── LUCID ROBOT ANIMATOR ────────────────────────────
 *  Direct manipulation of Spline scene objects via the underlying THREE.js
 *  scene graph.
 *
 *  ANATOMY:
 *    Master arm  = Group `Hand`          at +X ≈ +113 (screen RIGHT, robot LEFT)
 *    Instance arm = Group `Hand Instance` at -X ≈ -113 (screen LEFT, robot RIGHT)
 *
 *  MIRROR FIX:
 *    Spline MInstance copies master matrices identically → two left arms.
 *    We permanently disable all 17 Spline onBeforeRender callbacks, set
 *    scale.x = -1 on Hand Instance to flip geometry, fix backface culling
 *    with DoubleSide materials, and run our own custom mirror that copies
 *    master joint rotations to instance joints every frame.
 *    During the wave, custom mirror is skipped so instance can be posed.
 *
 *  IMPORTANT: We do NOT set matrixAutoUpdate on any object. Spline manages
 *  its own matrix updates and fighting it causes jittery head tracking.
 *  We only call updateMatrix() on the specific joints we write to.
 *
 *  Debugging:
 *    window.__lucid.{wave, spin, assemble, list, raw}
 * ──────────────────────────────────────────────────────────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SplineApp = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SceneObj = any

type Vec3 = { x: number; y: number; z: number }
type RestPose = { obj: SceneObj; rotation: Vec3; position: Vec3; scale: Vec3 }

/* ── Easings ──────────────────────────────────────────────────────────────── */
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
const easeOutBack = (t: number) => {
  const c1 = 1.70158, c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/* ── Wave constants ───────────────────────────────────────────────────────── */
// Wave pose: computed on the MASTER arm (arm.z = +1.8) then transferred to
// the instance via quaternion copy. This avoids Euler decomposition issues
// Wave target pose (verified visually via window.__setPose):
//   arm.rotation.z = +1.5  → upper arm raised horizontally outward
//   elbow.rotation.z = +1.5 → forearm bends UP (hand above head)
//   forearm = neutral (0,0,0)
// Then wiggle: oscillate arm.z around peak to sway the whole raised arm.
const WAVE_ARM_X_PEAK = -0.2      // arm.x at peak (negative = forward in world space due to mirror scale.x=-1)
const WAVE_ARM_Y_PEAK = 0.2       // arm.y at peak (twist shoulder slightly outward)
const WAVE_ARM_Z_PEAK = 1.3       // arm.z at peak (outward raise)
const WAVE_ELBOW_X_PEAK = -0.2    // elbow.x at peak (negative tilts forearm forward to align with elbow)
const WAVE_ELBOW_Y_PEAK = 0
const WAVE_ELBOW_Z_PEAK = 1.4     // elbow.z at peak (less bent, keeps hand away from head)
// Palm-forward pose: forearm Euler (0, π * 0.60, 0) rotates slightly more than 90° around the bone
// Y-axis so the palm faces the camera fully with fingers pointing UP and thumb
// visible on the right. Verified visually — this produces a natural
// human-looking wave silhouette (open hand, palm directly to viewer).
const WAVE_FOREARM_X_PEAK = 0
const WAVE_FOREARM_Y_PEAK = Math.PI * 0.60
const WAVE_FOREARM_Z_PEAK = 0
// Wiggle: rock the forearm by oscillating elbow.z (bends and unbends the elbow
// hinge, making the forearm sweep left/right along the axis of the biceps —
// empirically verified to produce natural full-arm wave motion).
const WAVE_WIGGLE_AMP = 0.25      // elbow.z oscillation amplitude around peak
const WAVE_WIGGLE_CYCLES = 2.5    // number of full sways (reduced for fluidity)
const WAVE_RAISE_FRAC = 0.22      // 0→22%: raise phase
const WAVE_LOWER_FRAC = 0.22      // 78→100%: lower phase
const WAVE_BLEND_OUT_MS = 350     // ms to blend wave end → live mirror

// Head spin: full turns around the Y axis
const HEAD_SPIN_TURNS = 2          // number of full 360° turns
const HEAD_SPIN_DURATION = 1400    // ms for the spin
const HEAD_SPIN_INTERVAL = 30000   // every 30 seconds

export class LucidRobot {
  private app: SplineApp
  private allObjects: { name: string; type: string; obj: SceneObj }[] = []
  private restPoses = new Map<SceneObj, RestPose>()

  // Render hook
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _originalRender: ((...args: any[]) => void) | null = null

  // Master arm (robot LEFT, screen RIGHT) — untouched, follows LookAt
  private _arm: SceneObj | null = null
  private _elbow: SceneObj | null = null
  private _forearm: SceneObj | null = null

  // Instance arm (robot RIGHT, screen LEFT) — waves
  private _instanceShoulder: SceneObj | null = null
  private _instanceArm: SceneObj | null = null
  private _instanceElbow: SceneObj | null = null
  private _instanceForearm: SceneObj | null = null

  // Mirror control: Spline mirror is permanently disabled; we run our own
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _savedMirrorCallbacks = new Map<SceneObj, (...a: any[]) => void>()
  private _mirrorDisabled = false

  // Custom mirror: master counterparts for rotation copy
  private _masterHandLeft: SceneObj | null = null
  private _instanceHandLeft: SceneObj | null = null

  // Body / head
  private _body: SceneObj | null = null
  private _topPart: SceneObj | null = null
  private _head: SceneObj | null = null
  private _bodyRestY = 0

  // Breathing
  private _breathingActive = false
  private _breathingStart = 0

  // Wave — Euler-based 3-phase: raise → hold+wiggle → lower.
  // Start rotations captured at wave start; target is a fixed pose.
  private _waveActive = false
  private _waveStartMs = 0
  private _waveDurationMs = 2400
  private _waveResolve: (() => void) | null = null
  // Start rotations (captured at wave() call, used for raise lerp)
  private _waveStart = { armX: 0, armY: 0, armZ: 0, elbowX: 0, elbowY: 0, elbowZ: 0, forearmX: 0, forearmY: 0, forearmZ: 0 }

  // Wave blend-out: smooth transition from wave end pose back to mirror
  private _waveBlendActive = false
  private _waveBlendStart = 0
  private _waveBlendEnd: { armX: number; armY: number; armZ: number; elbowX: number; elbowY: number; elbowZ: number; forearmX: number; forearmY: number; forearmZ: number } | null = null

  // Rotation lock: block Spline LookAt writes on instance joints during wave
  // LookAt calls rotation.set() on instance joints every frame via setFromVector3.
  // During wave/blend we replace .set() with a no-op; our code writes .x/.y/.z directly.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _savedRotationSets = new Map<SceneObj, (...args: any[]) => any>()

  // Matrix world lock: block scene.updateMatrixWorld() from overwriting our
  // instance arm matrices. Spline's MInstance parent class recopies master
  // matrices during the render pass. We override updateMatrixWorld on the
  // entire instance subtree with a no-op during wave/blend.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _savedUMWs = new Map<SceneObj, (...args: any[]) => any>()

  // Head spin (additive — delta on top of LookAt)
  private _headSpinActive = false
  private _headSpinStart = 0
  private _headSpinPrevDelta = 0  // previous frame's cumulative delta

  // Ambient
  private _ambientTimer: number | null = null
  private _disposed = false

  // Assembly
  private _assemblyPrepared = false
  private _assemblyActive = false
  private _assemblyStart = 0
  private _assemblyDurationMs = 2400
  private _assemblyParts: {
    obj: SceneObj
    from: Vec3; fromRot: Vec3
    to: Vec3; toRot: Vec3
    delay: number
  }[] = []
  private _assemblyResolve: (() => void) | null = null

  constructor(app: SplineApp) {
    this.app = app
    this._scan()
    this._locateJoints()
    this._saveInstanceMirror()
    this._disableMirror()        // permanently disable Spline's broken mirror
    this._applyScaleFlip()       // scale.x=-1 + DoubleSide materials
    this._hookRenderer()
    this._installDebug()
  }

  /* ── Scan scene — catalog objects and capture rest poses ──────────────── */
  private _scan() {
    const scene = this.app?._scene
    if (!scene || typeof scene.traverse !== 'function') {
       
      console.warn('[Lucid] _scene unavailable')
      return
    }
    scene.traverse((obj: SceneObj) => {
      const name: string = obj?.name || ''
      if (name) this.allObjects.push({ name, type: obj?.type || '', obj })
      if (obj.rotation && obj.position && obj.scale) {
        this.restPoses.set(obj, {
          obj,
          rotation: { x: obj.rotation.x, y: obj.rotation.y, z: obj.rotation.z },
          position: { x: obj.position.x, y: obj.position.y, z: obj.position.z },
          scale: { x: obj.scale.x, y: obj.scale.y, z: obj.scale.z },
        })
      }
    })
  }

  /* ── Locate joints ────────────────────────────────────────────────────── */
  private _locateJoints() {
    const masterShoulder = this.allObjects.find(o =>
      o.type === 'Group' && o.name === 'Hand' &&
      o.obj?.parent?.name === 'Top part' && o.obj?.position?.x > 50
    )?.obj || null
    if (masterShoulder) {
      this._arm = this._findChild(masterShoulder, 'arm')
      this._elbow = this._findChild(masterShoulder, 'elbow')
      this._forearm = this._findChild(masterShoulder, 'forearm')
    }

    this._instanceShoulder = this.allObjects.find(o =>
      o.type === 'Group' && o.name === 'Hand Instance'
    )?.obj || null
    if (this._instanceShoulder) {
      this._instanceArm = this._findChild(this._instanceShoulder, 'arm')
      this._instanceElbow = this._findChild(this._instanceShoulder, 'elbow')
      this._instanceForearm = this._findChild(this._instanceShoulder, 'forearm')
      this._instanceHandLeft = this._findChild(this._instanceShoulder, 'Hand LEFT')
    }

    // Master Hand LEFT (for custom mirror rotation copy)
    if (masterShoulder) {
      this._masterHandLeft = this._findChild(masterShoulder, 'Hand LEFT')
    }

    this._topPart = this.allObjects.find(o => o.name === 'Top part')?.obj || null
    this._body = this._topPart
    this._head = this.allObjects.find(o =>
      o.type === 'Group' && o.obj?.parent?.name === 'Top part' &&
      typeof o.obj?.position?.y === 'number' && o.obj.position.y > 100 &&
      o.name !== 'Hand' && o.name !== 'Hand Instance'
    )?.obj || null

    if (this._body) {
      this._bodyRestY = this.restPoses.get(this._body)!.position.y
    }

     
    console.info('[Lucid] joints:', {
      masterArm: this._arm?.uuid?.slice(0, 6),
      instanceArm: this._instanceArm?.uuid?.slice(0, 6),
      head: this._head?.uuid?.slice(0, 6),
    })
  }

  private _findChild(root: SceneObj, name: string): SceneObj | null {
    if (!root) return null
    if (root.name === name) return root
    for (const c of root.children || []) {
      const f = this._findChild(c, name)
      if (f) return f
    }
    return null
  }

  /* ── Mirror control ───────────────────────────────────────────────────── */
  // Spline MInstance copies master matrices via onBeforeRender on EVERY
  // node in the subtree, not just the top-level group. We must save and
  // disable ALL of them during the wave, then restore afterwards.
  private _saveInstanceMirror() {
    if (!this._instanceShoulder) return
    this._savedMirrorCallbacks.clear()
    const walk = (obj: SceneObj) => {
      if (!obj) return
      const obr = obj.onBeforeRender
      if (typeof obr === 'function' && obr.toString() !== '()=>{}') {
        this._savedMirrorCallbacks.set(obj, obr)
      }
      for (const c of (obj.children || [])) walk(c)
    }
    walk(this._instanceShoulder)
  }

  private _disableMirror() {
    if (!this._instanceShoulder || this._mirrorDisabled) return
    for (const [obj] of this._savedMirrorCallbacks) {
      try { obj.onBeforeRender = () => {} } catch { /* noop */ }
    }
    this._mirrorDisabled = true
  }

  /* ── Scale flip + DoubleSide fix ──────────────────────────────────────── */
  // Flipping scale.x on the instance shoulder creates a proper right arm
  // from the left-arm geometry. We must also set DoubleSide on all meshes
  // to fix backface culling caused by the negative scale.
  private _applyScaleFlip() {
    if (!this._instanceShoulder) return
    this._instanceShoulder.scale.x = -1
    this._instanceShoulder.updateMatrix()

    const fixMaterials = (obj: SceneObj) => {
      if (!obj) return
      if (obj.material) {
        try { obj.material.side = 2 /* THREE.DoubleSide */ } catch { /* noop */ }
      }
      for (const c of (obj.children || [])) fixMaterials(c)
    }
    fixMaterials(this._instanceShoulder)
  }

  /* ── Rotation lock: block LookAt writes on instance joints ────────────── */
  // Spline's LookAt calls rotation.set() on instance arm joints every frame.
  // During wave/blend we replace .set() with a no-op so LookAt can't overwrite.
  // Our wave code writes .x/.y/.z directly, bypassing the blocked .set().
  //
  // We also block updateMatrixWorld on the entire instance subtree so that
  // scene.updateMatrixWorld() during the render pass cannot overwrite the
  // world matrices we computed in _applyWave / _applyWaveBlendOut.
  private _lockInstanceRotations() {
    const joints = [this._instanceArm, this._instanceElbow, this._instanceForearm, this._instanceHandLeft]
    for (const j of joints) {
      if (!j?.rotation) continue
      if (this._savedRotationSets.has(j)) continue  // already locked
      this._savedRotationSets.set(j, j.rotation.set.bind(j.rotation))
      j.rotation.set = () => j.rotation  // no-op, return self for chaining
    }

    // Block updateMatrixWorld on the instance shoulder subtree so the
    // render pass cannot overwrite our wave matrices.
    if (this._instanceShoulder && !this._savedUMWs.size) {
      const saveUMW = (obj: SceneObj) => {
        if (!obj) return
        this._savedUMWs.set(obj, obj.updateMatrixWorld.bind(obj))
        obj.updateMatrixWorld = () => {}  // no-op
        for (const c of (obj.children || [])) saveUMW(c)
      }
      saveUMW(this._instanceShoulder)
    }
  }

  private _unlockInstanceRotations() {
    for (const [j, origSet] of this._savedRotationSets) {
      try { j.rotation.set = origSet } catch { /* noop */ }
    }
    this._savedRotationSets.clear()

    // Restore updateMatrixWorld on instance subtree
    for (const [obj, origUMW] of this._savedUMWs) {
      try { obj.updateMatrixWorld = origUMW } catch { /* noop */ }
    }
    this._savedUMWs.clear()
  }

  /* ── Custom mirror: copy master rotations to instance every frame ────── */
  private _applyCustomMirror() {
    const pairs: [SceneObj | null, SceneObj | null][] = [
      [this._masterHandLeft, this._instanceHandLeft],
      [this._arm, this._instanceArm],
      [this._elbow, this._instanceElbow],
      [this._forearm, this._instanceForearm],
    ]
    for (const [master, inst] of pairs) {
      if (!master || !inst) continue
      try {
        // Use direct property writes (not .set()) so this works even when locked
        inst.rotation.x = master.rotation.x
        inst.rotation.y = master.rotation.y
        inst.rotation.z = master.rotation.z
        inst.updateMatrix()
        inst.updateWorldMatrix(false, true)
      } catch { /* noop */ }
    }
  }

  /* ── Render hook ──────────────────────────────────────────────────────── */
  private _hookRenderer() {
    const renderer = this.app?._renderer
    if (!renderer || typeof renderer.render !== 'function') {
       
      console.warn('[Lucid] cannot hook renderer')
      return
    }
    this._originalRender = renderer.render.bind(renderer)
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    renderer.render = function lucidRender(...args: any[]) {
      self._applyFrame()
      return self._originalRender!(...args)
    }
  }

  private _applyFrame() {
    const now = performance.now()

    /* Assembly phase — overrides everything else */
    if (this._assemblyActive) {
      this._applyAssembly(now)
      return
    }
    if (this._assemblyPrepared) {
      for (const m of this._assemblyParts) {
        try {
          m.obj.position.set(m.from.x, m.from.y, m.from.z)
          m.obj.rotation.set(m.fromRot.x, m.fromRot.y, m.fromRot.z)
          m.obj.scale.set(0.001, 0.001, 0.001)
          m.obj.updateMatrix?.()
        } catch { /* noop */ }
      }
      return
    }

    /* Breathing — subtle Y bob only, don't touch rotation (let LookAt) */
    if (this._breathingActive && this._body) {
      const t = (now - this._breathingStart) / 1000
      const bob = Math.sin(t * Math.PI * 0.5) * 0.9
      try { this._body.position.y = this._bodyRestY + bob } catch { /* noop */ }
    }

    /* Custom mirror: copy master rotations to instance (skip during wave & blend) */
    if (!this._waveActive && !this._waveBlendActive) this._applyCustomMirror()

    /* Wave blend-out: smooth return from wave end to mirror */
    if (this._waveBlendActive) this._applyWaveBlendOut(now)

    /* Wave — targets INSTANCE arm only */
    if (this._waveActive) this._applyWave(now)

    /* Head spin — additive on top of whatever LookAt set */
    if (this._headSpinActive) this._applyHeadSpin(now)
  }

  /* ── Wave ──────────────────────────────────────────────────────────────── */
  // Euler-based 3-phase wave on the INSTANCE (robot's right) arm:
  //   Peak pose: arm.z=+1.5, elbow.z=+1.5, forearm.x=-0.83 (hand above head).
  //   These 3 axes are the verified combination — any deviation breaks it.
  //   Wiggle: oscillate forearm.y around 0 to sway the hand side-to-side.
  //
  //   Phase 1 (raise): lerp from captured start to peak pose
  //   Phase 2 (hold + wiggle): hold peak, wiggle forearm.y
  //   Phase 3 (lower): lerp peak back to captured start
  // Then _applyWaveBlendOut smooths from the final pose to LIVE master
  // rotations, guaranteeing a symmetric return that matches the LEFT arm.
  private _applyWave(now: number) {
    const arm = this._instanceArm
    const elbow = this._instanceElbow
    const forearm = this._instanceForearm
    if (!arm || !elbow || !forearm) return

    const progress = Math.min((now - this._waveStartMs) / this._waveDurationMs, 1)
    const s = this._waveStart

    // Target (peak) pose — fixed values verified visually
    const PA_X = WAVE_ARM_X_PEAK; const PA_Y = WAVE_ARM_Y_PEAK; const PA_Z = WAVE_ARM_Z_PEAK
    const PE_X = WAVE_ELBOW_X_PEAK; const PE_Y = WAVE_ELBOW_Y_PEAK; const PE_Z = WAVE_ELBOW_Z_PEAK
    const PF_X = WAVE_FOREARM_X_PEAK
    const PF_Y = WAVE_FOREARM_Y_PEAK
    const PF_Z = WAVE_FOREARM_Z_PEAK

    let aX: number, aY: number, aZ: number
    let eX: number, eY: number, eZ: number
    let fX: number, fY: number, fZ: number

    if (progress < WAVE_RAISE_FRAC) {
      /* ─── Raise ─── */
      const t = easeOutCubic(progress / WAVE_RAISE_FRAC)
      aX = lerp(s.armX, PA_X, t); aY = lerp(s.armY, PA_Y, t); aZ = lerp(s.armZ, PA_Z, t)
      eX = lerp(s.elbowX, PE_X, t); eY = lerp(s.elbowY, PE_Y, t); eZ = lerp(s.elbowZ, PE_Z, t)
      fX = lerp(s.forearmX, PF_X, t); fY = lerp(s.forearmY, PF_Y, t); fZ = lerp(s.forearmZ, PF_Z, t)
    } else if (progress < 1 - WAVE_LOWER_FRAC) {
      /* ─── Hold + wiggle (oscillate forearm around elbow.z hinge) ─── */
      const wiggleP = (progress - WAVE_RAISE_FRAC) / (1 - WAVE_RAISE_FRAC - WAVE_LOWER_FRAC)
      const env = wiggleP < 0.15 ? wiggleP / 0.15 : wiggleP > 0.85 ? (1 - wiggleP) / 0.15 : 1
      const wig = Math.sin(wiggleP * Math.PI * 2 * WAVE_WIGGLE_CYCLES) * WAVE_WIGGLE_AMP * env
      aX = PA_X; aY = PA_Y; aZ = PA_Z
      eX = PE_X; eY = PE_Y; eZ = PE_Z + wig
      fX = PF_X; fY = PF_Y; fZ = PF_Z
    } else {
      /* ─── Lower (peak → start) ─── */
      const t = easeInOutCubic((progress - (1 - WAVE_LOWER_FRAC)) / WAVE_LOWER_FRAC)
      aX = lerp(PA_X, s.armX, t); aY = lerp(PA_Y, s.armY, t); aZ = lerp(PA_Z, s.armZ, t)
      eX = lerp(PE_X, s.elbowX, t); eY = lerp(PE_Y, s.elbowY, t); eZ = lerp(PE_Z, s.elbowZ, t)
      fX = lerp(PF_X, s.forearmX, t); fY = lerp(PF_Y, s.forearmY, t); fZ = lerp(PF_Z, s.forearmZ, t)
    }

    try {
      arm.rotation.x = aX; arm.rotation.y = aY; arm.rotation.z = aZ
      arm.updateMatrix(); arm.updateWorldMatrix(false, true)
      elbow.rotation.x = eX; elbow.rotation.y = eY; elbow.rotation.z = eZ
      elbow.updateMatrix(); elbow.updateWorldMatrix(false, true)
      forearm.rotation.x = fX; forearm.rotation.y = fY; forearm.rotation.z = fZ
      forearm.updateMatrix(); forearm.updateWorldMatrix(false, true)
    } catch { /* noop */ }

    if (progress >= 1) {
      this._waveBlendEnd = {
        armX: aX, armY: aY, armZ: aZ,
        elbowX: eX, elbowY: eY, elbowZ: eZ,
        forearmX: fX, forearmY: fY, forearmZ: fZ,
      }
      this._waveActive = false
      this._waveBlendActive = true
      this._waveBlendStart = now
      this._waveResolve?.()
      this._waveResolve = null
    }
  }

  wave(): Promise<boolean> {
    if (this._waveActive) return Promise.resolve(false)
    const arm = this._instanceArm
    const elbow = this._instanceElbow
    const forearm = this._instanceForearm
    if (!arm || !elbow || !forearm) return Promise.resolve(false)

    // Capture full start rotations from the currently-mirrored instance state
    const s = this._waveStart
    s.armX = arm.rotation.x; s.armY = arm.rotation.y; s.armZ = arm.rotation.z
    s.elbowX = elbow.rotation.x; s.elbowY = elbow.rotation.y; s.elbowZ = elbow.rotation.z
    s.forearmX = forearm.rotation.x; s.forearmY = forearm.rotation.y; s.forearmZ = forearm.rotation.z

    // Lock instance rotations to block Spline LookAt writes during wave
    this._lockInstanceRotations()

    this._waveActive = true
    this._waveStartMs = performance.now()
    return new Promise(resolve => { this._waveResolve = () => resolve(true) })
  }

  /* ── Wave blend-out: smooth return to live mirror ──────────────────────── */
  private _applyWaveBlendOut(now: number) {
    const arm = this._instanceArm
    const elbow = this._instanceElbow
    const forearm = this._instanceForearm
    const masterArm = this._arm
    const masterElbow = this._elbow
    const masterForearm = this._forearm
    if (!arm || !elbow || !forearm || !masterArm || !masterElbow || !masterForearm || !this._waveBlendEnd) {
      this._waveBlendActive = false
      this._unlockInstanceRotations()
      return
    }

    const t = Math.min((now - this._waveBlendStart) / WAVE_BLEND_OUT_MS, 1)
    const ease = easeOutCubic(t)
    const end = this._waveBlendEnd

    // Lerp every axis from wave-end pose toward live master (full symmetric return)
    arm.rotation.x = lerp(end.armX, masterArm.rotation.x, ease)
    arm.rotation.y = lerp(end.armY, masterArm.rotation.y, ease)
    arm.rotation.z = lerp(end.armZ, masterArm.rotation.z, ease)
    arm.updateMatrix(); arm.updateWorldMatrix(false, true)

    elbow.rotation.x = lerp(end.elbowX, masterElbow.rotation.x, ease)
    elbow.rotation.y = lerp(end.elbowY, masterElbow.rotation.y, ease)
    elbow.rotation.z = lerp(end.elbowZ, masterElbow.rotation.z, ease)
    elbow.updateMatrix(); elbow.updateWorldMatrix(false, true)

    forearm.rotation.x = lerp(end.forearmX, masterForearm.rotation.x, ease)
    forearm.rotation.y = lerp(end.forearmY, masterForearm.rotation.y, ease)
    forearm.rotation.z = lerp(end.forearmZ, masterForearm.rotation.z, ease)
    forearm.updateMatrix(); forearm.updateWorldMatrix(false, true)

    if (t >= 1) {
      this._waveBlendActive = false
      this._waveBlendEnd = null
      this._unlockInstanceRotations()
    }
  }

  /* ── Head spin ───────────────────────────────────────────────────────── */
  // Additive: spins the head around Y (neck axis) on top of whatever
  // LookAt set. Uses a delta approach so there's zero residual offset.
  private _applyHeadSpin(now: number) {
    if (!this._head) { this._headSpinActive = false; return }
    const p = Math.min((now - this._headSpinStart) / HEAD_SPIN_DURATION, 1)
    // Smooth acceleration / deceleration
    const cumulative = easeInOutCubic(p) * Math.PI * 2 * HEAD_SPIN_TURNS
    const delta = cumulative - this._headSpinPrevDelta
    try {
      this._head.rotation.y += delta
      this._head.updateMatrix()
    } catch { /* noop */ }
    this._headSpinPrevDelta = cumulative
    if (p >= 1) this._headSpinActive = false
  }

  headSpin(): Promise<boolean> {
    if (this._headSpinActive || !this._head) return Promise.resolve(false)
    this._headSpinStart = performance.now()
    this._headSpinPrevDelta = 0
    this._headSpinActive = true
    return new Promise(resolve => {
      window.setTimeout(() => resolve(true), HEAD_SPIN_DURATION + 50)
    })
  }

  /* ── Breathing ─────────────────────────────────────────────────────────── */
  startBreathing() {
    if (this._breathingActive) return
    this._breathingStart = performance.now()
    this._breathingActive = true
  }

  stopBreathing() {
    this._breathingActive = false
    if (this._body) {
      try { this._body.position.y = this._bodyRestY } catch { /* noop */ }
    }
  }

  /* ── Ambient idle loop ─────────────────────────────────────────────────── */
  startAmbient() {
    const schedule = () => {
      if (this._disposed) return
      this._ambientTimer = window.setTimeout(() => {
        if (this._disposed) return
        if (!this._waveActive && !this._headSpinActive) {
          this.headSpin()
        }
        schedule()
      }, HEAD_SPIN_INTERVAL)
    }
    schedule()
  }

  stopAmbient() {
    if (this._ambientTimer != null) {
      window.clearTimeout(this._ambientTimer)
      this._ambientTimer = null
    }
  }

  /* ── Assembly intro ────────────────────────────────────────────────────── */
  prepareAssembly() {
    const rootChildren = this.allObjects.filter(o =>
      o.type === 'Group' &&
      (o.obj?.parent?.name === 'Bot' || o.obj?.parent?.name === 'Top part')
    ).map(o => o.obj)
    const unique = Array.from(new Set(rootChildren))

    this._assemblyParts = unique.map((obj, i) => {
      const rest = this.restPoses.get(obj)
      if (!rest) return null
      const angle = (i / Math.max(1, unique.length)) * Math.PI * 2 + i * 0.9
      const radius = 900 + (i % 4) * 220
      return {
        obj,
        from: {
          x: rest.position.x + Math.cos(angle) * radius,
          y: rest.position.y + Math.sin(angle) * radius * 0.55 + (i % 2 ? 220 : -180),
          z: rest.position.z + Math.sin(angle * 1.7) * 320,
        },
        fromRot: {
          x: rest.rotation.x + (Math.random() - 0.5) * Math.PI * 1.4,
          y: rest.rotation.y + (Math.random() - 0.5) * Math.PI * 1.4,
          z: rest.rotation.z + (Math.random() - 0.5) * Math.PI * 1.4,
        },
        to: { x: rest.position.x, y: rest.position.y, z: rest.position.z },
        toRot: { x: rest.rotation.x, y: rest.rotation.y, z: rest.rotation.z },
        delay: Math.min(0.55, i * 0.05),
      }
    }).filter((x): x is NonNullable<typeof x> => x !== null)

    this._assemblyPrepared = true
    for (const m of this._assemblyParts) {
      try {
        m.obj.position.set(m.from.x, m.from.y, m.from.z)
        m.obj.rotation.set(m.fromRot.x, m.fromRot.y, m.fromRot.z)
        m.obj.scale.set(0.001, 0.001, 0.001)
        m.obj.updateMatrix?.()
      } catch { /* noop */ }
    }
  }

  startAssembly(): Promise<boolean> {
    if (this._assemblyParts.length === 0) return Promise.resolve(false)
    this._assemblyPrepared = false
    this._assemblyActive = true
    this._assemblyStart = performance.now()
    return new Promise(resolve => { this._assemblyResolve = () => resolve(true) })
  }

  private _applyAssembly(now: number) {
    const totalT = (now - this._assemblyStart) / this._assemblyDurationMs
    let allDone = true
    for (const m of this._assemblyParts) {
      const localT = (totalT - m.delay) / (1 - m.delay)
      const p = Math.max(0, Math.min(1, localT))
      if (p < 1) allDone = false
      const ePos = easeOutCubic(p)
      const eRot = easeInOutCubic(p)
      const eScale = easeOutBack(p)
      try {
        m.obj.position.x = lerp(m.from.x, m.to.x, ePos)
        m.obj.position.y = lerp(m.from.y, m.to.y, ePos)
        m.obj.position.z = lerp(m.from.z, m.to.z, ePos)
        m.obj.rotation.x = lerp(m.fromRot.x, m.toRot.x, eRot)
        m.obj.rotation.y = lerp(m.fromRot.y, m.toRot.y, eRot)
        m.obj.rotation.z = lerp(m.fromRot.z, m.toRot.z, eRot)
        const sc = Math.max(0.001, eScale)
        m.obj.scale.set(sc, sc, sc)
        // Preserve mirror flip on instance shoulder during assembly
        if (m.obj === this._instanceShoulder) m.obj.scale.x = -sc
        m.obj.updateMatrix?.()
      } catch { /* noop */ }
    }
    if (allDone && totalT > 1) {
      for (const m of this._assemblyParts) {
        try {
          m.obj.position.set(m.to.x, m.to.y, m.to.z)
          m.obj.rotation.set(m.toRot.x, m.toRot.y, m.toRot.z)
          m.obj.scale.set(1, 1, 1)
          // Preserve mirror flip on instance shoulder
          if (m.obj === this._instanceShoulder) m.obj.scale.x = -1
          m.obj.updateMatrix?.()
        } catch { /* noop */ }
      }
      this._assemblyActive = false
      this._assemblyResolve?.()
      this._assemblyResolve = null
    }
  }

  /* ── Cleanup ───────────────────────────────────────────────────────────── */
  dispose() {
    this._disposed = true
    this._breathingActive = false
    this._waveActive = false
    this._waveBlendActive = false
    this._headSpinActive = false
    this._assemblyActive = false
    this._assemblyPrepared = false
    this._waveResolve = null
    this._assemblyResolve = null
    this._unlockInstanceRotations()
    this.stopAmbient()

    const renderer = this.app?._renderer
    if (renderer && this._originalRender) {
      renderer.render = this._originalRender
      this._originalRender = null
    }

    for (const pose of this.restPoses.values()) {
      try {
        pose.obj.rotation.set(pose.rotation.x, pose.rotation.y, pose.rotation.z)
        pose.obj.position.set(pose.position.x, pose.position.y, pose.position.z)
        pose.obj.scale.set(pose.scale.x, pose.scale.y, pose.scale.z)
        pose.obj.updateMatrix?.()
      } catch { /* noop */ }
    }

    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any).__lucid
    }
  }

  /* ── Debug ─────────────────────────────────────────────────────────────── */
  private _installDebug() {
    if (typeof window === 'undefined') return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).__lucid = {
      list: () => {
         
        console.table(this.allObjects.map(o => ({ name: o.name, type: o.type })))
        return this.allObjects.map(o => o.name)
      },
      wave: () => this.wave(),
      spin: () => this.headSpin(),
      assemble: () => { this.prepareAssembly(); return this.startAssembly() },
      raw: this,
    }
     
    console.info('[Lucid] debug ready · window.__lucid.{wave,spin,assemble}')
  }
}
