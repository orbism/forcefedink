import { blot, gaussOf, rng, streak } from './blot'

/**
 * Sharp splatter: dense cores, long streaks that thicken to a bead where they land, and a
 * cloud of fine speckle — all thrown along one line of travel, so the spray always sits
 * downstream of the impact and tells you where the ink came from.
 */
export type Speck = { x: number; y: number; r: number; reach: number }
export type Streak = { d: string; sx: number; sy: number; at: number }
export type Splat = {
  width: number
  height: number
  cx: number
  cy: number
  cores: string[]
  streaks: Streak[]
  specks: Speck[]
}

/**
 * `aim` constrains the throw to a direction (radians, 0 = rightward) — used beside titles so
 * the spray always flies away from the text instead of across it.
 */
export function splat(seed: number, width = 640, height = 360, scale = 1, aim?: number): Splat {
  const rand = rng(seed)
  const gauss = gaussOf(rand)
  const travel = aim === undefined ? rand() * Math.PI * 2 : aim + gauss() * 1.1
  const tx = Math.cos(travel), ty = Math.sin(travel)
  const R = 34 * scale
  const cx = width / 2 - tx * R * 2.2
  const cy = height / 2 - ty * R * 1.2
  const cores: string[] = []
  const streaks: Streak[] = []
  const specks: Speck[] = []

  const main = blot(rand, cx, cy, R, { spikes: 28, bias: travel, spread: 0.85, reach: 0.9, scallops: 34 })
  cores.push(main.d)
  // A second, smaller core downstream: the drop broke on impact.
  if (rand() < 0.75) {
    const d = R * (2.4 + rand() * 1.6)
    const a = travel + gauss() * 0.35
    cores.push(blot(rand, cx + Math.cos(a) * d, cy + Math.sin(a) * d, R * (0.35 + rand() * 0.25), { spikes: 14, bias: travel, spread: 0.7, reach: 1 }).d)
  }

  // Streaks leave the rim along the line of travel.
  const n = 11 + Math.floor(rand() * 7)
  for (let i = 0; i < n; i++) {
    const a = travel + gauss() * 0.4
    const len = R * (1.8 + rand() ** 1.5 * 6)
    const sx = cx + Math.cos(a) * R * 0.85, sy = cy + Math.sin(a) * R * 0.85
    const s = streak(rand, sx, sy, a, len, 0.6 * scale, (1.4 + rand() * 3.2) * scale, rand() < 0.3)
    for (const d of s.paths) streaks.push({ d, sx, sy, at: Math.round(rand() * 90) })
    if (rand() < 0.6) specks.push({ x: s.end[0], y: s.end[1], r: (1.6 + rand() * 2.6) * scale, reach: 0.8 })
  }
  // Beads at the tips of the long crown spikes.
  for (const t of main.tips) if (rand() < 0.45) specks.push({ x: t.x + Math.cos(t.a) * 4 * scale, y: t.y + Math.sin(t.a) * 4 * scale, r: (1.2 + rand() * 2) * scale, reach: 0.4 })

  // Dots: fewer and larger near the core, finer the further they flew.
  for (let i = 0; i < 46; i++) {
    const a = travel + gauss() * 0.7
    const d = R * (1.3 + -Math.log(1 - rand() * 0.96) * 1.9)
    specks.push({ x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d, r: Math.max(0.6, R * 0.16 * Math.exp(-d / (R * 3.5)) * (0.4 + rand())), reach: Math.min(1, d / (R * 8)) })
  }
  // Speckle: the fine mist, densest around the impact.
  for (let i = 0; i < 110; i++) {
    const a = rand() < 0.8 ? travel + gauss() * 0.9 : rand() * Math.PI * 2
    const d = R * (0.9 + rand() ** 1.6 * 7)
    specks.push({ x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d, r: (0.35 + rand() * 0.8) * scale, reach: Math.min(1, d / (R * 8)) })
  }

  return { width, height, cx, cy, cores, streaks, specks }
}
