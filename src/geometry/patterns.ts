/**
 * North African star patterns by Hankin's polygons-in-contact method.
 *
 * Take a periodic tiling; from the midpoint of every edge send two rays into each
 * neighbouring tile at a contact angle θ; where rays from adjacent edges meet, stop.
 * Because neighbouring tiles share midpoints, the lines run on across tile boundaries and
 * the whole plane closes into one continuous star pattern. One tiling and one angle give one
 * traditional pattern — 4.8.8 at 67.5° is the Moroccan eight-fold, 3.12.12 gives twelve-fold
 * rosettes — so variety comes from real constructions, not decoration.
 */

type Pt = [number, number]
type Poly = Pt[]

export type Hue = 'gold' | 'white' | 'haze'
export type GeoPath = {
  d: string
  hue: Hue
  weight: number
  /** 0 = the principal star tiles; others are the connecting figures. */
  kind?: number
}
/** Rendering traits a preset asks for, beyond the linework itself. */
export type Finish = {
  /** Each ribbon cuts a gap in the one beneath it: over-under strapwork. */
  interlace?: boolean
  /** Star wells flood with a translucent glaze once the pen closes them (cuenca). */
  glaze?: boolean
}

export type Geometry = {
  viewBox: string
  finish: Finish
  paths: GeoPath[]
  /** Distance of each path from the anchored corner, in viewBox units. */
  dists: number[]
}

const TAU = Math.PI * 2
const r2 = (n: number) => Math.round(n * 10) / 10

const ngon = (cx: number, cy: number, R: number, n: number, rot: number): Poly =>
  Array.from({ length: n }, (_, k) => [cx + R * Math.cos(rot + (k * TAU) / n), cy + R * Math.sin(rot + (k * TAU) / n)])

/* --- tilings (all polygons counter-clockwise in screen space) -------------------- */

/** Region to tile, in viewBox units. */
type Bounds = { x0: number; y0: number; x1: number; y1: number }
type Tiling = (size: number, b: Bounds) => { poly: Poly; kind: number }[]

const range = (lo: number, hi: number, step: number) => {
  const out: number[] = []
  for (let i = Math.floor(lo / step) - 1; i <= Math.ceil(hi / step) + 1; i++) out.push(i)
  return out
}

/** 4.8.8 — octagons with squares between: the ground of Moroccan eight-fold zellij. */
const truncatedSquare: Tiling = (s, b) => {
  const a = s * (1 + Math.SQRT2)
  const out: { poly: Poly; kind: number }[] = []
  for (const j of range(b.y0, b.y1, a))
    for (const i of range(b.x0, b.x1, a)) {
      out.push({ poly: ngon(i * a, j * a, s / (2 * Math.sin(Math.PI / 8)), 8, Math.PI / 8), kind: 0 })
      out.push({ poly: ngon((i + 0.5) * a, (j + 0.5) * a, s / Math.SQRT2, 4, 0), kind: 1 })
    }
  return out
}

/** 3.12.12 — dodecagons on a triangular lattice, triangles in the gaps: twelve-fold. */
const truncatedHex: Tiling = (s, b) => {
  const d = s * (2 + Math.sqrt(3))
  const R = s / (2 * Math.sin(Math.PI / 12))
  const out: { poly: Poly; kind: number }[] = []
  for (const j of range(b.y0, b.y1, d * (Math.sqrt(3) / 2)))
    for (const i of range(b.x0, b.x1, d)) {
      const x = i * d + (Math.abs(j) % 2 ? d / 2 : 0)
      const y = j * d * (Math.sqrt(3) / 2)
      out.push({ poly: ngon(x, y, R, 12, Math.PI / 12), kind: 0 })
      const t = s / Math.sqrt(3)
      // Up and down triangles at the centroids of the lattice triangles.
      out.push({ poly: ngon(x + d / 2, y + d / (2 * Math.sqrt(3)), t, 3, Math.PI / 6 + Math.PI), kind: 1 })
      out.push({ poly: ngon(x + d / 2, y - d / (2 * Math.sqrt(3)), t, 3, Math.PI / 6), kind: 1 })
    }
  return out
}

/** 6.6.6 — hexagons: six-fold stars and the woven "tatami" grounds. */
const hexagonal: Tiling = (s, b) => {
  const w = s * Math.sqrt(3)
  const out: { poly: Poly; kind: number }[] = []
  for (const j of range(b.y0, b.y1, 1.5 * s))
    for (const i of range(b.x0, b.x1, w))
      out.push({ poly: ngon(i * w + (Math.abs(j) % 2 ? w / 2 : 0), j * 1.5 * s, s, 6, Math.PI / 6), kind: 0 })
  return out
}

