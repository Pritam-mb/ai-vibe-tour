import axios from 'axios'
import { GoogleGenerativeAI } from "@google/generative-ai"
import dotenv from 'dotenv'

dotenv.config()

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.GEMINI_API_KEY
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

// Search for places using Google Places API
export async function searchPlaces(query, location) {
  try {
    // Using Text Search (New)
    const response = await axios.post(
      'https://places.googleapis.com/v1/places:searchText',
      {
        textQuery: query,
        locationBias: location ? {
          circle: {
            center: {
              latitude: location.lat,
              longitude: location.lng
            },
            radius: 50000 // 50km radius
          }
        } : undefined
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
          'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.priceLevel,places.types,places.location'
        }
      }
    )

    return response.data.places || []
  } catch (error) {
    console.error('Error searching places:', error.response?.data || error.message)
    return []
  }
}

// Get detailed information about a place
export async function getPlaceDetails(placeId) {
  try {
    const response = await axios.get(
      `https://places.googleapis.com/v1/places/${placeId}`,
      {
        headers: {
          'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
          'X-Goog-FieldMask': 'displayName,formattedAddress,rating,userRatingCount,priceLevel,types,location,reviews,photos,openingHours'
        }
      }
    )

    return response.data
  } catch (error) {
    console.error('Error getting place details:', error.response?.data || error.message)
    return null
  }
}

// Compare multiple place requests and recommend the best using Gemini AI
export async function compareAndRecommendPlaces(requests, tripContext) {
  try {
    // Search for each request
    const placesData = await Promise.all(
      requests.map(async (request) => {
        const places = await searchPlaces(request.suggestion, tripContext.location)
        return {
          request: request.suggestion,
          requestedBy: request.requestedBy,
          places: places.slice(0, 3) // Top 3 results for each
        }
      })
    )

    // Format data for Gemini analysis
    const placesInfo = placesData.map((data, idx) => {
      return `
REQUEST ${idx + 1}: "${data.request}" (by ${data.requestedBy})
Top Places Found:
${data.places.map((place, i) => `
  ${i + 1}. ${place.displayName?.text || 'Unknown'}
     - Address: ${place.formattedAddress || 'N/A'}
     - Rating: ${place.rating || 'N/A'} ⭐ (${place.userRatingCount || 0} reviews)
     - Price Level: ${place.priceLevel || 'N/A'}
     - Type: ${place.types?.slice(0, 3).join(', ') || 'N/A'}
`).join('')}
`
    }).join('\n---\n')

    const prompt = `
You are analyzing multiple trip change requests for a trip to ${tripContext.destination}.

CURRENT TRIP CONTEXT:
- Budget: $${tripContext.budget}
- Travel Style: ${tripContext.travelStyle}
- Days: ${tripContext.days}

REQUESTS TO COMPARE:
${placesInfo}

ANALYZE AND RECOMMEND:
1. Compare the quality of each option based on:
   - Google ratings and review counts
   - Price level vs budget
   - Relevance to travel style
   - Overall value
   
2. Determine which request provides the BEST experience
3. Explain WHY it's the best choice
4. Rate each request's feasibility (1-10)

Return a JSON object with this structure:
{
  "bestRequest": "The exact request text that's best",
  "bestPlace": {
    "name": "Name of the recommended place",
    "rating": 4.5,
    "address": "Full address",
    "reasoning": "Why this is the best choice"
  },
  "comparison": [
    {
      "request": "Request text",
      "score": 8.5,
      "pros": ["Good rating", "Affordable"],
      "cons": ["Slightly far from city center"],
      "verdict": "Excellent choice for budget travelers"
    }
  ],
  "recommendation": "Overall recommendation summary"
}
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

    const response = result.response.text()
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0])
      return {
        ...analysis,
        placesData // Include raw data for reference
      }
    }

    return {
      bestRequest: requests[0].suggestion,
      recommendation: 'All options are viable. Choose based on personal preference.',
      placesData
    }
  } catch (error) {
    console.error('Error comparing places:', error)
    throw error
  }
}
