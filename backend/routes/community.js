const express = require('express')
const router = express.Router()
const { auth } = require('../middleware/auth')

// In-memory posts for demo
let posts = [
  { _id: '1', author: 'SpeakingWarrior', room: 'victories', content: 'Just aced my first job interview! FluentAI roleplay mode saved me 🎉', likes: 48, created_at: new Date(Date.now() - 7200000) },
  { _id: '2', author: 'QuietVoiceLoud', room: 'techniques', content: 'Easy onset technique is a game changer. Week 3: confidence up from 42 to 67!', likes: 31, created_at: new Date(Date.now() - 18000000) }
]

router.get('/posts', auth, async (req, res) => {
  res.json({ posts })
})

router.post('/posts', auth, async (req, res) => {
  const { content, room } = req.body
  // Basic toxicity check
  const toxic = ['hate', 'stupid', 'loser'].some(w => content.toLowerCase().includes(w))
  if (toxic) return res.status(400).json({ message: 'Please keep our community positive and supportive 💜' })

  const post = { _id: String(Date.now()), author: 'Anonymous', room, content, likes: 0, created_at: new Date() }
  posts.unshift(post)
  res.status(201).json({ post })
})

router.post('/posts/:id/like', auth, async (req, res) => {
  const post = posts.find(p => p._id === req.params.id)
  if (post) post.likes++
  res.json({ likes: post?.likes || 0 })
})

module.exports = router
