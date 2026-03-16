const express = require('express')
const router = express.Router()
const { auth } = require('../middleware/auth')

// POST /api/reports/generate — real data PDF
router.post('/generate', auth, async (req, res) => {
  try {
    const PDFDocument = require('pdfkit')
    const SpeechAnalysis = require('../models/SpeechAnalysis')
    const User = require('../models/User')

    const user = await User.findById(req.userId)
    const sessions = await SpeechAnalysis.find({ user_id: req.userId })
      .sort({ created_at: -1 })
      .limit(50)

    // Calculate real stats
    const totalSessions = sessions.length
    const avgConfidence = totalSessions > 0
      ? Math.round(sessions.reduce((s, r) => s + (r.confidence_score || 0), 0) / totalSessions)
      : 0
    const avgFluency = totalSessions > 0
      ? Math.round(sessions.reduce((s, r) => s + (r.fluency_rate || 0), 0) / totalSessions)
      : 0

    // Week data — last 7 sessions
    const recentSessions = sessions.slice(0, 7).reverse()

    // Baseline vs current
    const baseline = user?.baseline_confidence || (sessions.length > 0 ? sessions[sessions.length - 1].confidence_score : 0)
    const current = user?.current_confidence || avgConfidence
    const improvement = current - baseline

    const doc = new PDFDocument({ margin: 50 })
    const colors = {
      purple: '#8b5cf6',
      green: '#22c55e',
      dark: '#1e1b4b',
      gray: '#6b7280',
      lightPurple: '#f5f3ff',
      red: '#ef4444'
    }

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', 'attachment; filename=fluent-ai-report.pdf')
    doc.pipe(res)

    // Header
    doc.rect(0, 0, 612, 120).fill(colors.purple)
    doc.fillColor('white').font('Helvetica-Bold').fontSize(28)
    doc.text('FluentAI', 50, 35)
    doc.font('Helvetica').fontSize(13)
    doc.text('Progress Report', 50, 68)
    doc.text(`Generated: ${new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })}`, 50, 88)

    // User name
    doc.font('Helvetica-Bold').fontSize(13)
    doc.text(user?.name || 'User', 450, 50, { align: 'right', width: 112 })
    doc.font('Helvetica').fontSize(10)
    doc.text(`${totalSessions} sessions total`, 450, 70, { align: 'right', width: 112 })

    doc.moveDown(4)

    // Confidence Score
    doc.fillColor(colors.dark).font('Helvetica-Bold').fontSize(16)
    doc.text('Confidence Score', 50, 145)

    doc.font('Helvetica-Bold').fontSize(64).fillColor(colors.purple)
    doc.text(current > 0 ? current.toString() : '—', 50, 165)

    doc.font('Helvetica').fontSize(13)
    if (improvement > 0) {
      doc.fillColor(colors.green)
      doc.text(`▲ +${improvement} points from your baseline`, 130, 200)
    } else if (improvement < 0) {
      doc.fillColor(colors.red)
      doc.text(`▼ ${improvement} points from baseline`, 130, 200)
    } else {
      doc.fillColor(colors.gray)
      doc.text('Complete more sessions to see improvement', 130, 200)
    }

    doc.moveTo(50, 240).lineTo(562, 240).stroke(colors.purple)

    // Key Metrics
    doc.fillColor(colors.dark).font('Helvetica-Bold').fontSize(14)
    doc.text('KEY METRICS', 50, 255)

    const metrics = [
      { label: 'Avg Fluency Rate', value: avgFluency > 0 ? `${avgFluency}%` : '—', change: 'across all sessions' },
      { label: 'Confidence Score', value: current > 0 ? `${current}` : '—', change: `baseline: ${baseline || '—'}` },
      { label: 'Practice Sessions', value: totalSessions.toString(), change: `${user?.streak || 0} day streak` },
      { label: 'Practice Level', value: `Level ${user?.level || 1}`, change: `${user?.xp || 0} XP earned` }
    ]

    metrics.forEach((m, i) => {
      const x = 50 + (i % 2) * 260
      const y = 280 + Math.floor(i / 2) * 80
      doc.rect(x, y, 240, 65).fill(colors.lightPurple).stroke(colors.purple)
      doc.fillColor(colors.purple).font('Helvetica-Bold').fontSize(22)
      doc.text(m.value, x + 15, y + 10)
      doc.fillColor(colors.gray).font('Helvetica').fontSize(10)
      doc.text(m.label, x + 15, y + 38)
      doc.fillColor(colors.green).fontSize(9)
      doc.text(m.change, x + 15, y + 50)
    })

    // Recent Sessions Chart
    doc.fillColor(colors.dark).font('Helvetica-Bold').fontSize(14)
    doc.text('RECENT SESSION FLUENCY', 50, 455)

    if (recentSessions.length > 0) {
      const chartX = 50
      const chartY = 480
      const maxHeight = 80
      const barWidth = Math.min(60, Math.floor(480 / recentSessions.length) - 10)

      recentSessions.forEach((s, i) => {
        const v = s.fluency_rate || 0
        const barH = (v / 100) * maxHeight
        const x = chartX + i * (barWidth + 10)
        doc.rect(x, chartY + (maxHeight - barH), barWidth, barH).fill(colors.purple)
        doc.fillColor(colors.dark).font('Helvetica').fontSize(9)
        doc.text(`${v}%`, x, chartY + maxHeight - barH - 14, { width: barWidth, align: 'center' })
        const dateLabel = new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        doc.text(dateLabel, x, chartY + maxHeight + 5, { width: barWidth, align: 'center' })
      })
    } else {
      doc.fillColor(colors.gray).font('Helvetica').fontSize(11)
      doc.text('No sessions recorded yet', 50, 490)
    }

    // Goals section
    if (user?.primary_goals?.length > 0) {
      doc.fillColor(colors.dark).font('Helvetica-Bold').fontSize(14)
      doc.text('PRACTICE GOALS', 50, 590)
      user.primary_goals.forEach((goal, i) => {
        doc.rect(50, 615 + i * 28, 8, 18).fill(colors.purple)
        doc.fillColor(colors.dark).font('Helvetica').fontSize(10)
        doc.text(goal, 68, 619 + i * 28)
      })
    }

    // AI Tips based on real data
    const tipsY = user?.primary_goals?.length > 0 ? 615 + (user.primary_goals.length * 28) + 20 : 615
    doc.fillColor(colors.dark).font('Helvetica-Bold').fontSize(14)
    doc.text('RECOMMENDATIONS', 50, tipsY)

    const tips = generateTips(avgFluency, avgConfidence, user?.streak || 0, totalSessions)
    tips.forEach((tip, i) => {
      doc.rect(50, tipsY + 25 + i * 35, 8, 24).fill(colors.purple)
      doc.fillColor(colors.dark).font('Helvetica').fontSize(10)
      doc.text(tip, 68, tipsY + 29 + i * 35, { width: 490 })
    })

    // Motivational note
    const quoteY = Math.min(750, tipsY + 25 + tips.length * 35 + 20)
    doc.rect(50, quoteY, 512, 65).fill('#f0fdf4')
    doc.fillColor(colors.green).font('Helvetica-Bold').fontSize(11)
    const quote = getMotivationalQuote(improvement, totalSessions, user?.streak || 0)
    doc.text(`"${quote}"`, 65, quoteY + 12, { width: 480 })
    doc.fillColor(colors.gray).font('Helvetica').fontSize(9)
    doc.text('— Your FluentAI Coach', 65, quoteY + 48)

    // Footer
    doc.fontSize(9).fillColor(colors.gray)
    doc.text('FluentAI — Speech Confidence Platform | fluent-ai.vercel.app', 50, 820, {
      align: 'center', width: 512
    })

    doc.end()
  } catch (err) {
    console.error('PDF error:', err)
    res.status(500).json({ message: 'PDF generation failed', error: err.message })
  }
})

