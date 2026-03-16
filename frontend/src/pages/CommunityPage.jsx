import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

const ROOMS = [
  { id: 'victories', name: 'Victory Room', desc: 'Share what went well, big or small', emoji: '🏆' },
  { id: 'interviews', name: 'Interview Prep', desc: 'Practise for real conversations', emoji: '💼' },
  { id: 'daily', name: 'Daily Check-in', desc: 'How are you finding today?', emoji: '☀️' },
  { id: 'techniques', name: 'Technique Talk', desc: "What's actually working for you?", emoji: '🧠' },
  { id: 'harddays', name: 'Hard Days', desc: 'No performance needed. Just honest sharing.', emoji: '🫂' }
]

const ROOM_MAP = Object.fromEntries(ROOMS.map(r => [r.id, r]))

const formatTime = (date) => {
  const d = new Date(date)
  const now = new Date()
  const diff = Math.floor((now - d) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const getRankEmoji = (rank) => {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return `#${rank}`
}

export default function CommunityPage() {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [stats, setStats] = useState(null)
  const [newPost, setNewPost] = useState('')
  const [selectedRoom, setSelectedRoom] = useState('daily')
  const [activeRoom, setActiveRoom] = useState('all')
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [activeTab, setActiveTab] = useState('feed') // feed | leaderboard

  useEffect(() => {
    loadData()
  }, [activeRoom])

  const loadData = async () => {
    try {
      const [postsRes, leaderboardRes, statsRes] = await Promise.all([
        axios.get(`/api/community/posts${activeRoom !== 'all' ? `?room=${activeRoom}` : ''}`),
        axios.get('/api/community/leaderboard'),
        axios.get('/api/community/stats')
      ])
      setPosts(postsRes.data.posts || [])
      setLeaderboard(leaderboardRes.data.leaderboard || [])
      setStats(statsRes.data.stats)
    } catch (err) {
      console.error('Community load error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async (id) => {
    // Optimistic update
    setPosts(prev => prev.map(p =>
      p._id === id
        ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
        : p
    ))
    try {
      const res = await axios.post(`/api/community/posts/${id}/like`)
      setPosts(prev => prev.map(p =>
        p._id === id ? { ...p, likes: res.data.likes, liked: res.data.liked } : p
      ))
    } catch {}
  }

  const handlePost = async () => {
    if (!newPost.trim()) return
    setPosting(true)
    try {
      const res = await axios.post('/api/community/posts', {
        content: newPost.trim(),
        room: selectedRoom
      })
      setPosts(prev => [res.data.post, ...prev])
      setNewPost('')
      if (res.data.xp_earned) {
        toast.success(`Posted! +${res.data.xp_earned} XP earned 🌱`)
      } else {
        toast.success('Shared. Someone out there needed to read that.')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post')
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="font-display text-3xl font-bold">Community</h1>
        <p className="mt-1.5 text-sm leading-relaxed max-w-lg" style={{ color: 'var(--text-muted)' }}>
          Everyone here is working on the same thing. Posts are anonymous by default.
        </p>
      </motion.div>

      {/* Stats bar */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-4 mb-6"
        >
          {[
            { label: 'Members', value: stats.total_members, icon: '👥' },
            { label: 'Active today', value: stats.active_today, icon: '🔥' },
            { label: 'Posts today', value: stats.posts_today, icon: '💬' }
          ].map(s => (
            <div key={s.label} className="glass-card p-4 text-center">
              <div className="text-xl mb-1">{s.icon}</div>
              <div className="font-display text-xl font-bold">{s.value}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Tab toggle */}
      <div className="flex gap-2 mb-6 p-1 rounded-xl w-fit"
        style={{ background: 'rgba(139,92,246,0.08)' }}>
        {[
          { id: 'feed', label: '📝 Community Feed' },
          { id: 'leaderboard', label: '🏆 Leaderboard' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={activeTab === tab.id
              ? { background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: '#fff' }
              : { color: 'var(--text-muted)' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* LEADERBOARD TAB */}
      {activeTab === 'leaderboard' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="glass-card p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-semibold text-lg">Weekly Leaders</h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Ranked by XP earned — resets every Monday
                </p>
              </div>
              <div className="badge badge-purple">
                You: Level {user?.level || 1} · {user?.xp || 0} XP
              </div>
            </div>

            {/* Top 3 podium */}
            {leaderboard.length >= 3 && (
              <div className="flex items-end justify-center gap-4 mb-8 pt-4">
                {/* 2nd place */}
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-2"
                    style={{ background: 'linear-gradient(135deg, #d1d5db, #9ca3af)' }}>
                    {leaderboard[1]?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="text-2xl mb-1">🥈</div>
                  <div className="font-medium text-sm">{leaderboard[1]?.name}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {leaderboard[1]?.xp} XP
                  </div>
                  <div className="w-16 h-16 rounded-t-xl mt-2 mx-auto"
                    style={{ background: 'rgba(156,163,175,0.3)' }} />
                </div>

                {/* 1st place */}
                <div className="text-center">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-2"
                    style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}>
                    {leaderboard[0]?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="text-3xl mb-1">🥇</div>
                  <div className="font-semibold">{leaderboard[0]?.name}</div>
                  <div className="text-xs font-medium" style={{ color: '#f59e0b' }}>
                    {leaderboard[0]?.xp} XP
                  </div>
                  <div className="w-20 h-24 rounded-t-xl mt-2 mx-auto"
                    style={{ background: 'rgba(251,191,36,0.2)' }} />
                </div>

                {/* 3rd place */}
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-2"
                    style={{ background: 'linear-gradient(135deg, #cd7c32, #a16207)' }}>
                    {leaderboard[2]?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="text-2xl mb-1">🥉</div>
                  <div className="font-medium text-sm">{leaderboard[2]?.name}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {leaderboard[2]?.xp} XP
                  </div>
                  <div className="w-16 h-10 rounded-t-xl mt-2 mx-auto"
                    style={{ background: 'rgba(205,124,50,0.2)' }} />
                </div>
              </div>
            )}

            {/* Full list */}
            <div className="space-y-2">
              {leaderboard.map((entry, i) => (
                <motion.div
                  key={entry.rank}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                    entry.isCurrentUser ? 'ring-2 ring-purple-400' : ''
                  } ${entry.isSeparate ? 'mt-4 border-t pt-4' : ''}`}
                  style={{
                    background: entry.isCurrentUser
                      ? 'rgba(139,92,246,0.08)'
                      : 'rgba(139,92,246,0.03)'
                  }}
                >
                  {/* Rank */}
                  <div className="w-10 text-center font-bold text-lg flex-shrink-0">
                    {getRankEmoji(entry.rank)}
                  </div>

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0"
                    style={{ background: entry.isCurrentUser
                      ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
                      : 'linear-gradient(135deg, #6b7280, #4b5563)' }}>
                    {entry.name?.[0]?.toUpperCase()}
                  </div>

                  {/* Name + badges */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">
                        {entry.name}
                        {entry.isCurrentUser && ' (you)'}
                      </span>
                      <span className="badge badge-purple text-xs">Lv {entry.level}</span>
                      {entry.streak >= 7 && (
                        <span className="badge badge-green text-xs">🔥 {entry.streak}d</span>
                      )}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {entry.sessions} sessions · {entry.streak} day streak
                    </div>
                  </div>

                  {/* XP */}
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold" style={{ color: '#8b5cf6' }}>{entry.xp}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>XP</div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-6 p-4 rounded-xl text-center text-sm"
              style={{ background: 'rgba(139,92,246,0.04)', color: 'var(--text-muted)' }}>
              💡 Complete sessions, log situations and post in community to earn XP and climb the leaderboard
            </div>
          </div>
        </motion.div>
      )}

      {/* FEED TAB */}
      {activeTab === 'feed' && (
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Left sidebar */}
          <div className="space-y-5">
            {/* Rooms */}
            <div className="glass-card p-5">
              <h3 className="font-semibold mb-3">Rooms</h3>
              <div className="space-y-1.5">
                <button
                  onClick={() => setActiveRoom('all')}
                  className={`w-full p-3 rounded-xl text-left text-sm transition-all border-2 ${
                    activeRoom === 'all'
                      ? 'border-lavender-500 bg-lavender-50'
                      : 'border-transparent hover:border-lavender-200'
                  }`}
                  style={activeRoom !== 'all' ? { background: 'rgba(139,92,246,0.03)' } : {}}
                >
                  <div className="font-medium">All posts</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {posts.length} recent posts
                  </div>
                </button>

                {ROOMS.map(room => (
                  <button
                    key={room.id}
                    onClick={() => setActiveRoom(room.id)}
                    className={`w-full p-3 rounded-xl text-left text-sm transition-all border-2 ${
                      activeRoom === room.id
                        ? 'border-lavender-500 bg-lavender-50'
                        : 'border-transparent hover:border-lavender-200'
                    }`}
                    style={activeRoom !== room.id ? { background: 'rgba(139,92,246,0.03)' } : {}}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{room.emoji} {room.name}</span>
                    </div>
                    <div className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--text-muted)' }}>
                      {room.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Your stats in community */}
            <div className="glass-card p-5">
              <h3 className="font-semibold mb-3">Your standing</h3>
              <div className="space-y-3">
                {[
                  { label: 'XP total', value: user?.xp || 0, icon: '⭐' },
                  { label: 'Current streak', value: `${user?.streak || 0} days`, icon: '🔥' },
                  { label: 'Level', value: user?.level || 1, icon: '🎯' },
                  { label: 'Sessions', value: user?.total_sessions || 0, icon: '🎙️' }
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {s.icon} {s.label}
                    </span>
                    <span className="font-semibold text-sm">{s.value}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setActiveTab('leaderboard')}
                className="btn-secondary w-full mt-4 py-2 text-xs"
              >
                View leaderboard →
              </button>
            </div>

            {/* Rules */}
            <div className="glass-card p-5">
              <h3 className="font-semibold mb-3">How this works</h3>
              <div className="space-y-2.5 text-sm leading-snug" style={{ color: 'var(--text-muted)' }}>
                {[
                  'Your name is anonymous unless you choose otherwise.',
                  'Corrections and unsolicited advice are not welcome here.',
                  'Sharing a hard day is just as valid as sharing a win.',
                  'Earn +15 XP for every post, +5 XP when someone likes your post.'
                ].map((rule, i) => (
                  <div key={i} className="flex gap-2.5">
                    <span className="text-lavender-400 font-bold text-xs mt-0.5">—</span>
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Feed */}
          <div className="lg:col-span-2 space-y-4">

            {/* Compose */}
            <div className="glass-card p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                  {user?.anonymous_name?.[0]?.toUpperCase() || 'Y'}
                </div>
                <div>
                  <div className="font-medium text-sm">{user?.anonymous_name || 'You'}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Level {user?.level || 1} · {user?.xp || 0} XP
                  </div>
                </div>
              </div>

              <textarea
                className="input-field resize-none text-sm"
                rows={3}
                placeholder="A win, a tough moment, a question, or just how today felt. Anything goes."
                value={newPost}
                onChange={e => setNewPost(e.target.value)}
              />
              <div className="flex items-center justify-between mt-3 gap-3">
                <select
                  className="input-field w-auto text-sm py-2 flex-1"
                  value={selectedRoom}
                  onChange={e => setSelectedRoom(e.target.value)}
                >
                  {ROOMS.map(r => (
                    <option key={r.id} value={r.id}>{r.emoji} {r.name}</option>
                  ))}
                </select>
                <button
                  onClick={handlePost}
                  disabled={!newPost.trim() || posting}
                  className="btn-primary px-5 py-2 text-sm whitespace-nowrap"
                  style={(!newPost.trim() || posting) ? { opacity: 0.45, cursor: 'not-allowed' } : {}}
                >
                  {posting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Posting...
                    </span>
                  ) : 'Post anonymously'}
                </button>
              </div>
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                +15 XP for posting · +5 XP each time someone likes your post
              </p>
            </div>

            {/* Posts */}
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post, i) => (
                  <motion.div
                    key={post._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="glass-card p-5"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                        {post.anonymous_name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{post.anonymous_name || 'Anonymous'}</span>
                          {post.userLevel > 1 && (
                            <span className="badge badge-purple text-xs">Lv {post.userLevel}</span>
                          )}
                          {post.userStreak >= 7 && (
                            <span className="badge badge-green text-xs">🔥 {post.userStreak}d</span>
                          )}
                          <span className="badge badge-blue text-xs">
                            {post.roomEmoji} {post.roomName}
                          </span>
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {formatTime(post.created_at)}
                        </div>
                      </div>
                    </div>

                    <p className="text-sm leading-relaxed mb-4">
                      {post.content}
                    </p>

                    <div className="flex items-center gap-5 pt-1">
                      <button
                        onClick={() => handleLike(post._id)}
                        className="flex items-center gap-1.5 text-sm transition-colors"
                        style={{ color: post.liked ? 'var(--primary)' : 'var(--text-muted)' }}
                      >
                        {post.liked ? '💜' : '🤍'}
                        <span className="tabular-nums">{post.likes}</span>
                      </button>
                      <span className="flex items-center gap-1.5 text-sm"
                        style={{ color: 'var(--text-muted)' }}>
                        💬 <span className="tabular-nums">{post.comments}</span>
                      </span>
                      {post.userXP > 0 && (
                        <span className="text-xs ml-auto"
                          style={{ color: 'var(--text-muted)' }}>
                          ⭐ {post.userXP} XP
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}

                {posts.length === 0 && (
                  <div className="glass-card p-10 text-center">
                    <div className="text-3xl mb-2">✍️</div>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      No posts in this room yet. Yours could be the first.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}