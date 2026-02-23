const mongoose = require('mongoose')

const speechAnalysisSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  session_type: { type: String, enum: ['analysis', 'coaching', 'roleplay'], default: 'analysis' },

  // Input
  transcript: { type: String },
  expected_text: { type: String },
  duration_seconds: { type: Number },
  audio_url: { type: String },

  // AI Results
  confidence_score: { type: Number, min: 0, max: 100 },
  fluency_rate: { type: Number, min: 0, max: 100 },
  speech_rate_wpm: { type: Number },
  blocks: { type: Number, default: 0 },
  repetitions: { type: Number, default: 0 },
  prolongations: { type: Number, default: 0 },
  filler_words: { type: Number, default: 0 },
  voice_tremor: { type: Number, default: 0 },

  // Detailed breakdown
  radar_data: [{
    metric: String,
    score: Number
  }],

  // Situation context
  situation: { type: String },
  emotional_state: { type: String },
  anxiety_level: { type: Number, min: 1, max: 10 },

  // Recommendations
  suggestions: [{ type: String }],
  recommended_exercises: [{ type: String }],

  created_at: { type: Date, default: Date.now }
}, { timestamps: true })

speechAnalysisSchema.index({ user_id: 1, created_at: -1 })

module.exports = mongoose.model('SpeechAnalysis', speechAnalysisSchema)
