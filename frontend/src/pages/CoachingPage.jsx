import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

const COACHING_HINTS = [
  { type: 'slow', message: '🐢 Slow down a little', color: '#f59e0b', priority: 2 },
  { type: 'breathe', message: '💨 Pause and breathe', color: '#7dd3fc', priority: 3 },
  { type: 'onset', message: '✨ Soft onset — start gently', color: '#8b5cf6', priority: 3 },
  { type: 'pace', message: '✅ Great pace! Keep it up', color: '#22c55e', priority: 1 },
  { type: 'block', message: '🔄 Take a breath before this word', color: '#ef4444', priority: 4 },
  { type: 'relax', message: '😌 Relax your shoulders', color: '#86efac', priority: 1 }
]

const PRACTICE_TEXTS = [
  "Every day I am becoming a more fluent and confident speaker. I take my time, breathe deeply, and speak with ease.",
  "The weather today is perfect for a walk in the park. The sun is shining and birds are singing in the trees.",
  "I would like to introduce myself. My name is [your name] and I work as a [your role] at [your company].",
  "Could you please tell me more about the requirements for this position? I am very interested in learning more.",
  "I believe that with practice and patience, anyone can improve their communication skills significantly."
]

const HintBubble = ({ hint, onDismiss }) => (
  <motion.div
    initial={{ opacity: 0, x: 50, scale: 0.8 }}
    animate={{ opacity: 1, x: 0, scale: 1 }}
    exit={{ opacity: 0, x: 50, scale: 0.8 }}
    className="flex items-center gap-3 px-5 py-3 rounded-2xl shadow-lg cursor-pointer"
    style={{
      background: `${hint.color}18`,
      border: `1.5px solid ${hint.color}40`,
      backdropFilter: 'blur(12px)'
    }}
    onClick={onDismiss}
    whileHover={{ scale: 1.05 }}
  >
    <span className="text-lg font-semibold" style={{ color: hint.color }}>
      {hint.message}
    </span>
  </motion.div>
)

