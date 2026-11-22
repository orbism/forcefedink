import { type InkParams, type InkResult, inkRender } from './engine'

/**
 * Renders ink off the main thread through one long-lived worker (OffscreenCanvas), falling
 * back to the main thread where that isn't available. Client-only.
 */
let worker: Worker | null = null
let seq = 0
const pending = new Map<number, (r: InkResult) => void>()

export function renderInk(params: InkParams): Promise<InkResult> {
  if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined') {
    return new Promise((ok) => setTimeout(() => ok(inkRender(params))))
  }
  if (!worker) {
    worker = new Worker(new URL('./ink.worker.ts', import.meta.url))
    worker.onmessage = (e: MessageEvent<InkResult & { id: number }>) => {
      pending.get(e.data.id)?.(e.data)
      pending.delete(e.data.id)
    }
  }
  const id = ++seq
  return new Promise((ok) => {
    pending.set(id, ok)
    worker!.postMessage({ ...params, id })
  })
}

/** A canvas holding an ink bitmap. */
export const inkCanvas = (img: ImageData, className = '') => {
  const c = Object.assign(document.createElement('canvas'), { width: img.width, height: img.height, className })
  c.getContext('2d')!.putImageData(img, 0, 0)
  return c
}
