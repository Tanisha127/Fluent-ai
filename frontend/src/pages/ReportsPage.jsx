import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar
} from 'recharts'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const getWeekRange = () => {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const mon = new Date(now.setDate(diff))
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  return `${mon.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${sun.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
}

export default function ReportsPage() {
  const { user } = useAuth()
  const [generating, setGenerating] = useState(false)
  const [current, setCurrent] = useState(null)
  const [pastReports, setPastReports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReportData()
  }, [])

  const loadReportData = async () => {
    try {
      const [currentRes, listRes] = await Promise.all([
        axios.get('/api/reports/current'),
        axios.get('/api/reports/list')
      ])
      setCurrent(currentRes.data.current)
      setPastReports(listRes.data.reports || [])
    } catch (err) {
      console.error('Report load error:', err)
    } finally {
      setLoading(false)
    }
  }

  const generatePDF = async () => {
    setGenerating(true)
    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({})
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `fluent-ai-report-${new Date().toISOString().slice(0, 10)}.pdf`
        a.click()
        window.URL.revokeObjectURL(url)
        toast.success('Report downloaded! 📄')
      } else {
        throw new Error('PDF failed')
      }
    } catch {
      toast.error('PDF generation failed. Try again.')
    } finally {
      setGenerating(false)
    }
  }

  const noData = !current || current.total_sessions === 0

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">Progress Reports 📄</h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
              {noData
                ? 'Complete sessions to generate your first report.'
                : 'Your real data — download and share with your therapist.'}
            </p>
          </div>
          <motion.button
            onClick={generatePDF}
            disabled={generating || noData}
            className="btn-primary px-6 py-3 flex items-center gap-2"
            whileHover={!noData ? { scale: 1.05 } : {}}
            whileTap={!noData ? { scale: 0.95 } : {}}
            style={noData ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          >
            {generating ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : '⬇️ Download PDF'}
          </motion.button>
        </div>
      </motion.div>

      {noData ? (
        // Empty state
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-12 text-center"
        >
          <div className="text-6xl mb-4">📊</div>
          <h2 className="font-display text-2xl font-bold mb-2">No data yet</h2>
          <p className="text-sm max-w-md mx-auto mb-6" style={{ color: 'var(--text-muted)' }}>
            Complete your first speech analysis session and your report will appear here automatically — with real charts, scores, and AI recommendations.
          </p>
          <a href="/analysis" className="btn-primary inline-block px-8 py-3">
            Start first session →
          </a>
        </motion.div>
      ) : (
        <>
          {/* Report preview */}
          <div className="glass-card p-8 mb-6"
            style={{ border: '2px solid rgba(139, 92, 246, 0.2)' }}>

            {/* Header row */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="badge badge-purple mb-2 inline-flex">
                  {getWeekRange()}
                </div>
                <h2 className="font-display text-2xl font-bold">
                  {current.name ? `${current.name.split(' ')[0]}'s Report` : 'Your Report'}
                </h2>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                  {current.total_sessions} sessions completed
                  {current.streak > 0 && ` · ${current.streak}-day streak 🔥`}
                </p>
              </div>
              <div className="text-right">
                <div className="font-display text-5xl font-bold"
                  style={{ color: current.confidence >= 75 ? '#22c55e' : current.confidence >= 50 ? '#f59e0b' : '#8b5cf6' }}>
                  {current.confidence > 0 ? current.confidence : '—'}
                </div>
                <div className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Confidence Score</div>
                {current.improvement > 0 && (
                  <div className="badge badge-green mt-1 inline-flex">+{current.improvement} from baseline</div>
                )}
                {current.improvement < 0 && (
                  <div className="badge badge-purple mt-1 inline-flex">{current.improvement} from baseline</div>
                )}
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                {
                  label: 'Fluency Rate',
                  value: current.fluency > 0 ? `${current.fluency}%` : '—',
                  note: current.fluency >= 75 ? 'great' : current.fluency > 0 ? 'improving' : 'do a session'
                },
                {
                  label: 'Improvement',
                  value: current.improvement > 0
                    ? `+${current.improvement}`
                    : current.improvement < 0 ? `${current.improvement}` : '—',
                  note: current.improvement > 0 ? 'vs baseline' : 'keep going'
                },
                {
                  label: 'Sessions',
                  value: current.sessions > 0 ? current.sessions : '0',
                  note: 'this week'
                },
                {
                  label: 'Current Level',
                  value: `Lv ${current.level}`,
                  note: `${current.xp} XP total`
                }
              ].map((m, i) => (
                <div key={m.label} className="p-4 rounded-xl text-center"
                  style={{ background: 'rgba(139,92,246,0.05)' }}>
                  <div className="font-display text-xl font-bold">{m.value}</div>
                  <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{m.label}</div>
                  <div className="text-xs mt-1 font-medium text-green-500">{m.note}</div>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">

              {/* Fluency line chart */}
              <div>
                <h3 className="font-semibold mb-3 text-sm">Fluency this week</h3>
                {current.weekly_data?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={current.weekly_data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.1)" />
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="fluency" stroke="#8b5cf6" strokeWidth={2.5}
                        dot={{ fill: '#8b5cf6', r: 4 }} name="Fluency %" connectNulls />
                      <Line type="monotone" dataKey="confidence" stroke="#22c55e" strokeWidth={2}
                        dot={{ fill: '#22c55e', r: 3 }} strokeDasharray="4 4" name="Confidence" connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-44 flex items-center justify-center rounded-xl"
                    style={{ background: 'rgba(139,92,246,0.04)' }}>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      No sessions this week yet
                    </p>
                  </div>
                )}
              </div>

              {/* Radar chart */}
              <div>
                <h3 className="font-semibold mb-3 text-sm">
                  Speech profile
                  {current.radar_data?.some(r => r.previous > 0) && (
                    <span className="text-xs ml-2 font-normal" style={{ color: 'var(--text-muted)' }}>
                      vs last week
                    </span>
                  )}
                </h3>
                {current.radar_data?.some(r => r.current > 0) ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <RadarChart data={current.radar_data}>
                      <PolarGrid stroke="rgba(139,92,246,0.2)" />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} />
                      <Radar dataKey="current" name="This week"
                        stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.25} strokeWidth={2} />
                      {current.radar_data.some(r => r.previous > 0) && (
                        <Radar dataKey="previous" name="Last week"
                          stroke="#d1d5db" fill="#d1d5db" fillOpacity={0.1}
                          strokeWidth={1.5} strokeDasharray="4 4" />
                      )}
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-44 flex items-center justify-center rounded-xl"
                    style={{ background: 'rgba(139,92,246,0.04)' }}>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      Complete sessions to see speech profile
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Recommendations */}
            {current.recommendations?.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-3">
                  What to focus on next
                </h3>
                <div className="space-y-2">
                  {current.recommendations.map((r, i) => (
                    <div key={i} className="flex gap-3 p-3 rounded-xl text-sm"
                      style={{ background: 'rgba(134,239,172,0.06)' }}>
                      <span className="text-green-500 flex-shrink-0">→</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Goals */}
            {current.primary_goals?.length > 0 && (
              <div className="mb-6 p-4 rounded-xl"
                style={{ background: 'rgba(139,92,246,0.04)' }}>
                <p className="text-sm font-medium mb-2">Practising for:</p>
                <div className="flex flex-wrap gap-2">
                  {current.primary_goals.map(g => (
                    <span key={g} className="badge badge-purple text-xs">{g}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Motivational quote */}
            <div className="p-5 rounded-xl text-center"
              style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(125,211,252,0.08))' }}>
              <p className="font-display text-base font-medium italic" style={{ color: 'var(--text)' }}>
                {current.improvement > 10
                  ? `"${current.improvement} points of growth. That's what showing up looks like."`
                  : current.sessions > 0
                  ? `"${current.sessions} session${current.sessions > 1 ? 's' : ''} this week. Every one of them matters."`
                  : `"The hardest part is starting. You've already done that."`
                }
              </p>
              <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>— Your FluentAI Coach</p>
            </div>
          </div>

          {/* Past reports */}
          <div className="glass-card p-6">
            <h2 className="font-semibold text-lg mb-1">Past weeks</h2>
            <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
              {pastReports.length > 0
                ? 'Your history — download any week as a PDF.'
                : 'Past reports will appear here as you complete more sessions.'}
            </p>

            {pastReports.length > 0 ? (
              <div className="space-y-3">
                {pastReports.map((r, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between p-4 rounded-xl"
                    style={{ background: 'rgba(139,92,246,0.04)' }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                        style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                        {r.confidence > 0 ? r.confidence : '—'}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{r.week}</div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {r.sessions} session{r.sessions !== 1 ? 's' : ''} ·{' '}
                          {r.fluency > 0 ? `${r.fluency}% fluency · ` : ''}
                          <span className={r.improvement?.startsWith('+') ? 'text-green-500' : ''}>
                            {r.improvement}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => toast.success('Downloading report...')}
                      className="btn-secondary text-xs py-2 px-4"
                    >
                      Download
                    </button>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                <div className="text-3xl mb-2">📅</div>
                <p className="text-sm">Keep practising — your history will build up here week by week.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}