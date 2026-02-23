const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'fluent-ai-jwt-secret-2026-change-in-production'

const auth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    return res.status(401).json({ message: 'No token provided' })
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.userId = decoded.userId
    next()
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' })
  }
}

const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' })
}

module.exports = { auth, generateToken }
