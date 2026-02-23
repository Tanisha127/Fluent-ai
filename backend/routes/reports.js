const express = require('express')
const router = express.Router()
const { auth } = require('../middleware/auth')

// POST /api/reports/generate
router.post('/generate', auth, async (req, res) => {
  try {
    const PDFDocument = require('pdfkit')
    const doc = new PDFDocument({ margin: 50 })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', 'attachment; filename=fluent-ai-weekly-report.pdf')

    doc.pipe(res)

    const colors = { purple: '#8b5cf6', teal: '#7dd3fc', green: '#22c55e', dark: '#1e1b4b', gray: '#6b7280' }

    // Header
    doc.rect(0, 0, 612, 120).fill(colors.purple)
    doc.fillColor('white').font('Helvetica-Bold').fontSize(28)
    doc.text('FluentAI', 50, 35)
    doc.font('Helvetica').fontSize(13)
    doc.text('Weekly Progress Report', 50, 68)
    doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, 50, 88)
    doc.moveDown(4)

    // Confidence Score Hero
    doc.fillColor(colors.dark)
    doc.font('Helvetica-Bold').fontSize(16)
    doc.text('Confidence Score This Week', 50, 145)

    doc.font('Helvetica-Bold').fontSize(64)
    doc.fillColor(colors.purple)
    doc.text('82', 50, 168)

    doc.font('Helvetica').fontSize(13)
    doc.fillColor(colors.green)
    doc.text('▲ +17 points from your baseline', 125, 200)

    // Divider
    doc.moveTo(50, 240).lineTo(562, 240).stroke(colors.purple)

    // Key Metrics Grid
    doc.fillColor(colors.dark)
    doc.font('Helvetica-Bold').fontSize(14)
    doc.text('KEY METRICS', 50, 255)

    const metrics = [
      { label: 'Fluency Rate', value: '78%', change: '+10%' },
      { label: 'Anxiety Reduction', value: '-37%', change: 'vs baseline' },
      { label: 'Practice Sessions', value: '17', change: '6/7 days' },
      { label: 'Streak', value: '14 days', change: '🔥 Personal Best' }
    ]

    metrics.forEach((m, i) => {
      const x = 50 + (i % 2) * 260
      const y = 280 + Math.floor(i / 2) * 80

      doc.rect(x, y, 240, 65).fill('#f5f3ff').stroke(colors.purple)
      doc.fillColor(colors.purple).font('Helvetica-Bold').fontSize(22)
      doc.text(m.value, x + 15, y + 10)
      doc.fillColor(colors.gray).font('Helvetica').fontSize(10)
      doc.text(m.label, x + 15, y + 38)
      doc.fillColor(colors.green).fontSize(9)
      doc.text(m.change, x + 15, y + 50)
    })

    // Weekly Fluency
    doc.fillColor(colors.dark)
    doc.font('Helvetica-Bold').fontSize(14)
    doc.text('DAILY FLUENCY THIS WEEK', 50, 450)

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const values = [68, 72, 75, 70, 80, 78, 83]
    const chartX = 50
    const chartY = 475
    const barWidth = 60
    const maxHeight = 80

    values.forEach((v, i) => {
      const barH = (v / 100) * maxHeight
      const x = chartX + i * (barWidth + 10)
      doc.rect(x, chartY + (maxHeight - barH), barWidth, barH).fill(colors.purple)
      doc.fillColor(colors.dark).font('Helvetica').fontSize(9)
      doc.text(`${v}%`, x, chartY + maxHeight - barH - 14, { width: barWidth, align: 'center' })
      doc.text(days[i], x, chartY + maxHeight + 5, { width: barWidth, align: 'center' })
    })

    // AI Recommendations
    doc.fillColor(colors.dark)
    doc.font('Helvetica-Bold').fontSize(14)
    doc.text('AI RECOMMENDATIONS FOR NEXT WEEK', 50, 590)

    const recs = [
      'Focus on phone call scenarios — highest anxiety trigger identified',
      'Continue easy onset practice — blocks reduced by 40% this week',
      'Try the Bouncing Technique — only exercise not yet completed',
      'Join the Interview Prep community for peer practice accountability'
    ]

    recs.forEach((rec, i) => {
      doc.rect(50, 615 + i * 40, 8, 28).fill(colors.purple)
      doc.fillColor(colors.dark).font('Helvetica').fontSize(10)
      doc.text(rec, 68, 621 + i * 40, { width: 490 })
    })

    // Motivational Quote
    doc.rect(50, 785, 512, 65).fill('#f0fdf4')
    doc.fillColor(colors.green).font('Helvetica-Bold').fontSize(11)
    doc.text('"Your voice improved 17 points in one week.', 65, 798)
    doc.text("That's not small — that's extraordinary effort turning into real change.", 65, 813)
    doc.fillColor(colors.gray).font('Helvetica').fontSize(9)
    doc.text('— Your FluentAI Coach', 65, 832)

    // Footer
    doc.fontSize(9).fillColor(colors.gray)
    doc.text('FluentAI — Speech Confidence Platform | fluent-ai.vercel.app | Built for 70M+ people who stammer', 50, 830, {
      align: 'center', width: 512
    })

    doc.end()
  } catch (err) {
    console.error('PDF generation error:', err)
    res.status(500).json({ message: 'PDF generation failed', error: err.message })
  }
})

// GET /api/reports/list
router.get('/list', auth, async (req, res) => {
  res.json({
    reports: [
      { week: 'Feb 16-22, 2026', confidence: 82, improvement: '+17', sessions: 17 },
      { week: 'Feb 9-15, 2026', confidence: 74, improvement: '+12', sessions: 14 },
      { week: 'Feb 2-8, 2026', confidence: 66, improvement: '+8', sessions: 11 },
      { week: 'Jan 26 - Feb 1, 2026', confidence: 58, improvement: '+5', sessions: 9 }
    ]
  })
})

module.exports = router
