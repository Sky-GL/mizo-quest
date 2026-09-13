import raw from './words.json?raw'
import { charById } from './steps'

export const ALL_WORDS = raw
  .split('\n')
  .map((l) => l.trim())
  .filter(Boolean)
  .map((l) => JSON.parse(l))

export const shuffle = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const charsOfWord = (word) => word.chars.map(charById).filter(Boolean)

/** 構成する字をすべて学習済みなら「読める」扱い */
export const isReadable = (word, learnedIds) => word.chars.every((id) => learnedIds.has(id))

/** 読める単語を優先し、足りなければやさしい順(level→字数)で埋める */
export const pickWords = (learnedIds, count = 10) => {
  const readable = ALL_WORDS.filter((w) => isReadable(w, learnedIds))
  // 1字だけの語(ka / i)が先頭に来ると単語らしくないので、2字以上を優先する
  const rest = ALL_WORDS.filter((w) => !isReadable(w, learnedIds)).sort(
    (a, b) =>
      a.level - b.level ||
      (a.chars.length < 2) - (b.chars.length < 2) ||
      a.chars.length - b.chars.length
  )
  return [...shuffle(readable), ...rest].slice(0, count)
}
