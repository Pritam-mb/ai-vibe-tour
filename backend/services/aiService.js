import Groq from 'groq-sdk'
import dotenv from 'dotenv'
import Guide from '../models/Guide.js'

dotenv.config()

// Initialize the Groq client with API key
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// Fetch real registered guides from database
async function fetchRegisteredGuides(destination) {
  try {
    const guides = await Guide.find({ destination, availability: true }).limit(10)
    
    return guides.map(g => ({
      name: g.name,
      specialty: g.specialty,
      rating: g.rating || 0,
      pricePerDay: g.pricePerDay,
      languages: g.languages,
      contact: g.email
    }))
  } catch (error) {
    console.error('Error fetching guides:', error)
    return []
  }
}

// Generate initial itinerary
export async function generateItinerary(trip) {
  const randomSeed = Math.floor(Math.random() * 1000000)
  
  // Fetch real guides from database
  const registeredGuides = await fetchRegisteredGuides(trip.destination)
  
  const guidesInfo = registeredGuides.length > 0 
    ? `\n\nREGISTERED LOCAL GUIDES (USE THESE IN YOUR RECOMMENDATIONS):\n${registeredGuides.map(g => 
        `- ${g.name} (${g.specialty}, Rating: ${g.rating}, $${g.pricePerDay}/day, Languages: ${g.languages.join(', ')}, Contact: ${g.contact})`
      ).join('\n')}`
    : ''
  
  const prompt = `
You are a creative travel planner (Request ID: ${randomSeed}). Create a COMPLETELY UNIQUE, DETAILED HOUR-BY-HOUR itinerary for this trip:

Destination: ${trip.destination}
Start Date: ${trip.startDate}
End Date: ${trip.endDate}
Budget: $${trip.budget}
Travel Style: ${trip.travelStyle}
Special Destinations: ${trip.specialDestinations || 'None specified'}${guidesInfo}

Create a JSON array with this EXACT structure (EXAMPLE - YOUR RESPONSE MUST HAVE DIFFERENT ACTIVITIES FOR EACH DAY):
[
  {
    "day": 1,
    "date": "2026-01-15",
    "hotel": {
      "name": "Sunset Plaza Hotel",
      "address": "123 Ocean Drive, Downtown",
      "rating": 4.5,
      "pricePerNight": 120,
      "amenities": ["WiFi", "Pool", "Breakfast"],
      "checkIn": "15:00",
      "checkOut": "11:00"
    },
    "recommendedGuides": [
      {
        "name": "Carlos Martinez",
        "specialty": "Historical Tours",
        "rating": 4.8,
        "pricePerDay": 150,
        "languages": ["English", "Spanish"],
        "contact": "carlos@guides.com"
      }
    ],
    "activities": [
      {
        "time": "08:00",
        "title": "Breakfast at Harbor View Café",
        "description": "Start your day with traditional breakfast specialties",
        "location": "Harbor View Café, Waterfront District",
        "duration": "1 hour",
        "cost": 15,
        "notes": "Try the local specialty dish",
        "type": "breakfast"
      },
      {
        "time": "10:00",
        "title": "Explore Old Town Square",
        "description": "Walk through historic cobblestone streets",
        "location": "Old Town Square, Historic Center",
        "duration": "2 hours",
        "cost": 0,
        "notes": "Best photo spots at the fountain"
      }
    ]
  }
]

**IMPORTANT: The example above shows ONE DAY. Your response MUST include activities for EVERY DAY of the trip and NEVER repeat activities across days!**

CRITICAL REQUIREMENTS:
- Create 4-5 DIFFERENT activities per day (from morning to evening)
- **EACH DAY MUST BE COMPLETELY UNIQUE** - DO NOT repeat the same activities on different days
- Include ALL meals: breakfast, lunch, dinner (with DIFFERENT restaurant names each day)
- Show EXACT times in HH:MM format (e.g., "09:00", "14:30")
- Include duration for each activity (e.g., "1 hour", "2.5 hours")
- Provide specific location names, not generic descriptions
- Include helpful notes/tips for each activity
- Add "type" field for activities: breakfast, lunch, dinner, activity, sightseeing, transport, shopping
- Distribute budget realistically: meals $10-50, activities $10-100, transport $5-30, hotels $50-300/night
- Match travel style: ${trip.travelStyle === 'budget' ? 'affordable local spots' : trip.travelStyle === 'luxury' ? 'premium experiences' : 'balanced options'}
- KEEP DESCRIPTIONS EXTREMELY CONCISE so the JSON does not truncate!

**HOTEL REQUIREMENTS:**
- Provide 1 hotel recommendation per day with REAL hotel names from ${trip.destination}
- Include realistic pricing based on travel style

**GUIDE REQUIREMENTS:**
${registeredGuides.length > 0 
  ? `- USE THE REGISTERED LOCAL GUIDES PROVIDED ABOVE - these are REAL verified guides
- Select 1-2 guides per day from the registered guides list`
  : `- Provide 1-2 local guide recommendations per day
- Use realistic local names for ${trip.destination}
- Vary specialties: Historical Tours, Food Tours, Adventure Tours, Photography Tours, Cultural Tours
- Pricing: $100-250 per day based on expertise
- Include languages they speak and contact info`}

Return ONLY the valid JSON array, no markdown, no explanations.
`
  
  try {
    // Switch to llama-3.1-8b-instant to avoid rate limits
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 5000,
      response_format: { type: 'json_object' } // Help enforce json, though groq json object needs an object wrapper. 
      // Actually groq requires the prompt to specify "JSON object". 
      // We asked for an array. Let's wrap our expected output in an object if we use json_object.
    });
    
    // Fallback: If we use json_object, groq requires output to be an object. We'll disable response_format and rely on prompt.
  } catch (error) {} // Just to catch, I will actually use normal mode.
  
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 8000
    });
    
    let text = chatCompletion.choices[0]?.message?.content || '';
    
    if (text) {
      text = text.replace(/```json/g, '').replace(/```/g, '').trim()
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const itinerary = JSON.parse(jsonMatch[0])
        console.log('✅ Successfully generated itinerary with', itinerary.length, 'days')
        return itinerary
      } else {
        const itinerary = JSON.parse(text)
        console.log('✅ Successfully generated itinerary with', itinerary.length, 'days')
        return itinerary
      }
    }
    
    console.warn('⚠️ Could not parse Groq response, using fallback')
    return generateFallbackItinerary(trip)
  } catch (error) {
    console.error('⚠️ Groq API Error:', error.message)
    console.log('💡 Using fallback mock data - Please check your API key')
    return generateFallbackItinerary(trip)
  }
}

