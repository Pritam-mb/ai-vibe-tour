import { GoogleGenerativeAI } from "@google/generative-ai"
import dotenv from 'dotenv'
import { db } from '../server.js'

dotenv.config()

// Initialize the Gemini client with API key
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

// Fetch real registered guides from database
async function fetchRegisteredGuides(destination) {
  try {
    if (!db) return []
    
    const guidesSnapshot = await db.collection('guides')
      .where('destination', '==', destination)
      .where('availability', '==', true)
      .limit(10)
      .get()
    
    const guides = guidesSnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        name: data.name,
        specialty: data.specialty,
        rating: data.rating || 0,
        pricePerDay: data.pricePerDay,
        languages: data.languages,
        contact: data.email
      }
    })
    
    return guides
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
      },
      {
        "name": "Maria Santos",
        "specialty": "Food & Culture",
        "rating": 4.9,
        "pricePerDay": 180,
        "languages": ["English", "Portuguese"],
        "contact": "maria@guides.com"
      }
    ],
    "activities": [
      {
        "time": "08:00",
        "title": "Breakfast at Harbor View Café",
        "description": "Start your day with traditional breakfast specialties and ocean views",
        "location": "Harbor View Café, Waterfront District",
        "duration": "1 hour",
        "cost": 15,
        "notes": "Try the local specialty dish",
        "type": "breakfast"
      },
      {
        "time": "10:00",
        "title": "Explore Old Town Square",
        "description": "Walk through historic cobblestone streets and colorful colonial buildings",
        "location": "Old Town Square, Historic Center",
        "duration": "2 hours",
        "cost": 0,
        "notes": "Best photo spots at the fountain"
      },
      {
        "time": "13:00",
        "title": "Lunch at Mama Rosa's Trattoria",
        "description": "Authentic Italian cuisine in a cozy family-run restaurant",
        "location": "Mama Rosa's, Little Italy",
        "duration": "1.5 hours",
        "cost": 30,
        "notes": "Reservations recommended"
      }
    ]
  },
  {
    "day": 2,
    "date": "2026-01-16",
    "activities": [
      {
        "time": "07:30",
        "title": "Breakfast at Mountain Peak Bakery",
        "description": "Fresh pastries and coffee with mountain views",
        "location": "Mountain Peak Bakery, Highland District",
        "duration": "45 minutes",
        "cost": 12,
        "notes": "Try their famous croissants"
      },
      {
        "time": "09:00",
        "title": "Visit National Art Museum",
        "description": "World-class collection of contemporary and classical art",
        "location": "National Art Museum, Arts Quarter",
        "duration": "3 hours",
        "cost": 20,
        "notes": "Free audio guide included"
      },
      {
        "time": "13:00",
        "title": "Lunch at Spice Garden Restaurant",
        "description": "Modern fusion cuisine with local ingredients",
        "location": "Spice Garden, Downtown",
        "duration": "1 hour",
        "cost": 35,
        "notes": "Chef's tasting menu available"
      }
    ]
  }
]

**IMPORTANT: The example above shows TWO DIFFERENT DAYS with COMPLETELY DIFFERENT activities. Your response MUST follow this pattern - NEVER repeat activities across days!**

CRITICAL REQUIREMENTS:
- Create 6-8 DIFFERENT activities per day (from morning to evening)
- **EACH DAY MUST BE COMPLETELY UNIQUE** - DO NOT repeat the same activities on different days
- Start days at 7-8 AM, end at 8-10 PM
- Include ALL meals: breakfast, lunch, dinner (with DIFFERENT restaurant names each day)
- Show EXACT times in HH:MM format (e.g., "09:00", "14:30")
- Include duration for each activity (e.g., "1 hour", "2.5 hours")
- Add travel buffer time between locations (15-30 min)
- Provide specific location names, not generic descriptions
- Include helpful notes/tips for each activity
- Add "type" field for activities: breakfast, lunch, dinner, activity, sightseeing, transport, shopping
- Distribute budget realistically: meals $10-50, activities $10-100, transport $5-30, hotels $50-300/night
- Match travel style: ${trip.travelStyle === 'budget' ? 'affordable local spots' : trip.travelStyle === 'luxury' ? 'premium experiences' : 'balanced options'}
- Include mix of: sightseeing, cultural activities, food experiences, shopping, relaxation
- Time activities logically (heavy activities in morning, relaxed evening)

**HOTEL REQUIREMENTS:**
- Provide 1 hotel recommendation per day with REAL hotel names from ${trip.destination}
- Include realistic pricing based on travel style
- Add 3-5 amenities per hotel
- Vary hotels - don't repeat the same hotel

**GUIDE REQUIREMENTS:**
${registeredGuides.length > 0 
  ? `- USE THE REGISTERED LOCAL GUIDES PROVIDED ABOVE - these are REAL verified guides
- Select 2-3 guides per day from the registered guides list
- Match guide specialties with day activities (e.g., Food Tours guide for food-focused days)`
  : `- Provide 2-3 local guide recommendations per day
- Use realistic local names for ${trip.destination}
- Vary specialties: Historical Tours, Food Tours, Adventure Tours, Photography Tours, Cultural Tours
- Pricing: $100-250 per day based on expertise
- Include languages they speak and contact info`}

