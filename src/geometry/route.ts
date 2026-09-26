import type { GeoPath, Hue } from './patterns'

/**
 * The shapes of a star pattern, prepared for one pen that draws them one at a time.
 *
 * Each tile motif is a closed loop (a star, a cross, a hexagon). The pen draws a loop
 * completely, then moves to an adjoining undrawn shape — one sharing a point with what is
 * already drawn — entering it at the vertex nearest where it just finished. Neighbouring
 * shapes share their edge midpoints, so that entry is usually exactly where the pen already
 * is. A pull toward the corner keeps the cluster growing outward.
 */
export type Pt = [number, number]
export type Tile = { pts: Pt[]; hue: Hue; weight: number; kind: number; dist: number; len: number }
export type Rect = { x0: number; x1: number; y0: number; y1: number }

const key = ([x, y]: Pt) => `${Math.round(x * 2)},${Math.round(y * 2)}`

/** The tile motif as one polyline, joining its subpaths end to start. */
function loopOf(d: string): Pt[] {
  const out: Pt[] = []
  for (const sub of d.split('M').filter(Boolean)) {
    const n = sub.match(/-?[\d.]+/g)!.map(Number)
    for (let i = 0; i + 1 < n.length; i += 2) {
      const p: Pt = [n[i], n[i + 1]]
      if (!out.length || key(out[out.length - 1]) !== key(p)) out.push(p)
    }
  }
  return out
}

const lengthOf = (pts: Pt[]) => pts.reduce((l, p, i) => (i ? l + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0)

export function tilesOf(paths: GeoPath[], dists: number[]) {
  const tiles: Tile[] = paths.map((p, i) => {
    const pts = loopOf(p.d)
    return { pts, hue: p.hue, weight: p.weight, kind: p.kind ?? 0, dist: dists[i], len: lengthOf(pts) }
  })
  // Shapes sharing any point are neighbours.
  const owners = new Map<string, number[]>()
  tiles.forEach((t, i) => {
    for (const p of t.pts) {
      const k = key(p)
      const list = owners.get(k)
      if (!list) owners.set(k, [i])
      else if (!list.includes(i)) list.push(i)
    }
  })
  const neighbours = tiles.map((t, i) => {
    const set = new Set<number>()
    for (const p of t.pts) for (const n of owners.get(key(p)) ?? []) if (n !== i) set.add(n)
    return [...set]
  })
  return { tiles, neighbours }
}

/** A shape counts as on screen only if most of it is: edge-clipped shapes are skipped. */
export const onScreen = (t: Tile, r: Rect) =>
  t.pts.filter(([x, y]) => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1).length >= t.pts.length * 0.6

/** The loop as path data, starting (and, if closed, ending) at vertex `i`. */
export function pathFrom(t: Tile, i: number): string {
  const closed = t.pts.length > 2 && key(t.pts[0]) === key(t.pts[t.pts.length - 1])
  let pts = t.pts
  if (closed) {
    const ring = pts.slice(0, -1)
    const j = i % ring.length
    pts = [...ring.slice(j), ...ring.slice(0, j), ring[j]]
  } else if (i > pts.length / 2) pts = [...pts].reverse()
  return pts.reduce((d, [x, y], k) => d + (k ? 'L' : 'M') + x + ' ' + y, '')
}

/**
 * Next shape for the pen: the cheapest on-screen candidate among the drawn cluster's
 * neighbours, or — if none are visible — among every on-screen undrawn shape.
 */
export function pick(
  tiles: Tile[],
  candidates: Iterable<number>,
  pen: Pt,
  pull: number,
): { t: number; entry: number } | null {
  let best: { t: number; entry: number } | null = null
  let bestCost = Infinity
  for (const t of candidates) {
    tiles[t].pts.forEach((p, i) => {
      const c = Math.hypot(p[0] - pen[0], p[1] - pen[1]) + pull * tiles[t].dist
      if (c < bestCost) {
        bestCost = c
        best = { t, entry: i }
      }
    })
  }
  return best
}
