import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import fs from 'fs'
import tripRoutes from './routes/trips.js'
import aiRoutes from './routes/ai.js'
import chatRoutes from './routes/chat.js'
import guidesRoutes from './routes/guides.js'

dotenv.config()

// Initialize Firebase Admin (Optional - only if service account exists)
let db = null
try {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccountKey.json'
  
  if (fs.existsSync(serviceAccountPath)) {
    const { initializeApp, cert } = await import('firebase-admin/app')
    const { getFirestore } = await import('firebase-admin/firestore')
    
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))
    
    initializeApp({
      credential: cert(serviceAccount)
    })
    
    db = getFirestore()
    console.log('✅ Firebase initialized successfully')
  } else {
    console.log('⚠️  Firebase service account not found. Running in demo mode.')
    console.log('   To enable full features, add serviceAccountKey.json to backend folder.')
  }
} catch (error) {
  console.log('⚠️  Firebase initialization failed. Running in demo mode.')
  console.log('   Error:', error.message)
}

export { db }

// Initialize Express
const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use('/api/trips', tripRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/ai', chatRoutes)
app.use('/api/guides', guidesRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'VIBE TRIP API is running' })
})

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Something went wrong!' })
})

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
