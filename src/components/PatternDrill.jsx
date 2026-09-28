import { useState } from 'react'
import { usePersistentState } from '../hooks/usePersistentState'
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
 * 主語・否定・質問・程度・時・語順・お願い・後置詞の型を身につける。
 * 型が入ると、覚えたフレーズを自分で作り変えられるようになる。
 */
export default function PatternDrill({ sid, onBack, onAnswer, onGrammar, initial }) {
  // 選んでいる型は画面(sid)ごとに残す。文法ページから型を指定して来たときはそれで始める
  const [sel, setSel] = usePersistentState(
    'pattern:id',
    () => ({ sid, id: PATTERNS.some((p) => p.id === initial) ? initial : PATTERNS[0].id }),
    (v) => v.sid === sid && PATTERNS.some((p) => p.id === v.id)
  )
  const patternId = sel.id
  const setPatternId = (id) => setSel({ sid, id })
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
        {onGrammar && (
          <button className="btn sm secondary gm-link" onClick={onGrammar}>📖 文法のしくみ</button>
        )}
      </div>

      <div className="stage-row">
        {PATTERNS.map((p) => (
          <button
            key={p.id}
            className={`stage-chip ${p.id === patternId ? 'on' : ''}`}
            onClick={() => setPatternId(p.id)}
          >
            <span>{p.emoji}</span>
            {p.short}
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

/**
 * 1セット分の出題・何問目・選んだ答え・選択肢の並びをまとめて端末に残す。
 * 読み込み直しても同じ問題から続けられ、選び直しで二重に記録されることもない。
 */
function useDrill(pattern, build, makeOptions, answerOf, onAnswer) {
  const fresh = () => {
    const questions = build()
    return { pid: pattern.id, questions, idx: 0, picked: null, score: 0, options: questions.length ? makeOptions(questions[0]) : [] }
  }
  const [st, setSt] = usePersistentState(
    `pattern:drill:${pattern.id}`,
    fresh,
    (v) => v.pid === pattern.id && Array.isArray(v.questions) && v.idx < v.questions.length
  )
  const q = st.questions[st.idx]

  const answer = (o) => {
    if (st.picked) return
    const ok = o === answerOf(q)
    ok ? playCorrect() : playWrong()
    focusChars(answerOf(q)).forEach((id) => onAnswer(id, ok))
    setSt((s) => ({ ...s, picked: o, score: s.score + (ok ? 1 : 0) }))
  }

  const next = () => {
    if (st.idx + 1 >= st.questions.length) {
      // 1周したら新しい問題で次のセットへ
      playClear()
      setSt(fresh())
    } else {
      setSt((s) => ({ ...s, idx: s.idx + 1, picked: null, options: makeOptions(s.questions[s.idx + 1]) }))
    }
  }

  return { questions: st.questions, idx: st.idx, picked: st.picked, score: st.score, options: st.options, q, answer, next }
}

function SubjectDrill({ pattern, onAnswer }) {
  const [showTable, setShowTable] = useState(false)

  // 誤答は「動詞は合っているが主語が違う」「主語は合っているが動詞が違う」を混ぜる
  const makeOptions = (q) => {
    const sameRoot = shuffle(pattern.slots.filter((s) => s.key !== q.slot.key)).slice(0, 2)
    const sameSlot = shuffle(pattern.roots.filter((r) => r.root !== q.root.root)).slice(0, 1)
    return shuffle([
      q.answer,
      ...sameRoot.map((s) => `${s.key} ${q.root.root}`),
      ...sameSlot.map((r) => `${q.slot.key} ${r.root}`),
    ])
  }
  const { questions, idx, picked, score, options, q, answer, next } = useDrill(
    pattern,
    () => buildSubjectDrill(pattern, 8),
    makeOptions,
    (q) => q.answer,
    onAnswer
  )

  if (!q) return null

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
  const { questions, idx, picked, score, options, q, answer, next } = useDrill(
    pattern,
    () => buildTransformDrill(pattern, 6),
    // 助詞の入れ替えで誤答が作れない型(強調など)は、データ側の options を使う
    (q) => (q.options ? shuffle(q.options) : tailOptions(q.to)),
    (q) => q.to,
    onAnswer
  )

  if (!q) return null

  return (
    <>
      <div className="quiz-head">
        <div className="quiz-bar"><div className="quiz-fill" style={{ width: `${(idx / questions.length) * 100}%` }} /></div>
        <span className="quiz-count">{idx + 1}/{questions.length}</span>
      </div>

      <div className="pick-card transform">
        <div className="tf-from">
          <span className="tf-label">{pattern.fromLabel || 'もとの文'}</span>
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