/** 4.4.4.4 — the square grid: khatam stars and crosses. */
const square: Tiling = (s, b) => {
  const out: { poly: Poly; kind: number }[] = []
  for (const j of range(b.y0, b.y1, s))
    for (const i of range(b.x0, b.x1, s)) out.push({ poly: ngon((i + 0.5) * s, (j + 0.5) * s, s / Math.SQRT2, 4, Math.PI / 4), kind: 0 })
  return out
}

/**
 * 4.6.12 — dodecagons on a triangular lattice, a square between each pair and a hexagon in
 * each gap: the ground of the Anatolian (Seljuk / kündekâri) twelve-point star panels.
 * Spacing s(3+√3) = two dodecagon apothems plus the square between them.
 */
const truncatedTrihex: Tiling = (s, b) => {
  const d = s * (3 + Math.sqrt(3))
  const R = s / (2 * Math.sin(Math.PI / 12))
  const row = d * (Math.sqrt(3) / 2)
  const out: { poly: Poly; kind: number }[] = []
  for (const j of range(b.y0, b.y1, row))
    for (const i of range(b.x0, b.x1, d)) {
      const x = i * d + (Math.abs(j) % 2 ? d / 2 : 0)
      const y = j * row
      out.push({ poly: ngon(x, y, R, 12, Math.PI / 12), kind: 0 })
      // Squares toward the neighbours at 0°, 60° and 120° (the others belong to them).
      for (const a of [0, Math.PI / 3, (2 * Math.PI) / 3])
        out.push({ poly: ngon(x + (Math.cos(a) * d) / 2, y + (Math.sin(a) * d) / 2, s / Math.SQRT2, 4, a + Math.PI / 4), kind: 1 })
      // Hexagons in the two triangular gaps below-right and above-right.
      for (const a of [Math.PI / 6, -Math.PI / 6])
        out.push({ poly: ngon(x + (Math.cos(a) * d) / Math.sqrt(3), y + (Math.sin(a) * d) / Math.sqrt(3), s, 6, 0), kind: 2 })
    }
  return out
}

const TILINGS = { truncatedSquare, truncatedHex, hexagonal, square, truncatedTrihex }

/* --- polygons in contact ---------------------------------------------------------- */

const rot = ([x, y]: Pt, a: number): Pt => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)]
const norm = ([x, y]: Pt): Pt => {
  const l = Math.hypot(x, y) || 1
  return [x / l, y / l]
}

/** Intersection of p + t·u and q + s·v, or null if they don't meet ahead of both. */
function meet(p: Pt, u: Pt, q: Pt, v: Pt, limit: number): Pt | null {
  const den = u[0] * v[1] - u[1] * v[0]
  if (Math.abs(den) < 1e-9) return null
  const t = ((q[0] - p[0]) * v[1] - (q[1] - p[1]) * v[0]) / den
  const s = ((q[0] - p[0]) * u[1] - (q[1] - p[1]) * u[0]) / den
  if (t <= 0 || s <= 0 || t > limit || s > limit) return null
  return [p[0] + t * u[0], p[1] + t * u[1]]
}

/** One closed motif per tile: midpoint → contact point → next midpoint → … */
function hankin(poly: Poly, theta: number): string {
  const n = poly.length
  const mids: Pt[] = poly.map((a, i) => {
    const b = poly[(i + 1) % n]
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
  })
  const edge = (i: number) => {
    const a = poly[i]
    const b = poly[(i + 1) % n]
    return norm([b[0] - a[0], b[1] - a[1]])
  }
  const reach = Math.hypot(poly[0][0] - poly[1][0], poly[0][1] - poly[1][1]) * 4
  const c: Pt = [poly.reduce((t, p) => t + p[0], 0) / n, poly.reduce((t, p) => t + p[1], 0) / n]
  // Winding flips between math and screen space, so "inward" is decided against the
  // centroid rather than assumed from the rotation sign.
  const inward = (m: Pt, dir: Pt): Pt => {
    const a = rot(dir, theta)
    const b = rot(dir, -theta)
    return (a[0] * (c[0] - m[0]) + a[1] * (c[1] - m[1])) >= (b[0] * (c[0] - m[0]) + b[1] * (c[1] - m[1])) ? a : b
  }
  let d = ''
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    // Ray from edge i toward its end vertex, and from edge j back toward the same vertex.
    const u = inward(mids[i], edge(i))
    const v = inward(mids[j], [-edge(j)[0], -edge(j)[1]])
    const p = meet(mids[i], u, mids[j], v, reach)
    if (!p) continue
    d += `M${r2(mids[i][0])} ${r2(mids[i][1])}L${r2(p[0])} ${r2(p[1])}L${r2(mids[j][0])} ${r2(mids[j][1])}`
  }
  return d
}

