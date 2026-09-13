import { useMemo, useState } from 'react'
import SpeakButton from './SpeakButton'
import { playCorrect, playWrong, playClear } from '../lib/sfx'
import { PATTERNS, buildSubjectDrill, buildTransformDrill, shuffle, focusChars } from '../data/talk'

/** 文末の助詞だけを入れ替えた誤答を作る(lo / em / e / nge の使い分けを試すため) */
const TAILS = ['lo.', 'em?', 'e.', 'nge?']
const swapTail = (s, tail) => s.replace(/\s(lo|em|e|nge)([.?!])?$/, ` ${tail}`)

const tailOptions = (correct) => {
  const set = [correct]
  TAILS.forEach((t) => {
    const v = swapTail(correct, t)
    if (v !== correct && !set.includes(v) && set.length < 4) set.push(v)
  })
  return shuffle(set)
}

/**
 * パターン練習。フレーズを1つずつ覚えるのではなく、
 * 「主語の付け方」「否定の作り方」「質問の作り方」の3つの型を身につける。
 * 型が入ると、覚えたフレーズを自分で作り変えられるようになる。
 */
export default function PatternDrill({ onBack, onAnswer }) {
  const [patternId, setPatternId] = useState(PATTERNS[0].id)
  const pattern = PATTERNS.find((p) => p.id === patternId)

  return (
    <div className="screen talk" style={{ '--accent': 'var(--c-pattern)' }}>
      <div className="screen-head">
        <button className="btn ghost" onClick={onBack}>← マップ</button>
        <div className="head-title">
          <span className="step-emoji">🧩</span>
          <div>
            <h2>パターン練習</h2>
            <p>フレーズを増やすより、作り方の型を覚えるほうが早い。</p>
          </div>
        </div>
      </div>

      <div className="stage-row">
        {PATTERNS.map((p) => (
          <button
            key={p.id}
            className={`stage-chip ${p.id === patternId ? 'on' : ''}`}
            onClick={() => setPatternId(p.id)}
          >
            <span>{p.emoji}</span>
            {p.id === 'subject' ? '主語' : p.id === 'negate' ? '否定' : '質問'}
          </button>
        ))}
      </div>

      <div className="rule-card">
        <h3>{pattern.title}</h3>
        <p>{pattern.rule}</p>
      </div>

      {pattern.id === 'subject' ? (
        <SubjectDrill key={pattern.id} pattern={pattern} onAnswer={onAnswer} />
      ) : (
        <TransformDrill key={pattern.id} pattern={pattern} onAnswer={onAnswer} />
      )}
    </div>
  )
}

/* -------- 主語接頭辞: 6つ × 動詞 -------- */

