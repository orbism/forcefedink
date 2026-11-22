/**
 * Ink splatter from drop physics, rendered to pixels once.
 *
 * Geometry is drawn as plain shapes into two masks (gooey bodies, fine mist), then shaded per
 * pixel: a height field from the blurred mask gives a domed meniscus, its gradient gives
 * normals for diffuse and specular light, and mask minus height gives the drying edge where
 * pigment collects. Returns a wet image and a dry image of the same mark; on the page only
 * their opacity changes.
 *
 * Pure and DOM-free when OffscreenCanvas exists, so it runs in a worker (ink.worker.ts).
 */

export type InkParams = {
  W: number
  H: number
  seed: number
  /** Direction of travel, radians (0 = rightward). */
  dir: number
  /** Landing angle in degrees: 90 lands a round crown, low angles throw long spray. */
  impact: number
  /** 0–1: size of the throw and how far it flies. */
  force: number
}
export type InkResult = { wet: ImageData; dry: ImageData; cx: number; cy: number }

type Ctx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D

const rng = (seed: number) => {
  let s = seed >>> 0 || 1
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296
}
const gaussOf = (r: () => number) => () => (r() + r() + r() - 1.5) / 1.5
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v)
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}

/** Leaf: metallic gold that catches the light while wet. Dark → light colour ramp. */
const LEAF = [
  [0, '#24160a'],
  [0.42, '#6a4815'],
  [0.6, '#b08636'],
  [0.74, '#ddb965'],
  [0.88, '#f6e3a6'],
  [1, '#fffaf0'],
] as const
const TONE = { spec: 1, rimWet: 0.16, rimDry: 0.5, body: 1, flat: 0.62 }

const LUT = (() => {
  const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
  const out = new Uint8ClampedArray(256 * 3)
  for (let i = 0; i < 256; i++) {
    const t = i / 255
    let k = 0
    while (k < LEAF.length - 2 && t > LEAF[k + 1][0]) k++
    const [t0, c0] = LEAF[k]
    const [t1, c1] = LEAF[k + 1]
    const f = clamp((t - t0) / (t1 - t0), 0, 1)
    const a = hex(c0)
    const b = hex(c1)
    for (let j = 0; j < 3; j++) out[i * 3 + j] = a[j] + (b[j] - a[j]) * f
  }
  return out
})()

/** Separable box blur, in place on `s` (`d` is scratch). */
function blurPass(s: Float32Array, d: Float32Array, W: number, H: number, r: number) {
  const k = 1 / (2 * r + 1)
  for (let y = 0; y < H; y++) {
    const o = y * W
    let acc = 0
    for (let i = -r; i <= r; i++) acc += s[o + clamp(i, 0, W - 1)]
    for (let x = 0; x < W; x++) {
      d[o + x] = acc * k
      acc += s[o + Math.min(W - 1, x + r + 1)] - s[o + Math.max(0, x - r)]
    }
  }
  for (let x = 0; x < W; x++) {
    let acc = 0
    for (let i = -r; i <= r; i++) acc += d[clamp(i, 0, H - 1) * W + x]
    for (let y = 0; y < H; y++) {
      s[y * W + x] = acc * k
      acc += d[Math.min(H - 1, y + r + 1) * W + x] - d[Math.max(0, y - r) * W + x]
    }
  }
}
const blur = (s: Float32Array, tmp: Float32Array, W: number, H: number, r: number, n: number) => {
  for (let i = 0; i < n; i++) blurPass(s, tmp, W, H, r)
}

