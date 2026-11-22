/// <reference lib="webworker" />
import { type InkParams, inkRender } from './engine'

/** Renders ink off the main thread, so animation never stalls on it. Echoes the request id. */
self.onmessage = (e: MessageEvent<InkParams & { id: number }>) => {
  const r = inkRender(e.data)
  ;(self as unknown as DedicatedWorkerGlobalScope).postMessage({ ...r, id: e.data.id }, [r.wet.data.buffer, r.dry.data.buffer])
}
