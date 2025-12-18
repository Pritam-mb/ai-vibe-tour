import { generateItinerary } from './services/aiService.js'

const testTrip = {
  destination: 'Sikkim, India',
  startDate: '2025-12-25',
  endDate: '2025-12-30',
  budget: 1500,
  travelStyle: 'adventure',
  specialDestinations: 'Gangtok, Nathula Pass, Tsomgo Lake'
}

console.log('🧪 Testing Gemini AI with Sikkim tour...\n')
console.log('Trip Details:', testTrip)
console.log('\n⏳ Generating itinerary...\n')

try {
  const itinerary = await generateItinerary(testTrip)
  console.log('✅ SUCCESS! Gemini AI is working!\n')
  console.log('Generated Itinerary:')
  console.log(JSON.stringify(itinerary, null, 2))
} catch (error) {
  console.error('❌ ERROR:', error.message)
  console.error('Stack:', error.stack)
}
