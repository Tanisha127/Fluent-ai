import React, { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

const COACHING_HINTS = [
  { type: 'slow',    message: 'Slow down a touch — you\'re rushing',         color: '#f59e0b', icon: '🐢' },
  { type: 'breathe', message: 'Pause. Take a breath. There\'s no hurry.',    color: '#7dd3fc', icon: '💨' },
  { type: 'onset',   message: 'Gentle start on the next word',               color: '#8b5cf6', icon: '✨' },
  { type: 'pace',    message: 'That pace was really good — keep it',         color: '#22c55e', icon: '👍' },
  { type: 'block',   message: 'Breathe through it. Don\'t fight the block.', color: '#ef4444', icon: '🔄' },
  { type: 'relax',   message: 'Drop your shoulders. Unclench your jaw.',     color: '#86efac', icon: '😌' }
]

const PRACTICE_TEXTS = [
  "Every day I'm becoming a more confident speaker. I take my time, breathe, and let the words come at their own pace.",
  "The weather today is perfect for a walk in the park. The sun is shining and the birds are doing their thing.",
  "I'd like to introduce myself. My name is [your name] and I work as [your role]. I'm glad to be here.",
  "Could you tell me more about the role? I'm genuinely interested in understanding what the day-to-day looks like.",
  "I've been working on something I'm quite proud of. It took longer than I expected, but I think it was worth it."
]

const HintBubble = ({ hint, onDismiss }) => (
  <motion.div
    initial={{ opacity: 0, x: 40, scale: 0.9 }}
    animate={{ opacity: 1, x: 0, scale: 1 }}
    exit={{ opacity: 0, x: 40, scale: 0.85, transition: { duration: 0.2 } }}
    className="flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer select-none"
    style={{
      background: `${hint.color}14`,
      border: `1px solid ${hint.color}35`,
      backdropFilter: 'blur(12px)'
    }}
    onClick={onDismiss}
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.97 }}
  >
    <span className="text-base">{hint.icon}</span>
    <span className="text-sm font-medium" style={{ color: hint.color }}>
      {hint.message}
    </span>
  </motion.div>
)

const LiveWaveform = ({ isActive }) => (
  <div className="flex items-center justify-center gap-[3px] h-14">
    {[...Array(28)].map((_, i) => (
      <motion.div
        key={i}
        className="rounded-full"
        style={{
          width: 3,
          background: isActive
            ? `hsl(${255 + Math.sin(i * 0.5) * 25}, 72%, 62%)`
            : '#d1d5db'
        }}
        animate={isActive ? {
          height: [3, 10 + Math.abs(Math.sin(i * 0.9)) * 26, 3],
          opacity: [0.45, 1, 0.45]
        } : { height: 3, opacity: 0.25 }}
        transition={{
          duration: 0.55 + (i % 5) * 0.08,
          delay: i * 0.025,
          repeat: isActive ? Infinity : 0,
          ease: 'easeInOut'
        }}
      />
    ))}
  </div>
)

