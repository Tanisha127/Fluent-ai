const express = require('express')
const router = express.Router()
const { auth, generateToken } = require('../middleware/auth')

function cosineSimilarity(a, b) {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0)
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
  return dot / (magA * magB)
}

// POST /api/face/register
router.post('/register', auth, async (req, res) => {
  try {
    const { descriptor } = req.body
    if (!descriptor || descriptor.length !== 128) {
      return res.status(400).json({ message: 'Invalid face descriptor' })
    }
    const User = require('../models/User')
    await User.findByIdAndUpdate(req.userId, { faceDescriptor: descriptor })
    return res.json({ success: true, message: 'Face registered!' })
  } catch (err) {
    res.status(500).json({ message: 'Failed to register face', error: err.message })
  }
})

// POST /api/face/login — email + face descriptor
router.post('/login', async (req, res) => {
  try {
    const { descriptor, email } = req.body

    if (!descriptor || descriptor.length !== 128) {
      return res.status(400).json({ message: 'Invalid face descriptor' })
    }
    if (!email) {
      return res.status(400).json({ message: 'Email is required for face login' })
    }

    const User = require('../models/User')

    // Find user by email first
    const user = await User.findOne({ email: email.toLowerCase().trim() })

    if (!user) {
      return res.status(401).json({ message: 'No account found with that email.' })
    }

    if (!user.faceDescriptor || user.faceDescriptor.length !== 128) {
      return res.status(401).json({ message: 'Face login not set up for this account. Use password.' })
    }

    const similarity = cosineSimilarity(descriptor, user.faceDescriptor)
    console.log(`Face login attempt for ${email}: similarity = ${similarity.toFixed(4)}`)

    // Loose threshold — pixel descriptors vary with lighting
    const THRESHOLD = 0.90

    if (similarity >= THRESHOLD) {
      const token = generateToken(user._id.toString())
      return res.json({ success: true, token, user: user.toSafeObject() })
    }

    console.log(`Failed — similarity ${similarity.toFixed(4)} below threshold ${THRESHOLD}`)
    return res.status(401).json({ message: 'Face not recognised. Please use password login.' })

  } catch (err) {
    console.error('Face login error:', err)
    res.status(500).json({ message: 'Face login failed', error: err.message })
  }
})

module.exports = router