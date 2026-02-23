import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, AreaChart, Area, Legend
} from 'recharts'

const monthlyData = [
  { week: 'W1', fluency: 52, anxiety: 72, confidence: 45 },
  { week: 'W2', fluency: 58, anxiety: 65, confidence: 50 },
  { week: 'W3', fluency: 63, anxiety: 60, confidence: 58 },
  { week: 'W4', fluency: 69, anxiety: 55, confidence: 65 },
  { week: 'W5', fluency: 74, anxiety: 48, confidence: 70 },
  { week: 'W6', fluency: 72, anxiety: 45, confidence: 72 },
  { week: 'W7', fluency: 78, anxiety: 40, confidence: 78 },
  { week: 'W8', fluency: 82, anxiety: 35, confidence: 83 }
]

const situationData = [
  { situation: 'Job Interview', fluency: 55, anxiety: 85 },
  { situation: 'Phone Call', fluency: 62, anxiety: 70 },
  { situation: 'Class Talk', fluency: 70, anxiety: 60 },
  { situation: 'Friends Chat', fluency: 88, anxiety: 20 },
  { situation: 'Presentation', fluency: 50, anxiety: 90 },
  { situation: 'Shop/Cafe', fluency: 80, anxiety: 35 }
]

// Generate a 7x4 heatmap (7 days, 4 weeks)
const generateHeatmap = () => {
  const data = []
  for (let week = 0; week < 8; week++) {
    const row = []
    for (let day = 0; day < 7; day++) {
      const practiced = Math.random() > 0.3
      row.push({
        practiced,
        fluency: practiced ? 50 + Math.floor(Math.random() * 40) : 0
      })
    }
    data.push(row)
  }
  return data
}

const heatmapData = generateHeatmap()
const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

const getHeatColor = (fluency) => {
  if (!fluency) return '#e5e7eb'
  if (fluency >= 80) return '#22c55e'
  if (fluency >= 65) return '#8b5cf6'
  if (fluency >= 50) return '#7dd3fc'
  return '#fbbf24'
}

