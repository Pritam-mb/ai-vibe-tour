import express from 'express'
import mongoose from 'mongoose'
import Trip from '../models/Trip.js'
import { generateItinerary, analyzeRequest, replanItinerary } from '../services/aiService.js'
import { compareAndRecommendPlaces } from '../services/placesService.js'
import { journeyService } from '../services/journeyService.js'

const router = express.Router()

// Geocode a place name to {lat, lng} using Photon API (OpenStreetMap based, no IP ban)
async function geocodeLocation(query) {
  try {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1`
    const res = await fetch(url)
    const contentType = res.headers.get('content-type')
    if (!res.ok || !contentType || !contentType.includes('application/json')) {
      console.warn(`Geocoding failed for: ${query}, status: ${res.status}, type: ${contentType}`)
      return null
    }
    const data = await res.json()
    if (data && data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].geometry.coordinates
      return { lat, lng }
    }
  } catch (e) {
    console.warn(`Geocoding failed for: ${query}`, e.message)
  }
  return null
}

const delay = ms => new Promise(res => setTimeout(res, ms))

// Geocode all activity locations in an itinerary (adds .lat / .lng to each activity)
async function geocodeItinerary(itinerary) {
  const enriched = []
  for (const day of itinerary) {
    const enrichedActivities = []
    for (const activity of (day.activities || [])) {
      if (activity.location && !activity.lat) {
        await delay(1500) // Strict 1.5s delay for Nominatim to clear 429 bans
        const coords = await geocodeLocation(activity.location)
        if (coords) {
          enrichedActivities.push({ ...activity, lat: coords.lat, lng: coords.lng })
        } else {
          enrichedActivities.push(activity)
        }
      } else {
        enrichedActivities.push(activity)
      }
    }
    enriched.push({ ...day, activities: enrichedActivities })
  }
  return enriched
}

// Create a new trip
router.post('/', async (req, res) => {
  try {
    const trip = new Trip({
      ...req.body,
      pendingRequests: [],
      journeyPaths: []
    })
    await trip.save()
    res.status(201).json({ success: true, tripId: trip._id })
  } catch (error) {
    console.error('Error creating trip:', error)
    res.status(500).json({ error: 'Failed to create trip', details: error.message })
  }
})

// Get user trips
router.get('/user/:userId', async (req, res) => {
  try {
    const trips = await Trip.find({ memberIds: req.params.userId })
    res.json(trips)
  } catch (error) {
    console.error('Error fetching user trips:', error)
    res.status(500).json({ error: 'Failed to fetch trips', details: error.message })
  }
})

// Get trip by ID
router.get('/:tripId', async (req, res) => {
  try {
    const { tripId } = req.params
    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      return res.status(404).json({ error: 'Trip not found' })
    }
    const trip = await Trip.findById(tripId)
    if (!trip) return res.status(404).json({ error: 'Trip not found' })
    res.json(trip)
  } catch (error) {
    console.error('Error fetching trip:', error)
    res.status(500).json({ error: 'Failed to fetch trip' })
  }
})

// Add a request
router.post('/:tripId/requests', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.tripId)
    if (!trip) return res.status(404).json({ error: 'Trip not found' })
    trip.pendingRequests.push(req.body)
    trip.markModified('pendingRequests')
    await trip.save()
    res.json({ success: true })
  } catch (error) {
    console.error('Error adding request:', error)
    res.status(500).json({ error: 'Failed to add request' })
  }
})

// Delete a request
router.delete('/:tripId/requests/:requestId', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.tripId)
    if (!trip) return res.status(404).json({ error: 'Trip not found' })
    trip.pendingRequests = trip.pendingRequests.filter(r => r.id !== req.params.requestId)
    trip.markModified('pendingRequests')
    await trip.save()
    res.json({ success: true })
  } catch (error) {
    console.error('Error rejecting request:', error)
    res.status(500).json({ error: 'Failed to reject request' })
  }
})

// Generate initial itinerary
router.post('/:tripId/generate-itinerary', async (req, res) => {
  try {
    const { tripId } = req.params
    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      return res.status(404).json({ error: 'Trip not found' })
    }
    const trip = await Trip.findById(tripId)
    if (!trip) return res.status(404).json({ error: 'Trip not found' })
    
    // 1. Generate AI itinerary
    const rawItinerary = await generateItinerary(trip)

    // 2. Geocode each activity location (runs in background after response if slow)
    console.log('🗺️  Geocoding activity locations...')
    const itinerary = await geocodeItinerary(rawItinerary)

    // 3. Geocode destination + departure city
    const updates = { itinerary }
    if (trip.destination && !trip.lat) {
      const dest = await geocodeLocation(trip.destination)
      if (dest) { updates.lat = dest.lat; updates.lng = dest.lng }
    }
    if (trip.departureCity && !trip.departureLat) {
      const dep = await geocodeLocation(trip.departureCity)
      if (dep) { updates.departureLat = dep.lat; updates.departureLng = dep.lng }
    }

    await Trip.findByIdAndUpdate(tripId, { $set: updates })
    console.log('✅ Itinerary + geocoding complete')
    
    res.json({ success: true, itinerary })
  } catch (error) {
    console.error('Error generating itinerary:', error)
    res.status(500).json({ error: 'Failed to generate itinerary', details: error.message, stack: error.stack })
  }
})

// Analyze a pending request
router.post('/:tripId/analyze-request', async (req, res) => {
  try {
    const { tripId } = req.params
    const { requestId } = req.body
    
    const trip = await Trip.findById(tripId)
    if (!trip) return res.status(404).json({ error: 'Trip not found' })
    
    const request = trip.pendingRequests.find(r => r.id === requestId)
    if (!request) return res.status(404).json({ error: 'Request not found' })
    
    const analysis = await analyzeRequest(trip, request)
    
    trip.pendingRequests = trip.pendingRequests.map(r => 
      r.id === requestId ? { ...r, aiAnalysis: analysis, status: 'analyzed' } : r
    )
    
    trip.markModified('pendingRequests')
    await trip.save()
    
    res.json({ success: true, analysis })
  } catch (error) {
    console.error('Error analyzing request:', error)
    res.status(500).json({ error: 'Failed to analyze request' })
  }
})

// Compare multiple pending requests using Google Places API
router.post('/:tripId/compare-requests', async (req, res) => {
  try {
    const { tripId } = req.params
    const { requestIds } = req.body 
    
    const trip = await Trip.findById(tripId)
    if (!trip) return res.status(404).json({ error: 'Trip not found' })
    
    const requests = trip.pendingRequests.filter(r => requestIds.includes(r.id))
    if (requests.length < 2) return res.status(400).json({ error: 'At least 2 requests are needed for comparison' })
    
    const comparison = await compareAndRecommendPlaces(requests, {
      destination: trip.destination,
      budget: trip.budget,
      travelStyle: trip.travelStyle,
      days: trip.itinerary?.length || 0,
      location: { lat: trip.latitude || 0, lng: trip.longitude || 0 }
    })
    
    trip.pendingRequests = trip.pendingRequests.map(r => {
      if (requestIds.includes(r.id)) {
        const comparisonData = comparison.comparison?.find(c => c.request === r.suggestion)
        return {
          ...r,
          comparisonAnalysis: comparisonData,
          isBestOption: r.suggestion === comparison.bestRequest,
          status: 'compared'
        }
      }
      return r
    })
    
    trip.markModified('pendingRequests')
    await trip.save()
    
    res.json({ success: true, comparison })
  } catch (error) {
    console.error('Error comparing requests:', error)
    res.status(500).json({ error: 'Failed to compare requests' })
  }
})

// Accept request and update itinerary
router.post('/:tripId/accept-request', async (req, res) => {
  try {
    const { tripId } = req.params
    const { requestId } = req.body
    
    const trip = await Trip.findById(tripId)
    if (!trip) return res.status(404).json({ error: 'Trip not found' })
    
    const request = trip.pendingRequests.find(r => r.id === requestId)
    if (!request) return res.status(404).json({ error: 'Request not found' })
    
    const newItinerary = await replanItinerary(trip, request)
    
    trip.pendingRequests = trip.pendingRequests.filter(r => r.id !== requestId)
    trip.itinerary = newItinerary
    
    trip.markModified('pendingRequests')
    trip.markModified('itinerary')
    await trip.save()
    
    res.json({ success: true, itinerary: newItinerary })
  } catch (error) {
    console.error('Error accepting request:', error)
    res.status(500).json({ error: 'Failed to accept request' })
  }
})

// Get live suggestions
router.get('/:tripId/live-suggestions', async (req, res) => {
  try {
    const { tripId } = req.params
    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      return res.status(404).json({ error: 'Trip not found' })
    }
    const trip = await Trip.findById(tripId)
    if (!trip) return res.status(404).json({ error: 'Trip not found' })
    
    const suggestions = []
    res.json({ suggestions })
  } catch (error) {
    console.error('Error getting suggestions:', error)
    res.status(500).json({ error: 'Failed to get suggestions' })
  }
})

// Save journey path
router.post('/:tripId/journey/save-path', async (req, res) => {
  try {
    const { tripId } = req.params
    const { userId, path } = req.body

    if (!path || !Array.isArray(path)) return res.status(400).json({ error: 'Valid path array is required' })

    const result = await journeyService.saveJourneyPath(tripId, userId, path)
    res.json(result)
  } catch (error) {
    console.error('Error saving journey path:', error)
    res.status(500).json({ error: 'Failed to save journey path' })
  }
})

// Get journey paths
router.get('/:tripId/journey/paths', async (req, res) => {
  try {
    const { tripId } = req.params
    const paths = await journeyService.getJourneyPaths(tripId)
    res.json({ paths })
  } catch (error) {
    console.error('Error getting journey paths:', error)
    res.status(500).json({ error: 'Failed to get journey paths' })
  }
})

// Get contextual recommendations based on location
router.post('/:tripId/journey/recommendations', async (req, res) => {
  try {
    const { tripId } = req.params
    const { location } = req.body

    if (!location || !location.lat || !location.lng) return res.status(400).json({ error: 'Valid location is required' })

    const trip = await Trip.findById(tripId)
    if (!trip) return res.status(404).json({ error: 'Trip not found' })

    const recommendations = await journeyService.getContextualRecommendations(location, trip)
    res.json(recommendations)
  } catch (error) {
    console.error('Error getting recommendations:', error)
    res.status(500).json({ error: 'Failed to get recommendations' })
  }
})

export default router