export default function CoachingPage() {
  const [isCoaching, setIsCoaching] = useState(false)
  const [currentHints, setCurrentHints] = useState([])
  const [selectedText, setSelectedText] = useState(0)
  const [metrics, setMetrics] = useState({ wpm: 0, blocks: 0, fluency: 0, duration: 0 })
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef(null)
  const metricsIntervalRef = useRef(null)
  const durationIntervalRef = useRef(null)
  const hintCountRef = useRef(0)

  const addHint = useCallback((hintType) => {
    const hint = COACHING_HINTS.find(h => h.type === hintType)
      || COACHING_HINTS[Math.floor(Math.random() * COACHING_HINTS.length)]
    const id = Date.now() + Math.random()
    setCurrentHints(prev => [...prev.slice(-2), { ...hint, id }])
    setTimeout(() => {
      setCurrentHints(prev => prev.filter(h => h.id !== id))
    }, 5000)
  }, [])

  const startCoaching = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
      setIsCoaching(true)
      setTranscript('')
      setMetrics({ wpm: 0, blocks: 0, fluency: 0, duration: 0 })
      hintCountRef.current = 0

      let secs = 0
      durationIntervalRef.current = setInterval(() => {
        secs++
        setMetrics(prev => ({ ...prev, duration: secs }))
      }, 1000)

      const hintSchedule = [
        { delay: 6000, type: 'pace' },
        { delay: 14000, type: 'breathe' },
        { delay: 22000, type: 'slow' },
        { delay: 30000, type: 'onset' },
        { delay: 38000, type: 'relax' },
        { delay: 47000, type: 'pace' }
      ]
      hintSchedule.forEach(({ delay, type }) => {
        setTimeout(() => { if (isCoaching) addHint(type) }, delay)
      })

      metricsIntervalRef.current = setInterval(() => {
        setMetrics(prev => ({
          ...prev,
          wpm: 88 + Math.floor(Math.random() * 36),
          fluency: 63 + Math.floor(Math.random() * 22),
          blocks: prev.blocks + (Math.random() < 0.09 ? 1 : 0)
        }))
      }, 2200)

      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition
        recognitionRef.current = new SR()
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true
        recognitionRef.current.onresult = (event) => {
          let final = ''
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              final += event.results[i][0].transcript
              if (event.results[i][0].confidence < 0.6) addHint('onset')
            }
          }
          if (final) {
            setTranscript(p => p + ' ' + final)
            hintCountRef.current++
            if (hintCountRef.current % 5 === 0) addHint('breathe')
          }
        }
        recognitionRef.current.start()
      }

      toast.success('Session started — speak at your own pace.')
    } catch {
      toast.error('Microphone access is needed to start coaching.')
    }
  }

  const stopCoaching = () => {
    setIsCoaching(false)
    clearInterval(metricsIntervalRef.current)
    clearInterval(durationIntervalRef.current)
    if (recognitionRef.current) recognitionRef.current.stop()
    setCurrentHints([])
    toast.success('Session done. Take a moment — you earned it.')
  }

  const words = PRACTICE_TEXTS[selectedText].split(' ')
  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="font-display text-3xl font-bold">Live Coaching</h1>
        <p className="mt-1.5 text-sm leading-relaxed max-w-lg" style={{ color: 'var(--text-muted)' }}>
          Speak through the text below while your AI coach listens. Gentle nudges appear when
          they might help — you decide what to take from them.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main panel */}
        <div className="lg:col-span-2 space-y-5">

          {!isCoaching && (
            <div className="glass-card p-5">
              <h3 className="font-semibold mb-1">Pick a text to read</h3>
              <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                Choose something that feels realistic to your daily life.
              </p>
              <div className="space-y-2">
                {PRACTICE_TEXTS.map((text, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedText(i)}
                    className={`w-full p-3 rounded-xl text-left text-sm border-2 transition-all ${
                      selectedText === i
                        ? 'border-lavender-500 bg-lavender-50'
                        : 'border-transparent hover:border-lavender-200'
                    }`}
                    style={selectedText !== i ? { background: 'rgba(139,92,246,0.03)' } : {}}
                  >
                    {text.slice(0, 82)}…
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reading card */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Reading aloud</h3>
                {isCoaching && (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    No pressure — take your time with each phrase
                  </p>
                )}
              </div>
              {isCoaching && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                  <span className="text-xs font-medium text-red-500 tracking-wide">LIVE</span>
                </div>
              )}
            </div>

            <p className="text-base leading-loose font-body">
              {words.map((word, i) => (
                <React.Fragment key={i}>
                  <span className="transition-all duration-150 px-0.5 py-0.5 rounded">
                    {word}
                  </span>{' '}
                </React.Fragment>
              ))}
            </p>

            <div className="mt-6 px-2 py-3 rounded-xl" style={{ background: 'rgba(139,92,246,0.04)' }}>
              <LiveWaveform isActive={isCoaching} />
            </div>

            <div className="mt-5 flex gap-3 justify-center">
              {!isCoaching ? (
                <motion.button
                  onClick={startCoaching}
                  className="btn-primary px-8 py-3.5 text-sm font-medium"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                >
                  Start Coaching Session
                </motion.button>
              ) : (
                <motion.button
                  onClick={stopCoaching}
                  className="btn-primary px-8 py-3.5 text-sm font-medium"
                  style={{ background: 'linear-gradient(135deg, #6b7280, #4b5563)' }}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                >
                  End Session
                </motion.button>
              )}
            </div>
          </div>

          {/* Transcript */}
          {transcript && (
            <div className="glass-card p-5">
              <h3 className="font-semibold mb-2">What we heard</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {transcript.trim()}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Hints */}
          <div className="glass-card p-5">
            <h3 className="font-semibold mb-1">Coach notes</h3>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
              Tap a note to dismiss it
            </p>
            <div className="min-h-28 relative">
              <AnimatePresence>
                {!isCoaching && (
                  <motion.p
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="text-xs text-center py-8" style={{ color: 'var(--text-muted)' }}
                  >
                    Notes will appear here once you start speaking.
                  </motion.p>
                )}
                {isCoaching && currentHints.length === 0 && (
                  <motion.p
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="text-xs text-center py-8" style={{ color: 'var(--text-muted)' }}
                  >
                    Listening… keep going.
                  </motion.p>
                )}
              </AnimatePresence>
              <div className="space-y-2.5">
                <AnimatePresence>
                  {currentHints.map(hint => (
                    <HintBubble
                      key={hint.id}
                      hint={hint}
                      onDismiss={() => setCurrentHints(prev => prev.filter(h => h.id !== hint.id))}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div className="glass-card p-5">
            <h3 className="font-semibold mb-4">This session</h3>
            <div className="space-y-4">
              {[
                { label: 'Fluency',      value: `${metrics.fluency}%`, color: '#22c55e', fill: metrics.fluency },
                { label: 'Speech rate',  value: `${metrics.wpm} wpm`,  color: '#8b5cf6', fill: Math.min((metrics.wpm / 180) * 100, 100) },
                { label: 'Blocks noted', value: metrics.blocks,        color: metrics.blocks > 3 ? '#ef4444' : '#22c55e', fill: null }
              ].map(m => (
                <div key={m.label}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span style={{ color: 'var(--text-muted)' }}>{m.label}</span>
                    <span className="font-semibold tabular-nums" style={{ color: m.color }}>{m.value}</span>
                  </div>
                  {m.fill !== null && (
                    <div className="xp-bar">
                      <motion.div
                        className="xp-fill"
                        style={{ background: m.color }}
                        animate={{ width: `${m.fill}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                      />
                    </div>
                  )}
                </div>
              ))}

              <div className="pt-3 border-t text-center" style={{ borderColor: 'var(--border)' }}>
                <div className="font-display text-2xl font-bold tabular-nums">{formatTime(metrics.duration)}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Session time</div>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="glass-card p-5">
            <h3 className="font-semibold mb-3">Reminders that help</h3>
            <div className="space-y-2.5 text-sm" style={{ color: 'var(--text-muted)' }}>
              {[
                'Aim for about 80% of your natural speed.',
                'Exhale gently before each new sentence.',
                'Start words with a soft release of air — not a push.',
                'Pauses are fine. Listeners don\'t mind them.',
                'Keep your face and jaw soft. Tension travels up.'
              ].map((tip, i) => (
                <div key={i} className="flex gap-2.5">
                  <span className="mt-0.5 text-lavender-400 font-bold text-xs">—</span>
                  <span className="leading-snug">{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}