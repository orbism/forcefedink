/**
 * Gold brushstrokes.
 *
 * A stroke is a spine curve plus a width profile, turned into a closed outline. The
 * outline is what gets painted; the spine is kept so the renderer can reveal the stroke
 * *along its own direction* by animating a thick dashed line as a mask. That is what
 * makes it read as a brush being drawn rather than a shape fading in.
 */

export type BrushStroke = {
  /** Closed outline of the stroke — filled. */
  outline: string
  /** Centre line, used as the reveal mask path. */
  spine: string
  /** Mask stroke width that comfortably covers the outline. */
  cover: number
}

export type BrushSet = {
  viewBox: string
  strokes: BrushStroke[]
}

const rng = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) >>> 0
  return seed / 0x100000000
}

const r2 = (n: number) => Math.round(n * 10) / 10

type Pt = [number, number]

/** Quadratic spine through three control points, sampled evenly. */
function sampleSpine(p0: Pt, p1: Pt, p2: Pt, steps: number): Pt[] {
  const pts: Pt[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const u = 1 - t
    pts.push([
      u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
      u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
    ])
  }
  return pts
}

/**
 * Width along the stroke: lands thick, swells, lifts off to a point. The small noise
 * term is what keeps it from looking like a vector teardrop.
 */
const widthAt = (t: number, max: number, wobble: number) => {
  const body = Math.sin(Math.PI * Math.min(1, t * 1.15)) ** 0.55
  const lift = 1 - t ** 3 * 0.55
  return Math.max(0.6, max * body * lift * (1 + wobble))
}

function outlineFrom(spine: Pt[], maxWidth: number, rand: () => number): string {
  const left: Pt[] = []
  const right: Pt[] = []

  for (let i = 0; i < spine.length; i++) {
    const t = i / (spine.length - 1)
    const prev = spine[Math.max(0, i - 1)]
    const next = spine[Math.min(spine.length - 1, i + 1)]
    const dx = next[0] - prev[0]
    const dy = next[1] - prev[1]
    const len = Math.hypot(dx, dy) || 1
    // Normal to the direction of travel.
    const nx = -dy / len
    const ny = dx / len
    const w = widthAt(t, maxWidth, (rand() - 0.5) * 0.22) / 2
    left.push([spine[i][0] + nx * w, spine[i][1] + ny * w])
    right.push([spine[i][0] - nx * w, spine[i][1] - ny * w])
  }

  const path = [...left, ...right.reverse()]
  let d = `M${r2(path[0][0])} ${r2(path[0][1])}`
  for (let i = 1; i < path.length; i++) d += `L${r2(path[i][0])} ${r2(path[i][1])}`
  return `${d}Z`
}

const toPolyline = (pts: Pt[]) =>
  pts.reduce(
    (d, p, i) => d + (i === 0 ? `M${r2(p[0])} ${r2(p[1])}` : `L${r2(p[0])} ${r2(p[1])}`),
    '',
  )

/**
 * A loose fan of strokes sweeping across the box. Deterministic per seed, so a section
 * redraws the same marks until it deliberately picks a new seed.
 */
export function brushSet(seed: number, count = 4, size = 400): BrushSet {
  const rand = rng(seed)
  const strokes: BrushStroke[] = []

  // One shared gesture angle, with each stroke offset along the perpendicular. Placing
  // them independently just piles them on top of each other into a blob.
  const base = (-42 + (rand() - 0.5) * 16) * (Math.PI / 180)
  const nx = -Math.sin(base)
  const ny = Math.cos(base)
  const spacing = size * 0.17

  for (let i = 0; i < count; i++) {
    const rank = i - (count - 1) / 2
    const angle = base + (rand() - 0.5) * 0.22
    const length = size * (0.46 + rand() * 0.34)

    // Centre of this stroke: box centre, pushed out along the normal, lightly jittered.
    const offset = rank * spacing + (rand() - 0.5) * size * 0.05
    const cx = size * 0.5 + nx * offset + (rand() - 0.5) * size * 0.06
    const cy = size * 0.52 + ny * offset + (rand() - 0.5) * size * 0.06

    const half = length / 2
    const start: Pt = [cx - Math.cos(angle) * half, cy - Math.sin(angle) * half]
    const end: Pt = [cx + Math.cos(angle) * half, cy + Math.sin(angle) * half]

    // Bow the stroke off the straight line so the hand shows.
    const bow = (rand() - 0.5) * size * 0.14
    const mid: Pt = [(start[0] + end[0]) / 2 - nx * bow, (start[1] + end[1]) / 2 - ny * bow]

    const spine = sampleSpine(start, mid, end, 26)
    // Kept thin enough that neighbouring strokes stay separate marks.
    const maxWidth = size * (0.016 + rand() * 0.03)

    strokes.push({
      outline: outlineFrom(spine, maxWidth, rand),
      spine: toPolyline(spine),
      cover: maxWidth * 1.7,
    })
  }

  return { viewBox: `0 0 ${size} ${size}`, strokes }
}
