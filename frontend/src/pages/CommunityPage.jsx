import React, { useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

const ROOMS = [
  { id: 'victories', name: '🏆 Victory Room', desc: 'Share your wins, big or small', members: 34, active: true },
  { id: 'interviews', name: '💼 Interview Prep', desc: 'Practice together for job interviews', members: 18, active: true },
  { id: 'daily', name: '☀️ Daily Check-in', desc: 'How are you doing today?', members: 52, active: true },
  { id: 'techniques', name: '🧠 Technique Talk', desc: 'Share what works for you', members: 27, active: false },
  { id: 'anxiety', name: '🫂 Anxiety Support', desc: 'Safe space for hard days', members: 41, active: true }
]

const SAMPLE_POSTS = [
  {
    id: 1,
    author: 'SpeakingWarrior',
    avatar: '🦁',
    time: '2 hours ago',
    room: '🏆 Victory Room',
    content: "Just finished my first job interview in 3 years without a single block! FluentAI's roleplay mode saved me. I practiced that intro sentence 50 times. Today it just flowed out 😭✨",
    likes: 48,
    comments: 12,
    liked: false
  },
  {
    id: 2,
    author: 'QuietVoiceLoud',
    avatar: '🌟',
    time: '5 hours ago',
    room: '🧠 Technique Talk',
    content: "The easy onset technique changed everything for me. I used to dread words starting with 'P'. Now I just start with the lightest air and it slides out. Week 3 and my confidence score went from 42 to 67.",
    likes: 31,
    comments: 8,
    liked: true
  },
  {
    id: 3,
    author: 'RisingPhoenix',
    avatar: '🦅',
    time: '1 day ago',
    room: '☀️ Daily Check-in',
    content: "Bad day today. Phone call at work completely fell apart. But I remembered — one bad session doesn't erase the progress. Recording again tomorrow. We rise. 💜",
    likes: 67,
    comments: 23,
    liked: false
  },
  {
    id: 4,
    author: 'JustBreathe22',
    avatar: '🌊',
    time: '2 days ago',
    room: '💼 Interview Prep',
    content: "Anyone want to practice mock interviews together? I have one next Friday. Would love to practice with someone who understands. DM me in the Interview Prep room!",
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
    const post = {
      id: Date.now(),
      author: 'You',
      avatar: '🌱',
      time: 'Just now',
      room: selectedRoom ? ROOMS.find(r => r.id === selectedRoom)?.name : '☀️ Daily Check-in',
      content: newPost,
      likes: 0,
      comments: 0,
      liked: false
    }
    setPosts(prev => [post, ...prev])
    setNewPost('')
    toast.success('Post shared with the community! 🎉')
  }

  const filteredPosts = activeRoom === 'all' ? posts : posts.filter(p =>
    p.room.toLowerCase().includes(activeRoom.toLowerCase())
  )

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="font-display text-3xl font-bold">Safe Community 🤝</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
          All posts are anonymous. Share freely, encourage generously. You are never alone.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Rooms + New post */}
        <div className="space-y-5">
          {/* Community Rooms */}
          <div className="glass-card p-5">
            <h3 className="font-semibold mb-4">Community Rooms</h3>
            <div className="space-y-2">
              <button
                onClick={() => setActiveRoom('all')}
                className={`w-full p-3 rounded-xl text-left text-sm transition-all border-2 ${
                  activeRoom === 'all' ? 'border-lavender-500 bg-lavender-50' : 'border-transparent hover:border-lavender-200'
                }`}
                style={activeRoom !== 'all' ? { background: 'rgba(139,92,246,0.03)' } : {}}
              >
                <div className="font-medium">🏠 All Posts</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {posts.length} posts
                </div>
              </button>
              {ROOMS.map(room => (
                <button
                  key={room.id}
                  onClick={() => setActiveRoom(room.id)}
                  className={`w-full p-3 rounded-xl text-left text-sm transition-all border-2 ${
                    activeRoom === room.id ? 'border-lavender-500 bg-lavender-50' : 'border-transparent hover:border-lavender-200'
                  }`}
                  style={activeRoom !== room.id ? { background: 'rgba(139,92,246,0.03)' } : {}}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{room.name}</span>
                    {room.active && (
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                        <span className="text-xs text-green-600">{room.members}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{room.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Community guidelines */}
          <div className="glass-card p-5">
            <h3 className="font-semibold mb-3">💜 Community Values</h3>
            <div className="space-y-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              {[
                '🙏 Respect every voice, every journey',
                '🔒 All identities remain anonymous',
                '🚫 No mockery or unsolicited advice',
                '🤝 Lift others, especially on hard days',
                '✨ Celebrate every tiny victory'
              ].map((v, i) => <div key={i}>{v}</div>)}
            </div>
          </div>
        </div>

        {/* Right: Feed */}
        <div className="lg:col-span-2 space-y-4">
          {/* New post */}
          <div className="glass-card p-5">
            <h3 className="font-semibold mb-3">Share with the community</h3>
            <textarea
              className="input-field resize-none"
              rows={3}
              placeholder="Share a victory, a challenge, or just say hi... 💜"
              value={newPost}
              onChange={e => setNewPost(e.target.value)}
            />
            <div className="flex items-center justify-between mt-3">
              <select
                className="input-field w-auto text-sm py-2"
                value={selectedRoom || ''}
                onChange={e => setSelectedRoom(e.target.value || null)}
              >
                <option value="">📍 Choose a room</option>
                {ROOMS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <button
                onClick={handlePost}
                disabled={!newPost.trim()}
                className="btn-primary px-6 py-2 text-sm"
                style={!newPost.trim() ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
              >
                Share Anonymously 💜
              </button>
            </div>
          </div>

          {/* Posts feed */}
          <div className="space-y-4">
            {filteredPosts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-5"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: 'rgba(139,92,246,0.1)' }}>
                    {post.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{post.author}</span>
                      <span className="badge badge-purple text-xs">{post.room}</span>
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{post.time}</div>
                  </div>
                </div>

                <p className="text-sm leading-relaxed mb-4">{post.content}</p>

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-1.5 text-sm transition-colors ${
                      post.liked ? 'text-lavender-600 font-medium' : ''
                    }`}
                    style={{ color: post.liked ? 'var(--primary)' : 'var(--text-muted)' }}
                  >
                    {post.liked ? '💜' : '🤍'} {post.likes}
                  </button>
                  <button className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>
                    💬 {post.comments}
                  </button>
                  <button className="flex items-center gap-1.5 text-sm ml-auto" style={{ color: 'var(--text-muted)' }}>
                    ↗️ Share
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
