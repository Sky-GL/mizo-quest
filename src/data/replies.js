import rawWords from './words.json?raw'
import { ALL_PHRASES, phraseById } from './talk'

/**
 * 返信アシスト。届いたミゾ語を収録フレーズと照合し、意味と返事の候補を出す。
 * 機械翻訳ではないので、収録していない文は単語ごとの手がかりまでしか出せない。
 */

/** 表記ゆれを吸収する: 大文字小文字、ṭ/t、声調記号(â など)、句読点 */
export const normalize = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[’'`]/g, '')

const toTokens = (s) =>
  normalize(s)
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)

/** 文ごとに切る(チャットは改行や ? ! で区切られることが多い) */
export const splitSentences = (text) =>
  text
    .split(/(?<=[.?!。！？])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => toTokens(s).length)
    // 読点でつないだ文(Mangṭha, naktuk ah ...)は、全体で一致しないときだけ読点でも分ける
    .flatMap((s) => {
      if (!/[,、]/.test(s) || (matchSentence(s)[0]?.score ?? 0) >= 0.95) return [s]
      return s.split(/[,、]\s*/).map((x) => x.trim()).filter((x) => toTokens(x).length)
    })

/* ---------- 単語の手がかり ---------- */

// 文法の小さな語は手で決める(フレーズの直訳から拾うと「私は/私の」などがぶれるため)
const CORE = {
  ka: '私(は/の)', i: 'あなた(は/の)', a: 'それ・彼・彼女(は/の)', kan: '私たち(は/の)', in: 'あなたたち(は)/家',
  an: '彼ら(は)', min: '私を/私に', che: 'あなたを', e: '〜よ(言い切り)', em: '〜か?(はい/いいえ)/とても',
  nge: '〜か?(疑問詞と一緒に)', lo: '〜ない/(来る方向)', tawh: 'もう〜した', la: 'まだ/取る', rawh: '〜して(お願い)',
  suh: '〜するな', ah: '〜に/〜で', atanga: '〜から', dawn: '〜するつもり', ang: '〜しよう/〜だろう',
  hi: 'これ(を)', he: 'この', hei: 'これ', chu: '〜は', hle: 'とても', mai: '(強め)', ber: '最も', leh: '〜と',
  ni: '〜である/日', nia: '〜だね', aw: 'うん/〜ね', le: '〜ね', va: 'なんと', hian: '〜で(ここ)',
  eng: '何', engnge: '何か', engzat: 'いくつ/いくら', engtikah: 'いつ', khawiah: 'どこに', khawi: 'どこ',
  khawnge: 'どこ', engtia: 'どのくらい', engtin: 'どう・どのように', nih: '〜である', nang: 'あなた', nangmah: 'あなたは?', kei: '私', keimah: '私は',
  tak: '本当に', takin: '〜に(しっかり)', tur: '〜するための', thei: '〜できる', duh: 'ほしい/〜したい',
  kal: '行く', ei: '食べる', awm: 'ある/いる', nei: '持つ', hre: '知る', hria: '知る',
}

const WORD_GLOSS = Object.fromEntries(
  rawWords
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l))
    .filter((w) => !/\s/.test(w.word.trim()))
    .map((w) => [normalize(w.word), w.meaning])
)

// フレーズの直訳(・区切り)が語数と一致するものから、語ごとの意味を拾う
const PHRASE_GLOSS = (() => {
  const count = {}
  ALL_PHRASES.forEach((p) => {
    const toks = toTokens(p.mizo)
    const parts = p.literal.split('・')
    if (toks.length !== parts.length || toks.length < 2) return
    toks.forEach((t, k) => {
      const g = parts[k].trim()
      count[t] ??= {}
      count[t][g] = (count[t][g] || 0) + 1
    })
  })
  return Object.fromEntries(
    Object.entries(count).map(([t, gs]) => [t, Object.entries(gs).sort((x, y) => y[1] - x[1])[0][0]])
  )
})()

export const glossOf = (tok) => CORE[tok] ?? WORD_GLOSS[tok] ?? PHRASE_GLOSS[tok] ?? null

/* ---------- フレーズ照合 ---------- */

const PHRASE_TOKENS = ALL_PHRASES.map((p) => ({ p, toks: toTokens(p.mizo) }))

