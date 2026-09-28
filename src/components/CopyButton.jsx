import { useEffect, useRef, useState } from 'react'

/**
 * ミゾ語をワンタップでコピーする。翻訳アプリやメッセージに貼るため。
 * HTTPS でない環境だと navigator.clipboard が無いので、その場合は
 * 画面外の textarea を作って execCommand で落とす。
 */
const writeText = async (text) => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* 権限が無い等。下の手で落とす */
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.cssText = 'position:fixed;top:-1000px;opacity:0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

export default function CopyButton({ text, size = 'md', label }) {
  const [state, setState] = useState('idle') // idle | done | fail
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  const handle = async (e) => {
    e.stopPropagation() // カード全体の開閉クリックを巻き込まない
    e.preventDefault()
    const ok = await writeText(text)
    setState(ok ? 'done' : 'fail')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setState('idle'), 1400)
  }

  return (
    <button
      type="button"
      className={`copy-btn ${size} ${state}`}
      onClick={handle}
      title={state === 'fail' ? 'コピーできませんでした' : `「${text}」をコピー`}
      aria-label={`${text} をコピー`}
    >
      <span className="copy-icon">{state === 'done' ? '✓' : state === 'fail' ? '✕' : '📋'}</span>
      {label && <span className="copy-label">{state === 'done' ? 'コピーした' : label}</span>}
    </button>
  )
}
