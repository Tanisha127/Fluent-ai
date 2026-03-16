import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useAccessibility } from '../context/AccessibilityContext'
import axios from 'axios'
import toast from 'react-hot-toast'

const ALL_BADGES = [
  { id: 'first-steps', icon: '🌱', title: 'First Steps', desc: 'Completed first analysis' },
  { id: 'on-fire', icon: '🔥', title: 'On Fire', desc: '7-day streak' },
  { id: 'actor', icon: '🗣️', title: 'Actor', desc: 'Completed 5 roleplays' },
  { id: 'dedicated', icon: '💊', title: 'Dedicated', desc: 'Finished 10 exercises' },
  { id: 'confident', icon: '🏆', title: 'Champion', desc: 'Score 80+ confidence' },
  { id: 'star', icon: '🌟', title: 'Star', desc: '30-day streak' },
  { id: 'brave', icon: '🦁', title: 'Brave', desc: 'Complete 10 roleplays' },
  { id: 'diamond', icon: '💎', title: 'Diamond', desc: 'Reach Level 10' }
]

const formatJoinDate = (dateStr) => {
  if (!dateStr) return 'Recently'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

const formatPracticeTime = (minutes) => {
  if (!minutes || minutes === 0) return '0 min'
  if (minutes < 60) return `${minutes} min`
  const hrs = (minutes / 60).toFixed(1)
  return `${hrs} hrs`
}

export default function ProfilePage() {
  const { user } = useAuth()
  const { settings, toggle } = useAccessibility()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const res = await axios.get('/api/progress/summary')
      setStats(res.data.summary)
    } catch {
      // fallback to user object data
    } finally {
      setLoading(false)
    }
  }

  const xpToNextLevel = 200
  const currentXP = user?.xp || 0
  const xpInCurrentLevel = currentXP % xpToNextLevel
  const level = user?.level || 1
  const earnedBadgeIds = user?.badges || []

  const totalSessions = stats?.total_sessions || user?.total_sessions || 0
  const practiceMinutes = stats?.total_practice_minutes || user?.total_practice_minutes || 0
  const confidence = stats?.avg_confidence || user?.current_confidence || 0
  const streak = user?.streak || 0

  // Roleplay sessions from stats
  const roleplaySessions = stats?.situation_data?.find(s =>
    s.situation?.toLowerCase().includes('roleplay')
  )?.count || 0

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-bold">My Profile 👤</h1>
      </motion.div>

      {/* Profile header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8"
      >
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #f9a8d4, #8b5cf6)' }}>
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1">
            <h2 className="font-display text-2xl font-bold">{user?.name || 'Warrior'}</h2>
            <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
              {user?.email} · Joined {formatJoinDate(user?.created_at || user?.createdAt)}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="badge badge-purple">Level {level} Speaker</span>
              {streak > 0 && (
                <span className="badge badge-green">🔥 {streak} day streak</span>
              )}
              {user?.stammering_level && user.stammering_level !== 'Prefer not to say' && (
                <span className="badge badge-blue">{user.stammering_level} level</span>
              )}
              {confidence > 0 && (
                <span className="badge badge-purple">{confidence}% confidence</span>
              )}
            </div>
          </div>
        </div>

        {/* XP Progress */}
        <div className="mt-6 p-4 rounded-xl" style={{ background: 'rgba(139,92,246,0.06)' }}>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">
              Level {level} — {currentXP} XP total
            </span>
            <span style={{ color: 'var(--text-muted)' }}>
              {xpToNextLevel - xpInCurrentLevel} XP to Level {level + 1}
            </span>
          </div>
          <div className="xp-bar h-3">
            <motion.div
              className="xp-fill h-3"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (xpInCurrentLevel / xpToNextLevel) * 100)}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
          <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            <span>Level {level}</span>
            <span>{xpInCurrentLevel}/{xpToNextLevel} XP</span>
            <span>Level {level + 1}</span>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Badges — real earned badges from user.badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <h3 className="font-semibold text-lg mb-4">Achievement Badges 🏅</h3>
          <div className="grid grid-cols-4 gap-4">
            {ALL_BADGES.map((badge, i) => {
              const earned = earnedBadgeIds.includes(badge.id)
              return (
                <div
                  key={badge.id}
                  className={`text-center transition-all ${earned ? '' : 'opacity-30 grayscale'}`}
                  title={`${badge.title}: ${badge.desc}${earned ? ' ✅' : ' (locked)'}`}
                >
                  <div className={`text-3xl mb-1 ${earned ? 'achievement-pop' : ''}`}
                    style={{ animationDelay: `${i * 0.1}s` }}>
                    {badge.icon}
                  </div>
                  <div className="text-xs font-medium truncate">{badge.title}</div>
                </div>
              )
            })}
          </div>
          <p className="text-xs mt-4 text-center" style={{ color: 'var(--text-muted)' }}>
            {earnedBadgeIds.length}/{ALL_BADGES.length} badges earned
          </p>

          {earnedBadgeIds.length === 0 && (
            <p className="text-xs text-center mt-2" style={{ color: 'var(--text-muted)' }}>
              Complete your first session to earn badges!
            </p>
          )}
        </motion.div>

        {/* Goals — real from user profile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card p-6"
        >
          <h3 className="font-semibold text-lg mb-4">My Practice Goals</h3>

          {user?.primary_goals?.length > 0 ? (
            <div className="space-y-3">
              {user.primary_goals.map((goal, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(139,92,246,0.05)' }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                    ✓
                  </div>
                  <span className="text-sm">{goal}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6" style={{ color: 'var(--text-muted)' }}>
              <p className="text-sm">No goals set yet</p>
            </div>
          )}

          <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Stammering level: <strong>{user?.stammering_level || 'Not set'}</strong>
            </p>
            {user?.age && (
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Age: <strong>{user.age}</strong>
              </p>
            )}
            {user?.anonymous_name && (
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Community name: <strong>{user.anonymous_name}</strong>
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* All-time stats — real data */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6"
      >
        <h3 className="font-semibold text-lg mb-4">All-Time Stats</h3>
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: 'Total Sessions',
                value: totalSessions > 0 ? totalSessions : '—',
                icon: '🎙️',
                sub: totalSessions === 0 ? 'none yet' : `sessions done`
              },
              {
                label: 'Practice Time',
                value: practiceMinutes > 0 ? formatPracticeTime(practiceMinutes) : '—',
                icon: '⏱️',
                sub: practiceMinutes === 0 ? 'no practice yet' : 'total time'
              },
              {
                label: 'Confidence',
                value: confidence > 0 ? `${confidence}%` : '—',
                icon: '⭐',
                sub: confidence === 0 ? 'do a session first' : 'current score'
              },
              {
                label: 'Current Streak',
                value: streak > 0 ? `${streak} 🔥` : '0',
                icon: '📅',
                sub: streak === 0 ? 'start today' : streak >= 7 ? 'amazing!' : 'keep going'
              }
            ].map(s => (
              <div key={s.label} className="text-center p-4 rounded-xl"
                style={{ background: 'rgba(139,92,246,0.04)' }}>
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="font-display text-xl font-bold">{s.value}</div>
                <div className="text-xs font-medium">{s.label}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.sub}</div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Accessibility Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass-card p-6"
      >
        <h3 className="font-semibold text-lg mb-2">♿ Accessibility Settings</h3>
        <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
          Customize FluentAI to work best for you.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { key: 'darkMode', label: 'Dark Mode', desc: 'Easier on the eyes at night', icon: '🌙' },
            { key: 'largeText', label: 'Large Text', desc: '120% font size throughout', icon: '🔡' },
            { key: 'dyslexicFont', label: 'Dyslexia-Friendly Font', desc: 'OpenDyslexic typeface', icon: '📖' },
            { key: 'highContrast', label: 'High Contrast', desc: 'Better visibility for all', icon: '🔲' },
            { key: 'reducedMotion', label: 'Reduce Motion', desc: 'Less animation for sensory sensitivity', icon: '⚡' }
          ].map(setting => (
            <div key={setting.key}
              className="flex items-center justify-between p-4 rounded-xl"
              style={{ background: 'rgba(139,92,246,0.04)' }}>
              <div className="flex items-center gap-3">
                <span className="text-xl">{setting.icon}</span>
                <div>
                  <div className="font-medium text-sm">{setting.label}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{setting.desc}</div>
                </div>
              </div>
              <button
                onClick={() => toggle(setting.key)}
                className={`w-12 h-6 rounded-full transition-all duration-300 relative flex-shrink-0 ${
                  settings[setting.key] ? 'bg-lavender-500' : 'bg-gray-200'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow absolute top-0.5 transition-all duration-300 ${
                  settings[setting.key] ? 'left-6' : 'left-0.5'
                }`} />
              </button>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}