/**
 * Click-and-drag writes a line of watery gold ink on a fixed canvas. The line stays where
 * it was drawn; the ink on it moves: it pools on the curves, now and then drips from a pool,
 * and splatters when the pen changes direction suddenly. It all
 * dissipates within a second and a half. One rAF loop, alive only while ink is on screen.
 */
type Pt = { x: number; y: number; t: number; w: number }
type Pool = { x: number; y: number; t: number; r: number }
type Run = { x: number; y: number; t: number; len: number; v: number; w: number; tail: number }
type Dot = { x: number; y: number; t: number; r: number; e: number; a: number }

const LIFE = 1400 // how long any of it lasts, ms
const POOL_MS = 260 // a pool gathering
const RUN_OUT = 240 // a run fading once it stops

const r = Math.random
const between = (a: number, b: number) => a + r() * (b - a)
const fade = (t: number, now: number) => {
  const a = 1 - (now - t) / LIFE
  return a > 0 ? a * Math.sqrt(a) : 0
}

export function dragInk() {
  let cv: HTMLCanvasElement | null = null
  let ctx: CanvasRenderingContext2D | null = null
  let gold = '#d9bd72'
  let leaf = '#f2dc94'
  const strokes: Pt[][] = []
  let pools: Pool[] = []
  let runs: Run[] = []
  let dots: Dot[] = []
  let live: Pt[] | null = null
  let dir = { x: 0, y: 0 }
  let bend = 0 // heading change since the last pool, rad
  let nextBend = 1
  let lastPool = 0
  let lastSplat = 0
  let raf = 0

  const ensure = () => {
    if (!cv) {
      cv = Object.assign(document.createElement('canvas'), { ariaHidden: 'true' })
      cv.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:69'
      document.body.append(cv)
      ctx = cv.getContext('2d')
      const cs = getComputedStyle(document.documentElement)
      gold = cs.getPropertyValue('--gold').trim() || gold
      leaf = cs.getPropertyValue('--leaf').trim() || leaf
    }
    const d = Math.min(2, devicePixelRatio || 1)
    const w = Math.round(innerWidth * d)
    const h = Math.round(innerHeight * d)
    if (cv.width !== w || cv.height !== h) Object.assign(cv, { width: w, height: h })
    ctx!.setTransform(d, 0, 0, d, 0, 0)
  }

  /** A run: the head races down, its tail fading right behind it, a bead at the tip. */
  const drawRun = (c: CanvasRenderingContext2D, u: Run, now: number) => {
    const age = now - u.t
    if (age < 0) return true
    const tRun = (u.len / u.v) * 1000
    if (age > tRun + RUN_OUT) return false
    const k = Math.min(1, age / tRun)
    const head = u.y + u.len * (1 - (1 - k) * (1 - k))
    const g = c.createLinearGradient(0, head - u.tail, 0, head)
    g.addColorStop(0, 'transparent')
    g.addColorStop(1, gold)
    c.globalAlpha = 0.85 * (age > tRun ? 1 - (age - tRun) / RUN_OUT : 1)
    c.strokeStyle = g
    c.lineWidth = u.w
    c.beginPath()
    c.moveTo(u.x, Math.max(u.y, head - u.tail))
    c.lineTo(u.x, head)
    c.stroke()
    c.fillStyle = leaf
    c.beginPath()
    c.ellipse(u.x, head, u.w * 0.8, u.w * 1, 0, 0, Math.PI * 2)
    c.fill()
    return true
  }

  const frame = () => {
    const now = performance.now()
    const c = ctx!
    c.clearRect(0, 0, innerWidth, innerHeight)
    c.lineCap = 'round'
    c.lineJoin = 'round'
    c.strokeStyle = gold
    for (let i = strokes.length - 1; i >= 0; i--) {
      const s = strokes[i]
      while (s.length && now - s[0].t > LIFE) s.shift()
      if (!s.length && s !== live) strokes.splice(i, 1)
      for (let j = 1; j < s.length; j++) {
        const a = fade(s[j].t, now)
        c.globalAlpha = 0.85 * a
        c.lineWidth = s[j].w * (0.55 + 0.45 * a)
        c.beginPath()
        c.moveTo(s[j - 1].x, s[j - 1].y)
        c.lineTo(s[j].x, s[j].y)
        c.stroke()
      }
    }
    // Pools gather on the line, heavier at the bottom, with a glint.
    c.fillStyle = gold
    pools = pools.filter((p) => {
      const a = fade(p.t, now)
      if (!a) return false
      const k = Math.min(1, (now - p.t) / POOL_MS)
      const rr = p.r * (1 - (1 - k) * (1 - k))
      c.globalAlpha = 0.85 * a
      c.fillStyle = gold
      c.beginPath()
      c.ellipse(p.x, p.y + rr * 0.35, rr * 0.9, rr * 1.15, 0, 0, Math.PI * 2)
      c.fill()
      c.globalAlpha = 0.5 * a
      c.fillStyle = leaf
      c.beginPath()
      c.arc(p.x - rr * 0.3, p.y, rr * 0.3, 0, Math.PI * 2)
      c.fill()
      return true
    })
    dots = dots.filter((d) => {
      const a = fade(d.t, now)
      if (!a) return false
      c.globalAlpha = 0.8 * a
      c.fillStyle = gold
      c.beginPath()
      c.ellipse(d.x, d.y, d.r * d.e, d.r, d.a, 0, Math.PI * 2)
      c.fill()
      return true
    })
    runs = runs.filter((u) => drawRun(c, u, now))
    c.globalAlpha = 1
    raf = strokes.length || pools.length || runs.length || dots.length ? requestAnimationFrame(frame) : 0
  }
  const kick = () => {
    if (!raf) raf = requestAnimationFrame(frame)
  }

  /** Ink thrown off a sudden turn, carried on along the old heading; sharper throws more. */
  const splat = (x: number, y: number, t: number, turn: number) => {
    const h = Math.atan2(dir.y, dir.x)
    for (let i = 0, n = Math.round(turn * between(2.5, 4)); i < n; i++) {
      const dist = between(4, 14 + turn * 6)
      const a = h + between(-0.5, 0.5)
      dots.push({ x: x + Math.cos(a) * dist, y: y + Math.sin(a) * dist, t, r: between(0.5, 2.4) * (1.2 - dist / 40), e: r() < 0.3 ? between(1.8, 3) : 1, a })
    }
  }

  return {
    down(x: number, y: number) {
      ensure()
      live = [{ x, y, t: performance.now(), w: 2.6 }]
      strokes.push(live)
      dir = { x: 0, y: 0 }
      bend = 0
      kick()
    },
    move(x: number, y: number) {
      if (!live) return
      const last = live[live.length - 1]
      const d = Math.hypot(x - last.x, y - last.y)
      if (d < 2) return
      const t = performance.now()
      // Fountain pen: faster strokes lay a thinner line.
      const speed = d / Math.max(1, t - last.t)
      const w = Math.max(0.9, 3 - speed * 0.9)
      live.push({ x, y, t, w })
      // How sharply the heading changed since the last few px.
      const ux = (x - last.x) / d
      const uy = (y - last.y) / d
      const turn = dir.x || dir.y ? Math.acos(Math.max(-1, Math.min(1, dir.x * ux + dir.y * uy))) : 0
      // Ink pools along curves (never on straights), and the odd pool drips.
      bend += turn
      if (bend > nextBend && t - lastPool > 90) {
        bend = 0
        nextBend = between(0.8, 1.8)
        lastPool = t
        const pr = between(1.8, 3.6)
        pools.push({ x, y, t, r: pr })
        if (r() < 0.25) runs.push({ x, y: y + pr * 1.3, t: t + POOL_MS, len: between(10, 40), v: between(140, 240), w: pr * between(0.8, 1.2), tail: between(6, 16) })
      }
      if (turn > 0.9 && t - lastSplat > 120) {
        lastSplat = t
        splat(x, y, t, turn)
      }
      dir = { x: dir.x * 0.6 + ux * 0.4, y: dir.y * 0.6 + uy * 0.4 }
      const m = Math.hypot(dir.x, dir.y) || 1
      dir = { x: dir.x / m, y: dir.y / m }
      kick()
    },
    up() {
      live = null
    },
  }
}
