import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import fs from 'fs'
import connectDB from './config/db.js'
import tripRoutes from './routes/trips.js'
import aiRoutes from './routes/ai.js'
import chatRoutes from './routes/chat.js'
import guidesRoutes from './routes/guides.js'
import invitationsRoutes from './routes/invitations.js'

dotenv.config()

// Connect to MongoDB
connectDB()

// Initialize Express
const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use('/api/trips', tripRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/guides', guidesRoutes)
app.use('/api/invitations', invitationsRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'VIBE TRIP API is running' })
})

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Something went wrong!' })
})

// Start server for local development only
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5002
  
  const startServer = (port, attemptsLeft = 5) => {
    const server = app.listen(port, () => {
      console.log(`🚀 VIBE TRIP Backend running on port ${port}`)
    })

    server.on('error', (err) => {
      if (err && err.code === 'EADDRINUSE' && attemptsLeft > 0) {
        console.warn(`Port ${port} is in use, trying port ${port + 1}...`)
        setTimeout(() => startServer(port + 1, attemptsLeft - 1), 200)
      } else {
        console.error('Failed to start server:', err)
        process.exit(1)
      }
    })
  }
  
  startServer(Number(PORT))
}

// Export for Vercel serverless
export default app