**DAY PROGRESSION - MAKE EACH DAY UNIQUE:**
- Day 1: Arrival + iconic landmarks (e.g., Eiffel Tower) + welcome dinner (French bistro)
- Day 2: Cultural sites (different area) + local markets + traditional cuisine (NEW restaurant)
- Day 3: Adventure activities + nature/parks + casual dining (DIFFERENT place)
- Day 4: Museums (DIFFERENT from Day 2) + shopping districts + fine dining (UNIQUE venue)
- Day 5+: Hidden gems + day trips + unique experiences (all NEW locations)

**CRITICAL: Each breakfast/lunch/dinner MUST be at a DIFFERENT named restaurant!**
**CRITICAL: Each activity MUST be at a DIFFERENT location than previous days!**
**CRITICAL: Vary the cuisine types across meals (Italian Day 1, Asian Day 2, Local Day 3, etc.)**
**CRITICAL: Mix activity types - don't put 3 museums in a row!**

REMEMBER: This request ID ${randomSeed} should produce a UNIQUE itinerary. Check that Day 1, Day 2, Day 3, etc. all have COMPLETELY DIFFERENT activities and restaurants!

Return ONLY the JSON array, no markdown, no explanations.
`
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    })
    let text = response.text
    
    // Clean up the response - remove markdown code blocks if present
    if (text) {
      text = text.replace(/```json/g, '').replace(/```/g, '').trim()
      
      // Parse JSON from response
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const itinerary = JSON.parse(jsonMatch[0])
        console.log('✅ Successfully generated itinerary with', itinerary.length, 'days')
        return itinerary
      }
    }
    
    console.warn('⚠️ Could not parse Gemini response, using fallback')
    // Fallback itinerary if parsing fails
    return generateFallbackItinerary(trip)
  } catch (error) {
    console.error('⚠️ Gemini API Error:', error.message)
    console.log('💡 Using fallback mock data - Please check your Gemini API key')
    return generateFallbackItinerary(trip)
  }
}

// Analyze feasibility of a request
export async function analyzeRequest(trip, request) {
  const prompt = `
You are a travel planning AI analyzing a change request for a trip itinerary.

Current Trip:

Current Day ${request.day} Itinerary:
${JSON.stringify(trip.itinerary.find(d => d.day === request.day), null, 2)}

Change Request:

Analyze this request considering:
1. Time availability in the day
2. Travel distance from existing activities
3. Budget impact
4. Fatigue risk (is the day too packed?)
5. Weather/seasonal considerations
6. Conflicts with existing activities

Return a JSON object with this EXACT structure:
{
  "score": 7,
  "reason": "Brief explanation of the score",
  "suggestedChanges": ["Change 1", "Change 2"]
}

Score: 1-10 (1=bad idea, 10=perfect fit)
Return ONLY the JSON object, no other text.
`
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    })
    const text = response.text
    
    if (text) {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    }
    
    return {
      score: 5,
      reason: "Unable to fully analyze. Requires manual review.",
      suggestedChanges: []
    }
  } catch (error) {
    console.error('Error analyzing request:', error)
    return {
      score: 5,
      reason: "Analysis unavailable. Please review manually.",
      suggestedChanges: []
    }
  }
}

// Replan itinerary with accepted request
export async function replanItinerary(trip, request) {
  
  const targetDay = trip.itinerary.find(d => d.day === request.day)
  
  const prompt = `
You are a travel planning AI. A new activity has been accepted and needs to be integrated.

Current Day ${request.day} Schedule:
${JSON.stringify(targetDay, null, 2)}

New Activity to Add:

Task: Replan Day ${request.day} to include this new activity.

Rules:

Return the updated day as a JSON object with the same structure as the input.
Return ONLY the JSON object, no other text.
`
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    })
    const text = response.text
    
    if (text) {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const updatedDay = JSON.parse(jsonMatch[0])
        return trip.itinerary.map(day => 
          day.day === request.day ? updatedDay : day
        )
      }
    }
    
    // Fallback: just add the activity
    return trip.itinerary.map(day => {
      if (day.day === request.day) {
        return {
          ...day,
          activities: [
            ...day.activities,
            {
              time: '14:00',
              title: request.title,
              description: request.description,
              location: 'To be determined',
              duration: '2 hours',
              cost: 0
            }
          ]
        }
      }
      return day
    })
  } catch (error) {
    console.error('Error replanning itinerary:', error)
    return trip.itinerary
  }
}

// General text generation
export async function generateText(prompt, context = '') {
  const fullPrompt = context ? `${context}\n\n${prompt}` : prompt
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt
    })
    return response.text
  } catch (error) {
    console.error('Error generating text:', error)
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
        {
          time: '09:00',
          title: 'Morning Activity',
          description: `Explore ${trip.destination}`,
          location: trip.destination,
          duration: '3 hours',
          cost: 30
        },
        {
          time: '12:30',
          title: 'Lunch',
          description: 'Try local cuisine',
          location: 'City Center',
          duration: '1.5 hours',
          cost: 20
        },
        {
          time: '15:00',
          title: 'Afternoon Exploration',
          description: 'Visit main attractions',
          location: trip.destination,
          duration: '3 hours',
          cost: 40
        },
        {
          time: '19:00',
          title: 'Dinner',
          description: 'Evening meal',
          location: 'Downtown',
          duration: '1.5 hours',
          cost: 25
        }
      ]
    })
  }
  
  return itinerary
}
