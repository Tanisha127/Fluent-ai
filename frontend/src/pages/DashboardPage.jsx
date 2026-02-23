import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area
} from 'recharts'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

const weekData = [
  { day: 'Mon', fluency: 58, sessions: 2 },
  { day: 'Tue', fluency: 62, sessions: 3 },
  { day: 'Wed', fluency: 70, sessions: 2 },
  { day: 'Thu', fluency: 65, sessions: 4 },
  { day: 'Fri', fluency: 74, sessions: 3 },
  { day: 'Sat', fluency: 78, sessions: 2 },
  { day: 'Sun', fluency: 82, sessions: 1 }
]

const quickActions = [
  { icon: '🎙️', label: 'Analyze Speech', desc: 'Get your confidence score', path: '/analysis', color: '#8b5cf6' },
  { icon: '🎭', label: 'Start Roleplay', desc: 'Practice an interview', path: '/roleplay', color: '#7dd3fc' },
  { icon: '💊', label: 'Daily Exercise', desc: '5-min therapy plan', path: '/therapy', color: '#86efac' },
  { icon: '🧠', label: 'Live Coaching', desc: 'Real-time feedback', path: '/coaching', color: '#f9a8d4' }
]

const recentAchievements = [
  { icon: '🌟', title: 'First Recording', desc: 'Completed your first speech analysis', xp: 50 },
  { icon: '🔥', title: '7-Day Streak', desc: 'Practiced 7 days in a row', xp: 100 },
  { icon: '📈', title: 'Rising Confidence', desc: 'Fluency score improved by 20%', xp: 75 }
]

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 text-sm">
        <p className="font-medium mb-1">{label}</p>
        <p style={{ color: '#8b5cf6' }}>Fluency: {payload[0]?.value}%</p>
      </div>
    )
  }
  return null
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalSessions: 24,
    avgConfidence: 74,
    streak: 7,
    weeklyImprovement: 12
  })

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between mb-8"
      >
        <div>
          <h1 className="font-display text-3xl font-bold">
            {greeting()}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            You've been on a <strong className="text-lavender-600">{user?.streak || 7}-day streak</strong>. Keep going — you're making real progress!
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Today's Goal</div>
          <div className="badge badge-purple">1 Session Remaining</div>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Confidence Score', value: `${stats.avgConfidence}`, suffix: '%', icon: '🎯', trend: '+8%', up: true },
          { label: 'Total Sessions', value: stats.totalSessions, suffix: '', icon: '🎙️', trend: '+3 this week', up: true },
          { label: 'Day Streak', value: user?.streak || 7, suffix: '🔥', icon: '', trend: 'Best: 14', up: null },
          { label: 'Weekly Growth', value: `+${stats.weeklyImprovement}`, suffix: '%', icon: '📈', trend: 'vs last week', up: true }
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="stat-card"
          >
            <div className="flex justify-between items-start mb-3">
              <span className="text-2xl">{stat.icon}</span>
              {stat.trend && (
                <span className={`text-xs badge ${stat.up ? 'badge-green' : 'badge-purple'}`}>
                  {stat.up ? '↑' : ''} {stat.trend}
                </span>
              )}
            </div>
            <div className="font-display text-3xl font-bold">
              {stat.value}<span className="text-lg">{stat.suffix}</span>
            </div>
            <div className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Fluency Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold text-lg">Fluency This Week</h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Your confidence is trending up!</p>
            </div>
            <span className="badge badge-green">↑ 12% from last week</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={weekData}>
              <defs>
                <linearGradient id="fluencyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.1)" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="transparent" />
              <YAxis tick={{ fontSize: 12 }} stroke="transparent" domain={[40, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="fluency"
                stroke="#8b5cf6"
                strokeWidth={3}
                fill="url(#fluencyGrad)"
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Daily challenge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <h2 className="font-semibold text-lg mb-4">Daily Challenge</h2>
          <div className="text-center py-4">
            <div className="text-5xl mb-3">🎯</div>
            <h3 className="font-semibold mb-2">Easy Onset Practice</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              Read the provided paragraph using soft, gentle voice onset on each word.
            </p>
            <div className="p-3 rounded-xl text-sm italic mb-4"
              style={{ background: 'rgba(139, 92, 246, 0.06)', color: 'var(--text-muted)' }}>
              "Today is a wonderful day to practice speaking with ease and confidence."
            </div>
            <Link to="/therapy" className="btn-primary w-full block text-center py-3">
              Start Challenge 🚀
            </Link>
          </div>
          <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="flex justify-between text-sm mb-2">
              <span style={{ color: 'var(--text-muted)' }}>Daily XP Progress</span>
              <span className="font-medium">80 / 150 XP</span>
            </div>
            <div className="xp-bar">
              <div className="xp-fill" style={{ width: '53%' }} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mb-8"
      >
        <h2 className="font-semibold text-lg mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, i) => (
            <Link key={action.path} to={action.path}>
              <motion.div
                className="glass-card p-5 cursor-pointer"
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-3xl mb-3">{action.icon}</div>
                <div className="font-semibold text-sm">{action.label}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{action.desc}</div>
                <div className="mt-3 flex items-center text-xs font-medium" style={{ color: action.color }}>
                  Start now →
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Recent Achievements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-6"
      >
        <h2 className="font-semibold text-lg mb-4">Recent Achievements 🏆</h2>
        <div className="space-y-3">
          {recentAchievements.map((ach, i) => (
            <div key={ach.title} className="flex items-center gap-4 p-4 rounded-xl"
              style={{ background: 'rgba(139, 92, 246, 0.04)' }}>
              <div className="text-3xl achievement-pop">{ach.icon}</div>
              <div className="flex-1">
                <div className="font-medium">{ach.title}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{ach.desc}</div>
              </div>
              <div className="badge badge-purple">+{ach.xp} XP</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
