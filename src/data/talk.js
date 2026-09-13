import rawPhrases from './phrases.json?raw'
import rawScenes from './scenes.json?raw'
import rawPatterns from './patterns.json?raw'
import { charById } from './steps'

/** 1行1JSONを配列にする(他のデータファイルと同じ持ち方) */
const parseLines = (raw) =>
  raw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => JSON.parse(l))

export const ALL_PHRASES = parseLines(rawPhrases)
export const SCENES = parseLines(rawScenes)
export const PATTERNS = parseLines(rawPatterns)

export const phraseById = (id) => ALL_PHRASES.find((p) => p.id === id)

/** 場面のまとまり。いきなり12個並べると選べないので3段に分ける */
export const SCENE_GROUPS = [
  { key: 'basic', title: 'まずこれだけ', emoji: '🌱', note: 'この4場面が言えれば、あいさつして名乗って助けを求められる' },
  { key: 'town', title: '街で使う', emoji: '🏘️', note: '食べる・買う・たずねる・約束する' },
  { key: 'talk', title: '人と話す', emoji: '💬', note: '世間話をして、気持ちよく別れる' },
]

export const scenesOfGroup = (key) => SCENES.filter((s) => s.group === key)
export const sceneById = (id) => SCENES.find((s) => s.id === id)

/**
 * その場面で練習するフレーズ(重複なし)。
 * まず会話に出てくる順、そのあとに「この場面で習うが今回の会話には出ていない」ものを足す。
 * 会話に入れると不自然になる言い換え(A ni lo / Ka duh lo など)も
 * 場面の一部として練習させたいので、両方から拾う。
 */
export const phrasesOfScene = (scene) => {
  const seen = new Set()
  const out = []
  const add = (p) => {
    if (!p || seen.has(p.id)) return
    seen.add(p.id)
    out.push(p)
  }
  scene.lines.forEach((line) => line.ids.forEach((id) => add(phraseById(id))))
  ALL_PHRASES.filter((p) => p.scene === scene.id).forEach(add)
  return out
}

/** 1行分のミゾ語(1行に複数フレーズが入ることがある) */
export const lineText = (line) =>
  line.ids
    .map((id) => phraseById(id)?.mizo)
    .filter(Boolean)
    .join(' ')

export const lineJa = (line) =>
  line.ids
    .map((id) => phraseById(id)?.ja)
    .filter(Boolean)
    .join(' ')

/** 組み立て問題用に単語へ切る(記号は落とす) */
export const tokenize = (mizo) =>
  mizo
    .replace(/[?!.,]/g, '')
    .split(/\s+/)
    .filter(Boolean)

/**
 * 綴りから「関門音」を拾って、Stepの文字学習と結びつける。
 * 会話で正解したときに、その文に含まれる字の成績にも反映させるために使う。
 */
const DIGRAPHS = [
  ['ṭ', 'tt'],
  ['aw', 'aw'],
  ['ch', 'ch'],
  ['ng', 'ng'],
]

export const focusChars = (mizo) => {
  const s = mizo.toLowerCase()
  const ids = []
  const push = (id) => {
    if (id && !ids.includes(id) && charById(id)) ids.push(id)
  }

  DIGRAPHS.forEach(([pat, id]) => {
    if (s.includes(pat)) push(id)
  })

  // 語末の子音(開放せずに止める音)。単語ごとに末尾を見る
  s.replace(/[^a-zṭ]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .forEach((w) => {
      const m = w.match(/(ng|[ptkhmnlr])$/)
      if (m) push(m[1] === 'ng' ? 'fin_ng' : `fin_${m[1]}`)
    })

  return ids
}

export const shuffle = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** 4択のダミー選択肢。同じシーン内を優先し、足りなければ全体から借りる */
export const distractors = (target, pool, n = 3) => {
  const same = shuffle(pool.filter((p) => p.id !== target.id))
  const others = shuffle(ALL_PHRASES.filter((p) => p.id !== target.id && !pool.includes(p)))
  return [...same, ...others].slice(0, n)
}

/** パターン練習の出題を作る(主語接頭辞 × 動詞) */
export const buildSubjectDrill = (pattern, n = 8) => {
  const combos = []
  pattern.slots.forEach((s) =>
    pattern.roots.forEach((r) =>
      combos.push({
        id: `${pattern.id}-${s.key}-${r.root}`,
        ja: `${s.ja}${r.ja}`,
        answer: `${s.key} ${r.root}`,
        kana: `${s.kana} ${r.kana}`,
        slot: s,
        root: r,
      })
    )
  )
  return shuffle(combos).slice(0, n)
}

/** パターン練習の出題を作る(否定・疑問の変形) */
export const buildTransformDrill = (pattern, n = 6) =>
  shuffle(pattern.pairs).slice(0, n).map((p, i) => ({
    id: `${pattern.id}-${i}-${p.to}`,
    ...p,
  }))
