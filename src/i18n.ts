export type Lang = 'ja' | 'en'

export const dict = {
  ja: {
    app: '音声入力', lead: '話すだけで文字に。音声認識はこの端末の中で動くので、電波がなくても使えます。', toggle: 'English', big: '大きい文字',
    hold: '🎤 押して話す', holdSub: '押している間 録音（短く押すと録音開始／もう一度押すと止める）', stop: '⏹ 止める', rec: (s: number) => `録音中… ${s}秒`,
    pick: '🎵 音声ファイルから', speakLang: '話す言葉', ja: '日本語', en: 'English',
    tidy: 'きれいに整える（「えー」「あの」を消す・句読点・「改行」で改行）',
    firstDl: (mb: number) => `初回だけ音声認識のデータをダウンロードします（約${mb}MB）。Wi-Fiでどうぞ。その後はオフラインで使えます。`,
    prep: '音声認識を準備', dl: (a: number, b: number) => `準備中… ${Math.round((a / b) * 100)}%（${Math.round(a)} / ${Math.round(b)} MB）`,
    loading: '読み込み中…', ready: '準備できました。オフラインでも使えます。', working: '文字にしています…', nothing: '声が聞き取れませんでした。もう一度どうぞ。',
    micNo: 'マイクが使えません。設定でマイクを許可してください。', fail: 'うまくいきませんでした。もう一度お試しください。',
    text: '文字', placeholder: 'ここに文字が入ります。直接直すこともできます。', copy: 'コピー', copied: 'コピーしました', share: '共有', clear: '消す', clearQ: '文字をすべて消しますか？',
    raw: 'そのままの文字を見る', history: '履歴', none: 'まだありません。', del: '削除', delQ: 'この履歴を削除しますか？', use: '使う',
    tips: '話し方のコツ：「改行」と言うと次の行へ、「新しい段落」で1行あけます。ゆっくり、はっきり話すと正確になります。',
    honest: '小さな音声認識なので、聞き間違いがあります。大事な文章は読み返してから使ってください。スマホでは1分の録音を文字にするのに数十秒かかることがあります。',
    foot: '無料・広告なし・ログイン不要。声も文字も外に送りません。初回だけデータをダウンロードし、その後はオフラインで使えます。',
    credit: '音声認識: OpenAI Whisper base（MIT）／transformers.js',
  },
  en: {
    app: 'Voice Typing', lead: 'Speak and it turns into text. Recognition runs on this device, so it works with no signal.', toggle: '日本語', big: 'Large text',
    hold: '🎤 Hold to talk', holdSub: 'Records while held (or tap once to start, tap again to stop)', stop: '⏹ Stop', rec: (s: number) => `Recording… ${s}s`,
    pick: '🎵 From an audio file', speakLang: 'Language spoken', ja: '日本語', en: 'English',
    tidy: 'Tidy up (remove “um”, “uh”, fix punctuation, “new line” starts a new line)',
    firstDl: (mb: number) => `Speech recognition downloads once (about ${mb} MB), so use Wi-Fi. After that it works offline.`,
    prep: 'Get speech recognition ready', dl: (a: number, b: number) => `Getting ready… ${Math.round((a / b) * 100)}% (${Math.round(a)} / ${Math.round(b)} MB)`,
    loading: 'Loading…', ready: 'Ready. Works offline too.', working: 'Turning speech into text…', nothing: "Couldn't hear any words. Please try again.",
    micNo: "Can't use the microphone. Allow it in settings.", fail: 'Something went wrong. Please try again.',
    text: 'Text', placeholder: 'Your words appear here. You can edit them too.', copy: 'Copy', copied: 'Copied', share: 'Share', clear: 'Clear', clearQ: 'Clear all the text?',
    raw: 'Show the untouched text', history: 'History', none: 'Nothing here yet.', del: 'Delete', delQ: 'Delete this entry?', use: 'Use',
    tips: 'Tip: say “new line” to start a new line, “new paragraph” for a blank line. Speaking slowly and clearly helps.',
    honest: 'This is a small recogniser, so it mishears sometimes. Read important text back before using it. On a phone, one minute of speech can take tens of seconds.',
    foot: 'Free, no ads, no login. Your voice and text never leave this device. Data downloads once, then everything works offline.',
    credit: 'Speech recognition: OpenAI Whisper base (MIT) via transformers.js',
  },
}
export type Dict = (typeof dict)['ja']
