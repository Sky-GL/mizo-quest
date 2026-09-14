import { useEffect, useMemo, useState } from 'react'
import SpeakButton from './SpeakButton'
import { speakSequence, stopSpeaking } from '../lib/speech'
import { playCorrect, playWrong, playClear } from '../lib/sfx'
import { charScore } from '../lib/srs'
import {
  ALL_PHRASES,
  SCENES,
  SCENE_GROUPS,
  scenesOfGroup,
  phraseById,
  phrasesOfScene,
  lineText,
  lineJa,
  tokenize,
  focusChars,
  shuffle,
  distractors,
} from '../data/talk'

const STAGES = [
  { key: 'read', label: '聞く', emoji: '👂', hint: 'まず会話を通して聞く。意味と音を結びつける段階。' },
  { key: 'pick', label: '選ぶ', emoji: '🎯', hint: '日本語からミゾ語を選ぶ。思い出せるか試す段階。' },
  { key: 'act', label: '会話する', emoji: '💬', hint: '自分の番を組み立てる。ここまで来ると口から出る。' },
]

/**
 * 会話モード。1つのシーンを「聞く→選ぶ→会話する」の3段で回す。
 * 眺めるだけでは定着しないので、最後は必ず自分で文を組み立てさせる。
 */
export default function TalkMode({ phraseStats, sceneStats, onBack, onAnswer, onPhrase, onSceneDone }) {
  const [sceneId, setSceneId] = useState(null)
  const scene = useMemo(() => SCENES.find((s) => s.id === sceneId) || null, [sceneId])

  if (!scene) {
    return (
      <SceneList
        phraseStats={phraseStats}
        sceneStats={sceneStats}
        onBack={onBack}
        onSelect={setSceneId}
      />
    )
  }
  return (
    <SceneRunner
      key={scene.id}
      scene={scene}
      phraseStats={phraseStats}
      onBack={() => setSceneId(null)}
      onAnswer={onAnswer}
      onPhrase={onPhrase}
      onSceneDone={onSceneDone}
    />
  )
}

/* ---------------- シーン選択 ---------------- */

function SceneList({ phraseStats, sceneStats, onBack, onSelect }) {
  // 相づち(A ṭha e など)は複数の場面で共有されるので、場面ごとの合計ではなく実数で数える
  const totalPhrases = ALL_PHRASES.length
  const uncertainCount = ALL_PHRASES.filter((p) => p.uncertain).length
  const doneScenes = SCENES.filter((s) => sceneStats[s.id]?.done).length

  return (
    <div className="screen talk" style={{ '--accent': 'var(--c-talk)' }}>
      <div className="screen-head">
        <button className="btn ghost" onClick={onBack}>← マップ</button>
        <div className="head-title">
          <span className="step-emoji">💬</span>
          <div>
            <h2>会話モード</h2>
            <p>
              {SCENES.length}場面・{totalPhrases}フレーズ。聞く → 選ぶ → 自分で組み立てる の順で練習します。
              {doneScenes > 0 && ` (${doneScenes}/${SCENES.length} 場面クリア)`}
            </p>
          </div>
        </div>
      </div>

      {SCENE_GROUPS.map((g) => (
        <section key={g.key} className="scene-group">
          <h3 className="group-head">
            <span>{g.emoji}</span>
            {g.title}
            <small>{g.note}</small>
          </h3>
          <div className="talk-scenes">
            {scenesOfGroup(g.key).map((s) => {
              const phrases = phrasesOfScene(s)
              const known = phrases.filter((p) => (phraseStats[p.id]?.correct || 0) > 0).length
              const done = sceneStats[s.id]?.done
              return (
                <button key={s.id} className={`scene-card ${done ? 'done' : ''}`} onClick={() => onSelect(s.id)}>
                  <div className="scene-top">
                    <span className="scene-emoji">{s.emoji}</span>
                    <strong>{s.title}</strong>
                    {done && <span className="scene-check">✓</span>}
                  </div>
                  <p className="scene-sit">{s.situation}</p>
                  <p className="scene-goal">{s.goal}</p>
                  <div className="scene-bar">
                    <div className="scene-fill" style={{ width: `${(known / phrases.length) * 100}%` }} />
                  </div>
                  <span className="scene-count">{known}/{phrases.length} フレーズ</span>
                </button>
              )
            })}
          </div>
        </section>
      ))}

      <p className="talk-note">
        ミゾラムでは英語も広く通じますが、<strong>Chibai</strong> と <strong>Ka lawm e</strong> の
        2つを現地の音で言えるだけで会話の入り口がまるで変わります。まずは「あいさつ」から。
      </p>
      <p className="talk-note warn">
        ⚠️ フレーズは公開されているミゾ語の資料と照合しています(用例が見つかった言い回しを採用)。
        ただし<strong>母語話者による確認は取れていません</strong>。
        照合で用例が見つからなかった {uncertainCount} 件には<strong>「要確認」</strong>の印を付けてあります
        (各場面の「聞く」で確認できます)。文法の型(主語・否定・質問)は文法記述で裏が取れているので、
        そちらを軸にすると崩れにくいです。
      </p>
    </div>
  )
}

