import { charsOfStep, ALL_CHARS, TONE_BASE_IDS, TONE_STEP, SHORT_TONE_STEP, charById, toneShape, withTone } from '../data/steps'
import { weightedPick } from './srs'

const shuffle = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** 読みのラベル。カナだけだと同じになる字があるのでIPAも添える */
const label = (c) => `${c.kana} ${c.ipa}`

// ダミー選択肢は同じグループ優先(似ているほど良問になる)
const distractors = (target, pool, n = 3) => {
  const same = pool.filter((c) => c.id !== target.id && c.group === target.group)
  const other = pool.filter((c) => c.id !== target.id && c.group !== target.group)
  return shuffle(same).slice(0, n).concat(shuffle(other)).slice(0, n)
}

const makeChoiceQ = (target, pool, direction) => {
  const wrongs = distractors(target, pool)
  const options = shuffle([target, ...wrongs])
  if (direction === 'char2read') {
    return {
      kind: 'char2read',
      charId: target.id,
      prompt: target.letter,
      promptSub: 'この字の読みは?',
      speakChar: target,
      options: options.map((o) => ({ id: o.id, text: label(o) })),
      answerId: target.id,
      explain: target.note,
    }
  }
  return {
    kind: 'read2char',
    charId: target.id,
    prompt: label(target),
    promptSub: 'この読みの字は?',
    speakChar: target,
    options: options.map((o) => ({ id: o.id, text: o.letter, big: true })),
    answerId: target.id,
    explain: target.note,
  }
}

/** 声調Step専用: 「この音の高さの動きはどれ?」を折れ線で答えさせる */
const makeToneQ = (step) => {
  const tones = charsOfStep(step).filter((c) => toneShape(c))
  if (tones.length < 4) return null
  const tone = tones[Math.floor(Math.random() * tones.length)]
  const baseId = TONE_BASE_IDS[Math.floor(Math.random() * TONE_BASE_IDS.length)]
  const base = charById(baseId)
  const wrongs = shuffle(tones.filter((t) => t.id !== tone.id)).slice(0, 3)
  const options = shuffle([tone, ...wrongs]).map((t) => ({
    id: t.id,
    text: t.kana,
    tone: { shape: toneShape(t), base: base.letter.toLowerCase() },
  }))
  return {
    kind: 'tone',
    charId: tone.id,
    prompt: withTone(base.letter.toLowerCase(), toneShape(tone).mark),
    promptSub: `${base.letter} をこの記号で読むと、音の高さはどう動く?`,
    speakChar: base,
    options,
    answerId: tone.id,
    explain: tone.note,
  }
}

/** Stepクリア用クイズを生成(字→読み と 読み→字 の双方向) */
export const buildStepQuiz = (step, stats = {}, count = 10) => {
  const chars = charsOfStep(step)
  const pool = chars.length >= 4 ? chars : ALL_CHARS.filter((c) => c.step <= step)

  if (step === TONE_STEP || step === SHORT_TONE_STEP) {
    // 声調Stepは「高さの動きを当てる」問題を重点出題(6割)
    const qs = []
    const n = Math.max(count, 12)
    for (let i = 0; i < n; i++) {
      const tq = i % 5 < 3 ? makeToneQ(step) : null
      if (tq) qs.push(tq)
      else {
        const t = weightedPick(chars, stats, chars.length)[i % chars.length]
        qs.push(makeChoiceQ(t, pool, i % 2 ? 'char2read' : 'read2char'))
      }
    }
    return shuffle(qs)
  }

  const targets = []
  const picked = weightedPick(chars, stats, chars.length)
  while (targets.length < Math.max(count, chars.length)) {
    targets.push(...picked)
  }
  return targets
    .slice(0, Math.max(count, chars.length))
    .map((t, i) => makeChoiceQ(t, pool, i % 2 ? 'char2read' : 'read2char'))
}

/** 復習モード用: 実際に一度でも解答した字から誤答優先で出題 */
export const buildReviewQuiz = (stats = {}, count = 12) => {
  const learnedIds = new Set(Object.keys(stats))
  const learned = ALL_CHARS.filter((c) => learnedIds.has(c.id))
  if (learned.length === 0) return []
  const targets = weightedPick(learned, stats, Math.min(count, learned.length))
  return shuffle(targets.map((t, i) => makeChoiceQ(t, learned, i % 2 ? 'char2read' : 'read2char')))
}

/**
 * 4択チャレンジ用の1問。
 * weightedPick(n=1)だと毎回ほぼ同じ字になるので、優先度上位から1つ引く(直前と同じ字は避ける)。
 */
export const buildChallengeQ = (pool, stats = {}, direction, excludeId = null) => {
  if (pool.length < 4) return null
  const cands = weightedPick(pool, stats, Math.min(6, pool.length))
  const usable = cands.filter((c) => c.id !== excludeId)
  const list = usable.length ? usable : cands
  const target = list[Math.floor(Math.random() * list.length)]
  return makeChoiceQ(target, pool, direction)
}

export { shuffle }
