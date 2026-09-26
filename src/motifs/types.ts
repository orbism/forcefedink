/**
 * One drawable line motif. Every source — the artist's SVG exports and the procedural
 * generators alike — normalises to this shape, so the renderers never care where it came from.
 */
export type Motif = {
  name: string
  viewBox: string
  paths: string[]
  /** In viewBox units, so it scales with the art rather than with the viewport. */
  strokeWidth: number
}

/** Above this path count, per-path pen-draw is too expensive — use the masked wipe. */
export const DENSE_PATH_THRESHOLD = 120

export const isDense = (motif: Motif) => motif.paths.length > DENSE_PATH_THRESHOLD
