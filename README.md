# ミゾ語クエスト (Mizo Quest)

インド・ミゾラム州のミゾ語 (Mizo ṭawng) の**発音と声調**を学ぶ学習アプリ。
[デーヴァナーガリー・クエスト](https://devanagari-quest.vercel.app/) と同じ骨格で作られています。

## ヒンディー語版との違い

ミゾ語はローマ字で書くため、「字の形を覚える」学習が成立しません。
代わりに、日本語話者がつまずく**音**を学習対象にしています。

| デーヴァナーガリー版 | ミゾ語版 |
|---|---|
| 62の字形を覚える | 25文字のうち日本語話者がつまずく音 |
| 重ね比較(字形のピクセル差分) | 聞き比べ(SoundPair) / 声調の折れ線(ToneCurve) |
| マートラ組み立て練習 | 声調ラボ(母音 × 声調) |
| 単語モード・神経衰弱・4択チャレンジ・配色テーマ | そのまま |
| (なし) | 会話モード・パターン練習 を追加 |

## Step構成

1. **母音6つ** — A AW E I O U (AW が最初の関門)
2. **やさしい子音** — B D H K L M N P S T
3. **日本語にない子音** — F V Z R G J
4. **2文字の字とそり舌** — CH NG Ṭ
5. **語末の子音** — 開放しない -p -t -k など9種
6. **母音の長短と声調** — 長母音の4声調
7. **短母音の声調** — 短い4声調

## 会話モード

発音を覚えても使う場面がなければ定着しません。12の場面を
**聞く → 選ぶ → 会話する** の3段で回します。

1. **聞く** — 会話を通しで聞き、意味と音を結びつける。フレーズごとに直訳と解説
2. **選ぶ** — 日本語からミゾ語を4択で選ぶ。苦手なフレーズから優先的に出る(SRS)
3. **会話する** — 会話の流れの中で、自分の番だけを**単語タイルから組み立てる**

3段目を産出(自分で文を作る)にしてあるのが要点です。眺めるだけ・選ぶだけでは
口から出るようになりません。

**12場面 / 55フレーズ**。難易度順に3つのまとまりに分けてあります。

| まとまり | 場面 |
|---|---|
| 🌱 まずこれだけ | あいさつ / 名前をきく / お願いとお礼 / 困ったとき |
| 🏘️ 街で使う | 食事 / 買い物 / 道をきく / 時間と約束 |
| 💬 人と話す | 家族の話 / 体調 / 天気の話 / 別れぎわ |

会話の**「あなた」側は、日本人学習者が実際に言う側**に割り当ててあります。
道をきく場面なら「市場はどこですか?」を組み立てるのが学習者で、
「あそこにあります」と答えるのは相手です。

正解・不正解は**その文に含まれる関門音(AW・Ṭ・NG・語末子音)の成績にも反映**されます。
会話練習がそのまま文字Stepの復習になります。

## パターン練習

フレーズを1つずつ覚えるより、作り方の型を覚えるほうが早いので、3つの型を別立てにしています。

| 型 | 内容 |
|---|---|
| 🧩 主語 | `ka`(私) `i`(あなた) `a`(彼/彼女) `kan`(私たち) `in`(あなたたち) `an`(彼ら) を動詞の前に置く。6主語 × 8動詞 = 48通りの早見表付き |
| 🚫 否定 | 動詞の後ろに `lo` を足すだけ。`Ka duh.`(ほしい) → `Ka duh lo.`(いらない) |
| ❓ 質問 | はい/いいえは文末に `em`、中身を聞くときは `eng`/`engzat` + `nge` |

否定と質問の4択は**文末の助詞だけを入れ替えた選択肢**になっていて、
`lo` / `em` / `e` / `nge` の使い分けそのものを試します。

## 音声について

**ブラウザにミゾ語の音声合成は存在しません。** 発音ボタンは英語 (en-IN 優先) の
音声でローマ字綴りを読ませた**参考音**であり、AW・Ṭ・声調は正しく再現されません。
各カードの説明文と声調の折れ線を正としてください。

`public/audio/<id>.mp3` に実録音を置くと、TTS より優先して再生されます
(ID は `src/data/mizo-data.json` の `id` と一致させる)。

## データの出典と注意

- アルファベット25文字・母音6つ・声調の数 (a aw e i u は8声調、o のみ短い3声調) は
  公開されている記述に基づきます
- カナ表記と調音の説明は日本語話者向けの便宜的なもので、音声学的に厳密ではありません
- **声調の具体的な音高と単語ごとの声調は収録していません。** 実際の発音は
  ミゾ語話者の音で確認してください
- **会話フレーズは公開資料と照合してあります**(下記)。56フレーズのうち
  **57件すべてについて、用例または同じ型の用例が確認できました**
  (`uncertain: true` は現在0件)。
  ただし**母語話者による確認は取れていません**
- 主語接頭辞・否定の lo・疑問の em/nge という3つの型は文法記述で裏が取れているので、
  **フレーズの丸暗記より型を軸にしたほうが崩れません**

### 照合でわかって直したこと

| 直す前 | 直した後 | 根拠 |
|---|---|---|
| `Zan ṭha`(おやすみ) | `Muttui le` | 英語 good night からの類推で作った誤り。実際の言い方は Muttui le / Mangṭha |
| `I hming eng nge?` | `Engnge i hming?` | 用例は eng nge が頭に来る語順 |
| `Ka unau pahnih ka nei` | `Unaupa pahnih ka nei` | 用例 "Unaupa pahnih ka nei"(I have two brothers)に合わせた |
| `Zawi zawkin sawi rawh` | `Zawi zawiin thu sawi rawh` | zawk ではなく zawi zawiin。thu(話)が入る |
| `Chutah a awm`(あそこ) | `Hetah a awm`(ここ) | hetah は用例あり、chutah は確認できず |
| `Ka lu a na`(頭が痛い) | **削除** | 用例が見つからず |
| `A hla em?`(遠いですか) | `Engtia hla nge?` | 用例 "Engtia hla nge?"(How far is it?) |
| 「ミゾ語に単独の"はい"はない」という注記 | **誤り。`Aw`(はい)と `Aih`(いいえ)がある** | 用例 "Aw, nei e"(はい、持っています)/ "Aih, English ka thiam lo"(いいえ、英語はできません)。`Aih` をフレーズに追加した |
| `Khua a vot`(寒い) | `Khua a ṭha lo`(天気が悪い) | vot が確認できず。確認済みの語と否定の型だけで作り直した |
| `Dam takin` = お元気で | = またね | 用例では "See you" |
| `Kan inhmu leh ang` | `Kan inhmu dawn nia` | 用例は "Kan inhmu dawn nia"(See you again) |
| `Naktuk kan inhmu ang` | `Naktuk ah kan inhmu dawn nia` | 用例 "Naktuk ah kan inhmu dawnnia"(See you tomorrow) |

逆に、印を外して確定させたもの: `A to lutuk`(高すぎる)、`Min ngaihdam rawh`(ごめんなさい)、
`Khawiah nge a awm?`(どこにありますか)、`Khua a lum`(暑い)、`Ruah a sur`(雨が降る)、
`Dar engzat nge?`(何時)、`damdawi`(薬)、`Engtikah nge?`(いつ)、`Kan inhmu dawn nia`(また会いましょう)。
新しく足したもの: `Mangṭha`(さようなら)、`Muttui le`(おやすみ)、`Min hrilh rawh`(教えてください)。

### 単語40語の照合でわかって直したこと

| 直す前 | 直した後 | 根拠 |
|---|---|---|
| `tha`(よい) | **`ṭha`** | Ṭ付きが正しい。用例 "Chhia leh **ṭha** hriatna"(善悪の知識)。**このアプリはStep4でŤを教えているのに、単語側で綴りを間違えていた** |
| `mang tha`(おやすみ/さようなら) | **`Mangṭha`**(さようなら) | 1語・Ṭ付き。おやすみは `Muttui le` なので意味から外した |
| `va`(鳥) | **`vawiin`**(今日) | va 単独の用例が確認できず。確認済みの vawiin に差し替え(V と AW の両方が入るので教材としても有効) |
| カナ `ソーム` `ローム` `チョー` `トーン` `コーラン` | `ソム` `ロム` `チョ` `トン` `コフラン` | AW は短い /ɔ/ なので長音符は不適切。会話モード側の表記に揃えた |

数詞10語(pakhat〜sawm)、`puan`(布)、`zu`(米の酒)、`sa`(肉)、`lal`(首長)、`ram`(土地)、
`in`(家)、`ni`(日)、`fak`(ほめる。賛美歌 "Zaiin ka fak ang che")、`hmangaihna`(愛)、
`nula`/`tlangval`(若い女性/男性)、`kohhran`(教会)、`lehkhabu`(本)、`ṭawng`(言語)、
`Mizoram`(mi=人 + zo=高地 + ram=土地)は用例で確認済み。

文字データ側も1か所直しました。Ṭ の説明に「英語話者には tr のように聞こえると
説明される」を追記(Mizo alphabet の記述に基づく)。

### 参照した資料

- [Mizo grammar (Wikipedia)](https://en.wikipedia.org/wiki/Mizo_grammar) — 人称接辞 ka/i/a/kan/in/an、否定の lo、疑問詞
- [Mizo Structure (CIIL, lisindia)](http://lisindia.ciil.org/Mizo/Mizo_struct.html) — 文構造
- [Serchhip Chelsea: Learn Basic Mizo Language](http://serchhipchelsea.blogspot.com/2019/09/learn-basic-mizo-languages.html) — 基本会話
- [Calm-Sojourner: Greetings & interaction in Mizo tawng](https://azassk.blogspot.com/2013/08/greetings-interactions-in-mizo-tawng.html) — あいさつ・やりとり
- [Calm-Sojourner: health problems and doctor consultation](https://azassk.blogspot.com/2018/09/english-to-mizo-language-translation.html) — 体調・薬
- [Calm-Sojourner: Days, Weeks, Months & Year](https://azassk.blogspot.com/2014/11/english-mizo-days-weeks-months-year.html) — 時の語
- [Learn Entry: Family relationship names in Mizo](https://www.learnentry.com/english-mizo/vocabulary/relationship-in-mizo/) — 家族の語
- [Chhangte, The Grammar of Simple Clauses in Mizo (ANU)](https://openresearch-repository.anu.edu.au/server/api/core/bitstreams/ad4a4545-9a90-4681-ba5a-de39615cf505/content) — 指示詞・節構造
- [Daily Bread Mizo: Khawiah nge i awm?](https://dailybreadmizo.com/2019/05/15/khawiah-nge-i-awm/) — khawiah nge + awm の用例
- [Mizo - Travel Phrases](https://www.travelphrases.info/languages/mizo.htm) — 距離・移動の言い方
- [Mizo alphabet (Wikipedia)](https://en.wikipedia.org/wiki/Mizo_alphabet) — Ṭ の位置づけと音
- [Calm-Sojourner: Let's count numbers in Mizo tawng](https://azassk.blogspot.com/2013/06/lets-count-numbers-in-mizo-tawng.html) — 数詞
- [Mizo clothing (Wikipedia)](https://en.wikipedia.org/wiki/Mizo_clothing) — puan(布)
- [Zû (beverage) (Wikipedia)](https://en.wikipedia.org/wiki/Z%C3%BB_(beverage)) — zu(米の酒)
- [Mizo Structure (CIIL)](http://lisindia.ciil.org/Mizo/Mizo_struct.html) — in(家)+ -ah の用例、語順

## 開発

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```
