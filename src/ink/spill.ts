import { blot, rng, streak } from './blot'

/**
 * Spilled ink pooled from the top-left corner: one large blot with a crown of spikes, a few
 * satellite blots that ran off it toward the page, and short spray lines around the crown.
 * It is drawn complete — the spill is already there — and each pool then spreads around its
 * own centre, so nothing drifts.
 */
export type Pool = { d: string; cx: number; cy: number; r: number }
export type Spill = { size: number; pools: Pool[]; spray: string[]; dots: { x: number; y: number; r: number }[] }

export function spill(seed: number, size = 1000): Spill {
  const rand = rng(seed)
  const cx = size * (0.1 + rand() * 0.08)
  const cy = size * (0.08 + rand() * 0.08)
  const R = size * (0.3 + rand() * 0.06)
  const pools: Pool[] = []
  const spray: string[] = []
  const dots: { x: number; y: number; r: number }[] = []

  pools.push({ d: blot(rand, cx, cy, R, { spikes: 34, reach: 0.32, scallops: 70 }).d, cx, cy, r: R })

  // Satellites: pools that ran off toward the open page.
  const toward = Math.PI / 4 + (rand() - 0.5) * 0.7
  let d = R * (1.12 + rand() * 0.15)
  for (let i = 0, n = 2 + Math.floor(rand() * 2); i < n; i++) {
    const a = toward + (rand() - 0.5) * 0.6
    const r = R * (0.34 - i * 0.08) * (0.8 + rand() * 0.4)
    const px = cx + Math.cos(a) * (d + r * 0.6)
    const py = cy + Math.sin(a) * (d + r * 0.6)
    pools.push({ d: blot(rand, px, py, r, { spikes: 16, reach: 0.4, scallops: 26 }).d, cx: px, cy: py, r })
    d += r * 1.9
  }

  // Spray: fine lines flicked out past the crown.
  for (let i = 0; i < 34; i++) {
    const a = rand() * Math.PI * 2
    const start = R * (1.12 + rand() * 0.2)
    const s = streak(rand, cx + Math.cos(a) * start, cy + Math.sin(a) * start, a, R * (0.05 + rand() * 0.2), 0.8, 1.6 + rand() * 2.6)
    spray.push(...s.paths)
    if (rand() < 0.35) dots.push({ x: s.end[0], y: s.end[1], r: 1.5 + rand() * 3 })
  }
  for (let i = 0; i < 26; i++) {
    const a = rand() * Math.PI * 2
    const dd = R * (1.2 + rand() * 0.8)
    dots.push({ x: cx + Math.cos(a) * dd, y: cy + Math.sin(a) * dd, r: 1 + rand() * 4 })
  }

  return { size, pools, spray, dots }
}