// Analyze feasibility of a request
export async function analyzeRequest(trip, request) {
  const prompt = `
You are a travel planning AI analyzing a change request for a trip itinerary.

Current Day ${request.day} Itinerary:
${JSON.stringify(trip.itinerary.find(d => d.day === request.day), null, 2)}

Return a JSON object with this EXACT structure:
{
  "score": 7,
  "reason": "Brief explanation of the score",
  "suggestedChanges": ["Change 1", "Change 2"]
}

Score: 1-10 (1=bad idea, 10=perfect fit)
Return ONLY the JSON object.
`
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.2
    });
    
    const text = chatCompletion.choices[0]?.message?.content || '';
    if (text) {
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim()
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
      return JSON.parse(jsonMatch ? jsonMatch[0] : cleaned)
    }
    return { score: 5, reason: "Unable to fully analyze.", suggestedChanges: [] }
  } catch (error) {
    return { score: 5, reason: "Analysis unavailable.", suggestedChanges: [] }
  }
}

// Replan itinerary with accepted request
export async function replanItinerary(trip, request) {
  const targetDay = trip.itinerary.find(d => d.day === request.day)
  
  const prompt = `
You are a travel planning AI. A new activity has been accepted and needs to be integrated.

Current Day ${request.day} Schedule:
${JSON.stringify(targetDay, null, 2)}

Return the updated day as a JSON object with the same structure as the input.
Return ONLY the JSON object.
`
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.2
    });
    
    const text = chatCompletion.choices[0]?.message?.content || '';
    if (text) {
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim()
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
      const updatedDay = JSON.parse(jsonMatch ? jsonMatch[0] : cleaned)
      return trip.itinerary.map(day => day.day === request.day ? updatedDay : day)
    }
    throw new Error('Empty response')
  } catch (error) {
    return trip.itinerary
  }
}

// General text generation
export async function generateText(prompt, context = '') {
  const fullPrompt = context ? `${context}\n\n${prompt}` : prompt
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: fullPrompt }],
      model: 'llama-3.1-8b-instant',
    });
    return chatCompletion.choices[0]?.message?.content || '';
  } catch (error) {
    return 'Sorry, I encountered an error. Please try again.'
  }
}

// Fallback itinerary generator
function generateFallbackItinerary(trip) {
  const startDate = new Date(trip.startDate)
  const endDate = new Date(trip.endDate)
  const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1
  
  const itinerary = []
  for (let i = 0; i < days; i++) {
    const currentDate = new Date(startDate)
    currentDate.setDate(startDate.getDate() + i)
    itinerary.push({
      day: i + 1,
      date: currentDate.toISOString().split('T')[0],
      activities: [
        { time: '09:00', title: 'Morning Exploration', location: trip.destination, duration: '3 hours', cost: 30, type: 'sightseeing' },
        { time: '12:30', title: 'Lunch', location: 'City Center', duration: '1 hour', cost: 20, type: 'lunch' },
        { time: '15:00', title: 'Afternoon Activity', location: trip.destination, duration: '2 hours', cost: 40, type: 'activity' }
      ]
    })
  }
  return itinerary
}