function valueNoise(W: number, H: number, cell: number, rand: () => number) {
  const gw = Math.ceil(W / cell) + 2
  const gh = Math.ceil(H / cell) + 2
  const g = new Float32Array(gw * gh)
  for (let i = 0; i < g.length; i++) g[i] = rand()
  const out = new Float32Array(W * H)
  for (let y = 0; y < H; y++) {
    const fy = y / cell, iy = fy | 0, ty = fy - iy, sy = ty * ty * (3 - 2 * ty)
    for (let x = 0; x < W; x++) {
      const fx = x / cell, ix = fx | 0, tx = fx - ix, sx = tx * tx * (3 - 2 * tx)
      const a = g[iy * gw + ix], b = g[iy * gw + ix + 1], c = g[(iy + 1) * gw + ix], d = g[(iy + 1) * gw + ix + 1]
      out[y * W + x] = a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy
    }
  }
  return out
}

function mask(W: number, H: number): Ctx {
  const c = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(W, H) : Object.assign(document.createElement('canvas'), { width: W, height: H })
  const x = c.getContext('2d', { willReadFrequently: true }) as Ctx
  x.fillStyle = '#fff'
  return x
}

export function inkRender({ W, H, seed, dir, impact, force }: InkParams): InkResult {
  const r = rng(seed)
  const g = gaussOf(r)
  const u = W / 700
  const R0 = 40 * u * (0.75 + 0.55 * force)
  const elong = Math.min(3, 1 / Math.sin((impact * Math.PI) / 180))
  const ex = 1 + (elong - 1) * 0.45
  const shift = R0 * (ex - 1) * 0.6
  const tx = Math.cos(dir), ty = Math.sin(dir)
  const cx = W / 2 - tx * W * 0.24, cy = H / 2 - ty * H * 0.24
  const toG = (lx: number, ly: number): [number, number] => [cx + lx * tx - ly * ty, cy + lx * ty + ly * tx]

  const A = mask(W, H), B = mask(W, H)
  const dot = (ctx: Ctx, x: number, y: number, rad: number) => {
    ctx.moveTo(x + rad, y)
    ctx.arc(x, y, rad, 0, Math.PI * 2)
  }
  const ell = (ctx: Ctx, x: number, y: number, rx: number, ry: number, a: number) => {
    ctx.moveTo(x + Math.cos(a) * rx, y + Math.sin(a) * rx)
    ctx.ellipse(x, y, rx, ry, a, 0, Math.PI * 2)
  }

  // Body: a polar outline, stretched along the line of travel.
  const ph = [0, 1, 2, 3].map(() => r() * Math.PI * 2)
  const Rf = (th: number) =>
    R0 * (1 + 0.07 * Math.sin(2 * th + ph[0]) + 0.045 * Math.sin(5 * th + ph[1]) + 0.02 * Math.sin(11 * th + ph[2]) + 0.01 * Math.sin(23 * th + ph[3]))
  A.beginPath()
  for (let i = 0; i <= 240; i++) {
    const th = (i / 240) * Math.PI * 2, rr = Rf(th)
    const [x, y] = toG(Math.cos(th) * rr * ex + shift, Math.sin(th) * rr)
    if (i) A.lineTo(x, y)
    else A.moveTo(x, y)
  }
  A.fill()
  // The drop often breaks on impact: a second body downstream.
  if (r() < 0.65) {
    const d = R0 * (1.5 + 0.9 * r()) * ex, rr = R0 * (0.28 + 0.2 * r())
    A.beginPath()
    const [x, y] = toG(d + shift, g() * R0 * 0.3)
    ell(A, x, y, rr * (1 + (ex - 1) * 0.6), rr, dir)
    A.fill()
  }

  // Crown fingers, longest downstream; some pinch off into a bead.
  const nf = Math.round(16 + force * 22)
  A.beginPath()
  for (let i = 0; i < nf; i++) {
    const th = ((i + 0.5 * g()) / nf) * Math.PI * 2
    const c = Math.cos(th), w = Math.max(0, c) ** 1.4, up = Math.max(0, -c)
    const len = R0 * (0.1 + 0.26 * r() + w * (0.5 + 1.6 * force) * (0.5 + 0.5 * r()) * (0.7 + 0.3 * (elong - 1))) * (1 - 0.6 * up * (1 - 1 / elong))
    const wid = R0 * (0.065 + 0.06 * r())
    const rr = Rf(th) * 0.9
    let dx = Math.cos(th) + 0.25 * w, dy = Math.sin(th)
    const n = Math.hypot(dx, dy)
    dx /= n
    dy /= n
    const bx = Math.cos(th) * rr * ex + shift, by = Math.sin(th) * rr
    const detach = r() < 0.18 + 0.5 * w * force
    const steps = Math.max(6, Math.round(len / (wid * 0.4)))
    for (let k = 0; k <= steps; k++) {
      const t = k / steps
      if (detach && t > 0.7) break
      const [x, y] = toG(bx + dx * len * t, by + dy * len * t)
      dot(A, x, y, wid * (1 - 0.72 * t ** 0.8))
    }
    if (detach) {
      const L = len * (1.08 + 0.3 * r()) + wid * 1.5
      const [x, y] = toG(bx + dx * L, by + dy * L)
      ell(A, x, y, wid * (0.5 + 0.35 * r()) * 1.35, wid * (0.45 + 0.3 * r()), dir + Math.atan2(dy, dx))
    } else {
      const [x, y] = toG(bx + dx * len, by + dy * len)
      dot(A, x, y, wid * 0.55 * (0.8 + 0.5 * r()))
    }
  }
  A.fill()

  // Satellites: ballistic drops. Shallow landings stretch them and leave a tail pointing onward.
  const iso = (impact - 15) / 75
  const spread = 0.35 + iso * 2.6
  const ns = Math.round(14 + force * 46)
  const goo = 1.6 * u
  A.beginPath()
  B.beginPath()
  for (let i = 0; i < ns; i++) {
    const th = iso > 0.85 && r() < 0.5 ? r() * Math.PI * 2 : g() * spread
    const fw = Math.max(0, Math.cos(th))
    const d = R0 * (1.35 + -Math.log(1 - r() * 0.97) * (1 + 2.4 * force) * (0.6 + 0.8 * fw)) * (1 + (ex - 1) * fw)
    const rr = Math.max(0.9 * u, R0 * (0.035 + 0.12 * r()) * Math.exp(-(d / R0 - 1.3) / 3.4))
    const as = Math.max(10, impact * (0.35 + 0.55 * r()))
    const e = Math.min(4.2, 1 / Math.sin((as * Math.PI) / 180))
    const [x, y] = toG(Math.cos(th) * d + shift, Math.sin(th) * d)
    const ang = dir + th, ux = Math.cos(ang), uy = Math.sin(ang)
    const ctx = rr > goo * 1.1 ? A : B
    ell(ctx, x, y, rr * e, rr, ang)
    if (e > 1.4) {
      const sx = x + ux * rr * e * 0.7, sy = y + uy * rr * e * 0.7
      const L = rr * e * (0.6 + 0.8 * r())
      ctx.moveTo(sx - uy * rr * 0.55, sy + ux * rr * 0.55)
      ctx.lineTo(sx + ux * L, sy + uy * L)
      ctx.lineTo(sx + uy * rr * 0.55, sy - ux * rr * 0.55)
      ctx.closePath()
      if (r() < 0.45) dot(B, sx + ux * (L + rr * 0.9), sy + uy * (L + rr * 0.9), Math.max(0.6 * u, rr * 0.28))
    }
  }
  A.fill()
  B.fill()

  // Mist: fine spray, mostly downstream.
  const nm = Math.round(120 + force * 300)
  B.beginPath()
  for (let i = 0; i < nm; i++) {
    const th = r() < 0.85 ? g() * spread * 1.3 : r() * Math.PI * 2
    const d = R0 * (1.2 + r() ** 0.7 * (4 + 6 * force))
    const [x, y] = toG(Math.cos(th) * d + shift, Math.sin(th) * d)
    dot(B, x, y, (0.35 + r() ** 2 * 1.2) * u * 0.9)
  }
  B.fill()

  // --- shading ---------------------------------------------------------------------
  const N = W * H
  const a = A.getImageData(0, 0, W, H).data, b = B.getImageData(0, 0, W, H).data
  const F = new Float32Array(N), tmp = new Float32Array(N), M = new Float32Array(N)
  for (let i = 0; i < N; i++) F[i] = a[i * 4 + 3] / 255
  blur(F, tmp, W, H, Math.max(1, Math.round(goo)), 2)
  for (let i = 0; i < N; i++) M[i] = Math.max(smooth(0.38, 0.62, F[i]), b[i * 4 + 3] / 255)
  const Hh = M.slice()
  blur(Hh, tmp, W, H, Math.max(2, Math.round(4.5 * u)), 3)
  const Hs = M.slice()
  blur(Hs, tmp, W, H, Math.max(1, Math.round(1.2 * u)), 2)
  const low = valueNoise(W, H, 60 * u, r)
  const fine = new Float32Array(N)
  for (let i = 0; i < N; i++) fine[i] = r()
  const fineB = fine.slice()
  blur(fineB, tmp, W, H, 1, 1)

  const wet = new ImageData(W, H), dry = new ImageData(W, H)
  const wd = wet.data, dd = dry.data
  let Lx = -0.5, Ly = -0.6, Lz = 0.62
  const ln = Math.hypot(Lx, Ly, Lz)
  Lx /= ln
  Ly /= ln
  Lz /= ln
  let Hx = Lx, Hy = Ly, Hz = Lz + 1
  const hn = Math.hypot(Hx, Hy, Hz)
  Hx /= hn
  Hy /= hn
  Hz /= hn
  const K = 9 * u
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x
      const m = M[i]
      if (m < 0.004) continue
      const gx = 0.65 * (Hh[i + 1] - Hh[i - 1]) + 0.35 * (Hs[i + 1] - Hs[i - 1])
      const gy = 0.65 * (Hh[i + W] - Hh[i - W]) + 0.35 * (Hs[i + W] - Hs[i - W])
      const nx = -gx * K, ny = -gy * K, inv = 1 / Math.sqrt(nx * nx + ny * ny + 1)
      const diff = (nx * Lx + ny * Ly + Lz) * inv
      const nh = (nx * Hx + ny * Hy + Hz) * inv
      const spec = nh > 0 ? nh ** 48 : 0
      const rim = clamp((m - Hh[i]) * 2.2, 0, 1)
      const nl = low[i] - 0.5, nf = fineB[i] - 0.5
      const o = i * 4

      // Wet: a glossy dome.
      let li = (clamp(diff * 0.98 + nl * 0.1, 0, 1) * 255) | 0
      let dark = 1 - TONE.rimWet * rim
      let s = spec * TONE.spec * 255
      wd[o] = LUT[li * 3] * dark + s
      wd[o + 1] = LUT[li * 3 + 1] * dark + s * 0.96
      wd[o + 2] = LUT[li * 3 + 2] * dark + s * 0.82
      wd[o + 3] = 255 * m * (TONE.body + (1 - TONE.body) * rim * 0.9)

      // Dry: flatter, a pigment ring, granulation, a few mica glints.
      const df = TONE.flat + (diff - TONE.flat) * 0.32
      li = (clamp(df + nl * 0.16 - nf * 0.16, 0, 1) * 255) | 0
      dark = 1 - TONE.rimDry * rim
      s = (fine[i] > 0.9975 && diff > 0.6 ? 110 : 0) * TONE.spec
      dd[o] = LUT[li * 3] * dark + s
      dd[o + 1] = LUT[li * 3 + 1] * dark + s * 0.95
      dd[o + 2] = LUT[li * 3 + 2] * dark + s * 0.8
      dd[o + 3] = 255 * m * (TONE.body * 0.9 + (1 - TONE.body * 0.9) * rim) * (1 - nf * 0.12)
    }
  }
  return { wet, dry, cx, cy }
}
