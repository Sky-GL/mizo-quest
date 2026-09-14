// 発音再生: ミゾ語のTTS音声はブラウザに存在しないため、英語(インド英語優先)の音声で
// ローマ字綴りを読ませた「参考音声」を鳴らす。正確な音は note の説明と、
// /public/audio/ に実録音を置いたときの mp3 フォールバックで担保する。

let cachedVoices = null

const loadVoices = () => {
  if (!('speechSynthesis' in window)) return []
  const v = window.speechSynthesis.getVoices()
  if (v.length) cachedVoices = v
  return cachedVoices || []
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices()
  window.speechSynthesis.onvoiceschanged = loadVoices
}

export const speechSupported = () => typeof window !== 'undefined' && 'speechSynthesis' in window

/** インド英語 > その他の英語 の順で音声を選ぶ(母音がミゾ語の綴りに比較的近いため) */
const pickVoice = () => {
  const voices = loadVoices()
  return (
    voices.find((v) => /^en[-_]IN/i.test(v.lang)) ||
    voices.find((v) => /^en[-_]GB/i.test(v.lang)) ||
    voices.find((v) => /^en/i.test(v.lang)) ||
    null
  )
}

export const hasVoice = () => speechSupported() && !!pickVoice()

/** 音声はあくまで近似であることをUIに出すためのフラグ */
export const IS_APPROXIMATE_TTS = true

const playAudioFile = (url) =>
  new Promise((resolve, reject) => {
    if (!url) return reject(new Error('no audio url'))
    const audio = new Audio(url)
    audio.onended = () => resolve('file')
    audio.onerror = () => reject(new Error('audio file missing'))
    audio.play().catch(reject)
  })

/**
 * 読み上げの世代番号。新しい再生を始めるたびに繰り上げ、
 * 古い連続再生のループを止めるのに使う。
 */
let generation = 0

/** 再生中のものを止めて、新しい世代番号を返す */
export const stopSpeaking = () => {
  generation += 1
  if (speechSupported()) window.speechSynthesis.cancel()
  return generation
}

/**
 * 読み上げる中身に合わせた速さを決める。
 * 1字だけなら舌の形を追えるようゆっくり、文は普通の速さで流す。
 * 文をゆっくり読ませると単語がぶつ切りに聞こえて、かえって聞き取りにくい。
 */
export const RATE = { slow: 0.7, word: 0.9, sentence: 1.0 }

export const naturalRate = (text) => {
  const t = (text || '').trim()
  if (/[\s.,!?]/.test(t)) return RATE.sentence // 空白か句読点があれば文として扱う
  if (t.length <= 3) return RATE.slow           // A / AW / CH のような1字単位
  return RATE.word
}

/**
 * onend が来ない環境があるので、保険として打ち切る時間を見積もる。
 * 実際の発話より必ず長くなるよう、多めに取る。
 */
const estimateMs = (text, rate) =>
  Math.min(20000, (900 + text.length * 130) / Math.max(rate, 0.3))

/**
 * 1回分の発話。**終わるまで待つ** Promise を返すのが要点。
 * 以前は投げっぱなしだったので、次の発話の cancel() が前の文を途中で切っていた。
 */
const utter = (text, rate) =>
  new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text)
    const voice = pickVoice()
    if (voice) u.voice = voice
    u.lang = voice ? voice.lang : 'en-IN'
    u.rate = rate

    let settled = false
    const finish = (result) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve(result)
    }
    const timer = setTimeout(() => finish('tts'), estimateMs(text, rate))
    u.onend = () => finish('tts')
    u.onerror = () => finish('none')

    try {
      window.speechSynthesis.speak(u)
    } catch {
      finish('none')
    }
  })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * 文字を発音する。実録音(mp3)があればそちらを優先する。
 * @returns {Promise<'file'|'tts'|'none'>} 実際に使った手段
 */
export const speak = async (char, { rate } = {}) => {
  const text = char?.speak || char?.letter
  if (!text) return 'none'
  const r = rate ?? naturalRate(text)

  stopSpeaking()

  try {
    await playAudioFile(char.audioUrl)
    return 'file'
  } catch {
    /* 実録音がなければTTSの近似音へ */
  }

  if (!hasVoice()) return 'none'
  return utter(text, r)
}

/** 任意の文字列(単語や文)を読み上げる。終わるまで待つ */
export const speakText = async (text, { rate } = {}) => {
  if (!text || !hasVoice()) return 'none'
  stopSpeaking()
  return utter(text, rate ?? naturalRate(text))
}

/**
 * 複数の文を続けて読み上げる。1つ言い終えてから次に移るので、
 * 会話を通しで聞いたときに文が途中で切れない。
 * 新しい再生が始まったら途中でも止める。
 *
 * @param {(string|{text: string, rate?: number})[]} items 読み上げる文の並び。
 *        1つずつ速さを変えたいときはオブジェクトで渡す
 * @param {{gap?: number, rate?: number, onStep?: (i: number) => void}} opts
 *        gap は文と文のあいだの無音(ms)。onStep には今読んでいる位置が渡る(終了時は -1)。
 *        rate を省くと中身に合わせて決める(文は普通の速さ、1字はゆっくり)。
 */
export const speakSequence = async (items, { gap = 450, rate, onStep } = {}) => {
  const list = (items || [])
    .filter(Boolean)
    .map((it) => (typeof it === 'string' ? { text: it } : it))
    .filter((it) => it.text)
  if (!list.length || !hasVoice()) {
    onStep?.(-1)
    return 'none'
  }

  const mine = stopSpeaking()
  const alive = () => mine === generation

  for (let i = 0; i < list.length; i++) {
    if (!alive()) return 'stopped'
    onStep?.(i)
    await utter(list[i].text, list[i].rate ?? rate ?? naturalRate(list[i].text))
    if (!alive()) return 'stopped'
    if (i < list.length - 1) await sleep(gap)
  }

  onStep?.(-1)
  return 'tts'
}
