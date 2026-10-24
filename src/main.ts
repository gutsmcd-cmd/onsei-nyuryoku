import './style.css'
import { registerSW } from 'virtual:pwa-register'
import { dict, type Lang, type Dict } from './i18n'
import * as db from './db'
import { clean, applyCommands } from './clean'
import { loadModel, transcribe, toPcm16k, MODEL_MB } from './asr'

registerSW({ immediate: true })
void db.askPersist()

interface Entry { id: string; created: number; raw: string; text: string }
type Spoken = 'ja' | 'en'

const S = {
  lang: 'ja' as Lang, big: false, tidy: true, spoken: 'ja' as Spoken,
  text: '', lastRaw: '', ready: false, loading: false, busy: false, status: '', hist: [] as Entry[],
}
const T = (): Dict => dict[S.lang]
const app = document.getElementById('app')!
const h = <K extends keyof HTMLElementTagNameMap>(tag: K, props: Record<string, unknown> = {}, ...kids: (Node | string | null | false)[]) => {
  const e = document.createElement(tag)
  for (const [k, v] of Object.entries(props)) {
    if (k.startsWith('on')) e.addEventListener(k.slice(2), v as EventListener)
    else if (k === 'testid') e.dataset.testid = String(v)
    else if (k in e) (e as unknown as Record<string, unknown>)[k] = v
    else e.setAttribute(k, String(v))
  }
  for (const c of kids) if (c) e.append(c)
  return e
}
const toast = (msg: string) => {
  const t = h('div', { className: 'toast', testid: 'toast' }, msg)
  document.body.append(t)
  setTimeout(() => t.remove(), 2200)
}
const save = () => db.put('kv', 'prefs', { lang: S.lang, big: S.big, tidy: S.tidy, spoken: S.spoken, text: S.text })
const setStatus = (s: string) => { S.status = s; const el = document.querySelector('[data-testid="status"]'); if (el) { el.textContent = s; (el as HTMLElement).hidden = !s } }

// ---------- model ----------
async function ensureModel(): Promise<boolean> {
  if (S.ready) return true
  S.loading = true
  setStatus(T().loading)
  try {
    await loadModel((a, b) => setStatus(T().dl(a, b)))
    S.ready = true
    await db.put('kv', 'modelReady', true)
    setStatus(T().ready)
    return true
  } catch {
    setStatus(T().fail)
    return false
  } finally { S.loading = false; render() }
}

async function handleAudio(blob: Blob) {
  if (!(await ensureModel())) return
  S.busy = true; render(); setStatus(T().working)
  try {
    const pcm = await toPcm16k(blob)
    const raw = (await transcribe(pcm, S.spoken === 'ja' ? 'japanese' : 'english')).trim()
    if (!raw || /^[\s.。…♪]*$/.test(raw)) { setStatus(T().nothing); return }
    S.lastRaw = raw
    const piece = S.tidy ? clean(raw) : applyCommands(raw)
    S.text = S.text ? S.text.replace(/\s+$/, '') + (S.text.endsWith('\n') ? '' : '\n') + piece : piece
    const e: Entry = { id: String(Date.now()), created: Date.now(), raw, text: piece }
    await db.put('hist', e.id, e)
    S.hist.unshift(e)
    void save()
    setStatus('')
  } catch { setStatus(T().fail) } finally { S.busy = false; render() }
}

// ---------- recording: hold to talk, or tap to start / tap to stop ----------
let rec: MediaRecorder | null = null
let chunks: Blob[] = []
let downAt = 0
let tick: number | undefined
async function startRec() {
  if (rec || S.busy) return
  let stream: MediaStream
  try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }) } catch { toast(T().micNo); return }
  chunks = []
  rec = new MediaRecorder(stream)
  rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data) }
  rec.onstop = () => {
    stream.getTracks().forEach((t) => t.stop())
    const blob = new Blob(chunks, { type: rec?.mimeType || 'audio/webm' })
    rec = null; clearInterval(tick); render()
    if (blob.size) void handleAudio(blob)
  }
  rec.start()
  const t0 = Date.now()
  render()
  const lab = () => { const el = document.querySelector('[data-testid="recsub"]'); if (el) el.textContent = T().rec(Math.round((Date.now() - t0) / 1000)) }
  lab(); tick = window.setInterval(() => { lab(); if (Date.now() - t0 > 5 * 60_000) stopRec() }, 500)
}
function stopRec() { if (rec && rec.state !== 'inactive') rec.stop() }
// Exposed for automated tests (no mic in headless browsers): feed a file straight in.
;(window as unknown as { __dictate: (b: Blob) => Promise<void> }).__dictate = handleAudio

