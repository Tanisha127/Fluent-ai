const express = require('express')
const router = express.Router()
const { auth } = require('../middleware/auth')

// In-memory store (works without MongoDB too)
let posts = [
  {
    _id: '1',
    author: 'SpeakingWarrior',
    anonymous_name: 'SpeakingWarrior',
    room: 'victories',
    roomEmoji: '🏆',
    roomName: 'Victory Room',
    content: "Just got through my first job interview in three years — no shutting down, no walking out. I practiced that opening sentence maybe fifty times in the roleplay module. Today it just came out. I actually cried in the car after.",
    likes: 48,
    likedBy: [],
    comments: 12,
    created_at: new Date(Date.now() - 7200000)
  },
  {
    _id: '2',
    author: 'QuietVoiceLoud',
    anonymous_name: 'QuietVoiceLoud',
    room: 'techniques',
    roomEmoji: '🧠',
    roomName: 'Technique Talk',
    content: "Easy onset changed things for me with P-words specifically. Week 3 — fluency score went from 42 to 67. Still a long way to go but the direction feels different.",
    likes: 31,
    likedBy: [],
    comments: 8,
    created_at: new Date(Date.now() - 18000000)
  },
  {
    _id: '3',
    author: 'RisingPhoenix',
    anonymous_name: 'RisingPhoenix',
    room: 'harddays',
    roomEmoji: '🫂',
    roomName: 'Hard Days',
    content: "Rough day. A phone call at work fell apart completely. But I'm trying to remember that a bad session isn't a verdict on my progress — it's just a bad session. Recording again tomorrow.",
    likes: 67,
    likedBy: [],
    comments: 23,
    created_at: new Date(Date.now() - 86400000)
  }
]

const ROOM_MAP = {
  victories: { name: 'Victory Room', emoji: '🏆' },
  interviews: { name: 'Interview Prep', emoji: '💼' },
  daily: { name: 'Daily Check-in', emoji: '☀️' },
  techniques: { name: 'Technique Talk', emoji: '🧠' },
  harddays: { name: 'Hard Days', emoji: '🫂' }
}

// GET /api/community/posts
router.get('/posts', auth, async (req, res) => {
  try {
    // Try MongoDB first
    const Post = require('../models/Post').catch(() => null)
    // Fall back to in-memory
    const { room } = req.query
    const filtered = room && room !== 'all'
      ? posts.filter(p => p.room === room)
      : posts

    res.json({ posts: filtered })
  } catch {
    res.json({ posts })
  }
})

// POST /api/community/posts
router.post('/posts', auth, async (req, res) => {
  try {
    const { content, room } = req.body

    if (!content?.trim()) {
      return res.status(400).json({ message: 'Post cannot be empty' })
    }

    // Toxicity check
    const toxic = ['hate', 'stupid', 'loser', 'idiot', 'dumb', 'kill'].some(w =>
      content.toLowerCase().includes(w)
    )
    if (toxic) {
      return res.status(400).json({ message: 'Please keep our community positive and supportive 💜' })
    }

    // Get user's anonymous name
    let anonymousName = 'Anonymous'
    let userXP = 0
    let userStreak = 0
    let userLevel = 1

    try {
      const User = require('../models/User')
      const user = await User.findById(req.userId)
      if (user) {
        anonymousName = user.anonymous_name || 'Anonymous'
        userXP = user.xp || 0
        userStreak = user.streak || 0
        userLevel = user.level || 1
      }
    } catch {}

    const roomInfo = ROOM_MAP[room] || ROOM_MAP.daily
    const post = {
      _id: String(Date.now()),
      author: req.userId,
      anonymous_name: anonymousName,
      room,
      roomEmoji: roomInfo.emoji,
      roomName: roomInfo.name,
      content: content.trim(),
      likes: 0,
      likedBy: [],
      comments: 0,
      userXP,
      userStreak,
      userLevel,
      created_at: new Date()
    }

    posts.unshift(post)

    // Award XP for posting
    try {
      const User = require('../models/User')
      const user = await User.findById(req.userId)
      if (user) {
        user.addXP(15)
        await user.save()
      }
    } catch {}

    res.status(201).json({ post, xp_earned: 15 })
  } catch (err) {
    res.status(500).json({ message: 'Failed to post', error: err.message })
  }
})

