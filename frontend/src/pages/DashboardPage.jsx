import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'
import { useAuth } from '../context/AuthContext'


const weekData = [
  { day: 'Mon', fluency: 58 },
  { day: 'Tue', fluency: 62 },
  { day: 'Wed', fluency: 70 },
  { day: 'Thu', fluency: 65 },
  { day: 'Fri', fluency: 74 },
  { day: 'Sat', fluency: 78 },
  { day: 'Sun', fluency: 82 }
]

const quickActions = [
  { icon: '🎙️', label: 'Analyse speech',    desc: 'Upload or record and get your score', path: '/analysis',  color: '#8b5cf6' },
  { icon: '🗣️', label: 'Roleplay a scene',  desc: 'Interview, phone call, or presentation', path: '/roleplay',  color: '#7dd3fc' },
  { icon: '💊', label: 'Daily exercise',    desc: '5-minute guided practice',              path: '/therapy',   color: '#86efac' },
  { icon: '🧠', label: 'Live coaching',     desc: 'Speak with real-time nudges',           path: '/coaching',  color: '#f9a8d4' }
]

const recentAchievements = [
  { icon: '🌟', title: 'First recording',      desc: 'You pressed record. That takes courage.',           xp: 50  },
  { icon: '🔥', title: '7 days in a row',      desc: 'Consistency matters more than any single session.', xp: 100 },
  { icon: '📈', title: 'Fluency up by 20%',    desc: 'The work is showing up in the numbers.',            xp: 75  }
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

export default function DashboardPage() {
  const { user } = useAuth()
  const stats = { totalSessions: 24, avgConfidence: 74, streak: 7, weeklyImprovement: 12 }

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const firstName = user?.name?.split(' ')[0] || 'there'

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
            {greeting()}, {firstName}
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed max-w-md" style={{ color: 'var(--text-muted)' }}>
            You're on a{' '}
            <strong className="text-lavender-600">{user?.streak || 7}-day streak.</strong>{' '}
            That's not nothing — keep showing up.
          </p>
        </div>
        <div className="text-right hidden md:block">
          <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Today's target</div>
          <div className="badge badge-purple">1 session left</div>
        </div>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Confidence score',  value: stats.avgConfidence, suffix: '%',  icon: '🎯', note: '+8% this week',     noteUp: true  },
          { label: 'Sessions done',     value: stats.totalSessions, suffix: '',   icon: '🎙️', note: '+3 this week',      noteUp: true  },
          { label: 'Current streak',    value: user?.streak || 7,   suffix: ' 🔥', icon: '',  note: 'Best run: 14 days', noteUp: null  },
          { label: 'Weekly growth',     value: `+${stats.weeklyImprovement}`, suffix: '%', icon: '📈', note: 'vs. last week', noteUp: true }
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
                  {stat.noteUp ? '↑ ' : ''}{stat.note}
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
              <h2 className="font-semibold text-lg">Fluency this week</h2>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                The trend is upward — even with the dip on Thursday.
              </p>
            </div>
            <span className="badge badge-green mt-0.5">↑ 12% vs last week</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={weekData}>
              <defs>
                <linearGradient id="fluencyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}    />
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
                strokeWidth={2.5}
                fill="url(#fluencyGrad)"
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Daily challenge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26 }}
          className="glass-card p-6 flex flex-col"
        >
          <h2 className="font-semibold text-lg mb-4">Today's challenge</h2>
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <div className="text-4xl mb-3">🎯</div>
              <h3 className="font-semibold mb-2">Easy onset practice</h3>
              <p className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Read this sentence using the lightest possible start on each word — no forcing.
              </p>
              <div
                className="p-3 rounded-xl text-sm italic mb-5 leading-relaxed"
                style={{ background: 'rgba(139, 92, 246, 0.06)', color: 'var(--text-muted)' }}
              >
                "Today is a wonderful day to practice speaking with ease and confidence."
              </div>
              <Link to="/therapy" className="btn-primary w-full block text-center py-3 text-sm">
                Open challenge
              </Link>
            </div>
            <div className="mt-5 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <div className="flex justify-between text-sm mb-2">
                <span style={{ color: 'var(--text-muted)' }}>Daily XP</span>
                <span className="font-medium tabular-nums">80 / 150</span>
              </div>
              <div className="xp-bar">
                <div className="xp-fill" style={{ width: '53%' }} />
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
        <h2 className="font-semibold text-lg mb-4">Jump back in</h2>
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

      {/* Achievements */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.36 }}
        className="glass-card p-6"
      >
        <h2 className="font-semibold text-lg mb-4">Recent milestones</h2>
        <div className="space-y-3">
          {recentAchievements.map(ach => (
            <div
              key={ach.title}
              className="flex items-center gap-4 p-4 rounded-xl"
              style={{ background: 'rgba(139, 92, 246, 0.04)' }}
            >
              <div className="text-2xl achievement-pop">{ach.icon}</div>
              <div className="flex-1">
                <div className="font-medium text-sm">{ach.title}</div>
                <div className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--text-muted)' }}>
                  {ach.desc}
                </div>
              </div>
              <div className="badge badge-purple text-xs">+{ach.xp} XP</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}