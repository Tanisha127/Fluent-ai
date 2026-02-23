// therapy.js
const express = require('express')
const router = express.Router()
const { auth } = require('../middleware/auth')

router.get('/plan', auth, async (req, res) => {
  res.json({
    plan: {
      recommended: ['Easy Onset Drill', 'Diaphragmatic Breathing', 'Slow Speech Drill'],
      daily_challenge: {
        title: 'Easy Onset Practice',
        text: 'Today is a wonderful day to practice speaking with ease and confidence.',
        xp: 30
      }
    }
  })
})

router.post('/complete', auth, async (req, res) => {
  const { exercise_id, duration_seconds } = req.body
  res.json({ success: true, xp_earned: 25, message: 'Exercise completed! Great work! 🎉' })
})

module.exports = router
