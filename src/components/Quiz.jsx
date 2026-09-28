import { useEffect } from 'react'
import { usePersistentState } from '../hooks/usePersistentState'
import { stepMeta, charById } from '../data/steps'
import SpeakButton from './SpeakButton'
import SoundPair from './SoundPair'
import ToneCurve from './ToneCurve'
import { toneShape } from '../data/steps'
import { playCorrect, playWrong, playClear } from '../lib/sfx'

const fresh = (sid) => ({
  sid, i: 0, picked: null, score: 0, combo: 0, maxCombo: 0, done: false, wrongIds: [], result: null,
})

export default function Quiz({ sid, title, accent = 'var(--accent-base)', questions, onAnswer, onFinish, onBack, onRetry }) {
  // 何問目か・答えたかどうかを端末に残す。読み込み直しても同じ問題から続けられる。
  // sid が違えば別の回なので初めから。答えた直後(picked)も残し、同じ問題を二重に採点しない
  const [st, setSt] = usePersistentState('quiz', () => fresh(sid),
    (v) => v.sid === sid && v.i < questions.length)
  const set = (patch) => setSt((s) => ({ ...s, ...(typeof patch === 'function' ? patch(s) : patch) }))
  const { i, picked, score, combo, maxCombo, done, wrongIds, result } = st

  const q = questions[i]
  const total = questions.length

  // 集計は完了後に1回だけ。再開したときに結果がもう出ていれば、二重に記録しない
  useEffect(() => {
    if (done && !result) {
      const r = onFinish(score, total, maxCombo)
      set({ result: r || { cleared: false, stars: 0 } })
      if (r?.cleared) playClear()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done])

  const choose = (optId) => {
    if (picked) return
    const ok = optId === q.answerId
    onAnswer(q.charId, ok)
    if (ok) playCorrect()
    else playWrong()
    set((s) => {
      const combo = ok ? s.combo + 1 : 0
      return {
        picked: optId,
        score: s.score + (ok ? 1 : 0),
        combo,
        maxCombo: Math.max(s.maxCombo, combo),
        wrongIds: ok ? s.wrongIds : [...s.wrongIds, q.charId],
      }
    })
  }

  const next = () => {
    if (i + 1 >= total) set({ picked: null, done: true })
    else set({ picked: null, i: i + 1 })
  }

  if (done) {
    const rate = Math.round((score / total) * 100)
    return (
      <div className="screen result" style={{ '--accent': accent }}>
        <div className={`result-badge ${result?.cleared ? 'ok' : 'ng'}`}>
          {result?.cleared ? '🎉 CLEAR!' : '💪 もう一息'}
        </div>
        <div className="result-stars">
          {[0, 1, 2].map((n) => (
            <span key={n} className={n < (result?.stars || 0) ? 'star on big' : 'star big'}>★</span>
          ))}
        </div>
        <h2>{score} / {total} 正解({rate}%)</h2>
        <div className="result-stats">
          <div><span>最大コンボ</span><strong>{maxCombo}</strong></div>
          <div><span>獲得XP</span><strong>+{score * 10 + (total - score) * 2 + (result?.cleared ? 50 : 0)}</strong></div>
        </div>
        {!result?.cleared && <p className="hint-text">正答率80%以上で次のStepが開放されます。</p>}
        {wrongIds.length > 0 && (
          <p className="hint-text">間違えた文字は復習モードで優先的に出題されます。</p>
        )}
        <div className="cta-row">
          <button className="btn" onClick={onBack}>マップへ戻る</button>
          <button className="btn primary" onClick={onRetry}>もう一度</button>
        </div>
      </div>
    )
  }

  return (
    <div className="screen quiz" style={{ '--accent': accent }}>
      <div className="quiz-head">
        <button className="btn ghost sm" onClick={onBack}>✕</button>
        <div className="quiz-bar">
          <div className="quiz-fill" style={{ width: `${(i / total) * 100}%` }} />
        </div>
        <span className="quiz-count">{i + 1}/{total}</span>
      </div>
      {combo >= 3 && <div className="combo">🔥 {combo} COMBO!</div>}

      <h3 className="quiz-title">{title}</h3>
      <p className="quiz-sub">{q.promptSub}</p>

      <div className="quiz-prompt">
        <span className={q.kind === 'read2char' ? 'prompt-text' : 'prompt-glyph'}>{q.prompt}</span>
        {q.promptKana && <span className="prompt-kana">{q.promptKana}</span>}
        {(q.speakChar || q.speakText) && <SpeakButton char={q.speakChar} text={q.speakText} size="sm" />}
      </div>

      <div className={`options ${q.options[0]?.big || q.kind === 'read2char' ? 'glyph-options' : ''}`}>
        {q.options.map((o) => {
          const state = !picked ? '' : o.id === q.answerId ? 'correct' : o.id === picked ? 'wrong' : 'dim'
          return (
            <button key={o.id} className={`option ${o.tone ? 'tone-option' : ''} ${state}`} onClick={() => choose(o.id)} disabled={!!picked}>
              {o.tone ? <ToneCurve shape={o.tone.shape} tone={o.tone.base} label={o.text} /> : o.text}
            </button>
          )
        })}
      </div>

      {picked && (
        <div className={`feedback ${picked === q.answerId ? 'ok' : 'ng'}`}>
          <strong>{picked === q.answerId ? '正解!' : '惜しい!'}</strong>
          {q.explain && <p>{q.explain}</p>}
          {/* 誤答時は「選んだ字」と「正解」を重ねて、どこで間違えたかを見せる */}
          {picked !== q.answerId && charById(picked) && charById(q.answerId) && (
            <div className="feedback-diff">
              <p className="fd-title">選んだほうと正解を聞き比べる</p>
              <SoundPair
                pair={{
                  charA: charById(picked),
                  charB: charById(q.answerId),
                  kind: toneShape(charById(q.answerId)) ? 'tone' : 'sound',
                  shapeA: toneShape(charById(picked)),
                  shapeB: toneShape(charById(q.answerId)),
                }}
                compact
              />
            </div>
          )}
          <button className="btn primary" onClick={next} autoFocus>
            {i + 1 >= total ? '結果を見る' : '次へ →'}
          </button>
        </div>
      )}
    </div>
  )
}

export const quizAccent = (step) => stepMeta(step)?.color || 'var(--accent-base)'