export default function ProgressPage() {
  const [logForm, setLogForm] = useState({ situation: '', emotion: '', fluency_felt: 3, notes: '' })
  const [logs, setLogs] = useState([
    { situation: 'Team meeting', emotion: 'Anxious', fluency_felt: 3, date: '2 hours ago' },
    { situation: 'Coffee order', emotion: 'Calm', fluency_felt: 4, date: '1 day ago' },
    { situation: 'Phone call', emotion: 'Nervous', fluency_felt: 2, date: '2 days ago' }
  ])

  const submitLog = (e) => {
    e.preventDefault()
    setLogs(prev => [{ ...logForm, date: 'Just now' }, ...prev])
    setLogForm({ situation: '', emotion: '', fluency_felt: 3, notes: '' })
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-bold">My Progress 📈</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
          Track your fluency journey, anxiety patterns, and confidence growth over time.
        </p>
      </motion.div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Fluency Growth', value: '+30%', sub: 'Since you joined', icon: '📈', color: '#22c55e' },
          { label: 'Anxiety Reduction', value: '-37%', sub: 'vs your baseline', icon: '😌', color: '#7dd3fc' },
          { label: 'Practice Streak', value: '14 days', sub: 'Personal best!', icon: '🔥', color: '#f59e0b' },
          { label: 'Confidence Score', value: '82', sub: 'Up from 52', icon: '⭐', color: '#8b5cf6' }
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }} className="stat-card">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="font-display text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="font-medium text-sm">{s.label}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Fluency over time */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="glass-card p-6">
        <h2 className="font-semibold text-lg mb-1">8-Week Journey</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
          Fluency, anxiety, and confidence trends over time
        </p>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={monthlyData}>
            <defs>
              <linearGradient id="fluencyGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="anxietyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.1)" />
            <XAxis dataKey="week" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="fluency" name="Fluency %" stroke="#8b5cf6" strokeWidth={2}
              fill="url(#fluencyGrad2)" dot={{ r: 3 }} />
            <Area type="monotone" dataKey="anxiety" name="Anxiety %" stroke="#ef4444" strokeWidth={2}
              fill="url(#anxietyGrad)" dot={{ r: 3 }} />
            <Line type="monotone" dataKey="confidence" name="Confidence" stroke="#22c55e" strokeWidth={2}
              dot={{ r: 3 }} strokeDasharray="4 4" />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Situation Analysis */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="glass-card p-6">
          <h2 className="font-semibold text-lg mb-1">Situation Analysis</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            Which contexts trigger your anxiety most?
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={situationData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.1)" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <YAxis dataKey="situation" type="category" tick={{ fontSize: 10 }} width={80} />
              <Tooltip />
              <Bar dataKey="fluency" name="Fluency" fill="#8b5cf6" radius={4} />
              <Bar dataKey="anxiety" name="Anxiety" fill="#f9a8d4" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Practice Heatmap */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="glass-card p-6">
          <h2 className="font-semibold text-lg mb-1">Practice Heatmap</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            Your consistency over the last 8 weeks
          </p>
          <div className="mb-3 flex gap-2">
            {days.map(d => (
              <div key={d} className="w-8 text-center text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{d}</div>
            ))}
          </div>
          <div className="space-y-2">
            {heatmapData.map((week, wi) => (
              <div key={wi} className="flex gap-2">
                {week.map((day, di) => (
                  <div
                    key={di}
                    className="heatmap-cell"
                    style={{ background: getHeatColor(day.fluency), width: 32 }}
                    title={day.practiced ? `Fluency: ${day.fluency}%` : 'No session'}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-4 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>Less</span>
            {['#e5e7eb', '#fbbf24', '#7dd3fc', '#8b5cf6', '#22c55e'].map(c => (
              <div key={c} className="w-4 h-4 rounded-sm" style={{ background: c }} />
            ))}
            <span>More</span>
          </div>
        </motion.div>
      </div>

      {/* Anxiety Trigger Logger */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="glass-card p-6">
        <h2 className="font-semibold text-lg mb-1">Anxiety Trigger Log</h2>
        <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
          Log situations as they happen — the more you log, the better the AI understands your patterns.
        </p>

        <div className="grid lg:grid-cols-2 gap-6">
          <form onSubmit={submitLog} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Situation</label>
              <input className="input-field" placeholder="e.g. Job interview, class presentation, phone call"
                value={logForm.situation} onChange={e => setLogForm(p => ({ ...p, situation: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Emotional State</label>
              <div className="grid grid-cols-3 gap-2">
                {['Calm 😌', 'Anxious 😰', 'Stressed 😤', 'Excited 😊', 'Nervous 🫣', 'Confident 💪'].map(e => (
                  <button key={e} type="button"
                    onClick={() => setLogForm(p => ({ ...p, emotion: e.split(' ')[0] }))}
                    className={`p-2 rounded-xl text-xs border-2 transition-all ${
                      logForm.emotion === e.split(' ')[0] ? 'border-lavender-500 bg-lavender-50' : 'border-transparent'
                    }`}
                    style={{ background: logForm.emotion !== e.split(' ')[0] ? 'rgba(139,92,246,0.04)' : '' }}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Fluency Felt: {['😟', '😐', '🙂', '😊', '😃'][logForm.fluency_felt - 1]} {logForm.fluency_felt}/5
              </label>
              <input type="range" min="1" max="5" value={logForm.fluency_felt}
                onChange={e => setLogForm(p => ({ ...p, fluency_felt: +e.target.value }))}
                className="w-full accent-lavender-500" />
            </div>
            <button type="submit" className="btn-primary w-full py-3">Log Situation</button>
          </form>

          <div>
            <h3 className="font-medium mb-3 text-sm">Recent Logs</h3>
            <div className="space-y-3">
              {logs.slice(0, 4).map((log, i) => (
                <div key={i} className="p-3 rounded-xl text-sm"
                  style={{ background: 'rgba(139,92,246,0.04)' }}>
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">{log.situation}</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{log.date}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="badge badge-purple text-xs">{log.emotion}</span>
                    <span className="badge badge-blue text-xs">Fluency: {log.fluency_felt}/5</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
