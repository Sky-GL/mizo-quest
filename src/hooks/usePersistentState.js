import { useEffect, useState } from 'react'

/**
 * 「どこまで進んだか」を端末に残すための useState。
 * スマホはアプリを切り替えるとタブを読み込み直すことがあり、
 * メモリ上の状態だけだと毎回マップに戻ってしまうため。
 * 学習の成績(storage.js)とは別の名前空間に置き、壊れていても学習記録には触れない。
 */
const NS = 'mizo-quest-resume:'

const read = (key) => {
  try {
    const raw = localStorage.getItem(NS + key)
    return raw == null ? undefined : JSON.parse(raw)
  } catch {
    return undefined
  }
}

export const writeResume = (key, value) => {
  try {
    if (value === undefined) localStorage.removeItem(NS + key)
    else localStorage.setItem(NS + key, JSON.stringify(value))
  } catch {
    /* 保存できなくても学習は続けられる */
  }
}

export const readResume = read

/** prefix で始まる再開情報をまとめて消す(場面を終えたとき、リセットしたときなど) */
export const clearResume = (prefix = '') => {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(NS + prefix))
      .forEach((k) => localStorage.removeItem(k))
  } catch {
    /* noop */
  }
}

/**
 * validate を渡すと、保存値がいまのデータと合わないとき(場面が消えた、問題数が変わった等)は捨てて初期値にする。
 */
export function usePersistentState(key, initial, validate) {
  const [value, setValue] = useState(() => {
    const saved = read(key)
    if (saved !== undefined) {
      try {
        if (!validate || validate(saved)) return saved
      } catch {
        /* 検証中に落ちるような保存値は使わない */
      }
    }
    return typeof initial === 'function' ? initial() : initial
  })

  useEffect(() => {
    writeResume(key, value)
  }, [key, value])

  return [value, setValue]
}
