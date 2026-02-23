import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

const EXERCISES = [
  {
    id: 'breathing',
    icon: '💨',
    title: 'Diaphragmatic Breathing',
    category: 'Foundation',
    duration: '3 min',
    xp: 20,
    color: '#7dd3fc',
    steps: [
      'Sit comfortably with your back straight and shoulders relaxed.',
      'Place one hand on your chest, one on your belly.',
      'Inhale slowly through your nose for 4 counts — feel your belly rise, not your chest.',
      'Hold for 2 counts.',
      'Exhale slowly through your mouth for 6 counts.',
      'Repeat 10 times. Notice how tension releases with each breath.'
    ],
    tip: 'This is the foundation of fluent speech. Most stammering is exacerbated by shallow breathing.'
  },
  {
    id: 'easy_onset',
    icon: '✨',
    title: 'Easy Onset Practice',
    category: 'Technique',
    duration: '5 min',
    xp: 35,
    color: '#8b5cf6',
    steps: [
      'Take a comfortable breath before starting.',
      'Begin each word with a very gentle, soft flow of air — like fogging a mirror.',
      'Practice these words one at a time: "Air" ... "Open" ... "Each" ... "Always"',
      'Feel how the word glides out rather than being pushed.',
      'Now try phrases: "Every evening..." — soft onset on every word.',
      'Record yourself and listen back.'
    ],
    tip: 'Easy onset eliminates the laryngeal tension that causes most blocks.'
  },
  {
    id: 'slow_speech',
    icon: '🐢',
    title: 'Slow Speech Drill',
    category: 'Technique',
    duration: '5 min',
    xp: 30,
    color: '#86efac',
    steps: [
      'Choose any sentence from your daily life.',
      'Speak at 50% of your normal speed — exaggeratedly slow.',
      'Stretch every vowel slightly. "Tooodaaay iiis aaa gooood daaay."',
      'Now increase to 70% speed while maintaining the stretched vowels.',
      'Finally, speak at your normal pace — you\'ll notice it naturally feels smoother.',
      'Practice 5 different sentences this way.'
    ],
    tip: 'Slow speech retrains your motor patterns. The slowing is temporary — it builds the blueprint for faster fluency.'
  },
  {
    id: 'pausing',
    icon: '⏸️',
    title: 'Phrasing & Pausing',
    category: 'Rhythm',
    duration: '4 min',
    xp: 25,
    color: '#f9a8d4',
    steps: [
      'Read any paragraph. Mark where natural pauses occur with /.',
      'Now speak the text, deliberately pausing at every / mark.',
      'During each pause: quick soft breath, reset your lips and jaw.',
      'The pauses should feel like a drummer\'s rest — intentional, not fearful.',
      'Practice: "My name is [name] / and I work in / technology / at a great company."',
      'Notice how pausing actually makes you sound more authoritative.'
    ],
    tip: 'Confident speakers pause naturally. Pausing is a power tool, not a weakness.'
  },
  {
    id: 'mirror',
    icon: '🪞',
    title: 'Mirror Speaking',
    category: 'Confidence',
    duration: '5 min',
    xp: 40,
    color: '#fbbf24',
    steps: [
      'Stand or sit in front of a mirror. Make eye contact with yourself.',
      'Start with just your name: say it 5 times, slowly, with a smile.',
      'Notice your mouth movements — are your lips relaxed?',
      'Now introduce yourself fully: name, what you do, one interesting thing.',
      'Keep eye contact with yourself throughout.',
      'Finally, say your success affirmation: "My voice deserves to be heard."'
    ],
    tip: 'Mirror practice builds the visual-motor connection and trains confident body language alongside speech.'
  },
  {
    id: 'bounce',
    icon: '🏀',
    title: 'Bouncing Technique',
    category: 'Technique',
    duration: '3 min',
    xp: 30,
    color: '#ef4444',
    steps: [
      'On difficult words, instead of forcing through, gently bounce into the first sound.',
      'Example: Instead of forcing "P---aper", try "p-p-paper" with very light touches.',
      'The key is to make each touch light and relaxed — not tense.',
      'Practice on common difficult words for you.',
      'Gradually reduce the bounces until the word flows out in one.',
      'This technique gives your muscles a "running start" into the word.'
    ],
    tip: 'Voluntary bouncing reduces tension that causes involuntary repetitions.'
  }
]

