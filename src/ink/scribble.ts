/**
 * A short pen scribble (~0.2s), synthesised: a few quick nib strokes of band-passed noise,
 * each with its own pitch sweep and swell. No audio file. Played quietly on link clicks.
 */
let ctx: AudioContext | null = null
let noise: AudioBuffer | null = null
const VOLUME = 0.07

export function scribble() {
  if (typeof AudioContext === 'undefined') return
  ctx ??= new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
  if (!noise) {
    noise = ctx.createBuffer(1, ctx.sampleRate / 2, ctx.sampleRate)
    const d = noise.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  }
  const out = ctx.createGain()
  out.gain.value = VOLUME
  const hp = ctx.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 900
  hp.connect(out).connect(ctx.destination)

  const r = Math.random
  let t = ctx.currentTime + 0.005
  for (let i = 0, n = 3 + Math.floor(r() * 2); i < n; i++) {
    const dur = 0.035 + r() * 0.035
    const src = ctx.createBufferSource()
    src.buffer = noise
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.Q.value = 1.4
    bp.frequency.setValueAtTime(2200 + r() * 2000, t)
    bp.frequency.linearRampToValueAtTime(2600 + r() * 2600, t + dur)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(0.6 + r() * 0.4, t + 0.008)
    g.gain.exponentialRampToValueAtTime(0.001, t + dur)
    src.connect(bp).connect(g).connect(hp)
    src.start(t, r() * 0.4)
    src.stop(t + dur + 0.02)
    t += dur * 0.85 + 0.005 + r() * 0.015
  }
}
