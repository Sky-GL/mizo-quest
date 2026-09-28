import { useEffect, useMemo } from 'react'
import HUD from './components/HUD'
import StepMap from './components/StepMap'
import Flashcards from './components/Flashcards'
import Quiz from './components/Quiz'
import ToneLab from './components/ToneLab'
import WordMode from './components/WordMode'
import MemoryGame from './components/MemoryGame'
import Challenge from './components/Challenge'
import TalkMode from './components/TalkMode'
import PatternDrill from './components/PatternDrill'
import GrammarMap from './components/GrammarMap'
import { useProgress } from './hooks/useProgress'
import { usePersistentState, readResume, writeResume, clearResume } from './hooks/usePersistentState'
import { buildStepQuiz, buildReviewQuiz } from './lib/quiz'
import { stepMeta, TONE_STEP } from './data/steps'

const VIEW_NAMES = ['map', 'cards', 'quiz', 'lab', 'review', 'words', 'memory', 'challenge', 'talk', 'pattern', 'grammar']

/** 保存してあった画面がいまのデータで開けるか */
const isValidView = (v) => {
  if (!v || !VIEW_NAMES.includes(v.name)) return false
  if (['cards', 'quiz'].includes(v.name) && !stepMeta(v.step)) return false
  if (['quiz', 'review'].includes(v.name) && !(Array.isArray(v.questions) && v.questions.length)) return false
  return true
}

