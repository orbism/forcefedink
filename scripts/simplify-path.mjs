/**
 * Flattens SVG path data to polylines and simplifies with Ramer–Douglas–Peucker.
 *
 * Stylus exports record raw sample points — hundreds of near-collinear quadratic
 * segments per stroke. Flattening and simplifying at a tolerance well under a pixel
 * at display size is visually lossless and cuts payload by an order of magnitude.
 */

/** Parse the subset of path syntax stylus exports actually emit: M, L, Q, C, Z. */
export function flatten(d, samples = 6) {
  const tokens = d.match(/[MmLlQqCcZzHhVv]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi) ?? []
  const subpaths = []
  let pts = []
  let i = 0
  let cmd = ''
  let cx = 0
  let cy = 0
  let sx = 0
  let sy = 0

  const num = () => Number(tokens[i++])
  const push = (x, y) => {
    pts.push([x, y])
    cx = x
    cy = y
  }
  const quad = (x1, y1, x, y) => {
    for (let s = 1; s <= samples; s++) {
      const t = s / samples
      const u = 1 - t
      pts.push([u * u * cx + 2 * u * t * x1 + t * t * x, u * u * cy + 2 * u * t * y1 + t * t * y])
    }
    cx = x
    cy = y
  }
  const cubic = (x1, y1, x2, y2, x, y) => {
    for (let s = 1; s <= samples; s++) {
      const t = s / samples
      const u = 1 - t
      pts.push([
        u ** 3 * cx + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t ** 3 * x,
        u ** 3 * cy + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t ** 3 * y,
      ])
    }
    cx = x
    cy = y
  }

  while (i < tokens.length) {
    const tok = tokens[i]
    if (/[A-Za-z]/.test(tok)) {
      cmd = tok
      i++
      if (cmd === 'Z' || cmd === 'z') {
        if (pts.length > 1) pts.push([sx, sy])
        subpaths.push(pts)
        pts = []
        cx = sx
        cy = sy
        continue
      }
    }
    const rel = cmd === cmd.toLowerCase()
    const ox = rel ? cx : 0
    const oy = rel ? cy : 0

    switch (cmd.toUpperCase()) {
      case 'M': {
        const x = num() + ox
        const y = num() + oy
        if (pts.length > 1) subpaths.push(pts)
        pts = []
        push(x, y)
        sx = x
        sy = y
        cmd = rel ? 'l' : 'L' // subsequent pairs after M are implicit linetos
        break
      }
      case 'L': push(num() + ox, num() + oy); break
      case 'H': push(num() + ox, cy); break
      case 'V': push(cx, num() + oy); break
      case 'Q': quad(num() + ox, num() + oy, num() + ox, num() + oy); break
      case 'C': cubic(num() + ox, num() + oy, num() + ox, num() + oy, num() + ox, num() + oy); break
      default: i++ // unknown command: skip a token rather than spin
    }
  }
  if (pts.length > 1) subpaths.push(pts)
  return subpaths
}

const distToSegment = ([px, py], [ax, ay], [bx, by]) => {
  const dx = bx - ax
  const dy = by - ay
  const len2 = dx * dx + dy * dy
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2))
  const qx = ax + t * dx
  const qy = ay + t * dy
  return Math.hypot(px - qx, py - qy)
}

/** Iterative RDP — recursion blows the stack on multi-thousand-point stylus strokes. */
export function rdp(points, epsilon) {
  if (points.length < 3) return points
  const keep = new Uint8Array(points.length)
  keep[0] = keep[points.length - 1] = 1
  const stack = [[0, points.length - 1]]

  while (stack.length) {
    const [first, last] = stack.pop()
    let maxDist = 0
    let index = -1
    for (let i = first + 1; i < last; i++) {
      const dist = distToSegment(points[i], points[first], points[last])
      if (dist > maxDist) {
        maxDist = dist
        index = i
      }
    }
    if (index !== -1 && maxDist > epsilon) {
      keep[index] = 1
      stack.push([first, index], [index, last])
    }
  }
  return points.filter((_, i) => keep[i])
}

export function toPathData(points, precision = 1) {
  const r = (n) => Number(n.toFixed(precision))
  let d = `M${r(points[0][0])} ${r(points[0][1])}`
  for (let i = 1; i < points.length; i++) d += `L${r(points[i][0])} ${r(points[i][1])}`
  return d
}
