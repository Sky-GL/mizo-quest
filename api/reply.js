import Anthropic from '@anthropic-ai/sdk'

/**
 * 返信アシストのAI版(Vercelのサーバー関数)。
 * 届いたミゾ語の訳と、返事の候補(ミゾ語)を返す。APIキーはサーバー側の環境変数にだけ置く。
 *
 * 環境変数:
 *   ANTHROPIC_API_KEY  … 必須
 *   REPLY_PASSCODE     … 任意。設定すると、合言葉を知っている人しか使えない(APIの使いすぎ防止)
 */

const MAX_CHARS = 1200

const SCHEMA = {
  type: 'object',
  properties: {
    sentences: {
      type: 'array',
      description: '届いた文を1文ずつ訳したもの',
      items: {
        type: 'object',
        properties: {
          mizo: { type: 'string' },
          ja: { type: 'string', description: '自然な日本語訳' },
          note: { type: 'string', description: '語の解説や、訳に自信がない点(なければ空文字)' },
        },
        required: ['mizo', 'ja', 'note'],
        additionalProperties: false,
      },
    },
    summary_ja: { type: 'string', description: '相手が言いたいことの要約(1文)' },
    replies: {
      type: 'array',
      description: '返事の候補。短く自然な順に3〜5個',
      items: {
        type: 'object',
        properties: {
          mizo: { type: 'string', description: 'そのまま送れるミゾ語' },
          ja: { type: 'string', description: '日本語の意味' },
          kana: { type: 'string', description: 'カタカナの読み' },
        },
        required: ['mizo', 'ja', 'kana'],
        additionalProperties: false,
      },
    },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'], description: '訳全体の確かさ' },
  },
  required: ['sentences', 'summary_ja', 'replies', 'confidence'],
  additionalProperties: false,
}

const SYSTEM = `あなたはミゾ語(Mizo ṭawng, ミゾラム州の言語)と日本語の通訳です。
利用者は日本人のミゾ語学習者で、チャットで届いたミゾ語の意味を知り、すぐ返事を送りたいと考えています。

- 届いた文を1文ずつ、自然な日本語に訳してください。スラングや省略綴り(例: t→ṭ の省略、声調記号なし)も考慮します。
- 返事の候補は、チャットでそのまま送れる短く自然なミゾ語にします。学習者が使いやすいよう、簡単な語を優先します。
- 利用者が「言いたいこと」を日本語で書いた場合は、それを伝える返事を最初の候補にします。
- ミゾ語は資料が少ない言語です。確信が持てない訳や表現は note に正直に書き、confidence を下げてください。知らない語を推測で断定しないでください。
- 読み(kana)は ch=チ、aw=オ(口を丸める)、ṭ=そり舌のト を目安にカタカナで書きます。`

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: 'not_configured' })

  const pass = process.env.REPLY_PASSCODE
  if (pass && req.headers['x-passcode'] !== pass) return res.status(401).json({ error: 'passcode' })

  const { text = '', want = '' } = req.body || {}
  if (typeof text !== 'string' || !text.trim()) return res.status(400).json({ error: 'empty' })
  if (text.length + String(want).length > MAX_CHARS) return res.status(400).json({ error: 'too_long' })

  const client = new Anthropic()
  const user = `届いたメッセージ:\n${text.trim()}\n\n${
    want && String(want).trim() ? `私が言いたいこと(日本語):\n${String(want).trim()}` : '(言いたいことの指定なし。自然な返事を考えてください)'
  }`

  try {
    const response = await client.beta.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 4000,
      // 訳と短い返事なので深く考えさせる必要はない。速さと費用を優先
      output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
      // 安全判定で断られたときは、別モデルで自動的にやり直す
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: SYSTEM,
      messages: [{ role: 'user', content: user }],
    })

    if (response.stop_reason === 'refusal') return res.status(422).json({ error: 'refusal' })
    const block = response.content.find((b) => b.type === 'text')
    if (!block) return res.status(502).json({ error: 'no_output' })
    return res.status(200).json(JSON.parse(block.text))
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return res.status(429).json({ error: 'rate_limit' })
    if (e instanceof Anthropic.AuthenticationError) return res.status(503).json({ error: 'bad_key' })
    if (e instanceof Anthropic.APIError) return res.status(502).json({ error: 'api', status: e.status })
    return res.status(500).json({ error: 'server' })
  }
}
