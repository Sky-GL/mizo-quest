import { useState } from 'react'
import { charsOfStep, charById, TONE_BASE_IDS, TONE_STEP, SHORT_TONE_STEP, toneShape, withTone } from '../data/steps'
import ToneCurve from './ToneCurve'
import { speakText } from '../lib/speech'

/**
 * 声調ラボ。デーヴァナーガリー版の「マートラ組み立て練習」に相当する。
 * 母音 × 声調 の組み合わせを自分で切り替えて、記号と音の高さの動きを対応づける。
 */
export default function ToneLab({ onBack, onQuiz }) {
  const tones = [...charsOfStep(TONE_STEP), ...charsOfStep(SHORT_TONE_STEP)].filter((c) => toneShape(c))
  const [baseId, setBaseId] = useState(TONE_BASE_IDS[0])
  const [toneId, setToneId] = useState(tones[0]?.id)
  const base = charById(baseId)
  const tone = charById(toneId)
  const shape = tone ? toneShape(tone) : null
  if (!base || !tone || !shape) return null

  const combined = withTone(base.letter.toLowerCase(), shape.mark)

  return (
    <div className="screen tonelab" style={{ '--accent': 'var(--accent-base)' }}>
      <div className="screen-head">
        <button className="btn ghost" onClick={onBack}>← 戻る</button>
        <div className="head-title">
          <span className="step-emoji">🎛️</span>
          <div>
            <h2>声調ラボ</h2>
            <p>母音と声調を入れ替えて、記号と音の高さの動きを結びつける。</p>
          </div>
        </div>
      </div>

      <div className="lab-formula">
        <div className="lab-slot">
          <span className="slot-label">母音</span>
          <span className="slot-glyph">{base.letter}</span>
          <span className="slot-kana">{base.kana}</span>
        </div>
        <span className="lab-op">+</span>
        <div className="lab-slot">
          <span className="slot-label">声調</span>
          <ToneCurve shape={shape} tone="" label={tone.kana} />
        </div>
        <span className="lab-op">=</span>
        <div className="lab-slot result">
          <span className="slot-label">音節</span>
          <span className="slot-glyph big">{combined}</span>
          <span className="slot-kana big">{base.kana}・{shape.label}</span>
        </div>
      </div>

      <p className="lab-note">
        記号の <strong>{shape.markName}</strong> は <strong>{shape.label}</strong>。
        音の高さは折れ線のとおりに動く。ミゾ語では a aw e i u が8声調、
        <strong> O だけは短い3声調しか持たない</strong>のが特徴。
      </p>

      <div className="cta-row">
        <button className="btn secondary" onClick={() => speakText(base.speak)}>🔉 母音を聞く(参考音声)</button>
      </div>

      <div className="lab-section">
        <h4>母音を選ぶ</h4>
        <div className="chip-grid">
          {TONE_BASE_IDS.map((id) => {
            const b = charById(id)
            return (
              <button key={id} className={`glyph-chip ${baseId === id ? 'on' : ''}`} onClick={() => setBaseId(id)}>
                <span>{b.letter}</span>
                <em>{b.kana}</em>
              </button>
            )
          })}
        </div>
      </div>

      <div className="lab-section">
        <h4>声調を選ぶ</h4>
        <div className="chip-grid">
          {tones.map((t) => (
            <button key={t.id} className={`glyph-chip wide ${toneId === t.id ? 'on' : ''}`} onClick={() => setToneId(t.id)}>
              <ToneCurve shape={toneShape(t)} tone={base.letter.toLowerCase()} label={t.kana} />
            </button>
          ))}
        </div>
      </div>

      <div className="cta-row">
        <button className="btn primary big" onClick={onQuiz}>声調クイズに挑戦</button>
      </div>
    </div>
  )
}
