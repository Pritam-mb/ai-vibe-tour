import express from 'express'
import { db } from '../server.js'
import { generateItinerary, analyzeRequest, replanItinerary } from '../services/aiService.js'
import { compareAndRecommendPlaces } from '../services/placesService.js'
import { journeyService } from '../services/journeyService.js'

const router = express.Router()

// Generate initial itinerary
router.post('/:tripId/generate-itinerary', async (req, res) => {
  try {
    const { tripId } = req.params
    
    if (!db) {
      return res.status(503).json({ 
        error: 'Firebase not configured. Please add serviceAccountKey.json to backend folder.' 
      })
    }
    
    // Get trip data
    const tripRef = db.collection('trips').doc(tripId)
    const tripDoc = await tripRef.get()
    
    if (!tripDoc.exists) {
      return res.status(404).json({ error: 'Trip not found' })
    }
    
    const trip = tripDoc.data()
    
    // Generate itinerary using AI
    const itinerary = await generateItinerary(trip)
    
    // Update trip with itinerary
    await tripRef.update({ itinerary })
    
    res.json({ success: true, itinerary })
  } catch (error) {
    console.error('Error generating itinerary:', error)
    res.status(500).json({ error: 'Failed to generate itinerary' })
  }
})

// Analyze a pending request
router.post('/:tripId/analyze-request', async (req, res) => {
  try {
    const { tripId } = req.params
    const { requestId } = req.body
    
    if (!db) {
      return res.status(503).json({ 
        error: 'Firebase not configured. Please add serviceAccountKey.json to backend folder.' 
      })
    }
    
    // Get trip data
    const tripRef = db.collection('trips').doc(tripId)
    const tripDoc = await tripRef.get()
    const trip = tripDoc.data()
    
    // Find the request
    const request = trip.pendingRequests.find(r => r.id === requestId)
    if (!request) {
      return res.status(404).json({ error: 'Request not found' })
    }
    
    // Analyze with AI
    const analysis = await analyzeRequest(trip, request)
    
    // Update request with analysis
    const updatedRequests = trip.pendingRequests.map(r => 
      r.id === requestId 
        ? { ...r, aiAnalysis: analysis, status: 'analyzed' }
        : r
    )
    
    await tripRef.update({ pendingRequests: updatedRequests })
    
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
    const { requestIds } = req.body // Array of request IDs to compare
    
    if (!db) {
      return res.status(503).json({ 
        error: 'Firebase not configured. Please add serviceAccountKey.json to backend folder.' 
      })
    }
    
    // Get trip data
    const tripRef = db.collection('trips').doc(tripId)
    const tripDoc = await tripRef.get()
    const trip = tripDoc.data()
    
    // Get all requests to compare
    const requests = trip.pendingRequests.filter(r => requestIds.includes(r.id))
    
    if (requests.length < 2) {
      return res.status(400).json({ error: 'At least 2 requests are needed for comparison' })
    }
    
    // Compare using Google Places API + Gemini
    const comparison = await compareAndRecommendPlaces(requests, {
      destination: trip.destination,
      budget: trip.budget,
      travelStyle: trip.travelStyle,
      days: trip.itinerary?.length || 0,
      location: { lat: trip.latitude || 0, lng: trip.longitude || 0 }
    })
    
    // Mark the best request and update others
    const updatedRequests = trip.pendingRequests.map(r => {
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
    
    await tripRef.update({ pendingRequests: updatedRequests })
    
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
    
    if (!db) {
      return res.status(503).json({ 
        error: 'Firebase not configured. Please add serviceAccountKey.json to backend folder.' 
      })
    }
    
    // Get trip data
    const tripRef = db.collection('trips').doc(tripId)
    const tripDoc = await tripRef.get()
    const trip = tripDoc.data()
    
    // Find the request
    const request = trip.pendingRequests.find(r => r.id === requestId)
    if (!request) {
      return res.status(404).json({ error: 'Request not found' })
    }
    
    // Replan itinerary with AI
    const newItinerary = await replanItinerary(trip, request)
    
    // Remove request and update itinerary
    const updatedRequests = trip.pendingRequests.filter(r => r.id !== requestId)
    
    await tripRef.update({
      itinerary: newItinerary,
      pendingRequests: updatedRequests
    })
    
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
    const { currentTime, currentLocation } = req.query
    
    if (!db) {
      return res.status(503).json({ 
        error: 'Firebase not configured. Please add serviceAccountKey.json to backend folder.' 
      })
    }
    
    // Get trip data
    const tripRef = db.collection('trips').doc(tripId)
    const tripDoc = await tripRef.get()
    const trip = tripDoc.data()
    
    // Generate suggestions based on context
    // This would use AI to provide real-time recommendations
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

    if (!path || !Array.isArray(path)) {
      return res.status(400).json({ error: 'Valid path array is required' })
    }

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

    if (!location || !location.lat || !location.lng) {
      return res.status(400).json({ error: 'Valid location is required' })
    }

    const tripRef = db.collection('trips').doc(tripId)
    const tripDoc = await tripRef.get()
    
    if (!tripDoc.exists) {
      return res.status(404).json({ error: 'Trip not found' })
    }

    const tripData = tripDoc.data()
    const recommendations = await journeyService.getContextualRecommendations(location, tripData)
    
    res.json(recommendations)
  } catch (error) {
    console.error('Error getting recommendations:', error)
    res.status(500).json({ error: 'Failed to get recommendations' })
  }
})

export default router
