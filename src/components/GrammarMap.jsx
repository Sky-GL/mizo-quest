import SpeakButton from './SpeakButton'
import CopyButton from './CopyButton'

/**
 * 文法のしくみ。パターン練習の型を1枚の地図にまとめる。
 * ドリルは型ごとに分かれているので、「文がどう組み立つか」の全体像をここで見せ、
 * 各行からそのパターン練習へ飛べるようにする。
 */

// 1つの文を少しずつ作り変えて、足す位置が全部同じだと見せる
const GROW = [
  { mizo: 'Ka ei.', ja: '私は食べる。', add: '主語 ka + 動詞', pat: 'subject' },
  { mizo: 'Chaw ka ei.', ja: 'ごはんを食べる。', add: '「〜を」は前に', pat: 'order' },
  { mizo: 'Chaw ka ei lo.', ja: 'ごはんを食べない。', add: '後ろに lo', pat: 'negate' },
  { mizo: 'Chaw i ei em?', ja: 'ごはん食べる?', add: '主語を i に、後ろに em', pat: 'ask' },
  { mizo: 'Chaw ka ei tawh.', ja: 'もう食べた。', add: '後ろに tawh', pat: 'timing' },
  { mizo: 'Chaw ka la ei lo.', ja: 'まだ食べていない。', add: 'la 〜 lo', pat: 'timing' },
  { mizo: 'Chaw ka ei dawn.', ja: 'これから食べる。', add: '後ろに dawn', pat: null },
]

// 動詞・形容詞の後ろに足すもの
const AFTER = [
  { tag: 'lo', mean: '〜ない', ex: 'Ka duh lo.', exJa: 'いらない', pat: 'negate' },
  { tag: 'em', mean: '〜か?(はい/いいえ)', ex: 'I dam em?', exJa: '元気?', pat: 'ask' },
  { tag: 'nge', mean: '〜か?(何・どこ・いくら)', ex: 'Engzat man nge?', exJa: 'いくら?', pat: 'ask' },
  { tag: 'em em / hle mai', mean: 'とても〜', ex: 'A tui hle mai.', exJa: 'すごくおいしい', pat: 'emphasis' },
  { tag: 'ber', mean: '一番〜', ex: 'A ṭha ber a ni.', exJa: '一番いい', pat: 'emphasis' },
  { tag: 'tawh', mean: 'もう〜した', ex: 'Chaw ka ei tawh.', exJa: 'もう食べた', pat: 'timing' },
  { tag: 'la 〜 lo', mean: 'まだ〜ない', ex: 'Chaw ka la ei lo.', exJa: 'まだ食べてない', pat: 'timing' },
  { tag: 'rawh', mean: '〜してください', ex: 'Min pui rawh.', exJa: '助けて', pat: 'request' },
  { tag: 'suh', mean: '〜しないで', ex: 'Min bawl suh aw.', exJa: 'からかわないで', pat: 'request' },
  { tag: 'ang / dawn', mean: '〜しよう・これから〜する', ex: 'Ka kal dawn.', exJa: 'もう行きます', pat: null },
]

// 動詞の前に付けるもの
const BEFORE = [
  { tag: 'ka / i / a', mean: '私は / あなたは / 彼・彼女は', ex: 'Ka dam e.', exJa: '元気だよ', pat: 'subject' },
  { tag: 'kan / in / an', mean: '私たちは / あなたたちは / 彼らは', ex: 'Kan inhmu dawn nia.', exJa: 'また会おう', pat: 'subject' },
  { tag: 'min', mean: '私を / 私に', ex: 'Min pui rawh.', exJa: '助けて', pat: 'request' },
]

// 名詞の後ろに付けるもの(後置詞)
const NOUN = [
  { tag: 'ah', mean: '〜に / 〜へ / 〜で', ex: 'Japan ah ka kal dawn.', exJa: '日本へ行きます', pat: 'place' },
  { tag: 'atanga', mean: '〜から', ex: 'Japan atanga ka lo kal.', exJa: '日本から来ました', pat: 'place' },
  { tag: 'he 〜 hi', mean: 'この〜', ex: 'He chaw hi ka lei duh.', exJa: 'これをください', pat: null },
  { tag: 'chu', mean: '〜は(話題)', ex: 'Ka hming chu Sugai a ni.', exJa: '私の名前はスガイです', pat: null },
]

function Row({ r, onPractice }) {
  return (
    <div className="gm-row">
      <div className="gm-tag">{r.tag}</div>
      <div className="gm-mean">{r.mean}</div>
      <div className="gm-ex">
        <span className="gm-ex-mizo">{r.ex}</span>
        <span className="gm-ex-ja">{r.exJa}</span>
      </div>
      <div className="gm-go">
        <CopyButton text={r.ex} size="sm" />
        {r.pat && (
          <button className="btn sm secondary" onClick={() => onPractice(r.pat)}>練習 →</button>
        )}
      </div>
    </div>
  )
}