/* --- presets ----------------------------------------------------------------------- */

export type PatternName = keyof typeof PRESETS

type Preset = {
  tiling: keyof typeof TILINGS
  tile: number
  theta: number
  accent?: boolean
  /**
   * A second contact angle run over the same tiles, drawn pale. Two Hankin passes interleave
   * into a denser, more intricate field than either alone — the layered look of fine zellij.
   */
  weave?: number
} & Finish

/**
 * Each page gets its own construction. θ is in degrees from the edge; the tile size sets
 * density against the 1000-unit viewBox.
 */
export const PRESETS = {
  /** The landing page's: twelve-fold rosettes woven with needle stars — two passes. */
  medina: { tiling: 'truncatedHex', tile: 50, theta: 60, weave: 80, accent: true },
  /**
   * Sevillian cuenca y arista: lazo de ocho — raised ribbon strapwork forming eight-point
   * stars, with glazed wells.
   */
  cuenca: { tiling: 'truncatedSquare', tile: 74, theta: 67.5, accent: true, interlace: true, glaze: true },
  /** Anatolian (Seljuk, kündekâri): twelve-point stars ringed by six-point rosettes on 4.6.12. */
  konya: { tiling: 'truncatedTrihex', tile: 70, theta: 72, accent: true, interlace: true },
  /** Moroccan eight-fold: stars in the octagons, crosses in the squares. */
  fez: { tiling: 'truncatedSquare', tile: 92, theta: 67.5, accent: true },
  /** Twelve-fold rosettes. */
  marrakech: { tiling: 'truncatedHex', tile: 70, theta: 60, accent: true },
  /** Six-fold interlace. */
  kairouan: { tiling: 'hexagonal', tile: 105, theta: 60 },
  /** Khatam stars on the square grid. */
  tlemcen: { tiling: 'square', tile: 170, theta: 67.5 },
  /** Open eight-fold lattice, lighter than fez. */
  rabat: { tiling: 'truncatedSquare', tile: 85, theta: 55 },
  /** Dense twelve-fold, for small crops. */
  meknes: { tiling: 'truncatedHex', tile: 52, theta: 72 },
  /** Crisp six-point stars with curved-looking triangles between. */
  chefchaouen: { tiling: 'hexagonal', tile: 100, theta: 80 },
  /** Twelve-fold interlaced rings — the hex ground at a shallow angle, unlike marrakech. */
  tangier: { tiling: 'truncatedHex', tile: 64, theta: 35, accent: true },
  /** Eight-fold with deep, sharp stars. */
  essaouira: { tiling: 'truncatedSquare', tile: 84, theta: 78, accent: true },
  /** Dense square-grid stars and octagons — tlemcen's cousin at a finer scale. */
  ouarzazate: { tiling: 'square', tile: 120, theta: 72 },
} satisfies Record<string, Preset>

/**
 * `size` is the square to fill, anchored at its top-right corner (1000, 0) — the same corner
 * whatever the size, so a large field lines up tile-for-tile with the small corner piece.
 * Paths come nearest-the-corner first, so drawing and growth both spread outward from it.
 */
export function pattern(name: PatternName, size = 1000): Geometry {
  const p: Preset = PRESETS[name]
  const b: Bounds = { x0: 1000 - size, y0: 0, x1: 1000, y1: size }
  const theta = (p.theta * Math.PI) / 180
  const scored: { g: GeoPath; dist: number }[] = []
  const weave = p.weave === undefined ? null : (p.weave * Math.PI) / 180
  for (const { poly, kind } of TILINGS[p.tiling](p.tile, b)) {
    const [x, y] = poly[0]
    if (x < b.x0 - p.tile || y > b.y1 + p.tile) continue
    const dist = Math.hypot(x - 1000, y)
    const d = hankin(poly, theta)
    // Stars in the large tiles carry the gold; the connecting figures go pale.
    if (d) scored.push({ g: { d, hue: kind === 0 ? 'gold' : p.accent ? 'haze' : 'white', weight: kind === 0 ? 1 : 0.8, kind }, dist })
    const w = weave === null ? '' : hankin(poly, weave)
    // The woven pass follows just behind its tile's main figure.
    if (w) scored.push({ g: { d: w, hue: 'haze', weight: 0.6 }, dist: dist + 0.5 })
  }
  scored.sort((m, n) => m.dist - n.dist)
  return {
    viewBox: `${b.x0} 0 ${size} ${size}`,
    finish: { interlace: p.interlace, glaze: p.glaze },
    paths: scored.map((x) => x.g),
    dists: scored.map((x) => x.dist),
  }
}
