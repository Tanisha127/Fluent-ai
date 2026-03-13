import React, { useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

const ROOMS = [
  { id: 'victories', name: 'Victory Room',     desc: 'Share what went well, big or small',             members: 34, active: true,  emoji: '🏆' },
  { id: 'interviews', name: 'Interview Prep',  desc: 'Practise for real conversations and interviews',  members: 18, active: true,  emoji: '💼' },
  { id: 'daily',     name: 'Daily Check-in',   desc: 'How are you finding today?',                      members: 52, active: true,  emoji: '☀️' },
  { id: 'techniques', name: 'Technique Talk',  desc: 'What\'s actually working for you lately?',        members: 27, active: false, emoji: '🧠' },
  { id: 'anxiety',   name: 'Hard Days',        desc: 'No performance needed. Just honest sharing.',     members: 41, active: true,  emoji: '🫂' }
]

const SAMPLE_POSTS = [
  {
    id: 1,
    author: 'SpeakingWarrior',
    avatar: '',
    time: '2 hours ago',
    room: 'Victory Room',
    roomEmoji: '🏆',
    content: "Just got through my first job interview in three years — no shutting down, no walking out. I practiced that opening sentence maybe fifty times in the roleplay module. Today it just came out. I actually cried in the car after.",
    likes: 48,
    comments: 12,
    liked: false
  },
  {
    id: 2,
    author: 'QuietVoiceLoud',
    avatar: '',
    time: '5 hours ago',
    room: 'Technique Talk',
    roomEmoji: '🧠',
    content: "Easy onset changed things for me with P-words specifically. I used to brace for impact before every 'please' or 'probably.' Now I just start with the lightest possible breath and it usually comes. Week 3 — fluency score went from 42 to 67. Still a long way to go but the direction feels different.",
    likes: 31,
    comments: 8,
    liked: true
  },
  {
    id: 3,
    author: 'RisingPhoenix',
    avatar: '',
    time: 'Yesterday',
    room: 'Hard Days',
    roomEmoji: '🫂',
    content: "Rough day. A phone call at work fell apart completely and I had to hand it off to a colleague. That familiar shame showed up. But I'm trying to remember that a bad session isn't a verdict on my progress — it's just a bad session. Recording again tomorrow. One day at a time.",
    likes: 67,
    comments: 23,
    liked: false
  },
  {
    id: 4,
    author: 'JustBreathe22',
    avatar: '',
    time: '2 days ago',
    room: 'Interview Prep',
    roomEmoji: '💼',
    content: "Anyone up for a mock interview swap? I have one next Friday for a junior dev role. Would mean a lot to practise with someone who gets why phone screens are a whole extra layer. Drop me a message in this room.",
    likes: 15,
    comments: 6,
    liked: false
  }
]

export default function CommunityPage() {
  const [posts, setPosts] = useState(SAMPLE_POSTS)
  const [newPost, setNewPost] = useState('')
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [activeRoom, setActiveRoom] = useState('all')

  const handleLike = (id) => {
    setPosts(prev => prev.map(p =>
      p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
    ))
  }

  const handlePost = () => {
    if (!newPost.trim()) return
    const room = ROOMS.find(r => r.id === selectedRoom)
    const post = {
      id: Date.now(),
      author: 'You',
      avatar: '🌱',
      time: 'Just now',
      room: room?.name || 'Daily Check-in',
      roomEmoji: room?.emoji || '☀️',
      content: newPost,
      likes: 0,
      comments: 0,
      liked: false
    }
    setPosts(prev => [post, ...prev])
    setNewPost('')
    toast.success('Shared. Someone out there needed to read that.')
  }

  const filteredPosts = activeRoom === 'all'
    ? posts
    : posts.filter(p => p.room.toLowerCase().includes(
        ROOMS.find(r => r.id === activeRoom)?.name.toLowerCase() || ''
      ))

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="font-display text-3xl font-bold">Community</h1>
        <p className="mt-1.5 text-sm leading-relaxed max-w-lg" style={{ color: 'var(--text-muted)' }}>
          Everyone here is working on the same thing. Posts are anonymous by default — 
          share at whatever depth feels right.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left sidebar */}
        <div className="space-y-5">
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
                    {room.active && (
                      <span className="flex items-center gap-1 text-xs text-green-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                        {room.members}
                      </span>
                    )}
                  </div>
                  <div className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--text-muted)' }}>
                    {room.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="font-semibold mb-3">How this works</h3>
            <div className="space-y-2.5 text-sm leading-snug" style={{ color: 'var(--text-muted)' }}>
              <div className="flex gap-2.5">
                <span className="text-lavender-400 font-bold text-xs mt-0.5">—</span>
                <span>Your name is anonymous unless you choose otherwise.</span>
              </div>
              <div className="flex gap-2.5">
                <span className="text-lavender-400 font-bold text-xs mt-0.5">—</span>
                <span>Corrections and unsolicited advice aren't welcome here.</span>
              </div>
              <div className="flex gap-2.5">
                <span className="text-lavender-400 font-bold text-xs mt-0.5">—</span>
                <span>Sharing a hard day is just as valid as sharing a win.</span>
              </div>
              <div className="flex gap-2.5">
                <span className="text-lavender-400 font-bold text-xs mt-0.5">—</span>
                <span>Report anything that makes someone feel worse, not better.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feed */}
        <div className="lg:col-span-2 space-y-4">
          {/* Compose */}
          <div className="glass-card p-5">
            <h3 className="font-semibold mb-3">Share something</h3>
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
                value={selectedRoom || ''}
                onChange={e => setSelectedRoom(e.target.value || null)}
              >
                <option value="">Choose a room…</option>
                {ROOMS.map(r => (
                  <option key={r.id} value={r.id}>{r.emoji} {r.name}</option>
                ))}
              </select>
              <button
                onClick={handlePost}
                disabled={!newPost.trim()}
                className="btn-primary px-5 py-2 text-sm whitespace-nowrap"
                style={!newPost.trim() ? { opacity: 0.45, cursor: 'not-allowed' } : {}}
              >
                Post anonymously
              </button>
            </div>
          </div>

          {/* Posts */}
          <div className="space-y-4">
            {filteredPosts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="glass-card p-5"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: 'rgba(139,92,246,0.09)' }}
                  >
                    {post.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{post.author}</span>
                      <span className="badge badge-purple text-xs">
                        {post.roomEmoji} {post.room}
                      </span>
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {post.time}
                    </div>
                  </div>
                </div>

                <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-primary)' }}>
                  {post.content}
                </p>

                <div className="flex items-center gap-5 pt-1">
                  <button
                    onClick={() => handleLike(post.id)}
                    className="flex items-center gap-1.5 text-sm transition-colors"
                    style={{ color: post.liked ? 'var(--primary)' : 'var(--text-muted)' }}
                  >
                    {post.liked ? '💜' : '🤍'}
                    <span className="tabular-nums">{post.likes}</span>
                  </button>
                  <button
                    className="flex items-center gap-1.5 text-sm"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    💬 <span className="tabular-nums">{post.comments}</span>
                  </button>
                </div>
              </motion.div>
            ))}

            {filteredPosts.length === 0 && (
              <div className="glass-card p-10 text-center">
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  No posts in this room yet. Yours could be the first.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}