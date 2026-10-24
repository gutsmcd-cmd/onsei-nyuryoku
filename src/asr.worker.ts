// Whisper speech recognition off the main thread (transformers.js, WASM, 8-bit). Downloaded once, then cached.
import { pipeline, env, type AutomaticSpeechRecognitionPipeline } from '@huggingface/transformers'

env.allowLocalModels = false
env.useBrowserCache = true

export const MODEL = 'onnx-community/whisper-base'
let asr: AutomaticSpeechRecognitionPipeline | null = null

self.onmessage = async (e: MessageEvent) => {
  const m = e.data
  try {
    if (m.type === 'load') {
      if (!asr) {
        const files = new Map<string, { loaded: number; total: number }>()
        asr = (await (pipeline as unknown as (t: string, m: string, o: unknown) => Promise<unknown>)('automatic-speech-recognition', MODEL, {
          device: 'wasm',
          dtype: { encoder_model: 'q8', decoder_model_merged: 'q8' },
          progress_callback: (p: { status: string; file?: string; loaded?: number; total?: number }) => {
            if (p.status === 'progress' && p.file) {
              files.set(p.file, { loaded: p.loaded ?? 0, total: p.total ?? 0 })
              let l = 0, t = 0
              files.forEach((f) => { l += f.loaded; t += f.total })
              self.postMessage({ type: 'progress', loaded: l, total: t })
            }
          },
        })) as AutomaticSpeechRecognitionPipeline
      }
      self.postMessage({ type: 'ready' })
    } else if (m.type === 'run') {
      if (!asr) throw new Error('model not loaded')
      const opts: Record<string, unknown> = { task: 'transcribe', chunk_length_s: 30, stride_length_s: 5 }
      if (m.language) opts.language = m.language
      const out = (await asr(m.audio as Float32Array, opts as never)) as { text: string } | { text: string }[]
      const text = Array.isArray(out) ? out.map((o) => o.text).join(' ') : out.text
      self.postMessage({ type: 'done', id: m.id, text: text.trim() })
    }
  } catch (err) {
    self.postMessage({ type: 'error', id: m.id, message: String((err as Error)?.message ?? err) })
  }
}
