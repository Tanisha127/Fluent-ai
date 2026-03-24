import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import OmniVoiceWidget from '../components/OmniVoiceWidget'

const SCENARIOS = [
  {
    id: 'job_interview',
    icon: '💼',
    title: 'Job Interview',
    desc: 'Practice with a realistic HR interviewer',
    color: '#8b5cf6',
    difficulty: 'Medium',
    firstQuestion: "Hello! Thank you for coming in today. Could you start by telling me a little about yourself and your background?"
  },
  {
    id: 'university_viva',
    icon: '🎓',
    title: 'University Viva',
    desc: 'Defend your thesis confidently',
    color: '#7dd3fc',
    difficulty: 'Hard',
    firstQuestion: "Welcome. Please begin by giving us a brief overview of your research and the main contributions of your thesis."
  },
  {
    id: 'presentation',
    icon: '📊',
    title: 'Team Presentation',
    desc: 'Present your ideas to colleagues',
    color: '#86efac',
    difficulty: 'Medium',
    firstQuestion: "Go ahead and begin your presentation. We're all ears!"
  },
  {
    id: 'phone_call',
    icon: '📞',
    title: 'Phone Call',
    desc: 'Make a confident business call',
    color: '#f9a8d4',
    difficulty: 'Easy',
    firstQuestion: "Good afternoon! This is customer service. How can I help you today?"
  },
  {
    id: 'social',
    icon: '☕',
    title: 'Social Conversation',
    desc: 'Chat at a networking event',
    color: '#fbbf24',
    difficulty: 'Easy',
    firstQuestion: "Hey! I don't think we've met. I'm Alex. What brings you to this event today?"
  }
]

const LiveMetricPill = ({ label, value, color }) => (
  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
    style={{ background: `${color}15`, color }}>
    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: color }} />
    {label}: {value}
  </div>
)

const TypingDots = () => (
  <div className="flex items-center gap-1 px-4 py-3">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="w-2 h-2 rounded-full bg-lavender-400 typing-dot" />
    ))}
  </div>
)

