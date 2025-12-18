import { GoogleGenerativeAI } from "@google/generative-ai"
import dotenv from 'dotenv'

dotenv.config()

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

// Generate smart suggestions based on location, time, and trip context
export async function generateSmartSuggestions(context) {
  try {
    const { currentLocation, currentTime, itinerary, budget, spent, destination } = context
    
    const prompt = `
You are a real-time travel assistant. Based on the current situation, provide smart suggestions.

CURRENT CONTEXT:
- Location: ${currentLocation ? `Lat ${currentLocation.lat}, Lng ${currentLocation.lng}` : 'Unknown'}
- Time: ${currentTime}
- Destination: ${destination}
- Budget: $${budget}
- Already Spent: $${spent}
- Budget Remaining: $${budget - spent}

CURRENT ITINERARY:
${JSON.stringify(itinerary, null, 2)}

Analyze the situation and provide 3-5 ACTIONABLE suggestions. Consider:
1. **Time-based**: What should they do now? (breakfast/lunch/dinner time, attraction hours, etc.)
2. **Location-based**: What's nearby? (within 1-2 km)
3. **Budget-based**: Free or low-cost alternatives if budget is tight
4. **Time constraints**: Quick activities if they're behind schedule
5. **Weather/season**: Indoor options if needed
6. **Emergency**: Alternative plans if something is closed or too crowded

Return a JSON array with this structure:
[
  {
    "priority": "high|medium|low",
    "type": "time|location|budget|alternative|emergency",
    "title": "Short catchy title",
    "message": "Clear, actionable suggestion",
    "action": "What they should do",
    "estimatedTime": "How long it takes",
    "distance": "If location-based, distance in km",
    "cost": "Estimated cost in USD",
    "icon": "clock|map-pin|dollar|alert|star"
  }
]

BE SPECIFIC - use actual place names, times, and details. Keep it practical and immediately actionable.
`

    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    })

    const response = result.response
    const text = response.text()
    
    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    
    return []
  } catch (error) {
    console.error('Error generating smart suggestions:', error)
    return []
  }
}

// Find alternative activities when time is running out
export async function findAlternativeActivities(context) {
  try {
    const { currentLocation, timeLeft, budget, destination } = context
    
    const prompt = `
The traveler has LIMITED TIME (only ${timeLeft} minutes left) near ${destination}.
Location: ${currentLocation ? `Lat ${currentLocation.lat}, Lng ${currentLocation.lng}` : 'Unknown'}
Budget: $${budget}

Suggest 3-5 QUICK activities they can do nearby (within 10-15 min walk/drive):
- Must be doable in under ${timeLeft} minutes
- Within walking distance or short taxi ride
- Consider: quick photo stops, cafes, viewpoints, street markets, parks

Return JSON array:
[
  {
    "title": "Activity name",
    "description": "What it is",
    "duration": "${Math.min(timeLeft, 30)} minutes",
    "distance": "Distance from current location",
    "cost": "Estimated cost",
    "type": "quick-visit|photo-stop|cafe|shopping",
    "notes": "Quick tips"
  }
]
`

    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 1024,
      }
    })

    const response = result.response
    const text = response.text()
    
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    
    return []
  } catch (error) {
    console.error('Error finding alternatives:', error)
    return []
  }
}
