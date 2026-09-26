/**
 * Ink shapes as single crisp outlines rather than fused circles.
 *
 * A blot is a polar outline: a slow wobble for the body, a scalloped rim, and sharp tapered
 * spikes where the ink was thrown past the edge. Spikes get their own dense sampling, so
 * they stay needle-sharp without paying for dense sampling everywhere.
 */
export type Rand = () => number
export type Pt = [number, number]

export const rng = (seed: number): Rand => () => {
  seed = (seed * 1664525 + 1013904223) >>> 0
  return seed / 0x100000000
}
export const gaussOf = (rand: Rand) => () => (rand() + rand() + rand() - 1.5) / 1.5

const f1 = (n: number) => Math.round(n * 10) / 10
export const pathOf = (pts: Pt[], closed = true) =>
  pts.reduce((d, [x, y], i) => d + (i ? 'L' : 'M') + f1(x) + ' ' + f1(y), '') + (closed ? 'Z' : '')

type Spike = { a: number; len: number; w: number }

export type BlotOpts = {
  spikes?: number
  /** Throw direction; spikes cluster around it. Omit for an even crown. */
  bias?: number
  spread?: number
  /** Longest spike as a fraction of R. */
  reach?: number
  /** Small drips all round the rim, like ink that landed flat. */
  scallops?: number
}

export function blot(rand: Rand, cx: number, cy: number, R: number, o: BlotOpts = {}) {
  const gauss = gaussOf(rand)
  const { spikes = 20, bias, spread = 0.9, reach = 0.6, scallops = 30 } = o
  const ph = [0, 1, 2, 3].map(() => rand() * Math.PI * 2)
  const list: Spike[] = []
  for (let i = 0; i < spikes; i++) {
    const a = bias === undefined ? rand() * Math.PI * 2 : bias + gauss() * spread
    // Mostly short, a few long: rand² skews toward the short end.
    list.push({ a, len: R * reach * (0.15 + rand() ** 2 * 0.85), w: 0.012 + rand() * 0.03 })
  }
  for (let i = 0; i < scallops; i++) list.push({ a: rand() * Math.PI * 2, len: R * (0.02 + rand() * 0.06), w: 0.02 + rand() * 0.04 })

  const angles: number[] = []
  for (let i = 0; i < 360; i++) angles.push((i / 360) * Math.PI * 2)
  for (const s of list) for (let j = -5; j <= 5; j++) angles.push(s.a + (s.w * j) / 4)
  const norm = (a: number) => ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
  const sorted = angles.map(norm).sort((a, b) => a - b)

  const radius = (t: number) => {
    let r = R * (1 + 0.05 * Math.sin(2 * t + ph[0]) + 0.03 * Math.sin(5 * t + ph[1]) + 0.014 * Math.sin(11 * t + ph[2]) + 0.006 * Math.sin(31 * t + ph[3]))
    for (const s of list) {
      const d = Math.abs(Math.atan2(Math.sin(t - s.a), Math.cos(t - s.a)))
      if (d < s.w) r += s.len * (1 - d / s.w) ** 2.2
    }
    return r
  }
  const pts: Pt[] = sorted.map((t) => [cx + Math.cos(t) * radius(t), cy + Math.sin(t) * radius(t)])
  const tips = list.filter((s) => s.len > R * 0.12).map((s) => ({ a: s.a, x: cx + Math.cos(s.a) * (R + s.len), y: cy + Math.sin(s.a) * (R + s.len), len: s.len }))
  return { d: pathOf(pts), tips }
}

/**
 * A thrown streak: needle-thin where it left the body, thickening toward the far end where
 * the ink finally lands as a bead. `broken` splits it into dashes, the dry-flick look.
 */
export function streak(rand: Rand, x: number, y: number, a: number, len: number, w0: number, w1: number, broken = false) {
  const ux = Math.cos(a), uy = Math.sin(a), nx = -uy, ny = ux
  const segs = broken ? 2 + Math.floor(rand() * 3) : 1
  const out: string[] = []
  for (let s = 0; s < segs; s++) {
    const t0 = s / segs + (broken && s ? 0.06 : 0)
    const t1 = (s + 1) / segs - (broken ? 0.04 : 0)
    const p = (t: number, side: number): Pt => {
      const w = (w0 + (w1 - w0) * t) / 2
      return [x + ux * len * t + nx * w * side, y + uy * len * t + ny * w * side]
    }
    out.push(pathOf([p(t0, 1), p(t1, 1), p(t1, -1), p(t0, -1)]))
  }
  return { paths: out, end: [x + ux * len, y + uy * len] as Pt }
}
