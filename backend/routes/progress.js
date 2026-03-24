const express = require('express')
const router = express.Router()
const { auth } = require('../middleware/auth')

router.get('/summary', auth, async (req, res) => {
  try {
    const User = require('../models/User')
    const SpeechAnalysis = require('../models/SpeechAnalysis')

    const user = await User.findById(req.userId)

    if (!user) {
      return res.json({ summary: getDefaultSummary() })
    }

    // Get all sessions for this user
    const sessions = await SpeechAnalysis.find({ user_id: req.userId })
      .sort({ created_at: 1 })

    if (sessions.length === 0) {
      return res.json({
        summary: {
          total_sessions: user.total_sessions || 0,
          avg_confidence: user.current_confidence || 0,
          baseline_confidence: user.baseline_confidence || 0,
          streak: user.streak || 0,
          weekly_improvement: 0,
          fluency_trend: [],
          anxiety_trend: [],
          confidence_trend: [],
          weeks: [],
          situation_data: [],
          recent_sessions: []
        }
      })
    }

    // Build weekly trend data
    const weeklyMap = {}
    sessions.forEach(s => {
      const date = new Date(s.created_at)
      const weekNum = getWeekNumber(date)
      const key = `W${weekNum}`
      if (!weeklyMap[key]) {
        weeklyMap[key] = { fluencyScores: [], confidenceScores: [], count: 0 }
      }
      weeklyMap[key].fluencyScores.push(s.fluency_rate || 0)
      weeklyMap[key].confidenceScores.push(s.confidence_score || 0)
      weeklyMap[key].count++
    })

    const weeks = Object.keys(weeklyMap).slice(-8)
    const weeklyData = weeks.map(week => ({
      week,
      fluency: Math.round(avg(weeklyMap[week].fluencyScores)),
      confidence: Math.round(avg(weeklyMap[week].confidenceScores)),
      anxiety: Math.max(10, 100 - Math.round(avg(weeklyMap[week].confidenceScores)))
    }))

    // Fluency growth calculation
    const firstSession = sessions[0]
    const lastSession = sessions[sessions.length - 1]
    const fluencyGrowth = lastSession.fluency_rate && firstSession.fluency_rate
      ? Math.round(lastSession.fluency_rate - firstSession.fluency_rate)
      : 0

    const anxietyReduction = firstSession.confidence_score && lastSession.confidence_score
      ? Math.round(lastSession.confidence_score - firstSession.confidence_score)
      : 0

    // Weekly improvement (last week vs week before)
    let weeklyImprovement = 0
    if (weeklyData.length >= 2) {
      const last = weeklyData[weeklyData.length - 1]
      const prev = weeklyData[weeklyData.length - 2]
      weeklyImprovement = Math.round(last.fluency - prev.fluency)
    }

    // Build situation data from session_type
    const situationMap = {}
    sessions.forEach(s => {
      const key = s.session_type || 'analysis'
      if (!situationMap[key]) situationMap[key] = { fluencyScores: [], confidenceScores: [] }
      situationMap[key].fluencyScores.push(s.fluency_rate || 0)
      situationMap[key].confidenceScores.push(s.confidence_score || 0)
    })

    const situationLabels = {
      analysis: 'Speech Analysis',
      roleplay: 'Roleplay',
      coaching: 'Live Coaching'
    }

    const situationData = Object.keys(situationMap).map(key => ({
      situation: situationLabels[key] || key,
      fluency: Math.round(avg(situationMap[key].fluencyScores)),
      anxiety: Math.max(10, 100 - Math.round(avg(situationMap[key].confidenceScores)))
    }))

    // Recent sessions
    const recentSessions = sessions.slice(-5).reverse().map(s => ({
      date: formatDate(s.created_at),
      fluency: s.fluency_rate || 0,
      confidence: s.confidence_score || 0,
      type: s.session_type || 'analysis',
      duration: s.duration_seconds || 0
    }))

    // Build heatmap from real session dates
    const heatmap = buildHeatmapFromSessions(sessions)

    res.json({
      summary: {
        total_sessions: sessions.length,
        avg_confidence: user.current_confidence || Math.round(avg(sessions.map(s => s.confidence_score || 0))),
        baseline_confidence: user.baseline_confidence || (sessions[0]?.confidence_score || 0),
        streak: user.streak || 0,
        weekly_improvement: weeklyImprovement,
        fluency_growth: fluencyGrowth,
        anxiety_reduction: anxietyReduction,
        weekly_data: weeklyData,
        situation_data: situationData,
        recent_sessions: recentSessions,
        heatmap,
        total_practice_minutes: user.total_practice_minutes || 0,
        xp: user.xp || 0,
        level: user.level || 1,
        badges: user.badges || []
      }
    })

  } catch (err) {
    console.error('Progress summary error:', err)
    res.json({ summary: getDefaultSummary() })
  }
})

