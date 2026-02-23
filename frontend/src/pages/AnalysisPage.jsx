import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import toast from 'react-hot-toast'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts'

const SAMPLE_PARAGRAPHS = [
  {
    level: 'Easy',
    text: 'The sun rises every morning over the hills. Birds begin to sing and flowers open. It is a beautiful time to be alive and grateful for the new day.'
  },
  {
    level: 'Medium',
    text: 'During the presentation, I explained the new project plan to the entire team. Several colleagues asked thoughtful questions about the timeline and resource allocation.'
  },
  {
    level: 'Hard',
    text: 'The pharmaceutical representative specifically requested a preliminary consultation before submitting the comprehensive documentation for the regulatory approval process.'
  }
]

const ConfidenceGauge = ({ score }) => {
  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444'
  const label = score >= 75 ? 'Excellent' : score >= 50 ? 'Good Progress' : 'Keep Practicing'

  return (
    <div className="relative flex flex-col items-center">
      <svg viewBox="0 0 200 120" className="w-48 h-28">
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        </defs>
        {/* Background arc */}
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#e5e7eb" strokeWidth="16" strokeLinecap="round" />
        {/* Colored arc */}
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#gaugeGrad)" strokeWidth="16"
          strokeLinecap="round" strokeDasharray={`${score * 2.51} 251`} />
        {/* Needle */}
        <line
          x1="100" y1="100"
          x2={100 + 65 * Math.cos(((-180 + score * 1.8) * Math.PI) / 180)}
          y2={100 + 65 * Math.sin(((-180 + score * 1.8) * Math.PI) / 180)}
          stroke={color} strokeWidth="3" strokeLinecap="round"
        />
        <circle cx="100" cy="100" r="6" fill={color} />
      </svg>
      <div className="text-center -mt-2">
        <div className="font-display text-4xl font-bold" style={{ color }}>{score}</div>
        <div className="text-sm font-medium mt-1" style={{ color }}>{label}</div>
      </div>
    </div>
  )
}

const WaveAnimation = ({ isRecording }) => (
  <div className="flex items-center justify-center gap-1 h-16">
    {[...Array(12)].map((_, i) => (
      <motion.div
        key={i}
        className="w-2 rounded-full"
        style={{ background: isRecording ? '#ef4444' : '#8b5cf6' }}
        animate={isRecording ? {
          height: [8, 32 + Math.random() * 24, 8],
          opacity: [0.6, 1, 0.6]
        } : {
          height: 8,
          opacity: 0.3
        }}
        transition={{
          duration: 0.8 + Math.random() * 0.4,
          delay: i * 0.06,
          repeat: isRecording ? Infinity : 0,
          ease: 'easeInOut'
        }}
      />
    ))}
  </div>
)

