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

const utter = (text, rate) => {
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  const voice = pickVoice()
  if (voice) u.voice = voice
  u.lang = voice ? voice.lang : 'en-IN'
  u.rate = rate
  window.speechSynthesis.speak(u)
}

/**
 * 文字を発音する。実録音(mp3)があればそちらを優先する。
 * @returns {Promise<'file'|'tts'|'none'>} 実際に使った手段
 */
export const speak = async (char, { rate = 0.7 } = {}) => {
  const text = char?.speak || char?.letter
  if (!text) return 'none'

  try {
    await playAudioFile(char.audioUrl)
    return 'file'
  } catch {
    /* 実録音がなければTTSの近似音へ */
  }

  if (hasVoice()) {
    try {
      utter(text, rate)
      return 'tts'
    } catch {
      /* noop */
    }
  }
  return 'none'
}

/** 任意の文字列(単語や合成音節)を読み上げる */
export const speakText = async (text, { rate = 0.7 } = {}) => {
  if (!text || !hasVoice()) return 'none'
  utter(text, rate)
  return 'tts'
}
