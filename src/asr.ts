export const MODEL_MB = 76

let worker: Worker | null = null
let loadP: Promise<void> | null = null
let seq = 0

function w(): Worker {
  if (!worker) worker = new Worker(new URL('./asr.worker.ts', import.meta.url), { type: 'module' })
  return worker
}

export function loadModel(onProgress: (loadedMB: number, totalMB: number) => void): Promise<void> {
  if (loadP) return loadP
  const wk = w()
  loadP = new Promise<void>((resolve, reject) => {
    const h = (e: MessageEvent) => {
      const d = e.data
      if (d.type === 'progress' && d.total) onProgress(d.loaded / 1e6, d.total / 1e6)
      else if (d.type === 'ready') { wk.removeEventListener('message', h); resolve() }
      else if (d.type === 'error') { wk.removeEventListener('message', h); loadP = null; reject(new Error(d.message)) }
    }
    wk.addEventListener('message', h)
    wk.postMessage({ type: 'load' })
  })
  return loadP
}

export function transcribe(audio: Float32Array, language: string | null): Promise<string> {
  const id = ++seq
  const wk = w()
  return new Promise((resolve, reject) => {
    const h = (e: MessageEvent) => {
      if (e.data.id !== id) return
      wk.removeEventListener('message', h)
      if (e.data.type === 'done') resolve(e.data.text)
      else reject(new Error(e.data.message))
    }
    wk.addEventListener('message', h)
    wk.postMessage({ type: 'run', id, audio, language }, [audio.buffer])
  })
}

/** Any recorded/picked audio → 16 kHz mono Float32 (what Whisper wants). */
export async function toPcm16k(blob: Blob): Promise<Float32Array> {
  const buf = await blob.arrayBuffer()
  const ctx = new AudioContext()
  let decoded: AudioBuffer
  try { decoded = await ctx.decodeAudioData(buf) } finally { void ctx.close() }
  const len = Math.ceil(decoded.duration * 16000)
  const off = new OfflineAudioContext(1, Math.max(1, len), 16000)
  const src = off.createBufferSource()
  src.buffer = decoded
  src.connect(off.destination)
  src.start()
  const r = await off.startRendering()
  return r.getChannelData(0).slice()
}