/* ---------------- シーン本体(3段) ---------------- */

function SceneRunner({ scene, phraseStats, onBack, onAnswer, onPhrase, onSceneDone }) {
  const [stage, setStage] = useState('read')
  const phrases = useMemo(() => phrasesOfScene(scene), [scene])
  const stageIdx = STAGES.findIndex((s) => s.key === stage)

  // 正解/不正解を、フレーズの成績と、その文に含まれる字の成績の両方へ流す
  const record = (phrase, ok) => {
    onPhrase(phrase.id, ok)
    focusChars(phrase.mizo).forEach((id) => onAnswer(id, ok))
  }

  const goNext = () => {
    if (stageIdx + 1 < STAGES.length) {
      setStage(STAGES[stageIdx + 1].key)
    } else {
      playClear()
      onSceneDone(scene.id)
      onBack()
    }
  }

  return (
    <div className="screen talk" style={{ '--accent': 'var(--c-talk)' }}>
      <div className="screen-head">
        <button className="btn ghost" onClick={onBack}>← 場面を選ぶ</button>
        <div className="head-title">
          <span className="step-emoji">{scene.emoji}</span>
          <div>
            <h2>{scene.title}</h2>
            <p>{scene.situation}</p>
          </div>
        </div>
      </div>

      <div className="stage-row">
        {STAGES.map((s, i) => (
          <button
            key={s.key}
            className={`stage-chip ${s.key === stage ? 'on' : ''} ${i < stageIdx ? 'done' : ''}`}
            onClick={() => setStage(s.key)}
          >
            <span>{s.emoji}</span>
            {s.label}
          </button>
        ))}
      </div>
      <p className="stage-hint">{STAGES[stageIdx].hint}</p>

      {stage === 'read' && <ReadStage scene={scene} phrases={phrases} onNext={goNext} />}
      {stage === 'pick' && (
        <PickStage
          key={`pick-${scene.id}`}
          phrases={phrases}
          phraseStats={phraseStats}
          onRecord={record}
          onNext={goNext}
        />
      )}
      {stage === 'act' && (
        <ActStage key={`act-${scene.id}`} scene={scene} onRecord={record} onNext={goNext} />
      )}
    </div>
  )
}

/* ---------------- 1段目: 聞く ---------------- */

