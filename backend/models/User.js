const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 8 },
  anonymous_name: { type: String, default: '' },
  age: { type: Number },
  stammering_level: { type: String, enum: ['Mild', 'Moderate', 'Severe', 'Prefer not to say'], default: 'Moderate' },
  primary_goals: [{ type: String }],

  // Gamification
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  streak: { type: Number, default: 0 },
  last_practice_date: { type: Date },
  badges: [{ type: String }],

  // Stats
  total_sessions: { type: Number, default: 0 },
  baseline_confidence: { type: Number, default: null },
  current_confidence: { type: Number, default: 0 },
  total_practice_minutes: { type: Number, default: 0 },

  // Preferences
  notifications_enabled: { type: Boolean, default: true },
  accessibility: {
    dark_mode: { type: Boolean, default: false },
    large_text: { type: Boolean, default: false },
    dyslexic_font: { type: Boolean, default: false },
    high_contrast: { type: Boolean, default: false }
  },

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, { timestamps: true })

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

userSchema.methods.addXP = function(amount) {
  this.xp += amount
  const newLevel = Math.floor(this.xp / 200) + 1
  if (newLevel > this.level) {
    this.level = newLevel
    return { levelUp: true, newLevel }
  }
  return { levelUp: false }
}

userSchema.methods.updateStreak = function() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (!this.last_practice_date) {
    this.streak = 1
  } else {
    const lastDate = new Date(this.last_practice_date)
    lastDate.setHours(0, 0, 0, 0)
    if (lastDate.getTime() === yesterday.getTime()) {
      this.streak += 1
    } else if (lastDate.getTime() !== today.getTime()) {
      this.streak = 1
    }
  }
  this.last_practice_date = new Date()
}

userSchema.methods.toSafeObject = function() {
  const obj = this.toObject()
  delete obj.password
  return obj
}

module.exports = mongoose.model('User', userSchema)