function SubjectDrill({ pattern, onAnswer }) {
  const [round, setRound] = useState(0)
  const questions = useMemo(() => buildSubjectDrill(pattern, 8), [pattern, round])
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const [showTable, setShowTable] = useState(false)

  const q = questions[idx]

  // 誤答は「動詞は合っているが主語が違う」「主語は合っているが動詞が違う」を混ぜる
  const options = useMemo(() => {
    if (!q) return []
    const sameRoot = shuffle(pattern.slots.filter((s) => s.key !== q.slot.key)).slice(0, 2)
    const sameSlot = shuffle(pattern.roots.filter((r) => r.root !== q.root.root)).slice(0, 1)
    return shuffle([
      q.answer,
      ...sameRoot.map((s) => `${s.key} ${q.root.root}`),
      ...sameSlot.map((r) => `${q.slot.key} ${r.root}`),
    ])
  }, [q, pattern])

  if (!q) return null

  const answer = (o) => {
    if (picked) return
    const ok = o === q.answer
    if (ok) {
      playCorrect()
      setScore((s) => s + 1)
    } else {
      playWrong()
    }
    focusChars(q.answer).forEach((id) => onAnswer(id, ok))
    setPicked(o)
  }

  const next = () => {
    if (idx + 1 >= questions.length) {
      playClear()
      setRound((r) => r + 1)
      setIdx(0)
      setScore(0)
    } else {
      setIdx(idx + 1)
    }
    setPicked(null)
  }

  return (
    <>
      <div className="slot-grid">
        {pattern.slots.map((s) => (
          <div key={s.key} className="slot-chip">
            <strong>{s.key}</strong>
            <small>{s.ja}</small>
          </div>
        ))}
      </div>

      <button className="btn ghost sm" onClick={() => setShowTable((v) => !v)}>
        {showTable ? '早見表を閉じる' : `早見表を見る(${pattern.slots.length}×${pattern.roots.length}=${pattern.slots.length * pattern.roots.length}通り)`}
      </button>

      {showTable && (
        <div className="table-wrap">
          <table className="pat-table">
            <thead>
              <tr>
                <th></th>
                {pattern.roots.map((r) => (
                  <th key={r.root}>{r.root}<small>{r.ja}</small></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pattern.slots.map((s) => (
                <tr key={s.key}>
                  <th>{s.key}<small>{s.ja}</small></th>
                  {pattern.roots.map((r) => (
                    <td key={r.root}>{s.key} {r.root}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="quiz-head">
        <div className="quiz-bar"><div className="quiz-fill" style={{ width: `${(idx / questions.length) * 100}%` }} /></div>
        <span className="quiz-count">{idx + 1}/{questions.length}</span>
      </div>

      <div className="pick-card">
        <p className="pick-label">ミゾ語でどう言う?</p>
        <h3 className="pick-ja">{q.ja}</h3>
      </div>

      <div className="options">
        {options.map((o) => {
          const state = !picked ? '' : o === q.answer ? 'correct' : o === picked ? 'wrong' : 'dim'
          return (
            <button key={o} className={`option ${state}`} onClick={() => answer(o)} disabled={!!picked}>
              {o}
            </button>
          )
        })}
      </div>

      {picked && (
        <div className={`feedback ${picked === q.answer ? 'ok' : 'ng'}`}>
          <strong>{picked === q.answer ? '正解!' : `正解は ${q.answer}`}</strong>
          <p className="fb-kana">{q.kana} — {q.slot.ja}({q.slot.key}) + {q.root.ja}({q.root.root})</p>
          <div className="cta-row">
            <SpeakButton text={q.answer} size="sm" />
            <button className="btn primary" onClick={next} autoFocus>
              {idx + 1 >= questions.length ? `もう1セット(${score}/${questions.length}正解) →` : '次へ →'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}

/* -------- 否定・質問: 文末の助詞を選ぶ -------- */

function TransformDrill({ pattern, onAnswer }) {
  const [round, setRound] = useState(0)
  const questions = useMemo(() => buildTransformDrill(pattern, 6), [pattern, round])
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)

  const q = questions[idx]
  const options = useMemo(() => (q ? tailOptions(q.to) : []), [q])

  if (!q) return null

  const answer = (o) => {
    if (picked) return
    const ok = o === q.to
    if (ok) {
      playCorrect()
      setScore((s) => s + 1)
    } else {
      playWrong()
    }
    focusChars(q.to).forEach((id) => onAnswer(id, ok))
    setPicked(o)
  }

  const next = () => {
    if (idx + 1 >= questions.length) {
      playClear()
      setRound((r) => r + 1)
      setIdx(0)
      setScore(0)
    } else {
      setIdx(idx + 1)
    }
    setPicked(null)
  }

  return (
    <>
      <div className="quiz-head">
        <div className="quiz-bar"><div className="quiz-fill" style={{ width: `${(idx / questions.length) * 100}%` }} /></div>
        <span className="quiz-count">{idx + 1}/{questions.length}</span>
      </div>

      <div className="pick-card transform">
        <div className="tf-from">
          <span className="tf-label">もとの文</span>
          <strong>{q.from}</strong>
          <small>{q.fromJa}</small>
        </div>
        <div className="tf-arrow">↓</div>
        <div className="tf-to">
          <span className="tf-label">これを言いたい</span>
          <strong>{q.toJa}</strong>
        </div>
      </div>

      <div className="options">
        {options.map((o) => {
          const state = !picked ? '' : o === q.to ? 'correct' : o === picked ? 'wrong' : 'dim'
          return (
            <button key={o} className={`option ${state}`} onClick={() => answer(o)} disabled={!!picked}>
              {o}
            </button>
          )
        })}
      </div>

      {picked && (
        <div className={`feedback ${picked === q.to ? 'ok' : 'ng'}`}>
          <strong>{picked === q.to ? '正解!' : `正解は ${q.to}`}</strong>
          <p className="fb-note">{pattern.rule}</p>
          <div className="cta-row">
            <SpeakButton text={q.to} size="sm" />
            <button className="btn primary" onClick={next} autoFocus>
              {idx + 1 >= questions.length ? `もう1セット(${score}/${questions.length}正解) →` : '次へ →'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
