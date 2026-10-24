# 音声入力 / Voice Typing

話すだけで文字に。Offline voice typing: speak and it turns into text. Speech recognition runs **on your device**, so after the first download it works with no signal.

- 🎤 Hold to talk, or tap once to start and tap again to stop (up to 5 minutes). Or pick an audio file.
- Japanese or English (日本語 / English switch).
- Optional rule-based tidy-up (no AI, instant): removes fillers (えー, えっと, あの, うーん, um, uh…), fixes punctuation and spacing, and turns spoken commands into line breaks: 「改行」/ "new line", 「新しい段落」/ "new paragraph".
- Edit the text, then Copy or Share. History is kept only on your device (IndexedDB).
- 日本語 by default with an English switch, and a 大きい文字 / Large text switch.

How it works: OpenAI Whisper base (multilingual, 8-bit, about 76 MB) via [transformers.js](https://github.com/huggingface/transformers.js), downloaded once and cached (CacheFirst), then offline.
It's a small recogniser: it mishears sometimes, especially names and quiet or noisy audio. Read important text back.

Free. No ads. No login. Your voice never leaves your device. Part of the [free app family](https://gutsmcd-cmd.github.io/free-apps/).

Tests: `npm test` (tidy-up rules). Browser tests feed audio through `window.__dictate(blob)`.

MIT licence.
