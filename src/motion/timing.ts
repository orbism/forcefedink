/**
 * Shared choreography timing. Lives in a plain module: constants exported from a
 * 'use client' file reach server components as client references, not values.
 *
 * On navigation the outgoing page's slots leave fast; the incoming page holds its
 * entrance this long so the old content is clearly gone first.
 */
export const ENTER_DELAY = 190

/**
 * Title trace: each word's outline is drawn by the pen, then the ink floods in. Lines and
 * words start in sequence; `fill` is when the flood begins within a word's `draw`.
 */
export const TRACE = { start: ENTER_DELAY + 80, line: 220, word: 90, draw: 1100, fill: 850 } as const

/** Start time (ms) of every word, line by line. */
export const traceSchedule = (lines: string[], start: number = TRACE.start) =>
  lines.map((line, li) => line.split(' ').map((_, wi) => start + li * TRACE.line + wi * TRACE.word))

/** When the last word's ink floods in: the moment a splash beside the title should land. */
export const traceFlood = (lines: string[], start?: number) => {
  const s = traceSchedule(lines, start)
  return s[s.length - 1][s[s.length - 1].length - 1] + TRACE.fill
}

/** When the whole title has settled. */
export const traceEnd = (lines: string[], start?: number) => traceFlood(lines, start) + (TRACE.draw - TRACE.fill)