const LiveWaveform = ({ isActive }) => (
  <div className="flex items-center justify-center gap-0.5 h-16">
    {[...Array(32)].map((_, i) => (
      <motion.div
        key={i}
        className="w-1 rounded-full"
        style={{
          background: isActive
            ? `hsl(${260 + Math.sin(i * 0.5) * 30}, 80%, 65%)`
            : '#e5e7eb'
        }}
        animate={isActive ? {
          height: [4, 12 + Math.abs(Math.sin(i * 0.8)) * 28, 4],
          opacity: [0.5, 1, 0.5]
        } : { height: 4, opacity: 0.3 }}
        transition={{
          duration: 0.6 + Math.random() * 0.4,
          delay: i * 0.03,
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
  const [wordIndex, setWordIndex] = useState(-1)
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef(null)
  const hintTimeoutRef = useRef(null)
  const metricsIntervalRef = useRef(null)
  const durationIntervalRef = useRef(null)
  const hintCountRef = useRef(0)

  const addHint = useCallback((hintType) => {
    const hint = COACHING_HINTS.find(h => h.type === hintType) || COACHING_HINTS[Math.floor(Math.random() * COACHING_HINTS.length)]
    const id = Date.now()
    setCurrentHints(prev => [...prev.slice(-2), { ...hint, id }])
    setTimeout(() => {
      setCurrentHints(prev => prev.filter(h => h.id !== id))
    }, 4000)
  }, [])

  const startCoaching = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })

      setIsCoaching(true)
      setTranscript('')
      setWordIndex(-1)
      setMetrics({ wpm: 0, blocks: 0, fluency: 0, duration: 0 })
      hintCountRef.current = 0

      // Duration timer
      let secs = 0
      durationIntervalRef.current = setInterval(() => {
        secs++
        setMetrics(prev => ({ ...prev, duration: secs }))
      }, 1000)

      // Simulate AI coaching hints at natural intervals
      const hintSchedule = [
        { delay: 5000, type: 'pace' },
        { delay: 12000, type: 'breathe' },
        { delay: 18000, type: 'slow' },
        { delay: 25000, type: 'onset' },
        { delay: 32000, type: 'relax' },
        { delay: 40000, type: 'pace' }
      ]

      hintSchedule.forEach(({ delay, type }) => {
        setTimeout(() => {
          if (isCoaching) addHint(type)
        }, delay)
      })

      // Metrics simulation
      metricsIntervalRef.current = setInterval(() => {
        setMetrics(prev => ({
          ...prev,
          wpm: 90 + Math.floor(Math.random() * 40),
          fluency: 65 + Math.floor(Math.random() * 25),
          blocks: prev.blocks + (Math.random() < 0.1 ? 1 : 0)
        }))
      }, 2000)

      // Speech recognition
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
              const conf = event.results[i][0].confidence
              // Low confidence = possible block
              if (conf < 0.6) addHint('onset')
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

      toast.success('Live coaching started! 🎙️ Speak naturally.')
    } catch (err) {
      toast.error('Microphone access required')
    }
  }

  const stopCoaching = () => {
    setIsCoaching(false)
    clearInterval(metricsIntervalRef.current)
    clearInterval(durationIntervalRef.current)
    if (recognitionRef.current) recognitionRef.current.stop()
    setCurrentHints([])
    toast.success('Great session! Check your metrics below 📊')
  }

  const words = PRACTICE_TEXTS[selectedText].split(' ')
  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="font-display text-3xl font-bold">Live Coaching Mode 🧠</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
          Speak and receive real-time, subtle hints from your AI coach — like having a therapist by your side.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main coaching panel */}
        <div className="lg:col-span-2 space-y-5">
          {/* Text selection */}
          {!isCoaching && (
            <div className="glass-card p-5">
              <h3 className="font-semibold mb-3">Choose Practice Text</h3>
              <div className="space-y-2">
                {PRACTICE_TEXTS.map((text, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedText(i)}
                    className={`w-full p-3 rounded-xl text-left text-sm border-2 transition-all ${
                      selectedText === i ? 'border-lavender-500 bg-lavender-50' : 'border-transparent hover:border-lavender-200'
                    }`}
                    style={selectedText !== i ? { background: 'rgba(139,92,246,0.03)' } : {}}
                  >
                    {text.slice(0, 80)}...
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reading text with word highlight */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Reading Text</h3>
              {isCoaching && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs text-red-500 font-medium">LIVE</span>
                </div>
              )}
            </div>
            <div className="text-base leading-loose font-body">
              {words.map((word, i) => (
                <React.Fragment key={i}>
                  <span className={`transition-all duration-200 px-0.5 py-0.5 rounded ${
                    i === wordIndex ? 'bg-lavender-200 text-lavender-800' : ''
                  }`}>
                    {word}
                  </span>{' '}
                </React.Fragment>
              ))}
            </div>

            {/* Waveform */}
            <div className="mt-6 p-4 rounded-xl" style={{ background: 'rgba(139,92,246,0.04)' }}>
              <LiveWaveform isActive={isCoaching} />
            </div>

            {/* Controls */}
            <div className="mt-4 flex gap-3 justify-center">
              {!isCoaching ? (
                <motion.button
                  onClick={startCoaching}
                  className="btn-primary px-8 py-4 text-base"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  🧠 Start Live Coaching
                </motion.button>
              ) : (
                <motion.button
                  onClick={stopCoaching}
                  className="btn-primary px-8 py-4 text-base"
                  style={{ background: 'linear-gradient(135deg, #6b7280, #4b5563)' }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  ⏹️ End Session
                </motion.button>
              )}
            </div>
          </div>

          {/* Live transcript */}
          {transcript && (
            <div className="glass-card p-5">
              <h3 className="font-semibold mb-3">Live Transcript</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {transcript}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar: hints + metrics */}
        <div className="space-y-5">
          {/* Live hints */}
          <div className="glass-card p-5">
            <h3 className="font-semibold mb-4">AI Coach Hints</h3>
            <div className="min-h-32 relative">
              <AnimatePresence>
                {isCoaching && currentHints.length === 0 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-center py-8"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Listening... hints will appear as you speak
                  </motion.p>
                )}
                {!isCoaching && (
                  <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>
                    Start coaching to see real-time hints
                  </p>
                )}
              </AnimatePresence>
              <div className="space-y-3">
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

          {/* Live metrics */}
          <div className="glass-card p-5">
            <h3 className="font-semibold mb-4">Session Metrics</h3>
            <div className="space-y-4">
              {[
                { label: 'Fluency', value: `${metrics.fluency}%`, color: '#22c55e', fill: metrics.fluency },
                { label: 'Speech Rate', value: `${metrics.wpm} WPM`, color: '#8b5cf6', fill: (metrics.wpm / 200) * 100 },
                { label: 'Blocks', value: metrics.blocks, color: metrics.blocks > 3 ? '#ef4444' : '#22c55e', fill: null }
              ].map(m => (
                <div key={m.label}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span style={{ color: 'var(--text-muted)' }}>{m.label}</span>
                    <span className="font-semibold" style={{ color: m.color }}>{m.value}</span>
                  </div>
                  {m.fill !== null && (
                    <div className="xp-bar">
                      <motion.div
                        className="xp-fill"
                        style={{ background: m.color }}
                        animate={{ width: `${m.fill}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  )}
                </div>
              ))}

              <div className="pt-3 border-t text-center" style={{ borderColor: 'var(--border)' }}>
                <div className="font-display text-2xl font-bold">{formatTime(metrics.duration)}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Session Duration</div>
              </div>
            </div>
          </div>

          {/* Coaching tips */}
          <div className="glass-card p-5">
            <h3 className="font-semibold mb-3">💡 Coaching Techniques</h3>
            <div className="space-y-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              {[
                '🐢 Speak at 80% of your natural speed',
                '💨 Exhale gently before starting each sentence',
                '✨ Begin words with a soft, easy air flow',
                '⏸️ Use natural pauses — they show confidence',
                '😌 Keep your jaw, tongue & lips relaxed'
              ].map((tip, i) => (
                <div key={i} className="flex gap-2 py-1">
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
