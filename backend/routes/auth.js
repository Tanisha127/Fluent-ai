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
  badges: ['first-steps', 'on-fire', 'actor', 'dedicated'],
  faceDescriptor: null
})

// ─── helper: euclidean distance between two face descriptors ───
function faceDistance(d1, d2) {
  return Math.sqrt(d1.reduce((sum, val, i) => sum + Math.pow(val - d2[i], 2), 0))
}

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
      // fallback to in-memory
    }

    if (demoUsers.has(email)) {
      return res.status(400).json({ message: 'Email already registered' })
    }

    const user = {
      _id: `user-${Date.now()}`,
      name, email,
      anonymous_name: anonymous_name || `User${Date.now()}`,
      age, stammering_level,
      primary_goals: primary_goals || [],
      xp: 0, level: 1, streak: 0, total_sessions: 0,
      current_confidence: 0, badges: [],
      faceDescriptor: null,
      password_plain: password
    }
    demoUsers.set(email, user)
    const token = generateToken(user._id)
    const { password_plain, faceDescriptor, ...safeUser } = user
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
    const { password_plain, faceDescriptor, ...safeUser } = user
    res.json({ token, user: safeUser })
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message })
  }
})

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    try {
      const User = require('../models/User')
      const user = await User.findById(req.userId)
      if (user) return res.json({ user: user.toSafeObject() })
    } catch {}

    const user = [...demoUsers.values()].find(u => u._id === req.userId)
    if (!user) return res.status(404).json({ message: 'User not found' })
    const { password_plain, faceDescriptor, ...safeUser } = user
    res.json({ user: safeUser })
  } catch (err) {
    res.status(500).json({ message: 'Error fetching user' })
  }
})

// ✅ POST /api/face/register — save face descriptor to user
router.post('/face/register', auth, async (req, res) => {
  try {
    const { descriptor } = req.body

    if (!descriptor || descriptor.length !== 128) {
      return res.status(400).json({ message: 'Invalid face descriptor' })
    }

    // Try MongoDB
    try {
      const User = require('../models/User')
      await User.findByIdAndUpdate(req.userId, { faceDescriptor: descriptor })
      return res.json({ success: true, message: 'Face registered!' })
    } catch {}

    // Fallback in-memory
    const user = [...demoUsers.values()].find(u => u._id === req.userId)
    if (user) user.faceDescriptor = descriptor
    res.json({ success: true, message: 'Face registered! (demo mode)' })
  } catch (err) {
    res.status(500).json({ message: 'Failed to register face', error: err.message })
  }
})

// ✅ POST /api/face/login — compare descriptor and return token
router.post('/face/login', async (req, res) => {
  try {
    const { descriptor } = req.body

    if (!descriptor || descriptor.length !== 128) {
      return res.status(400).json({ message: 'Invalid face descriptor' })
    }

    const THRESHOLD = 0.5
    let bestMatch = null
    let bestDistance = Infinity

    // Try MongoDB
    try {
      const User = require('../models/User')
      const users = await User.find({ faceDescriptor: { $exists: true, $ne: null } })

      for (const user of users) {
        if (!user.faceDescriptor || user.faceDescriptor.length !== 128) continue
        const distance = faceDistance(descriptor, user.faceDescriptor)
        if (distance < bestDistance) {
          bestDistance = distance
          bestMatch = user
        }
      }

      if (bestMatch && bestDistance <= THRESHOLD) {
        const token = generateToken(bestMatch._id.toString())
        return res.json({ success: true, token, user: bestMatch.toSafeObject() })
      }

      if (users.length > 0) {
        return res.status(401).json({ message: 'Face not recognised. Please use password login.' })
      }
    } catch {}

    // Fallback in-memory
    for (const user of demoUsers.values()) {
      if (!user.faceDescriptor || user.faceDescriptor.length !== 128) continue
      const distance = faceDistance(descriptor, user.faceDescriptor)
      if (distance < bestDistance) {
        bestDistance = distance
        bestMatch = user
      }
    }

    if (!bestMatch || bestDistance > THRESHOLD) {
      return res.status(401).json({ message: 'Face not recognised. Please use password login.' })
    }

    const token = generateToken(bestMatch._id)
    const { password_plain, faceDescriptor, ...safeUser } = bestMatch
    res.json({ success: true, token, user: safeUser })
  } catch (err) {
    res.status(500).json({ message: 'Face login failed', error: err.message })
  }
})

module.exports = router