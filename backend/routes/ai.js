import express from 'express'
import { generateText } from '../services/aiService.js'
import { generateSmartSuggestions, findAlternativeActivities } from '../services/suggestionsService.js'

const router = express.Router()

// General AI chat endpoint
router.post('/chat', async (req, res) => {
  try {
    const { message, context } = req.body
    
    const response = await generateText(message, context)
    
    res.json({ response })
  } catch (error) {
    console.error('Error in AI chat:', error)
    res.status(500).json({ error: 'Failed to process AI request' })
  }
})

// Smart suggestions based on location and time
router.post('/suggestions', async (req, res) => {
  try {
    const context = req.body
    const suggestions = await generateSmartSuggestions(context)
    res.json({ suggestions })
  } catch (error) {
    console.error('Error generating suggestions:', error)
    res.status(500).json({ error: 'Failed to generate suggestions' })
  }
})

// Alternative activities when time is limited
router.post('/alternatives', async (req, res) => {
  try {
    const context = req.body
    const alternatives = await findAlternativeActivities(context)
    res.json({ alternatives })
  } catch (error) {
    console.error('Error finding alternatives:', error)
    res.status(500).json({ error: 'Failed to find alternatives' })
  }
})

export default router