const ExerciseTimer = ({ duration, onComplete }) => {
  const [timeLeft, setTimeLeft] = useState(parseInt(duration) * 60)
  const [active, setActive] = useState(false)

  React.useEffect(() => {
    let interval
    if (active && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000)
    } else if (timeLeft === 0) {
      onComplete()
    }
    return () => clearInterval(interval)
  }, [active, timeLeft])

  const mins = Math.floor(timeLeft / 60)
  const secs = timeLeft % 60
  const progress = 1 - timeLeft / (parseInt(duration) * 60)

  return (
    <div className="text-center">
      <div className="relative w-24 h-24 mx-auto mb-4">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="8" />
          <circle cx="50" cy="50" r="42" fill="none" stroke="#8b5cf6" strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${progress * 264} 264`}
            style={{ transition: 'stroke-dasharray 1s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono font-bold">{mins}:{String(secs).padStart(2, '0')}</span>
        </div>
      </div>
      <button
        onClick={() => setActive(p => !p)}
        className={active ? 'btn-secondary px-6 py-2' : 'btn-primary px-6 py-2'}
      >
        {active ? '⏸️ Pause' : timeLeft === parseInt(duration) * 60 ? '▶️ Start Timer' : '▶️ Resume'}
      </button>
    </div>
  )
}

export default function TherapyPage() {
  const [selectedExercise, setSelectedExercise] = useState(null)
  const [completedExercises, setCompletedExercises] = useState(new Set())
  const [currentStep, setCurrentStep] = useState(0)
  const [showTimer, setShowTimer] = useState(false)
  const totalXP = [...completedExercises].reduce((acc, id) => {
    const ex = EXERCISES.find(e => e.id === id)
    return acc + (ex?.xp || 0)
  }, 0)

  const handleComplete = (exercise) => {
    setCompletedExercises(prev => new Set([...prev, exercise.id]))
    toast.success(`+${exercise.xp} XP earned! Great work! 🎉`)
    setSelectedExercise(null)
    setCurrentStep(0)
    setShowTimer(false)
  }

  if (selectedExercise) {
    const exercise = selectedExercise
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <button onClick={() => { setSelectedExercise(null); setCurrentStep(0) }}
            className="flex items-center gap-2 text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
            ← Back to exercises
          </button>

          <div className="glass-card p-8 mb-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="text-5xl">{exercise.icon}</div>
              <div>
                <span className="badge badge-purple text-xs mb-1">{exercise.category}</span>
                <h1 className="font-display text-2xl font-bold">{exercise.title}</h1>
                <div className="flex gap-3 mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <span>⏱️ {exercise.duration}</span>
                  <span>⚡ +{exercise.xp} XP</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl mb-6 text-sm italic"
              style={{ background: `${exercise.color}12`, color: 'var(--text-muted)', borderLeft: `3px solid ${exercise.color}` }}>
              💡 {exercise.tip}
            </div>

            {/* Steps */}
            <div className="space-y-3 mb-6">
              {exercise.steps.map((step, i) => (
                <motion.div
                  key={i}
                  onClick={() => setCurrentStep(i)}
                  className={`flex gap-4 p-4 rounded-xl cursor-pointer transition-all ${
                    i === currentStep ? 'border-2' : i < currentStep ? 'opacity-60' : ''
                  }`}
                  style={i === currentStep ? {
                    background: `${exercise.color}10`,
                    borderColor: exercise.color
                  } : {
                    background: 'rgba(139,92,246,0.03)'
                  }}
                  whileHover={{ scale: 1.01 }}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    i < currentStep ? 'text-white' : i === currentStep ? 'text-white' : 'text-gray-400 bg-gray-100'
                  }`} style={i <= currentStep ? { background: exercise.color } : {}}>
                    {i < currentStep ? '✓' : i + 1}
                  </div>
                  <p className="text-sm leading-relaxed">{step}</p>
                </motion.div>
              ))}
            </div>

            {/* Timer */}
            {showTimer && (
              <div className="glass-card p-6 text-center mb-4">
                <ExerciseTimer duration={exercise.duration} onComplete={() => handleComplete(exercise)} />
              </div>
            )}

            <div className="flex gap-3">
              {currentStep < exercise.steps.length - 1 ? (
                <button onClick={() => setCurrentStep(p => p + 1)} className="btn-primary flex-1 py-3">
                  Next Step →
                </button>
              ) : !showTimer ? (
                <button onClick={() => setShowTimer(true)} className="btn-primary flex-1 py-3">
                  ▶️ Start Exercise Timer
                </button>
              ) : null}
              <button onClick={() => handleComplete(exercise)} className="btn-secondary px-6 py-3">
                ✓ Mark Complete
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">Personalized Therapy Plan 💊</h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
              Evidence-based exercises personalized to your speech profile. Complete daily for best results.
            </p>
          </div>
          {totalXP > 0 && (
            <div className="glass-card p-4 text-center">
              <div className="font-display text-2xl font-bold gradient-text">{totalXP}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>XP Today</div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Daily progress */}
      <div className="glass-card p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Today's Progress</h3>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {completedExercises.size} / {EXERCISES.length} completed
          </span>
        </div>
        <div className="xp-bar h-3">
          <motion.div
            className="xp-fill h-3"
            initial={{ width: 0 }}
            animate={{ width: `${(completedExercises.size / EXERCISES.length) * 100}%` }}
            transition={{ duration: 0.6 }}
          />
        </div>
      </div>

      {/* Exercise grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {EXERCISES.map((exercise, i) => {
          const done = completedExercises.has(exercise.id)
          return (
            <motion.div
              key={exercise.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`glass-card p-6 cursor-pointer transition-all ${done ? 'opacity-70' : ''}`}
              whileHover={{ y: done ? 0 : -4 }}
              onClick={() => !done && setSelectedExercise(exercise)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="text-4xl">{exercise.icon}</div>
                {done ? (
                  <span className="badge badge-green text-xs">✓ Done</span>
                ) : (
                  <span className="badge badge-purple text-xs">{exercise.duration}</span>
                )}
              </div>

              <div className="text-xs mb-1" style={{ color: exercise.color, fontWeight: 600 }}>
                {exercise.category}
              </div>
              <h3 className="font-semibold mb-2">{exercise.title}</h3>
              <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                {exercise.steps[0].slice(0, 70)}...
              </p>

              <div className="flex items-center justify-between">
                <span className="badge badge-purple text-xs">+{exercise.xp} XP</span>
                {!done && (
                  <span className="text-xs font-medium" style={{ color: exercise.color }}>
                    Start →
                  </span>
                )}
              </div>

              {!done && (
                <div className="mt-3 h-0.5 rounded-full" style={{ background: `${exercise.color}30` }}>
                  <div className="h-full rounded-full w-0" style={{ background: exercise.color }} />
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
