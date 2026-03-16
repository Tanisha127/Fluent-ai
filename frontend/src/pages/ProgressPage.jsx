import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, AreaChart, Area, Legend
} from 'recharts'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

const getHeatColor = (fluency) => {
  if (!fluency) return '#e5e7eb'
  if (fluency >= 80) return '#22c55e'
  if (fluency >= 65) return '#8b5cf6'
  if (fluency >= 50) return '#7dd3fc'
  return '#fbbf24'
}

const EmptyState = ({ message }) => (
  <div className="flex flex-col items-center justify-center h-40 text-center">
    <div className="text-3xl mb-2">📊</div>
    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{message}</p>
  </div>
)

export default function ProgressPage() {
  const { user } = useAuth()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [logForm, setLogForm] = useState({
    situation: '', emotion: '', fluency_felt: 3, notes: ''
  })
  const [logs, setLogs] = useState([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadSummary()
  }, [])

  const loadSummary = async () => {
    try {
      const res = await axios.get('/api/progress/summary')
      setSummary(res.data.summary)

      // Build logs from recent sessions
      if (res.data.summary?.recent_sessions?.length > 0) {
        setLogs(res.data.summary.recent_sessions.map(s => ({
          situation: s.type === 'roleplay' ? 'Roleplay session'
            : s.type === 'coaching' ? 'Live coaching'
            : 'Speech analysis',
          emotion: s.confidence > 70 ? 'Confident' : s.confidence > 50 ? 'Calm' : 'Anxious',
          fluency_felt: Math.round(s.fluency / 20),
          date: s.date
        })))
      }
    } catch (err) {
      console.error('Progress load error:', err)
    } finally {
      setLoading(false)
    }
  }

  const submitLog = async (e) => {
    e.preventDefault()
    if (!logForm.situation.trim()) {
      toast.error('Please enter a situation')
      return
    }
    setSubmitting(true)
    try {
      await axios.post('/api/progress/log-situation', logForm)
      setLogs(prev => [{ ...logForm, date: 'Just now' }, ...prev])
      setLogForm({ situation: '', emotion: '', fluency_felt: 3, notes: '' })
      toast.success('Situation logged! 📝')
      // Reload summary to update stats
      loadSummary()
    } catch {
      toast.error('Failed to save log')
    } finally {
      setSubmitting(false)
    }
  }

  // Stats cards — real data with fallbacks
  const statCards = summary ? [
    {
      label: 'Fluency Growth',
      value: summary.fluency_growth > 0
        ? `+${summary.fluency_growth}%`
        : summary.total_sessions === 0 ? '—' : `${summary.fluency_growth}%`,
      sub: summary.total_sessions === 0
        ? 'Do your first session'
        : `Across ${summary.total_sessions} sessions`,
      icon: '📈',
      color: '#22c55e'
    },
    {
      label: 'Confidence Score',
      value: summary.avg_confidence > 0 ? summary.avg_confidence : '—',
      sub: summary.baseline_confidence > 0
        ? `Up from ${summary.baseline_confidence} baseline`
        : 'Complete a session to see',
      icon: '⭐',
      color: '#8b5cf6'
    },
    {
      label: 'Practice Streak',
      value: summary.streak > 0 ? `${summary.streak} days` : '0 days',
      sub: summary.streak >= 7 ? 'Personal best!' : 'Practice daily to build streak',
      icon: '🔥',
      color: '#f59e0b'
    },
    {
      label: 'Practice Time',
      value: summary.total_practice_minutes > 0
        ? `${summary.total_practice_minutes}m`
        : '—',
      sub: summary.total_sessions > 0
        ? `${summary.total_sessions} sessions total`
        : 'No sessions yet',
      icon: '⏱️',
      color: '#7dd3fc'
    }
  ] : []

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  const hasData = summary && summary.total_sessions > 0
  const weeklyData = summary?.weekly_data || []
  const situationData = summary?.situation_data || []
  const heatmap = summary?.heatmap || []

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-bold">My Progress 📈</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
          {hasData
            ? `${summary.total_sessions} sessions completed — here's what the data says.`
            : 'Complete your first session to start tracking your progress.'}
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <motion.div key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="stat-card">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="font-display text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="font-medium text-sm">{s.label}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Weekly trend chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6"
      >
        <h2 className="font-semibold text-lg mb-1">Your Journey</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
          Fluency, anxiety, and confidence trends over time
        </p>

        {weeklyData.length > 1 ? (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={weeklyData}>
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
              <Area type="monotone" dataKey="fluency" name="Fluency %"
                stroke="#8b5cf6" strokeWidth={2} fill="url(#fluencyGrad2)" dot={{ r: 3 }} />
              <Area type="monotone" dataKey="anxiety" name="Anxiety %"
                stroke="#ef4444" strokeWidth={2} fill="url(#anxietyGrad)" dot={{ r: 3 }} />
              <Line type="monotone" dataKey="confidence" name="Confidence"
                stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 4" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState message="Do at least 2 sessions across different days to see your trend" />
        )}
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Situation Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <h2 className="font-semibold text-lg mb-1">Situation Analysis</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            Which practice types are working best?
          </p>

          {situationData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={situationData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.1)" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis dataKey="situation" type="category" tick={{ fontSize: 10 }} width={90} />
                <Tooltip />
                <Bar dataKey="fluency" name="Fluency" fill="#8b5cf6" radius={4} />
                <Bar dataKey="anxiety" name="Anxiety" fill="#f9a8d4" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="Try different session types to see situation analysis" />
          )}
        </motion.div>

        {/* Practice Heatmap */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass-card p-6"
        >
          <h2 className="font-semibold text-lg mb-1">Practice Heatmap</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            Your consistency over the last 8 weeks
          </p>

          {heatmap.length > 0 ? (
            <>
              <div className="mb-3 flex gap-2">
                {days.map((d, i) => (
                  <div key={i} className="w-8 text-center text-xs font-medium"
                    style={{ color: 'var(--text-muted)' }}>{d}</div>
                ))}
              </div>
              <div className="space-y-2">
                {heatmap.map((week, wi) => (
                  <div key={wi} className="flex gap-2">
                    {week.map((day, di) => (
                      <div
                        key={di}
                        className="heatmap-cell"
                        style={{ background: getHeatColor(day.fluency), width: 32 }}
                        title={day.practiced
                          ? `Fluency: ${day.fluency}% — ${day.date}`
                          : `No session — ${day.date}`}
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
            </>
          ) : (
            <EmptyState message="Start practicing to fill your heatmap" />
          )}
        </motion.div>
      </div>

      {/* Recent sessions */}
      {summary?.recent_sessions?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
          className="glass-card p-6"
        >
          <h2 className="font-semibold text-lg mb-4">Recent Sessions</h2>
          <div className="space-y-3">
            {summary.recent_sessions.map((s, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl"
                style={{ background: 'rgba(139,92,246,0.04)' }}>
                <div className="text-xl">
                  {s.type === 'roleplay' ? '🗣️' : s.type === 'coaching' ? '🧠' : '🎙️'}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium capitalize">{s.type} session</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.date}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold" style={{ color: '#8b5cf6' }}>
                    {s.fluency}% fluency
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {s.confidence}% confidence
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Anxiety Trigger Logger */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-6"
      >
        <h2 className="font-semibold text-lg mb-1">Anxiety Trigger Log</h2>
        <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
          Log situations as they happen — the more you log, the better the AI understands your patterns.
        </p>

        <div className="grid lg:grid-cols-2 gap-6">
          <form onSubmit={submitLog} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Situation</label>
              <input
                className="input-field"
                placeholder="e.g. Job interview, class presentation, phone call"
                value={logForm.situation}
                onChange={e => setLogForm(p => ({ ...p, situation: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Emotional State</label>
              <div className="grid grid-cols-3 gap-2">
                {['Calm 😌', 'Anxious 😰', 'Stressed 😤', 'Excited 😊', 'Nervous 🫣', 'Confident 💪'].map(e => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setLogForm(p => ({ ...p, emotion: e.split(' ')[0] }))}
                    className={`p-2 rounded-xl text-xs border-2 transition-all ${
                      logForm.emotion === e.split(' ')[0]
                        ? 'border-lavender-500 bg-lavender-50'
                        : 'border-transparent'
                    }`}
                    style={{
                      background: logForm.emotion !== e.split(' ')[0]
                        ? 'rgba(139,92,246,0.04)' : ''
                    }}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Fluency Felt: {['😟', '😐', '🙂', '😊', '😃'][logForm.fluency_felt - 1]} {logForm.fluency_felt}/5
              </label>
              <input
                type="range" min="1" max="5"
                value={logForm.fluency_felt}
                onChange={e => setLogForm(p => ({ ...p, fluency_felt: +e.target.value }))}
                className="w-full accent-lavender-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Notes (optional)</label>
              <input
                className="input-field"
                placeholder="Anything specific that happened?"
                value={logForm.notes}
                onChange={e => setLogForm(p => ({ ...p, notes: e.target.value }))}
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full py-3"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </span>
              ) : 'Log Situation'}
            </button>
          </form>

          <div>
            <h3 className="font-medium mb-3 text-sm">Recent Logs</h3>
            {logs.length > 0 ? (
              <div className="space-y-3">
                {logs.slice(0, 5).map((log, i) => (
                  <div key={i} className="p-3 rounded-xl text-sm"
                    style={{ background: 'rgba(139,92,246,0.04)' }}>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">{log.situation}</span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{log.date}</span>
                    </div>
                    <div className="flex gap-2">
                      {log.emotion && (
                        <span className="badge badge-purple text-xs">{log.emotion}</span>
                      )}
                      <span className="badge badge-blue text-xs">
                        Fluency: {log.fluency_felt}/5
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                <div className="text-2xl mb-2">📝</div>
                <p className="text-sm">No logs yet — add your first situation above</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}