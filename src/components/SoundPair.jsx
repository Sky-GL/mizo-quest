import ToneCurve from './ToneCurve'
import SpeakButton from './SpeakButton'

/**
 * まぎらわしい2つを並べて、交互に聞き比べられるようにする。
 * 声調ペアはピッチの折れ線、音のペアは字とカナを大きく出す。
 */
export default function SoundPair({ pair, compact }) {
  const { charA, charB, kind, shapeA, shapeB } = pair
  return (
    <div className={`sound-pair ${compact ? 'compact' : ''}`}>
      <div className="sp-side">
        {kind === 'tone' && shapeA ? (
          <ToneCurve shape={shapeA} label={charA.kana} big={!compact} />
        ) : (
          <>
            <span className="sp-letter">{charA.letter}</span>
            <em>{charA.kana}</em>
          </>
        )}
        <SpeakButton char={charA} size="sm" />
      </div>
      <span className="sp-vs">vs</span>
      <div className="sp-side">
        {kind === 'tone' && shapeB ? (
          <ToneCurve shape={shapeB} label={charB.kana} big={!compact} />
        ) : (
          <>
            <span className="sp-letter">{charB.letter}</span>
            <em>{charB.kana}</em>
          </>
        )}
        <SpeakButton char={charB} size="sm" />
      </div>
    </div>
  )
}
