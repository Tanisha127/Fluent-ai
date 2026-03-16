import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

const quickActions = [
  { icon: '🎙️', label: 'Analyse speech',    desc: 'Upload or record and get your score', path: '/analysis',  color: '#8b5cf6' },
  { icon: '🗣️', label: 'Roleplay a scene',  desc: 'Interview, phone call, or presentation', path: '/roleplay',  color: '#7dd3fc' },
  { icon: '💊', label: 'Daily exercise',    desc: '5-minute guided practice',              path: '/therapy',   color: '#86efac' },
  { icon: '🧠', label: 'Live coaching',     desc: 'Speak with real-time nudges',           path: '/coaching',  color: '#f9a8d4' }
]

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 text-sm">
        <p className="font-medium mb-0.5">{label}</p>
        <p style={{ color: '#8b5cf6' }}>Fluency: {payload[0]?.value}%</p>
      </div>
    )
  }
  return null
}

const getGreeting = (name) => {
  const h = new Date().getHours()
  const timeGreeting = h < 12 ? 'Morning' : h < 17 ? 'Hey' : 'Evening'
  const greetings = [
    `${timeGreeting}, ${name} 👋`,
    `Good to see you, ${name}`,
    `Welcome back, ${name}`,
    `Hey ${name}, ready to practice?`,
  ]
  const idx = new Date().getDate() % greetings.length
  return greetings[idx]
}

const getStreakMessage = (streak) => {
  if (!streak || streak === 0) return "Start your streak today — even 5 minutes counts."
  if (streak === 1) return "Day 1 done. The hardest part is starting."
  if (streak < 5) return `${streak} days in. You're building something real here.`
  if (streak < 10) return `${streak}-day streak. This is becoming a habit.`
  if (streak < 20) return `${streak} days straight. You're on fire 🔥`
  return `${streak} days. That's not luck — that's commitment.`
}

