/**
 * Bakes the two tiling textures the site layers under every text surface.
 * Run once: `pnpm texture`. Output is committed — there is no runtime cost.
 *
 * Pure noise tiles seamlessly by construction (no low-frequency content to mismatch
 * at the edges), so no offset-blend pass is needed.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import sharp from 'sharp'

const OUT = path.resolve('public/textures')

/** Deterministic PRNG so regenerating never churns the committed files. */
const rng = (seed) => () => {
  seed = (seed * 1664525 + 1013904223) >>> 0
  return seed / 0x100000000
}

/** Fine paper tooth: high-frequency grey noise, softened a touch. */
async function paperGrain(size = 256, seed = 0x5eed) {
  const rand = rng(seed)
  const buf = Buffer.alloc(size * size)
  for (let i = 0; i < buf.length; i++) {
    // Triangular distribution clusters around mid-grey; extremes stay rare.
    const n = (rand() + rand()) / 2
    buf[i] = Math.round(112 + n * 32)
  }
  return sharp(buf, { raw: { width: size, height: size, channels: 1 } })
    .blur(0.4)
    // Indexed palette: noise is incompressible at 8-bit grey, and the tile sits at
    // ~5% opacity under a blend mode, so quantising is invisible and ~6x smaller.
    .png({ compressionLevel: 9, palette: true, colours: 16, effort: 10 })
    .toBuffer()
}

/** Canvas weave: crossed fibre bands with jittered intensity, plus grain. */
async function canvasWeave(size = 256, seed = 0xc0ffee) {
  const rand = rng(seed)
  const buf = Buffer.alloc(size * size)
  const period = 6
  // Per-thread brightness jitter, so the weave reads as fabric not as a grid.
  const warp = Array.from({ length: size }, () => 0.7 + rand() * 0.6)
  const weft = Array.from({ length: size }, () => 0.7 + rand() * 0.6)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const over = Math.floor(x / period) % 2 === Math.floor(y / period) % 2
      const thread = over ? warp[x] : weft[y]
      const ridge = Math.sin(((over ? x : y) / period) * Math.PI) * 0.5 + 0.5
      const v = 118 + thread * ridge * 20 + (rand() - 0.5) * 14
      buf[y * size + x] = Math.max(0, Math.min(255, Math.round(v)))
    }
  }
  return sharp(buf, { raw: { width: size, height: size, channels: 1 } })
    .blur(0.5)
    .png({ compressionLevel: 9, palette: true, colours: 24, effort: 10 })
    .toBuffer()
}

await mkdir(OUT, { recursive: true })
for (const [name, make] of [
  ['paper-grain-256.png', () => paperGrain()],
  ['canvas-weave-256.png', () => canvasWeave()],
]) {
  const data = await make()
  await writeFile(path.join(OUT, name), data)
  console.log(`${name}  ${(data.length / 1024).toFixed(1)} KB`)
}
