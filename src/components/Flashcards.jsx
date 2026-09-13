import { useEffect, useState } from 'react'
import { charsOfStep, stepMeta, TONE_STEP, SHORT_TONE_STEP, toneShape } from '../data/steps'
import { pairsOf } from '../data/pairs'
import SpeakButton from './SpeakButton'
import SoundPair from './SoundPair'
import ToneCurve from './ToneCurve'
import { speak } from '../lib/speech'

export default function Flashcards({ step, onQuiz, onBack, onToneLab }) {
  const meta = stepMeta(step)
  const chars = charsOfStep(step)
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [seen, setSeen] = useState(() => new Set([0]))
  const [pairIdx, setPairIdx] = useState(0)
  const c = chars[idx]
  const pairs = pairsOf(c.id)
  const pair = pairs[Math.min(pairIdx, pairs.length - 1)]
  const shape = toneShape(c)

  // カード切替時に自動で発音
  useEffect(() => {
    speak(c)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx])

  const go = (d) => {
    const next = Math.min(Math.max(idx + d, 0), chars.length - 1)
    setIdx(next)
    setFlipped(false)
    setPairIdx(0)
    setSeen((s) => new Set(s).add(next))
  }

  useEffect(() => {
    const h = (e) => {
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
      if (e.key === ' ') { e.preventDefault(); setFlipped((f) => !f) }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  })

  const allSeen = seen.size >= chars.length

  return (
    <div className="screen" style={{ '--accent': meta.color }}>
      <div className="screen-head">
        <button className="btn ghost" onClick={onBack}>← マップ</button>
        <div className="head-title">
          <span className="step-emoji">{meta.emoji}</span>
          <div>
            <h2>STEP {step} {meta.title}</h2>
            <p>{meta.tip}</p>
          </div>
        </div>
      </div>

      <div className="progress-dots">
        {chars.map((ch, i) => (
          <button
            key={ch.id}
            className={`dot ${i === idx ? 'active' : ''} ${seen.has(i) ? 'seen' : ''}`}
            onClick={() => { setIdx(i); setFlipped(false); setPairIdx(0); setSeen((s) => new Set(s).add(i)) }}
          >
            {ch.letter}
          </button>
        ))}
      </div>

      <div className={`flashcard ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped((f) => !f)}>
        <div className="fc-inner">
          <div className="fc-face fc-front">
            <span className="badge series">{GROUP_LABEL[c.group] || c.group}</span>
            <div className="glyph">{c.letter}</div>
            <div className="glyph-kana">{c.kana}</div>
            {/* 声調カードは字だけ見ても分からないので、音の高さの動きを一緒に出す */}
            {shape && <ToneCurve shape={shape} tone="a" big accent="var(--accent)" />}
            <div className="fc-hint">タップで詳しい読みを表示</div>
            <SpeakButton char={c} />
          </div>
          <div className="fc-face fc-back">
            <div className="glyph small">{c.letter}</div>
            <div className="readings">
              <div className="read-row"><span className="rl">IPA</span><span className="rv">{c.ipa}</span></div>
              <div className="read-row"><span className="rl">カナ</span><span className="rv">{c.kana}</span></div>
              <div className="read-row"><span className="rl">種類</span><span className="rv">{GROUP_LABEL[c.group] || c.group}</span></div>
            </div>
            <p className="note">{c.note}</p>
            <SpeakButton char={c} />
          </div>
        </div>
      </div>

      <div className="fc-nav">
        <button className="btn" onClick={() => go(-1)} disabled={idx === 0}>← 前</button>
        <span className="counter">{idx + 1} / {chars.length}</span>
        <button className="btn" onClick={() => go(1)} disabled={idx === chars.length - 1}>次 →</button>
      </div>

      {pair && (
        <div className="compare-box">
          <div className="compare-head">
            <h4>👂 {pair.title} — 聞き比べる</h4>
            {pairs.length > 1 && (
              <div className="compare-tabs">
                {pairs.map((p, i) => (
                  <button key={p.id} className={`compare-tab ${i === pairIdx ? 'on' : ''}`} onClick={() => setPairIdx(i)}>
                    {p.charA.letter}／{p.charB.letter}
                  </button>
                ))}
              </div>
            )}
          </div>
          <SoundPair pair={pair} />
          <p className="compare-note">{pair.note}</p>
        </div>
      )}

      <div className="cta-row">
        {(step === TONE_STEP || step === SHORT_TONE_STEP) && (
          <button className="btn secondary" onClick={onToneLab}>🎛️ 声調ラボ</button>
        )}
        <button className={`btn primary big ${allSeen ? 'pulse' : ''}`} onClick={onQuiz}>
          クイズに挑戦 {allSeen ? '🔥' : ''}
        </button>
      </div>
      <p className="keyhint">← → でカード送り / スペースで裏返し</p>
    </div>
  )
}

const GROUP_LABEL = {
  vowel: '母音',
  easy: 'やさしい子音',
  nonjp: '日本語にない子音',
  digraph: '2文字で1字',
  retroflex: 'そり舌',
  final: '語末の子音',
  length: '母音の長短',
  tone: '声調(長母音)',
  tone_short: '声調(短母音)',
}
