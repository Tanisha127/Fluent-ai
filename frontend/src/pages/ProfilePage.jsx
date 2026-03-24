import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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

const GOALS_OPTIONS = [
  'Job interviews',
  'Public speaking',
  'Social conversations',
  'Phone calls',
  'Class/presentations',
  'General confidence'
]

const STAMMERING_LEVELS = ['Mild', 'Moderate', 'Severe', 'Prefer not to say']

const formatJoinDate = (dateStr) => {
  if (!dateStr) return 'Recently'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

const formatPracticeTime = (minutes) => {
  if (!minutes || minutes === 0) return '0 min'
  if (minutes < 60) return `${minutes} min`
  return `${(minutes / 60).toFixed(1)} hrs`
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const { settings, toggle } = useAccessibility()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    anonymous_name: '',
    age: '',
    stammering_level: '',
    primary_goals: []
  })

  useEffect(() => {
    loadStats()
  }, [])

  // Populate form when user loads
  useEffect(() => {
    if (user) {
      setEditForm({
        name: user.name || '',
        anonymous_name: user.anonymous_name || '',
        age: user.age || '',
        stammering_level: user.stammering_level || 'Moderate',
        primary_goals: user.primary_goals || []
      })
    }
  }, [user])

  const loadStats = async () => {
    try {
      const res = await axios.get('/api/progress/summary')
      setStats(res.data.summary)
    } catch {}
    finally { setLoading(false) }
  }

  const toggleGoal = (goal) => {
    setEditForm(prev => ({
      ...prev,
      primary_goals: prev.primary_goals.includes(goal)
        ? prev.primary_goals.filter(g => g !== goal)
        : [...prev.primary_goals, goal]
    }))
  }

  const handleSave = async () => {
    if (!editForm.name.trim()) {
      toast.error('Name cannot be empty')
      return
    }
    setSaving(true)
    try {
      const res = await axios.patch('/api/users/me', {
        name: editForm.name.trim(),
        anonymous_name: editForm.anonymous_name.trim(),
        age: editForm.age ? parseInt(editForm.age) : undefined,
        stammering_level: editForm.stammering_level,
        primary_goals: editForm.primary_goals
      })

      // Update auth context with new data
      updateUser({
        name: editForm.name.trim(),
        anonymous_name: editForm.anonymous_name.trim(),
        age: editForm.age ? parseInt(editForm.age) : user?.age,
        stammering_level: editForm.stammering_level,
        primary_goals: editForm.primary_goals
      })

      setEditing(false)
      toast.success('Profile updated! ✅')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    // Reset form to current user data
    setEditForm({
      name: user?.name || '',
      anonymous_name: user?.anonymous_name || '',
      age: user?.age || '',
      stammering_level: user?.stammering_level || 'Moderate',
      primary_goals: user?.primary_goals || []
    })
    setEditing(false)
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

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">My Profile 👤</h1>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="btn-secondary px-4 py-2 text-sm flex items-center gap-2"
          >
            ✏️ Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={handleCancel} className="btn-secondary px-4 py-2 text-sm">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary px-4 py-2 text-sm flex items-center gap-2"
            >
              {saving ? (
                <>
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : '✅ Save Changes'}
            </button>
          </div>
        )}
      </motion.div>

      {/* Profile header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #f9a8d4, #8b5cf6)' }}>
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1">
            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                    Full Name
                  </label>
                  <input
                    className="input-field py-2 text-sm"
                    value={editForm.name}
                    onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                    Community Name (shown anonymously)
                  </label>
                  <input
                    className="input-field py-2 text-sm"
                    value={editForm.anonymous_name}
                    onChange={e => setEditForm(p => ({ ...p, anonymous_name: e.target.value }))}
                    placeholder="e.g. SpeakingWarrior"
                  />
                </div>
              </div>
            ) : (
              <>
                <h2 className="font-display text-2xl font-bold">{user?.name || 'Warrior'}</h2>
                <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
                  {user?.email} · Joined {formatJoinDate(user?.created_at || user?.createdAt)}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="badge badge-purple">Level {level} Speaker</span>
                  {streak > 0 && <span className="badge badge-green">🔥 {streak} day streak</span>}
                  {user?.stammering_level && user.stammering_level !== 'Prefer not to say' && (
                    <span className="badge badge-blue">{user.stammering_level} level</span>
                  )}
                  {confidence > 0 && (
                    <span className="badge badge-purple">{confidence}% confidence</span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* XP Progress */}
        <div className="mt-6 p-4 rounded-xl" style={{ background: 'rgba(139,92,246,0.06)' }}>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">Level {level} — {currentXP} XP total</span>
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

      {/* Edit form — personal details */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card p-6 overflow-hidden"
            style={{ border: '2px solid rgba(139,92,246,0.3)' }}
          >
            <h3 className="font-semibold text-lg mb-5">✏️ Edit Your Details</h3>

            <div className="grid md:grid-cols-2 gap-5">
              {/* Age */}
              <div>
                <label className="block text-sm font-medium mb-2">Age</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="e.g. 24"
                  value={editForm.age}
                  onChange={e => setEditForm(p => ({ ...p, age: e.target.value }))}
                  min="5"
                  max="99"
                />
              </div>

              {/* Stammering level */}
              <div>
                <label className="block text-sm font-medium mb-2">Stammering Level</label>
                <div className="grid grid-cols-2 gap-2">
                  {STAMMERING_LEVELS.map(level => (
                    <button
                      key={level}
                      onClick={() => setEditForm(p => ({ ...p, stammering_level: level }))}
                      className={`p-2.5 rounded-xl text-sm border-2 transition-all ${
                        editForm.stammering_level === level
                          ? 'border-lavender-500 bg-lavender-50 text-lavender-700 font-medium'
                          : 'border-gray-200 hover:border-lavender-300'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Goals */}
            <div className="mt-5">
              <label className="block text-sm font-medium mb-3">
                Practice Goals
                <span className="text-xs ml-2 font-normal" style={{ color: 'var(--text-muted)' }}>
                  (select all that apply)
                </span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {GOALS_OPTIONS.map(goal => (
                  <button
                    key={goal}
                    onClick={() => toggleGoal(goal)}
                    className={`p-2.5 rounded-xl text-sm border-2 transition-all text-left ${
                      editForm.primary_goals.includes(goal)
                        ? 'border-lavender-500 bg-lavender-50 text-lavender-700 font-medium'
                        : 'border-gray-200 hover:border-lavender-300'
                    }`}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={handleCancel} className="btn-secondary flex-1 py-3">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary flex-1 py-3"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : 'Save Changes ✅'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Badges */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }} className="glass-card p-6">
          <h3 className="font-semibold text-lg mb-4">Achievement Badges 🏅</h3>
          <div className="grid grid-cols-4 gap-4">
            {ALL_BADGES.map((badge, i) => {
              const earned = earnedBadgeIds.includes(badge.id)
              return (
                <div
                  key={badge.id}
                  className={`text-center transition-all cursor-help ${earned ? '' : 'opacity-30 grayscale'}`}
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
            <p className="text-xs text-center mt-1" style={{ color: 'var(--text-muted)' }}>
              Complete your first session to earn badges!
            </p>
          )}
        </motion.div>

        {/* Goals — view mode or shows edit prompt */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }} className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">My Practice Goals</h3>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="text-xs font-medium"
                style={{ color: '#8b5cf6' }}
              >
                Edit →
              </button>
            )}
          </div>

          {user?.primary_goals?.length > 0 ? (
            <div className="space-y-2">
              {user.primary_goals.map((goal, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(139,92,246,0.05)' }}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                    ✓
                  </div>
                  <span className="text-sm">{goal}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>No goals set yet</p>
              <button onClick={() => setEditing(true)} className="btn-secondary text-xs py-2 px-4">
                Add goals →
              </button>
            </div>
          )}

          <div className="mt-4 pt-4 border-t space-y-1" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Stammering level: <strong>{user?.stammering_level || 'Not set'}</strong>
            </p>
            {user?.age && (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Age: <strong>{user.age}</strong>
              </p>
            )}
            {user?.anonymous_name && (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Community name: <strong>{user.anonymous_name}</strong>
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* All-time stats */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }} className="glass-card p-6">
        <h3 className="font-semibold text-lg mb-4">All-Time Stats</h3>
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Sessions', value: totalSessions > 0 ? totalSessions : '—', icon: '🎙️', sub: totalSessions === 0 ? 'none yet' : 'sessions done' },
              { label: 'Practice Time', value: practiceMinutes > 0 ? formatPracticeTime(practiceMinutes) : '—', icon: '⏱️', sub: practiceMinutes === 0 ? 'no practice yet' : 'total time' },
              { label: 'Confidence', value: confidence > 0 ? `${confidence}%` : '—', icon: '⭐', sub: confidence === 0 ? 'do a session first' : 'current score' },
              { label: 'Current Streak', value: streak > 0 ? `${streak} 🔥` : '0', icon: '📅', sub: streak === 0 ? 'start today' : streak >= 7 ? 'amazing!' : 'keep going' }
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
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }} className="glass-card p-6">
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