export default function GrammarMap({ onBack, onPractice }) {
  return (
    <div className="screen grammar" style={{ '--accent': 'var(--c-pattern)' }}>
      <div className="screen-head">
        <button className="btn ghost" onClick={onBack}>← マップ</button>
        <div className="head-title">
          <span className="step-emoji">📖</span>
          <div>
            <h2>文法のしくみ</h2>
            <p>ミゾ語の文は、動詞のまわりに小さな語を「前」と「後ろ」にくっつけてできている。</p>
          </div>
        </div>
      </div>

      {/* 骨組み */}
      <section className="gm-section">
        <h3>① 文の骨組み — 日本語と同じく動詞が最後</h3>
        <div className="gm-frame">
          <div className="gm-box obj"><small>〜を・〜に</small><strong>Chaw</strong><em>ごはん</em></div>
          <div className="gm-plus">+</div>
          <div className="gm-box subj"><small>主語(前)</small><strong>ka</strong><em>私は</em></div>
          <div className="gm-plus">+</div>
          <div className="gm-box verb"><small>動詞</small><strong>ei</strong><em>食べる</em></div>
          <div className="gm-plus">+</div>
          <div className="gm-box tail"><small>後ろに足す</small><strong>tawh</strong><em>もう</em></div>
        </div>
        <div className="gm-result">
          <span className="gm-result-mizo">Chaw ka ei tawh.</span>
          <span className="gm-result-ja">= もうごはんを食べました。</span>
          <SpeakButton text="Chaw ka ei tawh." size="sm" />
          <CopyButton text="Chaw ka ei tawh." size="sm" />
        </div>
        <ul className="gm-points">
          <li><strong>動詞は最後。</strong>日本語と同じ並び。英語の順(私は・食べる・ごはん)にしない。</li>
          <li><strong>主語の小さな語(ka / i / a)は動詞のすぐ前。</strong>「私の〜」も同じ形(ka hming = 私の名前)。</li>
          <li><strong>否定・質問・時・程度・お願いは、ぜんぶ後ろに足す。</strong>位置が1つなので、1つ覚えると残りも入る。</li>
          <li><strong>「に」「から」は名詞の後ろ。</strong>これも日本語と同じ(Japan ah = 日本へ)。</li>
        </ul>
      </section>

      {/* 1つの文を育てる */}
      <section className="gm-section">
        <h3>② 1つの文を作り変えてみる</h3>
        <p className="gm-lead">「食べる」だけで、これだけ言える。</p>
        <div className="gm-grow">
          {GROW.map((g, i) => (
            <div key={i} className="gm-step">
              <span className="gm-step-no">{i + 1}</span>
              <div className="gm-step-body">
                <span className="gm-step-mizo">{g.mizo}</span>
                <span className="gm-step-ja">{g.ja}</span>
              </div>
              <span className="gm-step-add">{g.add}</span>
              <span className="gm-step-go">
                <SpeakButton text={g.mizo} size="sm" />
                {g.pat && (
                  <button className="btn sm ghost" onClick={() => onPractice(g.pat)}>練習</button>
                )}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="gm-section">
        <h3>③ 動詞・形容詞の後ろに足すもの</h3>
        <div className="gm-table">{AFTER.map((r) => <Row key={r.tag} r={r} onPractice={onPractice} />)}</div>
      </section>

      <section className="gm-section">
        <h3>④ 動詞の前に付けるもの</h3>
        <div className="gm-table">{BEFORE.map((r) => <Row key={r.tag} r={r} onPractice={onPractice} />)}</div>
        <p className="gm-note">
          「あなたを」は例外的に動詞の<strong>後ろ</strong>に che を置く(Ka hmangaih che = 愛してる / Ka lawmpui che = おめでとう)。
        </p>
      </section>

      <section className="gm-section">
        <h3>⑤ 名詞の後ろに付けるもの</h3>
        <div className="gm-table">{NOUN.map((r) => <Row key={r.tag} r={r} onPractice={onPractice} />)}</div>
      </section>

      <section className="gm-section">
        <h3>⑥ 形が変わる動詞がある</h3>
        <p className="gm-note">
          ミゾ語の動詞には、文によって形が変わるものがある。代表が「知る」:
          <strong> Ka hria</strong>(知っている)→ <strong>Ka hre lo</strong>(知らない)。
          lo の前では hria が hre になる。数は多くないので、出てきたら1つずつ覚えれば足りる。
        </p>
      </section>

      <p className="talk-note">
        ここの型は文法記述(人称の接辞、否定の lo、疑問の em / nge、命令の rawh / suh、後置詞)で裏が取れています。
        「練習 →」から各パターン練習に飛べます。
      </p>
    </div>
  )
}