function ReadStage({ scene, phrases, onNext }) {
  const [open, setOpen] = useState(null) // 解説を開いているフレーズID
  const [playing, setPlaying] = useState(-1) // 通し再生で今読んでいる行

  // 画面を離れたら読み上げも止める
  useEffect(() => stopSpeaking, [])

  // 会話を頭から通しで読み上げる。
  // 1行を言い終えてから次に移るので、長い行が途中で切れない。
  const playAll = () =>
    speakSequence(scene.lines.map(lineText), { gap: 600, onStep: setPlaying })

  return (
    <>
      <div className="dialog">
        {scene.lines.map((line, i) => (
          <div
            key={i}
            className={`bubble-row ${line.who === 'A' ? 'left' : 'right'} ${playing === i ? 'playing' : ''}`}
          >
            <span className="who">{line.who === 'A' ? '相手' : 'あなた'}</span>
            <div className="bubble">
              <div className="bubble-mizo">
                {lineText(line)}
                <SpeakButton text={lineText(line)} size="sm" />
              </div>
              <div className="bubble-ja">{lineJa(line)}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="cta-row">
        <button className="btn secondary" onClick={playAll}>
          {playing >= 0 ? '🔉 再生中…' : '🔉 通しで聞く'}
        </button>
        <button className="btn primary big" onClick={onNext}>覚えたか試す →</button>
      </div>

      <h3 className="talk-sub">この場面で使うフレーズ</h3>
      <div className="phrase-list">
        {phrases.map((p) => (
          <div key={p.id} className={`phrase-item ${open === p.id ? 'open' : ''}`}>
            <button className="phrase-head" onClick={() => setOpen(open === p.id ? null : p.id)}>
              <div>
                <div className="ph-mizo">{p.mizo}</div>
                <div className="ph-kana">{p.kana}</div>
              </div>
              <div className="ph-right">
                {p.uncertain && <span className="ph-flag" title="公開資料で同じ言い回しの用例が見つからなかったもの">要確認</span>}
                <span className="ph-ja">{p.ja}</span>
                <span className="ph-caret">{open === p.id ? '−' : '+'}</span>
              </div>
            </button>
            {open === p.id && (
              <div className="phrase-body">
                <p className="ph-literal">直訳: {p.literal}</p>
                <p className="ph-note">{p.note}</p>
                {p.uncertain && (
                  <p className="ph-warn">
                    ⚠️ 公開資料の照合で同じ言い回しの用例が見つかりませんでした。
                    語の意味と組み立て方は確認できていますが、これが自然な言い方かは未確認です。
                  </p>
                )}
                <SpeakButton text={p.mizo} size="sm" />
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )
}

/* ---------------- 2段目: 選ぶ ---------------- */

function PickStage({ phrases, phraseStats, onRecord, onNext }) {
  // 苦手なフレーズから先に出す(SRSの優先度をそのまま流用)
  const [queue] = useState(() =>
    [...phrases].sort((a, b) => charScore(phraseStats[b.id]) - charScore(phraseStats[a.id]))
  )
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)

  const target = queue[idx]
  const options = useMemo(
    () => (target ? shuffle([target, ...distractors(target, phrases)]) : []),
    [target, phrases]
  )

  if (!target) return null

  const answer = (o) => {
    if (picked) return
    const ok = o.id === target.id
    if (ok) {
      playCorrect()
      setScore((s) => s + 1)
    } else {
      playWrong()
    }
    onRecord(target, ok)
    setPicked(o)
  }

  const next = () => {
    if (idx + 1 >= queue.length) {
      onNext()
    } else {
      setIdx(idx + 1)
      setPicked(null)
    }
  }

  return (
    <>
      <div className="quiz-head">
        <div className="quiz-bar"><div className="quiz-fill" style={{ width: `${(idx / queue.length) * 100}%` }} /></div>
        <span className="quiz-count">{idx + 1}/{queue.length}</span>
      </div>

      <div className="pick-card">
        <p className="pick-label">これをミゾ語で言うと?</p>
        <h3 className="pick-ja">{target.ja}</h3>
      </div>

      <div className="options">
        {options.map((o) => {
          const state = !picked ? '' : o.id === target.id ? 'correct' : o.id === picked.id ? 'wrong' : 'dim'
          return (
            <button key={o.id} className={`option ${state}`} onClick={() => answer(o)} disabled={!!picked}>
              {o.mizo}
            </button>
          )
        })}
      </div>

      {picked && (
        <div className={`feedback ${picked.id === target.id ? 'ok' : 'ng'}`}>
          <strong>{picked.id === target.id ? '正解!' : `正解は ${target.mizo}`}</strong>
          <p className="fb-kana">{target.kana} — 直訳: {target.literal}</p>
          <p className="fb-note">{target.note}</p>
          <div className="cta-row">
            <SpeakButton text={target.mizo} size="sm" />
            <button className="btn primary" onClick={next} autoFocus>
              {idx + 1 >= queue.length ? `会話してみる(${score}/${queue.length}正解) →` : '次へ →'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}

/* ---------------- 3段目: 会話する(組み立て) ---------------- */

function ActStage({ scene, onRecord, onNext }) {
  // あなた(B)の番だけを自分で組み立てる
  const myTurns = useMemo(
    () => scene.lines.map((l, i) => ({ ...l, i })).filter((l) => l.who === 'B'),
    [scene]
  )
  const [turn, setTurn] = useState(0)
  const current = myTurns[turn]

  if (!current) return null

  const finishTurn = (ok) => {
    current.ids.forEach((id) => {
      const p = phraseById(id)
      if (p) onRecord(p, ok)
    })
    if (turn + 1 >= myTurns.length) onNext()
    else setTurn(turn + 1)
  }

  return (
    <>
      <div className="quiz-head">
        <div className="quiz-bar"><div className="quiz-fill" style={{ width: `${(turn / myTurns.length) * 100}%` }} /></div>
        <span className="quiz-count">あなたの番 {turn + 1}/{myTurns.length}</span>
      </div>

      {/* ここまでの流れを出して、文脈の中で言わせる */}
      <div className="dialog compact">
        {scene.lines.slice(0, current.i).map((line, i) => (
          <div key={i} className={`bubble-row ${line.who === 'A' ? 'left' : 'right'}`}>
            <span className="who">{line.who === 'A' ? '相手' : 'あなた'}</span>
            <div className="bubble">
              <div className="bubble-mizo">
                {lineText(line)}
                <SpeakButton text={lineText(line)} size="sm" />
              </div>
              <div className="bubble-ja">{lineJa(line)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* key を番号にして、番が変わったら中の状態を丸ごと作り直す */}
      <TurnBuilder
        key={turn}
        line={current}
        isLast={turn + 1 >= myTurns.length}
        onDone={finishTurn}
      />
    </>
  )
}

/** 1回分の「自分の番」を組み立てさせる */
function TurnBuilder({ line, isLast, onDone }) {
  const answer = lineText(line)
  const target = useMemo(() => tokenize(answer), [answer])
  const [tiles] = useState(() => shuffle(tokenize(answer).map((t, i) => ({ t, key: `${t}-${i}` }))))
  const [placed, setPlaced] = useState([])
  const [badTile, setBadTile] = useState(-1)
  const [revealed, setRevealed] = useState(false)
  const [missed, setMissed] = useState(false)

  const done = placed.length === target.length
  const kana = line.ids.map((id) => phraseById(id)?.kana).filter(Boolean).join(' / ')

  const tap = (tile, i) => {
    if (done || revealed) return
    if (tile.t === target[placed.length]) {
      setPlaced((p) => [...p, tile])
      if (placed.length + 1 === target.length) playCorrect()
    } else {
      playWrong()
      setMissed(true)
      setBadTile(i)
      setTimeout(() => setBadTile(-1), 400)
    }
  }

  const reveal = () => {
    setRevealed(true)
    setMissed(true)
    playWrong()
  }

  return (
    <div className="build-card">
      <p className="pick-label">あなたの番。これをミゾ語で言う:</p>
      <h3 className="pick-ja">{lineJa(line)}</h3>

      <div className={`build-slot ${done ? 'done' : ''}`}>
        {placed.length === 0 && !revealed && <span className="build-ph">下の語を順に押す</span>}
        {revealed ? (
          <span className="build-answer">{answer}</span>
        ) : (
          placed.map((p, i) => <span key={i} className="build-word">{p.t}</span>)
        )}
      </div>

      {!done && !revealed && (
        <>
          <div className="tile-row">
            {tiles.map((tile, i) => {
              const used = placed.includes(tile)
              return (
                <button
                  key={tile.key}
                  className={`tile ${used ? 'used' : ''} ${badTile === i ? 'bad' : ''}`}
                  disabled={used}
                  onClick={() => tap(tile, i)}
                >
                  {tile.t}
                </button>
              )
            })}
          </div>
          <button className="btn ghost sm" onClick={reveal}>わからない → 答えを見る</button>
        </>
      )}

      {(done || revealed) && (
        <div className={`feedback ${missed ? 'ng' : 'ok'}`}>
          <strong>{missed ? 'もう一度、声に出してみよう' : '言えた!'}</strong>
          <p className="fb-kana">{answer} — {kana}</p>
          <div className="cta-row">
            <SpeakButton text={answer} size="sm" label="聞く" />
            {/* 間違えた場合は不正解として記録する(SRSで優先的に出し直すため) */}
            <button className="btn primary" onClick={() => onDone(!missed)} autoFocus>
              {isLast ? 'この場面を終える →' : '会話を続ける →'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