// GET /api/reports/list — real past weeks
router.get('/list', auth, async (req, res) => {
  try {
    const SpeechAnalysis = require('../models/SpeechAnalysis')
    const sessions = await SpeechAnalysis.find({ user_id: req.userId })
      .sort({ created_at: -1 })

    if (sessions.length === 0) {
      return res.json({ reports: [] })
    }

    // Group sessions by week
    const weekMap = {}
    sessions.forEach(s => {
      const date = new Date(s.created_at)
      const weekStart = getWeekStart(date)
      const key = weekStart.toISOString()
      if (!weekMap[key]) {
        weekMap[key] = {
          weekStart,
          sessions: [],
          confidenceScores: [],
          fluencyScores: []
        }
      }
      weekMap[key].sessions.push(s)
      weekMap[key].confidenceScores.push(s.confidence_score || 0)
      weekMap[key].fluencyScores.push(s.fluency_rate || 0)
    })

    const reports = Object.values(weekMap)
      .sort((a, b) => b.weekStart - a.weekStart)
      .slice(0, 8)
      .map((w, i, arr) => {
        const avgConf = Math.round(avg(w.confidenceScores))
        const prevWeek = arr[i + 1]
        const prevConf = prevWeek ? Math.round(avg(prevWeek.confidenceScores)) : null
        const improvement = prevConf !== null ? avgConf - prevConf : null
        const weekEnd = new Date(w.weekStart)
        weekEnd.setDate(weekEnd.getDate() + 6)

        return {
          week: `${w.weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
          confidence: avgConf,
          fluency: Math.round(avg(w.fluencyScores)),
          improvement: improvement !== null
            ? (improvement >= 0 ? `+${improvement}` : `${improvement}`)
            : 'Baseline',
          sessions: w.sessions.length
        }
      })

    res.json({ reports })
  } catch (err) {
    res.json({ reports: [] })
  }
})

// GET /api/reports/current — current week summary for frontend
router.get('/current', auth, async (req, res) => {
  try {
    const SpeechAnalysis = require('../models/SpeechAnalysis')
    const User = require('../models/User')

    const user = await User.findById(req.userId)
    const weekStart = getWeekStart(new Date())
    const sessions = await SpeechAnalysis.find({
      user_id: req.userId,
      created_at: { $gte: weekStart }
    }).sort({ created_at: 1 })

    const allSessions = await SpeechAnalysis.find({ user_id: req.userId })
      .sort({ created_at: -1 })

    const avgConf = sessions.length > 0
      ? Math.round(avg(sessions.map(s => s.confidence_score || 0)))
      : user?.current_confidence || 0

    const avgFluency = sessions.length > 0
      ? Math.round(avg(sessions.map(s => s.fluency_rate || 0)))
      : 0

    const baseline = user?.baseline_confidence || 0
    const improvement = avgConf - baseline

    // Daily data for this week
    const dailyMap = {}
    sessions.forEach(s => {
      const day = new Date(s.created_at).toLocaleDateString('en-US', { weekday: 'short' })
      if (!dailyMap[day]) dailyMap[day] = { fluency: [], confidence: [] }
      dailyMap[day].fluency.push(s.fluency_rate || 0)
      dailyMap[day].confidence.push(s.confidence_score || 0)
    })

    const allDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const weeklyData = allDays.map(day => ({
      day,
      fluency: dailyMap[day] ? Math.round(avg(dailyMap[day].fluency)) : null,
      confidence: dailyMap[day] ? Math.round(avg(dailyMap[day].confidence)) : null
    })).filter(d => d.fluency !== null)

    // Radar data — current vs previous week
    const prevWeekStart = new Date(weekStart)
    prevWeekStart.setDate(prevWeekStart.getDate() - 7)
    const prevSessions = await SpeechAnalysis.find({
      user_id: req.userId,
      created_at: { $gte: prevWeekStart, $lt: weekStart }
    })

    const radarData = buildRadarData(sessions, prevSessions)

    res.json({
      current: {
        confidence: avgConf,
        fluency: avgFluency,
        improvement,
        baseline,
        sessions: sessions.length,
        total_sessions: allSessions.length,
        streak: user?.streak || 0,
        xp: user?.xp || 0,
        level: user?.level || 1,
        name: user?.name || '',
        primary_goals: user?.primary_goals || [],
        stammering_level: user?.stammering_level || '',
        weekly_data: weeklyData,
        radar_data: radarData,
        recommendations: generateTips(avgFluency, avgConf, user?.streak || 0, allSessions.length)
      }
    })
  } catch (err) {
    console.error('Current report error:', err)
    res.json({ current: null })
  }
})

// ─── helpers ───────────────────────────────────────────

function avg(arr) {
  if (!arr.length) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

function getWeekStart(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function buildRadarData(currentSessions, prevSessions) {
  const calcMetric = (sessions, key) =>
    sessions.length > 0
      ? Math.round(avg(sessions.map(s => s[key] || 0)))
      : 0

  return [
    {
      metric: 'Fluency',
      current: calcMetric(currentSessions, 'fluency_rate'),
      previous: calcMetric(prevSessions, 'fluency_rate')
    },
    {
      metric: 'Confidence',
      current: calcMetric(currentSessions, 'confidence_score'),
      previous: calcMetric(prevSessions, 'confidence_score')
    },
    {
      metric: 'Clarity',
      current: Math.max(30, 95 - calcMetric(currentSessions, 'filler_words') * 5),
      previous: Math.max(30, 95 - calcMetric(prevSessions, 'filler_words') * 5)
    },
    {
      metric: 'Rhythm',
      current: Math.max(30, 90 - calcMetric(currentSessions, 'blocks') * 10),
      previous: Math.max(30, 90 - calcMetric(prevSessions, 'blocks') * 10)
    },
    {
      metric: 'Breathing',
      current: Math.max(40, 100 - calcMetric(currentSessions, 'voice_tremor')),
      previous: Math.max(40, 100 - calcMetric(prevSessions, 'voice_tremor'))
    },
    {
      metric: 'Pace',
      current: currentSessions.length > 0
        ? Math.min(100, Math.max(0, 100 - Math.abs(calcMetric(currentSessions, 'speech_rate_wpm') - 110) * 0.5))
        : 0,
      previous: prevSessions.length > 0
        ? Math.min(100, Math.max(0, 100 - Math.abs(calcMetric(prevSessions, 'speech_rate_wpm') - 110) * 0.5))
        : 0
    }
  ]
}

function generateTips(fluency, confidence, streak, totalSessions) {
  const tips = []
  if (totalSessions === 0) {
    tips.push('Complete your first speech analysis session to get personalised recommendations')
    tips.push('Try the Easy onset practice exercise in the Therapy section')
    tips.push('Start with an Easy roleplay scenario to build confidence gradually')
    return tips
  }
  if (fluency < 60) tips.push('Your fluency needs attention — practice easy onset daily for 5 minutes')
  if (fluency >= 60 && fluency < 75) tips.push('Good fluency progress — focus on reducing filler words next')
  if (fluency >= 75) tips.push('Excellent fluency! Challenge yourself with harder roleplay scenarios')
  if (confidence < 60) tips.push('Try the breathing exercises before each session to reduce anxiety')
  if (streak === 0) tips.push('Start a daily streak — even 5 minutes a day compounds over weeks')
  if (streak > 0 && streak < 7) tips.push(`You're on a ${streak}-day streak — push to 7 days for the On Fire badge`)
  if (streak >= 7) tips.push(`${streak}-day streak is impressive — keep the momentum going!`)
  if (totalSessions < 5) tips.push('Do at least 5 sessions to unlock your personalized progress chart')
  return tips.slice(0, 4)
}

function getMotivationalQuote(improvement, sessions, streak) {
  if (sessions === 0) return "Every expert was once a beginner. Your journey starts with one session."
  if (improvement > 15) return `You've improved ${improvement} points. That's not luck — that's what showing up looks like.`
  if (improvement > 5) return `${improvement} points of growth. Real progress, built one session at a time.`
  if (streak >= 7) return `${streak} days straight. That kind of consistency changes everything.`
  if (sessions >= 10) return `${sessions} sessions in. You're building something real here. Keep going.`
  return "The hardest part is showing up. You're already doing that."
}

module.exports = router