const getTodayChallenge = (goals) => {
  const challenges = {
    'Job interviews': {
      title: 'Answer out loud',
      desc: 'Pick one common interview question and answer it out loud — just once, no prep.',
      sentence: '"Tell me about a time you solved a difficult problem at work."',
      icon: '💼'
    },
    'Public speaking': {
      title: '60-second talk',
      desc: 'Pick any topic and speak about it for 60 seconds without stopping.',
      sentence: '"The one thing I know more about than most people is..."',
      icon: '🎤'
    },
    'Phone calls': {
      title: 'Phone call warmup',
      desc: 'Practise saying your opening line for a phone call — just the first 2 sentences.',
      sentence: '"Hi, my name is ___ and I\'m calling about..."',
      icon: '📞'
    },
    'Social conversations': {
      title: 'Small talk starter',
      desc: 'Practise starting a conversation naturally — no pressure, just one opener.',
      sentence: '"I\'ve been meaning to ask — how did you get into what you do?"',
      icon: '☕'
    },
    default: {
      title: 'Easy onset practice',
      desc: 'Read this sentence using the lightest possible start on each word — no forcing.',
      sentence: '"Today is a wonderful day to practice speaking with ease and confidence."',
      icon: '🎯'
    }
  }
  const matchedGoal = goals?.find(g => challenges[g])
  return challenges[matchedGoal] || challenges.default
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [weekData, setWeekData] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // ✅ correct endpoint
      const res = await axios.get('/api/progress/summary')
      const s = res.data.summary

      setSummary(s)

      // ✅ Only show chart if there is real data
      if (s?.weekly_data?.length > 0) {
        // Map weekly_data to chart format
        setWeekData(s.weekly_data.map(w => ({
          day: w.week,
          fluency: w.fluency || 0
        })))
      } else if (s?.recent_sessions?.length > 0) {
        // Build from recent sessions — show actual session dots
        const chartData = s.recent_sessions.slice().reverse().map((session, i) => ({
          day: session.date === 'Today' ? 'Today'
            : session.date === 'Yesterday' ? 'Yesterday'
            : session.date,
          fluency: session.fluency || 0
        }))
        setWeekData(chartData)
      } else {
        // ✅ No sessions — show empty chart, not fake data
        setWeekData([])
      }
    } catch {
      // Fallback — only use real user data, no fake numbers
      setSummary(null)
      setWeekData([])
    } finally {
      setLoading(false)
    }
  }

  const firstName = user?.name?.split(' ')[0] || 'there'
  const streak = user?.streak || 0
  const todayChallenge = getTodayChallenge(user?.primary_goals)

  const totalSessions = summary?.total_sessions ?? user?.total_sessions ?? 0
  const avgConfidence = summary?.avg_confidence ?? user?.current_confidence ?? 0
  const weeklyImprovement = summary?.weekly_improvement ?? 0

  const getAchievements = () => {
    const achievements = []

    if (totalSessions >= 1) {
      achievements.push({
        icon: '🌟',
        title: 'First session done',
        desc: 'You pressed record. That takes more courage than most people realise.',
        xp: 50
      })
    }

    if (streak >= 7) {
      achievements.push({
        icon: '🔥',
        title: `${streak} days in a row`,
        desc: 'Consistency matters more than any single session.',
        xp: 100
      })
    } else if (streak >= 3) {
      achievements.push({
        icon: '⚡',
        title: `${streak}-day streak`,
        desc: "You're showing up. Keep this going.",
        xp: 30
      })
    }

    if (avgConfidence > 70) {
      achievements.push({
        icon: '📈',
        title: 'Confidence above 70%',
        desc: 'The work is showing up in the numbers.',
        xp: 75
      })
    }

    if (user?.badges?.includes('first-steps')) {
      achievements.push({
        icon: '👣',
        title: 'First steps',
        desc: 'You took the first step. The rest gets easier.',
        xp: 25
      })
    }

    if (achievements.length === 0) {
      achievements.push({
        icon: '🎯',
        title: 'Account created',
        desc: "You joined. Now let's get to work.",
        xp: 10
      })
    }

    return achievements
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between mb-8"
      >
        <div>
          <h1 className="font-display text-3xl font-bold">
            {getGreeting(firstName)}
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed max-w-md" style={{ color: 'var(--text-muted)' }}>
            {getStreakMessage(streak)}
          </p>
          {user?.stammering_level && (
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span className="text-xs px-2 py-1 rounded-full"
                style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
                {user.stammering_level} level
              </span>
              {user?.primary_goals?.slice(0, 2).map(goal => (
                <span key={goal} className="text-xs px-2 py-1 rounded-full"
                  style={{ background: 'rgba(125,211,252,0.1)', color: '#38bdf8' }}>
                  {goal}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="text-right hidden md:block">
          <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Level {user?.level || 1}</div>
          <div className="badge badge-purple">{user?.xp || 0} XP</div>
        </div>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: 'Confidence score',
            value: avgConfidence > 0 ? avgConfidence : '—',
            suffix: avgConfidence > 0 ? '%' : '',
            icon: '🎯',
            note: avgConfidence > 0 ? 'your score' : 'do a session first',
            noteUp: avgConfidence > 50
          },
          {
            label: 'Sessions done',
            value: totalSessions,
            suffix: '',
            icon: '🎙️',
            note: totalSessions === 0 ? 'start today!' : 'total sessions',
            noteUp: totalSessions > 0
          },
          {
            label: 'Current streak',
            value: streak,
            suffix: streak > 0 ? ' 🔥' : '',
            icon: '',
            note: streak === 0 ? 'start today' : streak >= 7 ? 'on fire!' : 'keep going',
            noteUp: streak > 0
          },
          {
            label: 'Weekly growth',
            value: weeklyImprovement > 0 ? `+${weeklyImprovement}` : '—',
            suffix: weeklyImprovement > 0 ? '%' : '',
            icon: '📈',
            note: weeklyImprovement > 0 ? 'vs last week' : 'do more sessions',
            noteUp: weeklyImprovement > 0
          }
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="stat-card"
          >
            <div className="flex justify-between items-start mb-3">
              <span className="text-2xl">{stat.icon}</span>
              {stat.note && (
                <span className={`text-xs badge ${stat.noteUp ? 'badge-green' : 'badge-purple'}`}>
                  {stat.note}
                </span>
              )}
            </div>
            <div className="font-display text-3xl font-bold tabular-nums">
              {stat.value}<span className="text-lg">{stat.suffix}</span>
            </div>
            <div className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">

        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="glass-card p-6 lg:col-span-2"
        >
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="font-semibold text-lg">Fluency over time</h2>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {weekData.length > 0
                  ? 'Your real fluency scores from sessions'
                  : 'Do your first session to see your chart'}
              </p>
            </div>
            {weeklyImprovement > 0 && (
              <span className="badge badge-green mt-0.5">↑ {weeklyImprovement}% this week</span>
            )}
          </div>

          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : weekData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={weekData}>
                <defs>
                  <linearGradient id="fluencyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.1)" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="transparent" />
                <YAxis tick={{ fontSize: 12 }} stroke="transparent" domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="fluency"
                  stroke="#8b5cf6"
                  strokeWidth={2.5}
                  fill="url(#fluencyGrad)"
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            // ✅ Empty state — no fake data
            <div className="h-48 flex flex-col items-center justify-center gap-3">
              <div className="text-4xl">🎙️</div>
              <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>
                Your fluency chart will appear here after your first session.
              </p>
              <Link to="/analysis" className="btn-primary px-5 py-2 text-sm">
                Start first session →
              </Link>
            </div>
          )}
        </motion.div>

        {/* Today's challenge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26 }}
          className="glass-card p-6 flex flex-col"
        >
          <h2 className="font-semibold text-lg mb-4">Today's challenge</h2>
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <div className="text-4xl mb-3">{todayChallenge.icon}</div>
              <h3 className="font-semibold mb-2">{todayChallenge.title}</h3>
              <p className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {todayChallenge.desc}
              </p>
              <div className="p-3 rounded-xl text-sm italic mb-5 leading-relaxed"
                style={{ background: 'rgba(139, 92, 246, 0.06)', color: 'var(--text-muted)' }}>
                {todayChallenge.sentence}
              </div>
              <Link to="/therapy" className="btn-primary w-full block text-center py-3 text-sm">
                Open challenge
              </Link>
            </div>
            <div className="mt-5 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <div className="flex justify-between text-sm mb-2">
                <span style={{ color: 'var(--text-muted)' }}>Daily XP</span>
                <span className="font-medium tabular-nums">
                  {(user?.xp || 0) % 150} / 150
                </span>
              </div>
              <div className="xp-bar">
                <div className="xp-fill"
                  style={{ width: `${(((user?.xp || 0) % 150) / 150) * 100}%` }} />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-8"
      >
        <h2 className="font-semibold text-lg mb-1">Jump back in</h2>
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
          Pick whatever feels right today.
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map(action => (
            <Link key={action.path} to={action.path}>
              <motion.div
                className="glass-card p-5 cursor-pointer h-full"
                whileHover={{ y: -3, scale: 1.01 }}
                transition={{ duration: 0.18 }}
              >
                <div className="text-2xl mb-3">{action.icon}</div>
                <div className="font-semibold text-sm mb-1">{action.label}</div>
                <div className="text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>
                  {action.desc}
                </div>
                <div className="mt-3 text-xs font-medium" style={{ color: action.color }}>
                  Start →
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Milestones */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.36 }}
        className="glass-card p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Your milestones</h2>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Level {user?.level || 1} • {user?.xp || 0} XP
          </span>
        </div>

        <div className="space-y-3">
          {getAchievements().map((ach, i) => (
            <motion.div
              key={ach.title}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.08 }}
              className="flex items-center gap-4 p-4 rounded-xl"
              style={{ background: 'rgba(139, 92, 246, 0.04)' }}
            >
              <div className="text-2xl">{ach.icon}</div>
              <div className="flex-1">
                <div className="font-medium text-sm">{ach.title}</div>
                <div className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--text-muted)' }}>
                  {ach.desc}
                </div>
              </div>
              <div className="badge badge-purple text-xs">+{ach.xp} XP</div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}