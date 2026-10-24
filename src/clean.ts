// Rule-based clean-up of raw dictation. No AI: predictable, instant, offline.
const J = '[\\u3040-\\u30ff\\u3400-\\u9fff\\uff10-\\uff5a]'

/** Spoken commands → line breaks. Works on raw text, so it also runs when clean-up is off. */
export function applyCommands(s: string): string {
  return s
    .replace(/[、,。.\s]*(?:新しい段落|段落|new paragraph)[、,。.!！\s]*/gi, '\n\n')
    .replace(/[、,\s]*(?:改行|かいぎょう|カイギョウ|new ?line)[、,。.!！\s]*/gi, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
}

const JA_FILLERS = ['えーっと', 'えーと', 'ええと', 'えっと', 'えー', 'ええー', 'あのー', 'あの', 'そのー', 'うーん', 'んー', 'まあ', 'なんか', 'え']
// These are fillers wherever they are followed by 、 ("あの人" has no comma, so it is kept).
const JA_ANYWHERE = ['えーっと', 'えーと', 'ええと', 'えっと', 'えー', 'あのー', 'あの', 'うーん']
const EN_FILLERS = /,?\s*\b(?:um+|uh+|erm+|er|hmm+|ah)\b[,.]?(?=\s|$)/gi

export function removeFillers(s: string): string {
  let out = s
  for (const f of JA_FILLERS) {
    // Only when the filler stands alone: at the start or after punctuation/space, and followed by 、/space/ー.
    const re = new RegExp(`(^|[、。,.!?！？\\s\\n])${f}ー*(?:[、,…]+|\\s+)`, 'g')
    out = out.replace(re, '$1')
    // Filler that is a whole sentence: 「えー。」
    out = out.replace(new RegExp(`(^|[、。\\n])${f}ー*[。.](?=\\s|$|${J})`, 'g'), '$1')
  }
  for (const f of JA_ANYWHERE) out = out.replace(new RegExp(`${f}ー*[、,]+`, 'g'), '')
  out = out.replace(EN_FILLERS, '')
  return out
}

export function fixPunctuation(s: string): string {
  return s
    .split('\n')
    .map((line) => {
      let l = line
        .replace(new RegExp(`(${J})\\s+(?=${J})`, 'g'), '$1') // no spaces inside Japanese
        .replace(new RegExp(`(${J})\\s+(?=[0-9])|([0-9])\\s+(?=${J})`, 'g'), '$1$2')
        .replace(/[、,]\s*([、,。.])/g, '$1')
        .replace(/。{2,}/g, '。').replace(/、{2,}/g, '、')
        .replace(/\s+([,.!?;:])/g, '$1')
        .replace(/([,.!?;:])(?=[A-Za-z])/g, '$1 ')
        .replace(/\s{2,}/g, ' ')
        .replace(/^[\s、,。.]+/, '')
        .trim()
      if (!l) return ''
      // English: capital at sentence starts, "i" → "I".
      l = l.replace(/(^|[.!?]\s+)([a-z])/g, (_m, p: string, c: string) => p + c.toUpperCase()).replace(/\bi\b/g, 'I')
      // End every line with a full stop if it has none.
      if (new RegExp(`${J}$`).test(l)) l += '。'
      else if (/[A-Za-z0-9]$/.test(l)) l += '.'
      else l = l.replace(/[、,]$/, /[A-Za-z]/.test(l.slice(-3)) ? '.' : '。')
      return l
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function clean(raw: string): string {
  return fixPunctuation(removeFillers(applyCommands(raw)))
}
