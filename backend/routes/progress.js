const express = require('express')
const router = express.Router()
const { auth } = require('../middleware/auth')

router.get('/summary', auth, async (req, res) => {
  res.json({
    summary: {
      total_sessions: 47,
      avg_confidence: 74,
      streak: 14,
      weekly_improvement: 12,
      fluency_trend: [52, 58, 63, 69, 74, 72, 78, 82],
      anxiety_trend: [72, 65, 60, 55, 48, 45, 40, 35]
    }
  })
})

router.post('/log-situation', auth, async (req, res) => {
  const { situation, emotion, fluency_felt, notes } = req.body
  res.json({ saved: true, message: 'Situation logged! This helps the AI understand your patterns.' })
})

router.get('/heatmap', auth, async (req, res) => {
  const data = []
  for (let w = 0; w < 8; w++) {
    const week = []
    for (let d = 0; d < 7; d++) {
      const practiced = Math.random() > 0.3
      week.push({ practiced, fluency: practiced ? 50 + Math.floor(Math.random() * 40) : 0 })
    }
    data.push(week)
  }
  res.json({ heatmap: data })
})

module.exports = router