export default function AnalysisPage() {
  const [selectedParagraph, setSelectedParagraph] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [transcript, setTranscript] = useState('')
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const timerRef = useRef(null)
  const recognitionRef = useRef(null)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = e => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      mediaRecorderRef.current.start(100)
      setIsRecording(true)
      setTimeElapsed(0)
      setTranscript('')
      timerRef.current = setInterval(() => setTimeElapsed(t => t + 1), 1000)

      // Web Speech API for live transcript
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition
        recognitionRef.current = new SR()
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true
        recognitionRef.current.onresult = (event) => {
          let finalTranscript = ''
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript
          }
          if (finalTranscript) setTranscript(p => p + ' ' + finalTranscript)
        }
        recognitionRef.current.start()
      }
    } catch (err) {
      toast.error('Microphone access denied. Please allow microphone access.')
    }
  }

  const stopRecording = async () => {
    clearInterval(timerRef.current)
    setIsRecording(false)

    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }

    mediaRecorderRef.current?.stop()
    mediaRecorderRef.current?.stream?.getTracks().forEach(t => t.stop())

    await new Promise(resolve => setTimeout(resolve, 300))

    setLoading(true)
    try {
      // Send to backend for analysis
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')
      formData.append('transcript', transcript)
      formData.append('expected_text', SAMPLE_PARAGRAPHS[selectedParagraph].text)
      formData.append('duration', timeElapsed)

      const res = await axios.post('/api/analysis/speech', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setAnalysisResult(res.data.result)
      toast.success('Analysis complete! 🎉')
    } catch (err) {
      // Demo fallback
      setAnalysisResult(generateDemoResult())
      toast.success('Analysis complete! (Demo mode)')
    } finally {
      setLoading(false)
    }
  }

  const generateDemoResult = () => ({
    confidence_score: 68 + Math.floor(Math.random() * 20),
    fluency_rate: 72,
    speech_rate_wpm: 110,
    blocks: Math.floor(Math.random() * 4),
    repetitions: Math.floor(Math.random() * 3),
    prolongations: Math.floor(Math.random() * 2),
    filler_words: Math.floor(Math.random() * 5),
    voice_tremor: Math.random() * 30,
    duration_seconds: timeElapsed,
    radar: [
      { metric: 'Fluency', score: 72 },
      { metric: 'Pace', score: 65 },
      { metric: 'Confidence', score: 68 },
      { metric: 'Clarity', score: 80 },
      { metric: 'Rhythm', score: 58 },
      { metric: 'Breathing', score: 74 }
    ],
    suggestions: [
      'Practice easy onset — start words gently with soft air flow',
      'Use the "pause and breathe" technique before difficult sounds',
      'Your speech rate is good — maintain 100-120 WPM',
      'Try the prolongation exercise: stretch vowels slightly before blocks'
    ],
    recommended_exercises: ['Easy Onset Drill', 'Breathing Rhythm', 'Slow Speech', 'Mirror Practice']
  })

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="font-display text-3xl font-bold">Speech Analysis 🎙️</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
          Read the paragraph aloud and our AI will analyze your speech patterns in real-time.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recording Panel */}
        <div className="space-y-4">
          {/* Paragraph selector */}
          <div className="glass-card p-5">
            <h3 className="font-semibold mb-3">Choose a Reading Passage</h3>
            <div className="space-y-2">
              {SAMPLE_PARAGRAPHS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedParagraph(i)}
                  className={`w-full p-3 rounded-xl text-left text-sm border-2 transition-all ${
                    selectedParagraph === i
                      ? 'border-lavender-500 bg-lavender-50'
                      : 'border-transparent hover:border-lavender-200'
                  }`}
                  style={selectedParagraph === i ? {} : { background: 'rgba(139,92,246,0.03)' }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{p.level}</span>
                    {selectedParagraph === i && <span className="badge badge-purple">Selected</span>}
                  </div>
                  <span style={{ color: 'var(--text-muted)' }}>{p.text.slice(0, 60)}...</span>
                </button>
              ))}
            </div>
          </div>

          {/* Reading text */}
          <div className="glass-card p-5">
            <h3 className="font-semibold mb-3">Read this aloud:</h3>
            <p className="text-base leading-loose p-4 rounded-xl"
              style={{ background: 'rgba(139,92,246,0.04)', fontFamily: 'var(--font-body)' }}>
              {SAMPLE_PARAGRAPHS[selectedParagraph].text}
            </p>
          </div>

          {/* Recording controls */}
          <div className="glass-card p-6 text-center">
            <WaveAnimation isRecording={isRecording} />

            {isRecording && (
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-medium text-red-500">Recording — {formatTime(timeElapsed)}</span>
              </div>
            )}

            {transcript && isRecording && (
              <div className="p-3 rounded-xl text-sm text-left mb-4"
                style={{ background: 'rgba(139,92,246,0.06)', color: 'var(--text-muted)' }}>
                <strong>Live:</strong> {transcript.slice(-100)}...
              </div>
            )}

            <div className="flex gap-3 justify-center">
              {!isRecording ? (
                <motion.button
                  onClick={startRecording}
                  className="btn-primary px-8 py-4 text-base recording-pulse"
                  style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  🎙️ Start Recording
                </motion.button>
              ) : (
                <motion.button
                  onClick={stopRecording}
                  className="btn-primary px-8 py-4 text-base"
                  style={{ background: 'linear-gradient(135deg, #6b7280, #4b5563)' }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  ⏹️ Stop & Analyze
                </motion.button>
              )}
            </div>

            <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
              Speak naturally. Take pauses when needed. 
            </p>
          </div>
        </div>

        {/* Results Panel */}
        <div>
          {loading && (
            <div className="glass-card p-8 text-center">
              <div className="text-4xl mb-4 animate-pulse-slow">🧠</div>
              <h3 className="font-semibold text-lg mb-2">Analyzing your speech...</h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Our AI is detecting patterns, blocks, and calculating your confidence score
              </p>
              <div className="mt-4 flex justify-center gap-1">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-lavender-400 typing-dot" />
                ))}
              </div>
            </div>
          )}

          <AnimatePresence>
            {analysisResult && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Confidence Score */}
                <div className="glass-card p-6 text-center">
                  <h3 className="font-semibold mb-4">Your Confidence Score</h3>
                  <ConfidenceGauge score={analysisResult.confidence_score} />
                </div>

                {/* Metrics */}
                <div className="glass-card p-5">
                  <h3 className="font-semibold mb-4">Speech Metrics</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Fluency Rate', value: `${analysisResult.fluency_rate}%`, icon: '📊' },
                      { label: 'Speech Rate', value: `${analysisResult.speech_rate_wpm} WPM`, icon: '⏱️' },
                      { label: 'Blocks', value: analysisResult.blocks, icon: '🚫', warn: analysisResult.blocks > 3 },
                      { label: 'Repetitions', value: analysisResult.repetitions, icon: '🔄', warn: analysisResult.repetitions > 2 },
                      { label: 'Prolongations', value: analysisResult.prolongations, icon: '↔️' },
                      { label: 'Filler Words', value: analysisResult.filler_words, icon: '💬', warn: analysisResult.filler_words > 4 }
                    ].map(m => (
                      <div key={m.label} className="p-3 rounded-xl text-center"
                        style={{ background: m.warn ? 'rgba(239,68,68,0.06)' : 'rgba(139,92,246,0.04)' }}>
                        <div className="text-xl mb-1">{m.icon}</div>
                        <div className={`font-bold ${m.warn ? 'text-red-500' : ''}`}>{m.value}</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Radar Chart */}
                <div className="glass-card p-5">
                  <h3 className="font-semibold mb-4">Speech Profile</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <RadarChart data={analysisResult.radar}>
                      <PolarGrid stroke="rgba(139,92,246,0.2)" />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                      <Radar dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Suggestions */}
                <div className="glass-card p-5">
                  <h3 className="font-semibold mb-3">💡 AI Recommendations</h3>
                  <div className="space-y-2">
                    {analysisResult.suggestions.map((s, i) => (
                      <div key={i} className="flex gap-3 p-3 rounded-xl text-sm"
                        style={{ background: 'rgba(134,239,172,0.08)' }}>
                        <span className="text-green-500 flex-shrink-0">✓</span>
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                    <p className="text-sm font-medium mb-2">Recommended Exercises:</p>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.recommended_exercises.map(ex => (
                        <span key={ex} className="badge badge-purple">{ex}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!analysisResult && !loading && (
            <div className="glass-card p-8 text-center">
              <div className="text-5xl mb-4">🎙️</div>
              <h3 className="font-semibold text-lg mb-2">Ready to analyze</h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Select a paragraph, click record, and speak naturally. Results appear here instantly.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
