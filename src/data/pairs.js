import { charById, toneShape } from './steps'

/**
 * まぎらわしいペア。
 * デーヴァナーガリー版は「字形が似ている」ペアだったが、ミゾ語はローマ字なので
 * 紛らわしいのは音のほう。区別のしかた(調音のヒント)をセットで持たせる。
 * kind: 'sound' = 口の動きで区別 / 'tone' = 音の高さの動きで区別
 */
const PAIRS = [
  { a: 'aw', b: 'o', kind: 'sound', title: 'AW と O',
    note: 'どちらも日本人には「オ」。AW は口を大きめに開いた英語 law のオー、O は唇をすぼめた「オ」。AW のほうが顎が下がる。' },
  { a: 'l', b: 'r', kind: 'sound', title: 'L と R',
    note: 'L は舌先を上の歯ぐきに付けたまま声を出す。R は舌先を弾く/震わせて離す。日本語のラ行はちょうど中間なので、どちらにも聞こえてしまう。' },
  { a: 't', b: 'tt', kind: 'sound', title: 'T と Ṭ',
    note: '★最難関。T は舌先を上の前歯の裏に。Ṭ は舌先を後ろに反らせて口の天井に当てる。Ṭ のほうがこもった、太い音になる。' },
  { a: 'f', b: 'h', kind: 'sound', title: 'F と H',
    note: '日本語の「フ」は唇だけで出すので、どちらにも化ける。F は下唇を上の前歯に当てる。H は口の中は何もせず喉から息だけ。' },
  { a: 'b', b: 'v', kind: 'sound', title: 'B と V',
    note: 'B は唇を完全に閉じて破裂させる。V は閉じずに下唇を上の前歯に当てて息を通し続ける。' },
  { a: 's', b: 'z', kind: 'sound', title: 'S と Z',
    note: '口の形は同じで、声帯を震わせるかどうかだけの違い。喉に手を当てて確かめると分かりやすい。' },
  { a: 'ch', b: 'j', kind: 'sound', title: 'CH と J',
    note: 'これも声帯の震えだけの違い。CH=チャ(無声)、J=ジャ(有声)。' },
  { a: 'ng', b: 'n', kind: 'sound', title: 'NG と N',
    note: 'N は舌先を上の歯ぐきに付ける。NG は舌先をどこにも付けず、舌の奥を持ち上げて鼻に抜く。ミゾ語では NG が語頭にも立つのが日本語との最大の違い。' },
  { a: 'fin_p', b: 'fin_k', kind: 'sound', title: '語末の -p と -k',
    note: 'どちらも「っ」に聞こえるが、-p は唇を閉じて止め、-k は喉の奥で止める。止めた瞬間の口の形が残るので、口を見れば区別できる。' },
  { a: 'fin_t', b: 'fin_k', kind: 'sound', title: '語末の -t と -k',
    note: '-t は舌先を歯ぐきに付けて止める。-k は舌の奥を持ち上げて止める。どちらも開放しない。' },
  { a: 'fin_m', b: 'fin_ng', kind: 'sound', title: '語末の -m と -ng',
    note: '日本語ではどちらも「ン」で済むが、ミゾ語では別の音。-m は唇を閉じて終わる、-ng は唇を開けたまま鼻に抜く。' },

  { a: 'len_short', b: 'len_long', kind: 'tone', title: '短母音と長母音',
    note: 'まず長さを区別できないと声調にも入れない。長母音は伝統的な綴りで山記号(^)が付く。' },
  { a: 't_high', b: 't_low', kind: 'tone', title: '高い声調と低い声調',
    note: 'どちらも高さが変わらない平らな声調。出だしの高さだけが違う。' },
  { a: 't_rise', b: 't_fall', kind: 'tone', title: '上昇と下降',
    note: '動く方向が逆。上昇は日本語の疑問形の語尾、下降は納得したときの「あー」に近い。' },
  { a: 't_high', b: 't_fall', kind: 'tone', title: '高いまま と 下降',
    note: '出だしは同じ高さ。最後まで保つか、落とすかの違いなので、語の終わりまで聞く必要がある。' },
  { a: 's_rise', b: 't_rise', kind: 'tone', title: '短い上昇 と 長い上昇',
    note: '動き方は同じで、使える時間が違う。短いほうは上げきる余裕がないぶん難しい。' },
]

export const pairsOf = (charId) =>
  PAIRS.filter((p) => p.a === charId || p.b === charId)
    .map((p, i) => {
      const charA = charById(p.a)
      const charB = charById(p.b)
      if (!charA || !charB) return null
      return {
        id: `${p.a}-${p.b}-${i}`,
        kind: p.kind,
        title: p.title,
        note: p.note,
        charA,
        charB,
        shapeA: toneShape(charA),
        shapeB: toneShape(charB),
      }
    })
    .filter(Boolean)
    // まだ習っていない字を先出ししないよう、後から習うほうのカードでのみ出す
    .filter((p) => {
      const self = p.charA.id === charId ? p.charA : p.charB
      const other = p.charA.id === charId ? p.charB : p.charA
      return self.step >= other.step
    })

export const ALL_PAIRS = PAIRS
