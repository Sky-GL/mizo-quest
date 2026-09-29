import { useMemo, useState } from 'react'
import SpeakButton from './SpeakButton'
import CopyButton from './CopyButton'
import { usePersistentState } from '../hooks/usePersistentState'
import { RATE } from '../lib/speech'
import { analyze, replyText, replyJa, replyKana, RESCUE, googleTranslateUrl } from '../data/replies'

// AI欄(api/reply.js)は当面使わない。照合で出なかった文を集めてフレーズを増やす方針
const AI_ENABLED = false

const EXAMPLES = ['Chibai! I dam em?', 'Chaw i ei tawh em?', 'Khawi atanga lo kal nge i nih?', 'Naktuk ah kan inhmu dawn nia.']

/**
 * 返信アシスト。チャットで届いたミゾ語を貼ると、意味と返事の候補を出す。
 * 候補はタップ1回でコピーでき、そのままチャットに貼って返せる。
 */
export default function ReplyAssist({ onBack }) {
  // 入力は端末に残す(アプリを行き来しても消えない)
  const [text, setText] = usePersistentState('reply:text', '', (v) => typeof v === 'string')
  const [pasteMsg, setPasteMsg] = useState('')
  // 意味が出なかった文。まとめてコピーして送ってもらい、フレーズを足す材料にする
  const [unknown, setUnknown] = usePersistentState('reply:unknown', [], (v) => Array.isArray(v))
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

      {AI_ENABLED && result && <AiPanel text={text} understood={result.understood} />}

      {result && (
        <>
          <h3 className="ra-h">📖 相手はこう言っています</h3>
          {result.sentences.map((s, i) => (
            <Sentence key={i} s={s} />
          ))}

          {result.sentences.some((s) => !(s.matches[0]?.score >= 0.6)) && (
            <SaveUnknown
              sentences={result.sentences.filter((s) => !(s.matches[0]?.score >= 0.6)).map((s) => s.text)}
              unknown={unknown}
              setUnknown={setUnknown}
            />
          )}

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
            ⚠️ この欄は機械翻訳ではなく、アプリに収録したフレーズとの照合です(通信なし)。知らない文は単語ごとの手がかりまでしか出せません。
            <a href={googleTranslateUrl(text)} target="_blank" rel="noreferrer">Google翻訳でも確認する ↗</a>
          </p>
        </>
      )}

      {unknown.length > 0 && <UnknownList unknown={unknown} setUnknown={setUnknown} />}
    </div>
  )
}

/** 照合で意味が出なかった文を「わからなかった文」に保存するボタン */
function SaveUnknown({ sentences, unknown, setUnknown }) {
  const fresh = sentences.filter((t) => !unknown.includes(t))
  if (!fresh.length) return <p className="ra-note">📝 この文は「わからなかった文」に保存済みです。</p>
  return (
    <button
      className="btn secondary ra-save"
      onClick={() => setUnknown((l) => [...l, ...fresh].slice(-100))}
    >
      📝 意味が出なかった文を保存({fresh.length}文)
    </button>
  )
}

/** 保存した文の一覧。まとめてコピーしてClaudeに送ると、フレーズとして追加できる */
function UnknownList({ unknown, setUnknown }) {
  const all = unknown.map((t) => `・${t}`).join('\n')
  const copyText = `返信アシストで意味が出なかった文です。フレーズに追加してください。\n${all}`
  return (
    <div className="ra-unknown">
      <h3 className="ra-h">📝 わからなかった文 <small>{unknown.length}文</small></h3>
      <p className="ra-note">まとめてコピーして送ってもらえれば、意味と返事を調べてアプリに追加します。</p>
      <ul>
        {unknown.map((t) => (
          <li key={t}>
            <span>{t}</span>
            <button className="btn ghost sm" onClick={() => setUnknown((l) => l.filter((x) => x !== t))} title="削除">✕</button>
          </li>
        ))}
      </ul>
      <div className="ra-input-actions">
        <CopyButton text={copyText} label="まとめてコピー" />
        <button className="btn ghost" onClick={() => window.confirm('一覧を空にしますか?') && setUnknown([])}>全部消す</button>
      </div>
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

const ERR = {
  not_configured: 'AIはまだ使えません(サーバーにAPIキーが設定されていません)。',
  bad_key: 'APIキーが正しくないようです。',
  passcode: '合言葉が違います。',
  rate_limit: '混み合っています。少し待ってからもう一度押してください。',
  too_long: '文が長すぎます(1200字まで)。',
  refusal: 'この内容はAIが訳せませんでした。',
}

/**
 * AI(Claude)に訳と返事を作ってもらう欄。収録外の文にも対応できる。
 * 結果は端末に残し、同じ文なら開き直しても再表示する(もう一度APIを呼ばない)。
 */
function AiPanel({ text, understood }) {
  const [want, setWant] = usePersistentState('reply:want', '', (v) => typeof v === 'string')
  const [saved, setSaved] = usePersistentState('reply:ai', null)
  const [pass, setPass] = usePersistentState('reply:pass', '', (v) => typeof v === 'string')
  const [needPass, setNeedPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const data = saved && saved.text === text && saved.want === want ? saved.data : null

  const ask = async () => {
    setLoading(true)
    setError('')
    try {
      const r = await fetch('/api/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(pass ? { 'x-passcode': pass } : {}) },
        body: JSON.stringify({ text, want }),
      })
      const body = await r.json().catch(() => ({}))
      if (!r.ok) {
        if (body.error === 'passcode') setNeedPass(true)
        setError(ERR[body.error] || `うまくいきませんでした(${r.status})。`)
        return
      }
      setNeedPass(false)
      setSaved({ text, want, data: body })
    } catch {
      setError('通信できませんでした。電波を確認してください。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`ra-ai ${understood ? '' : 'strong'}`}>
      <div className="ra-ai-head">
        <strong>🤖 AIで訳して返事を作る</strong>
        <span>{understood ? '照合より自然な訳・返事がほしいとき' : 'アプリに無い文です。AIなら訳せます'}</span>
      </div>
      <input
        className="ra-want"
        value={want}
        onChange={(e) => setWant(e.target.value)}
        placeholder="言いたいこと(日本語・任意) 例: 明日なら会えるよ"
      />
      {needPass && (
        <input className="ra-want" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="合言葉" />
      )}
      <div className="ra-input-actions">
        <button className="btn primary" onClick={ask} disabled={loading}>
          {loading ? '考え中…' : data ? 'もう一度作る' : 'AIに聞く'}
        </button>
        {error && <span className="ra-msg err">{error}</span>}
      </div>

      {data && (
        <div className="ra-ai-result">
          <p className="ra-summary">
            💡 {data.summary_ja}
            {data.confidence !== 'high' && (
              <span className={`ra-conf ${data.confidence}`}>
                {data.confidence === 'low' ? '訳に自信が低い' : '訳はだいたい'}
              </span>
            )}
          </p>
          {data.sentences.map((s, i) => (
            <div key={i} className="ra-ai-line">
              <span className="ra-mizo">{s.mizo}</span>
              <strong>{s.ja}</strong>
              {s.note && <span className="ra-kana">{s.note}</span>}
            </div>
          ))}
          <h3 className="ra-h">💬 AIの返事の候補 <small>タップでコピー</small></h3>
          <div className="ra-replies">
            {data.replies.map((r, i) => (
              <ReplyCard key={i} phrases={[r]} />
            ))}
          </div>
          <p className="ra-note">⚠️ AIの訳です。ミゾ語は資料が少ない言語なので、大事な内容は相手に確認してください。</p>
        </div>
      )}
    </div>
  )
}
