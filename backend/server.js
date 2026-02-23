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

// ================= SOCKET.IO =================
const io = new Server(server, {
  cors: {
    origin: "*", // allow same origin on Render
    methods: ['GET', 'POST']
  }
})

// ================= MIDDLEWARE =================
app.use(helmet({ contentSecurityPolicy: false }))
app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// ================= RATE LIMIT =================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
})
app.use('/api/', limiter)

// ================= ROUTES =================
app.use('/api/auth', require('./routes/auth'))
app.use('/api/analysis', require('./routes/analysis'))
app.use('/api/roleplay', require('./routes/roleplay'))
app.use('/api/therapy', require('./routes/therapy'))
app.use('/api/community', require('./routes/community'))
app.use('/api/reports', require('./routes/reports'))
app.use('/api/progress', require('./routes/progress'))
app.use('/api/users', require('./routes/users'))

// ================= HEALTH CHECK =================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'FluentAI backend is running! 🎙️',
    timestamp: new Date(),
    version: '1.0.0'
  })
})

// ================= SOCKET EVENTS =================
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  socket.on('join_session', (userId) => {
    socket.join(`user_${userId}`)
  })

  socket.on('speech_metrics', async (data) => {
    const { speechRate, pitch, energy } = data
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

// ================= MONGODB =================
const connectDB = async () => {
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI)
      console.log('✅ MongoDB connected')
    } else {
      console.log('⚠️ No MONGODB_URI set - running in demo mode')
    }
  } catch (err) {
    console.error('MongoDB error:', err.message)
  }
}
connectDB()

// ================= SERVE FRONTEND (PRODUCTION) =================
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../client/dist')

  app.use(express.static(frontendPath))

  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'))
  })
}

// ================= START SERVER =================
const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`🚀 FluentAI Backend running on port ${PORT}`)
})

module.exports = { app, io }