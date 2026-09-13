/**
 * 声調のピッチを折れ線で見せる。
 * デーヴァナーガリー版の「字形の重ね比較」に相当する、ミゾ語版の視覚化。
 * 字は同じでも音の高さの動きが違う、というのが目で分かるようにする。
 */
const W = 96
const H = 54
const PAD = 8

const path = (curve) => {
  const n = curve.length
  return curve
    .map((v, i) => {
      const x = PAD + (i / (n - 1)) * (W - PAD * 2)
      const y = H - PAD - v * (H - PAD * 2)
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

import { withTone } from '../data/steps'

export default function ToneCurve({ shape, label, sub, tone = 'a', accent = 'var(--accent)', big }) {
  if (!shape) return null
  return (
    <div className={`tone-curve ${big ? 'big' : ''}`}>
      <svg viewBox={`0 0 ${W} ${H}`} width={big ? 140 : W} height={big ? 78 : H} aria-hidden="true">
        {/* 高さの目安線 */}
        <line x1={PAD} y1={PAD} x2={W - PAD} y2={PAD} className="tc-guide" />
        <line x1={PAD} y1={H / 2} x2={W - PAD} y2={H / 2} className="tc-guide mid" />
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} className="tc-guide" />
        <path d={path(shape.curve)} fill="none" stroke={accent} strokeWidth={big ? 4 : 3} strokeLinecap="round" strokeLinejoin="round" />
        <circle
          cx={PAD}
          cy={H - PAD - shape.curve[0] * (H - PAD * 2)}
          r={big ? 4.5 : 3.5}
          fill={accent}
        />
      </svg>
      <div className="tc-label">
        <strong>{withTone(tone, shape.mark)}</strong>
        <small>{label || shape.label}</small>
      </div>
      {sub && <p className="tc-sub">{sub}</p>}
    </div>
  )
}
