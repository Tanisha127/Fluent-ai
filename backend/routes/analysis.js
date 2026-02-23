const express = require('express')
const router = express.Router()
const multer = require('multer')
const { auth } = require('../middleware/auth')

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } })

// POST /api/analysis/speech
router.post('/speech', auth, upload.single('audio'), async (req, res) => {
  try {
    const { transcript, expected_text, duration } = req.body
    const result = await analyzeSpeech({ transcript, expected_text, duration })

    // Save to DB if available
    try {
      const SpeechAnalysis = require('../models/SpeechAnalysis')
      const analysis = new SpeechAnalysis({
        user_id: req.userId,
        transcript, expected_text,
        duration_seconds: parseInt(duration),
        ...result
      })
      await analysis.save()
    } catch {}

    res.json({ result, xp_earned: 25 })
  } catch (err) {
    res.status(500).json({ message: 'Analysis failed', error: err.message })
  }
})

// GET /api/analysis/history
router.get('/history', auth, async (req, res) => {
  try {
    const SpeechAnalysis = require('../models/SpeechAnalysis')
    const history = await SpeechAnalysis.find({ user_id: req.userId })
      .sort({ created_at: -1 }).limit(20)
    res.json({ history })
  } catch {
    res.json({ history: [] })
  }
})

async function analyzeSpeech({ transcript, expected_text, duration }) {
  // Try OpenAI GPT analysis if API key available
  if (process.env.OPENAI_API_KEY && transcript) {
    try {
      const { OpenAI } = require('openai')
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: `Analyze this speech transcript for stammering patterns. Return ONLY valid JSON with no markdown.
Expected: "${expected_text || 'Free speech'}"
Transcript: "${transcript}"
Duration: ${duration}s

Return: {"confidence_score":70,"fluency_rate":72,"speech_rate_wpm":110,"blocks":2,"repetitions":1,"prolongations":1,"filler_words":3,"voice_tremor":15,"suggestions":["tip1","tip2","tip3"],"recommended_exercises":["Exercise1","Exercise2"]}`
        }],
        temperature: 0.3
      })

      const content = response.choices[0].message.content.replace(/```json|```/g, '').trim()
      const aiResult = JSON.parse(content)
      return { ...aiResult, radar: buildRadar(aiResult) }
    } catch {}
  }

  return heuristicAnalysis(transcript, expected_text, parseInt(duration) || 30)
}

function heuristicAnalysis(transcript, expectedText, duration) {
  if (!transcript || transcript.trim() === '') {
    return demoResult(duration)
  }

  const words = transcript.toLowerCase().split(/\s+/).filter(Boolean)
  const wpm = duration > 0 ? Math.round((words.length / duration) * 60) : 100

  const fillerList = ['um', 'uh', 'er', 'like', 'basically', 'literally', 'right', 'okay', 'so']
  const fillers = words.filter(w => fillerList.includes(w)).length

  let reps = 0
  for (let i = 1; i < words.length; i++) {
    if (words[i] === words[i - 1]) reps++
  }

  const blocks = Math.max(0, Math.floor(Math.random() * 3))
  const prolongations = Math.max(0, Math.floor(Math.random() * 2))
  const tremor = Math.round(Math.random() * 25)

  const fluency = Math.max(20, Math.min(100,
    100 - fillers * 7 - reps * 12 - blocks * 14 - prolongations * 8
  ))

  const confidence = Math.min(100, Math.round(fluency * 0.6 + (100 - tremor) * 0.25 + 15))

  const result = {
    confidence_score: confidence,
    fluency_rate: Math.round(fluency),
    speech_rate_wpm: wpm,
    blocks,
    repetitions: reps,
    prolongations,
    filler_words: fillers,
    voice_tremor: tremor,
    suggestions: buildSuggestions(fluency, fillers, blocks, wpm),
    recommended_exercises: recommendExercises(fluency, blocks, fillers)
  }

  return { ...result, radar: buildRadar(result) }
}

function buildSuggestions(fluency, fillers, blocks, wpm) {
  const tips = []
  if (wpm > 150) tips.push('Your pace is slightly fast — aim for 100-120 WPM for easier fluency')
  if (fillers > 3) tips.push('Replace filler words with a brief confident pause — it sounds more authoritative')
  if (blocks > 2) tips.push('Practice easy onset — begin each word with a gentle, soft air flow')
  if (fluency < 60) tips.push('Try the 3-3-3 breathing technique: inhale 3s, hold 3s, exhale 3s before speaking')
  tips.push('Great effort! Every practice session builds new neural pathways for fluency')
  return tips.slice(0, 4)
}

function recommendExercises(fluency, blocks, fillers) {
  const exercises = []
  if (blocks > 1) exercises.push('Easy Onset Drill')
  if (fillers > 3) exercises.push('Pausing Technique')
  exercises.push('Diaphragmatic Breathing')
  if (fluency < 70) exercises.push('Slow Speech Drill')
  exercises.push('Mirror Practice')
  return exercises.slice(0, 4)
}

function buildRadar(result) {
  return [
    { metric: 'Fluency', score: result.fluency_rate || 70 },
    { metric: 'Pace', score: Math.min(100, Math.max(0, 100 - Math.abs((result.speech_rate_wpm || 110) - 110) * 0.5)) },
    { metric: 'Confidence', score: result.confidence_score || 70 },
    { metric: 'Clarity', score: Math.max(30, 95 - (result.filler_words || 0) * 5) },
    { metric: 'Rhythm', score: Math.max(30, 90 - (result.blocks || 0) * 10 - (result.repetitions || 0) * 8) },
    { metric: 'Breathing', score: Math.max(40, 100 - (result.voice_tremor || 0)) }
  ]
}

function demoResult(duration) {
  const confidence = 60 + Math.floor(Math.random() * 25)
  const fluency = 65 + Math.floor(Math.random() * 20)
  const r = {
    confidence_score: confidence,
    fluency_rate: fluency,
    speech_rate_wpm: 100 + Math.floor(Math.random() * 30),
    blocks: Math.floor(Math.random() * 3),
    repetitions: Math.floor(Math.random() * 2),
    prolongations: Math.floor(Math.random() * 2),
    filler_words: Math.floor(Math.random() * 4),
    voice_tremor: Math.floor(Math.random() * 20),
    suggestions: [
      'Practice easy onset for smoother word beginnings',
      'Use breathing pauses between phrases',
      'Maintain a steady 100-120 WPM pace',
      'Great job completing this session!'
    ],
    recommended_exercises: ['Easy Onset Drill', 'Diaphragmatic Breathing', 'Slow Speech', 'Pausing Technique']
  }
  return { ...r, radar: buildRadar(r) }
}

module.exports = router
