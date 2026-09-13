import { STEPS, charsOfStep } from '../data/steps'
import { SCENES, ALL_PHRASES } from '../data/talk'

const SCENE_TOTAL = SCENES.length
const PHRASE_TOTAL = ALL_PHRASES.length

const Stars = ({ n }) => (
  <span className="stars">
    {[0, 1, 2].map((i) => (
      <span key={i} className={i < n ? 'star on' : 'star'}>★</span>
    ))}
  </span>
)

export default function StepMap({ progress, onSelect, onReview, onWords, onMemory, onChallenge, onTalk, onPattern }) {
  const learnedCount = Object.values(progress.chars).length
  const weakCount = Object.values(progress.chars).filter((c) => c.wrong > 0).length
  const sceneDone = Object.values(progress.scenes || {}).filter((s) => s.done).length
  const phraseCount = Object.values(progress.phrases || {}).filter((p) => p.correct > 0).length

  return (
    <div className="stepmap">
      <div className="map-header">
        <h1>学習マップ</h1>
        <p>ミゾ語はローマ字で書きます。覚えるのは字の形ではなく<strong>音</strong>。母音→やさしい子音→日本語にない音→語末の止め方→声調、の順がおすすめですが、どのStepからでも始められます。Stepクイズで80%以上正解すると★が付きます。</p>
      </div>

      <div className="review-banner">
        <div>
          <strong>復習モード</strong>
          <span className="sub">
            学習済み {learnedCount} 字 / 苦手 {weakCount} 字 — 間違えた字を優先出題
            {phraseCount > 0 && ` ・会話フレーズ ${phraseCount} 個`}
          </span>
        </div>
        <button className="btn primary" disabled={learnedCount === 0} onClick={onReview}>
          {learnedCount === 0 ? 'Step1から始めよう' : '苦手を復習する'}
        </button>
      </div>

      {/* 会話は発音学習の出口なので、他のモードより先に置く */}
      <div className="mode-row talk-row">
        <button className="mode-card talk" onClick={onTalk}>
          <span className="mode-emoji">💬</span>
          <strong>会話モード</strong>
          <span className="mode-sub">
            {SCENE_TOTAL}場面{PHRASE_TOTAL}フレーズ。聞く→選ぶ→自分で組み立てる。
            {sceneDone ? ` ${sceneDone}/${SCENE_TOTAL} 場面クリア` : ' まずは「あいさつ」から'}
          </span>
        </button>
        <button className="mode-card pattern" onClick={onPattern}>
          <span className="mode-emoji">🧩</span>
          <strong>パターン練習</strong>
          <span className="mode-sub">
            主語・否定・質問の3つの型。覚えた文を自分で作り変えられるようになる
          </span>
        </button>
      </div>

      <div className="mode-row">
        <button className="mode-card words" onClick={onWords}>
          <span className="mode-emoji">📖</span>
          <strong>単語モード</strong>
          <span className="mode-sub">覚えた字で実際のミゾ語を読む。40語収録</span>
        </button>
        <button className="mode-card challenge" onClick={onChallenge}>
          <span className="mode-emoji">⚡</span>
          <strong>4択チャレンジ</strong>
          <span className="mode-sub">
            ライフ3で何問続く? {progress.bestChallenge ? `ベスト ${progress.bestChallenge} 点` : 'まずは1回'}
          </span>
        </button>
        <button className="mode-card memory" onClick={onMemory}>
          <span className="mode-emoji">🃏</span>
          <strong>神経衰弱</strong>
          <span className="mode-sub">ペア探し。3〜6ペアで難易度を選べます</span>
        </button>
      </div>

      <div className="steps">
        {STEPS.map((s) => {
          const st = progress.steps[s.step]
          const chars = charsOfStep(s.step)
          return (
            <button
              key={s.step}
              className={`step-card ${st?.cleared ? 'cleared' : ''}`}
              style={{ '--accent': s.color }}
              onClick={() => onSelect(s.step)}
            >
              <div className="step-top">
                <span className="step-emoji">{s.emoji}</span>
                <span className="step-no">STEP {s.step}</span>
                {st?.cleared && <Stars n={st.stars} />}
              </div>
              <h3>{s.title}</h3>
              <p className="step-sub">{s.subtitle}</p>
              <div className="step-chars">
                {chars.slice(0, 6).map((c) => (
                  <span key={c.id}>{c.letter}</span>
                ))}
                {chars.length > 6 && <span className="more">+{chars.length - 6}</span>}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
