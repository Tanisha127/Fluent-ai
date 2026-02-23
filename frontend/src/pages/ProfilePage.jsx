import React from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useAccessibility } from '../context/AccessibilityContext'
import toast from 'react-hot-toast'

const BADGES = [
  { icon: '🌱', title: 'First Steps', desc: 'Completed first analysis', earned: true },
  { icon: '🔥', title: 'On Fire', desc: '7-day streak', earned: true },
  { icon: '🎭', title: 'Actor', desc: 'Completed 5 roleplays', earned: true },
  { icon: '💊', title: 'Dedicated', desc: 'Finished 10 exercises', earned: true },
  { icon: '🏆', title: 'Champion', desc: 'Score 80+ confidence', earned: false },
  { icon: '🌟', title: 'Star', desc: '30-day streak', earned: false },
  { icon: '🦁', title: 'Brave', desc: 'Complete 10 roleplays', earned: false },
  { icon: '💎', title: 'Diamond', desc: 'Reach Level 10', earned: false }
]

export default function ProfilePage() {
  const { user } = useAuth()
  const { settings, toggle } = useAccessibility()

  const xpToNextLevel = 200
  const currentXP = user?.xp || 145
  const level = user?.level || 3

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-bold">My Profile 👤</h1>
      </motion.div>

      {/* Profile header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl text-white"
            style={{ background: 'linear-gradient(135deg, #f9a8d4, #8b5cf6)' }}>
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1">
            <h2 className="font-display text-2xl font-bold">{user?.name || 'Warrior'}</h2>
            <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>
              {user?.email} · Joined January 2026
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="badge badge-purple">Level {level} Speaker</span>
              <span className="badge badge-green">🔥 {user?.streak || 14} day streak</span>
              <span className="badge badge-blue">Stammering: {user?.stammering_level || 'Moderate'}</span>
            </div>
          </div>
        </div>

        {/* XP Progress */}
        <div className="mt-6 p-4 rounded-xl" style={{ background: 'rgba(139,92,246,0.06)' }}>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">Level {level} — {currentXP} XP</span>
            <span style={{ color: 'var(--text-muted)' }}>{xpToNextLevel - currentXP} XP to Level {level + 1}</span>
          </div>
          <div className="xp-bar h-3">
            <motion.div
              className="xp-fill h-3"
              initial={{ width: 0 }}
              animate={{ width: `${(currentXP / xpToNextLevel) * 100}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
          <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            <span>Level {level}</span>
            <span>Level {level + 1}</span>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Badges */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-card p-6">
          <h3 className="font-semibold text-lg mb-4">Achievement Badges 🏅</h3>
          <div className="grid grid-cols-4 gap-4">
            {BADGES.map((badge, i) => (
              <div key={badge.title} className={`text-center transition-all ${badge.earned ? '' : 'opacity-30 grayscale'}`}
                title={`${badge.title}: ${badge.desc}`}>
                <div className={`text-3xl mb-1 ${badge.earned ? 'achievement-pop' : ''}`}
                  style={{ animationDelay: `${i * 0.1}s` }}>
                  {badge.icon}
                </div>
                <div className="text-xs font-medium truncate">{badge.title}</div>
              </div>
            ))}
          </div>
          <p className="text-xs mt-4 text-center" style={{ color: 'var(--text-muted)' }}>
            {BADGES.filter(b => b.earned).length}/{BADGES.length} badges earned
          </p>
        </motion.div>

        {/* Goals */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="glass-card p-6">
          <h3 className="font-semibold text-lg mb-4">My Practice Goals</h3>
          <div className="space-y-3">
            {(user?.primary_goals || ['Job interviews', 'Phone calls', 'Public speaking']).map((goal, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: 'rgba(139,92,246,0.05)' }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                  style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>✓</div>
                <span className="text-sm">{goal}</span>
              </div>
            ))}
          </div>
          <button onClick={() => toast.success('Goal settings opening soon!')}
            className="btn-secondary w-full mt-4 py-2 text-sm">
            Update Goals
          </button>
        </motion.div>
      </div>

      {/* Accessibility Settings */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="glass-card p-6">
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
            <div key={setting.key} className="flex items-center justify-between p-4 rounded-xl"
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

      {/* Stats summary */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="glass-card p-6">
        <h3 className="font-semibold text-lg mb-4">All-Time Stats</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Sessions', value: '47', icon: '🎙️' },
            { label: 'Total Practice Time', value: '8.4 hrs', icon: '⏱️' },
            { label: 'Exercises Complete', value: '23', icon: '💊' },
            { label: 'Roleplay Sessions', value: '12', icon: '🎭' }
          ].map(s => (
            <div key={s.label} className="text-center p-4 rounded-xl"
              style={{ background: 'rgba(139,92,246,0.04)' }}>
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="font-display text-xl font-bold">{s.value}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
