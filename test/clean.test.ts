import assert from 'node:assert/strict'
import { clean, applyCommands } from '../src/clean.ts'

const cases: [string, string][] = [
  ['えー、今日は、あの、駅前のスーパーで牛乳を買いました。改行、明日は雨が降るそうです。', '今日は、駅前のスーパーで牛乳を買いました。\n明日は雨が降るそうです。'],
  ['Um, I went to the store today and, uh, bought some milk. New line. Tomorrow it will rain.', 'I went to the store today and bought some milk.\nTomorrow it will rain.'],
  ['えっと 明日 の 会議 は 10時 から', '明日の会議は10時から。'],
  ['hello there i am fine', 'Hello there I am fine.'],
  ['一行目 段落 二行目', '一行目。\n\n二行目。'],
  ['あの人は親切です。', 'あの人は親切です。'],
  ['え、今日はあの、駅前で買いました。', '今日は駅前で買いました。'],
  ['ええ、そうです。', 'ええ、そうです。'],
]
for (const [i, o] of cases) assert.equal(clean(i), o, i)
assert.equal(applyCommands('a new line b'), 'a\nb')
console.log('clean tests passed:', cases.length + 1)