// 打ち間違い1文字までは同じ語とみなす(4文字以上のときだけ)
const near = (a, b) => {
  if (a === b) return true
  if (Math.min(a.length, b.length) < 4 || Math.abs(a.length - b.length) > 1) return false
  let i = 0
  let j = 0
  let miss = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue }
    if (++miss > 1) return false
    if (a.length > b.length) i++
    else if (b.length > a.length) j++
    else { i++; j++ }
  }
  return miss + (a.length - i) + (b.length - j) <= 1
}

const overlap = (x, y) => {
  const rest = [...y]
  let n = 0
  x.forEach((t) => {
    const k = rest.findIndex((u) => near(t, u))
    if (k >= 0) { n++; rest.splice(k, 1) }
  })
  return n
}

/** 1文に近いフレーズを近い順に返す。score は 0〜1(1 = 完全一致) */
export const matchSentence = (sentence) => {
  const toks = toTokens(sentence)
  return PHRASE_TOKENS.map(({ p, toks: pt }) => {
    const n = overlap(toks, pt)
    return { phrase: p, score: (2 * n) / (toks.length + pt.length) }
  })
    .filter((m) => m.score >= 0.5)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
}

/* ---------- 返事の候補 ---------- */

// 届いた文 → 返し方。1候補は1行(複数フレーズを続けて言う場合は配列)
const R = {
  chibai: [['chibai', 'i_dam_em'], ['chibai']],
  i_dam_em: [['ka_dam_e', 'nangmah'], ['ka_dam_e', 'ka_lawm_e'], ['ka_hah'], ['ka_damlo']],
  nangmah: [['ka_dam_e'], ['ka_hah']],
  ka_dam_e: [['a_tha_e'], ['nangmah']],
  ka_lawm_e: [['a_tha_e']],
  kan_inhmu: [['kan_inhmu', 'dam_takin'], ['awle']],
  i_hming: [['ka_hming', 'japan_mi']],
  ka_hming: [['ka_hming'], ['a_tha_e']],
  japan_mi: [['a_va_nuam'], ['ekhai']],
  khawngaihin: [['awle'], ['a_tha_e']],
  min_pui_rawh: [['awle'], ['a_tha_e']],
  min_ngaihdam: [['a_tha_e'], ['aw']],
  chaw_i_ei: [['aw_ka_ei'], ['chaw_ei_tawh'], ['chaw_la_ei_lo'], ['ka_duh_lo']],
  a_tui_e: [['a_dik_chiah'], ['a_tui_hle_mai']],
  a_tui_hle_mai: [['a_dik_chiah'], ['ka_hlim']],
  english_thiam: [['a_ni'], ['aih'], ['mizo_tawng']],
  khawiah_nge: [['hetah_awm'], ['ka_hre_lo']],
  bazar_khawi: [['hetah_awm'], ['ka_hre_lo']],
  engtia_hla: [['a_hla_lo'], ['ka_hre_lo']],
  dar_engzat: [['dar_sawm'], ['ka_hre_lo']],
  engtikah: [['vawiin_a_ni'], ['naktuk_inhmu']],
  naktuk_inhmu: [['awle'], ['kan_inhmu', 'dam_takin']],
  unau_nei_em: [['unau_pahnih'], ['ka_nei_lo']],
  naupang_nei: [['ka_nei_lo'], ['a_ni']],
  i_damlo_em: [['ka_damlo'], ['ka_dam_e'], ['ka_hah']],
  damdawi_duh: [['aw', 'ka_lawm_e'], ['ka_duh_lo']],
  khua_a_tha: [['a_dik_chiah'], ['khua_a_lum']],
  khua_a_lum: [['a_dik_chiah'], ['ka_hah']],
  khua_tha_lo: [['a_dik_chiah'], ['ruah_a_sur']],
  ruah_a_sur: [['ekhai'], ['a_dik_chiah']],
  ka_kal_dawn: [['dam_takin'], ['mangtha'], ['kan_inhmu']],
  dam_takin: [['dam_takin'], ['mangtha']],
  mangtha: [['mangtha'], ['kan_inhmu', 'dam_takin']],
  muttui: [['muttui']],
  aw: [['a_tha_e'], ['ka_lawm_e']],
  awle: [['a_tha_e'], ['ka_lawm_e']],
  a_ni: [['a_tha_e'], ['awle']],
  a_ni_lo: [['awle'], ['ka_hre_lo']],
  aih: [['awle']],
  a_tha_e: [['ka_lawm_e'], ['aw']],
  a_dik_chiah: [['aw'], ['ka_hlim']],
  ka_hre_lo: [['awle'], ['a_tha_e']],
  i_ti_tak_tak: [['ka_uang_lo'], ['a_ni']],
  ka_ring_lo: [['ka_uang_lo'], ['a_ni']],
  ka_uang_lo: [['ekhai'], ['ka_ring_lo']],
  min_bawl_suh: [['ka_uang_lo'], ['min_ngaihdam']],
  ekhai: [['i_ti_tak_tak'], ['aw']],
  japan_kal: [['a_va_nuam'], ['ka_lawmpui']],
  a_va_nuam: [['ka_hlim'], ['ka_lawm_e']],
  ka_lawmpui: [['ka_lawm_e'], ['ka_hlim_em_em']],
  ka_hlim: [['ka_lawmpui'], ['a_va_nuam']],
  ka_hlim_em_em: [['ka_lawmpui'], ['a_va_nuam']],
  ka_lungngai: [['engtin_i_nih', 'min_hrilh'], ['aw']],
  ka_hah: [['engtin_i_nih'], ['i_damlo_em'], ['aw']],
  ka_hah_bawn: [['i_damlo_em'], ['aw']],
  ka_damlo: [['engtin_i_nih', 'min_hrilh'], ['i_damlo_em'], ['damdawi_duh']],
  engtin_i_nih: [['ka_damlo'], ['ka_hah'], ['ka_dam_e']],
  ka_hmangaih: [['ka_hmangaih'], ['ka_lawm_e']],
  a_nuihzathlak: [['a_dik_chiah'], ['aw']],
  khawi_atanga: [['japan_atanga']],
  japan_atanga: [['a_va_nuam'], ['ekhai']],
  khawnge_in: [['japan_mi'], ['japan_atanga']],
  chaw_ei_tawh: [['a_tha_e'], ['aw']],
  chaw_la_ei_lo: [['chaw_i_ei'], ['aw']],
  kal_ang: [['awle'], ['ka_kal_ang']],
  ka_kal_ang: [['awle'], ['dam_takin']],
  ka_pi_chibai: [['chibai']],
  ka_pu_chibai: [['chibai']],
}

