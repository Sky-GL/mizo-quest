import { useEffect, useMemo, useState } from 'react'
import { pickWords, charsOfWord, shuffle } from '../data/words'
import SpeakButton from './SpeakButton'
import { speakText, speakSequence, stopSpeaking, RATE } from '../lib/speech'
import { playCorrect, playWrong, playClear } from '../lib/sfx'

/**
 * 単語を構成する字に分解して表示する。
 * ミゾ語はローマ字なので綴りをそのまま分けられるが、CH / NG / Ṭ は
 * 2文字で1字なので、データ側の chars の並びをそのまま使う。
 */
const toSyllables = (word) =>
  charsOfWord(word).map((c) => ({ base: c, text: c.letter, read: c.ipa, kana: c.kana }))

export default function WordMode({ learnedIds, onBack, onAnswer }) {
  // 出題する単語はマウント時に確定させる。
  // 解答するたびに onAnswer で学習記録が変わるので、props を依存にすると途中で並びが変わってしまう。
  const [words] = useState(() => pickWords(learnedIds, 10))
  const [idx, setIdx] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [lit, setLit] = useState(-1) // 音節を1つずつ光らせる位置
  const [quiz, setQuiz] = useState(null) // { options, picked }
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)

  const word = words[idx]
  const syls = useMemo(() => (word ? toSyllables(word) : []), [word])
  const total = words.length
  const answering = !!quiz && !quiz.picked // 出題中で、まだ答えていない状態

  // 単語が変わったら状態をリセットし、読み上げも止める
  useEffect(() => {
    stopSpeaking()
    setRevealed(false)
    setLit(-1)
    setQuiz(null)
  }, [idx])

  // 画面を離れたら読み上げも止める
  useEffect(() => stopSpeaking, [])

  if (!word) {
    return (
      <div className="screen">
        <div className="screen-head">
          <button className="btn ghost" onClick={onBack}>← マップ</button>
        </div>
        <p className="hint-text">単語データが読み込めませんでした。</p>
      </div>
    )
  }

  if (done) {
    const rate = Math.round((score / total) * 100)
    return (
      <div className="screen result" style={{ '--accent': 'var(--c-words)' }}>
        <div className="result-badge ok">📖 単語モード終了</div>
        <h2>{score} / {total} 正解({rate}%)</h2>
        <p className="hint-text">読めた単語が増えるほど、字も自然に定着します。</p>
        <div className="cta-row">
          <button className="btn" onClick={onBack}>マップへ戻る</button>
          <button className="btn primary" onClick={() => { setIdx(0); setScore(0); setDone(false) }}>もう一度</button>
        </div>
      </div>
    )
  }

  // 1字ずつ光らせながら読み、最後に通しで読む。
  // 1つ言い終えてから次に移るので、字と字が途中で切れない。
  // 1字ずつはゆっくり、最後の通し読みだけ速さを上げる。
  // 同じ速さだと「通しで読んだ」感じが出ないため。
  const playAlong = () =>
    speakSequence(
      [
        ...syls.map((s) => ({ text: s.text, rate: RATE.slow })),
        { text: word.word, rate: RATE.word },
      ],
      { gap: 220, onStep: (i) => setLit(i >= 0 && i < syls.length ? i : -1) }
    )

  const startQuiz = () => {
    // 意味あて4択。ダミーは他の単語の意味から
    const others = shuffle(words.filter((w) => w.id !== word.id)).slice(0, 3)
    setRevealed(false) // 答えが出たままだとカンニングになるので閉じる
    setQuiz({ options: shuffle([word, ...others]), picked: null })
  }

  const answer = (picked) => {
    if (quiz.picked) return
    const ok = picked.id === word.id
    if (ok) {
      playCorrect()
      setScore((s) => s + 1)
    } else {
      playWrong()
    }
    // 単語を構成する文字の成績にも反映する
    word.chars.forEach((id) => onAnswer(id, ok))
    setQuiz((q) => ({ ...q, picked }))
  }

  const next = () => {
    if (idx + 1 >= total) {
      playClear()
      setDone(true)
    } else {
      setIdx(idx + 1)
    }
  }

  return (
    <div className="screen wordmode" style={{ '--accent': 'var(--c-words)' }}>
      <div className="screen-head">
        <button className="btn ghost" onClick={onBack}>← マップ</button>
        <div className="head-title">
          <span className="step-emoji">📖</span>
          <div>
            <h2>単語モード</h2>
            <p>覚えた字が単語になると一気に読めるようになる。まず声に出してみる。</p>
          </div>
        </div>
      </div>

      <div className="quiz-head">
        <div className="quiz-bar"><div className="quiz-fill" style={{ width: `${(idx / total) * 100}%` }} /></div>
        <span className="quiz-count">{idx + 1}/{total}</span>
      </div>

      <div className="word-card">
        <div className="word-syls">
          {syls.map((s, i) => (
            <button
              key={i}
              className={`word-syl ${lit === i ? 'lit' : ''}`}
              onClick={() => speakText(s.text, { rate: RATE.slow })}
              title="タップで発音"
            >
              <span className="ws-glyph">{s.text}</span>
              <em className="ws-read">{s.read}</em>
              {s.kana && <small className="ws-kana">{s.kana}</small>}
            </button>
          ))}
        </div>

        <div className="word-actions">
          <button className="btn secondary" onClick={playAlong}>🔉 1字ずつ読む</button>
          <SpeakButton text={word.word} label="通しで聞く" />
        </div>

        {/* 解答前は答えを開けないようにする(意味あてのカンニングになるため) */}
        {answering ? (
          <p className="hint-text sm">答えを選ぶと読みと意味が出ます</p>
        ) : (
          <>
            {revealed && (
              <div className="word-answer">
                <div className="wa-kana">{word.kana}</div>
                <div className="wa-meaning">{word.meaning}</div>
                
              </div>
            )}
            <button className="btn" onClick={() => setRevealed((v) => !v)}>
              {revealed ? '読みと意味を隠す' : '読みと意味を見る'}
            </button>
          </>
        )}
      </div>

      {!quiz ? (
        <div className="cta-row">
          <button className="btn primary big" onClick={startQuiz}>意味を当てる</button>
        </div>
      ) : (
        <div className="word-quiz">
          <p className="quiz-sub">この単語の意味は?</p>
          <div className="options">
            {quiz.options.map((o) => {
              const state = !quiz.picked ? '' : o.id === word.id ? 'correct' : o.id === quiz.picked.id ? 'wrong' : 'dim'
              return (
                <button key={o.id} className={`option ${state}`} onClick={() => answer(o)} disabled={!!quiz.picked}>
                  {o.meaning}
                </button>
              )
            })}
          </div>
          {quiz.picked && (
            <div className={`feedback ${quiz.picked.id === word.id ? 'ok' : 'ng'}`}>
              <strong>{quiz.picked.id === word.id ? '正解!' : '惜しい!'}</strong>
              <p>{word.word} = {word.kana} — {word.meaning}</p>
              <button className="btn primary" onClick={next} autoFocus>
                {idx + 1 >= total ? '結果を見る' : '次の単語 →'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