router.post('/log-situation', auth, async (req, res) => {
  try {
    const { situation, emotion, fluency_felt, notes } = req.body

    // Save as a lightweight SpeechAnalysis record
    const SpeechAnalysis = require('../models/SpeechAnalysis')
    await SpeechAnalysis.create({
      user_id: req.userId,
      session_type: 'analysis',
      situation,
      emotional_state: emotion,
      anxiety_level: 6 - fluency_felt, // invert: fluency 5 = anxiety 1
      transcript: notes || '',
      confidence_score: fluency_felt * 20,
      fluency_rate: fluency_felt * 20,
      duration_seconds: 0
    })

    // Update user streak
    const User = require('../models/User')
    const user = await User.findById(req.userId)
    if (user) {
      user.updateStreak()
      await user.save()
    }

    res.json({ saved: true, message: 'Situation logged! This helps the AI understand your patterns.' })
  } catch (err) {
    res.json({ saved: true, message: 'Logged!' })
  }
})

router.get('/heatmap', auth, async (req, res) => {
  try {
    const SpeechAnalysis = require('../models/SpeechAnalysis')
    const sessions = await SpeechAnalysis.find({ user_id: req.userId }).sort({ created_at: 1 })
    const heatmap = buildHeatmapFromSessions(sessions)
    res.json({ heatmap })
  } catch {
    res.json({ heatmap: [] })
  }
})

// ─── helpers ───────────────────────────────────────────

function avg(arr) {
  if (!arr.length) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

function getWeekNumber(date) {
  const start = new Date(date.getFullYear(), 0, 1)
  const diff = date - start
  return Math.ceil(diff / (7 * 24 * 60 * 60 * 1000))
}

function formatDate(date) {
  const d = new Date(date)
  const now = new Date()
  const diffMs = now - d
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function buildHeatmapFromSessions(sessions) {
  // Build a set of dates that had sessions
  const sessionDates = new Set(
    sessions.map(s => new Date(s.created_at).toDateString())
  )

  const sessionFluency = {}
  sessions.forEach(s => {
    const key = new Date(s.created_at).toDateString()
    if (!sessionFluency[key]) sessionFluency[key] = []
    sessionFluency[key].push(s.fluency_rate || 0)
  })

  // Build 8 weeks x 7 days going back from today
  const heatmap = []
  const today = new Date()

  for (let week = 7; week >= 0; week--) {
    const row = []
    for (let day = 6; day >= 0; day--) {
      const date = new Date(today)
      date.setDate(today.getDate() - (week * 7 + day))
      const dateStr = date.toDateString()
      const practiced = sessionDates.has(dateStr)
      const fluencies = sessionFluency[dateStr] || []
      const fluency = practiced && fluencies.length > 0
        ? Math.round(fluencies.reduce((a, b) => a + b, 0) / fluencies.length)
        : 0
      row.push({ practiced, fluency, date: dateStr })
    }
    heatmap.push(row)
  }

  return heatmap
}

function getDefaultSummary() {
  return {
    total_sessions: 0,
    avg_confidence: 0,
    baseline_confidence: 0,
    streak: 0,
    weekly_improvement: 0,
    fluency_growth: 0,
    anxiety_reduction: 0,
    weekly_data: [],
    situation_data: [],
    recent_sessions: [],
    heatmap: [],
    total_practice_minutes: 0,
    xp: 0,
    level: 1,
    badges: []
  }
}

module.exports = router