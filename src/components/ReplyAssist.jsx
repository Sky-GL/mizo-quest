import { useMemo, useState } from 'react'
import SpeakButton from './SpeakButton'
import CopyButton from './CopyButton'
import { usePersistentState } from '../hooks/usePersistentState'
import { RATE } from '../lib/speech'
import { analyze, replyText, replyJa, replyKana, RESCUE, googleTranslateUrl } from '../data/replies'

const EXAMPLES = ['Chibai! I dam em?', 'Chaw i ei tawh em?', 'Khawi atanga lo kal nge i nih?', 'Naktuk ah kan inhmu dawn nia.']

/**
 * 返信アシスト。チャットで届いたミゾ語を貼ると、意味と返事の候補を出す。
 * 候補はタップ1回でコピーでき、そのままチャットに貼って返せる。
 */
export default function ReplyAssist({ onBack }) {
  // 入力は端末に残す(アプリを行き来しても消えない)
  const [text, setText] = usePersistentState('reply:text', '', (v) => typeof v === 'string')
  const [pasteMsg, setPasteMsg] = useState('')
  const result = useMemo(() => (text.trim() ? analyze(text) : null), [text])

  const paste = async () => {
    try {
      const t = await navigator.clipboard.readText()
      if (t) setText(t)
      else setPasteMsg('クリップボードが空です')
    } catch {
      // 許可されない端末では、入力欄を長押しして貼ってもらう
      setPasteMsg('自動で貼れませんでした。入力欄を長押しして「ペースト」してください')
    }
    setTimeout(() => setPasteMsg(''), 3000)
  }

  return (
    <div className="screen reply" style={{ '--accent': 'var(--c-talk)' }}>
      <div className="screen-head">
        <button className="btn ghost" onClick={onBack}>← マップ</button>
        <div className="head-title">
          <span className="step-emoji">📨</span>
          <div>
            <h2>返信アシスト</h2>
            <p>届いたミゾ語を貼ると、意味と返事の候補を出します。候補はコピーしてそのまま送れます。</p>
          </div>
        </div>
      </div>

      <div className="ra-input">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="ここにミゾ語を貼り付け(例: Chibai! I dam em?)"
          rows={3}
        />
        <div className="ra-input-actions">
          <button className="btn primary" onClick={paste}>📋 貼り付け</button>
          {text && <button className="btn ghost" onClick={() => setText('')}>クリア</button>}
          {pasteMsg && <span className="ra-msg">{pasteMsg}</span>}
        </div>
        {!text && (
          <div className="ra-examples">
            <span>ためしに:</span>
            {EXAMPLES.map((ex) => (
              <button key={ex} className="chip" onClick={() => setText(ex)}>{ex}</button>
            ))}
          </div>
        )}
      </div>

      {result && (
        <>
          <h3 className="ra-h">📖 相手はこう言っています</h3>
          {result.sentences.map((s, i) => (
            <Sentence key={i} s={s} />
          ))}

          <h3 className="ra-h">💬 返事の候補 <small>タップでコピー</small></h3>
          {!result.understood && (
            <p className="ra-note">
              収録フレーズと一致しなかったので、{result.sentences.at(-1)?.question ? '質問への' : ''}定番の返しを出しています。
            </p>
          )}
          <div className="ra-replies">
            {result.replies.map((r, i) => (
              <ReplyCard key={i} phrases={r} />
            ))}
          </div>

          <h3 className="ra-h">🆘 よくわからないときは</h3>
          <div className="ra-replies">
            {RESCUE.map((r, i) => (
              <ReplyCard key={i} phrases={r} />
            ))}
          </div>

          <p className="ra-note">
            ⚠️ 機械翻訳ではなく、アプリに収録したフレーズとの照合です。知らない文は単語ごとの手がかりまでしか出せません。
            <a href={googleTranslateUrl(text)} target="_blank" rel="noreferrer">Google翻訳でも確認する ↗</a>
          </p>
        </>
      )}
    </div>
  )
}

function Sentence({ s }) {
  const top = s.matches[0]
  const sure = top && top.score >= 0.6
  return (
    <div className="ra-sentence">
      <div className="ra-src">
        <span className="ra-mizo">{s.text}</span>
        <SpeakButton text={s.text} size="sm" rate={RATE.sentence} />
      </div>
      {sure ? (
        <div className="ra-meaning">
          <strong>{top.phrase.ja}</strong>
          {top.score < 1 && <span className="ra-close">近いフレーズ: {top.phrase.mizo}</span>}
          <span className="ra-kana">{top.phrase.kana}</span>
        </div>
      ) : (
        <div className="ra-meaning unknown">
          <strong>収録フレーズにない文です</strong>
          <span className="ra-kana">下の単語の意味から推測してください</span>
        </div>
      )}
      <div className="ra-words">
        {s.words.map((w, i) => (
          <span key={i} className={`ra-word ${w.gloss ? '' : 'unknown'}`}>
            <b>{w.t}</b>
            <small>{w.gloss || '?'}</small>
          </span>
        ))}
      </div>
    </div>
  )
}

function ReplyCard({ phrases }) {
  const text = replyText(phrases)
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }
  return (
    <div className={`ra-reply ${copied ? 'copied' : ''}`} onClick={copy} role="button" tabIndex={0}>
      <div className="ra-reply-main">
        <span className="ra-mizo">{text}</span>
        <span className="ra-ja">{replyJa(phrases)}</span>
        <span className="ra-kana">{replyKana(phrases)}</span>
      </div>
      <div className="ra-reply-side" onClick={(e) => e.stopPropagation()}>
        <SpeakButton text={text} size="sm" rate={RATE.sentence} />
        <CopyButton text={text} size="sm" />
      </div>
      {copied && <span className="ra-copied">✓ コピーしました</span>}
    </div>
  )
}