// ---------- UI ----------
function render() {
  const t = T()
  document.documentElement.lang = S.lang
  document.documentElement.classList.toggle('big', S.big)
  document.title = t.app
  const recording = !!rec
  const mic = h('button', {
    className: 'mic' + (recording ? ' on' : ''), testid: 'mic', disabled: S.busy || S.loading,
    onpointerdown: (e: PointerEvent) => { e.preventDefault(); downAt = Date.now(); if (rec) stopRec(); else void startRec() },
    onpointerup: () => { if (rec && Date.now() - downAt > 600) stopRec() },
    oncontextmenu: (e: Event) => e.preventDefault(),
  }, h('span', { className: 'mt' }, recording ? t.stop : t.hold), h('span', { className: 'ms', testid: 'recsub' }, t.holdSub))
  const file = h('input', { type: 'file', accept: 'audio/*', hidden: true, onchange: (e: Event) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) void handleAudio(f) } }) as HTMLInputElement
  const seg = h('div', { className: 'seg' }, ...(['ja', 'en'] as Spoken[]).map((k) =>
    h('button', { className: S.spoken === k ? 'on' : '', onclick: () => { S.spoken = k; void save(); render() } }, t[k])))
  const ta = h('textarea', { testid: 'text', value: S.text, placeholder: t.placeholder, oninput: (e: Event) => { S.text = (e.target as HTMLTextAreaElement).value; void save() } })
  app.replaceChildren(...([
    h('div', { className: 'top' }, h('h1', {}, t.app),
      h('div', { className: 'tg' },
        h('button', { className: 'tiny' + (S.big ? ' on' : ''), testid: 'big', onclick: () => { S.big = !S.big; void save(); render() } }, t.big),
        h('button', { className: 'tiny', testid: 'lang', onclick: () => { S.lang = S.lang === 'ja' ? 'en' : 'ja'; void save(); render() } }, t.toggle))),
    h('p', { className: 'lead' }, t.lead),
    !S.ready && h('div', { className: 'note' }, h('p', {}, t.firstDl(MODEL_MB)),
      h('button', { className: 'primary', testid: 'prep', disabled: S.loading, onclick: () => void ensureModel() }, t.prep)),
    h('div', { className: 'status', testid: 'status', hidden: !S.status }, S.status),
    mic,
    h('div', { className: 'row' }, h('span', { className: 'small' }, t.speakLang), seg),
    h('label', { className: 'chk' }, h('input', { type: 'checkbox', checked: S.tidy, testid: 'tidy', onchange: (e: Event) => { S.tidy = (e.target as HTMLInputElement).checked; void save() } }), ' ', t.tidy),
    h('h2', {}, t.text), ta,
    h('div', { className: 'acts' },
      h('button', { className: 'primary', testid: 'copy', onclick: async () => { try { await navigator.clipboard.writeText(S.text); toast(t.copied) } catch { ta.select(); document.execCommand('copy'); toast(t.copied) } } }, t.copy),
      h('button', { testid: 'share', onclick: async () => { if (navigator.share) { try { await navigator.share({ text: S.text }) } catch { /* cancelled */ } } else { await navigator.clipboard.writeText(S.text).catch(() => {}); toast(t.copied) } } }, t.share),
      h('button', { className: 'ghost', onclick: () => { file.click() } }, t.pick),
      h('button', { className: 'ghost danger', testid: 'clear', onclick: () => { if (S.text && confirm(t.clearQ)) { S.text = ''; void save(); render() } } }, t.clear)),
    file,
    S.lastRaw && h('details', { className: 'raw' }, h('summary', {}, t.raw), h('p', { testid: 'raw' }, S.lastRaw)),
    h('p', { className: 'small' }, t.tips),
    h('h2', {}, t.history),
    h('div', { className: 'hist', testid: 'hist' }, ...(S.hist.length ? S.hist.slice(0, 50).map((e) => h('div', { className: 'hrow' },
      h('div', { className: 'hmeta' }, h('div', { className: 'small' }, new Date(e.created).toLocaleString(S.lang === 'ja' ? 'ja-JP' : 'en-GB', { dateStyle: 'short', timeStyle: 'short' })), h('div', { className: 'hex' }, e.text)),
      h('button', { className: 'tiny', onclick: () => { S.text = e.text; void save(); render() } }, t.use),
      h('button', { className: 'tiny ghost danger', onclick: async () => { if (confirm(t.delQ)) { await db.del('hist', e.id); S.hist = S.hist.filter((x) => x !== e); render() } } }, t.del))) : [h('p', { className: 'small' }, t.none)])),
    h('p', { className: 'honest' }, t.honest),
    h('p', { className: 'foot' }, t.foot), h('p', { className: 'foot' }, t.credit),
  ].filter(Boolean) as Node[]))
}

async function init() {
  const p = await db.get<{ lang: Lang; big: boolean; tidy: boolean; spoken: Spoken; text: string }>('kv', 'prefs').catch(() => undefined)
  if (p) Object.assign(S, p, { spoken: p.spoken === 'en' ? 'en' : 'ja' })
  S.hist = ((await db.all<Entry>('hist').catch(() => [])) ?? []).sort((a, b) => b.created - a.created)
  render()
  // Model was downloaded before: load it quietly from cache so the first recording is quick.
  if (await db.get('kv', 'modelReady').catch(() => false)) void ensureModel()
}
void init()
