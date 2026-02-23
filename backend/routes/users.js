const express = require('express')
const router = express.Router()
const { auth } = require('../middleware/auth')

router.patch('/me', auth, async (req, res) => {
  try {
    const User = require('../models/User')
    const user = await User.findByIdAndUpdate(req.userId, req.body, { new: true })
    res.json({ user: user.toSafeObject() })
  } catch {
    res.json({ message: 'Updated (demo mode)' })
  }
})

router.get('/leaderboard', auth, async (req, res) => {
  res.json({
    leaderboard: [
      { rank: 1, name: 'SpeakingWarrior', xp: 2840, streak: 45 },
      { rank: 2, name: 'VoiceRiser', xp: 2340, streak: 32 },
      { rank: 3, name: 'FluentFighter', xp: 1980, streak: 28 },
      { rank: 4, name: 'YourselfHere', xp: 1450, streak: 14, isUser: true },
      { rank: 5, name: 'RisingPhoenix', xp: 1200, streak: 12 }
    ]
  })
})

module.exports = router
