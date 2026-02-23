const express = require('express')
const router = express.Router()
const { auth, generateToken } = require('../middleware/auth')

// In-memory user store for demo (replace with User model when DB is available)
const demoUsers = new Map()

// Demo user
demoUsers.set('demo@fluent.ai', {
  _id: 'demo-user-001',
  name: 'Demo User',
  email: 'demo@fluent.ai',
  password_plain: 'demo1234',
  anonymous_name: 'SpeakingWarrior',
  age: 25,
  stammering_level: 'Moderate',
  primary_goals: ['Job interviews', 'Phone calls', 'Public speaking'],
  xp: 145,
  level: 3,
  streak: 14,
  total_sessions: 47,
  current_confidence: 82,
  badges: ['first-steps', 'on-fire', 'actor', 'dedicated']
})

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, anonymous_name, age, stammering_level, primary_goals } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' })
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' })
    }

    // Try MongoDB first
    try {
      const User = require('../models/User')
      const existing = await User.findOne({ email })
      if (existing) return res.status(400).json({ message: 'Email already registered' })

      const user = new User({ name, email, password, anonymous_name, age, stammering_level, primary_goals })
      await user.save()
      const token = generateToken(user._id.toString())
      return res.status(201).json({ token, user: user.toSafeObject() })
    } catch (dbErr) {
      // Fallback to in-memory
    }

    if (demoUsers.has(email)) {
      return res.status(400).json({ message: 'Email already registered' })
    }

    const user = {
      _id: `user-${Date.now()}`,
      name, email, anonymous_name: anonymous_name || `User${Date.now()}`,
      age, stammering_level, primary_goals: primary_goals || [],
      xp: 0, level: 1, streak: 0, total_sessions: 0,
      current_confidence: 0, badges: [],
      password_plain: password
    }
    demoUsers.set(email, user)
    const token = generateToken(user._id)
    const { password_plain, ...safeUser } = user
    res.status(201).json({ token, user: safeUser })
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' })
    }

    // Try MongoDB
    try {
      const User = require('../models/User')
      const user = await User.findOne({ email })
      if (user) {
        const valid = await user.comparePassword(password)
        if (!valid) return res.status(401).json({ message: 'Invalid credentials' })
        const token = generateToken(user._id.toString())
        return res.json({ token, user: user.toSafeObject() })
      }
    } catch {}

    // Fallback to in-memory
    const user = demoUsers.get(email)
    if (!user || user.password_plain !== password) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }
    const token = generateToken(user._id)
    const { password_plain, ...safeUser } = user
    res.json({ token, user: safeUser })
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message })
  }
})

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    // Try MongoDB
    try {
      const User = require('../models/User')
      const user = await User.findById(req.userId)
      if (user) return res.json({ user: user.toSafeObject() })
    } catch {}

    // Fallback: find by ID in demo users
    const user = [...demoUsers.values()].find(u => u._id === req.userId)
    if (!user) return res.status(404).json({ message: 'User not found' })
    const { password_plain, ...safeUser } = user
    res.json({ user: safeUser })
  } catch (err) {
    res.status(500).json({ message: 'Error fetching user' })
  }
})

module.exports = router
