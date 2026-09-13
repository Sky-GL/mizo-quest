import raw from './mizo-data.json?raw'

/** 1行1JSONで持っているデータを配列にする(行単位なのでdiffが読みやすい) */
export const ALL_CHARS = raw
  .split('\n')
  .map((l) => l.trim())
  .filter(Boolean)
  .map((l) => JSON.parse(l))

export const STEPS = [
  { step: 1, title: '母音6つ', subtitle: '★ AW が最初の関門', emoji: '🌱', color: 'var(--step-1)',
    tip: 'ミゾ語の母音は A AW E I O U の6つ。AW は2文字だがこれで1文字、英語 law の「オー」。O とどう違うかを耳で掴むのが最初の仕事。' },
  { step: 2, title: 'やさしい子音', subtitle: '日本語の感覚で読める10字', emoji: '😊', color: 'var(--step-2)',
    tip: 'B D H K L M N P S T はほぼ日本語と同じ感覚でいける。ここは一気に。' },
  { step: 3, title: '日本語にない子音', subtitle: 'F V Z R G J', emoji: '👅', color: 'var(--step-3)',
    tip: '英語にはある音だが、日本語話者は L と R、S と Z の区別でつまずきやすい。' },
  { step: 4, title: '2文字の字とそり舌', subtitle: '★ CH NG Ṭ', emoji: '👑', color: 'var(--step-4)',
    tip: 'CH と NG は2文字で1文字扱い。NG は日本語と違って語頭に立てる。Ṭ は舌を反らせるT で、Ṭawng(言語)のような頻出語に出る。' },
  { step: 5, title: '語末の子音', subtitle: '開放しない止め方', emoji: '🛑', color: 'var(--step-5)',
    tip: '語末の p t k は「プ・ト・ク」と開放せず、口の形を作って止めるだけ。日本語の促音「っ」に近い。' },
  { step: 6, title: '母音の長短と声調', subtitle: '★ 長母音の4声調', emoji: '🎵', color: 'var(--step-6)',
    tip: 'ミゾ語は声調言語。まず長短を区別し、その上で高・低・上昇・下降の4つを分ける。ミゾ語の綴りでは長さを山記号(â)で示すが、ここでは下降の â と区別するため長さは横線(ā)で表す。' },
  { step: 7, title: '短母音の声調', subtitle: 'ラスボス', emoji: '🏔️', color: 'var(--step-7)',
    tip: '短い母音にも高・低・上昇・下降がある。a aw e i u は合計8声調、O だけは短い3声調しか持たない。' },
]

export const stepMeta = (step) => STEPS.find((s) => s.step === step)
export const charsOfStep = (step) => ALL_CHARS.filter((c) => c.step === step)
export const charById = (id) => ALL_CHARS.find((c) => c.id === id)

/** 声調ラボで使うStep(ハードコードを避けて題名から引く) */
export const TONE_STEP = STEPS.find((s) => s.title.startsWith('母音の長短')).step
export const SHORT_TONE_STEP = STEPS.find((s) => s.title.startsWith('短母音')).step

/** 声調ラボで組み合わせる土台の音節 */
export const TONE_BASE_IDS = ['a', 'aw', 'e', 'i', 'u']

/**
 * 声調の見せ方。ピッチの折れ線(0=低, 1=高)と記号。
 * 実際の音高は話者や語によって動くので、あくまで型の目安として示す。
 */
/**
 * 声調の見せ方。ピッチの折れ線(0=低, 1=高)と、母音に乗せる結合ダイアクリティカルマーク。
 * 実際の音高は話者や語によって動くので、あくまで型の目安として示す。
 */
export const TONE_SHAPES = {
  t_high: { curve: [0.8, 0.8], mark: '\u0301', markName: '´', label: '高' },
  t_low: { curve: [0.25, 0.25], mark: '\u0300', markName: '`', label: '低' },
  t_rise: { curve: [0.25, 0.85], mark: '\u030C', markName: 'ˇ', label: '上昇' },
  t_fall: { curve: [0.85, 0.25], mark: '\u0302', markName: 'ˆ', label: '下降' },
  s_high: { curve: [0.8, 0.8], mark: '\u030B', markName: '˝', label: '短高' },
  s_low: { curve: [0.25, 0.25], mark: '\u030F', markName: '˵', label: '短低' },
  s_rise: { curve: [0.3, 0.8], mark: '\u0306', markName: '˘', label: '短昇' },
  s_fall: { curve: [0.8, 0.3], mark: '\u0311', markName: '˓', label: '短降' },
  len_short: { curve: [0.5, 0.5], mark: '', markName: '(なし)', label: '短' },
  len_long: { curve: [0.5, 0.5], mark: '\u0304', markName: 'ˉ', label: '長' },
}

/**
 * 母音に声調記号を乗せる。
 * AW のような2文字の母音でも、記号は最初の文字の上に来るようにする。
 */
export const withTone = (letter, mark) => {
  if (!mark) return letter
  const [head, ...rest] = [...letter]
  return head + mark + rest.join('')
}

export const isTone = (c) => c.group === 'tone' || c.group === 'tone_short'
export const toneShape = (c) => TONE_SHAPES[c.id] || null

/** 音節 = 土台の母音 + 声調。声調カードは単体だと形が分かりにくいので合成して見せる */
export const toneSyllable = (base, tone) => {
  const shape = TONE_SHAPES[tone.id]
  const low = base.letter.toLowerCase()
  return {
    display: withTone(low, shape ? shape.mark : ''),
    kana: `${base.kana}(${shape ? shape.label : ''})`,
    speak: base.speak,
  }
}
