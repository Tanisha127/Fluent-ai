import React, { useEffect, useState } from 'react'

const AGENT_KEYS = {
  job_interview: '66c351f3251a7733a2772b74100eb75a',
  university_viva: 'c99be077a56b4a42b63bc74ceab6d9bd',
  presentation: 'b343a82214f4901c411ff80d550da3f0',
  phone_call: '6d8af245fe5dc982c730bdb34255f5c0',
  social: '4324b0105631025ef7e5136af62b00c8'
}

const SCENARIO_LABELS = {
  job_interview: { name: 'Sarah', role: 'HR Interviewer', emoji: '💼', color: '#8b5cf6' },
  university_viva: { name: 'Prof. James', role: 'PhD Examiner', emoji: '🎓', color: '#7dd3fc' },
  presentation: { name: 'Alex', role: 'Product Manager', emoji: '📊', color: '#86efac' },
  phone_call: { name: 'Maya', role: 'Customer Service', emoji: '📞', color: '#f9a8d4' },
  social: { name: 'Jamie', role: 'Networking Partner', emoji: '☕', color: '#fbbf24' }
}

export default function OmniVoiceWidget({ scenarioId }) {
  const label = SCENARIO_LABELS[scenarioId]
  const secretKey = AGENT_KEYS[scenarioId]
  const [widgetReady, setWidgetReady] = useState(false)

  useEffect(() => {
    // Remove old script
    const old = document.getElementById('omnidimension-web-widget')
    if (old) old.remove()

    // Clear widget div
    const widgetDiv = document.getElementById('omni-widget-component')
    if (widgetDiv) widgetDiv.innerHTML = ''

    setWidgetReady(false)

    if (!secretKey || secretKey.startsWith('ADD_KEY')) return

    // Load new script for this scenario
    const script = document.createElement('script')
    script.id = 'omnidimension-web-widget'
    script.async = true
    script.src = `https://omnidim.io/web_widget.js?secret_key=${secretKey}`
    script.onload = () => setWidgetReady(true)
    document.body.appendChild(script)

    return () => {
      const s = document.getElementById('omnidimension-web-widget')
      if (s) s.remove()
      const div = document.getElementById('omni-widget-component')
      if (div) div.innerHTML = ''
    }
  }, [scenarioId, secretKey])

  return (
    <div className="flex flex-col items-center gap-4 w-full">

      {/* AI Partner card */}
      <div className="glass-card p-5 w-full flex items-center gap-4"
        style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(125,211,252,0.08))' }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${label?.color}, #7c3aed)` }}>
          {label?.emoji}
        </div>
        <div className="flex-1">
          <div className="font-semibold text-lg">{label?.name}</div>
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {label?.role} · AI Voice Partner
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm text-green-500 font-medium">Live</span>
        </div>
      </div>

      {/* Instructions panel */}
      <div className="glass-card p-6 w-full text-center space-y-5">
        <div className="text-5xl">🎙️</div>
        <div>
          <h3 className="font-semibold text-lg mb-1">
            {label?.name} is ready to speak with you
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Click the microphone button in the bottom right corner to start your voice session
          </p>
        </div>

        {/* Arrow pointing to widget */}
        <div className="p-4 rounded-2xl flex items-center gap-3"
          style={{ background: 'rgba(139,92,246,0.08)', border: '2px dashed rgba(139,92,246,0.3)' }}>
          <span className="text-3xl">👇</span>
          <div className="text-left">
            <p className="text-sm font-medium">Look bottom right of your screen</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              A microphone button will appear — click it to start
            </p>
          </div>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: '🔵', step: '1', text: 'Click mic button bottom right' },
            { icon: '🎙️', step: '2', text: 'Allow microphone access' },
            { icon: '🗣️', step: '3', text: 'Speak — AI responds!' }
          ].map(s => (
            <div key={s.step} className="p-3 rounded-xl text-center"
              style={{ background: 'rgba(139,92,246,0.04)' }}>
              <div className="text-xl mb-1">{s.icon}</div>
              <div className="text-xs font-bold mb-1">Step {s.step}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.text}</div>
            </div>
          ))}
        </div>

        {/* Status */}
        {!widgetReady && secretKey && !secretKey.startsWith('ADD_KEY') && (
          <div className="flex items-center justify-center gap-2 text-sm"
            style={{ color: 'var(--text-muted)' }}>
            <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            Loading voice assistant...
          </div>
        )}

        {widgetReady && (
          <div className="flex items-center justify-center gap-2 text-sm text-green-500 font-medium">
            <span>✅</span>
            <span>Voice assistant loaded — check bottom right corner!</span>
          </div>
        )}

        {secretKey?.startsWith('ADD_KEY') && (
          <div className="p-3 rounded-xl text-sm"
            style={{ background: 'rgba(239,68,68,0.06)', color: '#ef4444' }}>
            ⚠️ Secret key not added for this scenario yet.
            Go to OmniDimension → Edit Agent → Deploy → Integrate with website → copy key
          </div>
        )}
      </div>

      <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
        🔒 Voice sessions are private and not stored by FluentAI
      </p>
    </div>
  )
}