export default function App() {
  const {
    progress,
    recordAnswer,
    recordPhrase,
    finishStep,
    finishScene,
    noteCombo,
    noteChallenge,
    reset,
    dismissMigration,
  } = useProgress()
  // view: { name: 'map' | 'cards' | 'quiz' | 'lab' | 'review' | 'words' | 'memory' | 'challenge' | 'talk' | 'pattern' | 'grammar', step?, questions?, patternId? }
  // どの画面にいるかを端末に残す。スマホでタブが読み込み直されても同じ画面に戻れる
  const [view, setView] = usePersistentState('view', { name: 'map' }, isValidView)

  // スクロール位置も残し、開き直したときだけ戻す(画面内の移動では触らない)
  useEffect(() => {
    const y = readResume('scroll')
    if (typeof y === 'number' && y > 0) {
      // 中身が描画されて高さが出るまで少し待ちながら合わせる
      let tries = 0
      const tick = () => {
        window.scrollTo(0, y)
        if (Math.abs(window.scrollY - y) > 2 && tries++ < 20) setTimeout(tick, 60)
      }
      setTimeout(tick, 0)
    }
    let frame = 0
    const save = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => writeResume('scroll', Math.round(window.scrollY)))
    }
    const saveNow = () => writeResume('scroll', Math.round(window.scrollY))
    window.addEventListener('scroll', save, { passive: true })
    window.addEventListener('pagehide', saveNow)
    document.addEventListener('visibilitychange', saveNow)
    return () => {
      window.removeEventListener('scroll', save)
      window.removeEventListener('pagehide', saveNow)
      document.removeEventListener('visibilitychange', saveNow)
    }
  }, [])

  // 一度でも解答した文字のID集合(単語モード/神経衰弱の出題範囲に使う)
  const learnedIds = useMemo(() => new Set(Object.keys(progress.chars)), [progress.chars])

  const goMap = () => setView({ name: 'map' })

  const startStepQuiz = (step) =>
    setView({ name: 'quiz', step, questions: buildStepQuiz(step, progress.chars), key: Date.now() })

  const startReview = () =>
    setView({ name: 'review', questions: buildReviewQuiz(progress.chars), key: Date.now() })

  const handleReset = () => {
    if (window.confirm('学習の進捗をすべて消去します。よろしいですか?')) {
      clearResume()
      reset()
      goMap()
    }
  }

  return (
    <div className="app">
      <HUD progress={progress} onHome={goMap} onReset={handleReset} />
      {progress.curriculumMigrated && (
        <div className="migration-banner">
          <span>
            📚 カリキュラムを整理し、Stepはどこからでも自由に選べるようになりました。
            Stepの並びが変わったため、Stepのクリア状況(★)はリセットしています。
            文字ごとの正誤記録とXPはそのまま引き継いでいます。
          </span>
          <button className="btn ghost sm" onClick={dismissMigration}>閉じる</button>
        </div>
      )}
      <main>
        {view.name === 'map' && (
          <StepMap
            progress={progress}
            onSelect={(step) => setView({ name: 'cards', step })}
            onReview={startReview}
            onWords={() => setView({ name: 'words', key: Date.now() })}
            onMemory={() => setView({ name: 'memory', key: Date.now() })}
            onChallenge={() => setView({ name: 'challenge', key: Date.now() })}
            onTalk={() => setView({ name: 'talk', key: Date.now() })}
            onPattern={() => setView({ name: 'pattern', key: Date.now() })}
            onGrammar={() => setView({ name: 'grammar' })}
          />
        )}

        {view.name === 'talk' && (
          <TalkMode
            key={view.key}
            phraseStats={progress.phrases}
            sceneStats={progress.scenes}
            onBack={goMap}
            onAnswer={recordAnswer}
            onPhrase={recordPhrase}
            onSceneDone={finishScene}
          />
        )}

        {view.name === 'pattern' && (
          <PatternDrill
            key={view.key}
            sid={view.key}
            initial={view.patternId}
            onBack={goMap}
            onAnswer={recordAnswer}
            onGrammar={() => setView({ name: 'grammar' })}
          />
        )}

        {view.name === 'grammar' && (
          <GrammarMap
            onBack={goMap}
            onPractice={(patternId) => setView({ name: 'pattern', patternId, key: Date.now() })}
          />
        )}

        {view.name === 'words' && (
          <WordMode key={view.key} sid={view.key} learnedIds={learnedIds} onBack={goMap} onAnswer={recordAnswer} />
        )}

        {view.name === 'challenge' && (
          <Challenge
            key={view.key}
            learnedIds={learnedIds}
            onBack={goMap}
            onAnswer={recordAnswer}
            best={progress.bestChallenge || 0}
            onRecord={noteChallenge}
          />
        )}

        {view.name === 'memory' && (
          <MemoryGame key={view.key} learnedIds={learnedIds} onBack={goMap} onAnswer={recordAnswer} />
        )}

        {view.name === 'cards' && (
          <Flashcards
            step={view.step}
            onBack={goMap}
            onQuiz={() => startStepQuiz(view.step)}
            onToneLab={() => setView({ name: 'lab', step: view.step })}
          />
        )}

        {view.name === 'lab' && (
          <ToneLab
            onBack={() => setView({ name: 'cards', step: view.step ?? TONE_STEP })}
            onQuiz={() => startStepQuiz(view.step ?? TONE_STEP)}
          />
        )}

        {view.name === 'quiz' && (
          <Quiz
            key={view.key}
            sid={view.key}
            title={`STEP ${view.step} ${stepMeta(view.step).title}`}
            accent={stepMeta(view.step).color}
            questions={view.questions}
            onAnswer={recordAnswer}
            onFinish={(score, total, combo) => {
              noteCombo(combo)
              return finishStep(view.step, score, total)
            }}
            onBack={goMap}
            onRetry={() => startStepQuiz(view.step)}
          />
        )}

        {view.name === 'review' && (
          <Quiz
            key={view.key}
            sid={view.key}
            title="復習モード(苦手優先)"
            accent="var(--c-review)"
            questions={view.questions}
            onAnswer={recordAnswer}
            onFinish={(score, total, combo) => {
              noteCombo(combo)
              // 復習はStepのクリア記録に影響しないので判定のみ返す
              const rate = total ? score / total : 0
              return { cleared: rate >= 0.8, stars: rate >= 1 ? 3 : rate >= 0.85 ? 2 : rate >= 0.7 ? 1 : 0, rate }
            }}
            onBack={goMap}
            onRetry={startReview}
          />
        )}
      </main>
      <footer className="foot">
        ⚠️ ミゾ語の音声合成はブラウザに存在しないため、発音ボタンは<strong>英語音声で綴りを読ませた参考音</strong>です。
        AW・Ṭ・声調は正しく再現されません。各カードの説明文と声調の折れ線を正とし、
        最終的には話者の音で確認してください。<code>/public/audio/</code> に実録音の mp3 を置くとそちらが優先されます。
      </footer>
    </div>
  )
}
