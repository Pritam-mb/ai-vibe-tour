import express from 'express'
import Groq from 'groq-sdk'
import dotenv from 'dotenv'

dotenv.config()

const router = express.Router()
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// AI Chat endpoint for trip suggestions
router.post('/chat', async (req, res) => {
  try {
    const { message, context } = req.body

    const prompt = `
You are an AI travel assistant helping a user plan their trip. 

TRIP CONTEXT:
${context}

USER MESSAGE:
"${message}"

TASK:
1. Parse the user's request and understand what they want to add/change
2. Extract key details: activity name, preferred time/day, type (meal/activity/transport)
3. Provide a friendly, conversational response
4. Suggest which day would be best for this activity based on the existing itinerary

Respond in JSON format:
{
  "response": "Friendly acknowledgment of their request",
  "parsedRequest": {
    "title": "Short activity title (max 5 words)",
    "description": "Full description from user message",
    "suggestedDay": 1,
    "type": "activity|meal|transport|other",
    "estimatedCost": 50,
    "estimatedDuration": "2 hours"
  },
  "suggestedDays": [
    {"day": 1, "reason": "Why this day works well"},
    {"day": 2, "reason": "Alternative option"}
  ]
}

Be conversational, enthusiastic, and helpful. If the request is unclear, ask for clarification.
`

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
    })
    
    const text = chatCompletion.choices[0]?.message?.content || ''

    // Try to parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0])
      res.json(data)
    } else {
      // Fallback if AI doesn't return JSON
      res.json({
        response: text,
        parsedRequest: {
          title: message.substring(0, 50),
          description: message,
          suggestedDay: 1,
          type: 'activity',
          estimatedCost: 30,
          estimatedDuration: '1-2 hours'
        }
      })
    }
  } catch (error) {
    console.error('Chat AI error:', error)
    res.status(500).json({ 
      error: 'Failed to process request',
      response: "I'm having trouble understanding that. Could you rephrase your suggestion?"
    })
  }
})

export default router