// POST /api/community/posts/:id/like
router.post('/posts/:id/like', auth, async (req, res) => {
  try {
    const post = posts.find(p => p._id === req.params.id)
    if (!post) return res.status(404).json({ message: 'Post not found' })

    const userId = req.userId
    const alreadyLiked = post.likedBy.includes(userId)

    if (alreadyLiked) {
      post.likes--
      post.likedBy = post.likedBy.filter(id => id !== userId)
    } else {
      post.likes++
      post.likedBy.push(userId)

      // Award XP to post author for receiving a like
      try {
        const User = require('../models/User')
        await User.findByIdAndUpdate(post.author, { $inc: { xp: 5 } })
      } catch {}
    }

    res.json({ likes: post.likes, liked: !alreadyLiked })
  } catch (err) {
    res.status(500).json({ message: 'Failed to like', error: err.message })
  }
})

// GET /api/community/leaderboard
router.get('/leaderboard', auth, async (req, res) => {
  try {
    const User = require('../models/User')
    const users = await User.find({})
      .sort({ xp: -1 })
      .limit(10)

    const leaderboard = users.map((u, i) => ({
      rank: i + 1,
      name: u.anonymous_name || 'Anonymous',
      xp: u.xp || 0,
      streak: u.streak || 0,
      level: u.level || 1,
      sessions: u.total_sessions || 0,
      isCurrentUser: u._id.toString() === req.userId
    }))

    // Find current user's rank if not in top 10
    const currentUserRank = leaderboard.find(u => u.isCurrentUser)
    if (!currentUserRank) {
      const allUsers = await User.find({}).sort({ xp: -1 })
      const userIndex = allUsers.findIndex(u => u._id.toString() === req.userId)
      if (userIndex !== -1) {
        const u = allUsers[userIndex]
        leaderboard.push({
          rank: userIndex + 1,
          name: u.anonymous_name || 'You',
          xp: u.xp || 0,
          streak: u.streak || 0,
          level: u.level || 1,
          sessions: u.total_sessions || 0,
          isCurrentUser: true,
          isSeparate: true
        })
      }
    }

    res.json({ leaderboard })
  } catch {
    // Demo leaderboard fallback
    res.json({
      leaderboard: [
        { rank: 1, name: 'SpeakingWarrior', xp: 2840, streak: 45, level: 14, sessions: 89, isCurrentUser: false },
        { rank: 2, name: 'VoiceRiser', xp: 2340, streak: 32, level: 12, sessions: 67, isCurrentUser: false },
        { rank: 3, name: 'FluentFighter', xp: 1980, streak: 28, level: 10, sessions: 54, isCurrentUser: false },
        { rank: 4, name: 'BraveSpeaker', xp: 1650, streak: 21, level: 9, sessions: 43, isCurrentUser: false },
        { rank: 5, name: 'YourselfHere', xp: 145, streak: 1, level: 1, sessions: 2, isCurrentUser: true }
      ]
    })
  }
})

// GET /api/community/stats
router.get('/stats', auth, async (req, res) => {
  try {
    const User = require('../models/User')
    const totalUsers = await User.countDocuments()
    const activeSreakUsers = await User.countDocuments({ streak: { $gt: 0 } })
    res.json({
      stats: {
        total_members: totalUsers || 172,
        active_today: activeSreakUsers || 34,
        posts_today: posts.filter(p => {
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          return new Date(p.created_at) >= today
        }).length
      }
    })
  } catch {
    res.json({ stats: { total_members: 172, active_today: 34, posts_today: 8 } })
  }
})

module.exports = router