// 照合できなかったときの定番(質問か、そうでないかで分ける)
const FALLBACK_Q = [['a_ni'], ['a_ni_lo'], ['ka_hre_lo'], ['zawi_zawkin']]
const FALLBACK_S = [['aw'], ['awle'], ['i_ti_tak_tak'], ['ka_hre_lo']]
// どんなときも出す「わからない」ときの返し
export const RESCUE = [['mizo_tawng'], ['zawi_zawkin'], ['ka_hre_lo']].map((ids) => ids.map(phraseById))

const isQuestion = (s) => /\?|？/.test(s) || /\b(em|nge|khawnge)\b/.test(normalize(s))

/**
 * 貼られた文章全体を解析する。
 * 返り値: { sentences: [{ text, matches, words, question }], replies: [[phrase, ...], ...] }
 */
export const analyze = (text) => {
  const sentences = splitSentences(text).map((s) => ({
    text: s,
    matches: matchSentence(s),
    words: toTokens(s).map((t) => ({ t, gloss: glossOf(t) })),
    question: isQuestion(s),
  }))

  const seen = new Set()
  const replies = []
  const add = (ids) => {
    const key = ids.join('+')
    if (seen.has(key)) return
    seen.add(key)
    replies.push(ids.map(phraseById).filter(Boolean))
  }
  // 最後の文(=相手が一番言いたいこと)への返事を先に出す
  ;[...sentences].reverse().forEach((s) => {
    const top = s.matches[0]
    if (top && top.score >= 0.6 && R[top.phrase.id]) R[top.phrase.id].forEach(add)
  })
  if (!replies.length) {
    const lastQ = sentences.length && sentences[sentences.length - 1].question
    ;(lastQ ? FALLBACK_Q : FALLBACK_S).forEach(add)
  }
  return { sentences, replies: replies.slice(0, 8), understood: sentences.some((s) => s.matches[0]?.score >= 0.6) }
}

export const replyText = (phrases) => phrases.map((p) => p.mizo).join(' ')
export const replyJa = (phrases) => phrases.map((p) => p.ja).join(' ')
export const replyKana = (phrases) => phrases.map((p) => p.kana).join(' / ')

/** Google 翻訳(ミゾ語 lus → 日本語)で開くURL。収録外の文の確認用 */
export const googleTranslateUrl = (text) =>
  `https://translate.google.com/?sl=lus&tl=ja&op=translate&text=${encodeURIComponent(text)}`
