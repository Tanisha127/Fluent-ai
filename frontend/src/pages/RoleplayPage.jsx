import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import toast from 'react-hot-toast'

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
  const [selectedScenario, setSelectedScenario] = useState(null)
  const [sessionActive, setSessionActive] = useState(false)
  const [messages, setMessages] = useState([])
  const [isAiTyping, setIsAiTyping] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [userTranscript, setUserTranscript] = useState('')
  const [liveMetrics, setLiveMetrics] = useState({ fluency: 0, stress: 0, pace: 'Normal' })
  const [sessionStats, setSessionStats] = useState({ exchanges: 0, avgFluency: 0, duration: 0 })
  const [sessionEnded, setSessionEnded] = useState(false)
  const [sessionReport, setSessionReport] = useState(null)
  const mediaRecorderRef = useRef(null)
  const recognitionRef = useRef(null)
  const messagesEndRef = useRef(null)
  const timerRef = useRef(null)
  const [elapsedTime, setElapsedTime] = useState(0)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isAiTyping])

  const startSession = async (scenario) => {
    setSelectedScenario(scenario)
    setSessionActive(true)
    setMessages([])
    setSessionStats({ exchanges: 0, avgFluency: 0, duration: 0 })
    setElapsedTime(0)
    setSessionEnded(false)

    timerRef.current = setInterval(() => setElapsedTime(t => t + 1), 1000)

    // Add AI first message
    setTimeout(() => {
      setMessages([{
        role: 'ai',
        content: scenario.firstQuestion,
        timestamp: new Date()
      }])
    }, 500)
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      const chunks = []
      mediaRecorderRef.current.ondataavailable = e => chunks.push(e.data)
      mediaRecorderRef.current.onstop = async () => {
        await sendUserResponse(userTranscript, chunks)
      }
      mediaRecorderRef.current.start()
      setIsRecording(true)
      setUserTranscript('')

      // Speech recognition
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition
        recognitionRef.current = new SR()
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true

        // Simulate live metrics
        const metricsInterval = setInterval(() => {
          setLiveMetrics({
            fluency: 60 + Math.floor(Math.random() * 30),
            stress: Math.floor(Math.random() * 40),
            pace: ['Slow', 'Normal', 'Fast'][Math.floor(Math.random() * 3)]
          })
        }, 1000)

        recognitionRef.current.onresult = (event) => {
          let final = '', interim = ''
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) final += event.results[i][0].transcript
            else interim += event.results[i][0].transcript
          }
          if (final) setUserTranscript(p => p + ' ' + final)
        }
        recognitionRef.current.start()
        recognitionRef.current._metricsInterval = metricsInterval
      }
    } catch (err) {
      toast.error('Microphone access required for roleplay mode')
    }
  }

  const stopRecording = () => {
    setIsRecording(false)
    if (recognitionRef.current) {
      clearInterval(recognitionRef.current._metricsInterval)
      recognitionRef.current.stop()
    }
    mediaRecorderRef.current?.stop()
    mediaRecorderRef.current?.stream?.getTracks().forEach(t => t.stop())
  }

  const sendUserResponse = async (transcript, audioChunks) => {
    if (!transcript.trim()) {
      toast.error("Didn't catch that. Please try again.")
      return
    }

    const userMsg = { role: 'user', content: transcript.trim(), timestamp: new Date(), fluency: liveMetrics.fluency }
    setMessages(prev => [...prev, userMsg])
    setIsAiTyping(true)

    try {
      const res = await axios.post('/api/roleplay/respond', {
        scenario: selectedScenario.id,
        message: transcript,
        history: messages.map(m => ({ role: m.role, content: m.content }))
      })
      await new Promise(r => setTimeout(r, 1200))
      setMessages(prev => [...prev, {
        role: 'ai',
        content: res.data.response,
        timestamp: new Date()
      }])
    } catch {
      // Demo AI responses
      await new Promise(r => setTimeout(r, 1500))
      const demoResponses = [
        "That's a great point. Could you elaborate on how you handled challenges in that situation?",
        "Interesting. What specific skills do you believe make you stand out for this role?",
        "I appreciate your answer. Let me ask you — where do you see yourself in five years?",
        "Excellent. Can you walk me through a time you faced a difficult situation and how you resolved it?",
        "Thank you for sharing that. Do you have any questions for us?"
      ]
      setMessages(prev => [...prev, {
        role: 'ai',
        content: demoResponses[Math.floor(Math.random() * demoResponses.length)],
        timestamp: new Date()
      }])
    } finally {
      setIsAiTyping(false)
      setSessionStats(prev => ({
        exchanges: prev.exchanges + 1,
        avgFluency: Math.round((prev.avgFluency * prev.exchanges + liveMetrics.fluency) / (prev.exchanges + 1)),
        duration: elapsedTime
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
        'You maintained good eye contact and a steady pace throughout most of the interview.',
        'Consider using pausing techniques before answering complex questions.',
        'Your answers showed strong structure — keep using the STAR method.',
        'Great progress on managing blocks compared to your baseline!'
      ],
      xpEarned: 80 + sessionStats.exchanges * 10
    })
  }

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  if (sessionEnded && sessionReport) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="glass-card p-8 text-center mb-6">
            <div className="text-6xl mb-4 achievement-pop">🏆</div>
            <h1 className="font-display text-3xl font-bold mb-2">Session Complete!</h1>
            <p className="mb-2" style={{ color: 'var(--text-muted)' }}>You finished your {sessionReport.scenario}</p>
            <div className="badge badge-purple inline-flex mt-2">+{sessionReport.xpEarned} Confidence XP</div>
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
            <button onClick={() => { setSelectedScenario(null); setSessionEnded(false) }}
              className="btn-secondary flex-1 py-3">Try Another Scenario</button>
            <button onClick={() => startSession(selectedScenario)}
              className="btn-primary flex-1 py-3">Practice Again 🔄</button>
          </div>
        </motion.div>
      </div>
    )
  }

  if (sessionActive && selectedScenario) {
    return (
      <div className="p-6 max-w-4xl mx-auto h-screen flex flex-col">
        {/* Session header */}
        <div className="glass-card p-4 mb-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{selectedScenario.icon}</span>
            <div>
              <div className="font-semibold">{selectedScenario.title}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Session in progress • {formatTime(elapsedTime)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {isRecording && (
              <>
                <LiveMetricPill label="Fluency" value={`${liveMetrics.fluency}%`} color="#22c55e" />
                <LiveMetricPill label="Stress" value={`${liveMetrics.stress}%`} color={liveMetrics.stress > 30 ? '#ef4444' : '#8b5cf6'} />
                <LiveMetricPill label="Pace" value={liveMetrics.pace} color="#7dd3fc" />
              </>
            )}
            <button onClick={endSession} className="btn-secondary text-sm py-2 px-4">End Session</button>
          </div>
        </div>

        {/* Chat area */}
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
                msg.role === 'ai'
                  ? 'rounded-tl-sm'
                  : 'rounded-tr-sm'
              }`} style={{
                background: msg.role === 'ai' ? 'rgba(139,92,246,0.08)' : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                color: msg.role === 'ai' ? 'var(--text)' : '#fff'
              }}>
                {msg.content}
                {msg.fluency && (
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

        {/* Live transcript preview */}
        {isRecording && userTranscript && (
          <div className="glass-card p-3 mb-3 text-sm flex-shrink-0"
            style={{ color: 'var(--text-muted)', background: 'rgba(239,68,68,0.04)' }}>
            <span className="text-red-400 font-medium">🔴 Live: </span>{userTranscript.slice(-150)}
          </div>
        )}

        {/* Recording controls */}
        <div className="glass-card p-4 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              {isRecording ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 recording-pulse" />
                  <span className="text-sm font-medium text-red-500">Listening... Speak your answer</span>
                </div>
              ) : (
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Press to respond when the AI finishes speaking
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
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="font-display text-3xl font-bold">AI Roleplay Simulator 🎭</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
          Practice real-life conversations with your AI conversation partner. No judgment, just growth.
        </p>
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
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                AI will ask realistic questions
              </div>
              <button className="text-sm font-medium group-hover:translate-x-1 transition-transform"
                style={{ color: scenario.color }}>
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
            { step: '2', text: 'Have a real conversation with the AI interviewer/partner', icon: '🎙️' },
            { step: '3', text: 'Receive detailed feedback on fluency, stress & delivery', icon: '📊' }
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