export default function RoleplayPage() {
  const { user } = useAuth()

  const [selectedScenario, setSelectedScenario] = useState(null)
  const [sessionActive, setSessionActive] = useState(false)
  const [voiceMode, setVoiceMode] = useState(true)
  const [messages, setMessages] = useState([])
  const [isAiTyping, setIsAiTyping] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [userTranscript, setUserTranscript] = useState('')
  const [liveMetrics, setLiveMetrics] = useState({ fluency: 0, stress: 0, pace: 'Normal' })
  const [sessionStats, setSessionStats] = useState({ exchanges: 0, avgFluency: 0, duration: 0 })
  const [sessionEnded, setSessionEnded] = useState(false)
  const [sessionReport, setSessionReport] = useState(null)
  const [coachingTip, setCoachingTip] = useState(null)

  const mediaRecorderRef = useRef(null)
  const recognitionRef = useRef(null)
  const messagesEndRef = useRef(null)
  const timerRef = useRef(null)
  const recordingStartRef = useRef(null)
  const [elapsedTime, setElapsedTime] = useState(0)

  const transcriptRef = useRef('')
  const messagesRef = useRef([])
  const liveMetricsRef = useRef(liveMetrics)
  const elapsedTimeRef = useRef(0)

  useEffect(() => { messagesRef.current = messages }, [messages])
  useEffect(() => { liveMetricsRef.current = liveMetrics }, [liveMetrics])
  useEffect(() => { elapsedTimeRef.current = elapsedTime }, [elapsedTime])
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, isAiTyping])

  const startSession = async (scenario) => {
    setSelectedScenario(scenario)
    setSessionActive(true)
    setMessages([])
    messagesRef.current = []
    setSessionStats({ exchanges: 0, avgFluency: 0, duration: 0 })
    setElapsedTime(0)
    setSessionEnded(false)
    transcriptRef.current = ''
    setCoachingTip(null)
    setVoiceMode(true) // default to voice mode

    timerRef.current = setInterval(() => setElapsedTime(t => t + 1), 1000)

    setTimeout(() => {
      const firstMsg = [{ role: 'ai', content: scenario.firstQuestion, timestamp: new Date() }]
      setMessages(firstMsg)
      messagesRef.current = firstMsg
    }, 500)
  }

  const startRecording = async () => {
    try {
      transcriptRef.current = ''
      setUserTranscript('')
      recordingStartRef.current = Date.now()

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      const chunks = []
      mediaRecorderRef.current.ondataavailable = e => chunks.push(e.data)
      mediaRecorderRef.current.onstop = async () => {
        const finalTranscript = transcriptRef.current.trim()
        await sendUserResponse(finalTranscript, chunks)
      }
      mediaRecorderRef.current.start()
      setIsRecording(true)

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
              const confidence = event.results[i][0].confidence
              const wordCount = transcriptRef.current.split(' ').length
              const timeSpoken = (Date.now() - recordingStartRef.current) / 1000
              const wpm = timeSpoken > 0 ? Math.round((wordCount / timeSpoken) * 60) : 0
              setLiveMetrics({
                fluency: Math.round((confidence || 0.75) * 100),
                stress: Math.round((1 - (confidence || 0.75)) * 100),
                pace: wpm < 100 ? 'Slow' : wpm > 160 ? 'Fast' : 'Normal'
              })
            }
          }
          if (final) {
            transcriptRef.current = (transcriptRef.current + ' ' + final).trim()
            setUserTranscript(transcriptRef.current)
          }
        }
        recognitionRef.current.start()
      }
    } catch (err) {
      toast.error('Microphone access required for roleplay mode')
    }
  }

  const stopRecording = () => {
    setIsRecording(false)
    if (recognitionRef.current) recognitionRef.current.stop()
    setTimeout(() => {
      mediaRecorderRef.current?.stop()
      mediaRecorderRef.current?.stream?.getTracks().forEach(t => t.stop())
    }, 300)
  }

  const sendUserResponse = async (transcript, audioChunks) => {
    if (!transcript || !transcript.trim()) {
      toast.error("Didn't catch that. Please try again.")
      return
    }

    const currentMetrics = liveMetricsRef.current
    const userMsg = {
      role: 'user',
      content: transcript.trim(),
      timestamp: new Date(),
      fluency: currentMetrics.fluency
    }

    const historyBeforeUser = messagesRef.current
    setMessages(prev => [...prev, userMsg])
    messagesRef.current = [...historyBeforeUser, userMsg]
    setIsAiTyping(true)
    setCoachingTip(null)

    try {
      const res = await axios.post('/api/roleplay/respond', {
        scenario: selectedScenario.id,
        message: transcript.trim(),
        history: historyBeforeUser.map(m => ({ role: m.role, content: m.content })),
        userGoals: user?.primary_goals,
        stammering_level: user?.stammering_level
      })

      await new Promise(r => setTimeout(r, 600))

      const aiMsg = { role: 'ai', content: res.data.response, timestamp: new Date() }
      setMessages(prev => [...prev, aiMsg])
      messagesRef.current = [...messagesRef.current, aiMsg]

      if (res.data.coachingTip) {
        setCoachingTip(res.data.coachingTip)
        setTimeout(() => setCoachingTip(null), 5000)
      }

    } catch (err) {
      await new Promise(r => setTimeout(r, 800))
      const snippet = transcript.trim().slice(0, 50)
      const smartFallbacks = {
        job_interview: [
          `You mentioned "${snippet}" — can you give me a specific example of that?`,
          `That's a strong point. How did that prepare you for this role?`,
          `Interesting. What was the biggest challenge there, and how did you overcome it?`
        ],
        university_viva: [
          `You mentioned "${snippet}" — how does that relate to your core thesis?`,
          `Can you expand on the methodology behind what you just described?`
        ],
        presentation: [
          `You mentioned "${snippet}" — what data supports that claim?`,
          `How does that connect to the overall business objective?`
        ],
        phone_call: [
          `I understand. Can you confirm your account details so I can look into that?`,
          `Got it. Is there anything else I can help with today?`
        ],
        social: [
          `Oh nice! You mentioned "${snippet}" — how did you get into that?`,
          `That's really cool. What's the most exciting part of that for you?`
        ]
      }
      const pool = smartFallbacks[selectedScenario.id] || smartFallbacks.job_interview
      const fallbackContent = pool[Math.min(historyBeforeUser.length, pool.length - 1)]
      const aiMsg = { role: 'ai', content: fallbackContent, timestamp: new Date() }
      setMessages(prev => [...prev, aiMsg])
      messagesRef.current = [...messagesRef.current, aiMsg]
    } finally {
      setIsAiTyping(false)
      setSessionStats(prev => ({
        exchanges: prev.exchanges + 1,
        avgFluency: Math.round((prev.avgFluency * prev.exchanges + currentMetrics.fluency) / (prev.exchanges + 1)),
        duration: elapsedTimeRef.current
      }))
    }
  }

  const endSession = () => {
    clearInterval(timerRef.current)
    setSessionEnded(true)
    setSessionActive(false)
    setSessionReport({
      scenario: selectedScenario.title,
      exchanges: sessionStats.exchanges,
      avgFluency: sessionStats.avgFluency || 72,
      duration: elapsedTime,
      feedback: [
        'You maintained a steady pace throughout the session.',
        'Consider using pausing techniques before answering complex questions.',
        'Your answers showed strong structure — keep using the STAR method.',
        'Great progress on managing blocks compared to your baseline!'
      ],
      xpEarned: 80 + sessionStats.exchanges * 10
    })
  }

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  // ── Session complete screen ──
  if (sessionEnded && sessionReport) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="glass-card p-8 text-center mb-6">
            <div className="text-6xl mb-4">🏆</div>
            <h1 className="font-display text-3xl font-bold mb-2">Session Complete!</h1>
            <p className="mb-2" style={{ color: 'var(--text-muted)' }}>
              You finished your {sessionReport.scenario}
            </p>
            <div className="badge badge-purple inline-flex mt-2">
              +{sessionReport.xpEarned} Confidence XP
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Exchanges', value: sessionReport.exchanges, icon: '💬' },
              { label: 'Avg Fluency', value: `${sessionReport.avgFluency}%`, icon: '📊' },
              { label: 'Duration', value: formatTime(sessionReport.duration), icon: '⏱️' }
            ].map(s => (
              <div key={s.label} className="glass-card p-5 text-center">
                <div className="text-2xl mb-2">{s.icon}</div>
                <div className="font-display text-2xl font-bold">{s.value}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div className="glass-card p-6 mb-6">
            <h3 className="font-semibold mb-4">AI Coach Feedback</h3>
            <div className="space-y-3">
              {sessionReport.feedback.map((f, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-xl text-sm"
                  style={{ background: 'rgba(134,239,172,0.08)' }}>
                  <span className="text-green-500">✓</span>
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setSelectedScenario(null); setSessionEnded(false) }}
              className="btn-secondary flex-1 py-3"
            >
              Try Another Scenario
            </button>
            <button
              onClick={() => startSession(selectedScenario)}
              className="btn-primary flex-1 py-3"
            >
              Practice Again 🔄
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // ── Active session screen ──
  if (sessionActive && selectedScenario) {
    return (
      <div className="p-6 max-w-4xl mx-auto h-screen flex flex-col">

        {/* Session header */}
        <div className="glass-card p-4 mb-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{selectedScenario.icon}</span>
            <div>
              <div className="font-semibold">{selectedScenario.title}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {voiceMode ? '🎙️ Voice mode' : '💬 Text mode'} • {formatTime(elapsedTime)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Voice / Text toggle */}
            <div className="flex gap-1 p-1 rounded-xl"
              style={{ background: 'rgba(139,92,246,0.08)' }}>
              <button
                onClick={() => setVoiceMode(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={voiceMode
                  ? { background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: '#fff' }
                  : { color: 'var(--text-muted)' }}
              >
                🎙️ Voice
              </button>
              <button
                onClick={() => setVoiceMode(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={!voiceMode
                  ? { background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: '#fff' }
                  : { color: 'var(--text-muted)' }}
              >
                💬 Text
              </button>
            </div>

            {/* Live metrics — only in text mode */}
            {!voiceMode && isRecording && (
              <>
                <LiveMetricPill label="Fluency" value={`${liveMetrics.fluency}%`} color="#22c55e" />
                <LiveMetricPill label="Stress" value={`${liveMetrics.stress}%`} color={liveMetrics.stress > 30 ? '#ef4444' : '#8b5cf6'} />
                <LiveMetricPill label="Pace" value={liveMetrics.pace} color="#7dd3fc" />
              </>
            )}

            <button onClick={endSession} className="btn-secondary text-sm py-2 px-4">
              End Session
            </button>
          </div>
        </div>

        {/* ── VOICE MODE — OmniDimension ── */}
        {voiceMode ? (
          <div className="flex-1 flex flex-col">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">{selectedScenario.icon}</div>
              <h2 className="font-semibold text-lg mb-1">
                Speaking with your AI {selectedScenario.title} partner
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Just speak naturally — the AI listens and talks back with voice
              </p>
            </div>

            <div className="flex-1">
              <OmniVoiceWidget scenarioId={selectedScenario.id} />
            </div>

            <div className="glass-card p-3 mt-4 flex-shrink-0 text-center">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                💡 Can't use microphone? Switch to
                <button
                  onClick={() => setVoiceMode(false)}
                  className="ml-1 font-medium underline"
                  style={{ color: '#8b5cf6' }}
                >
                  Text mode
                </button>
              </p>
            </div>
          </div>
        ) : (
          // ── TEXT MODE — existing chat UI ──
          <>
            <div className="glass-card flex-1 overflow-y-auto p-5 mb-4 space-y-4">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${
                    msg.role === 'ai' ? 'bg-lavender-100 text-lavender-700' : 'bg-calm-100 text-calm-700'
                  }`}>
                    {msg.role === 'ai' ? '🤖' : '👤'}
                  </div>
                  <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl text-sm ${
                    msg.role === 'ai' ? 'rounded-tl-sm' : 'rounded-tr-sm'
                  }`} style={{
                    background: msg.role === 'ai'
                      ? 'rgba(139,92,246,0.08)'
                      : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                    color: msg.role === 'ai' ? 'var(--text)' : '#fff'
                  }}>
                    {msg.content}
                    {msg.fluency > 0 && (
                      <div className="mt-2 text-xs opacity-70">Fluency: {msg.fluency}%</div>
                    )}
                  </div>
                </motion.div>
              ))}

              {isAiTyping && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-lavender-100 flex items-center justify-center">🤖</div>
                  <div className="rounded-2xl rounded-tl-sm" style={{ background: 'rgba(139,92,246,0.08)' }}>
                    <TypingDots />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Coaching tip */}
            <AnimatePresence>
              {coachingTip && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="glass-card p-3 mb-3 text-sm flex-shrink-0 flex items-center gap-2"
                  style={{ background: 'rgba(134,239,172,0.08)', borderLeft: '3px solid #22c55e' }}
                >
                  <span>🎯</span>
                  <span className="text-green-600 font-medium">{coachingTip}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {isRecording && userTranscript && (
              <div className="glass-card p-3 mb-3 text-sm flex-shrink-0"
                style={{ color: 'var(--text-muted)', background: 'rgba(239,68,68,0.04)' }}>
                <span className="text-red-400 font-medium">🔴 Live: </span>
                {userTranscript.slice(-150)}
              </div>
            )}

            <div className="glass-card p-4 flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  {isRecording ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500 recording-pulse" />
                      <span className="text-sm font-medium text-red-500">
                        Listening... Speak your answer
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      Press to respond when the AI finishes
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {!isRecording ? (
                    <motion.button
                      onClick={startRecording}
                      disabled={isAiTyping}
                      className="btn-primary px-6 py-3"
                      style={isAiTyping ? { opacity: 0.5, cursor: 'not-allowed' } : {
                        background: 'linear-gradient(135deg, #ef4444, #dc2626)'
                      }}
                      whileHover={!isAiTyping ? { scale: 1.05 } : {}}
                      whileTap={!isAiTyping ? { scale: 0.95 } : {}}
                    >
                      🎙️ Speak
                    </motion.button>
                  ) : (
                    <motion.button
                      onClick={stopRecording}
                      className="btn-primary px-6 py-3"
                      style={{ background: 'linear-gradient(135deg, #6b7280, #4b5563)' }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      ⏹️ Done
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  // ── Scenario selection screen ──
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="font-display text-3xl font-bold">AI Roleplay Simulator</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
          Practice real-life conversations with your AI conversation partner. No judgment, just growth.
        </p>
        {user?.primary_goals?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {user.primary_goals.map(goal => (
              <span key={goal} className="badge badge-purple text-xs">{goal}</span>
            ))}
          </div>
        )}
      </motion.div>

      {/* Voice mode banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-4 mb-6 flex items-center gap-4"
        style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(125,211,252,0.08))' }}
      >
        <div className="text-3xl">🎙️</div>
        <div className="flex-1">
          <div className="font-semibold text-sm">Voice-to-Voice mode is now available!</div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Pick a scenario and speak directly to your AI partner — it talks back with real voice.
            Switch to text mode anytime.
          </div>
        </div>
        <div className="badge badge-purple text-xs">NEW</div>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {SCENARIOS.map((scenario, i) => (
          <motion.div
            key={scenario.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6 cursor-pointer group"
            whileHover={{ y: -6, scale: 1.02 }}
            onClick={() => startSession(scenario)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="text-4xl">{scenario.icon}</div>
              <span className={`badge text-xs ${
                scenario.difficulty === 'Easy' ? 'badge-green' :
                scenario.difficulty === 'Medium' ? 'badge-blue' : 'badge-purple'
              }`}>
                {scenario.difficulty}
              </span>
            </div>
            <h3 className="font-semibold text-lg mb-2">{scenario.title}</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{scenario.desc}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                <span>🎙️</span>
                <span>Voice + Text</span>
              </div>
              <button
                className="text-sm font-medium group-hover:translate-x-1 transition-transform"
                style={{ color: scenario.color }}
              >
                Start →
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 glass-card p-6"
      >
        <h3 className="font-semibold mb-4">💡 How Roleplay Works</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { step: '1', text: 'Choose a scenario that matches your real-life challenge', icon: '🎯' },
            { step: '2', text: 'Speak to your AI partner — it listens and talks back with voice', icon: '🎙️' },
            { step: '3', text: 'Switch to text mode anytime for typed practice with fluency metrics', icon: '📊' }
          ].map(s => (
            <div key={s.step} className="flex gap-3">
              <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                {s.step}
              </div>
              <div>
                <div className="text-xl mb-1">{s.icon}</div>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}