require('dotenv').config()
const express = require('express')
const http = require('http')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const { Server } = require('socket.io')
const mongoose = require('mongoose')
const path = require('path')

const app = express()
const server = http.createServer(app)

// Socket.io for real-time coaching
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
})

// Middleware
app.use(helmet({ contentSecurityPolicy: false }))
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
})
app.use('/api/', limiter)

// Routes
app.use('/api/auth', require('./routes/auth'))
app.use('/api/analysis', require('./routes/analysis'))
app.use('/api/roleplay', require('./routes/roleplay'))
app.use('/api/therapy', require('./routes/therapy'))
app.use('/api/community', require('./routes/community'))
app.use('/api/reports', require('./routes/reports'))
app.use('/api/progress', require('./routes/progress'))
app.use('/api/users', require('./routes/users'))

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'FluentAI backend is running! 🎙️',
    timestamp: new Date(),
    version: '1.0.0'
  })
})

// Socket.io - Real-time coaching
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  socket.on('join_session', (userId) => {
    socket.join(`user_${userId}`)
  })

  // Real-time speech metrics
  socket.on('speech_metrics', async (data) => {
    const { speechRate, pitch, energy, userId } = data
    const hints = generateRealtimeHints(speechRate, pitch, energy)
    if (hints.length > 0) {
      socket.emit('coaching_hint', hints[0])
    }
  })

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
})

function generateRealtimeHints(speechRate, pitch, energy) {
  const hints = []
  if (speechRate > 160) hints.push({ type: 'slow', message: '🐢 Slow down a little', priority: 'high' })
  if (energy < 30) hints.push({ type: 'breathe', message: '💨 Pause and breathe', priority: 'high' })
  if (pitch > 0.8) hints.push({ type: 'relax', message: '😌 Relax — you\'re doing great', priority: 'low' })
  if (hints.length === 0 && speechRate > 0) hints.push({ type: 'great', message: '✅ Great pace! Keep it up', priority: 'low' })
  return hints
}

// MongoDB connection
const connectDB = async () => {
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI)
      console.log('✅ MongoDB connected')
    } else {
      console.log('⚠️  No MONGODB_URI set - running in demo mode (no persistence)')
    }
  } catch (err) {
    console.error('MongoDB error:', err.message)
    console.log('Running without database - demo mode')
  }
}

connectDB()

const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`\n🚀 FluentAI Backend running on port ${PORT}`)
  console.log(`📊 Health: http://localhost:${PORT}/api/health`)
  console.log(`🎙️  AI-Powered Speech Confidence Platform\n`)
})

module.exports = { app, io }
